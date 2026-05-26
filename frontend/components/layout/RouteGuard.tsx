"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/types"

interface RouteGuardProps {
  allowedRoles: Role[]
  children: React.ReactNode
}

export default function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      router.replace("/unauthorized")
    }
  }, [user, loading, allowedRoles, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}
