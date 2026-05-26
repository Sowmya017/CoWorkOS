from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.routes import auth, users, branches, visitors, leads, seats, bookings, invoices, tickets, dashboard, finance, payments, subscriptions

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CoWorkOS API",
    description="ERP & CRM platform for coworking spaces",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(branches.router)
app.include_router(visitors.router)
app.include_router(leads.router)
app.include_router(seats.router)
app.include_router(bookings.router)
app.include_router(invoices.router)
app.include_router(tickets.router)
app.include_router(dashboard.router)
app.include_router(finance.router)
app.include_router(payments.router)
app.include_router(subscriptions.router)

@app.get("/")
def root():
    return {"message": "CoWorkOS API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}
