"use client"
import { useState } from "react"
import { Plus, LogOut, Search, Clock, Users, CheckCircle2, QrCode, Trash2, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import EmptyState from "@/components/common/EmptyState"
import Pagination from "@/components/common/Pagination"
import { TableSkeleton } from "@/components/common/PageSkeleton"
import { useVisitors } from "@/hooks/useVisitors"
import { Visitor } from "@/types"
import { formatDateTime, cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const PURPOSES = ["Meeting", "Interview", "Delivery", "Site Visit", "Demo", "Personal", "Other"]

const MOCK_VISITORS: Visitor[] = [
  { id: 1, name: "Rahul Sharma", phone: "9876543210", company: "TechCorp India", host_name: "Priya Mehta", branch_id: 1, check_in: new Date(Date.now() - 2 * 3600000).toISOString(), status: "checked_in" },
  { id: 2, name: "Ananya Patel", phone: "8765432109", company: "DesignHub", host_name: "Arjun Nair", branch_id: 1, check_in: new Date(Date.now() - 5 * 3600000).toISOString(), check_out: new Date(Date.now() - 2 * 3600000).toISOString(), status: "checked_out" },
  { id: 3, name: "Vikram Singh", phone: "7654321098", company: "StartupX", host_name: "Divya Rao", branch_id: 2, check_in: new Date(Date.now() - 1 * 3600000).toISOString(), status: "checked_in" },
  { id: 4, name: "Meera Iyer", phone: "6543210987", company: "MediaCo", host_name: "Rohan Joshi", branch_id: 3, check_in: new Date(Date.now() - 3 * 3600000).toISOString(), check_out: new Date(Date.now() - 1 * 3600000).toISOString(), status: "checked_out" },
  { id: 5, name: "Aditya Kumar", phone: "5432109876", company: "FinTech Ltd", host_name: "Sneha Gupta", branch_id: 1, check_in: new Date(Date.now() - 30 * 60000).toISOString(), status: "checked_in" },
  { id: 6, name: "Priya Rajan", phone: "4321098765", company: "EduTech Co", host_name: "Arjun Nair", branch_id: 2, check_in: new Date(Date.now() - 8 * 3600000).toISOString(), check_out: new Date(Date.now() - 6 * 3600000).toISOString(), status: "checked_out" },
  { id: 7, name: "Suresh Verma", phone: "3210987654", company: "GreenBuild", host_name: "Priya Mehta", branch_id: 1, check_in: new Date(Date.now() - 15 * 60000).toISOString(), status: "checked_in" },
  { id: 8, name: "Kavya Reddy", phone: "2109876543", company: "CraftWorks", host_name: "Divya Rao", branch_id: 3, check_in: new Date(Date.now() - 4 * 3600000).toISOString(), check_out: new Date(Date.now() - 2 * 3600000).toISOString(), status: "checked_out" },
]

const EMPTY_FORM = { name: "", phone: "", company: "", host_name: "", purpose: "Meeting", branch_id: 1 }

// Duration string from two timestamps
function duration(checkIn: string, checkOut?: string): string {
  const end = checkOut ? new Date(checkOut) : new Date()
  const mins = Math.floor((end.getTime() - new Date(checkIn).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// ─── Visitor row ──────────────────────────────────────────────────────────────
function VisitorRow({ visitor, onCheckout, onDelete }: { visitor: Visitor; onCheckout: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {visitor.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">{visitor.name}</p>
            <p className="text-xs text-gray-400">{visitor.phone}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-gray-600 text-sm">{visitor.company || "—"}</TableCell>
      <TableCell className="text-gray-600 text-sm">{visitor.host_name}</TableCell>
      <TableCell className="text-gray-500 text-sm">{formatDateTime(visitor.check_in)}</TableCell>
      <TableCell className="text-gray-500 text-sm">
        {visitor.check_out ? formatDateTime(visitor.check_out) : (
          <span className="flex items-center gap-1 text-green-600">
            <Clock className="w-3.5 h-3.5" />
            {duration(visitor.check_in)}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={visitor.status === "checked_in" ? "success" : "secondary"}>
          {visitor.status === "checked_in" ? "Checked In" : "Checked Out"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {visitor.status === "checked_in" && (
            <Button size="sm" variant="outline" onClick={() => onCheckout(visitor.id)} className="gap-1 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-3 h-3" /> Out
            </Button>
          )}
          <button onClick={() => onDelete(visitor.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function VisitorsPage() {
  const { visitors: apiVisitors, loading, checkIn, checkOut, deleteVisitor } = useVisitors()
  const [localVisitors, setLocalVisitors] = useState<Visitor[]>(MOCK_VISITORS)
  const visitors = apiVisitors.length > 0 ? apiVisitors : localVisitors
  const [open, setOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrBranch, setQrBranch] = useState("1")
  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState("all")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6
  const { toast } = useToast()
  const [form, setForm] = useState(EMPTY_FORM)

  const today = new Date().toDateString()
  const todayVisitors = visitors.filter((v) => new Date(v.check_in).toDateString() === today)
  const checkedInNow = visitors.filter((v) => v.status === "checked_in")
  const history = visitors.filter((v) => v.status === "checked_out")

  const filterVisitors = (list: Visitor[]) =>
    list.filter(
      (v) =>
        (branchFilter === "all" || String(v.branch_id) === branchFilter) &&
        (v.name.toLowerCase().includes(search.toLowerCase()) ||
          (v.company || "").toLowerCase().includes(search.toLowerCase()) ||
          v.host_name.toLowerCase().includes(search.toLowerCase()))
    )

  const paginate = (list: Visitor[]) => {
    const filtered = filterVisitors(list)
    return { items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: filtered.length }
  }

  const handleCheckIn = async () => {
    if (!form.name.trim()) { toast({ title: "Visitor name required", variant: "destructive" }); return }
    try {
      const newVisitor = await checkIn({ ...form, check_in: new Date().toISOString(), status: "checked_in" })
      if (!newVisitor) {
        const mock: Visitor = { id: Date.now(), ...form, check_in: new Date().toISOString(), status: "checked_in" }
        setLocalVisitors((prev) => [mock, ...prev])
      }
      setOpen(false)
      setForm(EMPTY_FORM)
      toast({ title: `${form.name} checked in!` })
    } catch {
      toast({ title: "Check-in failed", variant: "destructive" })
    }
  }

  const handleCheckout = async (id: number) => {
    try {
      await checkOut(id)
      setLocalVisitors((prev) => prev.map((v) => v.id === id ? { ...v, status: "checked_out", check_out: new Date().toISOString() } : v))
      toast({ title: "Visitor checked out" })
    } catch {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const handleDelete = (id: number) => {
    deleteVisitor(id)
    setLocalVisitors((prev) => prev.filter((v) => v.id !== id))
    toast({ title: "Visitor removed" })
  }

  function TableView({ list }: { list: Visitor[] }) {
    const { items, total } = paginate(list)
    if (filterVisitors(list).length === 0) {
      return <EmptyState icon={Users} title="No visitors found" description="Try adjusting your search or filters." />
    }
    return (
      <>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Visitor</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Duration / Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((v) => (
                <VisitorRow key={v.id} visitor={v} onCheckout={handleCheckout} onDelete={handleDelete} />
              ))}
            </TableBody>
          </Table>
        </div>
        {total > PAGE_SIZE && (
          <Pagination currentPage={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visitors</h1>
          <p className="text-gray-500 text-sm">Track and manage front-desk check-ins</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 hidden md:flex" onClick={() => setQrOpen(true)}>
            <QrCode className="w-4 h-4" /> QR Check-In
          </Button>
          <Button onClick={() => { setForm(EMPTY_FORM); setOpen(true) }} className="gap-2">
            <Plus className="w-4 h-4" /> Check In Visitor
          </Button>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Currently Inside", value: checkedInNow.length, icon: Users, color: "text-green-600", bg: "bg-green-50" },
          { label: "Today's Visitors", value: todayVisitors.length, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total History", value: history.length, icon: Clock, color: "text-gray-600", bg: "bg-gray-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg)}>
              <s.icon className={cn("w-5 h-5", s.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name, company, host..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 w-72 h-9" />
        </div>
        <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPage(1) }}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Branches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            <SelectItem value="1">Koramangala Hub</SelectItem>
            <SelectItem value="2">Indiranagar Center</SelectItem>
            <SelectItem value="3">Bandra Workspace</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="today" onValueChange={() => setPage(1)}>
        <TabsList className="h-9">
          <TabsTrigger value="today" className="text-xs px-4">
            Today <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 rounded-full">{todayVisitors.length}</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs px-4">
            Active <span className="ml-1.5 bg-green-100 text-green-700 text-xs px-1.5 rounded-full">{checkedInNow.length}</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs px-4">All Visitors</TabsTrigger>
          <TabsTrigger value="history" className="text-xs px-4">History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          {loading ? <TableSkeleton rows={5} cols={7} /> : <TableView list={todayVisitors} />}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {loading ? <TableSkeleton rows={5} cols={7} /> : <TableView list={checkedInNow} />}
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          {loading ? <TableSkeleton rows={5} cols={7} /> : <TableView list={visitors} />}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {loading ? <TableSkeleton rows={5} cols={7} /> : <TableView list={history} />}
        </TabsContent>
      </Tabs>

      {/* Check-In Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check In Visitor</DialogTitle>
            <DialogDescription>Register a new visitor at the front desk.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Visitor Name <span className="text-red-500">*</span></Label>
                <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="10-digit number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input placeholder="Company name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Host Name <span className="text-red-500">*</span></Label>
                <Input placeholder="Who are they visiting?" value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Purpose</Label>
                <Select value={form.purpose} onValueChange={(v) => setForm({ ...form, purpose: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCheckIn} disabled={!form.name.trim()}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Check In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Check-In Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" /> QR Check-In
            </DialogTitle>
            <DialogDescription>
              Display this QR code at the front desk. Visitors scan it to self-check-in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Branch selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Branch</label>
              <Select value={qrBranch} onValueChange={setQrBranch}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Koramangala Hub</SelectItem>
                  <SelectItem value="2">Indiranagar Center</SelectItem>
                  <SelectItem value="3">Bandra Workspace</SelectItem>
                  <SelectItem value="4">Connaught Place</SelectItem>
                  <SelectItem value="5">Anna Nagar Hub</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="p-3 bg-white rounded-2xl border-2 border-gray-200 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`http://localhost:3000/checkin?branch=${qrBranch}`)}&bgcolor=ffffff&color=1e293b&margin=4`}
                  alt="QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-full border">
                  localhost:3000/checkin?branch={qrBranch}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold text-blue-800">How it works</p>
              <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
                <li>Print or display this QR on a tablet/screen</li>
                <li>Visitor scans with their phone camera</li>
                <li>They fill in name, company & host</li>
                <li>Auto check-in recorded instantly</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 text-sm"
                onClick={() => {
                  const link = document.createElement("a")
                  link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`http://localhost:3000/checkin?branch=${qrBranch}`)}`
                  link.download = `checkin-qr-branch-${qrBranch}.png`
                  link.click()
                }}
              >
                <Download className="w-4 h-4" /> Download
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-sm"
                onClick={() => setQrBranch(qrBranch)}
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
