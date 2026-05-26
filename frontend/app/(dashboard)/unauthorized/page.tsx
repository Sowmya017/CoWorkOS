"use client"
import { useRouter } from "next/navigation"
import { ShieldX, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-2">
          You don&apos;t have permission to view this page.
        </p>
        {user && (
          <p className="text-sm text-gray-400 mb-8">
            Your current role is{" "}
            <span className="font-medium text-gray-600 capitalize bg-gray-100 px-2 py-0.5 rounded">
              {user.role.replace(/_/g, " ")}
            </span>
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
          <Button onClick={() => router.push("/dashboard")} className="gap-2">
            <Home className="w-4 h-4" /> Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
