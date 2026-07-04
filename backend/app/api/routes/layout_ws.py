"""
WebSocket endpoint for real-time layout updates.

Connect:  ws://host/ws/layout/{floor_id}?token=<jwt>

The server broadcasts JSON events whenever an admin edits the layout:
  { "event": "object_created" | "object_updated" | "object_deleted"
              | "status_changed" | "bulk_updated",
    "data": { ... } }
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.ws_manager import layout_manager
from app.core.security import decode_access_token

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/layout/{floor_id}")
async def layout_websocket(
    websocket: WebSocket,
    floor_id: int,
    token: str = Query(default=""),
):
    # Lightweight auth — reject unauthenticated connections
    payload = decode_access_token(token) if token else None
    if not payload:
        await websocket.close(code=4001)
        return

    await layout_manager.connect(websocket, floor_id)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        layout_manager.disconnect(websocket, floor_id)
