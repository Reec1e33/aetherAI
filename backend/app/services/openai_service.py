import openai
import math
from app.core.config import config

# Initialize OpenAI client
openai.api_key = config.OPENAI_API_KEY

def refine_query(user_query: str) -> str:
    try:
        response = openai.ChatCompletion.create(
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
        return response['choices'][0]['message']['content']

    except openai.AuthenticationError:
        raise Exception("Invalid OpenAI API key. Check your environment variables.")

    except openai.RateLimitError:
        raise Exception("Rate limit exceeded. Try again later.")

    except openai.OpenAIError as e:
        raise Exception(f"OpenAI API error: {str(e)}")

    except Exception as e:
        raise Exception(f"Unexpected error: {str(e)}")


def get_query_response(query: str) -> str:
    """
    Sends the provided query to the OpenAI API and returns the response.
    You can adjust the system prompt or messages as needed.
    """
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a knowledgeable and helpful assistant."
                },
                {
                    "role": "user",
                    "content": query
                }
            ]
        )
        return response['choices'][0]['message']['content']

    except openai.AuthenticationError:
        raise Exception("Invalid OpenAI API key. Check your environment variables.")

    except openai.RateLimitError:
        raise Exception("Rate limit exceeded. Try again later.")

    except openai.OpenAIError as e:
        raise Exception(f"OpenAI API error: {str(e)}")

    except Exception as e:
        raise Exception(f"Unexpected error: {str(e)}")


def calculate_time_saved(original_response: str, refined_response: str) -> int:
    """
    Calculates the time saved based on the response lengths.
    Logic:
      - If the refined response is at least 3 times the length of the original,
        a baseline 20 seconds is saved.
      - For every additional whole multiple beyond 3 times, add 10 seconds.
      - Otherwise, 0 seconds are saved.
    """
    original_length = len(original_response)
    refined_length = len(refined_response)

    if original_length == 0:
        return 0

    multiplier = refined_length / original_length

    if multiplier < 3:
        return 0
    else:
        additional_units = math.floor(multiplier) - 3
        return 20 + (additional_units * 10)

