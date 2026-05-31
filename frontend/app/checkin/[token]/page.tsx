"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { attendanceApi } from "@/lib/api"
import { CheckCircle, LogOut, Loader2, XCircle, Building2 } from "lucide-react"

type Status = "loading" | "checkin" | "checkout" | "error"

export default function CheckinPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<Status>("loading")
  const [userName, setUserName] = useState("")
  const [message, setMessage] = useState("")
  const [duration, setDuration] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    attendanceApi
      .scan(token)
      .then((res) => {
        const data = res.data
        setUserName(data.user_name)
        setMessage(data.message)
        setDuration(data.duration_minutes ?? null)
        setStatus(data.action === "checkout" ? "checkout" : "checkin")
      })
      .catch(() => {
        setMessage("QR code is invalid or has expired. Please refresh your QR from the app.")
        setStatus("error")
      })
  }, [token])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Logo bar */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-[#CC2229] rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">CoWorkOS</span>
      </div>

      <div className="w-full max-w-sm">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="w-16 h-16 animate-spin text-[#CC2229]" />
            <p className="text-lg font-medium">Verifying your QR code...</p>
          </div>
        )}

        {status === "checkin" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Checked In</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {userName}!</h1>
            <p className="text-gray-500 text-sm">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            <div className="mt-6 py-3 px-4 bg-green-50 rounded-xl">
              <p className="text-green-700 text-sm font-medium">Have a productive day 🚀</p>
            </div>
          </div>
        )}

        {status === "checkout" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <LogOut className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Checked Out</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Goodbye, {userName}!</h1>
            {duration !== null && (
              <p className="text-gray-500 text-sm">
                You worked for <span className="font-semibold text-gray-700">{Math.floor(duration / 60)}h {duration % 60}m</span>
              </p>
            )}
            <div className="mt-6 py-3 px-4 bg-blue-50 rounded-xl">
              <p className="text-blue-700 text-sm font-medium">See you next time! 👋</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">QR Expired</h1>
            <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
            <div className="mt-6 py-3 px-4 bg-red-50 rounded-xl">
              <p className="text-red-600 text-sm font-medium">Open the CoWorkOS app → My Space → refresh QR</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-xs mt-10">CS Coworking Spaces · Powered by CoWorkOS</p>
    </div>
  )
}
