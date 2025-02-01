import logging
from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from app.services.openai_service import (
    refine_query,
    get_query_response,
    calculate_time_saved,
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/refine-query")
async def compare_query(request: Request):
    try:
        data = await request.json()
        user_query = data.get("query", "").strip()

        if not user_query:
            raise HTTPException(status_code=400, detail="Query cannot be empty.")

        logger.info(f"Received query: {user_query}")

        # Execute synchronous calls in a threadpool to avoid blocking
        original_response = await run_in_threadpool(get_query_response, user_query)
        logger.info(f"Original response: {original_response}")

        refined_query = await run_in_threadpool(refine_query, user_query)
        logger.info(f"Refined query: {refined_query}")

        refined_response = await run_in_threadpool(get_query_response, refined_query)
        logger.info(f"Refined response: {refined_response}")

        # Calculate the time saved metric
        time_saved = calculate_time_saved(original_response, refined_response)
        logger.info(f"Time saved: {time_saved}")

        return {
            "original_response": original_response,
            "refined_query": refined_query,
            "refined_response": refined_response,
            "time_saved": time_saved,
        }

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

