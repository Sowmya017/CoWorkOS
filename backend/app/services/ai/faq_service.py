"""
Local FAQ knowledge base for CoWorkOS platform questions.
Answers common questions without needing the Grok API.
"""

FAQ = [
    {
        "triggers": ["steps to book", "how to book", "how do i book", "how can i book",
                     "book a hot desk", "book a seat", "book a desk", "book a room",
                     "make a booking", "create a booking", "reserve a seat"],
        "answer": (
            "**How to Book a Seat in CoWorkOS:**\n\n"
            "1. Click **'Book a Seat'** in the sidebar\n"
            "2. Select your **branch/location** from the dropdown\n"
            "3. Choose a **workspace type**:\n"
            "   • Hot Desk — flexible, shared desk\n"
            "   • Dedicated Desk — your own fixed desk\n"
            "   • Private Office — closed room for teams\n"
            "   • Conference Room — meeting room by the hour\n"
            "4. Click on any **available seat card** (green checkmark)\n"
            "5. Set your **start and end time**\n"
            "6. Click **'Confirm Booking'**\n\n"
            "Your booking will appear under **'My Space'** once confirmed."
        ),
    },
    {
        "triggers": ["cancel a booking", "how to cancel", "cancel my booking", "cancel reservation"],
        "answer": (
            "**How to Cancel a Booking:**\n\n"
            "1. Go to **'My Space'** or **'Bookings'** in the sidebar\n"
            "2. Find the booking you want to cancel\n"
            "3. Click the **'Cancel'** button next to it\n\n"
            "The seat will automatically become available for others once cancelled."
        ),
    },
    {
        "triggers": ["what is a hot desk", "hot desk meaning", "what does hot desk mean",
                     "explain hot desk", "difference between", "types of seat", "seat types",
                     "types of workspace", "workspace types"],
        "answer": (
            "**CoWorkOS Workspace Types:**\n\n"
            "• **Hot Desk** — Any available desk, no fixed spot. Best for drop-in workers. Book by the hour or day.\n\n"
            "• **Dedicated Desk** — A fixed desk assigned just to you. Same spot every day. Monthly plan.\n\n"
            "• **Private Office** — A closed room for a team. Full privacy. Monthly plan.\n\n"
            "• **Conference Room** — Meeting room for group sessions. Book by the hour."
        ),
    },
    {
        "triggers": ["how to raise a ticket", "how to create a ticket", "how to submit a ticket",
                     "raise a support ticket", "report an issue", "log a complaint",
                     "steps to raise", "how to report"],
        "answer": (
            "**How to Raise a Support Ticket:**\n\n"
            "1. Click **'My Tickets'** in the sidebar\n"
            "2. Click **'Raise a Ticket'** button\n"
            "3. Select the **Issue Type** (Maintenance, IT, Billing, etc.)\n"
            "4. Write a clear **description** of the problem\n"
            "5. Set the **Priority** level\n"
            "6. Click **'Submit Ticket'**\n\n"
            "Our team will be notified and will update the ticket status as they work on it."
        ),
    },
    {
        "triggers": ["how to check in visitor", "check in a guest", "visitor check in",
                     "register a visitor", "log a visitor", "add a visitor"],
        "answer": (
            "**How to Check In a Visitor:**\n\n"
            "1. Go to **'Visitors'** in the sidebar (Receptionist access)\n"
            "2. Click **'New Visitor'**\n"
            "3. Enter the visitor's **name, phone, and company**\n"
            "4. Enter the **host name** (who they are visiting)\n"
            "5. Click **'Check In'**\n\n"
            "When the visitor leaves, find their name in the list and click **'Check Out'**."
        ),
    },
    {
        "triggers": ["how to add a lead", "how to create a lead", "add a prospect",
                     "crm how to", "how does the pipeline work", "lead pipeline",
                     "sales pipeline", "how to track leads"],
        "answer": (
            "**How the Lead Pipeline Works:**\n\n"
            "1. Go to **'CRM / Leads'** in the sidebar\n"
            "2. Click **'New Lead'** to add a prospect\n"
            "3. Fill in company name, contact, source, and priority\n"
            "4. Assign it to a sales team member\n\n"
            "**Pipeline stages:**\n"
            "New → Contacted → Qualified → Proposal → **Won ✅** or **Lost ❌**\n\n"
            "Update the status as you progress with the prospect."
        ),
    },
    {
        "triggers": ["how to create an invoice", "how to generate invoice", "create invoice",
                     "send invoice", "how to bill a client", "billing a client"],
        "answer": (
            "**How to Create an Invoice:**\n\n"
            "1. Go to **'Invoices'** in the sidebar (Finance/Admin access)\n"
            "2. Click **'New Invoice'**\n"
            "3. Select the **client**, enter the **amount** and **due date**\n"
            "4. Add a description (optional)\n"
            "5. Save as **Draft** or send immediately\n\n"
            "Track payment status: Draft → Sent → **Paid ✅** or **Overdue ⚠️**"
        ),
    },
    {
        "triggers": ["what is coworkos", "about coworkos", "what does this platform do",
                     "what can you do", "what features", "platform features", "help"],
        "answer": (
            "**CoWorkOS is an all-in-one ERP + CRM platform for coworking spaces.**\n\n"
            "Here's what I can help you with:\n\n"
            "📊 **Live Data** (ask me directly):\n"
            "• 'Show my active bookings'\n"
            "• 'Do I have pending invoices?'\n"
            "• 'Available seats in Mumbai'\n"
            "• 'Who checked in today?'\n"
            "• 'Show open tickets'\n"
            "• 'Which visitors are here for me?'\n\n"
            "📖 **Platform Help** (just ask):\n"
            "• 'How do I book a seat?'\n"
            "• 'How to raise a support ticket?'\n"
            "• 'What are the workspace types?'\n"
            "• 'How does the lead pipeline work?'"
        ),
    },
    {
        "triggers": ["how to add a branch", "add a new branch", "create a branch",
                     "set up a branch", "add location"],
        "answer": (
            "**How to Add a Branch:**\n\n"
            "1. Go to **'Branches'** in the sidebar (Admin access)\n"
            "2. Click **'New Branch'**\n"
            "3. Enter the branch name, city/location, and total seat capacity\n"
            "4. Click **'Save'**\n\n"
            "Once created, you can add seats and assign staff to the branch."
        ),
    },
    {
        "triggers": ["how to add user", "add a user", "create a user", "add staff",
                     "add member", "register a user", "user roles", "what are the roles"],
        "answer": (
            "**User Roles in CoWorkOS:**\n\n"
            "• **Super Admin** — Full access to everything\n"
            "• **Branch Manager** — Manages one branch's operations\n"
            "• **Finance Team** — Invoices, payments, revenue\n"
            "• **Sales Team** — CRM leads and pipeline\n"
            "• **Receptionist** — Visitors and bookings\n"
            "• **Client** — Their own bookings, invoices, tickets\n\n"
            "To add a user: Go to **'Users'** → **'New User'** → fill in details and assign a role."
        ),
    },
]


def get_faq_answer(message: str) -> str | None:
    msg = message.lower()
    for item in FAQ:
        if any(trigger in msg for trigger in item["triggers"]):
            return item["answer"]
    return None
