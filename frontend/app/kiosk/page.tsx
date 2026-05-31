"use client"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"
import { CheckCircle, XCircle, Building2, ScanLine, Clock, Loader2 } from "lucide-react"
import { attendanceApi } from "@/lib/api"

const QrScanner = dynamic(() => import("@/components/kiosk/QrScanner"), { ssr: false })

type ScanResult = {
  action: "checkin" | "checkout"
  user_name: string
  message: string
  duration_minutes?: number
}

export default function KioskPage() {
  const [scannerReady, setScannerReady] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [cooldown, setCooldown] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }))
      setCurrentDate(now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const handleScan = useCallback(async (token: string) => {
    if (cooldown) return
    setCooldown(true)

    try {
      const res = await attendanceApi.scan(token)
      setResult(res.data)
      setStatus("success")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Invalid or expired QR code"
      setErrorMsg(msg)
      setStatus("error")
    }

    setTimeout(() => {
      setStatus("idle")
      setResult(null)
      setErrorMsg("")
      setCooldown(false)
    }, 4000)
  }, [cooldown])

  return (
    <div className="min-h-screen bg-[#111] flex flex-col select-none">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#CC2229] rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">CoWorkOS</p>
            <p className="text-slate-500 text-xs">Touchless Check-in</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-mono text-2xl font-bold tracking-wide">{currentTime}</p>
          <p className="text-slate-500 text-xs">{currentDate}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-10">

        <div className="text-center">
          <h1 className="text-white text-2xl font-bold">Scan your QR to Check In</h1>
          <p className="text-slate-400 text-sm mt-1">Open CoWorkOS app → My Space → show your QR code</p>
        </div>

        {/* Scanner card */}
        <div className="relative w-[320px] h-[320px]">

          {/* Corner decorations */}
          {[
            "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
            "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
            "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
            "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-10 h-10 border-[#CC2229] z-10 ${cls}`} />
          ))}

          {/* Camera feed */}
          <div className="w-full h-full rounded-2xl overflow-hidden bg-black">
            <QrScanner onScan={handleScan} onReady={() => setScannerReady(true)} />
          </div>

          {/* Overlay — success */}
          {status === "success" && result && (
            <div className="absolute inset-0 rounded-2xl bg-green-900/95 flex flex-col items-center justify-center gap-3 p-6 z-20">
              <CheckCircle className="w-16 h-16 text-green-400" />
              <div className="text-center">
                <p className="text-white font-bold text-xl">{result.user_name}</p>
                <p className={`text-sm font-semibold mt-1 ${result.action === "checkin" ? "text-green-300" : "text-blue-300"}`}>
                  {result.action === "checkin" ? "✓ Checked In" : "✓ Checked Out"}
                </p>
                <p className="text-slate-300 text-sm mt-2">{result.message}</p>
                {result.action === "checkout" && result.duration_minutes !== undefined && (
                  <p className="text-slate-400 text-xs mt-2 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Session: {result.duration_minutes} min
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Overlay — error */}
          {status === "error" && (
            <div className="absolute inset-0 rounded-2xl bg-red-900/95 flex flex-col items-center justify-center gap-3 p-6 z-20">
              <XCircle className="w-14 h-14 text-red-400" />
              <div className="text-center">
                <p className="text-white font-bold text-lg">Scan Failed</p>
                <p className="text-red-300 text-sm mt-1">{errorMsg}</p>
                <p className="text-slate-400 text-xs mt-3">Generate a fresh QR from the app</p>
              </div>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {!scannerReady ? (
            <><Loader2 className="w-4 h-4 text-slate-500 animate-spin" /><span className="text-slate-500 text-sm">Starting camera…</span></>
          ) : status === "idle" ? (
            <><span className="w-2 h-2 rounded-full bg-[#CC2229] animate-pulse" /><ScanLine className="w-4 h-4 text-slate-400" /><span className="text-slate-400 text-sm">Ready to scan</span></>
          ) : status === "success" ? (
            <><span className="w-2 h-2 rounded-full bg-green-400" /><span className="text-green-400 text-sm font-medium">Success — resetting…</span></>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-red-400 text-sm">Error — resetting…</span></>
          )}
        </div>

        {/* Scan again hint */}
        <div className="bg-white/5 rounded-2xl px-6 py-4 text-center max-w-sm">
          <p className="text-slate-300 text-sm font-medium">Scan again to check out</p>
          <p className="text-slate-500 text-xs mt-1">QR code is valid for 15 minutes · refresh in app if expired</p>
        </div>
      </div>

      <p className="text-center text-slate-700 text-xs pb-4">CoWorkOS Kiosk · Touchless Attendance System</p>
    </div>
  )
}
