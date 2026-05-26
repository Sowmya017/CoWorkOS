"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import RouteGuard from "@/components/layout/RouteGuard"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, FunnelChart, Funnel,
  LabelList, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

// Branch comparison data
const branchComparison = [
  { branch: "Koramangala", revenue: 520000, occupancy: 78, bookings: 124, visitors: 340 },
  { branch: "Indiranagar", revenue: 380000, occupancy: 75, bookings: 98, visitors: 280 },
  { branch: "Bandra", revenue: 460000, occupancy: 82, bookings: 115, visitors: 310 },
  { branch: "Connaught Pl", revenue: 640000, occupancy: 89, bookings: 156, visitors: 420 },
  { branch: "Anna Nagar", revenue: 220000, occupancy: 55, bookings: 62, visitors: 180 },
]

// Lead conversion funnel
const leadFunnel = [
  { stage: "Total Leads", count: 240, fill: "#3b82f6" },
  { stage: "Contacted", count: 180, fill: "#6366f1" },
  { stage: "Qualified", count: 120, fill: "#8b5cf6" },
  { stage: "Proposal Sent", count: 75, fill: "#a855f7" },
  { stage: "Won", count: 42, fill: "#10b981" },
]

// Monthly revenue 12 months
const monthlyRevenue = [
  { month: "Jul '24", revenue: 980000, target: 1000000 },
  { month: "Aug '24", revenue: 1050000, target: 1050000 },
  { month: "Sep '24", revenue: 1120000, target: 1100000 },
  { month: "Oct '24", revenue: 1080000, target: 1150000 },
  { month: "Nov '24", revenue: 1200000, target: 1200000 },
  { month: "Dec '24", revenue: 1350000, target: 1250000 },
  { month: "Jan '25", revenue: 1200000, target: 1300000 },
  { month: "Feb '25", revenue: 1350000, target: 1350000 },
  { month: "Mar '25", revenue: 1180000, target: 1400000 },
  { month: "Apr '25", revenue: 1600000, target: 1450000 },
  { month: "May '25", revenue: 1450000, target: 1500000 },
  { month: "Jun '25", revenue: 1850000, target: 1600000 },
]

// Branch radar data
const branchRadar = [
  { metric: "Revenue", Koramangala: 78, Indiranagar: 58, Bandra: 70, Connaught: 95, AnnaNagar: 35 },
  { metric: "Occupancy", Koramangala: 78, Indiranagar: 75, Bandra: 82, Connaught: 89, AnnaNagar: 55 },
  { metric: "Bookings", Koramangala: 72, Indiranagar: 60, Bandra: 68, Connaught: 90, AnnaNagar: 40 },
  { metric: "Visitors", Koramangala: 68, Indiranagar: 56, Bandra: 62, Connaught: 84, AnnaNagar: 36 },
  { metric: "Tickets", Koramangala: 30, Indiranagar: 25, Bandra: 40, Connaught: 50, AnnaNagar: 20 },
]

const sourceBreakdown = [
  { source: "Website", leads: 72, fill: "#3b82f6" },
  { source: "Referral", leads: 58, fill: "#10b981" },
  { source: "LinkedIn", leads: 45, fill: "#f59e0b" },
  { source: "Cold Call", leads: 35, fill: "#ef4444" },
  { source: "Event", leads: 30, fill: "#8b5cf6" },
]

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function AnalyticsContent() {
  const [period, setPeriod] = useState("monthly")

  const conversionRate = Math.round((leadFunnel[4].count / leadFunnel[0].count) * 100)
  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)
  const avgOccupancy = Math.round(branchComparison.reduce((s, b) => s + b.occupancy, 0) / branchComparison.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500 text-sm">Deep-dive into performance metrics across all branches</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Annual Revenue" value={formatCurrency(totalRevenue)} sub="FY 2024–25" color="text-green-600" />
        <StatCard label="Avg Occupancy Rate" value={`${avgOccupancy}%`} sub="Across all branches" color="text-blue-600" />
        <StatCard label="Lead Conversion" value={`${conversionRate}%`} sub={`${leadFunnel[4].count} of ${leadFunnel[0].count} leads`} color="text-violet-600" />
        <StatCard label="Top Branch" value="Connaught Pl" sub="89% occupancy" color="text-amber-600" />
      </div>

      {/* Revenue vs Target */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Revenue vs Target (12 Months)</CardTitle>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-300 inline-block border-dashed border-t" /> Target</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" />
              <Line type="monotone" dataKey="target" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Branch Comparison + Lead Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Branch Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={branchComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {branchComparison.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lead Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 pt-2">
              {leadFunnel.map((stage, i) => {
                const pct = Math.round((stage.count / leadFunnel[0].count) * 100)
                return (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{stage.stage}</span>
                      <span className="font-semibold text-gray-800">{stage.count} <span className="text-xs text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md flex items-center px-3 transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: stage.fill }}
                      >
                        <span className="text-white text-xs font-medium truncate">{stage.stage}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Conversion Rate</span>
              <Badge variant="success" className="font-bold">{conversionRate}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy + Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Branch Occupancy Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-1">
              {branchComparison
                .sort((a, b) => b.occupancy - a.occupancy)
                .map((branch, i) => (
                  <div key={branch.branch} className="flex items-center gap-3">
                    <div className="w-5 text-xs text-gray-400 font-medium">{i + 1}</div>
                    <div className="w-28 text-sm text-gray-700 truncate">{branch.branch}</div>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${branch.occupancy}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                    <div className="w-10 text-sm font-semibold text-gray-700 text-right">{branch.occupancy}%</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sourceBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="leads" nameKey="source">
                    {sourceBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v + " leads", name]} />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Comparison Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Branch Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Branch", "Revenue", "Occupancy", "Bookings", "Visitors", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {branchComparison.sort((a, b) => b.revenue - a.revenue).map((branch, i) => (
                  <tr key={branch.branch} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</span>
                      {branch.branch}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{formatCurrency(branch.revenue)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${branch.occupancy}%` }} />
                        </div>
                        <span className="text-gray-700">{branch.occupancy}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{branch.bookings}</td>
                    <td className="py-3 px-4 text-gray-600">{branch.visitors}</td>
                    <td className="py-3 px-4">
                      <Badge variant={branch.occupancy > 80 ? "destructive" : branch.occupancy > 65 ? "warning" : "success"}>
                        {branch.occupancy > 80 ? "High Demand" : branch.occupancy > 65 ? "Moderate" : "Available"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <RouteGuard allowedRoles={["super_admin", "branch_manager", "finance_team", "sales_team"]}>
      <AnalyticsContent />
    </RouteGuard>
  )
}
