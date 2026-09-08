from app.services.game_generator import generate_game_from_memory


memory = {
    "id": 1,
    "title": "Family Wedding",
    "content": "My daughter got married in Jaipur in 1998.",
    "difficulty": "medium"
}


print("Difficulty being sent:", memory.get("difficulty"))

game = generate_game_from_memory(memory)

print(game)