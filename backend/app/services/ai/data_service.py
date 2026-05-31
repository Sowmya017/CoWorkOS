from sqlalchemy.orm import Session
from app.models.models import Seat, Branch, VisitorStatusEnum


def format_bookings_response(bookings: list, db: Session) -> str:
    if not bookings:
        return "You have no active bookings at the moment."

    lines = [f"You have **{len(bookings)} active booking(s)**:\n"]
    for i, b in enumerate(bookings, 1):
        seat = db.query(Seat).filter(Seat.id == b.seat_id).first()
        branch = db.query(Branch).filter(Branch.id == b.branch_id).first()
        seat_label = f"{seat.seat_number} ({seat.type.value.replace('_', ' ').title()})" if seat else "N/A"
        branch_label = branch.branch_name if branch else "N/A"
        lines.append(
            f"{i}. **{seat_label}** at {branch_label}\n"
            f"   Status: {b.booking_status.value.title()} | "
            f"{b.start_time.strftime('%d %b %Y, %I:%M %p')} → {b.end_time.strftime('%I:%M %p')}"
        )
    return "\n".join(lines)


def format_invoices_response(invoices: list) -> str:
    if not invoices:
        return "No pending invoices. All your payments are up to date!"

    total = sum(inv.amount for inv in invoices)
    overdue = [inv for inv in invoices if inv.status.value == "overdue"]
    lines = [f"You have **{len(invoices)} pending invoice(s)** totalling **₹{total:,.0f}**:\n"]

    if overdue:
        lines.append(f"⚠️ **{len(overdue)} overdue** — please action these immediately.\n")

    for i, inv in enumerate(invoices[:5], 1):
        emoji = "🔴" if inv.status.value == "overdue" else "🟡"
        lines.append(
            f"{i}. {emoji} **{inv.invoice_number}** — ₹{inv.amount:,.0f}\n"
            f"   Due: {inv.due_date.strftime('%d %b %Y')} | {inv.status.value.title()}"
        )

    if len(invoices) > 5:
        lines.append(f"\n...and {len(invoices) - 5} more. Visit the Finance module for full details.")

    return "\n".join(lines)


def format_tickets_response(tickets: list) -> str:
    if not tickets:
        return "No open support tickets at the moment."

    priority_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
    lines = [f"**{len(tickets)} open ticket(s)**:\n"]

    for i, t in enumerate(tickets[:5], 1):
        emoji = priority_emoji.get(t.priority.value, "⚪")
        desc = t.description[:60] + ("..." if len(t.description) > 60 else "")
        lines.append(
            f"{i}. {emoji} **{t.issue_type}** — {desc}\n"
            f"   Status: {t.status.value.replace('_', ' ').title()} | Priority: {t.priority.value.title()}"
        )

    if len(tickets) > 5:
        lines.append(f"\n...and {len(tickets) - 5} more. Visit the Tickets module.")

    return "\n".join(lines)


def format_seats_response(seats: list, db: Session, location: str = None) -> str:
    loc_label = f" in {location.title()}" if location else ""
    if not seats:
        return f"No available seats found{loc_label} at the moment."

    by_type: dict = {}
    for seat in seats:
        by_type.setdefault(seat.type.value, []).append(seat)

    type_labels = {
        "hot_desk": "Hot Desk",
        "dedicated": "Dedicated Desk",
        "private_office": "Private Office",
        "conference": "Conference Room",
    }
    lines = [f"**{len(seats)} available seat(s){loc_label}**:\n"]

    for seat_type, type_seats in by_type.items():
        label = type_labels.get(seat_type, seat_type)
        prices = [s.price for s in type_seats]
        min_price = min(prices)
        branch_ids = list({s.branch_id for s in type_seats})
        branches = db.query(Branch).filter(Branch.id.in_(branch_ids)).all()
        branch_names = ", ".join(b.branch_name for b in branches[:3])
        lines.append(
            f"**{label}** — {len(type_seats)} available\n"
            f"   From ₹{min_price:,.0f}/month | {branch_names}"
        )

    return "\n".join(lines)


def format_visitors_response(visitors: list) -> str:
    if not visitors:
        return "No visitors have checked in today."

    checked_in = [v for v in visitors if v.status == VisitorStatusEnum.checked_in]
    checked_out = [v for v in visitors if v.status == VisitorStatusEnum.checked_out]

    lines = [
        f"**{len(visitors)} visitor(s) today**",
        f"- Currently inside: **{len(checked_in)}**",
        f"- Checked out: **{len(checked_out)}**",
    ]

    if checked_in:
        lines.append("\n**Currently inside:**")
        for v in checked_in[:5]:
            company = f" ({v.company})" if v.company else ""
            lines.append(f"• {v.name}{company} — Host: {v.host_name}")
        if len(checked_in) > 5:
            lines.append(f"...and {len(checked_in) - 5} more")

    return "\n".join(lines)


def format_my_visitors_response(visitors: list, user_name: str) -> str:
    if not visitors:
        return f"No visitors are currently here to meet you ({user_name}) today."

    checked_in = [v for v in visitors if v.status == VisitorStatusEnum.checked_in]
    checked_out = [v for v in visitors if v.status == VisitorStatusEnum.checked_out]

    lines = [f"**{len(visitors)} visitor(s) for {user_name} today:**\n"]

    if checked_in:
        lines.append("**Currently inside:**")
        for v in checked_in:
            company = f" from {v.company}" if v.company else ""
            lines.append(f"• {v.name}{company} — checked in at {v.check_in.strftime('%I:%M %p')}")

    if checked_out:
        lines.append("\n**Already left:**")
        for v in checked_out:
            lines.append(f"• {v.name} — checked out")

    return "\n".join(lines)


def format_leads_response(leads: list) -> str:
    if not leads:
        return "No leads found in the pipeline."

    status_counts: dict = {}
    for lead in leads:
        status_counts[lead.status.value] = status_counts.get(lead.status.value, 0) + 1

    lines = [f"**{len(leads)} lead(s) in your pipeline**:\n"]
    for status, count in status_counts.items():
        lines.append(f"• {status.replace('_', ' ').title()}: {count}")

    lines.append("\n**Recent leads:**")
    for lead in leads[:3]:
        lines.append(
            f"• **{lead.company_name}** — {lead.contact_person} | "
            f"{lead.status.value.title()} | {lead.priority.value.title()} priority"
        )

    return "\n".join(lines)
