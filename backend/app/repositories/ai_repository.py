from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.models.models import (
    Booking, Invoice, Ticket, Seat, Visitor, Lead, User, Branch,
    BookingStatusEnum, InvoiceStatusEnum, TicketStatusEnum,
    SeatStatusEnum, VisitorStatusEnum, RoleEnum
)


def get_user_bookings(db: Session, user: User) -> list:
    query = db.query(Booking)
    if user.role not in [RoleEnum.super_admin, RoleEnum.branch_manager]:
        query = query.filter(Booking.user_id == user.id)
    elif user.role == RoleEnum.branch_manager and user.branch_id:
        query = query.filter(Booking.branch_id == user.branch_id)
    return query.filter(
        Booking.booking_status.in_([BookingStatusEnum.pending, BookingStatusEnum.confirmed])
    ).all()


def get_pending_invoices(db: Session, user: User) -> list:
    query = db.query(Invoice)
    if user.role not in [RoleEnum.super_admin, RoleEnum.finance_team]:
        query = query.filter(Invoice.client_id == user.id)
    return query.filter(
        Invoice.status.in_([InvoiceStatusEnum.sent, InvoiceStatusEnum.overdue])
    ).all()


def get_open_tickets(db: Session, user: User) -> list:
    query = db.query(Ticket).filter(
        Ticket.status.in_([TicketStatusEnum.open, TicketStatusEnum.in_progress])
    )
    if user.role == RoleEnum.branch_manager and user.branch_id:
        query = query.filter(Ticket.assigned_to == user.id)
    return query.all()


def get_available_seats(db: Session, location: str = None) -> list:
    query = db.query(Seat).filter(Seat.status == SeatStatusEnum.available)
    if location:
        query = query.join(Branch).filter(
            func.lower(Branch.branch_name).contains(location.lower()) |
            func.lower(Branch.location).contains(location.lower())
        )
    return query.all()


def get_today_visitors(db: Session, user: User) -> list:
    today = date.today()
    query = db.query(Visitor).filter(func.date(Visitor.check_in) == today)
    if user.role == RoleEnum.branch_manager and user.branch_id:
        query = query.filter(Visitor.branch_id == user.branch_id)
    return query.all()


def get_leads(db: Session, user: User) -> list:
    query = db.query(Lead)
    if user.role == RoleEnum.sales_team:
        query = query.filter(Lead.assigned_to == user.id)
    return query.all()


def get_my_visitors(db: Session, user: User) -> list:
    today = date.today()
    return db.query(Visitor).filter(
        func.date(Visitor.check_in) == today,
        func.lower(Visitor.host_name).contains(user.name.lower())
    ).all()


def get_my_bookings(db: Session, user: User) -> list:
    return db.query(Booking).filter(
        Booking.user_id == user.id,
        Booking.booking_status.in_([BookingStatusEnum.pending, BookingStatusEnum.confirmed])
    ).all()
