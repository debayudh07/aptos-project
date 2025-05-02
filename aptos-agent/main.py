import asyncio
import os
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the agent
from agent import aptos_agent, close_event_loop

# Initialize FastAPI app
app = FastAPI(
    title="Aptos Healthcare Agent API",
    description="API for interacting with the Aptos blockchain healthcare agent",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Pydantic models for request and response
class MessageRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    response: str
    
class HealthCheckResponse(BaseModel):
    status: str
    wallet_address: Optional[str] = None

class ChatHistoryResponse(BaseModel):
    history: List[Dict[str, str]]

# The agent's details for health check
agent_name = aptos_agent.name
agent_address = None  # We'll extract this later

# Health check endpoint
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    try:
        # Extract wallet address from the agent's instructions
        import re
        address_match = re.search(r"Your wallet address is (\w+)", aptos_agent.instructions)
        wallet_address = address_match.group(1) if address_match else "Not found"
        
        return {
            "status": "online",
            "wallet_address": wallet_address
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

# Chat endpoint
@app.post("/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    try:
        response = aptos_agent.run(request.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

# Get chat history
@app.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history():
    try:
        return {"history": aptos_agent.chat_history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chat history: {str(e)}")

# Clear chat history
@app.post("/clear-history")
async def clear_chat_history():
    try:
        aptos_agent.chat_history = []
        return {"status": "Chat history cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing chat history: {str(e)}")

# Run the app
if __name__ == "__main__":
    import uvicorn
    
    # Print startup message
    print(f"\n--- Starting {agent_name} API Server ---")
    print("API will be available at http://127.0.0.1:8000")
    print("Documentation available at http://127.0.0.1:8000/docs")
    
    # Start the server
    uvicorn.run(app, host="127.0.0.1", port=8000)