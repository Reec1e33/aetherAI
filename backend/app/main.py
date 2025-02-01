from fastapi import FastAPI
from app.api.endpoints import router

app = FastAPI(title="Query Optimizer API")

# ✅ Ensure the API router is included
app.include_router(router, prefix="/api")

@app.get("/")
async def home():
    return {"message": "API is running"}

@app.get("/test")
async def test_endpoint():
    return {"message": "Test successful"}

