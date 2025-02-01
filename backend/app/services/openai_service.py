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


def calculate_time_saved(original_response: str, refined_response: str) -> str:
    """
    Calculates the time saved based on the response lengths and returns a formatted string.
    Example outputs:
      - "38 seconds" if under 60 seconds.
      - "1 minute 38 seconds" if 60 seconds or more.
    
    Calculation:
      - time_saved_seconds = (refined_length / original_length) * 20
    """
    original_length = len(original_response)
    refined_length = len(refined_response)
    
    if original_length == 0:
        return "0 seconds"

    # Calculate total time saved in seconds
    time_saved_seconds = (refined_length / original_length) * 20
    time_saved_seconds = round(time_saved_seconds, 2)

    # Calculate minutes and seconds components
    minutes = int(time_saved_seconds // 60)
    seconds =int( time_saved_seconds - (minutes * 60))
    
    # If seconds is a whole number, cast it to int
    if seconds.is_integer():
        seconds = int(seconds)
    
    parts = []
    if minutes > 0:
        minute_unit = "minute" if minutes == 1 else "minutes"
        parts.append(f"{minutes} {minute_unit}")
    if seconds > 0 or minutes == 0:  # always show seconds if minutes is 0
        second_unit = "second" if seconds == 1 else "seconds"
        parts.append(f"{seconds} {second_unit}")
    
    return " ".join(parts)

