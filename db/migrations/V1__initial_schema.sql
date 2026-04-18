-- Flyway migration V1 — mirrors db/init.sql for backend-managed migrations
-- This file is used when Flyway is added to the backend Maven build (Phase 2).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id    SERIAL       PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7),
    icon  VARCHAR(50)
);

INSERT INTO categories (name, color, icon) VALUES
    ('Food',          '#f59e0b', 'utensils'),
    ('Transport',     '#3b82f6', 'car'),
    ('Housing',       '#8b5cf6', 'home'),
    ('Entertainment', '#ec4899', 'tv'),
    ('Healthcare',    '#10b981', 'heart-pulse'),
    ('Shopping',      '#f97316', 'shopping-bag'),
    ('Income',        '#22c55e', 'trending-up'),
    ('Other',         '#6b7280', 'more-horizontal')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS documents (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename      VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type     VARCHAR(100),
    file_size     BIGINT,
    type          VARCHAR(50)  NOT NULL DEFAULT 'unknown',
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
    error_msg     TEXT,
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    processed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transactions (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id  UUID          REFERENCES documents(id) ON DELETE SET NULL,
    txn_date     DATE          NOT NULL,
    amount       NUMERIC(15,2) NOT NULL,
    description  TEXT          NOT NULL,
    merchant     VARCHAR(255),
    category_id  INTEGER       REFERENCES categories(id),
    raw_category VARCHAR(100),
    is_confirmed BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content    TEXT        NOT NULL,
    sources    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id    ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date    ON transactions(txn_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
