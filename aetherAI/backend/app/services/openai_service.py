import openai
from app.core.config import config

def refine_query(user_query: str) -> str:
    if not user_query:
        return "No input provided"

    openai.api_key = config.OPENAI_API_KEY

    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[{"role": "user", "content": f"Refine this search query: {user_query}"}]
    )

    return response["choices"][0]["message"]["content"]
