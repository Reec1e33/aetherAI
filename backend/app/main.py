from fastapi import FastAPI
from app.api.endpoints import router
from dotenv import load_dotenv
import os
import openai

# Initialize the OpenAI client

app = FastAPI(title="Query Optimizer API")
load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')
openai.api_key = api_key
# ✅ Ensure the API router is included
app.include_router(router, prefix="/api")

@app.get("/")
async def home():
    return {"message": "API is running"}

@app.get("/test")
async def test_endpoint():
    return {"message": "Test successful"}

