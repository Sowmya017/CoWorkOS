from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from app.models.models import (
    RoleEnum, SeatTypeEnum, SeatStatusEnum, BookingStatusEnum,
    InvoiceStatusEnum, LeadStatusEnum, PriorityEnum, TicketStatusEnum, VisitorStatusEnum,
    RoomStatusEnum, RoomBookingStatusEnum,
    WorkspaceObjectTypeEnum, WorkspaceStatusEnum,
)

# Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

# User
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: RoleEnum = RoleEnum.client
    branch_id: Optional[int] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[RoleEnum] = None
    branch_id: Optional[int] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: RoleEnum
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    class Config:
        from_attributes = True

# Branch
class BranchCreate(BaseModel):
    branch_name: str
    location: str
    total_seats: int = 0

class BranchUpdate(BaseModel):
    branch_name: Optional[str] = None
    location: Optional[str] = None
    total_seats: Optional[int] = None
    occupied_seats: Optional[int] = None

class BranchOut(BaseModel):
    id: int
    branch_name: str
    location: str
    total_seats: int
    occupied_seats: int
    class Config:
        from_attributes = True

# Visitor
class VisitorCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    company: Optional[str] = None
    host_name: Optional[str] = None
    purpose: Optional[str] = None
    branch_id: int

class VisitorOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    company: Optional[str] = None
    host_name: Optional[str] = None
    purpose: Optional[str] = None
    branch_id: int
    branch_name: Optional[str] = None
    qr_token: Optional[str] = None
    qr_url: Optional[str] = None
    check_in: datetime
    check_out: Optional[datetime] = None
    status: VisitorStatusEnum
    class Config:
        from_attributes = True

# Lead
class LeadCreate(BaseModel):
    company_name: str
    contact_person: Optional[str] = None
    source: Optional[str] = None
    status: LeadStatusEnum = LeadStatusEnum.new
    assigned_to: Optional[int] = None
    priority: PriorityEnum = PriorityEnum.medium

class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    source: Optional[str] = None
    status: Optional[LeadStatusEnum] = None
    assigned_to: Optional[int] = None
    priority: Optional[PriorityEnum] = None

class LeadOut(BaseModel):
    id: int
    company_name: str
    contact_person: Optional[str] = None
    source: Optional[str] = None
    status: LeadStatusEnum
    assigned_to: Optional[int] = None
    assigned_name: Optional[str] = None
    priority: PriorityEnum
    created_at: datetime
    class Config:
        from_attributes = True

# Seat
class SeatCreate(BaseModel):
    branch_id: int
    seat_number: str
    type: SeatTypeEnum = SeatTypeEnum.hot_desk
    price: float = 0.0
    status: SeatStatusEnum = SeatStatusEnum.available

class SeatUpdate(BaseModel):
    seat_number: Optional[str] = None
    type: Optional[SeatTypeEnum] = None
    price: Optional[float] = None
    status: Optional[SeatStatusEnum] = None

class SeatOut(BaseModel):
    id: int
    branch_id: int
    branch_name: Optional[str] = None
    seat_number: str
    type: SeatTypeEnum
    price: float
    status: SeatStatusEnum
    class Config:
        from_attributes = True

# Booking
class BookingCreate(BaseModel):
    seat_id: int
    user_id: int
    branch_id: int
    start_time: datetime
    end_time: datetime

class BookingUpdate(BaseModel):
    booking_status: Optional[BookingStatusEnum] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class BookingOut(BaseModel):
    id: int
    seat_id: int
    seat_number: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    branch_id: int
    branch_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    booking_status: BookingStatusEnum
    class Config:
        from_attributes = True

# Invoice
class InvoiceCreate(BaseModel):
    client_id: Optional[int] = None
    client_name: str
    amount: float
    due_date: datetime
    status: InvoiceStatusEnum = InvoiceStatusEnum.draft
    invoice_number: Optional[str] = None
    description: Optional[str] = None
    branch_id: Optional[int] = None
    subscription_type: Optional[str] = None
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[datetime] = None
    status: Optional[InvoiceStatusEnum] = None
    invoice_number: Optional[str] = None
    description: Optional[str] = None
    branch_id: Optional[int] = None
    subscription_type: Optional[str] = None
    notes: Optional[str] = None

class InvoiceOut(BaseModel):
    id: int
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    amount: float
    due_date: datetime
    status: InvoiceStatusEnum
    invoice_number: Optional[str] = None
    description: Optional[str] = None
    branch_id: Optional[int] = None
    subscription_type: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Ticket
class TicketCreate(BaseModel):
    issue_type: str
    description: Optional[str] = None
    priority: PriorityEnum = PriorityEnum.medium
    assigned_to: Optional[int] = None

class TicketUpdate(BaseModel):
    issue_type: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    assigned_to: Optional[int] = None
    status: Optional[TicketStatusEnum] = None

class TicketOut(BaseModel):
    id: int
    issue_type: str
    description: Optional[str] = None
    priority: PriorityEnum
    assigned_to: Optional[int] = None
    assigned_name: Optional[str] = None
    status: TicketStatusEnum
    created_at: datetime
    class Config:
        from_attributes = True

# Payment
class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    payment_status: Optional[str] = None
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    invoice_number: Optional[str] = None
    client_name: Optional[str] = None
    amount: float
    payment_status: str
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Subscription
class SubscriptionCreate(BaseModel):
    client_id: int
    plan_type: str
    start_date: datetime
    end_date: datetime
    amount: float
    branch_id: Optional[int] = None

class SubscriptionUpdate(BaseModel):
    plan_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    branch_id: Optional[int] = None

class SubscriptionOut(BaseModel):
    id: int
    client_id: int
    client_name: Optional[str] = None
    plan_type: str
    start_date: datetime
    end_date: datetime
    status: str
    amount: float
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Room
class RoomCreate(BaseModel):
    branch_id: int
    room_name: str
    floor: int = 1
    capacity: int = 10
    price_per_hour: float = 0.0
    amenities: Optional[str] = None

class RoomUpdate(BaseModel):
    room_name: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    price_per_hour: Optional[float] = None
    status: Optional[RoomStatusEnum] = None
    amenities: Optional[str] = None

class RoomOut(BaseModel):
    id: int
    branch_id: int
    branch_name: Optional[str] = None
    room_name: str
    floor: int
    capacity: int
    price_per_hour: float
    status: RoomStatusEnum
    amenities: Optional[str] = None
    class Config:
        from_attributes = True

# Room Booking
class RoomBookingCreate(BaseModel):
    room_id: int
    branch_id: int
    start_time: datetime
    end_time: datetime

class RoomBookingOut(BaseModel):
    id: int
    room_id: int
    room_name: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    branch_id: int
    branch_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: RoomBookingStatusEnum
    class Config:
        from_attributes = True

# Attendance
class AttendanceOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    branch_id: int
    branch_name: Optional[str] = None
    check_in: datetime
    check_out: Optional[datetime] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

# Notification
class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    body: Optional[str] = None
    type: str
    is_read: str
    created_at: datetime
    class Config:
        from_attributes = True

TokenResponse.model_rebuild()

# ─── Visual Workspace Schemas ──────────────────────────────────────────────────

# Floor
class FloorCreate(BaseModel):
    branch_id: int
    name: str
    floor_number: int = 0
    description: Optional[str] = None

class FloorUpdate(BaseModel):
    name: Optional[str] = None
    floor_number: Optional[int] = None
    description: Optional[str] = None

class FloorOut(BaseModel):
    id: int
    branch_id: int
    branch_name: Optional[str] = None
    name: str
    floor_number: int
    description: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Floor Asset
class FloorAssetOut(BaseModel):
    id: int
    floor_id: int
    asset_type: str
    url: str
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Layout Version
class LayoutVersionCreate(BaseModel):
    floor_id: int
    label: Optional[str] = None
    canvas_width: float = 1200.0
    canvas_height: float = 800.0
    background_image_url: Optional[str] = None

class LayoutVersionUpdate(BaseModel):
    label: Optional[str] = None
    is_active: Optional[bool] = None
    canvas_width: Optional[float] = None
    canvas_height: Optional[float] = None
    background_image_url: Optional[str] = None

class LayoutVersionOut(BaseModel):
    id: int
    floor_id: int
    version_number: int
    label: Optional[str] = None
    is_active: bool
    canvas_width: float
    canvas_height: float
    background_image_url: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Workspace Object
class WorkspaceObjectCreate(BaseModel):
    layout_version_id: int
    floor_id: int
    branch_id: int
    object_type: WorkspaceObjectTypeEnum
    label: Optional[str] = None
    x: float = 0.0
    y: float = 0.0
    width: float = 120.0
    height: float = 80.0
    rotation: float = 0.0
    capacity: int = 1
    price_per_hour: float = 0.0
    price_per_day: float = 0.0
    price_per_month: float = 0.0
    status: WorkspaceStatusEnum = WorkspaceStatusEnum.available
    is_locked: bool = False
    is_bookable: bool = True
    color: Optional[str] = None
    amenities: Optional[str] = None
    metadata_json: Optional[str] = None

class WorkspaceObjectUpdate(BaseModel):
    label: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    rotation: Optional[float] = None
    capacity: Optional[int] = None
    price_per_hour: Optional[float] = None
    price_per_day: Optional[float] = None
    price_per_month: Optional[float] = None
    status: Optional[WorkspaceStatusEnum] = None
    is_locked: Optional[bool] = None
    is_bookable: Optional[bool] = None
    color: Optional[str] = None
    amenities: Optional[str] = None
    metadata_json: Optional[str] = None

class WorkspaceObjectBulkUpdate(BaseModel):
    objects: List[WorkspaceObjectUpdate]
    ids: List[int]

class WorkspaceObjectOut(BaseModel):
    id: int
    layout_version_id: int
    floor_id: int
    branch_id: int
    object_type: WorkspaceObjectTypeEnum
    label: Optional[str] = None
    x: float
    y: float
    width: float
    height: float
    rotation: float
    capacity: int
    price_per_hour: float
    price_per_day: float
    price_per_month: float
    status: WorkspaceStatusEnum
    is_locked: bool
    is_bookable: bool
    color: Optional[str] = None
    amenities: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Layout Version with objects (full snapshot)
class LayoutVersionDetail(LayoutVersionOut):
    workspace_objects: List[WorkspaceObjectOut] = []

# Workspace Booking (from visual layout)
class WorkspaceBookingCreate(BaseModel):
    workspace_object_id: int
    branch_id: int
    start_time: datetime
    end_time: datetime

class WorkspaceBookingOut(BaseModel):
    id: int
    workspace_object_id: Optional[int] = None
    workspace_label: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    branch_id: int
    branch_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    booking_status: BookingStatusEnum
    created_at: datetime
    class Config:
        from_attributes = True
