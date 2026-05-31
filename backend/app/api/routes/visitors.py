from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from app.core.database import get_db
from app.models.models import Visitor, VisitorStatusEnum
from app.schemas.schemas import VisitorCreate, VisitorOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/visitors", tags=["visitors"])

BASE_CHECKIN_PATH = "/checkin"


def _build_out(v: Visitor, base_url: str = "") -> VisitorOut:
    out = VisitorOut.model_validate(v)
    if v.branch:
        out.branch_name = v.branch.branch_name
    if v.qr_token:
        checkin_url = f"{base_url}{BASE_CHECKIN_PATH}/{v.qr_token}"
        out.qr_url = (
            f"https://api.qrserver.com/v1/create-qr-code/"
            f"?size=300x300&data={checkin_url}&bgcolor=ffffff&color=1e293b&margin=4"
        )
    return out


# ── Public endpoints (no auth) ────────────────────────────────────────────────

@router.get("/token/{token}", response_model=VisitorOut)
def get_visitor_by_token(token: str, db: Session = Depends(get_db)):
    """Public: fetch visitor details by QR token for the check-in page."""
    visitor = db.query(Visitor).filter(Visitor.qr_token == token).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return _build_out(visitor)


@router.patch("/checkin/{token}", response_model=VisitorOut)
def checkin_by_token(token: str, db: Session = Depends(get_db)):
    """Public: mark visitor as checked-in via QR scan."""
    visitor = db.query(Visitor).filter(Visitor.qr_token == token).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Invalid QR code")
    if visitor.status == VisitorStatusEnum.checked_in:
        raise HTTPException(status_code=400, detail="Already checked in")
    visitor.status = VisitorStatusEnum.checked_in
    visitor.check_in = datetime.utcnow()
    db.commit()
    db.refresh(visitor)
    return _build_out(visitor)


# ── Authenticated endpoints ───────────────────────────────────────────────────

@router.get("", response_model=List[VisitorOut])
def list_visitors(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Visitor)
    if branch_id:
        query = query.filter(Visitor.branch_id == branch_id)
    visitors = query.order_by(Visitor.check_in.desc()).all()
    return [_build_out(v) for v in visitors]


@router.post("", response_model=VisitorOut, status_code=201)
def check_in_visitor(
    data: VisitorCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    token = f"visitor_{uuid4().hex[:10]}"
    visitor = Visitor(
        **data.model_dump(),
        qr_token=token,
        check_in=datetime.utcnow(),
        status=VisitorStatusEnum.checked_in,
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return _build_out(visitor)


@router.patch("/{visitor_id}/checkout", response_model=VisitorOut)
def checkout_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    visitor.check_out = datetime.utcnow()
    visitor.status = VisitorStatusEnum.checked_out
    db.commit()
    db.refresh(visitor)
    return _build_out(visitor)
