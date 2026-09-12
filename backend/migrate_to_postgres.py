import os
import sys
from datetime import datetime

# Ensure backend package imports resolve when run directly.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

# Load backend/.env so DATABASE_URL is available without manual export.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

import sqlite3
from sqlalchemy.orm import Session

from app.database import Base, engine, SessionLocal
from app.models import Ticket, Note

SQLITE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "support_crm.db",
)


def _parse_dt(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    value = str(value).replace(" ", "T")
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def migrate():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL environment variable is required to run the migration."
        )

    if not os.path.exists(SQLITE_PATH):
        raise RuntimeError(f"SQLite database not found at {SQLITE_PATH}")

    if engine.url.drivername == "sqlite":
        raise RuntimeError(
            "DATABASE_URL is pointing at SQLite. Set it to a Supabase PostgreSQL URL."
        )

    Base.metadata.create_all(bind=engine)

    sqlite_con = sqlite3.connect(SQLITE_PATH)
    sqlite_con.row_factory = sqlite3.Row

    tickets = sqlite_con.execute("SELECT * FROM tickets ORDER BY id").fetchall()
    notes = sqlite_con.execute("SELECT * FROM notes ORDER BY id").fetchall()

    db = SessionLocal()
    try:
        existing_ids = {row[0] for row in db.query(Ticket.ticket_id).all()}
        id_map = {}

        for t in tickets:
            if t["ticket_id"] in existing_ids:
                continue

            ticket = Ticket(
                ticket_id=t["ticket_id"],
                customer_name=t["customer_name"],
                customer_email=t["customer_email"],
                subject=t["subject"],
                description=t["description"],
                status=t["status"],
                priority=t["priority"] or "Medium",
                sla_due_at=_parse_dt(t["sla_due_at"]),
                created_at=_parse_dt(t["created_at"]) or datetime.utcnow(),
                updated_at=_parse_dt(t["updated_at"]) or datetime.utcnow(),
            )
            db.add(ticket)
            db.flush()
            id_map[t["id"]] = ticket.id

        db.commit()

        for n in notes:
            new_ticket_id = id_map.get(n["ticket_id"])
            if new_ticket_id is None:
                continue
            db.add(
                Note(
                    ticket_id=new_ticket_id,
                    note_text=n["note_text"],
                    created_at=_parse_dt(n["created_at"]) or datetime.utcnow(),
                )
            )

        db.commit()
    finally:
        db.close()
        sqlite_con.close()

    print(f"Migration complete. Tickets processed: {len(tickets)}, Notes processed: {len(notes)}")


if __name__ == "__main__":
    migrate()
