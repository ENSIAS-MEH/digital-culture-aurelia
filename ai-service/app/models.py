"""SQLAlchemy models — mirrors the PostgreSQL schema owned by the backend."""
from sqlalchemy import (
    Boolean, Column, Date, ForeignKey, Integer,
    Numeric, String, Text, BigInteger
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
import sqlalchemy as sa
from app.db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(7))
    icon = Column(String(50))


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(100))
    file_size = Column(BigInteger)
    type = Column(String(50), nullable=False, default="unknown")
    status = Column(String(20), nullable=False, default="pending")
    error_msg = Column(Text)
    uploaded_at = Column(sa.DateTime(timezone=True))
    processed_at = Column(sa.DateTime(timezone=True))


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    txn_date = Column(Date, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(Text, nullable=False)
    merchant = Column(String(255))
    category_id = Column(Integer, ForeignKey("categories.id"))
    raw_category = Column(String(100))
    is_confirmed = Column(Boolean, nullable=False, default=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    sources = Column(JSONB)
    created_at = Column(sa.DateTime(timezone=True))


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255))
