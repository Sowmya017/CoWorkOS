from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.ws_manager import layout_manager
from app.api.deps import get_current_user
from app.models.models import (
    Booking, WorkspaceObject, BookingStatusEnum, WorkspaceStatusEnum, User
)
from app.schemas.schemas import WorkspaceBookingCreate, WorkspaceBookingOut

router = APIRouter(prefix="/api/workspace-bookings", tags=["workspace-bookings"])


def _check_overlap(db: Session, workspace_object_id: int, start: datetime, end: datetime, exclude_id: Optional[int] = None):
    q = db.query(Booking).filter(
        Booking.workspace_object_id == workspace_object_id,
        Booking.booking_status.notin_([BookingStatusEnum.cancelled]),
        Booking.start_time < end,
        Booking.end_time > start,
    )
    if exclude_id:
        q = q.filter(Booking.id != exclude_id)
    return q.first()


@router.get("", response_model=List[WorkspaceBookingOut])
def list_workspace_bookings(
    workspace_object_id: Optional[int] = Query(None),
    branch_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Booking).filter(Booking.workspace_object_id.isnot(None))
    if workspace_object_id:
        q = q.filter(Booking.workspace_object_id == workspace_object_id)
    if branch_id:
        q = q.filter(Booking.branch_id == branch_id)

    results = []
    for b in q.all():
        out = WorkspaceBookingOut.model_validate(b)
        if b.user:
            out.user_name = b.user.name
        if b.branch:
            out.branch_name = b.branch.branch_name
        if b.workspace_object:
            out.workspace_label = b.workspace_object.label
        results.append(out)
    return results


@router.post("", response_model=WorkspaceBookingOut)
async def create_workspace_booking(
    payload: WorkspaceBookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(WorkspaceObject).filter(
        WorkspaceObject.id == payload.workspace_object_id
    ).first()
    if not obj:
        raise HTTPException(404, "Workspace object not found")
    if not obj.is_bookable:
        raise HTTPException(400, "This workspace is not bookable")
    if obj.status in (WorkspaceStatusEnum.maintenance, WorkspaceStatusEnum.occupied):
        raise HTTPException(400, f"Workspace is currently {obj.status.value}")

    if _check_overlap(db, payload.workspace_object_id, payload.start_time, payload.end_time):
        raise HTTPException(409, "This workspace is already booked for the requested time")

    booking = Booking(
        workspace_object_id=payload.workspace_object_id,
        seat_id=None,
        user_id=current_user.id,
        branch_id=payload.branch_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        booking_status=BookingStatusEnum.confirmed,
    )
    db.add(booking)

    # Mark object as reserved
    obj.status = WorkspaceStatusEnum.reserved
    db.commit()
    db.refresh(booking)

    out = WorkspaceBookingOut.model_validate(booking)
    out.user_name = current_user.name
    if booking.branch:
        out.branch_name = booking.branch.branch_name
    out.workspace_label = obj.label

    # Broadcast status change to all floor viewers
    await layout_manager.broadcast(
        obj.floor_id,
        {"event": "status_changed", "data": {"id": obj.id, "status": "reserved"}},
    )
    return out


@router.delete("/{booking_id}")
async def cancel_workspace_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.workspace_object_id.isnot(None),
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.user_id != current_user.id and current_user.role.value not in (
        "super_admin", "branch_manager", "receptionist"
    ):
        raise HTTPException(403, "Not authorised to cancel this booking")

    obj = booking.workspace_object
    booking.booking_status = BookingStatusEnum.cancelled

    # Re-check if other active bookings exist before marking available
    other = _check_overlap(db, obj.id, datetime.min, datetime.max, exclude_id=booking_id)
    if not other:
        obj.status = WorkspaceStatusEnum.available

    db.commit()

    if obj:
        await layout_manager.broadcast(
            obj.floor_id,
            {"event": "status_changed", "data": {"id": obj.id, "status": obj.status.value}},
        )
    return {"message": "Booking cancelled"}


# ── Availability ──────────────────────────────────────────────────────────────

@router.get("/availability/{floor_id}")
def get_floor_availability(
    floor_id: int,
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return availability status for every bookable object on the floor.
    If start_time/end_time are supplied, checks overlap for that window."""
    objects = db.query(WorkspaceObject).filter(
        WorkspaceObject.floor_id == floor_id
    ).all()

    result = []
    for obj in objects:
        available = True
        if start_time and end_time:
            overlap = _check_overlap(db, obj.id, start_time, end_time)
            available = overlap is None and obj.status not in (
                WorkspaceStatusEnum.maintenance, WorkspaceStatusEnum.occupied
            )
        result.append({
            "id": obj.id,
            "label": obj.label,
            "object_type": obj.object_type.value,
            "status": obj.status.value,
            "is_available": available,
            "capacity": obj.capacity,
            "price_per_hour": obj.price_per_hour,
            "price_per_day": obj.price_per_day,
        })
    return result
