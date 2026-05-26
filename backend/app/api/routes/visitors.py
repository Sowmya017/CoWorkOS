from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.models import Visitor, VisitorStatusEnum
from app.schemas.schemas import VisitorCreate, VisitorOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/visitors", tags=["visitors"])

@router.get("", response_model=List[VisitorOut])
def list_visitors(branch_id: Optional[int] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = db.query(Visitor)
    if branch_id:
        query = query.filter(Visitor.branch_id == branch_id)
    visitors = query.order_by(Visitor.check_in.desc()).all()
    result = []
    for v in visitors:
        out = VisitorOut.model_validate(v)
        if v.branch:
            out.branch_name = v.branch.branch_name
        result.append(out)
    return result

@router.post("", response_model=VisitorOut, status_code=201)
def check_in_visitor(data: VisitorCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    visitor = Visitor(**data.model_dump(), check_in=datetime.utcnow(), status=VisitorStatusEnum.checked_in)
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return visitor

@router.patch("/{visitor_id}/checkout", response_model=VisitorOut)
def checkout_visitor(visitor_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    visitor.check_out = datetime.utcnow()
    visitor.status = VisitorStatusEnum.checked_out
    db.commit()
    db.refresh(visitor)
    return visitor
