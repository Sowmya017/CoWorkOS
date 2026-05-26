"""
Seed script — run with: python seed_data.py
Requires DATABASE_URL in .env to point to a running PostgreSQL instance.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models.models import Base, Branch, User, Visitor, Lead, Seat, Booking, Invoice, Ticket
from app.models.models import (
    RoleEnum, SeatTypeEnum, SeatStatusEnum, BookingStatusEnum,
    InvoiceStatusEnum, LeadStatusEnum, PriorityEnum, TicketStatusEnum, VisitorStatusEnum
)
from app.models.models import Payment, PaymentStatusEnum, Subscription, SubscriptionPlanEnum, SubscriptionStatusEnum
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing data so the script is idempotent
db.execute(__import__("sqlalchemy").text(
    "TRUNCATE TABLE tickets, payments, subscriptions, invoices, bookings, seats, leads, visitors, users, branches RESTART IDENTITY CASCADE"
))
db.commit()

def rand_past(days=30):
    return datetime.utcnow() - timedelta(days=random.randint(0, days), hours=random.randint(0, 23))

print("🌱 Seeding CoWorkOS database...")

# ── Branches ────────────────────────────────────────────────────────────────
branches_data = [
    {"branch_name": "Koramangala Hub",    "location": "Bangalore",  "total_seats": 80,  "occupied_seats": 62},
    {"branch_name": "Indiranagar Center", "location": "Bangalore",  "total_seats": 60,  "occupied_seats": 45},
    {"branch_name": "Bandra Workspace",   "location": "Mumbai",     "total_seats": 100, "occupied_seats": 78},
    {"branch_name": "Connaught Place",    "location": "Delhi",      "total_seats": 120, "occupied_seats": 95},
    {"branch_name": "Anna Nagar Hub",     "location": "Chennai",    "total_seats": 40,  "occupied_seats": 22},
]
branches = []
for b in branches_data:
    branch = Branch(**b)
    db.add(branch)
    branches.append(branch)
db.flush()

# ── Users ────────────────────────────────────────────────────────────────────
users_data = [
    {"name": "Admin User",    "email": "admin@coworkos.com",       "password": hash_password("admin123"),    "role": RoleEnum.super_admin},
    {"name": "Priya Mehta",   "email": "manager@coworkos.com",     "password": hash_password("manager123"),  "role": RoleEnum.branch_manager,  "branch_id": branches[0].id},
    {"name": "Arjun Nair",    "email": "receptionist@coworkos.com","password": hash_password("recept123"),   "role": RoleEnum.receptionist,    "branch_id": branches[0].id},
    {"name": "Divya Rao",     "email": "finance@coworkos.com",     "password": hash_password("finance123"),  "role": RoleEnum.finance_team},
    {"name": "Rohan Joshi",   "email": "sales@coworkos.com",       "password": hash_password("sales123"),    "role": RoleEnum.sales_team},
    {"name": "Sneha Gupta",   "email": "client@coworkos.com",      "password": hash_password("client123"),   "role": RoleEnum.client,          "branch_id": branches[1].id},
    {"name": "Vikram Singh",  "email": "vikram@techcorp.com",      "password": hash_password("client123"),   "role": RoleEnum.client,          "branch_id": branches[0].id},
    {"name": "Ananya Patel",  "email": "ananya@designhub.com",     "password": hash_password("client123"),   "role": RoleEnum.client,          "branch_id": branches[2].id},
    {"name": "Karthik Iyer",  "email": "karthik@fincorp.com",      "password": hash_password("client123"),   "role": RoleEnum.client,          "branch_id": branches[3].id},
    {"name": "Meera Krishnan","email": "meera@greenbuild.com",     "password": hash_password("client123"),   "role": RoleEnum.client,          "branch_id": branches[4].id},
    {"name": "Sanjay Dubey",  "email": "sanjay.mgr@coworkos.com",  "password": hash_password("manager123"),  "role": RoleEnum.branch_manager,  "branch_id": branches[2].id},
    {"name": "Lakshmi Rajan", "email": "lakshmi@coworkos.com",     "password": hash_password("recept123"),   "role": RoleEnum.receptionist,    "branch_id": branches[3].id},
]
users = []
for u in users_data:
    user = User(**u)
    db.add(user)
    users.append(user)
db.flush()

# ── Seats ─────────────────────────────────────────────────────────────────────
seat_configs = [
    (SeatTypeEnum.hot_desk,      500.0,  10),
    (SeatTypeEnum.dedicated,     8000.0,  5),
    (SeatTypeEnum.private_office,25000.0, 3),
    (SeatTypeEnum.conference,    1500.0,  2),
]
seats = []
for branch in branches:
    for seat_type, price, count in seat_configs:
        prefix = {"hot_desk": "H", "dedicated": "D", "private_office": "P", "conference": "C"}[seat_type.value]
        for i in range(1, count + 1):
            occupied_threshold = 0.7
            status = SeatStatusEnum.occupied if random.random() < occupied_threshold else SeatStatusEnum.available
            seat = Seat(branch_id=branch.id, seat_number=f"{prefix}-{i:02d}", type=seat_type, price=price, status=status)
            db.add(seat)
            seats.append(seat)
db.flush()

# ── Visitors ──────────────────────────────────────────────────────────────────
visitor_names = [
    ("Rahul Sharma",  "9876543210", "TechCorp India"),
    ("Ananya Patel",  "8765432109", "DesignHub"),
    ("Vikram Singh",  "7654321098", "StartupX"),
    ("Meera Iyer",    "6543210987", "MediaCo"),
    ("Aditya Kumar",  "5432109876", "FinTech Ltd"),
    ("Priya Rajan",   "4321098765", "EduTech Co"),
    ("Suresh Verma",  "3210987654", "GreenBuild"),
    ("Kavya Reddy",   "2109876543", "CraftWorks"),
    ("Nikhil Jain",   "1098765432", "LogiTech"),
    ("Sonal Shah",    "9988776655", "RetailX"),
    ("Deepak Nair",   "8877665544", "CloudBase"),
    ("Asha Menon",    "7766554433", "SparkMedia"),
]
hosts = ["Priya Mehta", "Arjun Nair", "Divya Rao", "Rohan Joshi"]
now = datetime.utcnow()

for i, (name, phone, company) in enumerate(visitor_names):
    branch = branches[i % len(branches)]
    check_in = now - timedelta(hours=random.randint(1, 8))
    checked_out = i % 3 != 0  # 2/3 are checked out
    db.add(Visitor(
        name=name, phone=phone, company=company,
        host_name=random.choice(hosts),
        branch_id=branch.id,
        check_in=check_in,
        check_out=(check_in + timedelta(hours=random.randint(1, 4))) if checked_out else None,
        status=VisitorStatusEnum.checked_out if checked_out else VisitorStatusEnum.checked_in,
    ))

# ── Leads ─────────────────────────────────────────────────────────────────────
leads_raw = [
    ("TechStart Pvt Ltd",   "Arjun Mehta",   "Website",   LeadStatusEnum.qualified, PriorityEnum.high),
    ("Creative Agency",     "Priya Sharma",  "Referral",  LeadStatusEnum.proposal,  PriorityEnum.medium),
    ("FinCorp Solutions",   "Vikram Nair",   "LinkedIn",  LeadStatusEnum.contacted, PriorityEnum.high),
    ("EduTech India",       "Ananya Iyer",   "Cold Call", LeadStatusEnum.new,       PriorityEnum.low),
    ("GreenBuild Co",       "Rohan Das",     "Website",   LeadStatusEnum.won,       PriorityEnum.high),
    ("MediaBlast",          "Sneha Rao",     "Event",     LeadStatusEnum.lost,      PriorityEnum.medium),
    ("CloudSpark",          "Dinesh Patel",  "LinkedIn",  LeadStatusEnum.new,       PriorityEnum.medium),
    ("RetailX",             "Kavitha Sinha", "Referral",  LeadStatusEnum.contacted, PriorityEnum.high),
    ("LogiTech Systems",    "Mohan Kumar",   "Website",   LeadStatusEnum.qualified, PriorityEnum.medium),
    ("DataWave",            "Preethi Nair",  "Event",     LeadStatusEnum.proposal,  PriorityEnum.high),
    ("HealthFirst",         "Suresh Iyer",   "Cold Call", LeadStatusEnum.new,       PriorityEnum.low),
    ("UrbanSpaces",         "Rekha Sharma",  "Referral",  LeadStatusEnum.won,       PriorityEnum.high),
    ("FoodTech Co",         "Ashok Verma",   "LinkedIn",  LeadStatusEnum.contacted, PriorityEnum.medium),
    ("AutoDrive",           "Pooja Mehta",   "Website",   LeadStatusEnum.lost,      PriorityEnum.low),
    ("CryptoBase",          "Nikhil Jain",   "Event",     LeadStatusEnum.qualified, PriorityEnum.high),
]
for company, contact, source, status, priority in leads_raw:
    db.add(Lead(
        company_name=company,
        contact_person=contact,
        source=source,
        status=status,
        priority=priority,
        assigned_to=users[4].id if random.random() > 0.4 else None,
        created_at=rand_past(60),
    ))

# ── Bookings ──────────────────────────────────────────────────────────────────
client_users = [u for u in users if u.role == RoleEnum.client]
available_seats = [s for s in seats if s.status == SeatStatusEnum.available]

for i, seat in enumerate(available_seats[:min(15, len(available_seats))]):
    user = client_users[i % len(client_users)]
    start = now + timedelta(days=random.randint(0, 7), hours=random.randint(8, 10))
    end = start + timedelta(hours=random.randint(4, 8))
    status = random.choice([BookingStatusEnum.confirmed, BookingStatusEnum.pending])
    db.add(Booking(
        seat_id=seat.id,
        user_id=user.id,
        branch_id=seat.branch_id,
        start_time=start,
        end_time=end,
        booking_status=status,
    ))

# Past completed bookings
for i in range(10):
    seat = random.choice(seats)
    user = random.choice(client_users)
    start = now - timedelta(days=random.randint(1, 30))
    end = start + timedelta(hours=random.randint(2, 8))
    db.add(Booking(
        seat_id=seat.id,
        user_id=user.id,
        branch_id=seat.branch_id,
        start_time=start,
        end_time=end,
        booking_status=BookingStatusEnum.completed,
    ))

# ── Invoices ─────────────────────────────────────────────────────────────────
invoice_data = [
    (users[5].id, 25000.0,  now + timedelta(days=7),   InvoiceStatusEnum.sent),
    (users[6].id, 16000.0,  now - timedelta(days=3),   InvoiceStatusEnum.overdue),
    (users[7].id, 50000.0,  now + timedelta(days=20),  InvoiceStatusEnum.paid),
    (users[8].id, 75000.0,  now + timedelta(days=15),  InvoiceStatusEnum.sent),
    (users[9].id, 8000.0,   now + timedelta(days=10),  InvoiceStatusEnum.draft),
    (users[5].id, 30000.0,  now - timedelta(days=10),  InvoiceStatusEnum.paid),
    (users[6].id, 12000.0,  now - timedelta(days=15),  InvoiceStatusEnum.paid),
    (users[7].id, 45000.0,  now + timedelta(days=5),   InvoiceStatusEnum.sent),
    (users[8].id, 20000.0,  now - timedelta(days=5),   InvoiceStatusEnum.overdue),
    (users[9].id, 60000.0,  now + timedelta(days=25),  InvoiceStatusEnum.draft),
]
for idx, (client_id, amount, due_date, status) in enumerate(invoice_data):
    db.add(Invoice(client_id=client_id, amount=amount, due_date=due_date, status=status,
                   invoice_number=f"INV-2025-{idx+1:03d}",
                   created_at=rand_past(30)))

# ── Payments ────────────────────────────────────────────────────────────────
# Find paid invoices and create payment records
all_invoices = db.query(Invoice).all()
for inv in all_invoices:
    if inv.status == InvoiceStatusEnum.paid:
        db.add(Payment(
            invoice_id=inv.id,
            amount=inv.amount,
            payment_status=PaymentStatusEnum.completed,
            payment_date=rand_past(20),
            payment_method=random.choice(["Bank Transfer", "UPI", "Cheque", "Credit Card"]),
        ))

# ── Subscriptions ─────────────────────────────────────────────────────────────
sub_configs = [
    (users[5].id,  branches[0].id, SubscriptionPlanEnum.dedicated,    8000.0),
    (users[6].id,  branches[0].id, SubscriptionPlanEnum.private_office, 25000.0),
    (users[7].id,  branches[2].id, SubscriptionPlanEnum.hot_desk,      4000.0),
    (users[8].id,  branches[3].id, SubscriptionPlanEnum.enterprise,    50000.0),
    (users[9].id,  branches[4].id, SubscriptionPlanEnum.dedicated,     8000.0),
]
now2 = datetime.utcnow()
for client_id, branch_id, plan, amt in sub_configs:
    start = now2 - timedelta(days=random.randint(10, 90))
    db.add(Subscription(
        client_id=client_id,
        branch_id=branch_id,
        plan_type=plan,
        start_date=start,
        end_date=start + timedelta(days=365),
        status=SubscriptionStatusEnum.active,
        amount=amt,
    ))

# ── Tickets ───────────────────────────────────────────────────────────────────
tickets_data = [
    ("Maintenance",   "AC not working in Zone B",             PriorityEnum.high,     TicketStatusEnum.open,        None),
    ("IT Support",    "Internet slow on floor 2",             PriorityEnum.medium,   TicketStatusEnum.in_progress, users[0].id),
    ("Billing",       "Invoice discrepancy for May",          PriorityEnum.high,     TicketStatusEnum.open,        users[3].id),
    ("Housekeeping",  "Pantry needs restocking",              PriorityEnum.low,      TicketStatusEnum.resolved,    None),
    ("Security",      "Access card not working for client",   PriorityEnum.critical, TicketStatusEnum.in_progress, users[2].id),
    ("Maintenance",   "Broken chair in meeting room 3",       PriorityEnum.low,      TicketStatusEnum.closed,      None),
    ("IT Support",    "Printer offline on 3rd floor",         PriorityEnum.medium,   TicketStatusEnum.open,        users[0].id),
    ("Billing",       "Duplicate charge on invoice #007",     PriorityEnum.high,     TicketStatusEnum.in_progress, users[3].id),
    ("Maintenance",   "Water leak near server room",          PriorityEnum.critical, TicketStatusEnum.open,        None),
    ("Housekeeping",  "Coffee machine broken",                PriorityEnum.low,      TicketStatusEnum.resolved,    None),
]
for issue_type, desc, priority, status, assigned in tickets_data:
    db.add(Ticket(
        issue_type=issue_type,
        description=desc,
        priority=priority,
        status=status,
        assigned_to=assigned,
        created_at=rand_past(14),
    ))

db.commit()
db.close()

print("✅ Seed complete!")
print()
print("  Demo credentials:")
print("  ┌─────────────────┬──────────────────────────────┬──────────────────┐")
print("  │ Role            │ Email                        │ Password         │")
print("  ├─────────────────┼──────────────────────────────┼──────────────────┤")
print("  │ Super Admin     │ admin@coworkos.com           │ admin123         │")
print("  │ Branch Manager  │ manager@coworkos.com         │ manager123       │")
print("  │ Receptionist    │ receptionist@coworkos.com    │ recept123        │")
print("  │ Finance         │ finance@coworkos.com         │ finance123       │")
print("  │ Sales           │ sales@coworkos.com           │ sales123         │")
print("  │ Client          │ client@coworkos.com          │ client123        │")
print("  └─────────────────┴──────────────────────────────┴──────────────────┘")
