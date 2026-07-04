"use client"
import React, { useState, useRef, useEffect, useCallback } from "react"
import { WorkspaceObject, WorkspaceObjectType } from "@/types"
import { OBJECT_CONFIGS } from "@/lib/workspaceConfig"

interface AICopilotProps {
  objects: WorkspaceObject[]
  onAddObject: (type: WorkspaceObjectType) => void
  onDeleteSelected: () => void
  onClearAll: () => void
  onClose: () => void
}

interface Message {
  role: "user" | "assistant"
  text: string
}

// ─── Layout command patterns ──────────────────────────────────────────────────

interface CommandResult { reply: string; action?: () => void }

function parseLayoutCommand(
  input: string,
  onAdd: (t: WorkspaceObjectType) => void,
  onDelete: () => void,
  onClear: () => void,
  objectCount: number,
): CommandResult | null {
  const s = input.toLowerCase().trim()

  // "add N desks / hot desks / meeting rooms" etc.
  const addMatch = s.match(/add\s+(\d+)?\s*(hot\s*desk|dedicated\s*desk|meeting\s*room|conference|phone\s*booth|cabin|parking|wall|pathway|reception|pantry|collab)/i)
  if (addMatch) {
    const count = parseInt(addMatch[1] || "1", 10)
    const kw = addMatch[2].toLowerCase()
    const typeMap: Record<string, WorkspaceObjectType> = {
      "hot desk": "hot_desk", "hot  desk": "hot_desk",
      "dedicated desk": "dedicated_desk",
      "meeting room": "meeting_room",
      conference: "conference_room",
      "phone booth": "phone_booth",
      cabin: "private_cabin",
      parking: "parking_area",
      wall: "wall",
      pathway: "pathway",
      reception: "reception_area",
      pantry: "pantry_area",
      collab: "collaboration_zone",
    }
    const matched = Object.entries(typeMap).find(([k]) => kw.includes(k.split(" ")[0]))
    if (matched) {
      const [, type] = matched
      return {
        reply: `Adding ${count} ${OBJECT_CONFIGS[type].label}${count > 1 ? "s" : ""}…`,
        action: () => { for (let i = 0; i < Math.min(count, 20); i++) onAdd(type) },
      }
    }
  }

  if (s.includes("delete selected") || s.includes("remove selected")) {
    return { reply: "Deleting selected object.", action: onDelete }
  }

  if (s.includes("clear all") || s.includes("clear canvas") || s.includes("remove all")) {
    return {
      reply: `Are you sure? Type "confirm clear" to delete all ${objectCount} objects.`,
    }
  }

  if (s === "confirm clear") {
    return { reply: "Canvas cleared.", action: onClear }
  }

  if (s.includes("how many") || s.includes("count")) {
    const bookable = 0
    return {
      reply: `There are currently ${objectCount} objects on the canvas. Use the left panel to add more spaces or structural elements.`,
    }
  }

  if (s.includes("help") || s.includes("what can you do")) {
    return {
      reply:
        `Here's what I can do:\n` +
        `• "add 10 hot desks"\n` +
        `• "add meeting room"\n` +
        `• "add 3 phone booths"\n` +
        `• "delete selected"\n` +
        `• "clear all"\n` +
        `• Ask anything about the workspace!`,
    }
  }

  return null
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

function getSmartSuggestions(objects: WorkspaceObject[]): string[] {
  const tips: string[] = []
  const types = objects.map((o) => o.object_type)
  const hasExit = types.includes("entrance_exit")
  const hasReception = types.includes("reception_area")
  const hasPantry = types.includes("pantry_area")
  const deskCount = types.filter((t) => t === "hot_desk" || t === "dedicated_desk").length
  const meetingCount = types.filter((t) => t === "meeting_room" || t === "conference_room").length

  if (!hasExit) tips.push("⚠️ No emergency exit detected. Add an entrance/exit for safety compliance.")
  if (!hasReception && objects.length > 5) tips.push("💡 Consider adding a reception area for visitor management.")
  if (!hasPantry && deskCount > 10) tips.push("☕ Large workspace detected — a pantry area improves team wellbeing.")
  if (deskCount > 0 && meetingCount === 0) tips.push("📋 You have desks but no meeting rooms. Add one for collaboration.")
  if (meetingCount > deskCount / 3) tips.push("📐 Meeting rooms seem oversized relative to desks. Check space allocation.")
  if (objects.length === 0) tips.push("✨ Canvas is empty. Start by adding hot desks, walls, or a room boundary.")
  if (objects.length > 50) tips.push("🔢 Large layout detected. Use version snapshots to track changes.")

  return tips.slice(0, 3)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AICopilot({ objects, onAddObject, onDeleteSelected, onClearAll, onClose }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm your AI layout copilot. Try:\n• \"add 10 hot desks\"\n• \"add meeting room\"\n• \"help\" for all commands",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestions = getSmartSuggestions(objects)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    setMessages((m) => [...m, { role: "user", text }])
    setLoading(true)

    // Check for layout command first
    const cmd = parseLayoutCommand(text, onAddObject, onDeleteSelected, onClearAll, objects.length)
    if (cmd) {
      if (cmd.action) {
        setTimeout(cmd.action, 100)
      }
      setMessages((m) => [...m, { role: "assistant", text: cmd.reply }])
      setLoading(false)
      return
    }

    // Fall back to AI endpoint
    try {
      const token = document.cookie.match(/access_token=([^;]+)/)?.[1]
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((m) => [...m, { role: "assistant", text: data.response || data.message || "Done!" }])
      } else {
        setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't reach the AI right now. Try a layout command like \"add 5 desks\"." }])
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Offline mode — I can still handle layout commands. Type \"help\" to see what I can do." }])
    }
    setLoading(false)
  }, [input, loading, objects.length, onAddObject, onDeleteSelected, onClearAll])

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        width: 320,
        height: 440,
        background: "rgba(8,16,34,0.97)",
        border: "1px solid rgba(59,130,246,0.25)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-900/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">✦</div>
          <div>
            <p className="text-xs font-semibold text-slate-200">AI Copilot</p>
            <p className="text-[9px] text-blue-400/70">Layout intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div className="px-3 pt-2 pb-1 border-b border-slate-800/60">
          {suggestions.map((tip, i) => (
            <p key={i} className="text-[10px] text-slate-400 mb-1 leading-relaxed">{tip}</p>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={["flex", msg.role === "user" ? "justify-end" : "justify-start"].join(" ")}>
            <div
              className={[
                "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-blue-700/60 text-blue-50"
                  : "bg-slate-800/80 text-slate-200",
              ].join(" ")}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400">
              <span className="animate-pulse">thinking…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-800/60">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Add 10 desks, help…"
            className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
