from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

json_type = JSON().with_variant(JSONB, "postgresql")


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="Open", nullable=False)
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    location: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    immediate_actions: Mapped[str] = mapped_column(Text, default="", nullable=False)
    reporter: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    timeline: Mapped[list["TimelineEvent"]] = relationship(cascade="all, delete-orphan", order_by="TimelineEvent.occurred_at")
    evidence: Mapped[list["Evidence"]] = relationship(cascade="all, delete-orphan")
    factors: Mapped[list["Factor"]] = relationship(cascade="all, delete-orphan")
    rca: Mapped["RCA | None"] = relationship(cascade="all, delete-orphan", uselist=False)
    actions: Mapped[list["PreventiveAction"]] = relationship(cascade="all, delete-orphan")
    talks: Mapped[list["ToolboxTalk"]] = relationship(cascade="all, delete-orphan")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    event: Mapped[str] = mapped_column(String(500), nullable=False)
    source: Mapped[str] = mapped_column(String(200), default="", nullable=False)


class Evidence(Base):
    __tablename__ = "evidence"
    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    evidence_type: Mapped[str] = mapped_column(String(80), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    details: Mapped[str] = mapped_column(Text, default="", nullable=False)
    url: Mapped[str] = mapped_column(String(1000), default="", nullable=False)
    recorded_by: Mapped[str] = mapped_column(String(120), default="", nullable=False)


class Factor(Base):
    __tablename__ = "factors"
    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)


class RCA(Base):
    __tablename__ = "rca_worksheets"
    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), unique=True)
    what_happened: Mapped[str] = mapped_column(Text, default="", nullable=False)
    how_happened: Mapped[str] = mapped_column(Text, default="", nullable=False)
    why_happened: Mapped[str] = mapped_column(Text, default="", nullable=False)
    correction: Mapped[str] = mapped_column(Text, default="", nullable=False)
    five_whys: Mapped[list] = mapped_column(json_type, default=list, nullable=False)
    fishbone: Mapped[dict] = mapped_column(json_type, default=dict, nullable=False)
    reviewed_by: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PreventiveAction(Base):
    __tablename__ = "preventive_actions"
    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    source: Mapped[str] = mapped_column(String(200), default="Incident investigation", nullable=False)
    root_cause: Mapped[str] = mapped_column(Text, default="", nullable=False)
    owner: Mapped[str] = mapped_column(String(120), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)
    detail: Mapped[str] = mapped_column(Text, default="", nullable=False)
    interim_controls: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="Open", nullable=False)
    review_result: Mapped[str] = mapped_column(Text, default="", nullable=False)
    reviewer: Mapped[str] = mapped_column(String(120), default="", nullable=False)


class ToolboxTalk(Base):
    __tablename__ = "toolbox_talks"
    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    facilitator: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    attendees: Mapped[list] = mapped_column(json_type, default=list, nullable=False)
    understanding_check: Mapped[str] = mapped_column(Text, default="", nullable=False)
