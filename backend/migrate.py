"""
Run once to add new columns to existing tables in Supabase.
Usage: python migrate.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine
from sqlalchemy import text

migrations = [
    # Visitor: purpose + qr_token columns
    "ALTER TABLE visitors ADD COLUMN IF NOT EXISTS purpose VARCHAR(255)",
    "ALTER TABLE visitors ADD COLUMN IF NOT EXISTS qr_token VARCHAR(100)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_visitors_qr_token ON visitors (qr_token)",

    # Invoice new columns
    "ALTER TABLE invoices ALTER COLUMN client_id DROP NOT NULL",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name VARCHAR(255)",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(100)",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ",

    # Seat reserved status (enum update)
    "ALTER TYPE seatstatusenum ADD VALUE IF NOT EXISTS 'reserved'",

    # Payment & Subscription tables (create if not exist)
    """
    CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id),
        amount FLOAT NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_date TIMESTAMPTZ,
        payment_method VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES users(id),
        plan_type VARCHAR(50) DEFAULT 'hot_desk',
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        amount FLOAT DEFAULT 0.0,
        branch_id INTEGER REFERENCES branches(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
    """,
]

print("🔧 Running migrations...")
with engine.begin() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql.strip()))
            print(f"  ✅ {sql.strip()[:60]}...")
        except Exception as e:
            print(f"  ⚠️  Skipped (already exists?): {e}")

print("\n✅ Migration complete!")
