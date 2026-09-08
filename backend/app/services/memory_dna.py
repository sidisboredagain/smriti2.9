from app.services.ai_game_generator import extract_memory_facts


def build_memory_dna(memory: dict) -> dict:
    content = memory.get("content", "")

    facts = extract_memory_facts(content)

    dna = {
        "memory_id": memory.get("id"),
        "title": memory.get("title"),
        "facts": facts,
        "people": [],
        "relationships": [],
        "places": [],
        "events": [],
        "activities": [],
    }

    for fact in facts:
        fact_type = fact["type"]
        value = fact["value"]

        if fact_type == "person":
            dna["people"].append(value)

        elif fact_type == "relationship":
            dna["relationships"].append(value)

        elif fact_type == "location":
            dna["places"].append(value)

        elif fact_type == "event":
            dna["events"].append(value)

        elif fact_type == "activity":
            dna["activities"].append(value)

    return dna