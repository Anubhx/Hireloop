import json
import time
from datetime import datetime
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# Local imports
from utils.gemini_client import safe_generate
from db.database import log_agent_activity

class SeekerState(TypedDict):
    user_id: str
    resume_text: str
    parsed_profile: dict          # {skills, experience, summary, education}
    job_query: str                # "Software Engineer Bangalore"
    raw_jobs: List[dict]          # fetched job listings
    scored_jobs: List[dict]       # jobs with fit_score + reasons
    selected_job_id: str          # job user wants to apply to
    cover_letter: str             # generated cover letter
    user_approved: bool           # human-in-loop checkpoint
    application_status: str       # dry_run | submitted | failed
    activity_log: List[dict]      # every action with timestamp
    error: Optional[str]

# --- Nodes ---

def parse_profile_node(state: SeekerState) -> SeekerState:
    prompt = f"""
    Extract structured information from this resume.
    Return ONLY valid JSON, no markdown formatting.
    
    Schema:
    {{
        "skills": ["skill1", "skill2"],
        "experience_years": 2,
        "current_role": "Software Engineer",
        "education": "B.Tech CSE",
        "summary": "2-line professional summary",
        "languages": ["Python", "JavaScript"],
        "tools": ["React", "FastAPI", "Docker"]
    }}
    
    Resume:
    {state.get("resume_text", "")}
    """
    
    response_text = safe_generate(prompt)
    try:
        # Strip potential markdown backticks
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean_json)
    except Exception as e:
        parsed = {"error": "Failed to parse JSON", "raw": response_text}

    state["parsed_profile"] = parsed
    log_entry = {
        "action": "parse_profile",
        "result": f"Extracted {len(parsed.get('skills', []))} skills",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["user_id"], log_entry["action"], log_entry["result"])
    return state

def fetch_jobs_node(state: SeekerState) -> SeekerState:
    # MOCK implementation for safety/speed. In reality, you'd scrape LinkedIn/Indeed.
    mock_jobs = [
        {
            "id": "job_1",
            "title": "Backend Python Engineer",
            "company": "TechNova",
            "description": "Looking for a backend engineer skilled in FastAPI, LangGraph, and Python. Minimum 2 years experience."
        },
        {
            "id": "job_2",
            "title": "Frontend React Dev",
            "company": "PixelCorp",
            "description": "React, Next.js, Tailwind CSS developer. 1 year experience."
        }
    ]
    state["raw_jobs"] = mock_jobs
    
    log_entry = {
        "action": "fetch_jobs",
        "result": f"Found {len(mock_jobs)} potential jobs",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["user_id"], log_entry["action"], log_entry["result"])
    return state

def score_jobs_node(state: SeekerState) -> SeekerState:
    scored = []
    
    for job in state.get("raw_jobs", []):
        prompt = f"""
        Score how well this candidate fits this job. Return ONLY valid JSON, no markdown formatting.
        
        Schema:
        {{
            "score": 78,
            "match_reasons": ["reason1", "reason2"],
            "gaps": ["missing skill 1"],
            "confidence": "high | medium | low",
            "recommendation": "Apply | Consider | Skip"
        }}
        
        Candidate Profile: {json.dumps(state.get("parsed_profile", {}))}
        Job Description: {job['description']}
        """
        
        response_text = safe_generate(prompt)
        try:
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            score_data = json.loads(clean_json)
        except:
            score_data = {"score": 0, "error": "parse_failed"}
            
        scored.append({**job, **score_data})
    
    # Sort by descending score
    state["scored_jobs"] = sorted(scored, key=lambda x: x.get("score", 0), reverse=True)
    
    log_entry = {
        "action": "score_jobs",
        "result": "Scored all target jobs against candidate profile.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["user_id"], log_entry["action"], log_entry["result"])
    return state

def write_cover_letter_node(state: SeekerState) -> SeekerState:
    selected_id = state.get("selected_job_id")
    if not selected_id:
        return state
        
    job = next((j for j in state.get("scored_jobs", []) if j["id"] == selected_id), None)
    if not job:
        return state
        
    prompt = f"""
    Write a concise, genuine cover letter (max 150 words).
    Do NOT use generic phrases like "I am passionate about" or "I believe I would be".
    Make it specific to this exact job and company.
    
    Candidate: {json.dumps(state.get("parsed_profile", {}))}
    Job: {job['title']} at {job['company']}
    Job Description: {job['description']}
    Key matching strengths: {job.get('match_reasons', [])}
    """
    
    cov_letter = safe_generate(prompt)
    state["cover_letter"] = cov_letter
    state["user_approved"] = False  # Need human approval
    
    log_entry = {
        "action": "write_cover_letter",
        "result": f"Generated cover letter for {job['company']}",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["user_id"], log_entry["action"], log_entry["result"])
    return state

def await_approval_node(state: SeekerState) -> SeekerState:
    log_entry = {
        "action": "awaiting_approval",
        "result": "Pausing execution natively. Cover letter awaiting human approval.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["user_id"], log_entry["action"], log_entry["result"])
    return state

def apply_job_node(state: SeekerState) -> SeekerState:
    state["application_status"] = "dry_run_success"
    log_entry = {
        "action": "apply_job",
        "result": "Application successfully submitted via Dry Run Agent.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["user_id"], log_entry["action"], log_entry["result"])
    return state

def log_activity_node(state: SeekerState) -> SeekerState:
    return state

# --- Build Graph ---

def build_seeker_graph():
    graph = StateGraph(SeekerState)

    graph.add_node("parse_profile", parse_profile_node)
    graph.add_node("fetch_jobs", fetch_jobs_node)
    graph.add_node("score_jobs", score_jobs_node)
    graph.add_node("write_cover_letter", write_cover_letter_node)
    graph.add_node("await_approval", await_approval_node)
    graph.add_node("apply_job", apply_job_node)
    graph.add_node("log_activity", log_activity_node)

    graph.set_entry_point("parse_profile")
    graph.add_edge("parse_profile", "fetch_jobs")
    graph.add_edge("fetch_jobs", "score_jobs")
    graph.add_edge("score_jobs", "write_cover_letter")
    graph.add_edge("write_cover_letter", "await_approval")
    
    # Conditional edge waiting for human approval toggle
    graph.add_conditional_edges(
        "await_approval",
        lambda s: "apply_job" if s.get("user_approved") else END,
        {"apply_job": "apply_job", END: END}
    )
    graph.add_edge("apply_job", "log_activity")
    graph.add_edge("log_activity", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory)

# Export pre-compiled graph
seeker_agent = build_seeker_graph()
