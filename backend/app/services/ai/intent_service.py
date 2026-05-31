from typing import Tuple

LOCATIONS = ["bangalore", "mumbai", "delhi", "chennai", "hyderabad", "pune", "kolkata", "noida", "gurugram"]

# These phrases signal a HOW/FAQ question even if they contain data keywords
FAQ_SIGNALS = [
    "how to", "how do i", "how can i", "steps to", "steps for",
    "guide", "tutorial", "explain", "what is", "what are", "tell me about",
    "difference between", "help me understand", "walk me through",
]

INTENT_KEYWORDS = {
    "my_bookings":    ["my booking", "my reservation", "my active booking", "booked by me", "show my booking"],
    "bookings":       ["all booking", "all reservation", "booking list", "show booking"],
    "invoices":       ["invoice", "payment", "bill", "pay", "pending payment", "overdue", "amount due", "outstanding"],
    "tickets":        ["ticket", "support", "issue", "problem", "complaint", "open ticket"],
    "my_visitors":    ["visitor for me", "visitors for me", "visiting me", "here for me", "my visitor",
                       "who is visiting me", "guests for me", "meeting me"],
    "visitors":       ["visitor", "visit", "guest", "checked in", "check in", "walk in", "today visitor", "how many visitor"],
    "seats":          ["show seat", "show desk", "list of seat", "list of desk", "available seat", "available desk",
                       "free seat", "free desk", "empty seat", "vacancy", "which seat", "which desk",
                       "seat available", "desk available", "show me seat", "show me desk",
                       "hot desk list", "desk list", "seat list"],
    "leads":          ["lead", "prospect", "pipeline", "crm", "follow up", "sales lead"],
}


def detect_intent(message: str) -> Tuple[str, dict]:
    msg = message.lower()
    metadata = {}

    # FAQ signals always override data intents → send to Grok
    if any(signal in msg for signal in FAQ_SIGNALS):
        return "general", metadata

    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in msg for kw in keywords):
            if intent == "seats":
                for loc in LOCATIONS:
                    if loc in msg:
                        metadata["location"] = loc
                        break
            return intent, metadata

    return "general", metadata
