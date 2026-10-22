from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Incident
from app.schemas import Payload

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def incident_dict(incident: Incident):
    return {
        "id": incident.id, "title": incident.title, "incident_type": incident.incident_type,
        "status": incident.status, "occurred_at": incident.occurred_at, "location": incident.location,
        "description": incident.description, "immediate_actions": incident.immediate_actions,
        "reporter": incident.reporter,
        "timeline": [{"id": x.id, "occurred_at": x.occurred_at, "event": x.event, "source": x.source} for x in incident.timeline],
        "evidence": [{"id": x.id, "evidence_type": x.evidence_type, "label": x.label, "details": x.details, "url": x.url, "recorded_by": x.recorded_by} for x in incident.evidence],
        "factors": [{"id": x.id, "category": x.category, "rationale": x.rationale} for x in incident.factors],
        "rca": ({"what_happened": incident.rca.what_happened, "how_happened": incident.rca.how_happened,
                 "why_happened": incident.rca.why_happened, "correction": incident.rca.correction,
                 "five_whys": incident.rca.five_whys, "fishbone": incident.rca.fishbone,
                 "reviewed_by": incident.rca.reviewed_by} if incident.rca else None),
        "actions": [{"id": x.id, "title": x.title, "source": x.source, "root_cause": x.root_cause, "owner": x.owner,
                 "due_date": x.due_date, "priority": x.priority, "detail": x.detail, "interim_controls": x.interim_controls, "status": x.status,
                     "review_result": x.review_result, "reviewer": x.reviewer} for x in incident.actions],
        "talks": [{"id": x.id, "title": x.title, "delivered_at": x.delivered_at, "facilitator": x.facilitator,
                   "content": x.content, "attendees": x.attendees, "understanding_check": x.understanding_check} for x in incident.talks],
    }


@router.get("")
def list_incidents(db: Session = Depends(get_db)):
    return [incident_dict(x) for x in db.query(Incident).order_by(Incident.created_at.desc()).all()]


@router.post("", status_code=201)
def create_incident(payload: Payload, db: Session = Depends(get_db)):
    values = payload.model_dump()
    if isinstance(values.get("occurred_at"), str):
        values["occurred_at"] = datetime.fromisoformat(values["occurred_at"].replace("Z", "+00:00")) if values["occurred_at"] else None
    incident = Incident(**{key: values[key] for key in ("title", "incident_type", "status", "occurred_at", "location", "description", "immediate_actions", "reporter") if key in values})
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident_dict(incident)


@router.get("/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident_dict(incident)
