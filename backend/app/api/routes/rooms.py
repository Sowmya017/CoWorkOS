from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import Room, RoomBooking, RoomStatusEnum, RoomBookingStatusEnum, User, RoleEnum
from app.schemas.schemas import RoomCreate, RoomUpdate, RoomOut, RoomBookingCreate, RoomBookingOut
from app.services.notify import notify_branch_staff, notify_user

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

MAX_ROOMS_PER_BRANCH = 5


@router.get("", response_model=List[RoomOut])
def list_rooms(
    branch_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Room)
    if branch_id:
        query = query.filter(Room.branch_id == branch_id)
    if status:
        query = query.filter(Room.status == status)
    rooms = query.all()
    result = []
    for r in rooms:
        out = RoomOut.model_validate(r)
        if r.branch:
            out.branch_name = r.branch.branch_name
        result.append(out)
    return result


@router.post("", response_model=RoomOut, status_code=201)
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    existing_count = db.query(Room).filter(Room.branch_id == data.branch_id).count()
    if existing_count >= MAX_ROOMS_PER_BRANCH:
        raise HTTPException(
            status_code=400,
            detail=f"A branch can have at most {MAX_ROOMS_PER_BRANCH} rooms.",
        )
    room = Room(**data.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    out = RoomOut.model_validate(room)
    if room.branch:
        out.branch_name = room.branch.branch_name
    return out


@router.put("/{room_id}", response_model=RoomOut)
def update_room(
    room_id: int,
    data: RoomUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(room, key, val)
    db.commit()
    db.refresh(room)
    out = RoomOut.model_validate(room)
    if room.branch:
        out.branch_name = room.branch.branch_name
    return out


@router.delete("/{room_id}", status_code=204)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()


@router.post("/{room_id}/book", response_model=RoomBookingOut, status_code=201)
def book_room(
    room_id: int,
    data: RoomBookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status != RoomStatusEnum.available:
        raise HTTPException(status_code=400, detail="Room is not available")

    start = datetime.fromisoformat(str(data.start_time).replace("Z", ""))
    end = datetime.fromisoformat(str(data.end_time).replace("Z", ""))
    if start >= end:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # Check for overlapping bookings
    conflict = (
        db.query(RoomBooking)
        .filter(
            RoomBooking.room_id == room_id,
            RoomBooking.status != RoomBookingStatusEnum.cancelled,
            RoomBooking.start_time < end,
            RoomBooking.end_time > start,
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=409, detail="Room is already booked for this time slot")

    booking = RoomBooking(
        room_id=room_id,
        user_id=current_user.id,
        branch_id=data.branch_id,
        start_time=data.start_time,
        end_time=data.end_time,
        status=RoomBookingStatusEnum.confirmed,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    out = RoomBookingOut.model_validate(booking)
    out.room_name = room.room_name
    out.user_name = current_user.name
    if room.branch:
        out.branch_name = room.branch.branch_name

    # Notify client confirmation + notify branch staff
    notify_user(db, current_user.id, "Room Booking Confirmed", f"{room.room_name} is reserved for you.", "room")
    notify_branch_staff(
        db, room.branch_id,
        [RoleEnum.branch_manager, RoleEnum.receptionist],
        "New Room Booking",
        f"{current_user.name} booked {room.room_name} (Floor {room.floor}).",
        "room"
    )
    return out


@router.get("/bookings", response_model=List[RoomBookingOut])
def list_room_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = (
        db.query(RoomBooking)
        .filter(RoomBooking.user_id == current_user.id)
        .all()
    )
    result = []
    for b in bookings:
        out = RoomBookingOut.model_validate(b)
        if b.room:
            out.room_name = b.room.room_name
        if b.user:
            out.user_name = b.user.name
        if b.branch:
            out.branch_name = b.branch.branch_name
        result.append(out)
    return result


@router.patch("/bookings/{booking_id}/cancel", response_model=RoomBookingOut)
def cancel_room_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = (
        db.query(RoomBooking)
        .filter(RoomBooking.id == booking_id, RoomBooking.user_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = RoomBookingStatusEnum.cancelled
    db.commit()
    db.refresh(booking)
    return booking
