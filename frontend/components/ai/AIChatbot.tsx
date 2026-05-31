"use client"
import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { useAIChat } from "@/hooks/useAIChat"
import { Message } from "@/types/ai"

// ── Simple inline markdown renderer ──────────────────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return part
    })
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    )
  })
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
        <BotIcon />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user"

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2 mb-3">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mb-1">
        <BotIcon />
      </div>
      <div className="max-w-[85%]">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-700 leading-relaxed shadow-sm">
          {renderMarkdown(msg.content)}
        </div>
        {msg.source && (
          <div className="mt-1 ml-1">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                msg.source === "database"
                  ? "bg-green-100 text-green-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {msg.source === "database" ? "Live data" : "AI"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quick suggestion chips ────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Show my active bookings",
  "Any pending invoices?",
  "Available seats today",
  "Visitors checked in today",
  "Show open tickets",
]

// ── Icons ─────────────────────────────────────────────────────────────────────
function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M3 21v-1a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v1H3Z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 21L23 12 2 3v7l15 2-15 2v7Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z" />
    </svg>
  )
}

// ── Main chatbot component ────────────────────────────────────────────────────
export default function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const { messages, isLoading, sendMessage, clearChat } = useAIChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    await sendMessage(text)
  }

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  const showSuggestions = messages.length <= 1

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200 bg-slate-50"
          style={{ height: "520px" }}>

          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <BotIcon />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">CoWorkOS Assistant</p>
                <p className="text-blue-200 text-xs">Powered by Grok AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-white/70 hover:text-white transition-colors p-1"
                title="Clear chat"
              >
                <TrashIcon />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0 min-h-0">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs bg-white border border-blue-200 text-blue-700 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 flex-shrink-0">
            <div className="flex items-end gap-2 bg-white rounded-xl border border-slate-200 shadow-sm px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 resize-none text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none bg-transparent max-h-24"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-1.5">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Toggle AI Assistant"
      >
        {open ? (
          <CloseIcon />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M3 21v-1a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v1H3Z" />
          </svg>
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  )
}
