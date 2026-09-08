from collections import defaultdict

from app.services.memory_dna import build_memory_dna


def build_patient_memory_graph(memories: list[dict]) -> dict:
    """
    Build a semantic memory graph for a patient.

    The graph is derived from the patient's existing memories.
    No additional database table is required for this version.

    Node types:
    - memory
    - person
    - family_role
    - place
    - event
    - activity

    This keeps the existing AI game fact extraction intact while
    giving the graph a cleaner semantic representation.
    """

    nodes = []
    relationships = []

    seen_nodes = set()
    seen_relationships = set()

    def add_node(node_type: str, value: str) -> str:
        clean_value = str(value).strip()

        if not clean_value:
            return ""

        node_id = f"{node_type}:{clean_value.lower()}"

        if node_id not in seen_nodes:
            seen_nodes.add(node_id)

            nodes.append(
                {
                    "id": node_id,
                    "type": node_type,
                    "value": clean_value,
                }
            )

        return node_id

    def add_relationship(
        source_id: str,
        target_id: str,
        relationship_type: str,
        memory_id: int | None = None,
    ) -> None:
        if not source_id or not target_id:
            return

        relationship_key = (
            source_id,
            target_id,
            relationship_type,
            memory_id,
        )

        if relationship_key in seen_relationships:
            return

        seen_relationships.add(relationship_key)

        relationships.append(
            {
                "source": source_id,
                "target": target_id,
                "type": relationship_type,
                "memory_id": memory_id,
            }
        )

    # ---------------------------------------------------------
    # Build memory -> fact relationships
    # ---------------------------------------------------------

    for memory in memories:
        dna = build_memory_dna(memory)

        memory_id = dna.get("memory_id")
        memory_title = dna.get("title") or f"Memory {memory_id}"

        memory_node = add_node("memory", memory_title)

        if not memory_node:
            continue

        # Real person names.
        for person in dna.get("people", []):
            person_node = add_node("person", person)

            add_relationship(
                memory_node,
                person_node,
                "mentions_person",
                memory_id,
            )

        # Family roles such as daughter, son, mother, father.
        #
        # The game generator still calls these "relationship" facts,
        # but the graph gives them a clearer semantic name.
        for family_role in dna.get("relationships", []):
            role_node = add_node(
                "family_role",
                family_role,
            )

            add_relationship(
                memory_node,
                role_node,
                "has_family_role",
                memory_id,
            )

        # Locations and places.
        for place in dna.get("places", []):
            place_node = add_node("place", place)

            add_relationship(
                memory_node,
                place_node,
                "happened_at",
                memory_id,
            )

        # Events.
        for event in dna.get("events", []):
            event_node = add_node("event", event)

            add_relationship(
                memory_node,
                event_node,
                "describes_event",
                memory_id,
            )

        # Activities and routines.
        for activity in dna.get("activities", []):
            activity_node = add_node("activity", activity)

            add_relationship(
                memory_node,
                activity_node,
                "includes_activity",
                memory_id,
            )

    # ---------------------------------------------------------
    # Cross-memory reasoning
    # ---------------------------------------------------------
    #
    # Find memories that share the same semantic fact.
    #
    # Example:
    #
    # Family Wedding -> Jaipur
    # Voice Memory   -> Jaipur
    #
    # Then:
    #
    # Family Wedding --shares_fact--> Voice Memory
    #
    # This is what will eventually allow Smriti AI to create
    # questions that combine information from multiple memories.
    # ---------------------------------------------------------

    node_to_memories = defaultdict(list)

    semantic_relationship_types = {
        "mentions_person",
        "has_family_role",
        "happened_at",
        "describes_event",
        "includes_activity",
    }

    for relationship in relationships:
        if relationship["type"] in semantic_relationship_types:
            node_to_memories[
                relationship["target"]
            ].append(
                relationship["source"]
            )

    for shared_node, connected_memories in node_to_memories.items():
        unique_memories = list(
            dict.fromkeys(connected_memories)
        )

        for index, source_memory in enumerate(
            unique_memories
        ):
            for target_memory in unique_memories[
                index + 1 :
            ]:
                add_relationship(
                    source_memory,
                    target_memory,
                    "shares_fact",
                )

    # ---------------------------------------------------------
    # Statistics
    # ---------------------------------------------------------

    memory_count = len(
        [
            node
            for node in nodes
            if node["type"] == "memory"
        ]
    )

    people_count = len(
        [
            node
            for node in nodes
            if node["type"] == "person"
        ]
    )

    family_role_count = len(
        [
            node
            for node in nodes
            if node["type"] == "family_role"
        ]
    )

    place_count = len(
        [
            node
            for node in nodes
            if node["type"] == "place"
        ]
    )

    event_count = len(
        [
            node
            for node in nodes
            if node["type"] == "event"
        ]
    )

    activity_count = len(
        [
            node
            for node in nodes
            if node["type"] == "activity"
        ]
    )

    return {
        "nodes": nodes,
        "relationships": relationships,
        "stats": {
            "memory_count": memory_count,
            "people_count": people_count,

            # New semantic name.
            "family_role_count": family_role_count,

            # Kept for frontend compatibility with the existing
            # dashboard until we update its wording.
            "relationship_count": family_role_count,

            "place_count": place_count,
            "event_count": event_count,
            "activity_count": activity_count,
            "connection_count": len(relationships),
        },
    }