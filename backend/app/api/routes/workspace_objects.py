import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.ws_manager import layout_manager
from app.api.deps import get_current_user, require_manager_or_above
from app.models.models import WorkspaceObject, LayoutVersion, User, WorkspaceStatusEnum
from app.schemas.schemas import (
    WorkspaceObjectCreate, WorkspaceObjectUpdate, WorkspaceObjectOut,
)

router = APIRouter(prefix="/api/workspace-objects", tags=["workspace-objects"])


async def _broadcast_layout_update(floor_id: int, event: str, data: dict):
    await layout_manager.broadcast(floor_id, {"event": event, "data": data})


@router.get("", response_model=List[WorkspaceObjectOut])
def list_workspace_objects(
    layout_version_id: Optional[int] = Query(None),
    floor_id: Optional[int] = Query(None),
    branch_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(WorkspaceObject)
    if layout_version_id:
        q = q.filter(WorkspaceObject.layout_version_id == layout_version_id)
    if floor_id:
        q = q.filter(WorkspaceObject.floor_id == floor_id)
    if branch_id:
        q = q.filter(WorkspaceObject.branch_id == branch_id)
    return q.all()


@router.post("", response_model=WorkspaceObjectOut)
async def create_workspace_object(
    payload: WorkspaceObjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    version = db.query(LayoutVersion).filter(
        LayoutVersion.id == payload.layout_version_id
    ).first()
    if not version:
        raise HTTPException(404, "Layout version not found")

    obj = WorkspaceObject(**payload.model_dump(exclude={"metadata_json"}))
    obj.metadata_json = payload.metadata_json
    db.add(obj)
    db.commit()
    db.refresh(obj)

    out = WorkspaceObjectOut.model_validate(obj)
    await _broadcast_layout_update(
        obj.floor_id, "object_created", out.model_dump(mode="json")
    )
    return out


@router.get("/{obj_id}", response_model=WorkspaceObjectOut)
def get_workspace_object(
    obj_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(WorkspaceObject).filter(WorkspaceObject.id == obj_id).first()
    if not obj:
        raise HTTPException(404, "Workspace object not found")
    return obj


@router.put("/{obj_id}", response_model=WorkspaceObjectOut)
async def update_workspace_object(
    obj_id: int,
    payload: WorkspaceObjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    obj = db.query(WorkspaceObject).filter(WorkspaceObject.id == obj_id).first()
    if not obj:
        raise HTTPException(404, "Workspace object not found")
    if obj.is_locked and current_user.role.value not in ("super_admin",):
        raise HTTPException(403, "Object is locked")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)

    out = WorkspaceObjectOut.model_validate(obj)
    await _broadcast_layout_update(
        obj.floor_id, "object_updated", out.model_dump(mode="json")
    )
    return out


@router.patch("/{obj_id}/status", response_model=WorkspaceObjectOut)
async def update_workspace_status(
    obj_id: int,
    status: WorkspaceStatusEnum,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(WorkspaceObject).filter(WorkspaceObject.id == obj_id).first()
    if not obj:
        raise HTTPException(404, "Workspace object not found")
    obj.status = status
    db.commit()
    db.refresh(obj)

    out = WorkspaceObjectOut.model_validate(obj)
    await _broadcast_layout_update(
        obj.floor_id, "status_changed", {"id": obj_id, "status": status.value}
    )
    return out


@router.delete("/{obj_id}")
async def delete_workspace_object(
    obj_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    obj = db.query(WorkspaceObject).filter(WorkspaceObject.id == obj_id).first()
    if not obj:
        raise HTTPException(404, "Workspace object not found")
    floor_id = obj.floor_id
    db.delete(obj)
    db.commit()

    await _broadcast_layout_update(floor_id, "object_deleted", {"id": obj_id})
    return {"message": "Workspace object deleted"}


@router.post("/bulk-update", response_model=List[WorkspaceObjectOut])
async def bulk_update_workspace_objects(
    ids: List[int],
    updates: List[WorkspaceObjectUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    """Bulk-update geometry/properties — used by the layout editor on drag/resize."""
    if len(ids) != len(updates):
        raise HTTPException(400, "ids and updates must be the same length")

    result = []
    floor_ids_affected: set = set()

    for obj_id, upd in zip(ids, updates):
        obj = db.query(WorkspaceObject).filter(WorkspaceObject.id == obj_id).first()
        if not obj:
            continue
        for k, v in upd.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        floor_ids_affected.add(obj.floor_id)
        result.append(obj)

    db.commit()
    for obj in result:
        db.refresh(obj)

    out_list = [WorkspaceObjectOut.model_validate(o) for o in result]

    for fid in floor_ids_affected:
        await _broadcast_layout_update(
            fid,
            "bulk_updated",
            [o.model_dump(mode="json") for o in out_list if o.floor_id == fid],
        )

    return out_list
