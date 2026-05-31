"use client"
import { useEffect, useState, useCallback } from "react"
import { Users, Clock, LogOut, RefreshCw, CalendarDays, CheckCircle } from "lucide-react"
import { attendanceApi, branchesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AttendanceRecord {
  id: number
  user_id: number
  user_name: string | null
  branch_id: number
  branch_name: string | null
  check_in: string
  check_out: string | null
  status: string
}

interface Branch { id: number; branch_name: string }

function durationLabel(checkIn: string, checkOut: string | null) {
  const start = new Date(checkIn)
  const end = checkOut ? new Date(checkOut) : new Date()
  const mins = Math.floor((end.getTime() - start.getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function fmt(dt: string) {
  return new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState<string>("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params: Record<string, string> = { date }
    if (branchId) params.branch_id = branchId
    attendanceApi
      .list(params)
      .then((r) => setRecords(r.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [date, branchId])

  useEffect(() => {
    branchesApi.list().then((r) => setBranches(r.data || []))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  const present = records.filter((r) => r.status === "checked_in")
  const checkedOut = records.filter((r) => r.status === "checked_out")

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm mt-0.5">Live member check-in log · auto-refreshes every 30s</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Today", value: records.length, icon: CalendarDays, color: "bg-blue-50 text-blue-600" },
          { label: "Currently In", value: present.length, icon: CheckCircle, color: "bg-green-50 text-green-600" },
          { label: "Checked Out", value: checkedOut.length, icon: LogOut, color: "bg-slate-50 text-slate-500" },
          { label: "Unique Members", value: new Set(records.map((r) => r.user_id)).size, icon: Users, color: "bg-purple-50 text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#CC2229]/30"
          />
        </div>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#CC2229]/30"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.branch_name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && records.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Clock className="w-8 h-8 mb-2 text-gray-200" />
            <p className="text-sm">No attendance records for this date</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-800">
                    {r.user_name || `Member #${r.user_id}`}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {r.branch_name || `Branch #${r.branch_id}`}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-mono text-xs">{fmt(r.check_in)}</td>
                  <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                    {r.check_out ? fmt(r.check_out) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{durationLabel(r.check_in, r.check_out)}</td>
                  <td className="px-5 py-3.5">
                    {r.status === "checked_in" ? (
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">In Space</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">Checked Out</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
