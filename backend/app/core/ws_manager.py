"""
WebSocket connection manager for real-time layout sync.
Rooms are keyed by floor_id so all viewers of a floor receive updates instantly.
"""
from typing import Dict, List
from fastapi import WebSocket
import json


class LayoutConnectionManager:
    def __init__(self):
        # floor_id -> list of active WebSocket connections
        self._rooms: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, floor_id: int):
        await websocket.accept()
        self._rooms.setdefault(floor_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, floor_id: int):
        room = self._rooms.get(floor_id, [])
        if websocket in room:
            room.remove(websocket)

    async def broadcast(self, floor_id: int, payload: dict):
        """Send a JSON payload to every connection watching floor_id."""
        dead: List[WebSocket] = []
        for ws in self._rooms.get(floor_id, []):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, floor_id)


layout_manager = LayoutConnectionManager()
