"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, Users, UserCheck, Briefcase,
  Armchair, CalendarDays, FileText, Ticket, Settings,
  ChevronLeft, ChevronRight, LogOut, BarChart3, Wallet,
  Home, Receipt, MessageSquare, DoorOpen, ScanLine, X, ClipboardList
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

const navItems = [
  // Staff / admin items
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",   roles: ["super_admin","branch_manager","finance_team","sales_team","receptionist"], section: "main" },
  { href: "/branches",   icon: Building2,       label: "Branches",    roles: ["super_admin","branch_manager"], section: "main" },
  { href: "/visitors",   icon: UserCheck,       label: "Visitors",    roles: ["super_admin","branch_manager","receptionist"], section: "main" },
  { href: "/attendance", icon: ClipboardList,   label: "Attendance",  roles: ["super_admin","branch_manager","receptionist"], section: "main" },
  { href: "/leads",      icon: Briefcase,       label: "CRM / Leads", roles: ["super_admin","branch_manager","sales_team"], section: "main" },
  { href: "/seats",      icon: Armchair,        label: "Seats",       roles: ["super_admin","branch_manager","receptionist"], section: "main" },
  { href: "/rooms",      icon: DoorOpen,        label: "Rooms",       roles: ["super_admin","branch_manager"], section: "main" },
  { href: "/bookings",   icon: CalendarDays,    label: "Bookings",    roles: ["super_admin","branch_manager","receptionist"], section: "main" },
  { href: "/invoices",   icon: FileText,        label: "Invoices",    roles: ["super_admin","finance_team","branch_manager"], section: "main" },
  { href: "/tickets",    icon: Ticket,          label: "Tickets",     roles: ["super_admin","branch_manager","finance_team","sales_team","receptionist"], section: "main" },
  { href: "/analytics",  icon: BarChart3,       label: "Analytics",   roles: ["super_admin","branch_manager","finance_team","sales_team"], section: "main" },
  { href: "/kiosk",      icon: ScanLine,        label: "Kiosk Mode",  roles: ["super_admin","branch_manager","receptionist"], section: "main" },
  { href: "/finance",    icon: Wallet,          label: "Finance",     roles: ["super_admin","finance_team"], section: "main" },
  { href: "/users",      icon: Users,           label: "Users",       roles: ["super_admin"], section: "main" },
  // Client portal items
  { href: "/my-space",    icon: Home,           label: "My Space",    roles: ["client"], section: "client" },
  { href: "/book-seat",   icon: Armchair,       label: "Book a Seat", roles: ["client"], section: "client" },
  { href: "/my-invoices", icon: Receipt,        label: "My Invoices", roles: ["client"], section: "client" },
  { href: "/my-tickets",  icon: MessageSquare,  label: "My Tickets",  roles: ["client"], section: "client" },
  // Common
  { href: "/settings",   icon: Settings,        label: "Settings",    roles: ["super_admin","branch_manager","finance_team","sales_team","receptionist","client"], section: "main" },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col h-screen bg-[#1a1a1a] text-slate-200 transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          visibleItems={visibleItems}
          pathname={pathname}
          user={user}
          logout={logout}
        />
      </aside>

      {/* Mobile sidebar drawer */}
      <aside className={cn(
        "md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-[#1a1a1a] text-slate-200 transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#2d2d2d] text-slate-400 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent
          collapsed={false}
          setCollapsed={() => {}}
          visibleItems={visibleItems}
          pathname={pathname}
          user={user}
          logout={logout}
          onNavClick={onMobileClose}
        />
      </aside>
    </>
  )
}

interface ContentProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  visibleItems: typeof navItems
  pathname: string
  user: { name?: string; role?: string } | null
  logout: () => void
  onNavClick?: () => void
}

function SidebarContent({ collapsed, setCollapsed, visibleItems, pathname, user, logout, onNavClick }: ContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#2d2d2d]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#CC2229] rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">CoWorkOS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-[#CC2229] rounded-lg flex items-center justify-center mx-auto">
            <Building2 className="w-4 h-4 text-white" />
          </div>
        )}
        {onNavClick == null && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-[#2d2d2d] text-slate-400 hover:text-white transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item, idx) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const prevItem = visibleItems[idx - 1]
          const showClientLabel = item.section === "client" && (!prevItem || prevItem.section !== "client")
          return (
            <div key={item.href}>
              {showClientLabel && !collapsed && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  My Portal
                </p>
              )}
              {showClientLabel && collapsed && <div className="my-2 border-t border-[#2d2d2d]" />}
              <Link
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  "sidebar-nav-item",
                  isActive ? "active" : "text-slate-400",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-[#2d2d2d] p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-[#CC2229] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="p-1 rounded hover:bg-[#2d2d2d] text-slate-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
