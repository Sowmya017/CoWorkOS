from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, require_manager_or_above
from app.models.models import LayoutVersion, Floor, User
from app.schemas.schemas import (
    LayoutVersionCreate, LayoutVersionUpdate, LayoutVersionOut, LayoutVersionDetail
)

router = APIRouter(prefix="/api/layout-versions", tags=["layout-versions"])


def _next_version_number(db: Session, floor_id: int) -> int:
    existing = db.query(LayoutVersion).filter(LayoutVersion.floor_id == floor_id).count()
    return existing + 1


@router.get("", response_model=List[LayoutVersionOut])
def list_layout_versions(
    floor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(LayoutVersion)
    if floor_id:
        q = q.filter(LayoutVersion.floor_id == floor_id)
    return q.order_by(LayoutVersion.floor_id, LayoutVersion.version_number).all()


@router.post("", response_model=LayoutVersionOut)
def create_layout_version(
    payload: LayoutVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    floor = db.query(Floor).filter(Floor.id == payload.floor_id).first()
    if not floor:
        raise HTTPException(404, "Floor not found")

    version = LayoutVersion(
        floor_id=payload.floor_id,
        label=payload.label,
        canvas_width=payload.canvas_width,
        canvas_height=payload.canvas_height,
        background_image_url=payload.background_image_url,
        version_number=_next_version_number(db, payload.floor_id),
        is_active=False,
        created_by=current_user.id,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


@router.get("/floor/{floor_id}/active", response_model=LayoutVersionDetail)
def get_active_layout(
    floor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = (
        db.query(LayoutVersion)
        .filter(LayoutVersion.floor_id == floor_id, LayoutVersion.is_active == True)
        .first()
    )
    if not version:
        # Return latest version if none marked active
        version = (
            db.query(LayoutVersion)
            .filter(LayoutVersion.floor_id == floor_id)
            .order_by(LayoutVersion.version_number.desc())
            .first()
        )
    if not version:
        raise HTTPException(404, "No layout found for this floor")
    return version


@router.get("/{version_id}", response_model=LayoutVersionDetail)
def get_layout_version(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = db.query(LayoutVersion).filter(LayoutVersion.id == version_id).first()
    if not version:
        raise HTTPException(404, "Layout version not found")
    return version


@router.put("/{version_id}", response_model=LayoutVersionOut)
def update_layout_version(
    version_id: int,
    payload: LayoutVersionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    version = db.query(LayoutVersion).filter(LayoutVersion.id == version_id).first()
    if not version:
        raise HTTPException(404, "Layout version not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(version, k, v)
    db.commit()
    db.refresh(version)
    return version


@router.post("/{version_id}/activate", response_model=LayoutVersionOut)
def activate_layout_version(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    version = db.query(LayoutVersion).filter(LayoutVersion.id == version_id).first()
    if not version:
        raise HTTPException(404, "Layout version not found")
    # Deactivate siblings
    db.query(LayoutVersion).filter(
        LayoutVersion.floor_id == version.floor_id,
        LayoutVersion.id != version_id,
    ).update({"is_active": False})
    version.is_active = True
    db.commit()
    db.refresh(version)
    return version


@router.post("/{version_id}/clone", response_model=LayoutVersionOut)
def clone_layout_version(
    version_id: int,
    label: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    """Clone an existing version — useful for creating event/temporary layouts."""
    from app.models.models import WorkspaceObject

    source = db.query(LayoutVersion).filter(LayoutVersion.id == version_id).first()
    if not source:
        raise HTTPException(404, "Source layout version not found")

    clone = LayoutVersion(
        floor_id=source.floor_id,
        label=label or f"Clone of {source.label or f'v{source.version_number}'}",
        canvas_width=source.canvas_width,
        canvas_height=source.canvas_height,
        background_image_url=source.background_image_url,
        version_number=_next_version_number(db, source.floor_id),
        is_active=False,
        created_by=current_user.id,
    )
    db.add(clone)
    db.flush()  # get clone.id

    for obj in source.workspace_objects:
        new_obj = WorkspaceObject(
            layout_version_id=clone.id,
            floor_id=obj.floor_id,
            branch_id=obj.branch_id,
            object_type=obj.object_type,
            label=obj.label,
            x=obj.x, y=obj.y, width=obj.width, height=obj.height, rotation=obj.rotation,
            capacity=obj.capacity,
            price_per_hour=obj.price_per_hour,
            price_per_day=obj.price_per_day,
            price_per_month=obj.price_per_month,
            status=obj.status,
            is_locked=obj.is_locked,
            is_bookable=obj.is_bookable,
            color=obj.color,
            amenities=obj.amenities,
            metadata_json=obj.metadata_json,
        )
        db.add(new_obj)

    db.commit()
    db.refresh(clone)
    return clone


@router.delete("/{version_id}")
def delete_layout_version(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    version = db.query(LayoutVersion).filter(LayoutVersion.id == version_id).first()
    if not version:
        raise HTTPException(404, "Layout version not found")
    if version.is_active:
        raise HTTPException(400, "Cannot delete the active layout version")
    db.delete(version)
    db.commit()
    return {"message": "Layout version deleted"}
