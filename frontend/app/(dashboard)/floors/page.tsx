"use client"
import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Floor, FloorAsset } from "@/types"
import { floorsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/AuthContext"

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20 MB

interface CreateFloorForm {
  name: string
  floor_number: string
  description: string
  branch_id: string
}

export default function FloorsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === "super_admin" || user?.role === "branch_manager"

  const [floors, setFloors] = useState<Floor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateFloorForm>({
    name: "", floor_number: "1", description: "", branch_id: "",
  })
  const [saving, setSaving] = useState(false)
  const [expandedFloor, setExpandedFloor] = useState<number | null>(null)
  const [floorAssets, setFloorAssets] = useState<Record<number, FloorAsset[]>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFor, setUploadingFor] = useState<number | null>(null)

  useEffect(() => {
    floorsApi.list().then((r) => {
      setFloors(r.data)
      setLoading(false)
    })
  }, [])

  // Group by branch
  const byBranch: Record<string, Floor[]> = {}
  floors.forEach((f) => {
    const key = String(f.branch_id)
    byBranch[key] = [...(byBranch[key] || []), f]
  })

  const handleCreate = async () => {
    if (!form.name || !form.branch_id) {
      toast({ title: "Name and Branch ID are required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const { data } = await floorsApi.create({
        name: form.name,
        floor_number: Number(form.floor_number),
        description: form.description || undefined,
        branch_id: Number(form.branch_id),
      })
      setFloors((prev) => [...prev, data])
      setShowCreate(false)
      setForm({ name: "", floor_number: "1", description: "", branch_id: "" })
      toast({ title: `Floor "${data.name}" created` })
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail || "Create failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete floor "${name}"? This will remove all layout data.`)) return
    await floorsApi.delete(id)
    setFloors((prev) => prev.filter((f) => f.id !== id))
    toast({ title: `Floor "${name}" deleted` })
  }

  const handleExpandAssets = async (floorId: number) => {
    if (expandedFloor === floorId) { setExpandedFloor(null); return }
    setExpandedFloor(floorId)
    if (!floorAssets[floorId]) {
      const { data } = await floorsApi.listAssets(floorId)
      setFloorAssets((prev) => ({ ...prev, [floorId]: data }))
    }
  }

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, floorId: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: "File exceeds 20 MB limit", variant: "destructive" })
      return
    }
    setUploadingFor(floorId)
    try {
      const { data } = await floorsApi.uploadAsset(floorId, file)
      setFloorAssets((prev) => ({
        ...prev,
        [floorId]: [...(prev[floorId] || []), data],
      }))
      toast({ title: "Floor plan uploaded" })
    } catch {
      toast({ title: "Upload failed", variant: "destructive" })
    } finally {
      setUploadingFor(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteAsset = async (floorId: number, assetId: number) => {
    await floorsApi.deleteAsset(floorId, assetId)
    setFloorAssets((prev) => ({
      ...prev,
      [floorId]: (prev[floorId] || []).filter((a) => a.id !== assetId),
    }))
    toast({ title: "Asset deleted" })
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">Loading floors…</div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Floor Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage floors and their visual layouts</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            + New Floor
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">New Floor</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Floor Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Main Office"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Floor Number</label>
              <input
                type="number"
                value={form.floor_number}
                onChange={(e) => setForm({ ...form, floor_number: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Branch ID *</label>
              <input
                type="number"
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                placeholder="Branch ID"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create Floor"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Floor list */}
      {floors.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-sm">No floors yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byBranch).map(([branchId, branchFloors]) => (
            <div key={branchId}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Branch ID: {branchId}
              </p>
              <div className="space-y-3">
                {branchFloors
                  .sort((a, b) => a.floor_number - b.floor_number)
                  .map((floor) => (
                    <div
                      key={floor.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    >
                      {/* Floor row */}
                      <div className="flex items-center px-5 py-4 gap-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                          F{floor.floor_number}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{floor.name}</p>
                          {floor.description && (
                            <p className="text-xs text-slate-500">{floor.description}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            href={`/floors/${floor.id}/book`}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          >
                            🪑 Book
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                href={`/floors/${floor.id}/layout`}
                                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                              >
                                ✏️ Edit Layout
                              </Link>
                              <button
                                onClick={() => handleExpandAssets(floor.id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                              >
                                🖼 Assets
                              </button>
                              <button
                                onClick={() => handleDelete(floor.id, floor.name)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Assets panel */}
                      {expandedFloor === floor.id && (
                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Floor Plan Assets
                            </p>
                            {isAdmin && (
                              <label className="cursor-pointer text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                                {uploadingFor === floor.id ? "Uploading…" : "Upload File"}
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept=".png,.jpg,.jpeg,.svg,.pdf,.webp"
                                  className="hidden"
                                  onChange={(e) => handleUploadAsset(e, floor.id)}
                                />
                              </label>
                            )}
                          </div>

                          {(floorAssets[floor.id] || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No assets uploaded yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {(floorAssets[floor.id] || []).map((asset) => (
                                <div
                                  key={asset.id}
                                  className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2"
                                >
                                  {asset.asset_type === "image" ? (
                                    <img
                                      src={`${process.env.NEXT_PUBLIC_API_URL}${asset.url}`}
                                      alt={asset.original_filename}
                                      className="w-12 h-12 object-cover rounded border"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded border text-slate-400 text-xl">
                                      📄
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-700">{asset.original_filename}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {asset.asset_type}{asset.file_size ? ` · ${(asset.file_size / 1024).toFixed(1)} KB` : ""}
                                    </p>
                                  </div>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeleteAsset(floor.id, asset.id)}
                                      className="text-red-400 hover:text-red-600 text-xs"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Toaster />
    </div>
  )
}
