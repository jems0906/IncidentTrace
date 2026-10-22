def can_close_action(*, status: str, review_result: str | None, reviewer: str | None, owner: str | None) -> bool:
    return bool(
        status.lower() == "completed"
        and review_result
        and review_result.strip()
        and reviewer
        and reviewer.strip()
        and reviewer.strip().casefold() != (owner or "").strip().casefold()
    )
