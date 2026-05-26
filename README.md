# CoWorkOS — Coworking Space ERP & CRM Platform

A full-stack SaaS platform for managing coworking spaces, built with Next.js, FastAPI, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Database | PostgreSQL 16 |
| Auth | JWT (jose) + bcrypt |
| Charts | Recharts |

## Modules

- **Dashboard** — KPI cards, revenue charts, booking trends
- **Branches** — Multi-location management with occupancy tracking
- **Visitors** — Check-in / check-out with real-time status
- **CRM / Leads** — Sales pipeline with stage tracking
- **Seats** — Inventory management by type and status
- **Bookings** — Reservation management
- **Invoices** — Billing and payment tracking
- **Tickets** — Support and issue management
- **Users** — Team management with RBAC

## Roles

| Role | Access |
|------|--------|
| Super Admin | Full access |
| Branch Manager | Branch + operations |
| Finance Team | Invoices + reports |
| Sales Team | CRM / Leads |
| Receptionist | Visitors + bookings |
| Client | Own bookings + tickets |

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

After containers start, seed the database:
```bash
docker exec coworkos_backend python seed_data.py
```

---

### Option 2: Manual Setup

#### Database
```bash
createdb coworkos
psql coworkos < database/schema.sql
```

#### Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate  | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python seed_data.py
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@coworkos.com | admin123 |
| Branch Manager | manager@coworkos.com | manager123 |
| Receptionist | receptionist@coworkos.com | recept123 |
| Finance Team | finance@coworkos.com | finance123 |
| Sales Team | sales@coworkos.com | sales123 |
| Client | client@coworkos.com | client123 |

---

## Project Structure

```
CoWorkOS/
├── frontend/                  # Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/            # Login & Register pages
│   │   └── (dashboard)/       # Protected dashboard pages
│   ├── components/
│   │   ├── ui/                # ShadCN components
│   │   └── layout/            # Sidebar & Navbar
│   ├── contexts/              # AuthContext
│   ├── lib/                   # API client & utils
│   └── types/                 # TypeScript types
│
├── backend/                   # FastAPI
│   └── app/
│       ├── api/routes/        # 10 route modules
│       ├── core/              # Config, security, DB
│       ├── models/            # SQLAlchemy ORM models
│       └── schemas/           # Pydantic schemas
│
├── database/
│   └── schema.sql             # PostgreSQL schema
│
└── docker-compose.yml
```
