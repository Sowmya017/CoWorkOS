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

// Public axios instance — no auth header, no 401 redirect (used by kiosk scan)
const publicApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

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
  getByToken: (token: string) => publicApi.get(`/api/visitors/token/${token}`),
  checkinByToken: (token: string) => publicApi.patch(`/api/visitors/checkin/${token}`),
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

// Rooms
export const roomsApi = {
  list: (params?: object) => api.get("/api/rooms", { params }),
  create: (data: object) => api.post("/api/rooms", data),
  update: (id: number, data: object) => api.put(`/api/rooms/${id}`, data),
  delete: (id: number) => api.delete(`/api/rooms/${id}`),
  book: (roomId: number, data: object) => api.post(`/api/rooms/${roomId}/book`, data),
  myBookings: () => api.get("/api/rooms/bookings"),
  cancelBooking: (bookingId: number) => api.patch(`/api/rooms/bookings/${bookingId}/cancel`),
}

// Attendance / QR Check-in
export const attendanceApi = {
  getQr: () => api.get("/api/attendance/qr"),
  scan: (token: string) => publicApi.post("/api/attendance/scan", { token }),
  branchCheckin: (data: { branch_id: number; name?: string; phone?: string }) =>
    api.post("/api/attendance/branch-checkin", data),
  my: () => api.get("/api/attendance/my"),
  list: (params?: object) => api.get("/api/attendance", { params }),
}

// Notifications
export const notificationsApi = {
  list: () => api.get("/api/notifications"),
  markRead: (id: number) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch("/api/notifications/read-all"),
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

// ─── Visual Workspace Management ────────────────────────────────────────────

export const floorsApi = {
  list: (params?: object) => api.get("/api/floors", { params }),
  get: (id: number) => api.get(`/api/floors/${id}`),
  create: (data: object) => api.post("/api/floors", data),
  update: (id: number, data: object) => api.put(`/api/floors/${id}`, data),
  delete: (id: number) => api.delete(`/api/floors/${id}`),
  listAssets: (floorId: number) => api.get(`/api/floors/${floorId}/assets`),
  uploadAsset: (floorId: number, file: File, assetType = "floor_plan") => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("asset_type", assetType)
    return api.post(`/api/floors/${floorId}/assets`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  deleteAsset: (floorId: number, assetId: number) =>
    api.delete(`/api/floors/${floorId}/assets/${assetId}`),
}

export const layoutVersionsApi = {
  list: (params?: object) => api.get("/api/layout-versions", { params }),
  get: (id: number) => api.get(`/api/layout-versions/${id}`),
  getActive: (floorId: number) => api.get(`/api/layout-versions/floor/${floorId}/active`),
  create: (data: object) => api.post("/api/layout-versions", data),
  update: (id: number, data: object) => api.put(`/api/layout-versions/${id}`, data),
  activate: (id: number) => api.post(`/api/layout-versions/${id}/activate`),
  clone: (id: number, label?: string) =>
    api.post(`/api/layout-versions/${id}/clone`, null, { params: { label } }),
  delete: (id: number) => api.delete(`/api/layout-versions/${id}`),
}

export const workspaceObjectsApi = {
  list: (params?: object) => api.get("/api/workspace-objects", { params }),
  get: (id: number) => api.get(`/api/workspace-objects/${id}`),
  create: (data: object) => api.post("/api/workspace-objects", data),
  update: (id: number, data: object) => api.put(`/api/workspace-objects/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/api/workspace-objects/${id}/status`, null, { params: { status } }),
  delete: (id: number) => api.delete(`/api/workspace-objects/${id}`),
  bulkUpdate: (ids: number[], updates: object[]) =>
    api.post("/api/workspace-objects/bulk-update", null, { params: { ids, updates } }),
}

export const workspaceBookingsApi = {
  list: (params?: object) => api.get("/api/workspace-bookings", { params }),
  create: (data: object) => api.post("/api/workspace-bookings", data),
  cancel: (id: number) => api.delete(`/api/workspace-bookings/${id}`),
  availability: (floorId: number, params?: object) =>
    api.get(`/api/workspace-bookings/availability/${floorId}`, { params }),
}
