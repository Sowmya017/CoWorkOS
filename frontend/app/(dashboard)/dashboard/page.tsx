"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, Armchair, UserCheck, CalendarDays,
  IndianRupee, FileText, Ticket, TrendingUp, ArrowUpRight, RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { dashboardApi, branchesApi } from "@/lib/api"
import { DashboardAnalytics, Branch } from "@/types"
import { formatCurrency } from "@/lib/utils"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from "recharts"
import { useAuth } from "@/contexts/AuthContext"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

const mockAnalytics: DashboardAnalytics = {
  total_branches: 5,
  occupied_seats: 142,
  available_seats: 58,
  visitors_today: 34,
  active_bookings: 89,
  total_revenue: 1850000,
  pending_invoices: 12,
  open_tickets: 7,
  revenue_chart: [
    { month: "Jan", revenue: 1200000 },
    { month: "Feb", revenue: 1350000 },
    { month: "Mar", revenue: 1180000 },
    { month: "Apr", revenue: 1600000 },
    { month: "May", revenue: 1450000 },
    { month: "Jun", revenue: 1850000 },
  ],
  booking_trend: [
    { date: "Mon", bookings: 45 },
    { date: "Tue", bookings: 62 },
    { date: "Wed", bookings: 58 },
    { date: "Thu", bookings: 71 },
    { date: "Fri", bookings: 89 },
    { date: "Sat", bookings: 34 },
    { date: "Sun", bookings: 21 },
  ],
  seat_type_breakdown: [
    { type: "Hot Desk", count: 80 },
    { type: "Dedicated", count: 60 },
    { type: "Private Office", count: 40 },
    { type: "Conference", count: 20 },
  ],
}

const branchRevenue = [
  { branch: "Koramangala", revenue: 520000 },
  { branch: "Indiranagar", revenue: 380000 },
  { branch: "Bandra", revenue: 460000 },
  { branch: "Connaught Pl", revenue: 640000 },
  { branch: "Anna Nagar", revenue: 220000 },
]

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  change?: string
  positive?: boolean
  color: string
  bgColor: string
}

function KPICard({ title, value, icon: Icon, change, positive = true, color, bgColor }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className={`w-3 h-3 ${positive ? "text-green-500" : "text-red-400 rotate-90"}`} />
              <span className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
                {change} vs last month
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(mockAnalytics)
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchFilter, setBranchFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("monthly")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.role === "client") router.replace("/my-space")
  }, [user, router])

  useEffect(() => {
    branchesApi.list().then((res) => setBranches(res.data)).catch(() => {})
  }, [])

  const fetchAnalytics = (bId?: string, period?: string) => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (bId && bId !== "all") params.branch_id = bId
    if (period) params.period = period
    dashboardApi.analytics(params)
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics(mockAnalytics))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAnalytics(branchFilter, dateFilter) }, [branchFilter, dateFilter])

  const kpis = [
    { title: "Total Branches", value: analytics.total_branches, icon: Building2, color: "text-blue-600", bgColor: "bg-blue-50", change: "+1", positive: true },
    { title: "Occupied Seats", value: analytics.occupied_seats, icon: Armchair, color: "text-emerald-600", bgColor: "bg-emerald-50", change: "+12", positive: true },
    { title: "Available Seats", value: analytics.available_seats, icon: Armchair, color: "text-violet-600", bgColor: "bg-violet-50" },
    { title: "Visitors Today", value: analytics.visitors_today, icon: UserCheck, color: "text-amber-600", bgColor: "bg-amber-50", change: "+8", positive: true },
    { title: "Active Bookings", value: analytics.active_bookings, icon: CalendarDays, color: "text-sky-600", bgColor: "bg-sky-50", change: "+5", positive: true },
    { title: "Monthly Revenue", value: formatCurrency(analytics.total_revenue), icon: IndianRupee, color: "text-green-600", bgColor: "bg-green-50", change: "+28%", positive: true },
    { title: "Pending Invoices", value: analytics.pending_invoices, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-50", change: "-3", positive: false },
    { title: "Open Tickets", value: analytics.open_tickets, icon: Ticket, color: "text-red-600", bgColor: "bg-red-50", change: "+2", positive: false },
  ]

  const occupancyPct = Math.round((analytics.occupied_seats / (analytics.occupied_seats + analytics.available_seats)) * 100) || 0

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Welcome back, <span className="font-medium text-gray-700">{user?.name?.split(" ")[0]}</span>!
            Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.branch_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => fetchAnalytics(branchFilter, dateFilter)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => <KPICard key={kpi.title} {...kpi} />)}
      </div>

      {/* Occupancy progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Overall Occupancy</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{occupancyPct}%</p>
          </div>
          <Badge variant={occupancyPct > 80 ? "destructive" : occupancyPct > 60 ? "warning" : "success"}>
            {occupancyPct > 80 ? "High Demand" : occupancyPct > 60 ? "Moderate" : "Available"}
          </Badge>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${occupancyPct > 80 ? "bg-red-500" : occupancyPct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{analytics.occupied_seats} occupied</span>
          <span>{analytics.available_seats} available</span>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analytics.revenue_chart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seat Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={analytics.seat_type_breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="type">
                  {analytics.seat_type_breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue per Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={branchRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="branch" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.booking_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
