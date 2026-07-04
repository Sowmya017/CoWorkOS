import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, require_manager_or_above
from app.models.models import Floor, FloorAsset, LayoutVersion, Branch, User
from app.schemas.schemas import FloorCreate, FloorUpdate, FloorOut, FloorAssetOut, LayoutVersionOut

router = APIRouter(prefix="/api/floors", tags=["floors"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "floor_assets")
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".pdf", ".webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[FloorOut])
def list_floors(
    branch_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Floor)
    if branch_id:
        q = q.filter(Floor.branch_id == branch_id)
    floors = q.order_by(Floor.branch_id, Floor.floor_number).all()
    result = []
    for f in floors:
        out = FloorOut.model_validate(f)
        if f.branch:
            out.branch_name = f.branch.branch_name
        result.append(out)
    return result


@router.post("", response_model=FloorOut)
def create_floor(
    payload: FloorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    branch = db.query(Branch).filter(Branch.id == payload.branch_id).first()
    if not branch:
        raise HTTPException(404, "Branch not found")
    floor = Floor(**payload.model_dump())
    db.add(floor)
    db.commit()
    db.refresh(floor)
    out = FloorOut.model_validate(floor)
    out.branch_name = branch.branch_name
    return out


@router.get("/{floor_id}", response_model=FloorOut)
def get_floor(
    floor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(404, "Floor not found")
    out = FloorOut.model_validate(floor)
    if floor.branch:
        out.branch_name = floor.branch.branch_name
    return out


@router.put("/{floor_id}", response_model=FloorOut)
def update_floor(
    floor_id: int,
    payload: FloorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(404, "Floor not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(floor, k, v)
    db.commit()
    db.refresh(floor)
    out = FloorOut.model_validate(floor)
    if floor.branch:
        out.branch_name = floor.branch.branch_name
    return out


@router.delete("/{floor_id}")
def delete_floor(
    floor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(404, "Floor not found")
    db.delete(floor)
    db.commit()
    return {"message": "Floor deleted"}


# ── Asset upload ──────────────────────────────────────────────────────────────

@router.get("/{floor_id}/assets", response_model=List[FloorAssetOut])
def list_assets(
    floor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(404, "Floor not found")
    return floor.assets


@router.post("/{floor_id}/assets", response_model=FloorAssetOut)
async def upload_asset(
    floor_id: int,
    asset_type: str = Form("floor_plan"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(404, "Floor not found")

    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type '{ext}' not allowed. Allowed: {ALLOWED_EXTENSIONS}")

    _ensure_upload_dir()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(413, "File exceeds 20 MB limit")

    with open(dest, "wb") as f:
        f.write(content)

    asset = FloorAsset(
        floor_id=floor_id,
        asset_type=asset_type,
        url=f"/uploads/floor_assets/{unique_name}",
        original_filename=file.filename,
        file_size=len(content),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{floor_id}/assets/{asset_id}")
def delete_asset(
    floor_id: int,
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    asset = db.query(FloorAsset).filter(
        FloorAsset.id == asset_id, FloorAsset.floor_id == floor_id
    ).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    # Remove file from disk
    disk_path = os.path.join(UPLOAD_DIR, os.path.basename(asset.url))
    if os.path.exists(disk_path):
        os.remove(disk_path)
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted"}
