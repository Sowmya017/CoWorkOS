from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Lead
from app.schemas.schemas import LeadCreate, LeadUpdate, LeadOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/leads", tags=["leads"])

@router.get("", response_model=List[LeadOut])
def list_leads(status: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    leads = query.order_by(Lead.created_at.desc()).all()
    result = []
    for lead in leads:
        out = LeadOut.model_validate(lead)
        if lead.assigned_user:
            out.assigned_name = lead.assigned_user.name
        result.append(out)
    return result

@router.post("", response_model=LeadOut, status_code=201)
def create_lead(data: LeadCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    lead = Lead(**data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(lead, key, val)
    db.commit()
    db.refresh(lead)
    return lead

@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
