from fastapi import FastAPI
from app.api.endpoints import router

app = FastAPI(title="Query Optimizer API")

# Register API routes
app.include_router(router)

@app.get("/")
def home():
    return {"message": "API is running"}

