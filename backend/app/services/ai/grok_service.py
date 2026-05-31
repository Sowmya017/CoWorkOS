from openai import OpenAI
from app.core.config import settings
from app.models.models import User

SYSTEM_PROMPT = """You are CoWorkOS Assistant, an intelligent AI helper for a coworking space management platform called CoWorkOS.

CoWorkOS is an ERP + CRM platform that manages:
- Multi-branch coworking spaces
- Seat bookings (Hot Desk, Dedicated, Private Office, Conference Room)
- Visitor check-in/check-out
- CRM lead pipeline (New → Contacted → Qualified → Proposal → Won/Lost)
- Invoices, payments, and subscriptions
- Support tickets
- Finance analytics and dashboards
- Role-based access: Super Admin, Branch Manager, Finance Team, Sales Team, Receptionist, Client

How to book a seat:
1. Go to "Book a Seat" in the sidebar (clients) or "Bookings" (staff)
2. Select your preferred branch/location
3. Choose a workspace type: Hot Desk, Dedicated Desk, Private Office, or Conference Room
4. Click on an available seat card
5. Set your start and end time
6. Click "Confirm Booking"

Keep responses concise, helpful, and professional.
"""

NO_KEY_MESSAGE = (
    "I can answer general questions once the Grok API key is configured. "
    "For live data questions (bookings, invoices, seats, visitors), just ask me directly — "
    "those work without an API key!"
)


def get_grok_response(message: str, conversation_history: list, user: User) -> str:
    if not settings.GROK_API_KEY:
        return NO_KEY_MESSAGE

    try:
        client = OpenAI(
            api_key=settings.GROK_API_KEY,
            base_url="https://api.x.ai/v1",
        )

        user_context = f"\nCurrent user: {user.name} | Role: {user.role.value}"
        messages = [{"role": "system", "content": SYSTEM_PROMPT + user_context}]

        for msg in conversation_history[-8:]:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model="grok-beta",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )

        return response.choices[0].message.content

    except Exception as e:
        error_msg = str(e).lower()
        if "api key" in error_msg or "authentication" in error_msg or "unauthorized" in error_msg:
            return "The Grok API key appears to be invalid. Please check the GROK_API_KEY setting. I can still answer data questions (bookings, invoices, seats, visitors) directly from the database!"
        return "I'm having trouble reaching the AI service right now. You can still ask me about your bookings, invoices, available seats, or visitors — those work offline!"
