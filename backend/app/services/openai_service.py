import openai
from app.core.config import config

# Initialize OpenAI client
client = openai.OpenAI(api_key=config.OPENAI_API_KEY)

def refine_query(user_query: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an assistant that improves user queries for maximum effectiveness. "
                        "Your goal is to make the query more detailed, specific, and informative, while keeping it focused on the original intent. "
                        "Expand the query with relevant details, keywords, and context to ensure a high-quality response. "
                        "Do NOT ask follow-up questions. Simply return a refined and more complete version of the original query."
                    )
                },
                {
                    "role": "user",
                    "content": f"Refine this query: {user_query}"
                }
            ]
        )

        return response.choices[0].message.content

    except openai.AuthenticationError:
        raise Exception("Invalid OpenAI API key. Check your environment variables.")

    except openai.RateLimitError:
        raise Exception("Rate limit exceeded. Try again later.")

    except openai.OpenAIError as e:
        raise Exception(f"OpenAI API error: {str(e)}")

    except Exception as e:
        raise Exception(f"Unexpected error: {str(e)}")

