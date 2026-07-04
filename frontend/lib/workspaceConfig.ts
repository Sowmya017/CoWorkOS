import { WorkspaceObjectType, WorkspaceStatus } from "@/types"

export interface ObjectConfig {
  label: string
  defaultWidth: number
  defaultHeight: number
  fillColor: string
  strokeColor: string
  isBookable: boolean
  emoji: string
}

export const OBJECT_CONFIGS: Record<WorkspaceObjectType, ObjectConfig> = {
  hot_desk: {
    label: "Hot Desk",
    defaultWidth: 90,
    defaultHeight: 60,
    fillColor: "#dbeafe",
    strokeColor: "#3b82f6",
    isBookable: true,
    emoji: "💺",
  },
  dedicated_desk: {
    label: "Dedicated Desk",
    defaultWidth: 100,
    defaultHeight: 65,
    fillColor: "#d1fae5",
    strokeColor: "#10b981",
    isBookable: true,
    emoji: "🖥️",
  },
  private_cabin: {
    label: "Private Cabin",
    defaultWidth: 160,
    defaultHeight: 120,
    fillColor: "#ede9fe",
    strokeColor: "#7c3aed",
    isBookable: true,
    emoji: "🏠",
  },
  meeting_room: {
    label: "Meeting Room",
    defaultWidth: 180,
    defaultHeight: 140,
    fillColor: "#fef3c7",
    strokeColor: "#d97706",
    isBookable: true,
    emoji: "📋",
  },
  conference_room: {
    label: "Conference Room",
    defaultWidth: 240,
    defaultHeight: 180,
    fillColor: "#fff7ed",
    strokeColor: "#ea580c",
    isBookable: true,
    emoji: "🎤",
  },
  reception_area: {
    label: "Reception",
    defaultWidth: 180,
    defaultHeight: 80,
    fillColor: "#fce7f3",
    strokeColor: "#db2777",
    isBookable: false,
    emoji: "🛎️",
  },
  pantry_area: {
    label: "Pantry",
    defaultWidth: 140,
    defaultHeight: 100,
    fillColor: "#f0fdf4",
    strokeColor: "#16a34a",
    isBookable: false,
    emoji: "☕",
  },
  collaboration_zone: {
    label: "Collab Zone",
    defaultWidth: 200,
    defaultHeight: 160,
    fillColor: "#ecfeff",
    strokeColor: "#0891b2",
    isBookable: false,
    emoji: "🤝",
  },
  phone_booth: {
    label: "Phone Booth",
    defaultWidth: 70,
    defaultHeight: 70,
    fillColor: "#f5f3ff",
    strokeColor: "#6d28d9",
    isBookable: true,
    emoji: "📞",
  },
  parking_area: {
    label: "Parking",
    defaultWidth: 120,
    defaultHeight: 60,
    fillColor: "#f8fafc",
    strokeColor: "#64748b",
    isBookable: true,
    emoji: "🅿️",
  },
  wall: {
    label: "Wall",
    defaultWidth: 200,
    defaultHeight: 12,
    fillColor: "#374151",
    strokeColor: "#111827",
    isBookable: false,
    emoji: "🧱",
  },
  pathway: {
    label: "Pathway",
    defaultWidth: 200,
    defaultHeight: 50,
    fillColor: "#f9fafb",
    strokeColor: "#d1d5db",
    isBookable: false,
    emoji: "🚶",
  },
  entrance_exit: {
    label: "Entrance / Exit",
    defaultWidth: 80,
    defaultHeight: 20,
    fillColor: "#dcfce7",
    strokeColor: "#15803d",
    isBookable: false,
    emoji: "🚪",
  },
  room_boundary: {
    label: "Room Boundary",
    defaultWidth: 300,
    defaultHeight: 200,
    fillColor: "transparent",
    strokeColor: "#94a3b8",
    isBookable: false,
    emoji: "⬜",
  },
}

export const STATUS_COLORS: Record<WorkspaceStatus, string> = {
  available: "#22c55e",   // green
  occupied: "#ef4444",    // red
  reserved: "#3b82f6",    // blue
  maintenance: "#9ca3af", // grey
  premium: "#f59e0b",     // gold
}

export const BOOKABLE_TYPES: WorkspaceObjectType[] = [
  "hot_desk",
  "dedicated_desk",
  "private_cabin",
  "meeting_room",
  "conference_room",
  "phone_booth",
  "parking_area",
]

export const STRUCTURAL_TYPES: WorkspaceObjectType[] = [
  "wall",
  "pathway",
  "entrance_exit",
  "room_boundary",
  "reception_area",
  "pantry_area",
  "collaboration_zone",
]
