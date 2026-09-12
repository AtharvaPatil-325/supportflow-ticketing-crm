from pydantic import BaseModel, Field, field_validator
import re

VALID_STATUSES = {"Open", "In Progress", "Closed"}

VALID_PRIORITIES = {"Low", "Medium", "High", "Urgent"}
DEFAULT_PRIORITY = "Medium"

PRIORITY_SLA_HOURS = {
    "Urgent": 1,
    "High": 4,
    "Medium": 24,
    "Low": 72,
}


def get_sla_duration(priority: str) -> int:
    """Return the SLA duration (in hours) for a valid priority."""
    return PRIORITY_SLA_HOURS.get(priority, PRIORITY_SLA_HOURS[DEFAULT_PRIORITY])


class TicketCreate(BaseModel):
    customer_name: str = Field(..., min_length=1)
    customer_email: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    priority: str | None = None

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v):
        if v is None:
            return v
        if v not in VALID_PRIORITIES:
            raise ValueError(
                f"Invalid priority '{v}'. Allowed values: Low, Medium, High, Urgent"
            )
        return v

    @field_validator("customer_name", "subject", "description")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

    @field_validator("customer_email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Email cannot be empty")
        v = v.strip()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email format")
        return v


class TicketResponse(BaseModel):
    ticket_id: str
    created_at: str


class TicketListItem(BaseModel):
    ticket_id: str
    customer_name: str
    subject: str
    status: str
    priority: str
    sla_due_at: str | None = None
    created_at: str
    updated_at: str


class NoteResponse(BaseModel):
    id: int
    note_text: str
    created_at: str


class TicketDetail(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    priority: str
    sla_due_at: str | None = None
    created_at: str
    updated_at: str
    notes: list[NoteResponse] = []


class TicketUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def valid_status(cls, v):
        if v is None:
            return v
        if v not in VALID_STATUSES:
            raise ValueError(
                f"Invalid status '{v}'. Allowed values: Open, In Progress, Closed"
            )
        return v

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v):
        if v is None:
            return v
        if v not in VALID_PRIORITIES:
            raise ValueError(
                f"Invalid priority '{v}'. Allowed values: Low, Medium, High, Urgent"
            )
        return v
