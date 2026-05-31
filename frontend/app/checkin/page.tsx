"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Cookies from "js-cookie"
import { authApi, attendanceApi, branchesApi } from "@/lib/api"
import { CheckCircle, LogOut, Loader2, XCircle, Building2, User, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mode = "loading" | "member_confirm" | "guest_form" | "success_checkin" | "success_checkout" | "error"

interface ResultData {
  name: string
  action: "checkin" | "checkout"
  branch_name?: string
  duration_minutes?: number
}

function BranchCheckinContent() {
  const searchParams = useSearchParams()
  const branchIdParam = searchParams.get("branch")

  const [mode, setMode] = useState<Mode>("loading")
  const [memberName, setMemberName] = useState("")
  const [branchName, setBranchName] = useState("")
  const [guestName, setGuestName] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [result, setResult] = useState<ResultData | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const branchId = branchIdParam ? parseInt(branchIdParam) : null

  useEffect(() => {
    if (!branchId) {
      setErrorMsg("Invalid QR code — no branch specified.")
      setMode("error")
      return
    }

    // Load branch name
    branchesApi.get(branchId).then(r => setBranchName(r.data?.branch_name || `Branch #${branchId}`)).catch(() => {})

    // Check if user is logged in
    const token = Cookies.get("access_token")
    if (token) {
      authApi.me()
        .then(r => {
          setMemberName(r.data?.name || "")
          setMode("member_confirm")
        })
        .catch(() => setMode("guest_form"))
    } else {
      setMode("guest_form")
    }
  }, [branchId])

  const handleMemberCheckin = async () => {
    if (!branchId) return
    setSubmitting(true)
    try {
      const res = await attendanceApi.branchCheckin({ branch_id: branchId })
      setResult({ name: res.data.name, action: res.data.action, branch_name: res.data.branch_name, duration_minutes: res.data.duration_minutes })
      setMode(res.data.action === "checkout" ? "success_checkout" : "success_checkin")
    } catch {
      setErrorMsg("Check-in failed. Please try again or contact the front desk.")
      setMode("error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleGuestCheckin = async () => {
    if (!branchId || !guestName.trim()) return
    setSubmitting(true)
    try {
      const res = await attendanceApi.branchCheckin({ branch_id: branchId, name: guestName.trim(), phone: guestPhone.trim() || undefined })
      setResult({ name: res.data.name, action: res.data.action, branch_name: res.data.branch_name })
      setMode("success_checkin")
    } catch {
      setErrorMsg("Check-in failed. Please try again or contact the front desk.")
      setMode("error")
    } finally {
      setSubmitting(false)
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

        {/* Loading */}
        {mode === "loading" && (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="w-16 h-16 animate-spin text-[#CC2229]" />
            <p className="text-lg font-medium">Loading check-in...</p>
          </div>
        )}

        {/* Member: confirm identity + one-tap check-in */}
        {mode === "member_confirm" && (
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#CC2229] to-[#A51B21] flex items-center justify-center text-white text-xl font-bold">
                {memberName.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Welcome back</p>
                <h1 className="text-xl font-bold text-gray-900">{memberName}</h1>
              </div>
            </div>

            {branchName && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{branchName}</span>
              </div>
            )}

            <Button
              className="w-full h-12 text-base gap-2 bg-[#CC2229] hover:bg-[#A51B21]"
              onClick={handleMemberCheckin}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {submitting ? "Processing..." : "Tap to Check In"}
            </Button>

            <p className="text-center text-xs text-gray-400 mt-4">
              Not you?{" "}
              <button onClick={() => setMode("guest_form")} className="text-[#CC2229] underline underline-offset-2">
                Check in as guest
              </button>
            </p>
          </div>
        )}

        {/* Guest: name + phone form */}
        {mode === "guest_form" && (
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome!</h1>
            {branchName && <p className="text-sm text-gray-400 mb-6">{branchName}</p>}
            {!branchName && <p className="text-sm text-gray-400 mb-6">Please enter your details to check in.</p>}

            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <User className="w-3.5 h-3.5 text-gray-400" /> Your Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Full name"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleGuestCheckin()}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone <span className="text-gray-400 text-xs font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder="10-digit mobile number"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleGuestCheckin()}
                  className="h-11"
                  type="tel"
                />
              </div>
            </div>

            <Button
              className="w-full h-12 text-base gap-2 bg-[#CC2229] hover:bg-[#A51B21]"
              onClick={handleGuestCheckin}
              disabled={submitting || !guestName.trim()}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {submitting ? "Checking in..." : "Check In"}
            </Button>
          </div>
        )}

        {/* Success: checked in */}
        {mode === "success_checkin" && result && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Checked In</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome!</h1>
            <p className="text-2xl font-semibold text-[#CC2229] mb-3">{result.name}</p>
            {result.branch_name && (
              <p className="text-gray-400 text-sm">{result.branch_name}</p>
            )}
            <p className="text-gray-400 text-sm mt-1">
              {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <div className="mt-5 py-3 px-4 bg-green-50 rounded-xl">
              <p className="text-green-700 text-sm font-medium">Have a great day! 🚀</p>
            </div>
          </div>
        )}

        {/* Success: checked out */}
        {mode === "success_checkout" && result && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <LogOut className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Checked Out</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Goodbye!</h1>
            <p className="text-2xl font-semibold text-[#CC2229] mb-3">{result.name}</p>
            {result.duration_minutes !== undefined && (
              <p className="text-gray-500 text-sm">
                You were here for{" "}
                <span className="font-semibold text-gray-700">
                  {Math.floor(result.duration_minutes / 60)}h {result.duration_minutes % 60}m
                </span>
              </p>
            )}
            <div className="mt-6 py-3 px-4 bg-blue-50 rounded-xl">
              <p className="text-blue-700 text-sm font-medium">See you next time! 👋</p>
            </div>
          </div>
        )}

        {/* Error */}
        {mode === "error" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
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

export default function BranchCheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#CC2229]" />
      </div>
    }>
      <BranchCheckinContent />
    </Suspense>
  )
}
