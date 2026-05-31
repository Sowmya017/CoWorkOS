from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ConversationMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ConversationMessage] = []


class ChatResponse(BaseModel):
    message: str
    intent: str
    source: str  # "database" or "grok"
    timestamp: datetime
