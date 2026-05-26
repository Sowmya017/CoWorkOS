from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.models import Payment, PaymentStatusEnum, Invoice
from app.schemas.schemas import PaymentCreate, PaymentOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.get("", response_model=List[PaymentOut])
def list_payments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    result = []
    for p in payments:
        out = PaymentOut.model_validate(p)
        if p.invoice:
            out.invoice_number = p.invoice.invoice_number
            if p.invoice.client:
                out.client_name = p.invoice.client.name
        result.append(out)
    return result

@router.post("", response_model=PaymentOut, status_code=201)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    payment = Payment(**data.model_dump(), payment_status=PaymentStatusEnum.completed, payment_date=datetime.utcnow())
    db.add(payment)
    inv = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
    if inv:
        from app.models.models import InvoiceStatusEnum
        inv.status = InvoiceStatusEnum.paid
    db.commit()
    db.refresh(payment)
    return payment

@router.patch("/{payment_id}/complete", response_model=PaymentOut)
def complete_payment(payment_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment.payment_status = PaymentStatusEnum.completed
    payment.payment_date = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    return payment
