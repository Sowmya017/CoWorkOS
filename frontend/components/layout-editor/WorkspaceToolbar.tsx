"use client"
import React, { useState } from "react"
import { WorkspaceObjectType } from "@/types"
import { OBJECT_CONFIGS, BOOKABLE_TYPES, STRUCTURAL_TYPES } from "@/lib/workspaceConfig"
import { useLayoutStore } from "@/store/layoutStore"

interface WorkspaceToolbarProps {
  onAddObject: (type: WorkspaceObjectType) => void
  onDeleteSelected: () => void
  onDuplicateSelected: () => void
  onToggleLock: () => void
  hasSelection: boolean
  isLocked: boolean
}

const OBJ_ICONS: Record<string, string> = {
  hot_desk: "💺", dedicated_desk: "🖥️", private_cabin: "🏠",
  meeting_room: "📋", conference_room: "🎤", phone_booth: "📞",
  parking_area: "🅿️", wall: "🧱", pathway: "🚶", entrance_exit: "🚪",
  room_boundary: "⬜", reception_area: "🛎️", pantry_area: "☕",
  collaboration_zone: "🤝",
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pt-3 pb-1 text-[9px] font-semibold tracking-widest text-blue-400/60 uppercase select-none">
        {label}
      </p>
      {children}
    </div>
  )
}

function ToolBtn({
  emoji, label, onClick, disabled, danger, active,
}: {
  emoji: string; label: string; onClick: () => void
  disabled?: boolean; danger?: boolean; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={[
        "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-all text-left",
        disabled
          ? "opacity-30 cursor-not-allowed text-slate-500"
          : danger
          ? "hover:bg-red-900/40 hover:text-red-300 text-slate-400"
          : active
          ? "bg-blue-900/50 text-blue-300 border border-blue-800/50"
          : "hover:bg-slate-700/60 text-slate-300 hover:text-white",
      ].join(" ")}
    >
      <span className="text-sm w-5 text-center flex-shrink-0">{emoji}</span>
      <span className="truncate font-medium">{label}</span>
    </button>
  )
}

export default function WorkspaceToolbar({
  onAddObject, onDeleteSelected, onDuplicateSelected, onToggleLock, hasSelection, isLocked,
}: WorkspaceToolbarProps) {
  const [tab, setTab] = useState<"spaces" | "structure">("spaces")
  const { snapToGrid, showGrid, toggleSnapToGrid, toggleGrid } = useLayoutStore()
  const types = tab === "spaces" ? BOOKABLE_TYPES : STRUCTURAL_TYPES

  return (
    <aside
      className="flex flex-col h-full w-[196px] flex-shrink-0 overflow-y-auto"
      style={{ background: "rgba(10,18,38,0.97)", borderRight: "1px solid rgba(59,130,246,0.16)" }}
    >
      {/* Brand */}
      <div className="px-3 py-3 border-b border-blue-900/25">
        <p className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">Blueprint</p>
        <p className="text-[9px] text-slate-500 mt-0.5">Layout Designer</p>
      </div>

      {/* Tabs */}
      <div className="flex mx-2 mt-2 rounded-lg overflow-hidden border border-slate-700/50">
        {(["spaces", "structure"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={[
              "flex-1 py-1 text-[10px] font-semibold capitalize transition-colors",
              tab === t ? "bg-blue-700/50 text-blue-200" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30",
            ].join(" ")}>
            {t === "spaces" ? "Spaces" : "Structure"}
          </button>
        ))}
      </div>

      {/* Object list */}
      <Section label={tab === "spaces" ? "Bookable" : "Structural"}>
        {types.map((type) => (
          <ToolBtn key={type} emoji={OBJ_ICONS[type] ?? "⬛"} label={OBJECT_CONFIGS[type].label} onClick={() => onAddObject(type)} />
        ))}
      </Section>

      <div className="mx-3 my-2 border-t border-slate-700/40" />

      {/* Selection */}
      <Section label="Selection">
        <ToolBtn emoji="⧉" label="Duplicate" onClick={onDuplicateSelected} disabled={!hasSelection} />
        <ToolBtn emoji={isLocked ? "🔓" : "🔒"} label={isLocked ? "Unlock" : "Lock"} onClick={onToggleLock} disabled={!hasSelection} />
        <ToolBtn emoji="🗑️" label="Delete" onClick={onDeleteSelected} disabled={!hasSelection} danger />
      </Section>

      <div className="mx-3 my-2 border-t border-slate-700/40" />

      {/* Canvas */}
      <Section label="Canvas">
        <ToolBtn emoji="⊞" label={snapToGrid ? "Snap: On" : "Snap: Off"} onClick={toggleSnapToGrid} active={snapToGrid} />
        <ToolBtn emoji="▦" label={showGrid ? "Grid: On" : "Grid: Off"} onClick={toggleGrid} active={showGrid} />
      </Section>

      {/* Shortcuts hint */}
      <div className="mt-auto px-3 py-3 border-t border-blue-900/20">
        <p className="text-[8px] text-slate-600 leading-relaxed">
          <span className="text-slate-500">Del</span> delete &nbsp;
          <span className="text-slate-500">Ctrl+Z</span> undo<br />
          <span className="text-slate-500">Ctrl+D</span> duplicate &nbsp;
          <span className="text-slate-500">Esc</span> deselect
        </p>
      </div>
    </aside>
  )
}
