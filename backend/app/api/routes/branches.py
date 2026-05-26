from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Branch
from app.schemas.schemas import BranchCreate, BranchUpdate, BranchOut
from app.api.deps import get_current_user, require_manager_or_above

router = APIRouter(prefix="/api/branches", tags=["branches"])

@router.get("", response_model=List[BranchOut])
def list_branches(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Branch).all()

@router.get("/{branch_id}", response_model=BranchOut)
def get_branch(branch_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.post("", response_model=BranchOut, status_code=201)
def create_branch(data: BranchCreate, db: Session = Depends(get_db), _=Depends(require_manager_or_above)):
    branch = Branch(**data.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch

@router.put("/{branch_id}", response_model=BranchOut)
def update_branch(branch_id: int, data: BranchUpdate, db: Session = Depends(get_db), _=Depends(require_manager_or_above)):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(branch, key, val)
    db.commit()
    db.refresh(branch)
    return branch

@router.delete("/{branch_id}", status_code=204)
def delete_branch(branch_id: int, db: Session = Depends(get_db), _=Depends(require_manager_or_above)):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    db.delete(branch)
    db.commit()
