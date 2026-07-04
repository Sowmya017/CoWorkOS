"use client"
import React, { useState } from "react"
import { WorkspaceObject } from "@/types"
import { OBJECT_CONFIGS, STATUS_COLORS } from "@/lib/workspaceConfig"
import { workspaceBookingsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface BookingModalProps {
  object: WorkspaceObject
  onClose: () => void
  onBooked: () => void
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`
}

export default function WorkspaceBookingModal({ object, onClose, onBooked }: BookingModalProps) {
  const { toast } = useToast()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [booking, setBooking] = useState(false)
  const cfg = OBJECT_CONFIGS[object.object_type]
  const amenitiesList = object.amenities
    ? object.amenities.split(",").map((a) => a.trim()).filter(Boolean)
    : []

  const handleBook = async () => {
    if (!startTime || !endTime) {
      toast({ title: "Please select start and end time", variant: "destructive" })
      return
    }
    if (new Date(endTime) <= new Date(startTime)) {
      toast({ title: "End time must be after start time", variant: "destructive" })
      return
    }
    setBooking(true)
    try {
      await workspaceBookingsApi.create({
        workspace_object_id: object.id,
        branch_id: object.branch_id,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      })
      toast({ title: `${object.label || cfg.label} booked successfully!` })
      onBooked()
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const msg = typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: any) => d.msg || d).join(", ")
        : err?.message || "Booking failed — please try again"
      toast({ title: msg, variant: "destructive" })
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cfg.emoji}</span>
            <div>
              <h2 className="font-semibold text-slate-800">{object.label || cfg.label}</h2>
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5"
                style={{
                  background: STATUS_COLORS[object.status] + "22",
                  color: STATUS_COLORS[object.status],
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: STATUS_COLORS[object.status] }}
                />
                {object.status.charAt(0).toUpperCase() + object.status.slice(1)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Capacity</p>
              <p className="font-semibold text-slate-700">{object.capacity}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Per Hour</p>
              <p className="font-semibold text-slate-700">{formatCurrency(object.price_per_hour)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Per Day</p>
              <p className="font-semibold text-slate-700">{formatCurrency(object.price_per_day)}</p>
            </div>
          </div>

          {/* Amenities */}
          {amenitiesList.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {amenitiesList.map((a) => (
                  <span key={a} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Booking form */}
          {(object.status === "available" || object.status === "premium") && object.is_bookable ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <button
                onClick={handleBook}
                disabled={booking}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {booking ? "Booking…" : "Confirm Booking"}
              </button>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-slate-500">
                {!object.is_bookable
                  ? "This space is not bookable."
                  : `This space is currently ${object.status}.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
