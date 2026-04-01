from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json

from agents.recruiter_agent import recruiter_agent, RecruiterState
from db.database import get_recent_logs

router = APIRouter()

class JobPostRequest(BaseModel):
    recruiter_id: str
    job_post_id: str
    jd_text: str
    # In reality, this would be fetched from DB. Mocking passing candidates.
    mock_candidates: list = []

@router.post("/post-job")
async def post_job(request: JobPostRequest, background_tasks: BackgroundTasks):
    initial_state = {
        "recruiter_id": request.recruiter_id,
        "job_post_id": request.job_post_id,
        "jd_text": request.jd_text,
        "candidates": request.mock_candidates,
        "activity_log": [],
        "recruiter_overrides": {}
    }
    
    config = {"configurable": {"thread_id": request.job_post_id}}
    
    background_tasks.add_task(recruiter_agent.invoke, initial_state, config)
    return {"message": "Recruiter ranking pipeline started", "job_id": request.job_post_id}

@router.get("/candidates/{job_post_id}")
async def get_candidates(job_post_id: str):
    config = {"configurable": {"thread_id": job_post_id}}
    state = recruiter_agent.get_state(config)
    if not state or not state.values:
        return {"ranked_candidates": [], "questions_generated": {}}
    return {
        "ranked_candidates": state.values.get("ranked_candidates", []),
        "questions_generated": state.values.get("questions_generated", {})
    }

class OverrideRequest(BaseModel):
    job_post_id: str
    decision: dict

@router.post("/override")
async def apply_override(request: OverrideRequest, background_tasks: BackgroundTasks):
    config = {"configurable": {"thread_id": request.job_post_id}}
    background_tasks.add_task(recruiter_agent.invoke, {"recruiter_overrides": request.decision}, config)
    return {"status": "Override applied. Pipeline updated."}

@router.get("/activity-feed/{recruiter_id}")
async def recruiter_activity_feed(recruiter_id: str):
    async def event_generator():
        last_seen = []
        while True:
            # Poll DB for logs
            logs = get_recent_logs(recruiter_id, limit=5)
            new_logs = [log for log in logs if log not in last_seen]
            
            for log in new_logs:
                yield f"data: {json.dumps(log)}\n\n"
            
            last_seen = logs
            await asyncio.sleep(2)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
