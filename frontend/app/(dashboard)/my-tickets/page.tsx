"use client"
import { useEffect, useState } from "react"
import { Plus, Search, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ticketsApi } from "@/lib/api"
import { Ticket as TicketType } from "@/types"
import { useToast } from "@/components/ui/use-toast"

const priorityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
}

const statusColor: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
}

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [form, setForm] = useState({ issue_type: "", description: "", priority: "medium" })
  const { toast } = useToast()

  useEffect(() => {
    ticketsApi.list()
      .then(res => setTickets(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = tickets.filter(t =>
    (statusFilter === "all" || t.status === statusFilter) &&
    (t.issue_type.toLowerCase().includes(search.toLowerCase()) ||
     (t.description || "").toLowerCase().includes(search.toLowerCase()))
  )

  const handleCreate = () => {
    if (!form.issue_type || !form.description) {
      toast({ title: "Please fill in all fields", variant: "destructive" })
      return
    }
    const newTicket: TicketType = {
      id: Date.now(),
      ...form,
      priority: form.priority as TicketType["priority"],
      status: "open",
      created_at: new Date().toISOString(),
    }
    ticketsApi.create(form).catch(() => {})
    setTickets([newTicket, ...tickets])
    setOpen(false)
    setForm({ issue_type: "", description: "", priority: "medium" })
    toast({ title: "Ticket raised!", description: "Our team will look into this shortly." })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Support Tickets</h1>
          <p className="text-gray-500 text-sm">Report issues and track their resolution</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Raise a Ticket
        </Button>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[["open","Open"],["in_progress","In Progress"],["resolved","Resolved"],["closed","Closed"]].map(([s, label]) => (
          <div key={s} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-800">{tickets.filter(t => t.status === s).length}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusLabel).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 shadow-sm text-center">
          <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tickets found</p>
          <p className="text-gray-400 text-sm mt-1">Raise a ticket to report an issue</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setOpen(true)}>
            Raise your first ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{ticket.issue_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{ticket.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>#{ticket.id}</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {ticket.assigned_name && <span>Assigned to: {ticket.assigned_name}</span>}
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${statusColor[ticket.status]}`}>
                  {statusLabel[ticket.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and our team will get back to you shortly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select value={form.issue_type} onValueChange={v => setForm({ ...form, issue_type: v })}>
                <SelectTrigger><SelectValue placeholder="What kind of issue is this?" /></SelectTrigger>
                <SelectContent>
                  {["Maintenance", "IT Support", "Billing", "Housekeeping", "Security", "Other"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Describe the issue in detail..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["low","Low — not urgent"],["medium","Medium — needs attention"],["high","High — important"],["critical","Critical — emergency"]].map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Submit Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
