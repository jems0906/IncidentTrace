from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_module():
    app.dependency_overrides.clear()


def test_root_describes_api_routes():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "service": "IncidentTrace API",
        "docs": "/docs",
        "health": "/health",
    }


def test_incident_investigation_and_report_flow():
    incident_response = client.post("/api/incidents", json={
        "title": "Test near miss",
        "incident_type": "Near miss",
        "occurred_at": "2026-10-01T08:30:00",
        "location": "Test bay",
        "description": "A load shifted during a test lift.",
        "immediate_actions": "Load lowered and bay isolated.",
        "reporter": "Worker A",
    })
    assert incident_response.status_code == 201
    incident = incident_response.json()
    incident_id = incident["id"]

    timeline_response = client.post(f"/api/incidents/{incident_id}/timeline", json={
        "occurred_at": "2026-10-01T08:30:00Z",
        "event": "Load shifted during test lift.",
        "source": "Operator interview",
    })
    assert timeline_response.status_code == 201

    evidence_response = client.post(f"/api/incidents/{incident_id}/evidence", json={
        "evidence_type": "Interview", "label": "Operator interview", "details": "Load moved laterally.",
    })
    assert evidence_response.status_code == 201

    rca_response = client.put(f"/api/incidents/{incident_id}/rca", json={
        "what_happened": "The load shifted.",
        "how_happened": "A damaged pallet moved during lifting.",
        "why_happened": "The inspection criteria did not identify the damage.",
        "correction": "Define criteria and verify the inspection control.",
        "five_whys": ["Load moved", "Pallet damaged"],
        "reviewed_by": "Investigator B",
        "factors": [{"category": "Procedures", "rationale": "Inspection criteria omitted underside defects."}],
    })
    assert rca_response.status_code == 200
    assert len(rca_response.json()["five_whys"]) == 5

    action_response = client.post(f"/api/incidents/{incident_id}/actions", json={
        "title": "Update pallet checks", "owner": "Owner A", "due_date": "2026-10-15",
        "source": "INS-001", "priority": "High", "detail": "Verify rejection criteria in use.",
        "root_cause": "Inspection criteria did not cover hidden damage.",
        "interim_controls": "Quarantine suspect pallets.",
    })
    assert action_response.status_code == 201
    assert action_response.json()["source"] == "INS-001"
    assert action_response.json()["priority"] == "High"
    action_id = action_response.json()["id"]

    early_close = client.patch(f"/api/incidents/{incident_id}/actions/{action_id}", json={"status": "Closed"})
    assert early_close.status_code == 422

    completed = client.patch(f"/api/incidents/{incident_id}/actions/{action_id}", json={"status": "Completed"})
    assert completed.status_code == 200
    same_owner_review = client.patch(f"/api/incidents/{incident_id}/actions/{action_id}", json={
        "status": "Closed", "reviewer": "Owner A", "review_result": "No recurrence observed.",
    })
    assert same_owner_review.status_code == 422
    independent_review = client.patch(f"/api/incidents/{incident_id}/actions/{action_id}", json={
        "status": "Closed", "reviewer": "Reviewer B", "review_result": "Control effective; no recurrence observed.",
    })
    assert independent_review.status_code == 200

    talk_response = client.post(f"/api/incidents/{incident_id}/toolbox", json={
        "title": "Stable load check", "facilitator": "Facilitator C", "attendees": ["Worker A"],
        "understanding_check": "What would you do if a load shifts?",
    })
    assert talk_response.status_code == 201

    detail = client.get(f"/api/incidents/{incident_id}").json()
    assert len(detail["timeline"]) == 1
    assert len(detail["evidence"]) == 1
    assert detail["actions"][0]["status"] == "Closed"
    assert detail["talks"][0]["attendees"] == ["Worker A"]

    report = client.get(f"/api/incidents/{incident_id}/report.md")
    assert report.status_code == 200
    assert "Evidence timeline" in report.text
    assert "Attendance records are not a measure of demonstrated competency" in report.text

    pdf_report = client.get(f"/api/incidents/{incident_id}/report.pdf")
    assert pdf_report.status_code == 200
    assert pdf_report.headers["content-type"] == "application/pdf"
    assert pdf_report.content.startswith(b"%PDF-")


def test_invalid_factor_category_is_rejected():
    incident = client.post("/api/incidents", json={"title": "Factor test", "incident_type": "Near miss"}).json()
    response = client.put(f"/api/incidents/{incident['id']}/rca", json={
        "factors": [{"category": "Carelessness", "rationale": "Unsupported label"}],
    })
    assert response.status_code == 422
