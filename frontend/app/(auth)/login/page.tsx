"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch {
      toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (role: string) => {
    const demos: Record<string, {email: string, password: string}> = {
      admin: { email: "admin@coworkos.com", password: "admin123" },
      manager: { email: "manager@coworkos.com", password: "manager123" },
      receptionist: { email: "receptionist@coworkos.com", password: "recept123" },
    }
    if (demos[role]) {
      setEmail(demos[role].email)
      setPassword(demos[role].password)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">CoWorkOS</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Manage Your<br />Coworking Space<br />
            <span className="text-blue-400">Smarter.</span>
          </h2>
          <p className="text-slate-400 text-lg">
            All-in-one ERP & CRM platform for modern coworking spaces.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: "Branches", value: "12+" },
              { label: "Active Members", value: "2.4k+" },
              { label: "Monthly Revenue", value: "₹18L+" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-sm">© 2025 CoWorkOS. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">CoWorkOS</span>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sign In
                </Button>
              </form>

              <div className="mt-4">
                <p className="text-xs text-center text-gray-400 mb-3">Quick demo access</p>
                <div className="grid grid-cols-3 gap-2">
                  {["admin", "manager", "receptionist"].map((role) => (
                    <Button
                      key={role}
                      variant="outline"
                      size="sm"
                      className="text-xs capitalize"
                      onClick={() => demoLogin(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-center text-gray-500 mt-4">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Register
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
