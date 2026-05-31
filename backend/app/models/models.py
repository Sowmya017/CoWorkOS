from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    branch_manager = "branch_manager"
    finance_team = "finance_team"
    sales_team = "sales_team"
    receptionist = "receptionist"
    client = "client"

class SeatTypeEnum(str, enum.Enum):
    hot_desk = "hot_desk"
    dedicated = "dedicated"
    private_office = "private_office"
    conference = "conference"

class SeatStatusEnum(str, enum.Enum):
    available = "available"
    occupied = "occupied"
    reserved = "reserved"
    maintenance = "maintenance"

class BookingStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"

class InvoiceStatusEnum(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"

class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"

class SubscriptionPlanEnum(str, enum.Enum):
    hot_desk = "hot_desk"
    dedicated = "dedicated"
    private_office = "private_office"
    enterprise = "enterprise"

class SubscriptionStatusEnum(str, enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"

class LeadStatusEnum(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal = "proposal"
    won = "won"
    lost = "lost"

class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class TicketStatusEnum(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class VisitorStatusEnum(str, enum.Enum):
    checked_in = "checked_in"
    checked_out = "checked_out"

class RoomStatusEnum(str, enum.Enum):
    available = "available"
    occupied = "occupied"
    maintenance = "maintenance"

class RoomBookingStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"


class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    branch_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    total_seats = Column(Integer, default=0)
    occupied_seats = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="branch")
    seats = relationship("Seat", back_populates="branch")
    visitors = relationship("Visitor", back_populates="branch")
    bookings = relationship("Booking", back_populates="branch")
    subscriptions = relationship("Subscription", back_populates="branch")
    rooms = relationship("Room", back_populates="branch")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(SAEnum(RoleEnum), default=RoleEnum.client, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch", back_populates="users")
    bookings = relationship("Booking", back_populates="user")
    invoices = relationship("Invoice", back_populates="client")
    assigned_leads = relationship("Lead", back_populates="assigned_user")
    assigned_tickets = relationship("Ticket", back_populates="assigned_user")
    subscriptions = relationship("Subscription", back_populates="client")


class Visitor(Base):
    __tablename__ = "visitors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    company = Column(String(255))
    host_name = Column(String(255))
    purpose = Column(String(255), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    qr_token = Column(String(100), unique=True, nullable=True, index=True)
    check_in = Column(DateTime(timezone=True), server_default=func.now())
    check_out = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(VisitorStatusEnum), default=VisitorStatusEnum.checked_in)

    branch = relationship("Branch", back_populates="visitors")


class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    contact_person = Column(String(255))
    source = Column(String(100))
    status = Column(SAEnum(LeadStatusEnum), default=LeadStatusEnum.new)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(SAEnum(PriorityEnum), default=PriorityEnum.medium)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assigned_user = relationship("User", back_populates="assigned_leads")


class Seat(Base):
    __tablename__ = "seats"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    seat_number = Column(String(50), nullable=False)
    type = Column(SAEnum(SeatTypeEnum), default=SeatTypeEnum.hot_desk)
    price = Column(Float, default=0.0)
    status = Column(SAEnum(SeatStatusEnum), default=SeatStatusEnum.available)

    branch = relationship("Branch", back_populates="seats")
    bookings = relationship("Booking", back_populates="seat")


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    booking_status = Column(SAEnum(BookingStatusEnum), default=BookingStatusEnum.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    seat = relationship("Seat", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
    branch = relationship("Branch", back_populates="bookings")


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    client_name = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(SAEnum(InvoiceStatusEnum), default=InvoiceStatusEnum.draft)
    invoice_number = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    subscription_type = Column(String(100), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    client = relationship("User", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_status = Column(SAEnum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    payment_method = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    invoice = relationship("Invoice", back_populates="payments")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_type = Column(SAEnum(SubscriptionPlanEnum), default=SubscriptionPlanEnum.hot_desk)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(SAEnum(SubscriptionStatusEnum), default=SubscriptionStatusEnum.active)
    amount = Column(Float, default=0.0)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    client = relationship("User", back_populates="subscriptions")
    branch = relationship("Branch", back_populates="subscriptions")


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    issue_type = Column(String(100), nullable=False)
    description = Column(Text)
    priority = Column(SAEnum(PriorityEnum), default=PriorityEnum.medium)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SAEnum(TicketStatusEnum), default=TicketStatusEnum.open)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assigned_user = relationship("User", back_populates="assigned_tickets")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    room_name = Column(String(100), nullable=False)
    floor = Column(Integer, default=1)
    capacity = Column(Integer, default=10)
    price_per_hour = Column(Float, default=0.0)
    status = Column(SAEnum(RoomStatusEnum), default=RoomStatusEnum.available)
    amenities = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch", back_populates="rooms")
    room_bookings = relationship("RoomBooking", back_populates="room")


class RoomBooking(Base):
    __tablename__ = "room_bookings"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(SAEnum(RoomBookingStatusEnum), default=RoomBookingStatusEnum.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("Room", back_populates="room_bookings")
    user = relationship("User")
    branch = relationship("Branch")


class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    check_in = Column(DateTime(timezone=True), server_default=func.now())
    check_out = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="checked_in")  # checked_in | checked_out
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    branch = relationship("Branch")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    type = Column(String(50), default="info")  # info | booking | invoice | ticket | room
    is_read = Column(String(5), default="false")  # stored as string for broad DB compat
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
