import logging
from fastapi import APIRouter, HTTPException, Request
from app.services.openai_service import refine_query

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Add prefix so routes are properly nested under "/api"
router = APIRouter()

@router.post("/refine-query")  # ✅ Ensure this matches API path
async def refine(request: Request):
    try:
        data = await request.json()
        user_query = data.get("query", "").strip()

        if not user_query:
            raise HTTPException(status_code=400, detail="Query cannot be empty.")

        # Log request
        logger.info(f"Received query: {user_query}")

        # Refine the query
        refined_query = refine_query(user_query)

        # Log response
        logger.info(f"Refined query: {refined_query}")

        return {"refined_query": refined_query}

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

