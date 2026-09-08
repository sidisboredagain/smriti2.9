def generate_game_from_memory(memory: dict) -> dict:
    """
    Generate a simple memory-based cognitive game.
    """
    title = memory.get("title", "Memory")
    content = memory.get("content", "")
    difficulty = memory.get("difficulty", "easy")

    # Simple location detection for our prototype
    locations = [
        "Jaipur",
        "Delhi",
        "Mumbai",
        "Chennai",
        "Kolkata",
        "Bengaluru"
    ]

    detected_location = None

    for location in locations:
        if location.lower() in content.lower():
            detected_location = location
            break

    # Game type 1: Location recall
    if detected_location:
        return {
            "game_type": "multiple_choice",
            "memory_id": memory.get("id"),
                    "question": (
            "Where did this memory take place?"
            if difficulty == "easy"
            else "Can you recall the place mentioned in this memory?"
        ),
            "options": [
                detected_location,
                "Delhi",
                "Mumbai",
                "Chennai"
            ],
            "answer": detected_location,
            "difficulty": difficulty
        }

    # Game type 2: Story completion
    # Detect a simple relationship such as father/mother/brother/sister.
    relationships = [
        "father",
        "mother",
        "brother",
        "sister",
        "son",
        "daughter",
        "friend"
    ]

    detected_relationship = None

    for relationship in relationships:
        if relationship.lower() in content.lower():
            detected_relationship = relationship
            break

    if detected_relationship:
        question = content.replace(
            detected_relationship,
            "_____",
            1
        )

        options = [
            detected_relationship,
            "mother",
            "brother",
            "friend"
        ]

        options = list(dict.fromkeys(options))

        return {
            "game_type": "story_completion",
            "memory_id": memory.get("id"),
            "question": question,
            "options": options,
            "answer": detected_relationship,
            "difficulty": difficulty
        }

    # Fallback game
    return {
        "game_type": "story_completion",
        "memory_id": memory.get("id"),
        "question": f"Complete this memory: {title}...",
        "options": [
            "I remember this",
            "I don't remember",
            "Something different happened"
        ],
        "answer": "I remember this",
        "difficulty": difficulty
    }