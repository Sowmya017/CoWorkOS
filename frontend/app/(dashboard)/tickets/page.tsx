"use client"
import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ticketsApi } from "@/lib/api"
import { Ticket } from "@/types"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const mockTickets: Ticket[] = [
  { id: 1, issue_type: "Maintenance", description: "AC not working in Zone B", priority: "high", assigned_name: "Maintenance Team", status: "open", created_at: "2025-05-24" },
  { id: 2, issue_type: "IT Support", description: "Internet slow on floor 2", priority: "medium", assigned_name: "IT Team", status: "in_progress", created_at: "2025-05-23" },
  { id: 3, issue_type: "Billing", description: "Invoice discrepancy for May", priority: "high", assigned_name: "Finance", status: "open", created_at: "2025-05-22" },
  { id: 4, issue_type: "Housekeeping", description: "Pantry needs restocking", priority: "low", status: "resolved", created_at: "2025-05-21" },
  { id: 5, issue_type: "Security", description: "Access card not working", priority: "critical", assigned_name: "Security", status: "in_progress", created_at: "2025-05-25" },
  { id: 6, issue_type: "Maintenance", description: "Broken chair in meeting room", priority: "low", status: "closed", created_at: "2025-05-18" },
]

const priorityVariant: Record<string, "destructive" | "warning" | "secondary" | "info"> = {
  critical: "destructive",
  high: "destructive",
  medium: "warning",
  low: "secondary",
}

const statusVariant: Record<string, "destructive" | "warning" | "success" | "secondary" | "info"> = {
  open: "destructive",
  in_progress: "warning",
  resolved: "success",
  closed: "secondary",
}

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [form, setForm] = useState({ issue_type: "", description: "", priority: "medium" })
  const { toast } = useToast()

  useEffect(() => {
    ticketsApi.list().then((res) => setTickets(res.data)).catch(() => {})
  }, [])

  const filtered = tickets.filter(
    (t) =>
      (statusFilter === "all" || t.status === statusFilter) &&
      (priorityFilter === "all" || t.priority === priorityFilter) &&
      (t.issue_type.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase()))
  )

  const handleCreate = () => {
    const newTicket: Ticket = {
      id: Date.now(),
      ...form,
      priority: form.priority as Ticket["priority"],
      status: "open",
      created_at: new Date().toISOString(),
    }
    ticketsApi.create(form).catch(() => {})
    setTickets([newTicket, ...tickets])
    setOpen(false)
    toast({ title: "Ticket created!" })
  }

  const updateStatus = (id: number, status: Ticket["status"]) => {
    ticketsApi.update(id, { status }).catch(() => {})
    setTickets(tickets.map((t) => t.id === id ? { ...t, status } : t))
    toast({ title: "Ticket updated" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
          <p className="text-gray-500 text-sm">Manage issues and service requests</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["open", "in_progress", "resolved", "closed"].map((status) => (
          <div key={status} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-3xl font-bold text-gray-800">{tickets.filter(t => t.status === status).length}</div>
            <div className="text-sm text-gray-500 mt-1">{statusLabel[status]}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {["critical", "high", "medium", "low"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>#</TableHead>
              <TableHead>Issue Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Update Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-sm text-gray-400">#{ticket.id}</TableCell>
                <TableCell className="font-medium text-gray-800">{ticket.issue_type}</TableCell>
                <TableCell className="text-gray-600 text-sm max-w-xs truncate">{ticket.description}</TableCell>
                <TableCell>
                  <Badge variant={priorityVariant[ticket.priority]} className="capitalize">{ticket.priority}</Badge>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">{ticket.assigned_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[ticket.status]}>{statusLabel[ticket.status]}</Badge>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">{formatDate(ticket.created_at)}</TableCell>
                <TableCell>
                  <Select value={ticket.status} onValueChange={(v) => updateStatus(ticket.id, v as Ticket["status"])}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabel).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
            <DialogDescription>Report an issue or service request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select value={form.issue_type} onValueChange={(v) => setForm({ ...form, issue_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {["Maintenance", "IT Support", "Billing", "Housekeeping", "Security", "Other"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Describe the issue..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
