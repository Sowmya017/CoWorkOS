import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine
from app.api.routes import (
    auth, users, branches, visitors, leads, seats, bookings, invoices,
    tickets, dashboard, finance, payments, subscriptions, ai, rooms,
    notifications, attendance,
    floors, layout_versions, workspace_objects, workspace_bookings, layout_ws,
)

Base.metadata.create_all(bind=engine)

# Ensure columns added after initial table creation exist
from sqlalchemy import text, inspect as sa_inspect
def _run_migrations():
    with engine.connect() as conn:
        inspector = sa_inspect(engine)
        cols_info = {c["name"]: c for c in inspector.get_columns("bookings")}

        # Add workspace_object_id if missing
        if "workspace_object_id" not in cols_info:
            conn.execute(text(
                "ALTER TABLE bookings "
                "ADD COLUMN workspace_object_id INTEGER "
                "REFERENCES workspace_objects(id) ON DELETE SET NULL"
            ))
            conn.commit()
            print("[migration] added workspace_object_id to bookings")

        # seat_id was originally NOT NULL — drop that constraint so workspace
        # bookings (which have no seat) can be inserted
        seat_col = cols_info.get("seat_id", {})
        if seat_col and not seat_col.get("nullable", True):
            conn.execute(text(
                "ALTER TABLE bookings ALTER COLUMN seat_id DROP NOT NULL"
            ))
            conn.commit()
            print("[migration] made seat_id nullable on bookings")

try:
    _run_migrations()
except Exception as e:
    print(f"[migration] warning: {e}")

app = FastAPI(
    title="CoWorkOS API",
    description="ERP & CRM platform for coworking spaces",
    version="1.0.0",
)

# CORS — must be added first so it is the outermost middleware and
# injects Access-Control headers on every response, including 500s.
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safety-net: force CORS header on unhandled exceptions that bypass the middleware
@app.middleware("http")
async def _cors_safety(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        origin = request.headers.get("origin", "")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"},
            headers={"Access-Control-Allow-Origin": origin or "*"},
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
app.include_router(ai.router)
app.include_router(rooms.router)
app.include_router(notifications.router)
app.include_router(attendance.router)
app.include_router(floors.router)
app.include_router(layout_versions.router)
app.include_router(workspace_objects.router)
app.include_router(workspace_bookings.router)
app.include_router(layout_ws.router)

# Serve uploaded floor plan images
_upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(_upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_upload_dir), name="uploads")

@app.get("/")
def root():
    return {"message": "CoWorkOS API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}
