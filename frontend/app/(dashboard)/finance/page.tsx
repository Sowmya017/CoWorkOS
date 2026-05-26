"use client"
import { useState, useEffect } from "react"
import {
  IndianRupee, TrendingUp, TrendingDown, Download, Plus, CheckCircle2,
  CreditCard, FileText, Users, BarChart2, Clock, AlertCircle, Trash2, Edit2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import RouteGuard from "@/components/layout/RouteGuard"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { invoicesApi, paymentsApi, subscriptionsApi, financeApi } from "@/lib/api"
import { Invoice, Payment, Subscription } from "@/types"

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_REVENUE = [
  { month: "Jun'24", revenue: 980000,  expenses: 340000, profit: 640000,  target: 1200000 },
  { month: "Jul'24", revenue: 1150000, expenses: 390000, profit: 760000,  target: 1200000 },
  { month: "Aug'24", revenue: 1050000, expenses: 365000, profit: 685000,  target: 1200000 },
  { month: "Sep'24", revenue: 1320000, expenses: 420000, profit: 900000,  target: 1300000 },
  { month: "Oct'24", revenue: 1480000, expenses: 450000, profit: 1030000, target: 1400000 },
  { month: "Nov'24", revenue: 1380000, expenses: 410000, profit: 970000,  target: 1400000 },
  { month: "Dec'24", revenue: 1720000, expenses: 520000, profit: 1200000, target: 1500000 },
  { month: "Jan'25", revenue: 1590000, expenses: 470000, profit: 1120000, target: 1500000 },
  { month: "Feb'25", revenue: 1680000, expenses: 490000, profit: 1190000, target: 1500000 },
  { month: "Mar'25", revenue: 1820000, expenses: 530000, profit: 1290000, target: 1600000 },
  { month: "Apr'25", revenue: 1960000, expenses: 560000, profit: 1400000, target: 1700000 },
  { month: "May'25", revenue: 2140000, expenses: 590000, profit: 1550000, target: 1800000 },
]

const MOCK_BRANCH_EARNINGS = [
  { branch: "Koramangala",  revenue: 1820000, expenses: 480000 },
  { branch: "Indiranagar",  revenue: 1240000, expenses: 310000 },
  { branch: "Bandra",       revenue: 2100000, expenses: 550000 },
  { branch: "Connaught Pl", revenue: 2680000, expenses: 640000 },
  { branch: "Anna Nagar",   revenue: 780000,  expenses: 220000 },
]

const INVOICE_STATUS_PIE = [
  { name: "Paid",    value: 7,  color: "#10b981" },
  { name: "Sent",    value: 4,  color: "#3b82f6" },
  { name: "Overdue", value: 2,  color: "#ef4444" },
  { name: "Draft",   value: 3,  color: "#9ca3af" },
]

const MOCK_SUB_GROWTH = [
  { month: "Jan", active: 22, new: 5  },
  { month: "Feb", active: 27, new: 8  },
  { month: "Mar", active: 33, new: 9  },
  { month: "Apr", active: 40, new: 11 },
  { month: "May", active: 48, new: 13 },
  { month: "Jun", active: 58, new: 15 },
]

const MOCK_INVOICES: Invoice[] = [
  { id: 1,  invoice_number: "INV-2025-001", client_id: 5,  client_name: "Sneha Gupta",    description: "Dedicated Desk Monthly — June 2025",   amount: 25000, due_date: "2025-06-07T00:00:00", status: "sent",    created_at: "2025-06-01T00:00:00" },
  { id: 2,  invoice_number: "INV-2025-002", client_id: 6,  client_name: "Vikram Singh",   description: "Private Office — May 2025",             amount: 16000, due_date: "2025-05-27T00:00:00", status: "overdue", created_at: "2025-05-01T00:00:00" },
  { id: 3,  invoice_number: "INV-2025-003", client_id: 7,  client_name: "Ananya Patel",   description: "Hot Desk x5 — Annual Plan",             amount: 50000, due_date: "2025-06-20T00:00:00", status: "paid",    created_at: "2025-05-15T00:00:00" },
  { id: 4,  invoice_number: "INV-2025-004", client_id: 8,  client_name: "Karthik Iyer",   description: "Enterprise Suite — Q2 2025",            amount: 75000, due_date: "2025-06-15T00:00:00", status: "sent",    created_at: "2025-06-01T00:00:00" },
  { id: 5,  invoice_number: "INV-2025-005", client_id: 9,  client_name: "Meera Krishnan", description: "Dedicated Desk — May 2025",             amount: 8000,  due_date: "2025-06-10T00:00:00", status: "draft",   created_at: "2025-06-03T00:00:00" },
  { id: 6,  invoice_number: "INV-2025-006", client_id: 5,  client_name: "Sneha Gupta",    description: "Conference Room (10 hrs) — May 2025",   amount: 30000, due_date: "2025-05-10T00:00:00", status: "paid",    created_at: "2025-04-28T00:00:00" },
  { id: 7,  invoice_number: "INV-2025-007", client_id: 6,  client_name: "Vikram Singh",   description: "Hot Desk Monthly — April 2025",         amount: 12000, due_date: "2025-04-15T00:00:00", status: "paid",    created_at: "2025-04-01T00:00:00" },
  { id: 8,  invoice_number: "INV-2025-008", client_id: 7,  client_name: "Ananya Patel",   description: "Private Office 3 months — Q2 2025",    amount: 45000, due_date: "2025-06-05T00:00:00", status: "sent",    created_at: "2025-05-20T00:00:00" },
  { id: 9,  invoice_number: "INV-2025-009", client_id: 8,  client_name: "Karthik Iyer",   description: "Dedicated Desk x2 — May 2025",         amount: 20000, due_date: "2025-05-05T00:00:00", status: "overdue", created_at: "2025-04-15T00:00:00" },
  { id: 10, invoice_number: "INV-2025-010", client_id: 9,  client_name: "Meera Krishnan", description: "Annual Hot Desk Membership",            amount: 60000, due_date: "2025-06-25T00:00:00", status: "draft",   created_at: "2025-06-05T00:00:00" },
]

const MOCK_PAYMENTS: Payment[] = [
  { id: 1, invoice_id: 3,  invoice_number: "INV-2025-003", client_name: "Ananya Patel",   amount: 50000, payment_status: "completed", payment_date: "2025-05-20T10:30:00", payment_method: "Bank Transfer", created_at: "2025-05-20T10:30:00" },
  { id: 2, invoice_id: 6,  invoice_number: "INV-2025-006", client_name: "Sneha Gupta",    amount: 30000, payment_status: "completed", payment_date: "2025-05-09T14:00:00", payment_method: "UPI",          created_at: "2025-05-09T14:00:00" },
  { id: 3, invoice_id: 7,  invoice_number: "INV-2025-007", client_name: "Vikram Singh",   amount: 12000, payment_status: "completed", payment_date: "2025-04-14T09:15:00", payment_method: "Cheque",       created_at: "2025-04-14T09:15:00" },
  { id: 4, invoice_id: 1,  invoice_number: "INV-2025-001", client_name: "Sneha Gupta",    amount: 25000, payment_status: "pending",   payment_date: undefined,             payment_method: "Bank Transfer", created_at: "2025-06-01T00:00:00" },
  { id: 5, invoice_id: 4,  invoice_number: "INV-2025-004", client_name: "Karthik Iyer",   amount: 75000, payment_status: "pending",   payment_date: undefined,             payment_method: "Wire",         created_at: "2025-06-01T00:00:00" },
]

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 1, client_id: 5, client_name: "Sneha Gupta",    plan_type: "dedicated",     start_date: "2025-01-01T00:00:00", end_date: "2025-12-31T00:00:00", status: "active",    amount: 8000,  branch_name: "Indiranagar Center", created_at: "2025-01-01T00:00:00" },
  { id: 2, client_id: 6, client_name: "Vikram Singh",   plan_type: "private_office",start_date: "2025-02-01T00:00:00", end_date: "2026-01-31T00:00:00", status: "active",    amount: 25000, branch_name: "Koramangala Hub",    created_at: "2025-02-01T00:00:00" },
  { id: 3, client_id: 7, client_name: "Ananya Patel",   plan_type: "hot_desk",      start_date: "2025-03-01T00:00:00", end_date: "2025-08-31T00:00:00", status: "active",    amount: 4000,  branch_name: "Bandra Workspace",   created_at: "2025-03-01T00:00:00" },
  { id: 4, client_id: 8, client_name: "Karthik Iyer",   plan_type: "enterprise",    start_date: "2025-01-01T00:00:00", end_date: "2025-12-31T00:00:00", status: "active",    amount: 50000, branch_name: "Connaught Place",    created_at: "2025-01-01T00:00:00" },
  { id: 5, client_id: 9, client_name: "Meera Krishnan", plan_type: "dedicated",     start_date: "2024-11-01T00:00:00", end_date: "2025-04-30T00:00:00", status: "expired",   amount: 8000,  branch_name: "Anna Nagar Hub",     created_at: "2024-11-01T00:00:00" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  paid:    "bg-emerald-100 text-emerald-700",
  sent:    "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  draft:   "bg-gray-100 text-gray-600",
}
const PAYMENT_BADGE: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100 text-amber-700",
  failed:    "bg-red-100 text-red-700",
  refunded:  "bg-purple-100 text-purple-700",
}
const PLAN_LABELS: Record<string, string> = {
  hot_desk: "Hot Desk", dedicated: "Dedicated", private_office: "Private Office", enterprise: "Enterprise",
}
const SUB_BADGE: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  expired:   "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
}

function KPICard({ label, value, sub, icon: Icon, color, bg, positive }: {
  label: string; value: string; sub: string; icon: React.ElementType
  color: string; bg: string; positive?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className={cn("text-xl font-bold mt-1", color)}>{value}</p>
          <p className={cn("text-xs mt-1", positive === false ? "text-red-500" : "text-emerald-600")}>{sub}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3", bg)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </div>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ summary }: { summary: Record<string, number> }) {
  const kpis = [
    { label: "Total Revenue",    value: formatCurrency(summary.total_revenue    || 38400000), sub: "+12.4% vs last month",   icon: IndianRupee,   color: "text-emerald-700", bg: "bg-emerald-50", positive: true },
    { label: "Monthly Earnings", value: formatCurrency(summary.monthly_earnings || 2140000),  sub: "May 2025",              icon: TrendingUp,    color: "text-blue-700",    bg: "bg-blue-50",    positive: true },
    { label: "Net Profit",       value: formatCurrency(summary.net_profit       || 26112000), sub: "68% profit margin",     icon: BarChart2,     color: "text-violet-700",  bg: "bg-violet-50",  positive: true },
    { label: "Pending Payments", value: formatCurrency(summary.pending_payments || 1200000),  sub: "4 invoices awaiting",   icon: Clock,         color: "text-amber-700",   bg: "bg-amber-50",   positive: false },
    { label: "Paid Invoices",    value: String(summary.paid_invoices || 7),                   sub: `of ${summary.total_invoices || 16} total`, icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50", positive: true },
    { label: "Outstanding Dues", value: formatCurrency(summary.outstanding_dues || 56000),    sub: "2 overdue invoices",    icon: AlertCircle,   color: "text-red-700",     bg: "bg-red-50",     positive: false },
  ]

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((k) => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Revenue vs Target (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={MOCK_REVENUE}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                <Area dataKey="profit"  name="Profit"  stroke="#3b82f6" fill="url(#profGrad)" strokeWidth={2} dot={false} />
                <Line dataKey="target"  name="Target"  stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Invoice Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={INVOICE_STATUS_PIE} cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                  dataKey="value" label={({ name, value }) => `${name} (${value})`}
                  labelLine={false} fontSize={10}>
                  {INVOICE_STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {INVOICE_STATUS_PIE.map((e) => (
                <div key={e.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-xs text-gray-500">{e.name}: {e.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Branch-wise Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MOCK_BRANCH_EARNINGS} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue"  name="Revenue"  fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Subscription Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MOCK_SUB_GROWTH}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="active" name="Active Subs" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} />
                <Line dataKey="new"    name="New This Month" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Invoices Tab ──────────────────────────────────────────────────────────────
function InvoicesTab({ invoices, setInvoices }: { invoices: Invoice[]; setInvoices: (i: Invoice[]) => void }) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [genOpen, setGenOpen] = useState(false)
  const [form, setForm] = useState({ client_name: "", description: "", amount: "", due_date: "", status: "draft" })

  const filtered = invoices.filter((inv) =>
    (statusFilter === "all" || inv.status === statusFilter) &&
    (inv.client_name?.toLowerCase().includes(search.toLowerCase()) ||
     inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
     inv.description?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleGenerate = async () => {
    const newInv: Invoice = {
      id: Date.now(), invoice_number: `INV-2025-${String(invoices.length + 1).padStart(3, "0")}`,
      client_id: 0, client_name: form.client_name, description: form.description,
      amount: parseFloat(form.amount) || 0, due_date: form.due_date + "T00:00:00",
      status: form.status as Invoice["status"], created_at: new Date().toISOString(),
    }
    try { await invoicesApi.create({ client_id: 1, amount: newInv.amount, due_date: newInv.due_date, description: form.description }) } catch {}
    setInvoices([newInv, ...invoices])
    setGenOpen(false)
    setForm({ client_name: "", description: "", amount: "", due_date: "", status: "draft" })
  }

  const handleMarkPaid = async (id: number) => {
    try { await invoicesApi.markPaid(id) } catch {}
    setInvoices(invoices.map((inv) => inv.id === id ? { ...inv, status: "paid" } : inv))
  }

  const handleDelete = (id: number) => setInvoices(invoices.filter((inv) => inv.id !== id))

  const stats = {
    paid:    invoices.filter((i) => i.status === "paid").length,
    sent:    invoices.filter((i) => i.status === "sent").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    draft:   invoices.filter((i) => i.status === "draft").length,
  }

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Draft",   count: stats.draft,   color: "text-gray-600",    bg: "bg-gray-50",    border: "border-gray-200"   },
          { label: "Sent",    count: stats.sent,    color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"   },
          { label: "Paid",    count: stats.paid,    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200"},
          { label: "Overdue", count: stats.overdue, color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"    },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors", s.bg, s.border)}
            onClick={() => setStatusFilter(statusFilter === s.label.toLowerCase() ? "all" : s.label.toLowerCase())}>
            <p className={cn("text-2xl font-bold", s.color)}>{s.count}</p>
            <p className={cn("text-xs font-medium", s.color)}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-60 h-9 text-sm" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              {["all","draft","sent","paid","overdue"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All Status" : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-9"><Download className="w-4 h-4" /> Export</Button>
          <Button size="sm" className="gap-1.5 h-9" onClick={() => setGenOpen(true)}><Plus className="w-4 h-4" /> Generate Invoice</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs text-gray-500">{inv.invoice_number}</TableCell>
                <TableCell className="font-medium text-sm text-gray-800">{inv.client_name || "—"}</TableCell>
                <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{inv.description || "—"}</TableCell>
                <TableCell className="font-semibold text-gray-800">{formatCurrency(inv.amount)}</TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(inv.due_date)}</TableCell>
                <TableCell>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", STATUS_BADGE[inv.status] || STATUS_BADGE.draft)}>
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {inv.status !== "paid" && (
                      <button onClick={() => handleMarkPaid(inv.id)}
                        className="p-1.5 rounded hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Mark as paid">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(inv.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Generate Invoice Dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Client Name <span className="text-red-500">*</span></Label>
              <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="e.g. TechStart Pvt Ltd" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Dedicated Desk — June 2025" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="25000" />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft","sent"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={!form.client_name || !form.amount || !form.due_date} className="gap-2">
                <FileText className="w-4 h-4" /> Generate Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
function PaymentsTab({ payments, setPayments }: { payments: Payment[]; setPayments: (p: Payment[]) => void }) {
  const [recOpen, setRecOpen] = useState(false)
  const [form, setForm] = useState({ invoice_number: "", client_name: "", amount: "", payment_method: "Bank Transfer" })

  const handleRecord = async () => {
    const newP: Payment = {
      id: Date.now(), invoice_id: 0, invoice_number: form.invoice_number, client_name: form.client_name,
      amount: parseFloat(form.amount) || 0, payment_status: "completed",
      payment_date: new Date().toISOString(), payment_method: form.payment_method,
      created_at: new Date().toISOString(),
    }
    try { await paymentsApi.create({ invoice_id: 1, amount: newP.amount, payment_method: form.payment_method }) } catch {}
    setPayments([newP, ...payments])
    setRecOpen(false)
    setForm({ invoice_number: "", client_name: "", amount: "", payment_method: "Bank Transfer" })
  }

  const totalCollected = payments.filter((p) => p.payment_status === "completed").reduce((s, p) => s + p.amount, 0)
  const pending = payments.filter((p) => p.payment_status === "pending").reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Collected</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Pending Collection</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(pending)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Transactions</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{payments.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5 h-9" onClick={() => setRecOpen(true)}>
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Payment ID</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs text-gray-400">PAY-{String(p.id).slice(-4).padStart(4, "0")}</TableCell>
                <TableCell className="font-mono text-xs text-gray-500">{p.invoice_number || "—"}</TableCell>
                <TableCell className="text-sm font-medium text-gray-800">{p.client_name || "—"}</TableCell>
                <TableCell className="font-semibold text-gray-800">{formatCurrency(p.amount)}</TableCell>
                <TableCell className="text-sm text-gray-500">{p.payment_method || "—"}</TableCell>
                <TableCell className="text-sm text-gray-500">{p.payment_date ? formatDate(p.payment_date) : "—"}</TableCell>
                <TableCell>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", PAYMENT_BADGE[p.payment_status] || PAYMENT_BADGE.pending)}>
                    {p.payment_status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={recOpen} onOpenChange={setRecOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Log a new payment received from a client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Invoice #</Label>
                <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="INV-2025-001" />
              </div>
              <div className="space-y-1.5">
                <Label>Client Name</Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Client name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="25000" />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Bank Transfer","UPI","Cheque","Credit Card","Wire"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setRecOpen(false)}>Cancel</Button>
              <Button onClick={handleRecord} disabled={!form.amount} className="gap-2">
                <CreditCard className="w-4 h-4" /> Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────────
function SubscriptionsTab({ subs, setSubs }: { subs: Subscription[]; setSubs: (s: Subscription[]) => void }) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ client_name: "", plan_type: "hot_desk", branch_name: "", amount: "", start_date: "", end_date: "" })

  const filtered = subs.filter((s) => statusFilter === "all" || s.status === statusFilter)
  const active = subs.filter((s) => s.status === "active")
  const mrr = active.reduce((sum, s) => sum + s.amount, 0)
  const arr = mrr * 12

  const handleAdd = async () => {
    const newSub: Subscription = {
      id: Date.now(), client_id: 0, client_name: form.client_name, plan_type: form.plan_type as Subscription["plan_type"],
      branch_name: form.branch_name, amount: parseFloat(form.amount) || 0,
      start_date: form.start_date + "T00:00:00", end_date: form.end_date + "T00:00:00",
      status: "active", created_at: new Date().toISOString(),
    }
    try { await subscriptionsApi.create({ client_id: 1, plan_type: form.plan_type, start_date: newSub.start_date, end_date: newSub.end_date, amount: newSub.amount }) } catch {}
    setSubs([newSub, ...subs])
    setAddOpen(false)
    setForm({ client_name: "", plan_type: "hot_desk", branch_name: "", amount: "", start_date: "", end_date: "" })
  }

  const handleCancel = (id: number) => setSubs(subs.map((s) => s.id === id ? { ...s, status: "cancelled" as const } : s))

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Active Subscriptions</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{active.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Monthly Recurring Revenue</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(mrr)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Annual Recurring Revenue</p>
          <p className="text-xl font-bold text-violet-700 mt-1">{formatCurrency(arr)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            {["all","active","expired","cancelled"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All Status" : s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5 h-9" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add Subscription
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Client</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium text-sm text-gray-800">{sub.client_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{PLAN_LABELS[sub.plan_type] || sub.plan_type}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{sub.branch_name || "—"}</TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(sub.start_date)}</TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(sub.end_date)}</TableCell>
                <TableCell className="font-semibold text-gray-800">{formatCurrency(sub.amount)}</TableCell>
                <TableCell>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", SUB_BADGE[sub.status] || SUB_BADGE.active)}>
                    {sub.status}
                  </span>
                </TableCell>
                <TableCell>
                  {sub.status === "active" && (
                    <button onClick={() => handleCancel(sub.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Cancel">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Subscription Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
            <DialogDescription>Create a new recurring subscription plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Client Name <span className="text-red-500">*</span></Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Client name" />
              </div>
              <div className="space-y-1.5">
                <Label>Plan Type</Label>
                <Select value={form.plan_type} onValueChange={(v) => setForm({ ...form, plan_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Amount (₹)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="8000" />
              </div>
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Branch</Label>
                <Input value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} placeholder="Branch name" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.client_name || !form.amount} className="gap-2">
                <Users className="w-4 h-4" /> Add Subscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Main Finance Page ─────────────────────────────────────────────────────────
function FinanceContent() {
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES)
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS)
  const [subs, setSubs]         = useState<Subscription[]>(MOCK_SUBSCRIPTIONS)

  useEffect(() => {
    financeApi.summary().then((r) => setSummary(r.data)).catch(() => {})
    invoicesApi.list().then((r) => { if (r.data?.length > 0) setInvoices(r.data) }).catch(() => {})
    paymentsApi.list().then((r) => { if (r.data?.length > 0) setPayments(r.data) }).catch(() => {})
    subscriptionsApi.list().then((r) => { if (r.data?.length > 0) setSubs(r.data) }).catch(() => {})
  }, [])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Finance ERP</h1>
          <p className="text-gray-500 text-sm">Billing, invoices, payments & subscriptions</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="h-10 gap-1">
          <TabsTrigger value="overview"       className="px-5 text-sm gap-2"><BarChart2    className="w-4 h-4" /> Overview</TabsTrigger>
          <TabsTrigger value="invoices"       className="px-5 text-sm gap-2"><FileText     className="w-4 h-4" /> Invoices
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 rounded-full">{invoices.length}</span>
          </TabsTrigger>
          <TabsTrigger value="payments"       className="px-5 text-sm gap-2"><CreditCard   className="w-4 h-4" /> Payments</TabsTrigger>
          <TabsTrigger value="subscriptions"  className="px-5 text-sm gap-2"><Users        className="w-4 h-4" /> Subscriptions
            <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 rounded-full">{subs.filter((s) => s.status === "active").length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"      className="mt-5"><OverviewTab summary={summary} /></TabsContent>
        <TabsContent value="invoices"      className="mt-5"><InvoicesTab invoices={invoices} setInvoices={setInvoices} /></TabsContent>
        <TabsContent value="payments"      className="mt-5"><PaymentsTab payments={payments} setPayments={setPayments} /></TabsContent>
        <TabsContent value="subscriptions" className="mt-5"><SubscriptionsTab subs={subs} setSubs={setSubs} /></TabsContent>
      </Tabs>
    </div>
  )
}

export default function FinancePage() {
  return (
    <RouteGuard allowedRoles={["super_admin", "finance_team"]}>
      <FinanceContent />
    </RouteGuard>
  )
}
