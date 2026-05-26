from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Booking, BookingStatusEnum, Seat, SeatStatusEnum
from app.schemas.schemas import BookingCreate, BookingUpdate, BookingOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

@router.get("", response_model=List[BookingOut])
def list_bookings(branch_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = db.query(Booking)
    if branch_id:
        query = query.filter(Booking.branch_id == branch_id)
    if status:
        query = query.filter(Booking.booking_status == status)
    bookings = query.order_by(Booking.created_at.desc()).all()
    result = []
    for b in bookings:
        out = BookingOut.model_validate(b)
        if b.seat:
            out.seat_number = b.seat.seat_number
        if b.user:
            out.user_name = b.user.name
        if b.branch:
            out.branch_name = b.branch.branch_name
        result.append(out)
    return result

@router.post("", response_model=BookingOut, status_code=201)
def create_booking(data: BookingCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    seat = db.query(Seat).filter(Seat.id == data.seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    if seat.status != SeatStatusEnum.available:
        raise HTTPException(status_code=400, detail="Seat not available")
    booking = Booking(**data.model_dump(), booking_status=BookingStatusEnum.pending)
    db.add(booking)
    seat.status = SeatStatusEnum.occupied
    db.commit()
    db.refresh(booking)
    return booking

@router.put("/{booking_id}", response_model=BookingOut)
def update_booking(booking_id: int, data: BookingUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(booking, key, val)
    db.commit()
    db.refresh(booking)
    return booking

@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.booking_status = BookingStatusEnum.cancelled
    seat = db.query(Seat).filter(Seat.id == booking.seat_id).first()
    if seat:
        seat.status = SeatStatusEnum.available
    db.commit()
    db.refresh(booking)
    return booking
