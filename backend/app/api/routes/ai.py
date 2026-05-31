from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.ai_schemas import ChatRequest, ChatResponse
from app.services.ai.intent_service import detect_intent
from app.services.ai.grok_service import get_grok_response
from app.services.ai.faq_service import get_faq_answer
from app.services.ai import data_service
from app.repositories import ai_repository

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        intent, metadata = detect_intent(request.message)

        if intent == "my_bookings":
            data = ai_repository.get_my_bookings(db, current_user)
            message = data_service.format_bookings_response(data, db)
            source = "database"

        elif intent == "bookings":
            data = ai_repository.get_user_bookings(db, current_user)
            message = data_service.format_bookings_response(data, db)
            source = "database"

        elif intent == "invoices":
            data = ai_repository.get_pending_invoices(db, current_user)
            message = data_service.format_invoices_response(data)
            source = "database"

        elif intent == "tickets":
            data = ai_repository.get_open_tickets(db, current_user)
            message = data_service.format_tickets_response(data)
            source = "database"

        elif intent == "seats":
            location = metadata.get("location")
            data = ai_repository.get_available_seats(db, location)
            message = data_service.format_seats_response(data, db, location)
            source = "database"

        elif intent == "my_visitors":
            data = ai_repository.get_my_visitors(db, current_user)
            message = data_service.format_my_visitors_response(data, current_user.name)
            source = "database"

        elif intent == "visitors":
            data = ai_repository.get_today_visitors(db, current_user)
            message = data_service.format_visitors_response(data)
            source = "database"

        elif intent == "leads":
            data = ai_repository.get_leads(db, current_user)
            message = data_service.format_leads_response(data)
            source = "database"

        else:
            # Check local FAQ first — no API key needed
            faq = get_faq_answer(request.message)
            if faq:
                message = faq
                source = "database"
            else:
                message = get_grok_response(
                    request.message, request.conversation_history, current_user
                )
                source = "grok"

        return ChatResponse(
            message=message,
            intent=intent,
            source=source,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
