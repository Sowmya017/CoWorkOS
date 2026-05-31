"use client"
import { useEffect, useState } from "react"
import { DoorOpen, Plus, Pencil, Trash2, Users, IndianRupee, AlertCircle } from "lucide-react"
import RoomFloorPlan from "@/components/rooms/RoomFloorPlan"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { branchesApi, roomsApi } from "@/lib/api"
import { Branch, Room } from "@/types"
import { useToast } from "@/components/ui/use-toast"

const FLOORS = [1, 2, 3, 4, 5]
const MAX_ROOMS = 5

const statusOptions = [
  { value: "available",   label: "Available",        color: "bg-green-100 text-green-700" },
  { value: "occupied",    label: "Occupied",         color: "bg-red-100 text-red-700" },
  { value: "maintenance", label: "Under Maintenance", color: "bg-yellow-100 text-yellow-700" },
]

const emptyForm = { room_name: "", floor: 1, capacity: 10, price_per_hour: 0, amenities: "", status: "available" }

export default function RoomsPage() {
  const { toast } = useToast()

  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    branchesApi.list().then(r => setBranches(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBranch) { setRooms([]); return }
    setLoading(true)
    roomsApi.list({ branch_id: Number(selectedBranch) })
      .then(r => setRooms(r.data || []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [selectedBranch])

  const refreshRooms = () => {
    if (!selectedBranch) return
    roomsApi.list({ branch_id: Number(selectedBranch) })
      .then(r => setRooms(r.data || []))
      .catch(() => {})
  }

  const floorRooms = rooms.filter(r => r.floor === selectedFloor)
  const totalRooms = rooms.length
  const atLimit = totalRooms >= MAX_ROOMS

  const openAdd = () => {
    setEditingRoom(null)
    setForm({ ...emptyForm, floor: selectedFloor })
    setDialogOpen(true)
  }

  const openEdit = (room: Room) => {
    setEditingRoom(room)
    setForm({
      room_name: room.room_name,
      floor: room.floor,
      capacity: room.capacity,
      price_per_hour: room.price_per_hour,
      amenities: room.amenities || "",
      status: room.status,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.room_name.trim()) {
      toast({ title: "Room name is required", variant: "destructive" })
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      branch_id: Number(selectedBranch),
      floor: Number(form.floor),
      capacity: Number(form.capacity),
      price_per_hour: Number(form.price_per_hour),
    }
    const req = editingRoom
      ? roomsApi.update(editingRoom.id, payload)
      : roomsApi.create(payload)

    req
      .then(() => {
        toast({ title: editingRoom ? "Room updated" : "Room created successfully" })
        setDialogOpen(false)
        refreshRooms()
      })
      .catch(err => {
        const msg = err?.response?.data?.detail || "Failed to save room"
        toast({ title: msg, variant: "destructive" })
      })
      .finally(() => setSaving(false))
  }

  const handleDelete = () => {
    if (!deleteId) return
    setDeleting(true)
    roomsApi.delete(deleteId)
      .then(() => {
        toast({ title: "Room deleted" })
        setDeleteId(null)
        refreshRooms()
      })
      .catch(() => toast({ title: "Failed to delete room", variant: "destructive" }))
      .finally(() => setDeleting(false))
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Rooms</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Manage meeting rooms across floors (max {MAX_ROOMS} per branch)</p>
        </div>
        {selectedBranch && !atLimit && (
          <Button onClick={openAdd} className="flex items-center gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Room</span><span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>

      {/* Branch selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="max-w-xs space-y-2">
          <Label>Branch / Location</Label>
          <Select value={selectedBranch} onValueChange={v => { setSelectedBranch(v); setSelectedFloor(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a branch..." />
            </SelectTrigger>
            <SelectContent>
              {branches.map(b => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.branch_name} — {b.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedBranch && (
        <>
          {/* Stats bar */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{totalRooms} / {MAX_ROOMS} rooms used</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[200px]">
              <div
                className={`h-full rounded-full transition-all ${totalRooms >= MAX_ROOMS ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${(totalRooms / MAX_ROOMS) * 100}%` }}
              />
            </div>
            {atLimit && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Limit reached
              </span>
            )}
          </div>

          {/* Floor tabs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Floor picker */}
            <div className="flex border-b border-gray-100">
              {FLOORS.map(f => {
                const count = rooms.filter(r => r.floor === f).length
                const active = selectedFloor === f
                return (
                  <button
                    key={f}
                    onClick={() => setSelectedFloor(f)}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-medium transition-all relative ${
                      active
                        ? "bg-[#CC2229] text-white"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    <span className="hidden sm:inline">Floor </span>{f}
                    {count > 0 && (
                      <span className={`ml-1 text-[10px] px-1 py-0.5 rounded-full font-semibold ${
                        active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Room cards for selected floor */}
            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : floorRooms.length === 0 ? (
                <div className="text-center py-12">
                  <DoorOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No rooms on Floor {selectedFloor}</p>
                  <p className="text-gray-400 text-sm mt-1 mb-4">Add a room to this floor to get started</p>
                  {!atLimit && (
                    <Button size="sm" onClick={openAdd} variant="outline">
                      <Plus className="w-4 h-4 mr-1" /> Add Room to Floor {selectedFloor}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {floorRooms.map(room => {
                    const statusCfg = statusOptions.find(s => s.value === room.status)
                    return (
                      <div key={room.id} className="rounded-xl border-2 border-gray-100 hover:border-red-200 hover:shadow-md overflow-hidden transition-all">
                        {/* Floor plan visual */}
                        <div className="relative h-36 overflow-hidden bg-[#FFF8F8]">
                          <RoomFloorPlan name={room.room_name} capacity={room.capacity} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex flex-col justify-end p-3">
                            <p className="font-bold text-white text-sm leading-tight drop-shadow">{room.room_name}</p>
                            <p className="text-white/75 text-xs mt-0.5">Floor {room.floor}</p>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg?.color}`}>
                              {statusCfg?.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" /> {room.capacity} people</span>
                            <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-gray-400" />{room.price_per_hour.toLocaleString()}/hr</span>
                          </div>
                          {room.amenities && (
                            <p className="text-xs text-gray-400 truncate">{room.amenities}</p>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(room)}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => setDeleteId(room.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add room card */}
                  {!atLimit && (
                    <button
                      onClick={openAdd}
                      className="rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all p-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-medium">Add Room</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedBranch && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
          <DoorOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Select a branch to manage its rooms</p>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Room Name</Label>
              <input
                value={form.room_name}
                onChange={e => setForm(f => ({ ...f, room_name: e.target.value }))}
                placeholder="e.g. Board Room, Meeting Room A"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Floor</Label>
                <Select value={String(form.floor)} onValueChange={v => setForm(f => ({ ...f, floor: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FLOORS.map(f => <SelectItem key={f} value={String(f)}>Floor {f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity (people)</Label>
                <input
                  type="number" min={1}
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price per Hour (₹)</Label>
                <input
                  type="number" min={0}
                  value={form.price_per_hour}
                  onChange={e => setForm(f => ({ ...f, price_per_hour: Number(e.target.value) }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amenities <span className="text-gray-400 font-normal text-xs">(comma-separated, e.g. WiFi, Projector, Whiteboard)</span></Label>
              <input
                value={form.amenities}
                onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))}
                placeholder="WiFi, Projector, Whiteboard"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingRoom ? "Save Changes" : "Create Room"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm pt-1">Are you sure you want to delete this room? This cannot be undone.</p>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Room"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
