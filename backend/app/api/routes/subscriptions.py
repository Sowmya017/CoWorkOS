from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Subscription
from app.schemas.schemas import SubscriptionCreate, SubscriptionUpdate, SubscriptionOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

@router.get("", response_model=List[SubscriptionOut])
def list_subscriptions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    subs = db.query(Subscription).order_by(Subscription.created_at.desc()).all()
    result = []
    for s in subs:
        out = SubscriptionOut.model_validate(s)
        if s.client:
            out.client_name = s.client.name
        if s.branch:
            out.branch_name = s.branch.branch_name
        result.append(out)
    return result

@router.post("", response_model=SubscriptionOut, status_code=201)
def create_subscription(data: SubscriptionCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sub = Subscription(**data.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.put("/{sub_id}", response_model=SubscriptionOut)
def update_subscription(sub_id: int, data: SubscriptionUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(sub, key, val)
    db.commit()
    db.refresh(sub)
    return sub

@router.delete("/{sub_id}", status_code=204)
def delete_subscription(sub_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()
