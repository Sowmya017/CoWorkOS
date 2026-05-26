import axios from "axios"
import Cookies from "js-cookie"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("access_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  register: (data: object) => api.post("/api/auth/register", data),
  me: () => api.get("/api/auth/me"),
}

// Branches
export const branchesApi = {
  list: () => api.get("/api/branches"),
  get: (id: number) => api.get(`/api/branches/${id}`),
  create: (data: object) => api.post("/api/branches", data),
  update: (id: number, data: object) => api.put(`/api/branches/${id}`, data),
  delete: (id: number) => api.delete(`/api/branches/${id}`),
}

// Visitors
export const visitorsApi = {
  list: (params?: object) => api.get("/api/visitors", { params }),
  get: (id: number) => api.get(`/api/visitors/${id}`),
  create: (data: object) => api.post("/api/visitors", data),
  update: (id: number, data: object) => api.put(`/api/visitors/${id}`, data),
  checkout: (id: number) => api.patch(`/api/visitors/${id}/checkout`),
}

// Leads
export const leadsApi = {
  list: (params?: object) => api.get("/api/leads", { params }),
  get: (id: number) => api.get(`/api/leads/${id}`),
  create: (data: object) => api.post("/api/leads", data),
  update: (id: number, data: object) => api.put(`/api/leads/${id}`, data),
  delete: (id: number) => api.delete(`/api/leads/${id}`),
}

// Seats
export const seatsApi = {
  list: (params?: object) => api.get("/api/seats", { params }),
  get: (id: number) => api.get(`/api/seats/${id}`),
  create: (data: object) => api.post("/api/seats", data),
  update: (id: number, data: object) => api.put(`/api/seats/${id}`, data),
  availability: (branchId: number) => api.get(`/api/seats/availability/${branchId}`),
}

// Bookings
export const bookingsApi = {
  list: (params?: object) => api.get("/api/bookings", { params }),
  get: (id: number) => api.get(`/api/bookings/${id}`),
  create: (data: object) => api.post("/api/bookings", data),
  update: (id: number, data: object) => api.put(`/api/bookings/${id}`, data),
  cancel: (id: number) => api.patch(`/api/bookings/${id}/cancel`),
}

// Invoices
export const invoicesApi = {
  list: (params?: object) => api.get("/api/invoices", { params }),
  get: (id: number) => api.get(`/api/invoices/${id}`),
  create: (data: object) => api.post("/api/invoices", data),
  update: (id: number, data: object) => api.put(`/api/invoices/${id}`, data),
  delete: (id: number) => api.delete(`/api/invoices/${id}`),
  markPaid: (id: number) => api.patch(`/api/invoices/${id}/pay`),
}

// Tickets
export const ticketsApi = {
  list: (params?: object) => api.get("/api/tickets", { params }),
  get: (id: number) => api.get(`/api/tickets/${id}`),
  create: (data: object) => api.post("/api/tickets", data),
  update: (id: number, data: object) => api.put(`/api/tickets/${id}`, data),
}

// Users
export const usersApi = {
  list: () => api.get("/api/users"),
  get: (id: number) => api.get(`/api/users/${id}`),
  create: (data: object) => api.post("/api/users", data),
  update: (id: number, data: object) => api.put(`/api/users/${id}`, data),
  delete: (id: number) => api.delete(`/api/users/${id}`),
}

// Payments
export const paymentsApi = {
  list: () => api.get("/api/payments"),
  create: (data: object) => api.post("/api/payments", data),
  complete: (id: number) => api.patch(`/api/payments/${id}/complete`),
}

// Subscriptions
export const subscriptionsApi = {
  list: () => api.get("/api/subscriptions"),
  create: (data: object) => api.post("/api/subscriptions", data),
  update: (id: number, data: object) => api.put(`/api/subscriptions/${id}`, data),
  delete: (id: number) => api.delete(`/api/subscriptions/${id}`),
}

// Finance analytics
export const financeApi = {
  summary: () => api.get("/api/finance/summary"),
  revenue: () => api.get("/api/finance/revenue"),
  branchEarnings: () => api.get("/api/finance/branch-earnings"),
  subscriptionStats: () => api.get("/api/finance/subscriptions"),
}

// Dashboard
export const dashboardApi = {
  analytics: (params?: object) => api.get("/api/dashboard/analytics", { params }),
  branchAnalytics: () => api.get("/api/dashboard/branch-analytics"),
  revenue: (params?: object) => api.get("/api/dashboard/revenue", { params }),
  occupancy: (params?: object) => api.get("/api/dashboard/occupancy", { params }),
  leadsAnalytics: () => api.get("/api/dashboard/leads"),
  bookingsAnalytics: (params?: object) => api.get("/api/dashboard/bookings", { params }),
}
