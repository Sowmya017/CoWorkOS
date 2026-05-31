"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Bell, Search, LogOut, Settings, User, ChevronDown, Check, BookOpen, FileText, Ticket, DoorOpen, Info, Menu } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { notificationsApi } from "@/lib/api"
import { Notification } from "@/types"

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  branch_manager: "Branch Manager",
  finance_team: "Finance Team",
  sales_team: "Sales Team",
  receptionist: "Receptionist",
  client: "Client",
}

const typeIcon: Record<string, React.ReactNode> = {
  booking: <BookOpen className="w-3.5 h-3.5 text-[#CC2229]" />,
  invoice: <FileText className="w-3.5 h-3.5 text-purple-500" />,
  ticket:  <Ticket className="w-3.5 h-3.5 text-orange-500" />,
  room:    <DoorOpen className="w-3.5 h-3.5 text-green-500" />,
  info:    <Info className="w-3.5 h-3.5 text-blue-500" />,
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface NavbarProps {
  onMenuClick?: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifs.filter(n => n.is_read === "false").length

  const fetchNotifs = useCallback(() => {
    notificationsApi.list()
      .then(r => setNotifs(r.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markRead = (id: number) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: "true" } : n))
    notificationsApi.markRead(id).catch(() => {})
  }

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, is_read: "true" })))
    notificationsApi.markAllRead().catch(() => {})
  }

  return (
    <header className="h-14 md:h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30">
      {/* Left: hamburger (mobile) + search (desktop) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-9 w-64 lg:w-72 h-9 bg-gray-50 border-gray-200 focus:bg-white" />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#CC2229] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-sm">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs bg-[#CC2229] text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#CC2229] hover:underline flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifs.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No notifications yet</p>
                  </div>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors",
                        n.is_read === "false" && "bg-red-50/40"
                      )}
                      onClick={() => markRead(n.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {typeIcon[n.type] ?? typeIcon.info}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {n.is_read === "false" && <span className="w-1.5 h-1.5 rounded-full bg-[#CC2229] flex-shrink-0" />}
                            <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                          </div>
                          {n.body && <p className="text-xs text-gray-500 truncate mt-0.5">{n.body}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <button
                  onClick={() => { fetchNotifs(); setNotifOpen(false) }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
            className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#CC2229] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
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
                  onClick={() => setProfileOpen(false)}
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
