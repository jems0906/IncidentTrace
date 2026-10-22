from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.investigation.effectiveness import can_close_action
from app.models import Incident, PreventiveAction
from app.schemas import Payload

router = APIRouter(prefix="/api/incidents/{incident_id}/actions", tags=["preventive-actions"])


@router.post("", status_code=201)
def create_action(incident_id: int, payload: Payload, db: Session = Depends(get_db)):
    if not db.get(Incident, incident_id):
        raise HTTPException(status_code=404, detail="Incident not found")
    values = payload.model_dump()
    due_date = date.fromisoformat(values["due_date"]) if values.get("due_date") else None
    action = PreventiveAction(incident_id=incident_id, title=values["title"], source=values.get("source", "Incident investigation"), root_cause=values.get("root_cause", ""), owner=values["owner"], due_date=due_date, priority=values.get("priority", "Medium"), detail=values.get("detail", ""), interim_controls=values.get("interim_controls", ""))
    db.add(action)
    db.commit()
    db.refresh(action)
    return {"id": action.id, "title": action.title, "source": action.source, "status": action.status, "owner": action.owner, "due_date": action.due_date, "priority": action.priority, "detail": action.detail}


@router.patch("/{action_id}")
def update_action(incident_id: int, action_id: int, payload: Payload, db: Session = Depends(get_db)):
    action = db.get(PreventiveAction, action_id)
    if not action or action.incident_id != incident_id:
        raise HTTPException(status_code=404, detail="Action not found")
    values = payload.model_dump()
    for key in ("title", "source", "root_cause", "owner", "priority", "detail", "interim_controls"):
        if key in values:
            setattr(action, key, values[key])
    if "due_date" in values:
        action.due_date = date.fromisoformat(values["due_date"]) if values["due_date"] else None
    if "status" in values:
        next_status = values["status"]
        if next_status.lower() == "closed" and not can_close_action(status="completed", review_result=values.get("review_result", action.review_result), reviewer=values.get("reviewer", action.reviewer), owner=action.owner):
            raise HTTPException(status_code=422, detail="A distinct reviewer must document an effectiveness result before this action can close")
        if next_status.lower() == "closed" and action.status.lower() != "completed":
            raise HTTPException(status_code=422, detail="Mark the action completed before its effectiveness review")
        action.status = next_status
    if "review_result" in values:
        action.review_result = values["review_result"]
    if "reviewer" in values:
        action.reviewer = values["reviewer"]
    db.commit()
    db.refresh(action)
    return {"id": action.id, "status": action.status, "review_result": action.review_result, "reviewer": action.reviewer}
