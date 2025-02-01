from dotenv import load_dotenv
load_dotenv()  # Load environment variables immediately

from fastapi import FastAPI
from app.api.endpoints import router
import os
import openai

app = FastAPI(title="Query Optimizer API")

# Set the API key from the environment
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise Exception("OPENAI_API_KEY not set in environment variables!")
openai.api_key = api_key

# Include the API router with prefix "/api"
app.include_router(router, prefix="/api")

@app.get("/")
async def home():
    return {"message": "API is running"}

@app.get("/test")
async def test_endpoint():
    return {"message": "Test successful"}

