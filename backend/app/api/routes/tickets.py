from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Ticket
from app.schemas.schemas import TicketCreate, TicketUpdate, TicketOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

@router.get("", response_model=List[TicketOut])
def list_tickets(status: Optional[str] = None, priority: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = db.query(Ticket)
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    tickets = query.order_by(Ticket.created_at.desc()).all()
    result = []
    for t in tickets:
        out = TicketOut.model_validate(t)
        if t.assigned_user:
            out.assigned_name = t.assigned_user.name
        result.append(out)
    return result

@router.post("", response_model=TicketOut, status_code=201)
def create_ticket(data: TicketCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ticket = Ticket(**data.model_dump())
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: int, data: TicketUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(ticket, key, val)
    db.commit()
    db.refresh(ticket)
    return ticket
