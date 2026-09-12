from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, inspect, text as sql_text
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal, engine
from app.models import Ticket, Note
from app.schemas import (
    TicketCreate,
    TicketResponse,
    TicketListItem,
    TicketDetail,
    TicketUpdate,
    DEFAULT_PRIORITY,
    get_sla_duration,
)

router = APIRouter()

VALID_STATUSES = {"Open", "In Progress", "Closed"}


async def run_migration():
    """Add priority + sla_due_at columns (if missing) and backfill existing rows.

    SQLite-specific: only runs when the connected database is SQLite.
    PostgreSQL tables are created by Base.metadata.create_all() at startup.
    """
    if not engine.url.drivername.startswith("sqlite"):
        return

    inspector = inspect(engine)
    columns = {c["name"] for c in inspector.get_columns(Ticket.__tablename__)}

    db = SessionLocal()
    try:
        with db.begin():
            if "priority" not in columns:
                db.execute(sql_text("ALTER TABLE tickets ADD COLUMN priority VARCHAR"))
            if "sla_due_at" not in columns:
                db.execute(sql_text("ALTER TABLE tickets ADD COLUMN sla_due_at DATETIME"))

            rows = db.execute(
                sql_text(
                    "SELECT id, created_at FROM tickets "
                    "WHERE priority IS NULL OR sla_due_at IS NULL"
                )
            ).fetchall()
            for row in rows:
                raw = row.created_at
                if isinstance(raw, str):
                    created_at = datetime.fromisoformat(raw)
                else:
                    created_at = raw if raw else datetime.utcnow()
                sla = created_at + timedelta(hours=get_sla_duration(DEFAULT_PRIORITY))
                db.execute(
                    sql_text(
                        "UPDATE tickets SET priority = :p, sla_due_at = :sla WHERE id = :id"
                    ),
                    {"p": DEFAULT_PRIORITY, "sla": sla, "id": row.id},
                )
    finally:
        db.close()


def calculate_sla_due(priority: str, from_time: datetime | None = None) -> datetime:
    base = from_time if from_time else datetime.utcnow()
    return base + timedelta(hours=get_sla_duration(priority))


def _to_iso(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat() + "Z"
    return value


@router.post("/api/tickets", response_model=TicketResponse, status_code=201)
def create_ticket(ticket_data: TicketCreate, db: Session = Depends(get_db)):
    last_ticket = db.query(Ticket).order_by(Ticket.id.desc()).first()
    if last_ticket:
        last_num = int(last_ticket.ticket_id.split("-")[1])
        new_num = last_num + 1
    else:
        new_num = 1
    ticket_id = f"TKT-{new_num:03d}"

    priority = ticket_data.priority or DEFAULT_PRIORITY
    now = datetime.utcnow()
    db_ticket = Ticket(
        ticket_id=ticket_id,
        customer_name=ticket_data.customer_name,
        customer_email=ticket_data.customer_email,
        subject=ticket_data.subject,
        description=ticket_data.description,
        status="Open",
        priority=priority,
        sla_due_at=calculate_sla_due(priority, now),
        created_at=now,
        updated_at=now,
    )
    db.add(db_ticket)
    try:
        db.commit()
        db.refresh(db_ticket)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not create ticket")

    return TicketResponse(ticket_id=ticket_id, created_at=db_ticket.created_at.isoformat() + "Z")


@router.get("/api/tickets", response_model=list[TicketListItem])
def list_tickets(
    status: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Ticket)

    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{status}'. Allowed values: Open, In Progress, Closed",
            )
        query = query.filter(Ticket.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.ticket_id.ilike(search_term),
                Ticket.customer_name.ilike(search_term),
                Ticket.customer_email.ilike(search_term),
                Ticket.subject.ilike(search_term),
                Ticket.description.ilike(search_term),
            )
        )

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return [
        {
            "ticket_id": ticket.ticket_id,
            "customer_name": ticket.customer_name,
            "subject": ticket.subject,
            "status": ticket.status,
            "priority": ticket.priority or DEFAULT_PRIORITY,
            "sla_due_at": _to_iso(ticket.sla_due_at),
            "created_at": ticket.created_at.isoformat() + "Z",
            "updated_at": ticket.updated_at.isoformat() + "Z",
        }
        for ticket in tickets
    ]


@router.get("/api/tickets/{ticket_id}", response_model=TicketDetail)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "ticket_id": ticket.ticket_id,
        "customer_name": ticket.customer_name,
        "customer_email": ticket.customer_email,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority or DEFAULT_PRIORITY,
        "sla_due_at": _to_iso(ticket.sla_due_at),
        "created_at": ticket.created_at.isoformat() + "Z",
        "updated_at": ticket.updated_at.isoformat() + "Z",
        "notes": [
            {
                "id": note.id,
                "note_text": note.note_text,
                "created_at": note.created_at.isoformat() + "Z",
            }
            for note in ticket.notes
        ],
    }


@router.put("/api/tickets/{ticket_id}")
def update_ticket(ticket_id: str, ticket_data: TicketUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket_data.status is not None:
        ticket.status = ticket_data.status

    if ticket_data.priority is not None and ticket_data.priority != ticket.priority:
        ticket.priority = ticket_data.priority
        ticket.sla_due_at = calculate_sla_due(ticket_data.priority)

    ticket.updated_at = datetime.utcnow()

    if ticket_data.notes and ticket_data.notes.strip():
        db_note = Note(
            ticket_id=ticket.id,
            note_text=ticket_data.notes.strip(),
            created_at=datetime.utcnow(),
        )
        db.add(db_note)

    try:
        db.commit()
        db.refresh(ticket)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not update ticket")

    return {"success": True, "updated_at": ticket.updated_at.isoformat() + "Z"}
