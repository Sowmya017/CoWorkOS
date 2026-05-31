export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  intent?: string
  source?: "database" | "grok"
}

export interface ConversationMessage {
  role: string
  content: string
}

export interface ChatRequest {
  message: string
  conversation_history: ConversationMessage[]
}

export interface ChatResponse {
  message: string
  intent: string
  source: "database" | "grok"
  timestamp: string
}
