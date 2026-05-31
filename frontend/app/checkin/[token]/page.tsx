"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { visitorsApi } from "@/lib/api"
import { CheckCircle, Loader2, XCircle, Building2, User, Briefcase, UserCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Visitor } from "@/types"

type Mode = "detecting" | "visitor_detail" | "visitor_done" | "error"

export default function CheckinPage() {
  const { token } = useParams<{ token: string }>()
  const [mode, setMode] = useState<Mode>("detecting")
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!token) return

    if (token.startsWith("visitor_")) {
      visitorsApi
        .getByToken(token)
        .then((res) => {
          setVisitor(res.data)
          setMode("visitor_detail")
        })
        .catch(() => {
          setErrorMsg("This QR code is invalid or has expired.")
          setMode("error")
        })
    } else {
      setErrorMsg("This QR code is not valid for visitor check-in.")
      setMode("error")
    }
  }, [token])

  const handleVisitorCheckin = async () => {
    if (!token) return
    setChecking(true)
    try {
      const res = await visitorsApi.checkinByToken(token)
      setVisitor(res.data)
      setMode("visitor_done")
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      const detail = err?.response?.data?.detail || "Check-in failed. Please try again."
      if (detail.includes("Already checked in")) {
        setMode("visitor_done")
      } else {
        setErrorMsg(detail)
        setMode("error")
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-[#CC2229] rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">CoWorkOS</span>
      </div>

      <div className="w-full max-w-sm">

        {/* Detecting */}
        {mode === "detecting" && (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="w-16 h-16 animate-spin text-[#CC2229]" />
            <p className="text-lg font-medium">Verifying QR code...</p>
          </div>
        )}

        {/* Visitor: show details + check-in button */}
        {mode === "visitor_detail" && visitor && (
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                {visitor.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{visitor.name}</h1>
                {visitor.company && <p className="text-sm text-gray-500">{visitor.company}</p>}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { icon: UserCheck, label: "Visiting", value: visitor.host_name },
                { icon: Briefcase, label: "Purpose", value: visitor.purpose || "—" },
                { icon: Building2, label: "Branch", value: visitor.branch_name || `Branch #${visitor.branch_id}` },
                { icon: User, label: "Phone", value: visitor.phone || "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 mb-5 text-xs text-amber-700">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Please confirm your details above before checking in.</span>
            </div>

            <Button
              className="w-full h-12 text-base gap-2 bg-[#CC2229] hover:bg-[#A51B21]"
              onClick={handleVisitorCheckin}
              disabled={checking}
            >
              {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {checking ? "Checking in..." : "Confirm Check-In"}
            </Button>
          </div>
        )}

        {/* Visitor: check-in success */}
        {mode === "visitor_done" && visitor && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Checked In</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome!</h1>
            <p className="text-xl font-semibold text-gray-700 mb-1">{visitor.name}</p>
            {visitor.company && <p className="text-gray-500 text-sm mb-3">{visitor.company}</p>}
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <div className="mt-5 py-3 px-4 bg-green-50 rounded-xl">
              <p className="text-green-700 text-sm font-medium">
                Visiting <span className="font-bold">{visitor.host_name}</span> · {visitor.purpose || "Welcome"}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {mode === "error" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid QR Code</h1>
            <p className="text-gray-500 text-sm leading-relaxed">{errorMsg}</p>
            <div className="mt-6 py-3 px-4 bg-red-50 rounded-xl">
              <p className="text-red-600 text-sm font-medium">Please contact the front desk for assistance.</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-xs mt-10">CS Coworking Spaces · Powered by CoWorkOS</p>
    </div>
  )
}
