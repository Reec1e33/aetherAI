from fastapi import APIRouter, Request
from app.services.openai_service import refine_query

router = APIRouter()

@router.post("/api/refine-query")
async def refine(request: Request):
    data = await request.json()
    return {"refined_query": refine_query(data.get("query", ""))}

