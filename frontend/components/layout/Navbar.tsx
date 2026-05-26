"use client"
import { useState, useRef, useEffect } from "react"
import { Bell, Search, LogOut, Settings, User, ChevronDown, Check } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  branch_manager: "Branch Manager",
  finance_team: "Finance Team",
  sales_team: "Sales Team",
  receptionist: "Receptionist",
  client: "Client",
}

const notifications = [
  { id: 1, title: "New booking request", desc: "Rahul Sharma – Seat A-01", time: "2m ago", read: false },
  { id: 2, title: "Invoice overdue", desc: "Creative Agency – ₹16,000", time: "1h ago", read: false },
  { id: 3, title: "Ticket raised", desc: "AC not working in Zone B", time: "3h ago", read: true },
  { id: 4, title: "New lead added", desc: "FinCorp Solutions via LinkedIn", time: "5h ago", read: true },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState(notifications)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifs.filter((n) => !n.read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, read: true })))

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 z-30">
      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search..." className="pl-9 w-72 h-9 bg-gray-50 border-gray-200 focus:bg-white" />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className={cn("px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors", !n.read && "bg-blue-50/50")}
                    onClick={() => setNotifs(notifs.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      {n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-transparent flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 truncate">{n.desc}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <button className="text-xs text-blue-600 hover:underline">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500">{roleLabel[user?.role || ""] || user?.role}</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform hidden md:block", profileOpen && "rotate-180")} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <Badge variant="info" className="mt-1 text-xs py-0 h-4">
                  {roleLabel[user?.role || ""] || user?.role}
                </Badge>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { router.push("/settings"); setProfileOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => { setProfileOpen(false) }}
                >
                  <User className="w-4 h-4 text-gray-400" />
                  My Profile
                </button>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={() => { logout(); setProfileOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
