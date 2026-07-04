"use client"
import React, { useRef, useState, useCallback, useEffect } from "react"
import {
  Stage,
  Layer,
  Rect,
  Text,
  Group,
  Transformer,
  Image as KonvaImage,
} from "react-konva"
import useImage from "use-image"
import type Konva from "konva"
import { WorkspaceObject } from "@/types"
import { OBJECT_CONFIGS, STATUS_COLORS } from "@/lib/workspaceConfig"
import { useLayoutStore } from "@/store/layoutStore"

// ─── Blueprint grid pattern ──────────────────────────────────────────────────

function buildGridPattern(gridSize: number): HTMLCanvasElement {
  const major = gridSize * 5
  const c = document.createElement("canvas")
  c.width = major
  c.height = major
  const ctx = c.getContext("2d")!

  ctx.fillStyle = "#0b1426"
  ctx.fillRect(0, 0, major, major)

  // Minor lines
  ctx.strokeStyle = "rgba(59,130,246,0.10)"
  ctx.lineWidth = 0.5
  for (let x = 0; x <= major; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, major); ctx.stroke()
  }
  for (let y = 0; y <= major; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(major, y + 0.5); ctx.stroke()
  }

  // Major lines
  ctx.strokeStyle = "rgba(59,130,246,0.28)"
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0.5, 0); ctx.lineTo(0.5, major); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, 0.5); ctx.lineTo(major, 0.5); ctx.stroke()

  return c
}

function snap(value: number, grid: number) {
  return Math.round(value / grid) * grid
}

// ─── Background image ────────────────────────────────────────────────────────

function BgImage({ url, w, h }: { url: string; w: number; h: number }) {
  const [img] = useImage(url)
  if (!img) return null
  return <KonvaImage image={img} x={0} y={0} width={w} height={h} opacity={0.38} />
}

// ─── Single object shape ─────────────────────────────────────────────────────

interface ObjShapeProps {
  obj: WorkspaceObject
  isSelected: boolean
  readOnly: boolean
  shouldSnap: boolean
  gridSize: number
  onSelect: () => void
  onChange: (c: Partial<WorkspaceObject>) => void
}

function ObjShape({ obj, isSelected, readOnly, shouldSnap, gridSize, onSelect, onChange }: ObjShapeProps) {
  const groupRef = useRef<Konva.Group>(null)
  const rectRef = useRef<Konva.Rect>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const cfg = OBJECT_CONFIGS[obj.object_type]

  const isWall = obj.object_type === "wall"
  const isBoundary = obj.object_type === "room_boundary"
  const isPath = obj.object_type === "pathway"

  const fill = isWall
    ? "#1e3a5f"
    : isBoundary
    ? "transparent"
    : obj.is_bookable
    ? STATUS_COLORS[obj.status] + "20"
    : cfg.fillColor + "d0"

  const stroke = isSelected ? "#60a5fa" : isWall ? "#2563eb" : cfg.strokeColor

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    let x = e.target.x()
    let y = e.target.y()
    if (shouldSnap) { x = snap(x, gridSize); y = snap(y, gridSize); e.target.position({ x, y }) }
    onChange({ x, y })
  }

  const handleTransformEnd = () => {
    const node = groupRef.current!
    const sx = node.scaleX(); const sy = node.scaleY()
    node.scaleX(1); node.scaleY(1)
    let w = Math.max(20, Math.round(obj.width * sx))
    let h = Math.max(20, Math.round(obj.height * sy))
    let x = node.x(); let y = node.y()
    if (shouldSnap) { w = snap(w, gridSize); h = snap(h, gridSize); x = snap(x, gridSize); y = snap(y, gridSize) }
    onChange({ x, y, width: w, height: h, rotation: node.rotation() })
  }

  const fs = Math.min(13, Math.max(8, Math.min(obj.width, obj.height) / 5.5))
  const labelY = obj.height / 2 - fs / 2 - (obj.is_bookable && obj.capacity > 1 && obj.height > 40 ? 7 : 0)

  return (
    <>
      <Group
        ref={groupRef}
        x={obj.x} y={obj.y}
        rotation={obj.rotation || 0}
        draggable={!readOnly && !obj.is_locked}
        onClick={(e) => { e.cancelBubble = true; onSelect() }}
        onTap={(e) => { e.cancelBubble = true; onSelect() }}
        onDragEnd={handleDragEnd}
        onMouseEnter={(e) => {
          if (!readOnly && !obj.is_locked) {
            const stage = e.target.getStage()
            if (stage) stage.container().style.cursor = "move"
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage()
          if (stage) stage.container().style.cursor = "default"
        }}
      >
        <Rect
          ref={rectRef}
          width={obj.width} height={obj.height}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : isWall ? 3 : 1.5}
          cornerRadius={isWall || isPath ? 2 : 6}
          dash={isBoundary ? [10, 5] : undefined}
          shadowBlur={isSelected ? 14 : 0}
          shadowColor="#3b82f6"
          shadowOpacity={0.55}
          onTransformEnd={handleTransformEnd}
        />

        {/* Status dot */}
        {obj.is_bookable && obj.width > 36 && (
          <Rect
            x={obj.width - 13} y={5}
            width={8} height={8}
            fill={STATUS_COLORS[obj.status]}
            cornerRadius={4}
            shadowBlur={5}
            shadowColor={STATUS_COLORS[obj.status]}
            shadowOpacity={0.8}
          />
        )}

        {/* Label */}
        {obj.width > 28 && obj.height > 18 && (
          <Text
            text={obj.label || cfg.label}
            x={4} y={labelY}
            width={obj.width - 8}
            align="center"
            fontSize={fs}
            fontFamily="'Inter', 'SF Pro Display', sans-serif"
            fontStyle={isWall ? "bold" : "normal"}
            fill={isWall ? "#93c5fd" : "#e2e8f0"}
            ellipsis wrap="none"
          />
        )}

        {/* Capacity */}
        {obj.is_bookable && obj.capacity > 1 && obj.height > 38 && (
          <Text
            text={`${obj.capacity} seats`}
            x={4} y={obj.height / 2 + fs / 2 + 2}
            width={obj.width - 8}
            align="center"
            fontSize={Math.max(8, fs - 3)}
            fill="#64748b"
            wrap="none"
          />
        )}

        {/* Lock badge */}
        {obj.is_locked && (
          <Text text="🔒" x={3} y={3} fontSize={9} />
        )}
      </Group>

      {isSelected && !readOnly && !obj.is_locked && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={[
            "top-left","top-right","bottom-left","bottom-right",
            "middle-left","middle-right","top-center","bottom-center",
          ]}
          borderStroke="#60a5fa"
          borderStrokeWidth={1.5}
          anchorStroke="#3b82f6"
          anchorFill="#1e3a5f"
          anchorSize={9}
          anchorCornerRadius={2}
          boundBoxFunc={(old, next) => (next.width < 20 || next.height < 20 ? old : next)}
        />
      )}
    </>
  )
}

// ─── Main canvas export ───────────────────────────────────────────────────────

export interface LayoutCanvasProps {
  objects: WorkspaceObject[]
  selectedId: number | null
  readOnly?: boolean
  canvasWidth: number
  canvasHeight: number
  backgroundImageUrl?: string | null
  onSelect: (id: number | null) => void
  onObjectChange: (id: number, changes: Partial<WorkspaceObject>) => void
  stageRef?: React.RefObject<Konva.Stage>
}

export default function LayoutCanvas({
  objects,
  selectedId,
  readOnly = false,
  canvasWidth,
  canvasHeight,
  backgroundImageUrl,
  onSelect,
  onObjectChange,
  stageRef: externalRef,
}: LayoutCanvasProps) {
  const internalRef = useRef<Konva.Stage>(null)
  const stageRef = externalRef ?? internalRef
  const containerRef = useRef<HTMLDivElement>(null)

  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 40, y: 40 })
  const [size, setSize] = useState({ w: 900, h: 600 })
  const [gridPattern, setGridPattern] = useState<HTMLImageElement | null>(null)

  const { snapToGrid, gridSize, showGrid } = useLayoutStore()

  // Build grid pattern — Konva accepts HTMLCanvasElement at runtime; cast for TS
  useEffect(() => {
    setGridPattern(buildGridPattern(gridSize) as unknown as HTMLImageElement)
  }, [gridSize])

  // Observe container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Fit to screen on first render / canvas dimension change
  useEffect(() => {
    if (size.w === 0) return
    const fit = Math.min((size.w - 80) / canvasWidth, (size.h - 80) / canvasHeight, 1)
    const s = Math.max(0.15, fit)
    setScale(s)
    setPosition({
      x: (size.w - canvasWidth * s) / 2,
      y: (size.h - canvasHeight * s) / 2,
    })
  }, [size.w, size.h, canvasWidth, canvasHeight]) // eslint-disable-line

  // Wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return
      const ptr = stage.getPointerPosition()
      if (!ptr) return
      const dir = e.evt.deltaY < 0 ? 1 : -1
      const next = Math.min(Math.max(scale * (dir > 0 ? 1.12 : 0.89), 0.08), 6)
      setScale(next)
      setPosition({
        x: ptr.x - (ptr.x - position.x) * (next / scale),
        y: ptr.y - (ptr.y - position.y) * (next / scale),
      })
    },
    [scale, position, stageRef]
  )

  const fitToScreen = () => {
    const fit = Math.min((size.w - 80) / canvasWidth, (size.h - 80) / canvasHeight, 1)
    const s = Math.max(0.15, fit)
    setScale(s)
    setPosition({ x: (size.w - canvasWidth * s) / 2, y: (size.h - canvasHeight * s) / 2 })
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full overflow-hidden"
      style={{ background: "#060d1f" }}
    >
      <Stage
        ref={stageRef}
        width={size.w} height={size.h}
        scaleX={scale} scaleY={scale}
        x={position.x} y={position.y}
        onWheel={handleWheel}
        onClick={(e) => { if (e.target === e.target.getStage()) onSelect(null) }}
        onTap={(e) => { if (e.target === e.target.getStage()) onSelect(null) }}
        draggable={readOnly}
        onDragEnd={(e) => { if (readOnly) setPosition({ x: e.target.x(), y: e.target.y() }) }}
      >
        {/* ── Background layer ── */}
        <Layer listening={false}>
          {/* void fill */}
          <Rect x={-5000} y={-5000} width={10000 + canvasWidth} height={10000 + canvasHeight} fill="#060d1f" />

          {/* Blueprint grid */}
          {showGrid && gridPattern ? (
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight}
              fillPatternImage={gridPattern} fillPatternRepeat="repeat" />
          ) : (
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#0b1426" />
          )}

          {/* Canvas border */}
          <Rect x={0} y={0} width={canvasWidth} height={canvasHeight}
            stroke="rgba(59,130,246,0.45)" strokeWidth={1} fill="transparent" />

          {/* Corner rulers */}
          <Text text={`0,0`} x={4} y={4} fontSize={9} fill="rgba(148,163,184,0.4)" />
          <Text text={`${canvasWidth}`} x={canvasWidth - 30} y={4} fontSize={9} fill="rgba(148,163,184,0.4)" />
          <Text text={`${canvasHeight}`} x={4} y={canvasHeight - 14} fontSize={9} fill="rgba(148,163,184,0.4)" />

          {/* Dimension labels */}
          <Text text={`${canvasWidth} px`} x={canvasWidth / 2 - 20} y={-18}
            fontSize={10} fill="rgba(100,116,139,0.7)" />
          <Text text={`${canvasHeight} px`} x={-38} y={canvasHeight / 2}
            fontSize={10} fill="rgba(100,116,139,0.7)" rotation={-90} />

          {/* Background image */}
          {backgroundImageUrl && (
            <BgImage url={backgroundImageUrl} w={canvasWidth} h={canvasHeight} />
          )}
        </Layer>

        {/* ── Objects layer ── */}
        <Layer>
          {objects.map((obj) => (
            <ObjShape
              key={obj.id}
              obj={obj}
              isSelected={selectedId === obj.id}
              readOnly={readOnly}
              shouldSnap={snapToGrid}
              gridSize={gridSize}
              onSelect={() => onSelect(obj.id)}
              onChange={(c) => onObjectChange(obj.id, c)}
            />
          ))}
        </Layer>
      </Stage>

      {/* ── Zoom controls ── */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
        {[
          { label: "+", action: () => setScale((s) => Math.min(s * 1.2, 6)) },
          { label: "FIT", action: fitToScreen },
          { label: "−", action: () => setScale((s) => Math.max(s / 1.2, 0.08)) },
        ].map(({ label, action }) => (
          <button key={label} onClick={action}
            className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700/70 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white text-xs backdrop-blur-sm transition-colors">
            {label}
          </button>
        ))}
      </div>

      {/* ── HUD ── */}
      <div className="absolute bottom-3 right-3 z-20 bg-slate-900/80 border border-slate-700/60 rounded px-2 py-0.5 text-[11px] text-slate-400 font-mono backdrop-blur-sm">
        {Math.round(scale * 100)}%
      </div>
      {snapToGrid && (
        <div className="absolute bottom-3 left-3 z-20 bg-blue-950/70 border border-blue-800/50 rounded px-2 py-0.5 text-[11px] text-blue-400 backdrop-blur-sm">
          ⊞ snap {gridSize}px
        </div>
      )}
    </div>
  )
}
