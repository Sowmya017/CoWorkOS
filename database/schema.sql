-- CoWorkOS Database Schema
-- PostgreSQL

CREATE DATABASE coworkos;
\c coworkos;

-- Enum Types
CREATE TYPE role_enum AS ENUM ('super_admin', 'branch_manager', 'finance_team', 'sales_team', 'receptionist', 'client');
CREATE TYPE seat_type_enum AS ENUM ('hot_desk', 'dedicated', 'private_office', 'conference');
CREATE TYPE seat_status_enum AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE lead_status_enum AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE visitor_status_enum AS ENUM ('checked_in', 'checked_out');

-- Branches
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    total_seats INTEGER DEFAULT 0,
    occupied_seats INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role role_enum NOT NULL DEFAULT 'client',
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitors
CREATE TABLE visitors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    host_name VARCHAR(255),
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ DEFAULT NOW(),
    check_out TIMESTAMPTZ,
    status visitor_status_enum DEFAULT 'checked_in'
);

-- Leads
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    source VARCHAR(100),
    status lead_status_enum DEFAULT 'new',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    priority priority_enum DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seats
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    seat_number VARCHAR(50) NOT NULL,
    type seat_type_enum DEFAULT 'hot_desk',
    price DECIMAL(10, 2) DEFAULT 0.00,
    status seat_status_enum DEFAULT 'available'
);

-- Bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    booking_status booking_status_enum DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status invoice_status_enum DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    issue_type VARCHAR(100) NOT NULL,
    description TEXT,
    priority priority_enum DEFAULT 'medium',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status ticket_status_enum DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_visitors_branch ON visitors(branch_id);
CREATE INDEX idx_visitors_checkin ON visitors(check_in);
CREATE INDEX idx_bookings_seat ON bookings(seat_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_tickets_status ON tickets(status);
