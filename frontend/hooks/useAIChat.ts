"use client"
import { useState, useCallback } from "react"
import { Message } from "@/types/ai"
import api from "@/lib/api"

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your **CoWorkOS Assistant**. I can help you with:\n• Your active bookings\n• Pending invoices\n• Available seats\n• Today's visitors\n• Open support tickets\n• General platform questions",
  timestamp: new Date(),
  source: "grok",
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: Message = {
        id: uid(),
        role: "user",
        content,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      try {
        const history = messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const res = await api.post("/api/ai/chat", {
          message: content,
          conversation_history: history,
        })

        const assistantMsg: Message = {
          id: uid(),
          role: "assistant",
          content: res.data.message,
          timestamp: new Date(res.data.timestamp),
          intent: res.data.intent,
          source: res.data.source,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages]
  )

  const clearChat = useCallback(() => {
    setMessages([{ ...WELCOME, id: uid(), timestamp: new Date() }])
  }, [])

  return { messages, isLoading, sendMessage, clearChat }
}
