"use client"
import React, { useRef, useEffect } from "react"
import { WorkspaceObject } from "@/types"
import { OBJECT_CONFIGS, STATUS_COLORS } from "@/lib/workspaceConfig"

interface MinimapProps {
  objects: WorkspaceObject[]
  canvasWidth: number
  canvasHeight: number
  selectedId: number | null
}

const MINIMAP_W = 160
const MINIMAP_H = 100

export default function Minimap({ objects, canvasWidth, canvasHeight, selectedId }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ctx = el.getContext("2d")
    if (!ctx) return

    const scaleX = MINIMAP_W / canvasWidth
    const scaleY = MINIMAP_H / canvasHeight

    // Background
    ctx.fillStyle = "#0b1426"
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

    // Grid hint
    ctx.strokeStyle = "rgba(59,130,246,0.12)"
    ctx.lineWidth = 0.5
    const gx = 100 * scaleX
    const gy = 100 * scaleY
    for (let x = 0; x < MINIMAP_W; x += gx) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MINIMAP_H); ctx.stroke()
    }
    for (let y = 0; y < MINIMAP_H; y += gy) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MINIMAP_W, y); ctx.stroke()
    }

    // Canvas border
    ctx.strokeStyle = "rgba(59,130,246,0.4)"
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, MINIMAP_W, MINIMAP_H)

    // Objects
    for (const obj of objects) {
      const mx = obj.x * scaleX
      const my = obj.y * scaleY
      const mw = Math.max(2, obj.width * scaleX)
      const mh = Math.max(2, obj.height * scaleY)

      const cfg = OBJECT_CONFIGS[obj.object_type]
      const isSelected = obj.id === selectedId
      const isWall = obj.object_type === "wall"
      const fill = isWall
        ? "#1e3a5f"
        : obj.is_bookable
        ? STATUS_COLORS[obj.status] + "60"
        : cfg.fillColor + "80"

      ctx.save()
      if (obj.rotation) {
        ctx.translate(mx + mw / 2, my + mh / 2)
        ctx.rotate((obj.rotation * Math.PI) / 180)
        ctx.translate(-mw / 2, -mh / 2)
      } else {
        ctx.translate(mx, my)
      }

      ctx.fillStyle = fill
      ctx.fillRect(0, 0, mw, mh)

      ctx.strokeStyle = isSelected ? "#60a5fa" : isWall ? "#2563eb" : cfg.strokeColor + "cc"
      ctx.lineWidth = isSelected ? 1.5 : 0.8
      ctx.strokeRect(0, 0, mw, mh)

      ctx.restore()
    }
  }, [objects, canvasWidth, canvasHeight, selectedId])

  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(8,16,34,0.95)",
        border: "1px solid rgba(59,130,246,0.22)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="px-2 py-1 flex items-center justify-between border-b border-blue-900/25">
        <p className="text-[8px] font-bold tracking-widest text-blue-400/60 uppercase">Minimap</p>
        <p className="text-[8px] text-slate-600">{objects.length} obj</p>
      </div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        className="block"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  )
}
