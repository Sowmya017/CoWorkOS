"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import Cookies from "js-cookie"
import { authApi } from "@/lib/api"
import { User } from "@/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get("access_token")
    if (token) {
      authApi.me()
        .then((res) => setUser(res.data))
        .catch(() => Cookies.remove("access_token"))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const { access_token, user: userData } = res.data
    Cookies.set("access_token", access_token, { expires: 7 })
    setUser(userData)
  }

  const logout = () => {
    Cookies.remove("access_token")
    setUser(null)
    window.location.href = "/login"
  }

  const hasRole = (...roles: string[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
