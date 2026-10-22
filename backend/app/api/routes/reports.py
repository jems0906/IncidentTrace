from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from fastapi.responses import PlainTextResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from sqlalchemy.orm import Session
from xml.sax.saxutils import escape

from app.database import get_db
from app.models import Incident

router = APIRouter(prefix="/api/incidents", tags=["reports"])


def report_lines(incident: Incident) -> list[str]:
    lines = [f"# Investigation summary: {incident.title}", "", f"**Type:** {incident.incident_type}  ", f"**Status:** {incident.status}  ", f"**Location:** {incident.location}", "", "## What happened", incident.description, "", "## Immediate actions", incident.immediate_actions, "", "## Evidence timeline"]
    lines.extend(f"- {event.occurred_at.isoformat()} — {event.event} (Source: {event.source or 'Not recorded'})" for event in incident.timeline)
    lines.extend(["", "## Contributing factors"])
    lines.extend(f"- **{factor.category}:** {factor.rationale}" for factor in incident.factors)
    if incident.rca:
        lines.extend(["", "## Investigator-reviewed analysis", f"**What happened:** {incident.rca.what_happened}", f"**How did it happen:** {incident.rca.how_happened}", f"**Why did it happen:** {incident.rca.why_happened}", f"**What needs correction:** {incident.rca.correction}", f"**Reviewed by:** {incident.rca.reviewed_by}"])
    lines.extend(["", "## Preventive actions"])
    lines.extend(f"- {action.title} — {action.status}; source: {action.source}; priority: {action.priority}; owner: {action.owner}; due: {action.due_date or 'Not set'}; verification: {action.detail or 'Not recorded'}; interim controls: {action.interim_controls or 'Not recorded'}" for action in incident.actions)
    lines.extend(["", "## Toolbox talks and lessons learned"])
    lines.extend(f"- **{talk.title}**; facilitator: {talk.facilitator}; attendance records: {len(talk.attendees)}" for talk in incident.talks)
    lines.extend(["", "Attendance records are not a measure of demonstrated competency.", ""])
    return lines


def get_incident(incident_id: int, db: Session) -> Incident:
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.get("/{incident_id}/report.md", response_class=PlainTextResponse)
def investigation_report(incident_id: int, db: Session = Depends(get_db)):
    return "\n".join(report_lines(get_incident(incident_id, db)))


@router.get("/{incident_id}/report.pdf")
def investigation_report_pdf(incident_id: int, db: Session = Depends(get_db)):
    incident = get_incident(incident_id, db)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="ReportTitle", parent=styles["Title"], textColor=colors.HexColor("#245d43"), spaceAfter=14))
    styles.add(ParagraphStyle(name="ReportHeading", parent=styles["Heading2"], textColor=colors.HexColor("#245d43"), spaceBefore=12, spaceAfter=6))
    styles.add(ParagraphStyle(name="ReportBody", parent=styles["BodyText"], leading=14, spaceAfter=5))
    story = []
    for line in report_lines(incident):
        if not line.strip():
            story.append(Spacer(1, 4))
            continue
        if line.startswith("# "):
            story.append(Paragraph(escape(line[2:]), styles["ReportTitle"]))
        elif line.startswith("## "):
            story.append(Paragraph(escape(line[3:]), styles["ReportHeading"]))
        else:
            text = escape(line).replace("**", "")
            if text.startswith("- "):
                story.append(Paragraph(text[2:], styles["ReportBody"], bulletText="-"))
            else:
                story.append(Paragraph(text, styles["ReportBody"]))
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=0.7 * inch, leftMargin=0.7 * inch, topMargin=0.65 * inch, bottomMargin=0.65 * inch, title=f"Investigation summary: {incident.title}")
    document.build(story)
    filename = f"incidenttrace-investigation-{incident.id}.pdf"
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})
