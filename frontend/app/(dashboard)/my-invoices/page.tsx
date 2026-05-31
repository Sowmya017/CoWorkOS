"use client"
import { useEffect, useState, ElementType } from "react"
import { FileText, Search, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { invoicesApi } from "@/lib/api"
import { Invoice } from "@/types"
import { useAuth } from "@/contexts/AuthContext"

const statusConfig: Record<string, { label: string; color: string; icon: ElementType }> = {
  draft:   { label: "Draft",   color: "bg-gray-100 text-gray-600",   icon: Clock },
  sent:    { label: "Sent",    color: "bg-blue-100 text-blue-700",   icon: FileText },
  paid:    { label: "Paid",    color: "bg-green-100 text-green-700", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700",     icon: AlertCircle },
}

export default function MyInvoicesPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    invoicesApi.list()
      .then(res => {
        const mine = (res.data || []).filter((inv: Invoice) => inv.client_id === user?.id)
        setInvoices(mine)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const filtered = invoices.filter(inv =>
    (statusFilter === "all" || inv.status === statusFilter) &&
    ((inv.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
     (inv.description || "").toLowerCase().includes(search.toLowerCase()))
  )

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + i.amount, 0)
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Invoices</h1>
        <p className="text-gray-500 text-sm">View your billing history and payment status</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{invoices.filter(i => i.status === "paid").length} invoice(s)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Payment</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">₹{totalPending.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{invoices.filter(i => i.status === "sent").length} invoice(s)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className={`text-2xl font-bold mt-1 ${totalOverdue > 0 ? "text-red-600" : "text-gray-400"}`}>₹{totalOverdue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{invoices.filter(i => i.status === "overdue").length} invoice(s)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
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
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No invoices found</p>
          <p className="text-gray-400 text-sm mt-1">Your billing history will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Invoice #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inv => {
                const cfg = statusConfig[inv.status] || statusConfig.draft
                const Icon = cfg.icon
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm text-gray-600">{inv.invoice_number || `#${inv.id}`}</TableCell>
                    <TableCell className="text-gray-700 text-sm">{inv.description || inv.subscription_type || "—"}</TableCell>
                    <TableCell className="font-semibold text-gray-800">₹{inv.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(inv.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
