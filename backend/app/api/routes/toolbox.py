from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Incident, ToolboxTalk
from app.schemas import Payload

router = APIRouter(prefix="/api/incidents/{incident_id}/toolbox", tags=["toolbox-talks"])


@router.post("", status_code=201)
def create_talk(incident_id: int, payload: Payload, db: Session = Depends(get_db)):
    if not db.get(Incident, incident_id):
        raise HTTPException(status_code=404, detail="Incident not found")
    values = payload.model_dump()
    delivered_at = values.get("delivered_at")
    if isinstance(delivered_at, str) and delivered_at:
        delivered_at = datetime.fromisoformat(delivered_at.replace("Z", "+00:00"))
    elif not delivered_at:
        delivered_at = None
    talk = ToolboxTalk(incident_id=incident_id, title=values["title"], delivered_at=delivered_at, facilitator=values.get("facilitator", ""), content=values.get("content", ""), attendees=values.get("attendees", []), understanding_check=values.get("understanding_check", ""))
    db.add(talk)
    db.commit()
    db.refresh(talk)
    return {"id": talk.id, "title": talk.title, "delivered_at": talk.delivered_at, "attendees": talk.attendees}


@router.patch("/{talk_id}/attendance")
def update_attendance(incident_id: int, talk_id: int, payload: Payload, db: Session = Depends(get_db)):
    talk = db.get(ToolboxTalk, talk_id)
    if not talk or talk.incident_id != incident_id:
        raise HTTPException(status_code=404, detail="Toolbox talk not found")
    values = payload.model_dump()
    talk.attendees = values.get("attendees", talk.attendees)
    if "understanding_check" in values:
        talk.understanding_check = values["understanding_check"]
    db.commit()
    return {"attendees": talk.attendees, "understanding_check": talk.understanding_check, "record_type": "attendance, not demonstrated competency"}
