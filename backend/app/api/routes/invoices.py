from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.models import Invoice, InvoiceStatusEnum, User, RoleEnum
from app.schemas.schemas import InvoiceCreate, InvoiceUpdate, InvoiceOut
from app.api.deps import get_current_user
from app.services.notify import notify_user, notify_branch_staff

router = APIRouter(prefix="/api/invoices", tags=["invoices"])

def _enrich(inv: Invoice) -> InvoiceOut:
    out = InvoiceOut.model_validate(inv)
    if not out.client_name and inv.client:
        out.client_name = inv.client.name
    return out

@router.get("", response_model=List[InvoiceOut])
def list_invoices(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Invoice)
    if status:
        query = query.filter(Invoice.status == status)
    if search:
        query = query.filter(Invoice.client_name.ilike(f"%{search}%"))
    invoices = query.order_by(Invoice.created_at.desc()).all()
    return [_enrich(inv) for inv in invoices]

@router.post("", response_model=InvoiceOut, status_code=201)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if data.amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be greater than 0")
    payload = data.model_dump()
    if data.client_id and not data.client_name:
        user = db.query(User).filter(User.id == data.client_id).first()
        if user:
            payload["client_name"] = user.name
    count = db.query(Invoice).count()
    payload["invoice_number"] = payload.get("invoice_number") or f"INV-{datetime.utcnow().year}-{count+1:03d}"
    invoice = Invoice(**payload)
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    # Notify client that an invoice was created for them
    if invoice.client_id:
        notify_user(db, invoice.client_id, "New Invoice", f"Invoice {invoice.invoice_number} for ₹{invoice.amount:,.0f} has been issued.", "invoice")
    return _enrich(invoice)

@router.put("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, data: InvoiceUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(invoice, key, val)
    db.commit()
    db.refresh(invoice)
    return _enrich(invoice)

@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()

@router.patch("/{invoice_id}/pay", response_model=InvoiceOut)
def mark_paid(invoice_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = InvoiceStatusEnum.paid
    db.commit()
    db.refresh(invoice)
    # Notify finance team + branch manager
    if invoice.branch_id:
        notify_branch_staff(db, invoice.branch_id, [RoleEnum.finance_team, RoleEnum.branch_manager],
            "Invoice Paid", f"{invoice.client_name or 'A client'} paid {invoice.invoice_number} — ₹{invoice.amount:,.0f}.", "invoice")
    return _enrich(invoice)
