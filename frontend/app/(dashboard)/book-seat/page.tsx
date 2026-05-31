"use client"
import { useEffect, useRef, useState } from "react"
import {
  Armchair, Building2, Clock, CheckCircle, ChevronRight,
  ChevronLeft, Users, DoorOpen, Wifi, Coffee, LayoutGrid, AlignJustify,
} from "lucide-react"
import RoomFloorPlan from "@/components/rooms/RoomFloorPlan"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { branchesApi, seatsApi, bookingsApi, roomsApi } from "@/lib/api"
import { Branch, Seat, Room } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"

// ── Constants ────────────────────────────────────────────────────────────────

const seatTypeConfig: Record<string, { label: string; desc: string; color: string }> = {
  hot_desk:       { label: "Hot Desk",        desc: "Flexible shared desk, book by the hour", color: "bg-red-50 border-red-200 text-[#CC2229]" },
  dedicated:      { label: "Dedicated Desk",  desc: "Your own fixed desk, monthly plan",       color: "bg-purple-50 border-purple-200 text-purple-700" },
  private_office: { label: "Private Office",  desc: "Closed room for teams",                   color: "bg-green-50 border-green-200 text-green-700" },
  conference:     { label: "Conference Room", desc: "Meeting room, booked by the hour",         color: "bg-orange-50 border-orange-200 text-orange-700" },
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi:   <Wifi className="w-3.5 h-3.5" />,
  coffee: <Coffee className="w-3.5 h-3.5" />,
}

const statusColors: Record<string, string> = {
  available:   "bg-green-100 text-green-700",
  occupied:    "bg-red-100 text-red-700",
  maintenance: "bg-yellow-100 text-yellow-700",
}

function parseAmenities(raw?: string): string[] {
  if (!raw) return []
  return raw.split(",").map(s => s.trim()).filter(Boolean)
}

// ── RoomCard sub-component ────────────────────────────────────────────────────

function RoomCard({ room, onBook, scrollMode = false }: { room: Room; onBook: () => void; scrollMode?: boolean }) {
  const amenities = parseAmenities(room.amenities)
  const isAvailable = room.status === "available"
  return (
    <div className={`rounded-2xl border-2 border-gray-100 hover:border-red-200 hover:shadow-md transition-all overflow-hidden bg-white ${scrollMode ? "flex-shrink-0 w-56 sm:w-64" : ""}`}>
      {/* Floor plan visual */}
      <div className="relative h-40 bg-[#FFF8F8] overflow-hidden">
        <RoomFloorPlan name={room.room_name} capacity={room.capacity} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex flex-col justify-end p-3">
          <p className="font-bold text-white text-base leading-tight drop-shadow">{room.room_name}</p>
          <p className="text-white/75 text-xs mt-0.5">Floor {room.floor} · {room.branch_name}</p>
        </div>
      </div>
      {/* Card body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[room.status]}`}>
            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" /> Up to {room.capacity}
          </span>
        </div>
        <div className="text-sm font-bold text-[#CC2229]">
          ₹{room.price_per_hour.toLocaleString()}
          <span className="text-gray-400 font-normal">/hr</span>
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.map(a => (
              <span key={a} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {amenityIcons[a.toLowerCase()] ?? null}{a}
              </span>
            ))}
          </div>
        )}
        <Button size="sm" className="w-full" disabled={!isAvailable} onClick={onBook}>
          {isAvailable ? "Book Room" : room.status === "maintenance" ? "Under Maintenance" : "Unavailable"}
        </Button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BookSeatPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<"seats" | "rooms">("seats")

  // Shared
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("")

  // Seats
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [seatStartTime, setSeatStartTime] = useState("")
  const [seatEndTime, setSeatEndTime] = useState("")
  const [bookingLoading, setBookingLoading] = useState(false)
  const [seatsLoading, setSeatsLoading] = useState(false)

  // Rooms
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [roomLayout, setRoomLayout] = useState<"scroll" | "grid">("scroll")
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [roomConfirmOpen, setRoomConfirmOpen] = useState(false)
  const [roomStartTime, setRoomStartTime] = useState("")
  const [roomEndTime, setRoomEndTime] = useState("")
  const [roomBookingLoading, setRoomBookingLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    branchesApi.list().then(r => setBranches(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBranch) { setSeats([]); return }
    setSeatsLoading(true)
    seatsApi.list({ status: "available", branch_id: Number(selectedBranch) })
      .then(r => setSeats(r.data || []))
      .catch(() => setSeats([]))
      .finally(() => setSeatsLoading(false))
  }, [selectedBranch])

  useEffect(() => {
    if (!selectedBranch || activeTab !== "rooms") { setRooms([]); return }
    setRoomsLoading(true)
    roomsApi.list({ branch_id: Number(selectedBranch) })
      .then(r => setRooms(r.data || []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false))
  }, [selectedBranch, activeTab])

  const filteredSeats = selectedType === "all" ? seats : seats.filter(s => s.type === selectedType)
  const floorRooms = rooms.filter(r => r.floor === selectedFloor)

  const scrollRooms = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" })
  }

  const handleBookSeat = () => {
    if (!selectedSeat || !seatStartTime || !seatEndTime) {
      toast({ title: "Please fill in all fields", variant: "destructive" }); return
    }
    if (new Date(seatStartTime) >= new Date(seatEndTime)) {
      toast({ title: "End time must be after start time", variant: "destructive" }); return
    }
    setBookingLoading(true)
    bookingsApi.create({ seat_id: selectedSeat.id, user_id: user?.id, branch_id: selectedSeat.branch_id, start_time: seatStartTime, end_time: seatEndTime })
      .then(() => {
        toast({ title: "Booking confirmed!", description: `${selectedSeat.seat_number} reserved.` })
        setConfirmOpen(false); setSelectedSeat(null); setSeatStartTime(""); setSeatEndTime("")
        seatsApi.list({ status: "available", branch_id: Number(selectedBranch) }).then(r => setSeats(r.data || [])).catch(() => {})
      })
      .catch(() => toast({ title: "Booking failed. Please try again.", variant: "destructive" }))
      .finally(() => setBookingLoading(false))
  }

  const handleBookRoom = () => {
    if (!selectedRoom || !roomStartTime || !roomEndTime) {
      toast({ title: "Please fill in all fields", variant: "destructive" }); return
    }
    if (new Date(roomStartTime) >= new Date(roomEndTime)) {
      toast({ title: "End time must be after start time", variant: "destructive" }); return
    }
    setRoomBookingLoading(true)
    roomsApi.book(selectedRoom.id, { room_id: selectedRoom.id, branch_id: selectedRoom.branch_id, start_time: roomStartTime, end_time: roomEndTime })
      .then(() => {
        toast({ title: "Room booked!", description: `${selectedRoom.room_name} reserved.` })
        setRoomConfirmOpen(false); setSelectedRoom(null); setRoomStartTime(""); setRoomEndTime("")
        roomsApi.list({ branch_id: Number(selectedBranch) }).then(r => setRooms(r.data || [])).catch(() => {})
      })
      .catch(err => toast({ title: err?.response?.data?.detail || "Booking failed.", variant: "destructive" }))
      .finally(() => setRoomBookingLoading(false))
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Book a Space</h1>
        <p className="text-gray-500 text-xs sm:text-sm">Browse available seats and rooms, then make a reservation</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["seats", "rooms"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab ? "bg-white shadow text-[#CC2229]" : "text-gray-500 hover:text-gray-700"}`}>
            {tab === "seats" ? <><Armchair className="w-4 h-4" /> Seats</> : <><DoorOpen className="w-4 h-4" /> Rooms</>}
          </button>
        ))}
      </div>

      {/* Branch selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#CC2229] text-white text-xs flex items-center justify-center">1</span>
          Choose your location
          {activeTab === "seats" && <span className="font-normal text-gray-400">and workspace type</span>}
        </h2>
        <div className={`grid gap-4 ${activeTab === "seats" ? "md:grid-cols-2" : "md:grid-cols-1 max-w-sm"}`}>
          <div className="space-y-2">
            <Label>Branch / Location</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger><SelectValue placeholder="Select a branch..." /></SelectTrigger>
              <SelectContent>
                {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.branch_name} — {b.location}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {activeTab === "seats" && (
            <div className="space-y-2">
              <Label>Workspace Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(seatTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {activeTab === "seats" && selectedType !== "all" && seatTypeConfig[selectedType] && (
          <div className={`mt-4 p-3 rounded-lg border text-sm ${seatTypeConfig[selectedType].color}`}>
            <span className="font-semibold">{seatTypeConfig[selectedType].label}:</span> {seatTypeConfig[selectedType].desc}
          </div>
        )}
      </div>

      {/* ── SEATS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "seats" && (
        <>
          {selectedBranch ? (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#CC2229] text-white text-xs flex items-center justify-center">2</span>
                Pick a seat
                {!seatsLoading && <span className="text-gray-400 font-normal">({filteredSeats.length} available)</span>}
              </h2>
              {seatsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-[#CC2229] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredSeats.length === 0 ? (
                <div className="text-center py-10">
                  <Armchair className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No available seats for this selection</p>
                  <p className="text-gray-400 text-sm mt-1">Try a different branch or workspace type</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredSeats.map(seat => {
                    const cfg = seatTypeConfig[seat.type]
                    return (
                      <button key={seat.id} onClick={() => { setSelectedSeat(seat); setConfirmOpen(true) }}
                        className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all group">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-[#CC2229]">{seat.seat_number}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{cfg?.label || seat.type}</p>
                          </div>
                          <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[#CC2229] font-bold text-sm">₹{seat.price.toLocaleString()}<span className="text-gray-400 font-normal">/mo</span></span>
                          <span className="text-xs text-[#CC2229] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                            Book <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Select a branch to see available seats</p>
              <p className="text-gray-400 text-sm mt-1">Choose your preferred location above to get started</p>
            </div>
          )}
        </>
      )}

      {/* ── ROOMS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "rooms" && (
        <>
          {selectedBranch ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Floor selector + layout toggle */}
              <div className="flex items-stretch border-b border-gray-100">
                <div className="flex flex-1">
                  {[1, 2, 3, 4, 5].map(f => {
                    const count = rooms.filter(r => r.floor === f).length
                    const active = selectedFloor === f
                    return (
                      <button key={f}
                        onClick={() => { setSelectedFloor(f); scrollRef.current?.scrollTo({ left: 0 }) }}
                        className={`flex-1 py-2 sm:py-3 text-center transition-all relative border-b-2 ${active ? "border-[#CC2229] bg-red-50 text-[#CC2229]" : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50"}`}>
                        <span className="block text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">Floor</span>
                        <span className="text-base sm:text-lg font-bold">{f}</span>
                        {count > 0 && (
                          <span className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${active ? "bg-[#CC2229] text-white" : "bg-gray-200 text-gray-600"}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-1 px-3 border-l border-gray-100">
                  <button onClick={() => setRoomLayout("scroll")} title="Horizontal scroll"
                    className={`p-1.5 rounded-md transition-all ${roomLayout === "scroll" ? "bg-red-50 text-[#CC2229]" : "text-gray-400 hover:text-gray-600"}`}>
                    <AlignJustify className="w-4 h-4" />
                  </button>
                  <button onClick={() => setRoomLayout("grid")} title="Grid view"
                    className={`p-1.5 rounded-md transition-all ${roomLayout === "grid" ? "bg-red-50 text-[#CC2229]" : "text-gray-400 hover:text-gray-600"}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Room content */}
              <div className="p-3 sm:p-5">
                {roomsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#CC2229] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-12">
                    <DoorOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No rooms in this branch yet</p>
                    <p className="text-gray-400 text-sm mt-1">Ask your admin to add rooms</p>
                  </div>
                ) : floorRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <DoorOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No rooms on Floor {selectedFloor}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {[1,2,3,4,5].some(f => f !== selectedFloor && rooms.some(r => r.floor === f))
                        ? `Try: ${[1,2,3,4,5].filter(f => rooms.some(r => r.floor === f) && f !== selectedFloor).map(f => `Floor ${f}`).join(", ")}`
                        : "Select a different floor above"}
                    </p>
                  </div>
                ) : roomLayout === "scroll" ? (
                  <div className="relative">
                    {floorRooms.length > 2 && (
                      <>
                        <button onClick={() => scrollRooms("left")}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50">
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => scrollRooms("right")}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50">
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </>
                    )}
                    <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                      {floorRooms.map(room => (
                        <RoomCard key={room.id} room={room} scrollMode
                          onBook={() => { setSelectedRoom(room); setRoomConfirmOpen(true) }} />
                      ))}
                    </div>
                    <p className="text-center text-xs text-gray-300 mt-3">← use arrows or swipe to browse →</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[540px] overflow-y-auto pr-1">
                    {floorRooms.map(room => (
                      <RoomCard key={room.id} room={room}
                        onBook={() => { setSelectedRoom(room); setRoomConfirmOpen(true) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Select a branch to see available rooms</p>
              <p className="text-gray-400 text-sm mt-1">Choose your preferred location above to get started</p>
            </div>
          )}
        </>
      )}

      {/* ── Seat booking dialog ──────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              You are booking <strong>{selectedSeat?.seat_number}</strong> ({seatTypeConfig[selectedSeat?.type || ""]?.label})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selectedSeat && (
              <div className="bg-red-50 rounded-lg p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Seat</span><span className="font-medium">{selectedSeat.seat_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{seatTypeConfig[selectedSeat.type]?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-semibold text-[#CC2229]">₹{selectedSeat.price.toLocaleString()}/month</span></div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /> Start Time</Label>
              <input type="datetime-local" value={seatStartTime} onChange={e => setSeatStartTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /> End Time</Label>
              <input type="datetime-local" value={seatEndTime} onChange={e => setSeatEndTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handleBookSeat} disabled={bookingLoading}>
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Room booking dialog ──────────────────────────────────────────── */}
      <Dialog open={roomConfirmOpen} onOpenChange={setRoomConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Room</DialogTitle>
            <DialogDescription>Reserve <strong>{selectedRoom?.room_name}</strong> by the hour</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selectedRoom && (
              <div className="bg-red-50 rounded-lg p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-medium">{selectedRoom.room_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Floor</span><span className="font-medium">Floor {selectedRoom.floor}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span className="font-medium">Up to {selectedRoom.capacity} people</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-semibold text-[#CC2229]">₹{selectedRoom.price_per_hour.toLocaleString()}/hour</span></div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /> Start Time</Label>
              <input type="datetime-local" value={roomStartTime} onChange={e => setRoomStartTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /> End Time</Label>
              <input type="datetime-local" value={roomEndTime} onChange={e => setRoomEndTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setRoomConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handleBookRoom} disabled={roomBookingLoading}>
                {roomBookingLoading ? "Booking..." : "Confirm Room Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
