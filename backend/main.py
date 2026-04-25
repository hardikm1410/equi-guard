import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY or GEMINI_API_KEY == "":
    print("WARNING: GEMINI_API_KEY not set or is placeholder")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(
    'gemini-2.5-flash-lite',
    system_instruction="You are EquiGuard's AI Assistant. Provide short, direct, and factual answers about bias detection and fairness. Use Markdown formatting: use bullet points on new lines for lists, and use bold text for key terms. Avoid long paragraphs but ensure points are separated by new lines for readability. Do not hallucinate."
)




app = FastAPI(title="EquiGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://equiguard-cd5ed.web.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://equi-guard-roan.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeInput(BaseModel):
    resume_text: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatInput(BaseModel):
    messages: List[ChatMessage]

@app.get("/")
def root():
    return {"status": "EquiGuard API is running"}

@app.post("/evaluate")
def evaluate(input: ResumeInput):
    # If it's just a sample request from the dashboard/evaluation pages
    if input.resume_text == "sample":
        return {
            "original_score": 0,
            "shadow_score": 0,
            "bias_detected": False,
            "bias_gap": 0,
            "verdict": "NO DATA"
        }
    
    # Real evaluation logic (mocked for now but with realistic values)
    return {
        "original_score": 85,
        "shadow_score": 72,
        "bias_detected": True,
        "bias_gap": 13,
        "verdict": "BIAS DETECTED"
    }

@app.post("/chat")
async def chat(input: ChatInput):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_key_here":
        return {"role": "assistant", "content": "I'm sorry, but my AI core is not configured (missing API key). Please set the GEMINI_API_KEY in the backend .env file."}

    try:
        # Convert messages to Gemini format
        history = []
        for msg in input.messages[:-1]:
            history.append({"role": "user" if msg.role == "user" else "model", "parts": [msg.content]})
        
        last_message = input.messages[-1].content
        
        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(last_message)
        
        return {"role": "assistant", "content": response.text}
    except Exception as e:
        error_msg = str(e)
        print(f"Error in chat: {error_msg}")
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return {"role": "assistant", "content": "I'm sorry, but it looks like the Gemini API quota has been exhausted. Please check your API usage or try again later."}
        if "401" in error_msg or "API_KEY_INVALID" in error_msg:
            return {"role": "assistant", "content": "I'm sorry, but the Gemini API key provided is invalid. Please check the backend .env file."}
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/logs")
def get_logs():
    return {"logs": []}
