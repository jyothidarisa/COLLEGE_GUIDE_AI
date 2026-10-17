from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ChatRequest, ChatResponse
from app.services.rag import answer_student_query

router = APIRouter(tags=["AI Chatbot"])

@router.post("/chat", response_model=ChatResponse, summary="Conversational college guidance powered by RAG")
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Retrieves evidence from verified college documents and database records,
    then generates a grounded response with source citations.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Chat message cannot be empty.")
    return await answer_student_query(db, req)
