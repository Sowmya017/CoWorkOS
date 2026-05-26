"use client"
import { useEffect, useState } from "react"
import { Plus, MapPin, Edit2, Trash2, Building2 } from "lucide-react"
import RouteGuard from "@/components/layout/RouteGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { branchesApi } from "@/lib/api"
import { Branch } from "@/types"
import { useToast } from "@/components/ui/use-toast"

const mockBranches: Branch[] = [
  { id: 1, branch_name: "Koramangala Hub", location: "Bangalore", total_seats: 80, occupied_seats: 62 },
  { id: 2, branch_name: "Indiranagar Center", location: "Bangalore", total_seats: 60, occupied_seats: 45 },
  { id: 3, branch_name: "Bandra Workspace", location: "Mumbai", total_seats: 100, occupied_seats: 78 },
  { id: 4, branch_name: "Connaught Place", location: "Delhi", total_seats: 120, occupied_seats: 95 },
  { id: 5, branch_name: "Anna Nagar Hub", location: "Chennai", total_seats: 40, occupied_seats: 22 },
]

function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(mockBranches)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ branch_name: "", location: "", total_seats: 0 })
  const { toast } = useToast()

  useEffect(() => {
    branchesApi.list().then((res) => setBranches(res.data)).catch(() => {})
  }, [])

  const filtered = branches.filter(
    (b) =>
      b.branch_name.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setEditing(null); setForm({ branch_name: "", location: "", total_seats: 0 }); setOpen(true) }
  const openEdit = (b: Branch) => { setEditing(b); setForm({ branch_name: b.branch_name, location: b.location, total_seats: b.total_seats }); setOpen(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        const res = await branchesApi.update(editing.id, form).catch(() => null)
        const updated = res?.data || { ...editing, ...form }
        setBranches(branches.map((b) => (b.id === editing.id ? updated : b)))
        toast({ title: "Branch updated" })
      } else {
        const res = await branchesApi.create(form).catch(() => null)
        const newBranch = res?.data || { id: Date.now(), ...form, occupied_seats: 0 }
        setBranches([...branches, newBranch])
        toast({ title: "Branch created" })
      }
      setOpen(false)
    } catch {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    branchesApi.delete(id).catch(() => {})
    setBranches(branches.filter((b) => b.id !== id))
    toast({ title: "Branch deleted" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Branches</h1>
          <p className="text-gray-500 text-sm">Manage all your coworking locations</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Branch
        </Button>
      </div>

      <div className="flex gap-4">
        <Input placeholder="Search branches..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((branch) => {
          const occupancy = Math.round((branch.occupied_seats / branch.total_seats) * 100)
          return (
            <Card key={branch.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(branch)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(branch.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">{branch.branch_name}</h3>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {branch.location}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Occupancy</span>
                    <span className="font-medium">{occupancy}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${occupancy > 80 ? "bg-red-500" : occupancy > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{branch.occupied_seats} occupied</span>
                    <span>{branch.total_seats - branch.occupied_seats} available</span>
                  </div>
                </div>
                <Badge variant={occupancy > 80 ? "destructive" : "success"} className="mt-3">
                  {occupancy > 80 ? "Almost Full" : "Available"}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Branch" : "Add New Branch"}</DialogTitle>
            <DialogDescription>Fill in the branch details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} placeholder="e.g. Koramangala Hub" />
            </div>
            <div className="space-y-2">
              <Label>Location / City</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bangalore" />
            </div>
            <div className="space-y-2">
              <Label>Total Seats</Label>
              <Input type="number" value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: parseInt(e.target.value) || 0 })} placeholder="100" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BranchesPageGuarded() {
  return (
    <RouteGuard allowedRoles={["super_admin", "branch_manager"]}>
      <BranchesPage />
    </RouteGuard>
  )
}
