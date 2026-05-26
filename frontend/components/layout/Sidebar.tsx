"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, Users, UserCheck, Briefcase,
  Armchair, CalendarDays, FileText, Ticket, Settings,
  ChevronLeft, ChevronRight, LogOut, BarChart3, Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["super_admin","branch_manager","finance_team","sales_team","receptionist","client"] },
  { href: "/branches", icon: Building2, label: "Branches", roles: ["super_admin","branch_manager"] },
  { href: "/visitors", icon: UserCheck, label: "Visitors", roles: ["super_admin","branch_manager","receptionist"] },
  { href: "/leads", icon: Briefcase, label: "CRM / Leads", roles: ["super_admin","branch_manager","sales_team"] },
  { href: "/seats", icon: Armchair, label: "Seats", roles: ["super_admin","branch_manager","receptionist"] },
  { href: "/bookings", icon: CalendarDays, label: "Bookings", roles: ["super_admin","branch_manager","receptionist","client"] },
  { href: "/invoices", icon: FileText, label: "Invoices", roles: ["super_admin","finance_team","branch_manager"] },
  { href: "/tickets", icon: Ticket, label: "Tickets", roles: ["super_admin","branch_manager","finance_team","sales_team","receptionist","client"] },
  { href: "/analytics", icon: BarChart3, label: "Analytics", roles: ["super_admin","branch_manager","finance_team","sales_team"] },
  { href: "/finance", icon: Wallet, label: "Finance", roles: ["super_admin","finance_team"] },
  { href: "/users", icon: Users, label: "Users", roles: ["super_admin"] },
  { href: "/settings", icon: Settings, label: "Settings", roles: ["super_admin","branch_manager","finance_team","sales_team","receptionist","client"] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  )

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-[#0f172a] text-slate-200 transition-all duration-300 flex-shrink-0",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">CoWorkOS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Building2 className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
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
          )
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-slate-700 p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
