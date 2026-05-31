from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user, get_optional_user
from app.models.models import Attendance, Branch, User, RoleEnum, Visitor, VisitorStatusEnum
from app.schemas.schemas import AttendanceOut
from app.services.notify import notify_user
from uuid import uuid4

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

QR_TYPE = "qr_checkin"
QR_EXPIRE_MINUTES = 15


def _make_qr_token(user_id: int, branch_id) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=QR_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "branch_id": branch_id, "type": QR_TYPE, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


@router.get("/qr")
def get_qr_token(current_user: User = Depends(get_current_user)):
    """Return a time-bound QR token for the logged-in user."""
    token = _make_qr_token(current_user.id, current_user.branch_id)
    return {"token": token, "expires_in": QR_EXPIRE_MINUTES * 60}


@router.post("/scan")
def scan_qr(payload: dict, db: Session = Depends(get_db)):
    """
    Public endpoint — validates QR token and auto-checks in or out.
    Called by the kiosk without any auth header.
    """
    token = payload.get("token", "")
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired QR code")

    if data.get("type") != QR_TYPE:
        raise HTTPException(status_code=400, detail="Invalid QR type")

    user_id = int(data["sub"])

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Resolve branch: prefer user's assigned branch, fall back to first branch in DB
    branch_id = user.branch_id
    if not branch_id:
        first_branch = db.query(Branch).order_by(Branch.id).first()
        if not first_branch:
            raise HTTPException(status_code=400, detail="No branch configured in system")
        branch_id = first_branch.id

    # Look for an open attendance today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    open_record = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == user_id,
            Attendance.status == "checked_in",
            Attendance.check_in >= today_start,
        )
        .first()
    )

    if open_record:
        # Check out
        open_record.check_out = datetime.now(timezone.utc)
        open_record.status = "checked_out"
        db.commit()
        notify_user(db, user_id, "Check-out recorded", f"See you soon, {user.name}!", "info")
        duration_mins = int((open_record.check_out - open_record.check_in).total_seconds() / 60)
        return {
            "action": "checkout",
            "user_name": user.name,
            "message": f"Goodbye, {user.name}! You stayed for {duration_mins} min.",
            "duration_minutes": duration_mins,
        }
    else:
        # Check in
        record = Attendance(user_id=user_id, branch_id=branch_id, status="checked_in")
        db.add(record)
        db.commit()
        notify_user(db, user_id, "Check-in recorded", f"Welcome, {user.name}!", "info")
        return {
            "action": "checkin",
            "user_name": user.name,
            "message": f"Welcome, {user.name}! ✓",
        }


@router.get("/my", response_model=List[AttendanceOut])
def my_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(Attendance)
        .filter(Attendance.user_id == current_user.id)
        .order_by(Attendance.check_in.desc())
        .limit(30)
        .all()
    )
    result = []
    for r in records:
        out = AttendanceOut.model_validate(r)
        out.user_name = r.user.name if r.user else None
        out.branch_name = r.branch.branch_name if r.branch else None
        result.append(out)
    return result


@router.get("", response_model=List[AttendanceOut])
def list_attendance(
    branch_id: Optional[int] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: list attendance records."""
    query = db.query(Attendance)
    if branch_id:
        query = query.filter(Attendance.branch_id == branch_id)
    if date:
        try:
            d = datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
            query = query.filter(
                Attendance.check_in >= d,
                Attendance.check_in < d + timedelta(days=1),
            )
        except ValueError:
            pass
    records = query.order_by(Attendance.check_in.desc()).limit(200).all()
    result = []
    for r in records:
        out = AttendanceOut.model_validate(r)
        out.user_name = r.user.name if r.user else None
        out.branch_name = r.branch.branch_name if r.branch else None
        result.append(out)
    return result


@router.post("/branch-checkin")
def branch_checkin(payload: dict, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_user)):
    """
    Public self-check-in endpoint triggered when a client scans the branch QR.
    - If client is logged in (JWT cookie): creates an Attendance record.
    - If guest (no account): creates a Visitor record using provided name + phone.
    """
    branch_id = payload.get("branch_id")
    if not branch_id:
        raise HTTPException(status_code=400, detail="branch_id is required")

    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    now = datetime.now(timezone.utc)

    if current_user:
        # ── Registered member ──────────────────────────────────────────────────
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        open_record = (
            db.query(Attendance)
            .filter(
                Attendance.user_id == current_user.id,
                Attendance.status == "checked_in",
                Attendance.check_in >= today_start,
            )
            .first()
        )
        if open_record:
            # Already checked in today — treat as checkout
            open_record.check_out = now
            open_record.status = "checked_out"
            db.commit()
            duration_mins = int((open_record.check_out - open_record.check_in).total_seconds() / 60)
            notify_user(db, current_user.id, "Checked out", f"See you soon, {current_user.name}! You were here for {duration_mins} min.", "info")
            return {"action": "checkout", "name": current_user.name, "type": "member", "duration_minutes": duration_mins, "branch_name": branch.branch_name}

        record = Attendance(user_id=current_user.id, branch_id=branch_id, status="checked_in", check_in=now)
        db.add(record)
        db.commit()
        notify_user(db, current_user.id, "Checked in", f"Welcome to {branch.branch_name}, {current_user.name}!", "info")
        return {"action": "checkin", "name": current_user.name, "type": "member", "branch_name": branch.branch_name}

    else:
        # ── Guest / walk-in ────────────────────────────────────────────────────
        name = (payload.get("name") or "").strip()
        phone = (payload.get("phone") or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="name is required for guest check-in")

        visitor = Visitor(
            name=name,
            phone=phone or None,
            branch_id=branch_id,
            host_name="Walk-in",
            purpose="Self Check-in",
            qr_token=f"visitor_{uuid4().hex[:10]}",
            check_in=now,
            status=VisitorStatusEnum.checked_in,
        )
        db.add(visitor)
        db.commit()
        return {"action": "checkin", "name": name, "type": "guest", "branch_name": branch.branch_name}
