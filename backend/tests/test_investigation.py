from app.investigation.effectiveness import can_close_action
from app.investigation.factor_taxonomy import FACTOR_CATEGORIES, OSHA_RCA_QUESTIONS
from app.investigation.five_whys import normalize_whys


def test_five_whys_always_returns_five_prompts():
    assert normalize_whys(["A", "B"]) == ["A", "B", "", "", ""]


def test_factor_taxonomy_and_osha_questions_are_explicit():
    assert len(FACTOR_CATEGORIES) == 6
    assert len(OSHA_RCA_QUESTIONS) == 4


def test_action_requires_completed_distinct_review_and_result():
    assert not can_close_action(status="open", review_result="Effective", reviewer="Sam", owner="Taylor")
    assert not can_close_action(status="completed", review_result="Effective", reviewer="Taylor", owner="Taylor")
    assert not can_close_action(status="completed", review_result="", reviewer="Sam", owner="Taylor")
    assert can_close_action(status="completed", review_result="Effective; no recurrence", reviewer="Sam", owner="Taylor")
