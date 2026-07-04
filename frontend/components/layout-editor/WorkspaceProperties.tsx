"use client"
import React, { useState } from "react"
import { WorkspaceObject, WorkspaceStatus } from "@/types"
import { OBJECT_CONFIGS, STATUS_COLORS } from "@/lib/workspaceConfig"

interface WorkspacePropertiesProps {
  object: WorkspaceObject | null
  onChange: (changes: Partial<WorkspaceObject>) => void
}

const STATUSES: WorkspaceStatus[] = ["available", "occupied", "reserved", "maintenance", "premium"]

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-slate-500 mb-1 font-medium uppercase tracking-wide">{children}</p>
}

function Input({
  value, onChange, type = "text", step,
}: {
  value: string | number; onChange: (v: string) => void; type?: string; step?: number
}) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-800/80 border border-slate-700/60 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-colors"
    />
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 mb-3">{children}</div>
}

function Col({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-slate-700/50" />
        <p className="text-[9px] font-bold tracking-widest text-blue-400/60 uppercase shrink-0">{title}</p>
        <div className="h-px flex-1 bg-slate-700/50" />
      </div>
      {children}
    </div>
  )
}

type Tab = "transform" | "style" | "settings"

export default function WorkspaceProperties({ object, onChange }: WorkspacePropertiesProps) {
  const [tab, setTab] = useState<Tab>("transform")

  if (!object) {
    return (
      <aside
        className="flex flex-col h-full w-[224px] flex-shrink-0 items-center justify-center text-center px-4"
        style={{ background: "rgba(10,18,38,0.97)", borderLeft: "1px solid rgba(59,130,246,0.16)" }}
      >
        <div className="text-3xl mb-3 opacity-20">⊙</div>
        <p className="text-xs text-slate-500">Select an object to inspect and edit its properties</p>
      </aside>
    )
  }

  const cfg = OBJECT_CONFIGS[object.object_type]
  const n = (v: string) => parseFloat(v) || 0

  return (
    <aside
      className="flex flex-col h-full w-[224px] flex-shrink-0 overflow-y-auto"
      style={{ background: "rgba(10,18,38,0.97)", borderLeft: "1px solid rgba(59,130,246,0.16)" }}
    >
      {/* Header */}
      <div className="px-3 py-3 border-b border-blue-900/25">
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Properties</p>
        <p className="text-sm text-slate-200 font-semibold mt-0.5 truncate">{object.label || cfg.label}</p>
        <p className="text-[10px] text-blue-400/70 capitalize mt-0.5">{object.object_type.replace(/_/g, " ")}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {(["transform", "style", "settings"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={[
              "flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors",
              tab === t ? "text-blue-400 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-300",
            ].join(" ")}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-3 flex-1">
        {/* Transform tab */}
        {tab === "transform" && (
          <>
            <Section title="Label">
              <Input value={object.label || ""} onChange={(v) => onChange({ label: v })} />
            </Section>

            <Section title="Position">
              <Row>
                <Col label="X">
                  <Input type="number" value={Math.round(object.x)} onChange={(v) => onChange({ x: n(v) })} />
                </Col>
                <Col label="Y">
                  <Input type="number" value={Math.round(object.y)} onChange={(v) => onChange({ y: n(v) })} />
                </Col>
              </Row>
            </Section>

            <Section title="Size">
              <Row>
                <Col label="Width">
                  <Input type="number" value={Math.round(object.width)} onChange={(v) => onChange({ width: Math.max(20, n(v)) })} />
                </Col>
                <Col label="Height">
                  <Input type="number" value={Math.round(object.height)} onChange={(v) => onChange({ height: Math.max(20, n(v)) })} />
                </Col>
              </Row>
              <Label>Rotation °</Label>
              <Input type="number" value={Math.round(object.rotation || 0)} onChange={(v) => onChange({ rotation: n(v) })} />
            </Section>
          </>
        )}

        {/* Style tab */}
        {tab === "style" && (
          <>
            {object.is_bookable && (
              <Section title="Status">
                <div className="grid grid-cols-1 gap-1">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => onChange({ status: s })}
                      className={[
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                        object.status === s
                          ? "bg-slate-700/80 text-slate-200 border border-slate-600"
                          : "text-slate-400 hover:bg-slate-800/80",
                      ].join(" ")}>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s] }} />
                      <span className="capitalize">{s}</span>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {object.is_bookable && (
              <Section title="Capacity">
                <Input
                  type="number"
                  value={object.capacity || 1}
                  onChange={(v) => onChange({ capacity: Math.max(1, n(v)) })}
                />
              </Section>
            )}

            {object.is_bookable && (
              <Section title="Pricing (₹)">
                <Row>
                  <Col label="Per Hour">
                    <Input type="number" step={0.5} value={object.price_per_hour || 0}
                      onChange={(v) => onChange({ price_per_hour: n(v) })} />
                  </Col>
                  <Col label="Per Day">
                    <Input type="number" step={1} value={object.price_per_day || 0}
                      onChange={(v) => onChange({ price_per_day: n(v) })} />
                  </Col>
                </Row>
                <Label>Per Month</Label>
                <Input type="number" step={100} value={object.price_per_month || 0}
                  onChange={(v) => onChange({ price_per_month: n(v) })} />
              </Section>
            )}
          </>
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <>
            <Section title="Amenities">
              <Input
                value={object.amenities || ""}
                onChange={(v) => onChange({ amenities: v })}
              />
              <p className="text-[9px] text-slate-600 mt-1">Comma-separated, e.g. WiFi, AC, Whiteboard</p>
            </Section>

            <Section title="Flags">
              <div className="space-y-2">
                {[
                  { key: "is_bookable", label: "Bookable", val: object.is_bookable },
                  { key: "is_locked", label: "Lock position", val: object.is_locked },
                ].map(({ key, label, val }) => (
                  <label key={key} className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="text-xs text-slate-300">{label}</span>
                    <button
                      onClick={() => onChange({ [key]: !val })}
                      className={[
                        "w-8 h-4 rounded-full transition-colors relative",
                        val ? "bg-blue-600" : "bg-slate-700",
                      ].join(" ")}
                    >
                      <span className={[
                        "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                        val ? "translate-x-4" : "translate-x-0.5",
                      ].join(" ")} />
                    </button>
                  </label>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Object ID footer */}
      <div className="px-3 py-2 border-t border-blue-900/20">
        <p className="text-[8px] text-slate-700 font-mono">ID #{object.id} · v{object.layout_version_id}</p>
      </div>
    </aside>
  )
}
