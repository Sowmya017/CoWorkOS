"use client"
import { useEffect, useRef, useCallback } from "react"
import Cookies from "js-cookie"
import { LayoutWSEvent, WorkspaceObject, WorkspaceStatus } from "@/types"

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  .replace(/^http/, "ws")

interface UseLayoutSyncOptions {
  floorId: number | null
  onObjectCreated?: (obj: WorkspaceObject) => void
  onObjectUpdated?: (obj: WorkspaceObject) => void
  onObjectDeleted?: (id: number) => void
  onStatusChanged?: (id: number, status: WorkspaceStatus) => void
  onBulkUpdated?: (objects: WorkspaceObject[]) => void
}

export function useLayoutSync({
  floorId,
  onObjectCreated,
  onObjectUpdated,
  onObjectDeleted,
  onStatusChanged,
  onBulkUpdated,
}: UseLayoutSyncOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!floorId) return
    const token = Cookies.get("access_token") || ""
    const url = `${WS_BASE}/ws/layout/${floorId}?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const msg: LayoutWSEvent = JSON.parse(e.data)
        switch (msg.event) {
          case "object_created":
            onObjectCreated?.(msg.data)
            break
          case "object_updated":
            onObjectUpdated?.(msg.data)
            break
          case "object_deleted":
            onObjectDeleted?.(msg.data.id)
            break
          case "status_changed":
            onStatusChanged?.(msg.data.id, msg.data.status)
            break
          case "bulk_updated":
            onBulkUpdated?.(msg.data)
            break
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()

    // Heartbeat
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping")
    }, 25000)

    ws.addEventListener("close", () => clearInterval(ping))
  }, [floorId, onObjectCreated, onObjectUpdated, onObjectDeleted, onStatusChanged, onBulkUpdated])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])
}
