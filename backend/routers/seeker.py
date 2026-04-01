from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
import io
import pypdf

from agents.seeker_agent import seeker_agent, SeekerState
from db.database import get_recent_logs

router = APIRouter()

@router.post("/upload-resume")
async def upload_resume(
    background_tasks: BackgroundTasks,
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        content = await file.read()
        
        # Check if the file is a PDF
        if file.filename and file.filename.lower().endswith('.pdf'):
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            resume_text = ""
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    resume_text += extracted + "\n"
        else:
            # Fallback to UTF-8 decoding for TXT/MD files
            resume_text = content.decode('utf-8')
            
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=400, detail="Could not read file text. Please ensure it is a valid PDF or TXT file.")
        
    initial_state = {
        "user_id": user_id,
        "resume_text": resume_text,
        "activity_log": [],
        "user_approved": False
    }
    
    config = {"configurable": {"thread_id": user_id}}
    
    # Run the graph in the background so API responds immediately
    background_tasks.add_task(seeker_agent.invoke, initial_state, config)
    
    return {"message": "Agent pipeline started", "user_id": user_id}

@router.get("/jobs/{user_id}")
async def get_jobs(user_id: str):
    config = {"configurable": {"thread_id": user_id}}
    state = seeker_agent.get_state(config)
    if not state or not state.values:
        return {"jobs": [], "scored_jobs": []}
    return {
        "scored_jobs": state.values.get("scored_jobs", []),
        "raw_jobs": state.values.get("raw_jobs", [])
    }

class CoverLetterRequest(BaseModel):
    user_id: str
    job_id: str

@router.post("/generate-cover-letter")
async def generate_cover_letter(request: CoverLetterRequest, background_tasks: BackgroundTasks):
    config = {"configurable": {"thread_id": request.user_id}}
    # Resume graph execution with selected job
    background_tasks.add_task(seeker_agent.invoke, {"selected_job_id": request.job_id}, config)
    return {"status": "Generating..."}

class ApproveRequest(BaseModel):
    user_id: str

@router.post("/approve-application")
async def approve_application(request: ApproveRequest, background_tasks: BackgroundTasks):
    config = {"configurable": {"thread_id": request.user_id}}
    # Resume graph execution towards apply_job node
    background_tasks.add_task(seeker_agent.invoke, {"user_approved": True}, config)
    return {"status": "Applying..."}

@router.get("/activity-feed/{user_id}")
async def activity_feed(user_id: str):
    async def event_generator():
        last_seen = []
        while True:
            # Poll DB for logs
            logs = get_recent_logs(user_id, limit=5)
            new_logs = [log for log in logs if log not in last_seen]
            
            for log in new_logs:
                yield f"data: {json.dumps(log)}\n\n"
            
            last_seen = logs
            await asyncio.sleep(2)  # Stream interval
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
