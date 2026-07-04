"use client"
import React, { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Floor, WorkspaceObject, LayoutVersionDetail } from "@/types"
import { floorsApi, layoutVersionsApi, workspaceBookingsApi } from "@/lib/api"
import { useLayoutSync } from "@/hooks/useLayoutSync"
import { STATUS_COLORS, OBJECT_CONFIGS } from "@/lib/workspaceConfig"
import WorkspaceBookingModal from "@/components/booking/WorkspaceBookingModal"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/AuthContext"

const LayoutCanvas = dynamic(() => import("@/components/layout-editor/LayoutCanvas"), { ssr: false })

export default function FloorBookingPage() {
  const params = useParams()
  const { user } = useAuth()
  const floorId = Number(params.id)
  const isAdmin = user?.role === "super_admin" || user?.role === "branch_manager"

  const [floor, setFloor] = useState<Floor | null>(null)
  const [activeVersion, setActiveVersion] = useState<LayoutVersionDetail | null>(null)
  const [objects, setObjects] = useState<WorkspaceObject[]>([])
  const [selectedObject, setSelectedObject] = useState<WorkspaceObject | null>(null)
  const [availability, setAvailability] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAvailability = useCallback(async () => {
    try {
      const { data } = await workspaceBookingsApi.availability(floorId)
      const map: Record<number, string> = {}
      data.forEach((a: any) => { map[a.id] = a.status })
      setAvailability(map)
    } catch {}
  }, [floorId])

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      floorsApi.get(floorId),
      layoutVersionsApi.getActive(floorId).catch(() => null),
    ])
      .then(([floorRes, layoutRes]) => {
        setFloor(floorRes.data)
        if (layoutRes) {
          setActiveVersion(layoutRes.data)
          setObjects(layoutRes.data.workspace_objects || [])
        }
        loadAvailability()
      })
      .catch((e) => {
        setError(e?.response?.data?.detail || "Failed to load floor data. Make sure the backend is running.")
      })
      .finally(() => setLoading(false))
  }, [floorId, loadAvailability])

  // Merge real-time availability into display objects
  const displayObjects = objects.map((o) => ({
    ...o,
    status: (availability[o.id] as any) || o.status,
  }))

  const bookableObjects = displayObjects.filter((o) => o.is_bookable)
  const availableCount = bookableObjects.filter((o) => o.status === "available").length

  // Real-time WebSocket updates
  useLayoutSync({
    floorId,
    onObjectCreated: (obj) => setObjects((prev) => [...prev.filter((o) => o.id !== obj.id), obj]),
    onObjectUpdated: (obj) => setObjects((prev) => prev.map((o) => (o.id === obj.id ? obj : o))),
    onObjectDeleted: (id) => setObjects((prev) => prev.filter((o) => o.id !== id)),
    onStatusChanged: (id, status) =>
      setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o))),
    onBulkUpdated: (updated) =>
      setObjects((prev) => {
        const map = new Map(updated.map((u) => [u.id, u]))
        return prev.map((o) => map.get(o.id) ?? o)
      }),
  })

  const handleSelect = (id: number | null) => {
    if (id === null) { setSelectedObject(null); return }
    const obj = displayObjects.find((o) => o.id === id)
    if (!obj?.is_bookable) return
    if (obj.status === "occupied" || obj.status === "maintenance") return
    setSelectedObject(obj)
  }

  const handleBooked = useCallback(() => {
    setSelectedObject(null)
    loadAvailability()
  }, [loadAvailability])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <Link href={`/floors/${floorId}/layout`}
                className="text-slate-500 hover:text-slate-700 text-sm">
                ← Edit Layout
              </Link>
              <span className="text-slate-300">|</span>
            </>
          )}
          <Link href="/floors" className="text-slate-500 hover:text-slate-700 text-sm">← Floors</Link>
          <span className="text-slate-300">|</span>
          <h1 className="font-semibold text-slate-800 text-sm">
            {loading ? "Loading…" : floor
              ? `${floor.name} · Floor ${floor.floor_number}`
              : "Book a Space"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Availability badge */}
          {!loading && activeVersion && bookableObjects.length > 0 && (
            <span className={[
              "text-xs font-semibold px-3 py-1 rounded-full border",
              availableCount > 0
                ? "text-green-700 bg-green-50 border-green-200"
                : "text-red-600 bg-red-50 border-red-200",
            ].join(" ")}>
              {availableCount > 0
                ? `${availableCount} space${availableCount !== 1 ? "s" : ""} available`
                : "Fully booked"}
            </span>
          )}

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: color }} />
                <span className="capitalize">{status}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* States */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading floor layout…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="text-sm font-medium text-red-600 mb-1">Could not load layout</p>
              <p className="text-xs text-slate-500 max-w-xs mb-4">{error}</p>
              <button onClick={() => window.location.reload()}
                className="text-xs px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && !activeVersion && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <p className="text-5xl mb-3">🏢</p>
              <p className="text-sm font-medium text-slate-600 mb-1">No floor plan yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                An admin needs to design the layout before spaces can be booked.
              </p>
              {isAdmin && (
                <Link href={`/floors/${floorId}/layout`}
                  className="inline-block mt-4 text-xs px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  ✏️ Create Layout
                </Link>
              )}
            </div>
          )}

          {!loading && !error && activeVersion && objects.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-sm font-medium text-slate-600 mb-1">Layout is empty</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No spaces have been added to this floor yet.
              </p>
              {isAdmin && (
                <Link href={`/floors/${floorId}/layout`}
                  className="inline-block mt-4 text-xs px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  ✏️ Add Spaces
                </Link>
              )}
            </div>
          )}

          {/* The canvas — takes full remaining height */}
          {!loading && !error && activeVersion && objects.length > 0 && (
            <div className="flex-1 min-h-0 relative">
              {/* Instruction bar */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-600 shadow-sm whitespace-nowrap">
                Click a <span className="text-green-600 font-semibold">green space</span> to book it
              </div>

              <LayoutCanvas
                objects={displayObjects}
                selectedId={selectedObject?.id ?? null}
                readOnly={true}
                canvasWidth={activeVersion.canvas_width}
                canvasHeight={activeVersion.canvas_height}
                backgroundImageUrl={activeVersion.background_image_url}
                onSelect={handleSelect}
                onObjectChange={() => {}}
              />
            </div>
          )}
        </div>

        {/* ── Right sidebar: bookable spaces list ── */}
        {!loading && !error && activeVersion && bookableObjects.length > 0 && (
          <aside className="w-64 flex-shrink-0 border-l border-slate-200 bg-slate-50 overflow-y-auto">
            <div className="px-4 py-3 border-b border-slate-200 bg-white">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available Spaces</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {availableCount} of {bookableObjects.length} free
              </p>
            </div>

            <div className="p-3 space-y-2">
              {bookableObjects.map((obj) => {
                const cfg = OBJECT_CONFIGS[obj.object_type]
                const statusColor = STATUS_COLORS[obj.status as keyof typeof STATUS_COLORS] || "#9ca3af"
                const canBook = obj.status === "available" || obj.status === "premium"
                return (
                  <button
                    key={obj.id}
                    onClick={() => canBook ? handleSelect(obj.id) : undefined}
                    disabled={!canBook}
                    className={[
                      "w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all",
                      canBook
                        ? "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer"
                        : "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed",
                      selectedObject?.id === obj.id ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 truncate">
                        {cfg.emoji} {obj.label || cfg.label}
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                        <span className="capitalize text-slate-500">{obj.status}</span>
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10px] flex items-center gap-2">
                      {obj.capacity > 1 && <span>👥 {obj.capacity} seats</span>}
                      {obj.price_per_hour > 0 && <span>₹{obj.price_per_hour}/hr</span>}
                      {obj.price_per_day > 0 && <span>₹{obj.price_per_day}/day</span>}
                      {obj.price_per_hour === 0 && obj.price_per_day === 0 && <span>Free</span>}
                    </div>
                    {canBook && (
                      <div className="mt-1.5">
                        <span className="text-indigo-600 font-semibold text-[10px]">Click to book →</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Booking modal */}
      {selectedObject && (
        <WorkspaceBookingModal
          object={selectedObject}
          onClose={() => setSelectedObject(null)}
          onBooked={handleBooked}
        />
      )}

      <Toaster />
    </div>
  )
}
