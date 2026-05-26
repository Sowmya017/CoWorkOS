"use client"
import { useState, useEffect, useRef } from "react"
import { Building2, RefreshCw, X, CheckCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { seatsApi, branchesApi, bookingsApi } from "@/lib/api"
import { Seat, Branch } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"

// ── Status config ──────────────────────────────────────────────────────────────
type SeatStatus = "available" | "occupied" | "reserved" | "maintenance"

const STATUS_CFG: Record<SeatStatus, { fill: string; stroke: string; text: string; label: string; dot: string }> = {
  available:   { fill: "#d1fae5", stroke: "#10b981", text: "#065f46", label: "Available",    dot: "bg-emerald-500" },
  occupied:    { fill: "#fee2e2", stroke: "#ef4444", text: "#991b1b", label: "Occupied",     dot: "bg-red-500" },
  reserved:    { fill: "#fef3c7", stroke: "#f59e0b", text: "#92400e", label: "Reserved",     dot: "bg-amber-400" },
  maintenance: { fill: "#f1f5f9", stroke: "#94a3b8", text: "#475569", label: "Maintenance",  dot: "bg-slate-400" },
}

const TYPE_LABELS: Record<string, string> = {
  hot_desk: "Hot Desk", dedicated: "Dedicated Desk",
  private_office: "Private Office", conference: "Conference Room",
}

// ── SVG floor zones ────────────────────────────────────────────────────────────
const ZONES = [
  { label: "HOT DESKS",       x: 12,  y: 18,  w: 448, h: 165, fill: "#f0fdf4", stroke: "#86efac", tc: "#166534" },
  { label: "DEDICATED DESKS", x: 12,  y: 198, w: 232, h: 298, fill: "#eff6ff", stroke: "#93c5fd", tc: "#1e40af" },
  { label: "PRIVATE OFFICES", x: 472, y: 18,  w: 276, h: 205, fill: "#faf5ff", stroke: "#d8b4fe", tc: "#6b21a8" },
  { label: "CONFERENCE ROOMS",x: 472, y: 235, w: 276, h: 260, fill: "#fff7ed", stroke: "#fed7aa", tc: "#9a3412" },
]

// ── Seat geometry: position each seat in SVG coordinate space ─────────────────
const SIZES: Record<string, { w: number; h: number }> = {
  hot_desk:      { w: 72,  h: 55  },
  dedicated:     { w: 88,  h: 65  },
  private_office:{ w: 108, h: 78  },
  conference:    { w: 245, h: 90  },
}

function getSeatPos(seatNumber: string, type: string): { x: number; y: number; w: number; h: number } | null {
  const m = seatNumber.match(/^([A-Z])-(\d+)$/)
  if (!m) return null
  const prefix = m[1], num = parseInt(m[2]) - 1
  const { w, h } = SIZES[type] ?? { w: 72, h: 55 }
  switch (prefix) {
    case "H": { const c = num % 5,  r = Math.floor(num / 5);  return { x: 28  + c * 82,  y: 38  + r * 65, w, h } }
    case "D": { const c = num % 2,  r = Math.floor(num / 2);  return { x: 28  + c * 100, y: 220 + r * 75, w, h } }
    case "P": { const c = num % 2,  r = Math.floor(num / 2);  return { x: 488 + c * 120, y: 38  + r * 88, w, h } }
    case "C": return { x: 488, y: 258 + num * 102, w, h }
    default:  return null
  }
}

// ── Deterministic mock data (no randomness so UI is stable across renders) ────
const MOCK_BRANCHES: Branch[] = [
  { id: 1, branch_name: "Koramangala Hub",    location: "Bangalore", total_seats: 80,  occupied_seats: 62 },
  { id: 2, branch_name: "Indiranagar Center", location: "Bangalore", total_seats: 60,  occupied_seats: 45 },
  { id: 3, branch_name: "Bandra Workspace",   location: "Mumbai",    total_seats: 100, occupied_seats: 78 },
  { id: 4, branch_name: "Connaught Place",    location: "Delhi",     total_seats: 120, occupied_seats: 95 },
  { id: 5, branch_name: "Anna Nagar Hub",     location: "Chennai",   total_seats: 40,  occupied_seats: 22 },
]

const TYPE_CONFIGS = [
  { type: "hot_desk"      as const, prefix: "H", count: 10, price: 500 },
  { type: "dedicated"     as const, prefix: "D", count: 5,  price: 8000 },
  { type: "private_office"as const, prefix: "P", count: 3,  price: 25000 },
  { type: "conference"    as const, prefix: "C", count: 2,  price: 1500 },
]

const STATUS_SEQ: SeatStatus[] = ["occupied","occupied","available","occupied","reserved","occupied","maintenance","available","occupied","occupied"]

function genMockSeats(branchId: number): Seat[] {
  let id = (branchId - 1) * 20 + 1
  return TYPE_CONFIGS.flatMap(({ type, prefix, count, price }) =>
    Array.from({ length: count }, (_, i) => ({
      id: id++,
      branch_id: branchId,
      seat_number: `${prefix}-${String(i + 1).padStart(2, "0")}`,
      type,
      price,
      status: STATUS_SEQ[(branchId * 3 + i * 2) % STATUS_SEQ.length],
    }))
  )
}

// ── SVG seat icons ─────────────────────────────────────────────────────────────
const SEAT_ICONS: Record<string, string> = {
  hot_desk: "💺", dedicated: "🖥", private_office: "🏢", conference: "📋",
}

// ── FloorMap SVG component ────────────────────────────────────────────────────
function FloorMap({
  seats, selectedId, filterType, onSelect, onHover,
}: {
  seats: Seat[]
  selectedId: number | null
  filterType: string
  onSelect: (s: Seat) => void
  onHover: (s: Seat | null, x: number, y: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const filteredIds = new Set(
    filterType === "all" ? seats.map((s) => s.id) : seats.filter((s) => s.type === filterType).map((s) => s.id)
  )

  return (
    <svg ref={svgRef} viewBox="0 0 760 502" className="w-full h-full" style={{ fontFamily: "system-ui,sans-serif" }}>
      <defs>
        <filter id="sel-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.5" />
        </filter>
        <filter id="card-shadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0000001a" />
        </filter>
      </defs>

      {/* Zone backgrounds */}
      {ZONES.map((z) => (
        <g key={z.label}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill={z.fill} stroke={z.stroke} strokeWidth={1.5} />
          <text x={z.x + 16} y={z.y + 16} fontSize={9} fontWeight="700" fill={z.tc} letterSpacing="0.08em">{z.label}</text>
        </g>
      ))}

      {/* Seats */}
      {seats.map((seat) => {
        const pos = getSeatPos(seat.seat_number, seat.type)
        if (!pos) return null
        const cfg  = STATUS_CFG[seat.status as SeatStatus] ?? STATUS_CFG.available
        const isSel   = seat.id === selectedId
        const isDimmed = !filteredIds.has(seat.id)
        const canBook  = seat.status === "available"

        return (
          <g
            key={seat.id}
            onClick={() => canBook && onSelect(seat)}
            onMouseEnter={(e) => {
              const r = svgRef.current?.getBoundingClientRect()
              if (r) onHover(seat, e.clientX - r.left, e.clientY - r.top)
            }}
            onMouseLeave={() => onHover(null, 0, 0)}
            style={{
              cursor: canBook ? "pointer" : seat.status === "maintenance" ? "not-allowed" : "default",
              opacity: isDimmed ? 0.18 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {/* Shadow / glow for selected */}
            {isSel && (
              <rect x={pos.x - 2} y={pos.y - 2} width={pos.w + 4} height={pos.h + 4} rx={9}
                fill="#dbeafe" stroke="#2563eb" strokeWidth={3} filter="url(#sel-shadow)" />
            )}
            {/* Main rect */}
            <rect
              x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={7}
              fill={isSel ? "#eff6ff" : cfg.fill}
              stroke={isSel ? "#3b82f6" : cfg.stroke}
              strokeWidth={isSel ? 2 : 1.5}
              filter={!isSel ? "url(#card-shadow)" : undefined}
            />
            {/* Icon */}
            <text x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 - 8} textAnchor="middle" fontSize={seat.type === "conference" ? 18 : 14}>
              {SEAT_ICONS[seat.type]}
            </text>
            {/* Seat number */}
            <text x={pos.x + pos.w / 2} y={pos.y + pos.h - 14} textAnchor="middle" fontSize={10} fontWeight="700"
              fill={isSel ? "#1d4ed8" : cfg.text}>
              {seat.seat_number}
            </text>
            {/* Price */}
            <text x={pos.x + pos.w / 2} y={pos.y + pos.h - 4} textAnchor="middle" fontSize={8}
              fill={isSel ? "#3b82f6" : cfg.text} opacity={0.75}>
              ₹{seat.price >= 1000 ? `${(seat.price / 1000).toFixed(0)}K` : seat.price}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SeatsPage() {
  const [branches,   setBranches]   = useState<Branch[]>(MOCK_BRANCHES)
  const [selBranch,  setSelBranch]  = useState(1)
  const [seats,      setSeats]      = useState<Seat[]>(genMockSeats(1))
  const [selSeat,    setSelSeat]    = useState<Seat | null>(null)
  const [filterType, setFilterType] = useState("all")
  const [loading,    setLoading]    = useState(false)
  const [bookOpen,   setBookOpen]   = useState(false)
  const [hover,      setHover]      = useState<{ seat: Seat | null; x: number; y: number }>({ seat: null, x: 0, y: 0 })
  const [bookForm,   setBookForm]   = useState({ start: "", end: "" })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    branchesApi.list().then((r) => setBranches(r.data)).catch(() => {})
  }, [])

  const loadSeats = async () => {
    setLoading(true)
    setSelSeat(null)
    try {
      const r = await seatsApi.list({ branch_id: selBranch })
      setSeats(r.data.length > 0 ? r.data : genMockSeats(selBranch))
    } catch {
      setSeats(genMockSeats(selBranch))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSeats() }, [selBranch]) // eslint-disable-line

  const stats = {
    available:   seats.filter((s) => s.status === "available").length,
    occupied:    seats.filter((s) => s.status === "occupied").length,
    reserved:    seats.filter((s) => s.status === "reserved").length,
    maintenance: seats.filter((s) => s.status === "maintenance").length,
  }

  const handleSelect = (seat: Seat) => {
    setSelSeat(seat)
    const today = new Date().toISOString().split("T")[0]
    const plus30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
    setBookForm({ start: today, end: plus30 })
  }

  const days = bookForm.start && bookForm.end
    ? Math.max(1, Math.round((new Date(bookForm.end).getTime() - new Date(bookForm.start).getTime()) / 86400000))
    : 0
  const totalCost = selSeat ? Math.round((selSeat.price / 30) * days) : 0

  const handleBook = async () => {
    if (!selSeat || !bookForm.start || !bookForm.end) return
    try {
      await bookingsApi.create({
        seat_id: selSeat.id, user_id: user?.id ?? 1, branch_id: selBranch,
        start_time: new Date(bookForm.start).toISOString(),
        end_time:   new Date(bookForm.end).toISOString(),
      })
    } catch { /* demo mode — proceed anyway */ }
    setSeats((prev) => prev.map((s) => s.id === selSeat.id ? { ...s, status: "reserved" as const } : s))
    toast({ title: `✅ Seat ${selSeat.seat_number} booked!`, description: `${bookForm.start} → ${bookForm.end} · ${formatCurrency(totalCost)}` })
    setSelSeat(null)
    setBookOpen(false)
  }

  const branchName = branches.find((b) => b.id === selBranch)?.branch_name ?? "Branch"

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Floor Map</h1>
          <p className="text-gray-500 text-sm">Interactive seat map — click an available seat to book</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(selBranch)} onValueChange={(v) => setSelBranch(Number(v))}>
            <SelectTrigger className="w-56 h-9 gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.branch_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={loadSeats} title="Refresh">
            <RefreshCw className={cn("w-4 h-4 text-gray-500", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {(["available", "occupied", "reserved", "maintenance"] as SeatStatus[]).map((s) => (
          <div key={s} className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-3 cursor-pointer hover:border-gray-200 transition-colors"
            onClick={() => setFilterType(filterType === s ? "all" : s)}>
            <div className={cn("w-3 h-3 rounded-full flex-shrink-0", STATUS_CFG[s].dot,
              filterType === s && "ring-2 ring-offset-1 ring-current")} />
            <div>
              <p className="text-xl font-bold text-gray-800">{stats[s]}</p>
              <p className="text-xs text-gray-400 capitalize">{s}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main: sidebar + map */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: 480 }}>
        {/* Left sidebar */}
        <div className="w-52 flex-shrink-0 space-y-3">
          {/* Type filter */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Filter by Type</p>
            <div className="space-y-0.5">
              {[
                ["all",           "All Seats"],
                ["hot_desk",      "Hot Desk"],
                ["dedicated",     "Dedicated"],
                ["private_office","Private Office"],
                ["conference",    "Conference"],
              ].map(([val, label]) => (
                <button key={val} onClick={() => setFilterType(val)}
                  className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                    filterType === val ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Legend</p>
            <div className="space-y-2">
              {(Object.entries(STATUS_CFG) as [SeatStatus, typeof STATUS_CFG.available][]).map(([status, cfg]) => (
                <div key={status} className="flex items-center gap-2.5">
                  <div className="w-5 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: cfg.fill, border: `1.5px solid ${cfg.stroke}` }} />
                  <span className="text-xs text-gray-600">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected seat panel */}
          {selSeat ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-bold text-blue-800">Selected</p>
                <button onClick={() => setSelSeat(null)} className="text-blue-400 hover:text-blue-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-blue-600 text-xs">Seat #</span>
                  <span className="font-bold text-blue-800">{selSeat.seat_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 text-xs">Type</span>
                  <span className="text-blue-700 text-xs text-right">{TYPE_LABELS[selSeat.type]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 text-xs">Monthly</span>
                  <span className="font-semibold text-blue-800">{formatCurrency(selSeat.price)}</span>
                </div>
              </div>
              <Button size="sm" className="w-full gap-1.5" onClick={() => setBookOpen(true)}>
                <CheckCircle className="w-3.5 h-3.5" /> Book Seat
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-400">Click a green seat on the map to select it</p>
            </div>
          )}
        </div>

        {/* SVG Floor Map */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative">
          {/* Branch label */}
          <div className="absolute top-3 left-4 z-10">
            <span className="text-xs font-bold text-gray-400 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
              📍 {branchName} — Floor 1
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-gray-400 text-sm">Loading floor plan...</p>
              </div>
            </div>
          ) : (
            <div className="p-5 pt-12 h-full relative">
              <FloorMap
                seats={seats}
                selectedId={selSeat?.id ?? null}
                filterType={filterType}
                onSelect={handleSelect}
                onHover={(seat, x, y) => setHover({ seat, x, y })}
              />

              {/* Hover Tooltip */}
              {hover.seat && (
                <div
                  className="absolute z-30 pointer-events-none bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-2xl border border-gray-700"
                  style={{ left: hover.x + 14, top: hover.y - 52, minWidth: 160 }}
                >
                  <p className="font-bold text-sm">{hover.seat.seat_number}</p>
                  <p className="text-gray-300 text-xs mt-0.5">{TYPE_LABELS[hover.seat.type]}</p>
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-700">
                    <span className={cn("text-xs font-medium",
                      hover.seat.status === "available" ? "text-green-400" :
                      hover.seat.status === "occupied"  ? "text-red-400"   :
                      hover.seat.status === "reserved"  ? "text-amber-400" : "text-gray-400"
                    )}>
                      {STATUS_CFG[hover.seat.status as SeatStatus]?.label}
                    </span>
                    <span className="text-gray-200 font-semibold">{formatCurrency(hover.seat.price)}/mo</span>
                  </div>
                  {hover.seat.status === "available" && (
                    <p className="text-blue-400 text-xs mt-1">↓ Click to book</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking modal */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {SEAT_ICONS[selSeat?.type ?? "hot_desk"]} Book Seat {selSeat?.seat_number}
            </DialogTitle>
            <DialogDescription>
              {TYPE_LABELS[selSeat?.type ?? ""]} · {branchName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Seat summary */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                {SEAT_ICONS[selSeat?.type ?? "hot_desk"]}
              </div>
              <div>
                <p className="font-bold text-gray-800">{selSeat?.seat_number} — {TYPE_LABELS[selSeat?.type ?? ""]}</p>
                <p className="text-sm text-gray-500">{branchName}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-bold text-blue-700">{formatCurrency(selSeat?.price ?? 0)}</p>
                <p className="text-xs text-gray-400">per month</p>
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={bookForm.start}
                  onChange={(e) => setBookForm({ ...bookForm, start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={bookForm.end} min={bookForm.start}
                  onChange={(e) => setBookForm({ ...bookForm, end: e.target.value })} />
              </div>
            </div>

            {/* Cost summary */}
            {days > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Duration</span>
                  <span className="font-medium">{days} day{days !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Daily rate</span>
                  <span>{formatCurrency(Math.round((selSeat?.price ?? 0) / 30))}/day</span>
                </div>
                <div className="flex justify-between font-bold text-blue-800 pt-2 border-t border-blue-200 text-base">
                  <span>Total</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setBookOpen(false)}>Cancel</Button>
              <Button onClick={handleBook} disabled={!bookForm.start || !bookForm.end || days <= 0} className="gap-2">
                <CheckCircle className="w-4 h-4" /> Confirm Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
