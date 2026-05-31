"use client"
import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { CheckCircle, XCircle, X, Camera, ScanLine, Clock } from "lucide-react"
import { attendanceApi } from "@/lib/api"

interface Props {
  onClose: () => void
}

type Result = {
  action: "checkin" | "checkout"
  user_name: string
  message: string
  duration_minutes?: number
} | null

export default function ScanModal({ onClose }: Props) {
  const [status, setStatus] = useState<"scanning" | "success" | "error">("scanning")
  const [result, setResult] = useState<Result>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [cooldown, setCooldown] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const startedRef = useRef(false)
  const qrRef = useRef<Html5Qrcode | null>(null)

  const handleScan = async (token: string) => {
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

    // Reset after 3 seconds, keep scanning
    setTimeout(() => {
      setStatus("scanning")
      setResult(null)
      setErrorMsg("")
      setCooldown(false)
    }, 3000)
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const qr = new Html5Qrcode("receptionist-qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    qrRef.current = qr

    // Try back camera first, fallback to any camera
    qr.start(
      { facingMode: "environment" },
      { fps: 12, qrbox: { width: 220, height: 220 } },
      (text) => handleScan(text),
      () => {}
    )
      .then(() => setCameraReady(true))
      .catch(() => {
        qr.start(
          { facingMode: "user" },
          { fps: 12, qrbox: { width: 220, height: 220 } },
          (text) => handleScan(text),
          () => {}
        )
          .then(() => setCameraReady(true))
          .catch(() => {
            setErrorMsg("Camera access denied. Please allow camera permission.")
            setStatus("error")
          })
      })

    return () => {
      qr.isScanning && qr.stop().catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-[#CC2229]" />
            <h2 className="font-semibold text-gray-800">Scan Member QR</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera area */}
        <div className="relative bg-black" style={{ height: 280 }}>
          {/* Camera feed */}
          <div id="receptionist-qr-reader" className="w-full h-full" />

          {/* Corner brackets */}
          {[
            "top-4 left-4 border-t-2 border-l-2 rounded-tl-lg",
            "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg",
            "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg",
            "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-7 h-7 border-[#CC2229] z-10 ${cls}`} />
          ))}

          {/* Loading state */}
          {!cameraReady && status === "scanning" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-20">
              <Camera className="w-10 h-10 text-slate-400 animate-pulse" />
              <p className="text-slate-400 text-sm">Starting back camera…</p>
            </div>
          )}

          {/* Success overlay */}
          {status === "success" && result && (
            <div className="absolute inset-0 bg-green-900/95 flex flex-col items-center justify-center gap-2 z-20 p-4">
              <CheckCircle className="w-14 h-14 text-green-400" />
              <p className="text-white font-bold text-xl">{result.user_name}</p>
              <p className={`text-sm font-semibold ${result.action === "checkin" ? "text-green-300" : "text-blue-300"}`}>
                {result.action === "checkin" ? "✓ Checked In" : "✓ Checked Out"}
              </p>
              <p className="text-slate-300 text-xs text-center mt-1">{result.message}</p>
              {result.action === "checkout" && result.duration_minutes !== undefined && (
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> {result.duration_minutes} min session
                </p>
              )}
              <p className="text-green-500/60 text-xs mt-2 animate-pulse">Resuming scan…</p>
            </div>
          )}

          {/* Error overlay */}
          {status === "error" && errorMsg.includes("Camera") ? (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-3 z-20 p-6">
              <Camera className="w-12 h-12 text-gray-500" />
              <p className="text-white font-medium text-center">Camera access denied</p>
              <p className="text-gray-400 text-xs text-center">Allow camera permission in your browser settings, then reopen this scanner.</p>
            </div>
          ) : status === "error" && (
            <div className="absolute inset-0 bg-red-900/95 flex flex-col items-center justify-center gap-2 z-20 p-4">
              <XCircle className="w-12 h-12 text-red-400" />
              <p className="text-white font-bold">Scan Failed</p>
              <p className="text-red-300 text-xs text-center">{errorMsg}</p>
              <p className="text-red-400/60 text-xs mt-2 animate-pulse">Resuming scan…</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {cameraReady && status === "scanning" && (
              <><span className="w-2 h-2 rounded-full bg-[#CC2229] animate-pulse" />
              <span className="text-xs text-gray-500">Point camera at member&apos;s QR code</span></>
            )}
            {!cameraReady && status === "scanning" && (
              <span className="text-xs text-gray-400">Requesting camera…</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
