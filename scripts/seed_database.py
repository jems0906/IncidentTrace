"""Load the worked fictional near-miss investigation into the configured database."""
from datetime import date, datetime
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT / "backend")
sys.path.insert(0, str(ROOT / "backend"))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import Evidence, Factor, Incident, PreventiveAction, RCA, TimelineEvent, ToolboxTalk  # noqa: E402


def seed():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        existing = session.query(Incident).filter_by(title="Pallet shifted at east dispatch bay").first()
        if existing:
            action = next((item for item in existing.actions if item.title == "Revise pallet acceptance criteria and verify checks at dispatch"), None)
            if action:
                if not action.source or action.source == "Incident investigation":
                    action.source = "INC-NEARMISS-EAST-DISPATCH"
                if not action.priority or action.priority == "Medium":
                    action.priority = "High"
                action.detail = action.detail or "Independent review sampled 24 checks across three shifts; acceptance criteria were applied and damaged pallets quarantined."
                session.commit()
            print(f"Demo investigation already exists (id={existing.id}).")
            return

        incident = Incident(
            title="Pallet shifted at east dispatch bay",
            incident_type="Near miss",
            status="Closed",
            occurred_at=datetime.fromisoformat("2026-09-18T08:42:00"),
            location="East dispatch bay, Northstar Distribution Centre",
            reporter="Jordan Lee",
            description="During morning dispatch, a pallet moved approximately 20 cm while being raised from a floor-level stack. The load remained on the forks and no one was injured. A picker was outside the marked exclusion zone. The operator stopped the truck and reported the near miss.",
            immediate_actions="Truck parked with forks lowered; bay isolated; pallet and adjacent loads checked for damage; dispatch paused pending a competent load-stability check.",
        )
        session.add(incident)
        session.flush()

        timeline = [
            ("08:34", "Dispatch team begins loading; floor-level pallet staged at east bay.", "Shift handover interview; dispatch plan"),
            ("08:39", "Operator approaches the pallet and raises the forks to lift the load.", "Operator interview; vehicle telematics"),
            ("08:42", "Pallet shifts about 20 cm on the forks; operator stops. No contact or injury.", "Operator and picker interviews; bay camera 08:42"),
            ("08:46", "Truck parked, load lowered, and bay temporarily isolated.", "Supervisor log; scene photo"),
            ("09:18", "Competent check finds two damaged lower boards and mixed pallet footprints; dispatch resumes with inspected pallets only.", "Load inspection record; pallet photographs"),
        ]
        for time, event, source in timeline:
            session.add(TimelineEvent(incident_id=incident.id, occurred_at=datetime.fromisoformat(f"2026-09-18T{time}:00"), event=event, source=source))

        evidence = [
            ("Interview", "Forklift operator interview", "Operator stopped immediately after noticing lateral movement; pre-use visual check did not expose underside board damage.", "Jordan Lee"),
            ("Interview", "Picker interview", "Picker confirmed the exclusion zone was clear and described the shift direction and approximate distance.", "Jordan Lee"),
            ("Photo", "Pallet underside and damaged boards", "Two lower boards were split; images recorded during the competent inspection.", "Priya Shah"),
            ("Document", "Vehicle telematics excerpt", "Confirms approach and stop sequence at approximately 08:42.", "Jordan Lee"),
            ("Procedure", "Dispatch pallet inspection procedure", "Procedure required a visual check but did not define criteria for concealed underside damage or mixed footprints.", "Priya Shah"),
            ("Document", "Bay camera review note", "Confirms pallet movement and that no person was within the exclusion area.", "Jordan Lee"),
        ]
        for kind, label, details, author in evidence:
            session.add(Evidence(incident_id=incident.id, evidence_type=kind, label=label, details=details, recorded_by=author))

        factors = [
            ("Equipment / material", "Inspection found two damaged lower boards and mixed pallet footprints; the concealed underside condition was not visible in the routine pre-use view."),
            ("Procedures", "The written check did not define rejection criteria for underside board damage or mixed footprints, and did not specify a safe inspection method."),
            ("Task", "A floor-level lift was attempted before a documented load-stability check for the damaged pallet."),
        ]
        for category, rationale in factors:
            session.add(Factor(incident_id=incident.id, category=category, rationale=rationale))

        session.add(RCA(
            incident_id=incident.id,
            what_happened="A pallet shifted approximately 20 cm while being raised at the east dispatch bay. The operator stopped; the load remained on the forks and nobody was injured.",
            how_happened="The load was lifted from a pallet with split lower boards and mixed footprints. The pallet moved laterally as the forks took the load.",
            why_happened="The damage was on the underside, outside the normal pre-use sightline. The inspection procedure lacked rejection criteria for concealed board damage and mixed footprints, and no separate stability check was required before lifting.",
            correction="Revise pallet acceptance criteria and inspection method; quarantine damaged pallets; introduce a pre-lift stability check for suspect loads; verify the revised controls in the dispatch bay after implementation.",
            five_whys=[
                "The pallet shifted during lifting.",
                "Two damaged lower boards and mixed footprints reduced support and load stability.",
                "The underside damage was not identified before the lift.",
                "The usual visual check did not expose concealed underside damage and the procedure did not define a safe inspection method.",
                "Pallet acceptance and dispatch planning did not include clear criteria or verification for this condition.",
            ],
            fishbone={
                "Task": "Floor-level lift proceeded without a documented stability check for a suspect pallet.",
                "Equipment / material": "Two split lower boards; mixed pallet footprints.",
                "Environment": "Lower boards were not visible from the normal pre-use inspection position.",
                "Supervision": "Dispatch targets did not include a pause point for pallet condition escalation.",
                "Training": "No specific refresher on rejection criteria for concealed pallet damage was recorded.",
                "Procedures": "Acceptance criteria and safe inspection method for underside defects were not defined.",
            },
            reviewed_by="Priya Shah",
        ))

        session.add(PreventiveAction(
            incident_id=incident.id,
            title="Revise pallet acceptance criteria and verify checks at dispatch",
            source="INC-NEARMISS-EAST-DISPATCH",
            root_cause="Pallet acceptance criteria did not cover concealed underside board damage or mixed footprints, so an unstable pallet reached dispatch.",
            owner="Evan Brooks",
            due_date=date(2026, 9, 25),
            priority="High",
            detail="Independent review sampled 24 checks across three shifts; acceptance criteria were applied and damaged pallets quarantined.",
            interim_controls="Damaged pallets quarantined; dispatchers use a two-person underside check for suspect loads; shift supervisor verifies the check log.",
            status="Closed",
            review_result="Independent review on 2026-10-02 sampled 24 pallet checks across three shifts. Rejection criteria were applied consistently, damaged pallets were quarantined, and no pallet movement or recurrence was observed during the review period. Continue monthly sampling for one quarter.",
            reviewer="Priya Shah",
        ))
        session.add(ToolboxTalk(
            incident_id=incident.id,
            title="Stable loads: pause, check, and reset",
            delivered_at=datetime.fromisoformat("2026-09-19T06:45:00"),
            facilitator="Priya Shah",
            content="Near miss: a pallet shifted during lifting at the east dispatch bay. Inspection found damaged lower boards and mixed pallet footprints. Before lifting, check pallet condition and load stability; use the marked exclusion zone; stop and lower the load if it shifts; isolate and report damaged pallets. Crew discussion: what conditions would make you pause a lift?",
            attendees=["Jordan Lee", "Mina Patel", "Evan Brooks", "Luis Romero", "Sam Chen"],
            understanding_check="What would you do if a pallet shifts while being lifted?",
        ))
        session.commit()
        print(f"Seeded fully worked near-miss investigation (id={incident.id}).")


if __name__ == "__main__":
    seed()
