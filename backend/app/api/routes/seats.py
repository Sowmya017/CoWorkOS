from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Seat
from app.schemas.schemas import SeatCreate, SeatUpdate, SeatOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/seats", tags=["seats"])

@router.get("", response_model=List[SeatOut])
def list_seats(branch_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = db.query(Seat)
    if branch_id:
        query = query.filter(Seat.branch_id == branch_id)
    if status:
        query = query.filter(Seat.status == status)
    seats = query.all()
    result = []
    for s in seats:
        out = SeatOut.model_validate(s)
        if s.branch:
            out.branch_name = s.branch.branch_name
        result.append(out)
    return result

@router.post("", response_model=SeatOut, status_code=201)
def create_seat(data: SeatCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    seat = Seat(**data.model_dump())
    db.add(seat)
    db.commit()
    db.refresh(seat)
    return seat

@router.put("/{seat_id}", response_model=SeatOut)
def update_seat(seat_id: int, data: SeatUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(seat, key, val)
    db.commit()
    db.refresh(seat)
    return seat

@router.get("/availability/{branch_id}")
def get_availability(branch_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.models import SeatStatusEnum as SSE
    seats = db.query(Seat).filter(Seat.branch_id == branch_id).all()
    return {
        "total": len(seats),
        "available": sum(1 for s in seats if s.status == SSE.available),
        "occupied": sum(1 for s in seats if s.status == SSE.occupied),
        "reserved": sum(1 for s in seats if s.status == SSE.reserved),
        "maintenance": sum(1 for s in seats if s.status == SSE.maintenance),
    }
