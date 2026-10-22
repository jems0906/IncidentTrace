from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.investigation.factor_taxonomy import FACTOR_CATEGORIES
from app.investigation.five_whys import normalize_whys
from app.models import Factor, Incident, RCA
from app.schemas import Payload

router = APIRouter(prefix="/api/incidents/{incident_id}", tags=["root-cause-analysis"])


@router.put("/rca")
def save_rca(incident_id: int, payload: Payload, db: Session = Depends(get_db)):
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    values = payload.model_dump()
    factor_rows = values.pop("factors", [])
    worksheet = incident.rca or RCA(incident_id=incident_id)
    for field in ("what_happened", "how_happened", "why_happened", "correction", "reviewed_by"):
        if field in values:
            setattr(worksheet, field, values[field])
    if "five_whys" in values:
        worksheet.five_whys = normalize_whys(values["five_whys"])
    if "fishbone" in values:
        worksheet.fishbone = values["fishbone"]
    db.add(worksheet)
    if "factors" in payload.model_dump():
        for factor in list(incident.factors):
            db.delete(factor)
        for factor in factor_rows:
            category = factor.get("category")
            if category not in FACTOR_CATEGORIES:
                raise HTTPException(status_code=422, detail=f"Invalid contributing factor category: {category}")
            db.add(Factor(incident_id=incident_id, category=category, rationale=factor["rationale"]))
    db.commit()
    db.refresh(worksheet)
    return {"what_happened": worksheet.what_happened, "how_happened": worksheet.how_happened, "why_happened": worksheet.why_happened,
            "correction": worksheet.correction, "five_whys": worksheet.five_whys, "fishbone": worksheet.fishbone,
            "reviewed_by": worksheet.reviewed_by}
