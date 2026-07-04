"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useDebounce } from "use-debounce"
import { Floor, LayoutVersion, LayoutVersionDetail, WorkspaceObject, WorkspaceObjectType } from "@/types"
import { floorsApi, layoutVersionsApi, workspaceObjectsApi } from "@/lib/api"
import { OBJECT_CONFIGS } from "@/lib/workspaceConfig"
import WorkspaceToolbar from "@/components/layout-editor/WorkspaceToolbar"
import WorkspaceProperties from "@/components/layout-editor/WorkspaceProperties"
import Minimap from "@/components/layout-editor/Minimap"
import { useLayoutSync } from "@/hooks/useLayoutSync"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/AuthContext"
import { useLayoutStore } from "@/store/layoutStore"

const LayoutCanvas = dynamic(() => import("@/components/layout-editor/LayoutCanvas"), { ssr: false })
const AICopilot = dynamic(() => import("@/components/layout-editor/AICopilot"), { ssr: false })

// ─── Temp id helper ───────────────────────────────────────────────────────────
let _tmpId = -1
function tempId() { return _tmpId-- }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LayoutEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const floorId = Number(params.id)

  // Server state
  const [floor, setFloor] = useState<Floor | null>(null)
  const [versions, setVersions] = useState<LayoutVersion[]>([])
  const [activeVersion, setActiveVersion] = useState<LayoutVersionDetail | null>(null)
  const [objects, setObjects] = useState<WorkspaceObject[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [unsavedCount, setUnsavedCount] = useState(0)
  const [pendingSaves, setPendingSaves] = useState<Map<number, Partial<WorkspaceObject>>>(new Map())
  const [debouncedPending] = useDebounce(pendingSaves, 800)

  // Background image upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUploadBackground = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeVersion) return
    setUploading(true)
    try {
      let uploadFile = file

      // PDFs can't render directly on a canvas — convert first page to PNG using PDF.js
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        toast({ title: "Converting PDF to image…" })
        try {
          const pdfjs = await import("pdfjs-dist")
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
          const page = await pdf.getPage(1)
          const viewport = page.getViewport({ scale: 2 }) // 2x for sharpness
          const offscreen = document.createElement("canvas")
          offscreen.width = viewport.width
          offscreen.height = viewport.height
          const ctx = offscreen.getContext("2d")!
          await page.render({ canvasContext: ctx, viewport, canvas: offscreen }).promise
          const blob: Blob = await new Promise((res) =>
            offscreen.toBlob((b) => res(b!), "image/png")
          )
          uploadFile = new File([blob], file.name.replace(/\.pdf$/i, ".png"), { type: "image/png" })
        } catch {
          toast({ title: "Could not convert PDF — upload a PNG/JPG instead", variant: "destructive" })
          return
        }
      }

      const { data: asset } = await floorsApi.uploadAsset(floorId, uploadFile)
      const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${asset.url}`
      await layoutVersionsApi.update(activeVersion.id, { background_image_url: imageUrl })
      setActiveVersion((v) => v ? { ...v, background_image_url: imageUrl } : v)
      toast({ title: "Background image set" })
    } catch {
      toast({ title: "Upload failed", variant: "destructive" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [activeVersion, floorId, toast])

  // Version modal state
  const [showVersionInput, setShowVersionInput] = useState(false)
  const [newVersionLabel, setNewVersionLabel] = useState("")

  // UI store
  const {
    showMinimap, showAICopilot, showLeftPanel,
    toggleMinimap, toggleAICopilot, toggleLeftPanel,
    pushHistory, undo, redo, canUndo, canRedo, resetHistory,
  } = useLayoutStore()

  const isAdmin = user?.role === "super_admin" || user?.role === "branch_manager"
  const selectedObject = objects.find((o) => o.id === selectedId) ?? null

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!floorId) return
    floorsApi.get(floorId).then((r) => setFloor(r.data))

    layoutVersionsApi.list({ floor_id: floorId }).then(async (r) => {
      const list: LayoutVersion[] = r.data
      setVersions(list)

      // Try active version first
      try {
        const res = await layoutVersionsApi.getActive(floorId)
        setActiveVersion(res.data)
        const objs = res.data.workspace_objects || []
        setObjects(objs)
        resetHistory(objs)
        return
      } catch {}

      // Fall back to latest version in list
      if (list.length > 0) {
        try {
          const res = await layoutVersionsApi.get(list[list.length - 1].id)
          setActiveVersion(res.data)
          const objs = res.data.workspace_objects || []
          setObjects(objs)
          resetHistory(objs)
          return
        } catch {}
      }

      // No versions exist at all — auto-create one for admins so the canvas opens immediately
      if (isAdmin) {
        try {
          const { data: created } = await layoutVersionsApi.create({
            floor_id: floorId,
            label: "Default Layout",
          })
          await layoutVersionsApi.activate(created.id)
          const { data: detail } = await layoutVersionsApi.get(created.id)
          setVersions([created])
          setActiveVersion(detail)
          setObjects([])
          resetHistory([])
          toast({ title: "Canvas ready — start designing!" })
        } catch {
          toast({ title: "Could not create layout", variant: "destructive" })
        }
      }
    })
  }, [floorId]) // eslint-disable-line

  // ── Real-time WebSocket ──────────────────────────────────────────────────
  useLayoutSync({
    floorId,
    onObjectCreated: (obj) => setObjects((p) => [...p.filter((o) => o.id !== obj.id), obj]),
    onObjectUpdated: (obj) => setObjects((p) => p.map((o) => (o.id === obj.id ? obj : o))),
    onObjectDeleted: (id) => setObjects((p) => p.filter((o) => o.id !== id)),
    onStatusChanged: (id, status) => setObjects((p) => p.map((o) => (o.id === id ? { ...o, status } : o))),
    onBulkUpdated: (updated) => setObjects((p) => {
      const map = new Map(updated.map((u) => [u.id, u]))
      return p.map((o) => map.get(o.id) ?? o)
    }),
  })

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const flushSaves = useCallback(async (pending: Map<number, Partial<WorkspaceObject>>, manual = false) => {
    if (pending.size === 0) {
      // Nothing pending — objects were already saved on create/auto-save
      if (manual) {
        setSavedAt(new Date())
        setUnsavedCount(0)
        toast({ title: "✓ Layout is saved" })
      }
      return
    }
    setSaving(true)
    await Promise.all(
      Array.from(pending.entries()).map(([id, changes]) => {
        if (id < 0) return Promise.resolve()
        return workspaceObjectsApi.update(id, changes).catch(console.error)
      })
    )
    setSaving(false)
    setUnsavedCount(0)
    setSavedAt(new Date())
    setPendingSaves(new Map())
    if (manual) toast({ title: "✓ Layout saved" })
  }, [toast])

  useEffect(() => {
    if (debouncedPending.size === 0) return
    flushSaves(debouncedPending)
  }, [debouncedPending, flushSaves])

  // ── Object change ─────────────────────────────────────────────────────────
  const handleObjectChange = useCallback((id: number, changes: Partial<WorkspaceObject>) => {
    setObjects((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, ...changes } : o))
      pushHistory(next)
      return next
    })
    if (id > 0) {
      setPendingSaves((p) => { const n = new Map(p); n.set(id, { ...(n.get(id) || {}), ...changes }); return n })
      setUnsavedCount((c) => c + 1)
      setSavedAt(null)
    }
  }, [pushHistory])

  // ── Add object ────────────────────────────────────────────────────────────
  const handleAddObject = useCallback(async (type: WorkspaceObjectType) => {
    if (!activeVersion || !isAdmin) return
    const cfg = OBJECT_CONFIGS[type]
    const tmp: WorkspaceObject = {
      id: tempId(),
      layout_version_id: activeVersion.id,
      floor_id: floorId,
      branch_id: floor?.branch_id || 0,
      object_type: type,
      label: cfg.label,
      x: 60 + Math.random() * 300,
      y: 60 + Math.random() * 200,
      width: cfg.defaultWidth,
      height: cfg.defaultHeight,
      rotation: 0,
      capacity: 1,
      price_per_hour: 0, price_per_day: 0, price_per_month: 0,
      status: "available",
      is_locked: false,
      is_bookable: cfg.isBookable,
      created_at: new Date().toISOString(),
    }
    setObjects((p) => { const n = [...p, tmp]; pushHistory(n); return n })
    try {
      const { data } = await workspaceObjectsApi.create({
        layout_version_id: activeVersion.id,
        floor_id: floorId,
        branch_id: floor?.branch_id,
        object_type: type,
        label: cfg.label,
        x: tmp.x, y: tmp.y,
        width: cfg.defaultWidth,
        height: cfg.defaultHeight,
        is_bookable: cfg.isBookable,
      })
      setObjects((p) => p.map((o) => (o.id === tmp.id ? data : o)))
      setSelectedId(data.id)
    } catch {
      setObjects((p) => p.filter((o) => o.id !== tmp.id))
      toast({ title: "Failed to add object", variant: "destructive" })
    }
  }, [activeVersion, floorId, floor, isAdmin, pushHistory, toast])

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteSelected = useCallback(async () => {
    if (selectedId === null) return
    setObjects((p) => { const n = p.filter((o) => o.id !== selectedId); pushHistory(n); return n })
    setSelectedId(null)
    if (selectedId > 0) {
      await workspaceObjectsApi.delete(selectedId).catch(() =>
        toast({ title: "Delete failed", variant: "destructive" })
      )
    }
  }, [selectedId, pushHistory, toast])

  const handleClearAll = useCallback(async () => {
    const ids = objects.filter((o) => o.id > 0).map((o) => o.id)
    setObjects([]); setSelectedId(null); pushHistory([])
    await Promise.all(ids.map((id) => workspaceObjectsApi.delete(id).catch(() => {})))
  }, [objects, pushHistory])

  // ── Duplicate ─────────────────────────────────────────────────────────────
  const handleDuplicateSelected = useCallback(async () => {
    if (selectedId === null || !activeVersion || !isAdmin) return
    const obj = objects.find((o) => o.id === selectedId)
    if (!obj) return
    const { data } = await workspaceObjectsApi.create({
      layout_version_id: activeVersion.id,
      floor_id: obj.floor_id, branch_id: obj.branch_id,
      object_type: obj.object_type,
      label: obj.label ? `${obj.label} (copy)` : undefined,
      x: obj.x + 24, y: obj.y + 24,
      width: obj.width, height: obj.height,
      rotation: obj.rotation, capacity: obj.capacity,
      price_per_hour: obj.price_per_hour,
      price_per_day: obj.price_per_day,
      price_per_month: obj.price_per_month,
      is_bookable: obj.is_bookable, amenities: obj.amenities,
    })
    setObjects((p) => { const n = [...p, data]; pushHistory(n); return n })
    setSelectedId(data.id)
  }, [selectedId, objects, activeVersion, isAdmin, pushHistory])

  // ── Lock ──────────────────────────────────────────────────────────────────
  const handleToggleLock = useCallback(() => {
    if (selectedId === null) return
    const obj = objects.find((o) => o.id === selectedId)
    if (!obj) return
    handleObjectChange(selectedId, { is_locked: !obj.is_locked })
  }, [selectedId, objects, handleObjectChange])

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const prev = undo()
    if (prev) setObjects(prev)
  }, [undo])

  const handleRedo = useCallback(() => {
    const next = redo()
    if (next) setObjects(next)
  }, [redo])

  // ── Version management ────────────────────────────────────────────────────
  const handleCreateVersion = useCallback(async () => {
    const label = newVersionLabel.trim() || "Untitled Layout"
    setShowVersionInput(false); setNewVersionLabel("")
    const { data } = await layoutVersionsApi.create({ floor_id: floorId, label })
    setVersions((p) => [...p, data])
    await layoutVersionsApi.activate(data.id)
    const detail = await layoutVersionsApi.get(data.id)
    setActiveVersion(detail.data)
    setObjects(detail.data.workspace_objects || [])
    toast({ title: `"${label}" created and activated` })
  }, [floorId, newVersionLabel, toast])

  const handleSwitchVersion = useCallback(async (versionId: number) => {
    const { data } = await layoutVersionsApi.get(versionId)
    setActiveVersion(data)
    const objs = data.workspace_objects || []
    setObjects(objs); resetHistory(objs); setSelectedId(null)
  }, [resetHistory])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === "z") { e.preventDefault(); handleUndo() }
      if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); handleRedo() }
      if (ctrl && e.key === "d") { e.preventDefault(); handleDuplicateSelected() }
      if (ctrl && e.key === "s") { e.preventDefault(); flushSaves(pendingSaves) }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId !== null && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        handleDeleteSelected()
      }
      if (e.key === "Escape") setSelectedId(null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleUndo, handleRedo, handleDuplicateSelected, handleDeleteSelected, flushSaves, pendingSaves, selectedId])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 64px)", background: "#060d1f", color: "#e2e8f0" }}
    >
      {/* ─── Top header bar ─────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 h-11 flex-shrink-0 gap-3"
        style={{ borderBottom: "1px solid rgba(59,130,246,0.16)", background: "rgba(8,16,34,0.98)" }}
      >
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-200 text-sm transition-colors flex-shrink-0">
            ← Back
          </button>
          <span className="text-slate-700">|</span>
          {isAdmin && (
            <button
              onClick={toggleLeftPanel}
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors flex-shrink-0"
              title="Toggle toolbar"
            >
              ☰
            </button>
          )}
          <h1 className="text-sm font-semibold text-slate-200 truncate">
            {floor?.name || "…"}
            <span className="text-slate-500 font-normal ml-1">Floor {floor?.floor_number}</span>
          </h1>
        </div>

        {/* Center: undo/redo + save status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && (
            <>
              <button onClick={handleUndo} disabled={!canUndo()}
                title="Undo (Ctrl+Z)"
                className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-30 text-xs flex items-center justify-center transition-colors">
                ↩
              </button>
              <button onClick={handleRedo} disabled={!canRedo()}
                title="Redo (Ctrl+Y)"
                className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-30 text-xs flex items-center justify-center transition-colors">
                ↪
              </button>
            </>
          )}
          {saving && <span className="text-xs text-slate-500 animate-pulse">saving…</span>}
          {!saving && savedAt && unsavedCount === 0 && (
            <span className="text-xs text-green-500/80">✓ saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          )}
          {!saving && unsavedCount > 0 && (
            <span className="text-xs text-amber-400/80">● {unsavedCount} unsaved</span>
          )}
        </div>

        {/* Right: version + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Version selector */}
          <select
            value={activeVersion?.id || ""}
            onChange={(e) => handleSwitchVersion(Number(e.target.value))}
            className="text-xs bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-600"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version_number} — {v.label || "Untitled"}{v.is_active ? " ✓" : ""}
              </option>
            ))}
          </select>

          {isAdmin && (
            <>
              {showVersionInput ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={newVersionLabel}
                    onChange={(e) => setNewVersionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateVersion()
                      if (e.key === "Escape") { setShowVersionInput(false); setNewVersionLabel("") }
                    }}
                    placeholder="Version label…"
                    className="text-xs bg-slate-800 border border-blue-600 rounded px-2 py-1 w-36 text-slate-200 focus:outline-none"
                  />
                  <button onClick={handleCreateVersion} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">✓</button>
                  <button onClick={() => { setShowVersionInput(false); setNewVersionLabel("") }} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">✕</button>
                </div>
              ) : (
                <button onClick={() => setShowVersionInput(true)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors">
                  + Version
                </button>
              )}

              {activeVersion && !activeVersion.is_active && (
                <button
                  onClick={async () => {
                    await layoutVersionsApi.activate(activeVersion.id)
                    setVersions((p) => p.map((v) => ({ ...v, is_active: v.id === activeVersion.id })))
                    setActiveVersion((v) => v ? { ...v, is_active: true } : v)
                    toast({ title: "Layout activated" })
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-green-900/40 border border-green-700/50 text-green-400 hover:bg-green-800/40 transition-colors"
                >
                  Activate
                </button>
              )}

              <button
                onClick={() => flushSaves(pendingSaves, true)}
                disabled={saving}
                className="text-xs px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}

          {/* Background image upload */}
          {isAdmin && activeVersion && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
                className="hidden"
                onChange={handleUploadBackground}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Upload background image (PNG, JPG, PDF…)"
                className="text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                {uploading ? "Uploading…" : "📷 BG"}
              </button>
              {activeVersion.background_image_url && (
                <button
                  onClick={async () => {
                    await layoutVersionsApi.update(activeVersion.id, { background_image_url: null })
                    setActiveVersion((v) => v ? { ...v, background_image_url: null } : v)
                    toast({ title: "Background removed" })
                  }}
                  title="Remove background image"
                  className="text-xs px-2 py-1 rounded-md bg-slate-800 border border-red-900/50 text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  ✕ BG
                </button>
              )}
            </>
          )}

          {/* View toggles */}
          <div className="flex items-center gap-1 ml-1">
            <button onClick={toggleMinimap} title="Toggle minimap"
              className={["w-7 h-7 rounded-md border text-xs flex items-center justify-center transition-colors",
                showMinimap ? "bg-blue-900/50 border-blue-700 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"].join(" ")}>
              ⊡
            </button>
            <button onClick={toggleAICopilot} title="AI Copilot"
              className={["w-7 h-7 rounded-md border text-xs flex items-center justify-center transition-colors",
                showAICopilot ? "bg-blue-900/50 border-blue-700 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"].join(" ")}>
              ✦
            </button>
          </div>

          <a href={`/floors/${floorId}/book`}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
            👁 View
          </a>
        </div>
      </header>

      {/* ─── Editor body ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left toolbar */}
        {isAdmin && showLeftPanel && (
          <WorkspaceToolbar
            onAddObject={handleAddObject}
            onDeleteSelected={handleDeleteSelected}
            onDuplicateSelected={handleDuplicateSelected}
            onToggleLock={handleToggleLock}
            hasSelection={selectedId !== null}
            isLocked={selectedObject?.is_locked ?? false}
          />
        )}

        {/* Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {activeVersion ? (
            <LayoutCanvas
              objects={objects}
              selectedId={selectedId}
              readOnly={!isAdmin}
              canvasWidth={activeVersion.canvas_width}
              canvasHeight={activeVersion.canvas_height}
              backgroundImageUrl={activeVersion.background_image_url}
              onSelect={setSelectedId}
              onObjectChange={handleObjectChange}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <div className="text-5xl mb-4 opacity-30">⬚</div>
              <p className="text-sm mb-1">No layout version yet</p>
              {isAdmin && (
                <button onClick={() => setShowVersionInput(true)}
                  className="mt-3 text-xs px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  Create First Layout
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right properties panel */}
        {isAdmin && (
          <WorkspaceProperties
            object={selectedObject}
            onChange={(changes) => selectedId !== null && handleObjectChange(selectedId, changes)}
          />
        )}

        {/* ── Floating overlays ── */}

        {/* Minimap */}
        {showMinimap && activeVersion && (
          <div className="absolute bottom-4 right-4 z-30" style={{ pointerEvents: isAdmin ? "none" : "none" }}>
            <Minimap
              objects={objects}
              canvasWidth={activeVersion.canvas_width}
              canvasHeight={activeVersion.canvas_height}
              selectedId={selectedId}
            />
          </div>
        )}

        {/* AI Copilot */}
        {showAICopilot && (
          <div className="absolute bottom-4 right-4 z-40" style={{ bottom: showMinimap ? "140px" : "16px" }}>
            <AICopilot
              objects={objects}
              onAddObject={handleAddObject}
              onDeleteSelected={handleDeleteSelected}
              onClearAll={handleClearAll}
              onClose={toggleAICopilot}
            />
          </div>
        )}
      </div>

      {/* ─── Status bar ─────────────────────────────────────────────── */}
      <footer
        className="flex items-center gap-4 px-4 h-7 flex-shrink-0 text-[10px] text-slate-600"
        style={{ borderTop: "1px solid rgba(59,130,246,0.12)", background: "rgba(8,16,34,0.98)" }}
      >
        <span className="text-slate-500">{objects.length} objects</span>
        {selectedObject && (
          <span className="text-blue-400/70">
            Selected: {selectedObject.label || selectedObject.object_type.replace(/_/g, " ")}
            {" "}· {Math.round(selectedObject.width)}×{Math.round(selectedObject.height)}px
          </span>
        )}
        <span className="ml-auto">
          {[
            { color: "#22c55e", label: "Available" },
            { color: "#ef4444", label: "Occupied" },
            { color: "#3b82f6", label: "Reserved" },
            { color: "#9ca3af", label: "Maintenance" },
            { color: "#f59e0b", label: "Premium" },
          ].map(({ color, label }) => (
            <span key={label} className="inline-flex items-center gap-1 mr-3">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </span>
        <span className="text-slate-700">Scroll to zoom · Ctrl+Z undo</span>
      </footer>

      <Toaster />
    </div>
  )
}
