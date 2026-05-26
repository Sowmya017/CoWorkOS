"use client"
import { useEffect, useState } from "react"
import { Plus, XCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { bookingsApi } from "@/lib/api"
import { Booking } from "@/types"
import { formatDateTime } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const mockBookings: Booking[] = [
  { id: 1, seat_id: 1, seat_number: "A-01", user_id: 2, user_name: "Rahul Sharma", branch_id: 1, branch_name: "Koramangala Hub", start_time: "2025-05-25T09:00:00", end_time: "2025-05-25T18:00:00", booking_status: "confirmed" },
  { id: 2, seat_id: 3, seat_number: "B-01", user_id: 3, user_name: "Priya Mehta", branch_id: 1, branch_name: "Koramangala Hub", start_time: "2025-05-26T09:00:00", end_time: "2025-06-25T18:00:00", booking_status: "confirmed" },
  { id: 3, seat_id: 5, seat_number: "A-01", user_id: 4, user_name: "Vikram Singh", branch_id: 2, branch_name: "Indiranagar Center", start_time: "2025-05-24T10:00:00", end_time: "2025-05-24T17:00:00", booking_status: "completed" },
  { id: 4, seat_id: 7, seat_number: "A-03", user_id: 5, user_name: "Ananya Patel", branch_id: 3, branch_name: "Bandra Workspace", start_time: "2025-05-27T09:00:00", end_time: "2025-05-27T18:00:00", booking_status: "pending" },
  { id: 5, seat_id: 2, seat_number: "A-02", user_id: 6, user_name: "Rohan Das", branch_id: 1, branch_name: "Koramangala Hub", start_time: "2025-05-20T09:00:00", end_time: "2025-05-20T18:00:00", booking_status: "cancelled" },
]

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  confirmed: "success",
  cancelled: "destructive",
  completed: "secondary",
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [form, setForm] = useState({ seat_id: 1, user_id: 1, branch_id: 1, start_time: "", end_time: "" })
  const { toast } = useToast()

  useEffect(() => {
    bookingsApi.list().then((res) => setBookings(res.data)).catch(() => {})
  }, [])

  const filtered = bookings.filter(
    (b) =>
      (statusFilter === "all" || b.booking_status === statusFilter) &&
      ((b.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.seat_number || "").toLowerCase().includes(search.toLowerCase()))
  )

  const handleCreate = async () => {
    const newBooking: Booking = {
      id: Date.now(),
      ...form,
      booking_status: "pending",
      seat_number: `Seat ${form.seat_id}`,
      user_name: `User ${form.user_id}`,
      branch_name: `Branch ${form.branch_id}`,
    }
    bookingsApi.create(form).catch(() => {})
    setBookings([newBooking, ...bookings])
    setOpen(false)
    toast({ title: "Booking created!" })
  }

  const handleCancel = (id: number) => {
    bookingsApi.cancel(id).catch(() => {})
    setBookings(bookings.map((b) => b.id === id ? { ...b, booking_status: "cancelled" } : b))
    toast({ title: "Booking cancelled" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
          <p className="text-gray-500 text-sm">Manage seat reservations and schedules</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["pending", "confirmed", "completed", "cancelled"].map((status) => (
          <div key={status} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-3xl font-bold text-gray-800">{bookings.filter(b => b.booking_status === status).length}</div>
            <div className="text-sm text-gray-500 mt-1 capitalize">{status}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["pending", "confirmed", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Booking ID</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono text-sm text-gray-500">#{booking.id}</TableCell>
                <TableCell className="font-medium text-gray-800">{booking.user_name}</TableCell>
                <TableCell className="text-gray-600">{booking.seat_number}</TableCell>
                <TableCell className="text-gray-600 text-sm">{booking.branch_name}</TableCell>
                <TableCell className="text-gray-600 text-sm">{formatDateTime(booking.start_time)}</TableCell>
                <TableCell className="text-gray-600 text-sm">{formatDateTime(booking.end_time)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[booking.booking_status]} className="capitalize">
                    {booking.booking_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {booking.booking_status === "confirmed" || booking.booking_status === "pending" ? (
                    <Button size="sm" variant="outline" onClick={() => handleCancel(booking.id)} className="gap-1 text-red-500 border-red-200 hover:bg-red-50">
                      <XCircle className="w-3 h-3" /> Cancel
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
            <DialogDescription>Create a new seat reservation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seat ID</Label>
                <Input type="number" value={form.seat_id} onChange={(e) => setForm({ ...form, seat_id: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input type="number" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Booking</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
