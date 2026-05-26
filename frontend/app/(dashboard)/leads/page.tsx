"use client"
import { useState } from "react"
import {
  Plus, MoreHorizontal, Edit2, Trash2, Search,
  Briefcase, TrendingUp, Users, Target, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import EmptyState from "@/components/common/EmptyState"
import { TableSkeleton } from "@/components/common/PageSkeleton"
import { useLeads } from "@/hooks/useLeads"
import { Lead } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { formatDate, cn } from "@/lib/utils"

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGES: { id: Lead["status"]; label: string; color: string; bg: string; border: string }[] = [
  { id: "new",       label: "New",          color: "text-blue-700",  bg: "bg-blue-50",    border: "border-blue-200" },
  { id: "contacted", label: "Contacted",    color: "text-indigo-700",bg: "bg-indigo-50",  border: "border-indigo-200" },
  { id: "qualified", label: "Qualified",    color: "text-violet-700",bg: "bg-violet-50",  border: "border-violet-200" },
  { id: "proposal",  label: "Proposal",     color: "text-amber-700", bg: "bg-amber-50",   border: "border-amber-200" },
  { id: "won",       label: "Won",          color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200" },
  { id: "lost",      label: "Lost",         color: "text-red-700",   bg: "bg-red-50",     border: "border-red-200" },
]

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
}

const SOURCES = ["Website", "Referral", "LinkedIn", "Cold Call", "Event", "Other"]

// ─── Lead Card ────────────────────────────────────────────────────────────────
function LeadCard({
  lead,
  onEdit,
  onDelete,
  onDragStart,
}: {
  lead: Lead
  onEdit: (l: Lead) => void
  onDelete: (id: number) => void
  onDragStart: (e: React.DragEvent, id: number) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm leading-tight truncate">{lead.company_name}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.contact_person}</p>
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
              <button
                onClick={() => { onEdit(lead); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => { onDelete(lead.id); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", PRIORITY_COLORS[lead.priority])}>
          {lead.priority}
        </span>
        {lead.source && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{lead.source}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{formatDate(lead.created_at)}</span>
        {lead.assigned_name && (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
              {lead.assigned_name.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({
  stage,
  leads,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}: {
  stage: typeof STAGES[0]
  leads: Lead[]
  onEdit: (l: Lead) => void
  onDelete: (id: number) => void
  onDragStart: (e: React.DragEvent, id: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, status: Lead["status"]) => void
  isDragTarget: boolean
}) {
  return (
    <div className="flex flex-col min-w-[240px] max-w-[260px] flex-shrink-0">
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-3 py-2 rounded-xl mb-3 border", stage.bg, stage.border)}>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", stage.color)}>{stage.label}</span>
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", stage.bg, stage.color)}>
            {leads.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, stage.id)}
        className={cn(
          "flex-1 rounded-xl min-h-[120px] space-y-3 p-2 transition-all duration-200",
          isDragTarget ? "bg-blue-50 border-2 border-dashed border-blue-300" : "border-2 border-transparent"
        )}
      >
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <p className="text-xs text-gray-400">Drop leads here</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { company_name: "", contact_person: "", source: "Website", status: "new" as Lead["status"], priority: "medium" as Lead["priority"] }

export default function LeadsPage() {
  const { leads, loading, addLead, updateLead, moveLead, deleteLead, leadsByStage } = useLeads()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragTarget, setDragTarget] = useState<Lead["status"] | null>(null)
  const { toast } = useToast()

  // Analytics
  const total = leads.length
  const won = leads.filter((l) => l.status === "won").length
  const lost = leads.filter((l) => l.status === "lost").length
  const convRate = total > 0 ? Math.round((won / total) * 100) : 0

  // Search filter
  const filteredLeadsByStage = (stage: Lead["status"]) =>
    leadsByStage(stage).filter(
      (l) =>
        l.company_name.toLowerCase().includes(search.toLowerCase()) ||
        (l.contact_person || "").toLowerCase().includes(search.toLowerCase())
    )

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = "move"
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }
  const handleDrop = async (e: React.DragEvent, status: Lead["status"]) => {
    e.preventDefault()
    if (dragId == null) return
    const lead = leads.find((l) => l.id === dragId)
    if (lead && lead.status !== status) {
      await moveLead(dragId, status)
      toast({ title: `Lead moved to ${status.charAt(0).toUpperCase() + status.slice(1)}` })
    }
    setDragId(null)
    setDragTarget(null)
  }

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true) }
  const openEdit = (l: Lead) => {
    setEditing(l)
    setForm({ company_name: l.company_name, contact_person: l.contact_person || "", source: l.source || "Website", status: l.status, priority: l.priority })
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await updateLead(editing.id, form)
        toast({ title: "Lead updated" })
      } else {
        await addLead({ ...form, created_at: new Date().toISOString() })
        toast({ title: "Lead added" })
      }
      setOpen(false)
    } catch {
      toast({ title: "Error saving lead", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    await deleteLead(id)
    toast({ title: "Lead deleted" })
  }

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">CRM / Leads</h1>
          <p className="text-gray-500 text-sm">Drag cards between columns to update stage</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      {/* Analytics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Leads", value: total, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Conversion Rate", value: `${convRate}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Won", value: won, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Lost", value: lost, icon: Users, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs: Kanban / Table */}
      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <TabsList className="h-9">
            <TabsTrigger value="kanban" className="text-xs px-4">Kanban Board</TabsTrigger>
            <TabsTrigger value="table" className="text-xs px-4">Table View</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-56 text-sm"
            />
          </div>
        </div>

        {/* ── Kanban ── */}
        <TabsContent value="kanban" className="flex-1 mt-4">
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map((s) => (
                <div key={s.id} className="min-w-[240px] space-y-3">
                  <div className={cn("h-10 rounded-xl", s.bg)} />
                  {[1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
              {STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  leads={filteredLeadsByStage(stage.id)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onDragStart={handleDragStart}
                  onDragOver={(e) => { handleDragOver(e); setDragTarget(stage.id) }}
                  onDrop={handleDrop}
                  isDragTarget={dragTarget === stage.id && dragId != null}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Table ── */}
        <TabsContent value="table" className="mt-4">
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : leads.length === 0 ? (
            <EmptyState icon={Briefcase} title="No leads yet" description="Add your first lead to start tracking your pipeline." action={{ label: "Add Lead", onClick: openAdd }} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads
                    .filter((l) => l.company_name.toLowerCase().includes(search.toLowerCase()))
                    .map((lead) => {
                      const stage = STAGES.find((s) => s.id === lead.status)!
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium text-gray-800">{lead.company_name}</TableCell>
                          <TableCell className="text-gray-600">{lead.contact_person || "—"}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{lead.source || "—"}</TableCell>
                          <TableCell>
                            <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", stage.color, stage.bg, stage.border)}>
                              {stage.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", PRIORITY_COLORS[lead.priority])}>
                              {lead.priority}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">{lead.assigned_name || "—"}</TableCell>
                          <TableCell className="text-gray-400 text-sm">{formatDate(lead.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(lead)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
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
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lead" : "Add New Lead"}</DialogTitle>
            <DialogDescription>Fill in the lead details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Company Name <span className="text-red-500">*</span></Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Acme Corp" />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Lead["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Lead["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.company_name}>{editing ? "Update" : "Add Lead"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
