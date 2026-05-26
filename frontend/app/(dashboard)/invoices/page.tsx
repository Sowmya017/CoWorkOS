"use client"
import { useEffect, useState, useCallback } from "react"
import { Plus, CheckCircle, Search, Trash2, Edit2, FileText, TrendingUp, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { invoicesApi, usersApi } from "@/lib/api"
import { Invoice, User } from "@/types"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { TableSkeleton } from "@/components/common/PageSkeleton"

const SUBSCRIPTION_TYPES = ["Hot Desk", "Dedicated Desk", "Private Office", "Conference Room", "Enterprise", "One-Time"]

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  draft:   { label: "Draft",   class: "bg-gray-100 text-gray-600" },
  sent:    { label: "Sent",    class: "bg-blue-100 text-blue-700" },
  paid:    { label: "Paid",    class: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", class: "bg-red-100 text-red-700" },
}

const EMPTY_FORM = {
  client_name: "",
  client_id: "" as number | "",
  amount: "" as number | "",
  due_date: "",
  status: "draft" as Invoice["status"],
  subscription_type: "",
  notes: "",
}

const MOCK: Invoice[] = [
  { id: 1, client_id: 2, client_name: "TechStart Pvt Ltd",  amount: 25000, due_date: "2025-06-01T00:00:00", status: "sent",    created_at: "2025-05-01T00:00:00", subscription_type: "Dedicated Desk",   invoice_number: "INV-2025-001" },
  { id: 2, client_id: 3, client_name: "Creative Agency",     amount: 16000, due_date: "2025-05-28T00:00:00", status: "overdue", created_at: "2025-04-28T00:00:00", subscription_type: "Hot Desk",         invoice_number: "INV-2025-002" },
  { id: 3, client_id: 4, client_name: "FinCorp Solutions",   amount: 50000, due_date: "2025-06-15T00:00:00", status: "paid",    created_at: "2025-05-15T00:00:00", subscription_type: "Private Office",   invoice_number: "INV-2025-003" },
  { id: 4, client_id: 5, client_name: "EduTech India",       amount: 8000,  due_date: "2025-06-10T00:00:00", status: "draft",   created_at: "2025-05-20T00:00:00", subscription_type: "Hot Desk",         invoice_number: "INV-2025-004" },
  { id: 5, client_id: 6, client_name: "GreenBuild Co",       amount: 30000, due_date: "2025-05-30T00:00:00", status: "sent",    created_at: "2025-05-05T00:00:00", subscription_type: "Enterprise",       invoice_number: "INV-2025-005" },
  { id: 6, client_id: 7, client_name: "MediaBlast",          amount: 12000, due_date: "2025-05-20T00:00:00", status: "paid",    created_at: "2025-04-20T00:00:00", subscription_type: "Conference Room",  invoice_number: "INV-2025-006" },
]

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK)
  const [clients, setClients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [clientSearch, setClientSearch] = useState("")
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const { toast } = useToast()

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await invoicesApi.list()
      if (res.data?.length) setInvoices(res.data)
    } catch { /* use mock */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchInvoices()
    usersApi.list().then((res) => setClients(res.data?.filter((u: User) => u.role === "client") || [])).catch(() => {})
  }, [fetchInvoices])

  // Filtered clients for autocomplete
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 6)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.client_name.trim()) e.client_name = "Client name is required"
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Amount must be greater than 0"
    if (!form.due_date) e.due_date = "Due date is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setClientSearch("")
    setOpen(true)
  }

  const openEdit = (inv: Invoice) => {
    setEditing(inv)
    setForm({
      client_name: inv.client_name || "",
      client_id: inv.client_id || "",
      amount: inv.amount,
      due_date: inv.due_date ? inv.due_date.split("T")[0] : "",
      status: inv.status,
      subscription_type: inv.subscription_type || "",
      notes: inv.notes || "",
    })
    setErrors({})
    setClientSearch(inv.client_name || "")
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    const payload = {
      client_name: form.client_name.trim(),
      client_id: form.client_id ? Number(form.client_id) : undefined,
      amount: Number(form.amount),
      due_date: new Date(form.due_date).toISOString(),
      status: form.status,
      subscription_type: form.subscription_type || undefined,
      notes: form.notes || undefined,
    }
    try {
      if (editing) {
        const res = await invoicesApi.update(editing.id, payload)
        setInvoices((prev) => prev.map((i) => i.id === editing.id ? res.data : i))
        toast({ title: "Invoice updated successfully" })
      } else {
        const res = await invoicesApi.create(payload)
        setInvoices((prev) => [res.data, ...prev])
        toast({ title: "Invoice created successfully" })
      }
      setOpen(false)
    } catch {
      // optimistic local update on API failure
      if (editing) {
        setInvoices((prev) => prev.map((i) => i.id === editing.id ? { ...i, ...payload } : i))
        toast({ title: "Invoice updated (offline mode)" })
      } else {
        const localInv: Invoice = { id: Date.now(), ...payload, created_at: new Date().toISOString(), invoice_number: `INV-${Date.now()}` }
        setInvoices((prev) => [localInv, ...prev])
        toast({ title: "Invoice created (offline mode)" })
      }
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkPaid = async (id: number) => {
    try {
      await invoicesApi.markPaid(id)
    } catch { /* optimistic */ }
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "paid" as const } : i))
    toast({ title: "Invoice marked as paid" })
  }

  const handleDelete = async (id: number) => {
    try {
      await invoicesApi.delete(id)
    } catch { /* optimistic */ }
    setInvoices((prev) => prev.filter((i) => i.id !== id))
    toast({ title: "Invoice deleted" })
  }

  const filtered = invoices.filter(
    (inv) =>
      (statusFilter === "all" || inv.status === statusFilter) &&
      (inv.client_name || "").toLowerCase().includes(search.toLowerCase())
  )

  const totalCollected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const pendingAmount = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0)
  const overdueCount = invoices.filter((i) => i.status === "overdue").length
  const draftCount = invoices.filter((i) => i.status === "draft").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500 text-sm">Manage billing and payment collection</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: formatCurrency(totalCollected), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending Amount",  value: formatCurrency(pendingAmount),  icon: Clock,      color: "text-amber-600", bg: "bg-amber-50"  },
          { label: "Overdue",         value: `${overdueCount} invoices`,     icon: AlertCircle,color: "text-red-600",   bg: "bg-red-50"    },
          { label: "Draft",           value: `${draftCount} invoices`,       icon: FileText,   color: "text-gray-600",  bg: "bg-gray-50"   },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg)}>
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
            <div>
              <div className={cn("text-xl font-bold", item.color)}>{item.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by client name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : filtered.map((invoice) => {
                const sc = STATUS_CONFIG[invoice.status]
                return (
                  <TableRow key={invoice.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-sm text-gray-500">
                      {invoice.invoice_number || `INV-${String(invoice.id).padStart(4, "0")}`}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{invoice.client_name || "—"}</p>
                        {invoice.client_id && <p className="text-xs text-gray-400">ID: {invoice.client_id}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{invoice.subscription_type || "—"}</TableCell>
                    <TableCell className="font-semibold text-gray-800">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell className={cn("text-sm", invoice.status === "overdue" ? "text-red-600 font-medium" : "text-gray-600")}>
                      {formatDate(invoice.due_date)}
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", sc.class)}>{sc.label}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(invoice.status === "sent" || invoice.status === "overdue") && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkPaid(invoice.id)} className="gap-1 h-7 text-xs text-green-600 border-green-200 hover:bg-green-50">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </Button>
                        )}
                        <button onClick={() => openEdit(invoice)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(invoice.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update invoice details below." : "Fill in the details to generate a new invoice."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Client Name with autocomplete */}
            <div className="space-y-1.5 relative">
              <Label>Client Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. TechStart Pvt Ltd"
                value={clientSearch || form.client_name}
                onChange={(e) => {
                  setClientSearch(e.target.value)
                  setForm({ ...form, client_name: e.target.value, client_id: "" })
                  setShowClientSuggestions(true)
                  if (errors.client_name) setErrors({ ...errors, client_name: "" })
                }}
                onFocus={() => setShowClientSuggestions(true)}
                onBlur={() => setTimeout(() => setShowClientSuggestions(false), 150)}
                className={errors.client_name ? "border-red-400" : ""}
              />
              {errors.client_name && <p className="text-xs text-red-500">{errors.client_name}</p>}
              {/* Autocomplete dropdown */}
              {showClientSuggestions && filteredClients.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onMouseDown={() => {
                        setForm({ ...form, client_name: c.name, client_id: c.id })
                        setClientSearch(c.name)
                        setShowClientSuggestions(false)
                        setErrors({ ...errors, client_name: "" })
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      <span className="font-medium text-gray-800">{c.name}</span>
                      <span className="text-xs text-gray-400">ID: {c.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Client ID */}
              <div className="space-y-1.5">
                <Label>Client ID <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input
                  type="number"
                  placeholder="Auto-filled or enter ID"
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value ? parseInt(e.target.value) : "" })}
                  className="text-sm"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  placeholder="e.g. 25000"
                  value={form.amount}
                  onChange={(e) => {
                    setForm({ ...form, amount: e.target.value ? parseFloat(e.target.value) : "" })
                    if (errors.amount) setErrors({ ...errors, amount: "" })
                  }}
                  className={errors.amount ? "border-red-400" : ""}
                />
                {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <Label>Due Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => {
                    setForm({ ...form, due_date: e.target.value })
                    if (errors.due_date) setErrors({ ...errors, due_date: "" })
                  }}
                  className={errors.due_date ? "border-red-400" : ""}
                />
                {errors.due_date && <p className="text-xs text-red-500">{errors.due_date}</p>}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Invoice["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Subscription Type */}
              <div className="space-y-1.5 col-span-2">
                <Label>Subscription Type <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Select value={form.subscription_type || "none"} onValueChange={(v) => setForm({ ...form, subscription_type: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Select plan type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / One-Time</SelectItem>
                    {SUBSCRIPTION_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 col-span-2">
                <Label>Notes <span className="text-gray-400 text-xs">(optional)</span></Label>
                <textarea
                  placeholder="Any additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
