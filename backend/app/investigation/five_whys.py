def normalize_whys(answers: list[str]) -> list[str]:
    """Keep the worksheet's five prompts explicit without declaring a root cause."""
    return [(answers[index].strip() if index < len(answers) else "") for index in range(5)]
