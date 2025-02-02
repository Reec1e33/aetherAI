from dotenv import load_dotenv
load_dotenv()  # Load environment variables immediately

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
import os
import openai

# Initialize FastAPI app
app = FastAPI(title="Query Optimizer API")

# Load API key from environment
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise Exception("OPENAI_API_KEY not set in environment variables!")
openai.api_key = api_key

# ✅ Add CORS Middleware BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router with prefix "/api"
app.include_router(router, prefix="/api")

# Test endpoints
@app.get("/")
async def home():
    return {"message": "API is running"}

@app.get("/test")
async def test_endpoint():
    return {"message": "Test successful"}

