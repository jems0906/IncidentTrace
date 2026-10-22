from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Evidence, Incident, TimelineEvent
from app.schemas import Payload

router = APIRouter(prefix="/api/incidents/{incident_id}", tags=["timeline"])


def require_incident(db: Session, incident_id: int):
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("/timeline", status_code=201)
def add_timeline_event(incident_id: int, payload: Payload, db: Session = Depends(get_db)):
    require_incident(db, incident_id)
    values = payload.model_dump()
    if isinstance(values.get("occurred_at"), str):
        values["occurred_at"] = datetime.fromisoformat(values["occurred_at"].replace("Z", "+00:00"))
    event = TimelineEvent(incident_id=incident_id, occurred_at=values["occurred_at"], event=values["event"], source=values.get("source", ""))
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"id": event.id, "occurred_at": event.occurred_at, "event": event.event, "source": event.source}


@router.post("/evidence", status_code=201)
def add_evidence(incident_id: int, payload: Payload, db: Session = Depends(get_db)):
    require_incident(db, incident_id)
    values = payload.model_dump()
    evidence = Evidence(incident_id=incident_id, evidence_type=values["evidence_type"], label=values["label"], details=values.get("details", ""), url=values.get("url", ""), recorded_by=values.get("recorded_by", ""))
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return {"id": evidence.id, "evidence_type": evidence.evidence_type, "label": evidence.label}
