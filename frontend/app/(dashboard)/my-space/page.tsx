"use client"
import { useEffect, useState } from "react"
import { CalendarDays, FileText, Ticket, Armchair, ArrowRight, CheckCircle, Clock, AlertCircle, ScanLine, QrCode, Download, Copy, Check, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { bookingsApi, invoicesApi, ticketsApi, subscriptionsApi, attendanceApi } from "@/lib/api"
import { Booking, Invoice, Ticket as TicketType, Subscription } from "@/types"
import ScanModal from "@/components/kiosk/ScanModal"

const RECEPTION_ROLES = ["receptionist", "branch_manager", "super_admin"]

export default function MySpacePage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [qrCopied, setQrCopied] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [memberQrToken, setMemberQrToken] = useState<string | null>(null)
  const [memberQrExpiry, setMemberQrExpiry] = useState<number>(0) // seconds remaining
  const [memberQrLoading, setMemberQrLoading] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      bookingsApi.list().catch(() => ({ data: [] })),
      invoicesApi.list().catch(() => ({ data: [] })),
      ticketsApi.list().catch(() => ({ data: [] })),
      subscriptionsApi.list().catch(() => ({ data: [] })),
    ]).then(([b, inv, t, sub]) => {
      const myBookings = (b.data || []).filter((x: Booking) => x.user_id === user?.id)
      const myInvoices = (inv.data || []).filter((x: Invoice) => x.client_id === user?.id)
      const mySubs = (sub.data || []).filter((x: Subscription) => x.client_id === user?.id)
      setBookings(myBookings)
      setInvoices(myInvoices)
      setTickets(t.data || [])
      setSubscription(mySubs.find((s: Subscription) => s.status === "active") || null)
    }).finally(() => setLoading(false))
  }, [user])

  // Client QR — fetch once on mount for non-reception roles, auto-countdown
  const fetchMemberQr = () => {
    if (!user || RECEPTION_ROLES.includes(user.role)) return
    setMemberQrLoading(true)
    attendanceApi.getQr()
      .then(r => {
        setMemberQrToken(r.data.token)
        setMemberQrExpiry(r.data.expires_in ?? 900)
      })
      .catch(() => {})
      .finally(() => setMemberQrLoading(false))
  }

  useEffect(() => {
    fetchMemberQr()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!memberQrToken) return
    if (memberQrExpiry <= 0) { fetchMemberQr(); return }
    const t = setTimeout(() => setMemberQrExpiry(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [memberQrToken, memberQrExpiry]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeBookings = bookings.filter(b => ["pending", "confirmed"].includes(b.booking_status))
  const pendingInvoices = invoices.filter(i => ["sent", "overdue"].includes(i.status))
  const openTickets = tickets.filter(t => ["open", "in_progress"].includes(t.status))
  const overdueInvoices = invoices.filter(i => i.status === "overdue")

  const planLabels: Record<string, string> = {
    hot_desk: "Hot Desk Plan",
    dedicated: "Dedicated Desk Plan",
    private_office: "Private Office Plan",
    enterprise: "Enterprise Plan",
  }

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-100 text-red-600",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#CC2229] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#CC2229] to-[#A51B21] rounded-2xl p-4 sm:p-6 text-white">
        <p className="text-red-200 text-xs sm:text-sm font-medium">Welcome back</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">{user?.name} 👋</h1>
        <p className="text-red-200 text-xs sm:text-sm mt-1">Here&apos;s a summary of your space activity</p>
      </div>

      {/* Reception QR card — receptionists / managers / admins only */}
      {user && RECEPTION_ROLES.includes(user.role) && (() => {
        const branchId = user.branch_id || 1
        const checkinUrl = typeof window !== "undefined"
          ? `${window.location.origin}/checkin?branch=${branchId}`
          : `/checkin?branch=${branchId}`
        const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(checkinUrl)}&bgcolor=ffffff&color=1e293b&margin=4`

        const handleCopy = () => {
          navigator.clipboard.writeText(checkinUrl)
          setQrCopied(true)
          setTimeout(() => setQrCopied(false), 2000)
        }
        const handleDownload = () => {
          const a = document.createElement("a")
          a.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(checkinUrl)}&bgcolor=ffffff&color=1e293b&margin=8`
          a.download = `checkin-qr-branch-${branchId}.png`
          a.click()
        }

        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <QrCode className="w-4 h-4 text-[#CC2229]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Your Reception QR</h2>
                <p className="text-xs text-gray-400">Display or print this — clients scan to check in</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* QR image */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImg} alt="Check-in QR" width={130} height={130} className="rounded-lg" />
              </div>

              {/* Info + actions */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">How clients use it</p>
                  <ol className="text-xs text-gray-500 space-y-0.5 list-decimal list-inside">
                    <li>Client opens phone camera</li>
                    <li>Points at this QR code</li>
                    <li>Taps the link — enters name &amp; checks in</li>
                    <li>Check-in recorded instantly</li>
                  </ol>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Button size="sm" className="gap-1.5 text-xs h-8 bg-[#CC2229] hover:bg-[#A51B21]" onClick={() => setScanOpen(true)}>
                    <Camera className="w-3.5 h-3.5" /> Scan QR
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleDownload}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleCopy}>
                    {qrCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {qrCopied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Client personal QR card */}
      {user && !RECEPTION_ROLES.includes(user.role) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <QrCode className="w-4 h-4 text-[#CC2229]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">My Check-In QR</h2>
              <p className="text-xs text-gray-400">Show this to reception or scan at the entrance</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* QR image */}
            <div className="relative p-3 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0">
              {memberQrToken ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                      typeof window !== "undefined"
                        ? `${window.location.origin}/checkin/${memberQrToken}`
                        : `/checkin/${memberQrToken}`
                    )}&bgcolor=ffffff&color=1e293b&margin=4`}
                    alt="My Check-In QR"
                    width={130}
                    height={130}
                    className="rounded-lg"
                  />
                  {/* Expiry overlay when almost expired */}
                  {memberQrExpiry <= 60 && memberQrExpiry > 0 && (
                    <div className="absolute inset-3 bg-white/90 rounded-lg flex items-center justify-center">
                      <p className="text-xs font-bold text-orange-500">Expires in {memberQrExpiry}s</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-[130px] h-[130px] rounded-lg bg-gray-100 flex items-center justify-center">
                  {memberQrLoading
                    ? <div className="w-6 h-6 border-2 border-[#CC2229] border-t-transparent rounded-full animate-spin" />
                    : <QrCode className="w-10 h-10 text-gray-300" />}
                </div>
              )}
            </div>

            {/* Info + actions */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              {memberQrToken && memberQrExpiry > 0 && (
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">
                    Valid for {Math.floor(memberQrExpiry / 60)}m {memberQrExpiry % 60}s
                  </span>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">How to use</p>
                <ol className="text-xs text-gray-500 space-y-0.5 list-decimal list-inside">
                  <li>Open this page at the entrance</li>
                  <li>Show the QR to the receptionist</li>
                  <li>They scan it — you&apos;re checked in instantly</li>
                </ol>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={fetchMemberQr}
                disabled={memberQrLoading}
              >
                <ScanLine className="w-3.5 h-3.5" />
                {memberQrLoading ? "Refreshing…" : "Refresh QR"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overdue alert */}
      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-semibold text-sm">
              You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? "s" : ""}
            </p>
            <p className="text-red-600 text-xs mt-0.5">
              Total overdue: ₹{overdueInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}
            </p>
          </div>
          <Link href="/my-invoices">
            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 text-xs">
              View invoices
            </Button>
          </Link>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Bookings</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{activeBookings.length}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#CC2229]" />
            </div>
          </div>
          <Link href="/book-seat" className="text-xs text-[#CC2229] font-medium mt-3 flex items-center gap-1 hover:gap-2 transition-all">
            Book a seat <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Invoices</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{pendingInvoices.length}</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <Link href="/my-invoices" className="text-xs text-[#CC2229] font-medium mt-3 flex items-center gap-1 hover:gap-2 transition-all">
            View invoices <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Tickets</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{openTickets.length}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <Link href="/my-tickets" className="text-xs text-[#CC2229] font-medium mt-3 flex items-center gap-1 hover:gap-2 transition-all">
            View tickets <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* My Plan */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">My Plan</h2>
        {subscription ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">{planLabels[subscription.plan_type] || subscription.plan_type}</span>
              <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
            </div>
            <div className="text-2xl font-bold text-[#CC2229]">₹{subscription.amount.toLocaleString()}<span className="text-sm font-normal text-gray-400">/month</span></div>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Branch</span>
                <span className="font-medium text-gray-700">{subscription.branch_name || `Branch #${subscription.branch_id}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Valid until</span>
                <span className="font-medium text-gray-700">{new Date(subscription.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Armchair className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No active plan</p>
            <p className="text-gray-400 text-xs mt-1">Contact the space team to subscribe</p>
          </div>
        )}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Recent Bookings</h2>
          <Link href="/book-seat">
            <Button size="sm" className="h-8 text-xs gap-1">
              <CalendarDays className="w-3 h-3" /> New Booking
            </Button>
          </Link>
        </div>
        {activeBookings.length > 0 ? (
          <div className="space-y-3">
            {activeBookings.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{b.seat_number || `Seat #${b.seat_id}`}</p>
                  <p className="text-xs text-gray-400">{b.branch_name} · {new Date(b.start_time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[b.booking_status]}`}>
                  {b.booking_status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No active bookings</p>
            <Link href="/book-seat">
              <Button size="sm" variant="outline" className="mt-3 text-xs">Book a seat now</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/book-seat", icon: Armchair, label: "Book a Seat", color: "bg-red-50 text-[#CC2229]" },
            { href: "/my-invoices", icon: FileText, label: "My Invoices", color: "bg-orange-50 text-orange-600" },
            { href: "/my-tickets", icon: Ticket, label: "Raise a Ticket", color: "bg-purple-50 text-purple-600" },
            { href: "/settings", icon: CheckCircle, label: "My Profile", color: "bg-green-50 text-green-600" },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100 text-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {scanOpen && <ScanModal onClose={() => setScanOpen(false)} />}
    </div>
  )
}
