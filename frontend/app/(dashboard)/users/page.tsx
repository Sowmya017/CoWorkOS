"use client"
import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Shield } from "lucide-react"
import RouteGuard from "@/components/layout/RouteGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usersApi } from "@/lib/api"
import { User, Role } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"

const mockUsers: User[] = [
  { id: 1, name: "Admin User", email: "admin@coworkos.com", role: "super_admin" },
  { id: 2, name: "Priya Mehta", email: "priya@coworkos.com", role: "branch_manager", branch_id: 1, branch_name: "Koramangala Hub" },
  { id: 3, name: "Arjun Nair", email: "arjun@coworkos.com", role: "receptionist", branch_id: 1, branch_name: "Koramangala Hub" },
  { id: 4, name: "Divya Rao", email: "divya@coworkos.com", role: "finance_team" },
  { id: 5, name: "Rohan Joshi", email: "rohan@coworkos.com", role: "sales_team" },
  { id: 6, name: "Sneha Gupta", email: "sneha@coworkos.com", role: "client", branch_id: 2, branch_name: "Indiranagar Center" },
]

const roleColors: Record<string, "default" | "success" | "info" | "warning" | "secondary" | "destructive"> = {
  super_admin: "destructive",
  branch_manager: "default",
  finance_team: "success",
  sales_team: "info",
  receptionist: "warning",
  client: "secondary",
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  branch_manager: "Branch Manager",
  finance_team: "Finance Team",
  sales_team: "Sales Team",
  receptionist: "Receptionist",
  client: "Client",
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" as Role })
  const { toast } = useToast()
  const { hasRole } = useAuth()

  useEffect(() => {
    usersApi.list().then((res) => setUsers(res.data)).catch(() => {})
  }, [])

  const filtered = users.filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  )

  const openAdd = () => { setEditing(null); setForm({ name: "", email: "", password: "", role: "client" }); setOpen(true) }
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, password: "", role: u.role }); setOpen(true) }

  const handleSave = () => {
    if (editing) {
      usersApi.update(editing.id, form).catch(() => {})
      setUsers(users.map((u) => u.id === editing.id ? { ...u, ...form } : u))
      toast({ title: "User updated" })
    } else {
      const newUser: User = { id: Date.now(), name: form.name, email: form.email, role: form.role }
      usersApi.create(form).catch(() => {})
      setUsers([...users, newUser])
      toast({ title: "User created" })
    }
    setOpen(false)
  }

  const handleDelete = (id: number) => {
    usersApi.delete(id).catch(() => {})
    setUsers(users.filter((u) => u.id !== id))
    toast({ title: "User deleted" })
  }

  const roleCounts = Object.keys(roleLabels).map((role) => ({
    role, count: users.filter((u) => u.role === role).length
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm">Manage team members and access roles</p>
        </div>
        {hasRole("super_admin") && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add User
          </Button>
        )}
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {roleCounts.map(({ role, count }) => (
          <div key={role} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter(role === roleFilter ? "all" : role)}>
            <div className="text-2xl font-bold text-gray-800">{count}</div>
            <div className="text-xs text-gray-400 mt-0.5">{roleLabels[role]}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                    <Badge variant={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">{user.branch_name || "—"}</TableCell>
                <TableCell>
                  {hasRole("super_admin") && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(user)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>Manage user access and role assignment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? "Update" : "Create User"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UsersPageGuarded() {
  return (
    <RouteGuard allowedRoles={["super_admin"]}>
      <UsersPage />
    </RouteGuard>
  )
}
