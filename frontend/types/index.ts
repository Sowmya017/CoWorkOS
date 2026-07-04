export type Role = "super_admin" | "branch_manager" | "finance_team" | "sales_team" | "receptionist" | "client"

export interface User {
  id: number
  name: string
  email: string
  role: Role
  branch_id?: number
  branch_name?: string
}

export interface Branch {
  id: number
  branch_name: string
  location: string
  total_seats: number
  occupied_seats: number
  available_seats?: number
}

export interface Visitor {
  id: number
  name: string
  phone: string
  company: string
  host_name: string
  purpose?: string
  branch_id: number
  branch_name?: string
  qr_token?: string
  qr_url?: string
  check_in: string
  check_out?: string
  status: "checked_in" | "checked_out"
}

export interface Lead {
  id: number
  company_name: string
  contact_person: string
  source: string
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost"
  assigned_to?: number
  assigned_name?: string
  priority: "low" | "medium" | "high"
  created_at: string
}

export interface Seat {
  id: number
  branch_id: number
  branch_name?: string
  seat_number: string
  type: "hot_desk" | "dedicated" | "private_office" | "conference"
  price: number
  status: "available" | "occupied" | "reserved" | "maintenance"
}

export interface Booking {
  id: number
  seat_id: number
  seat_number?: string
  user_id: number
  user_name?: string
  branch_id: number
  branch_name?: string
  start_time: string
  end_time: string
  booking_status: "pending" | "confirmed" | "cancelled" | "completed"
}

export interface Invoice {
  id: number
  client_id?: number
  client_name?: string
  amount: number
  due_date: string
  status: "draft" | "sent" | "paid" | "overdue"
  invoice_number?: string
  description?: string
  subscription_type?: string
  notes?: string
  branch_id?: number
  created_at: string
}

export interface Payment {
  id: number
  invoice_id: number
  invoice_number?: string
  client_name?: string
  amount: number
  payment_status: "pending" | "completed" | "failed" | "refunded"
  payment_date?: string
  payment_method?: string
  notes?: string
  created_at: string
}

export interface Subscription {
  id: number
  client_id: number
  client_name?: string
  plan_type: "hot_desk" | "dedicated" | "private_office" | "enterprise"
  start_date: string
  end_date: string
  status: "active" | "expired" | "cancelled"
  amount: number
  branch_id?: number
  branch_name?: string
  created_at: string
}

export interface Ticket {
  id: number
  issue_type: string
  description?: string
  priority: "low" | "medium" | "high" | "critical"
  assigned_to?: number
  assigned_name?: string
  status: "open" | "in_progress" | "resolved" | "closed"
  created_at: string
}

export interface Room {
  id: number
  branch_id: number
  branch_name?: string
  room_name: string
  floor: number
  capacity: number
  price_per_hour: number
  status: "available" | "occupied" | "maintenance"
  amenities?: string
}

export interface RoomBooking {
  id: number
  room_id: number
  room_name?: string
  user_id: number
  user_name?: string
  branch_id: number
  branch_name?: string
  start_time: string
  end_time: string
  status: "pending" | "confirmed" | "cancelled"
}

export interface Notification {
  id: number
  user_id: number
  title: string
  body?: string
  type: string
  is_read: string  // "true" | "false"
  created_at: string
}

// ─── Visual Workspace Management ────────────────────────────────────────────

export type WorkspaceObjectType =
  | "hot_desk"
  | "dedicated_desk"
  | "private_cabin"
  | "meeting_room"
  | "conference_room"
  | "reception_area"
  | "pantry_area"
  | "collaboration_zone"
  | "phone_booth"
  | "parking_area"
  | "wall"
  | "pathway"
  | "entrance_exit"
  | "room_boundary"

export type WorkspaceStatus = "available" | "occupied" | "reserved" | "maintenance" | "premium"

export interface Floor {
  id: number
  branch_id: number
  branch_name?: string
  name: string
  floor_number: number
  description?: string
  created_at: string
}

export interface FloorAsset {
  id: number
  floor_id: number
  asset_type: string  // floor_plan | photograph | blueprint | svg
  url: string
  original_filename?: string
  file_size?: number
  created_at: string
}

export interface LayoutVersion {
  id: number
  floor_id: number
  version_number: number
  label?: string
  is_active: boolean
  canvas_width: number
  canvas_height: number
  background_image_url?: string | null
  created_by?: number
  created_at: string
  updated_at?: string
}

export interface WorkspaceObject {
  id: number
  layout_version_id: number
  floor_id: number
  branch_id: number
  object_type: WorkspaceObjectType
  label?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  capacity: number
  price_per_hour: number
  price_per_day: number
  price_per_month: number
  status: WorkspaceStatus
  is_locked: boolean
  is_bookable: boolean
  color?: string
  amenities?: string  // JSON string
  metadata_json?: string
  created_at: string
  updated_at?: string
}

export interface LayoutVersionDetail extends LayoutVersion {
  workspace_objects: WorkspaceObject[]
}

export interface WorkspaceAvailability {
  id: number
  label?: string
  object_type: WorkspaceObjectType
  status: WorkspaceStatus
  is_available: boolean
  capacity: number
  price_per_hour: number
  price_per_day: number
}

export interface WorkspaceBooking {
  id: number
  workspace_object_id?: number
  workspace_label?: string
  user_id: number
  user_name?: string
  branch_id: number
  branch_name?: string
  start_time: string
  end_time: string
  booking_status: "pending" | "confirmed" | "cancelled" | "completed"
  created_at: string
}

// Real-time WebSocket event
export type LayoutWSEvent =
  | { event: "object_created"; data: WorkspaceObject }
  | { event: "object_updated"; data: WorkspaceObject }
  | { event: "object_deleted"; data: { id: number } }
  | { event: "status_changed"; data: { id: number; status: WorkspaceStatus } }
  | { event: "bulk_updated"; data: WorkspaceObject[] }

export interface DashboardAnalytics {
  total_branches: number
  occupied_seats: number
  available_seats: number
  visitors_today: number
  active_bookings: number
  total_revenue: number
  pending_invoices: number
  open_tickets: number
  revenue_chart: { month: string; revenue: number }[]
  booking_trend: { date: string; bookings: number }[]
  seat_type_breakdown: { type: string; count: number }[]
}
