# HireLoop — Agent Architecture
## Deep Dive: Seeker Agent + Recruiter Agent

---

## Overview

HireLoop uses **LangGraph** to build two stateful agents:
- `SeekerAgent` — automates job hunting for candidates
- `RecruiterAgent` — automates candidate screening for hiring managers

Both agents use **Gemini 1.5 Flash** (free tier) as the LLM backbone and write every decision to SQLite for auditability.

---

## 1. SeekerAgent

### State Schema
```python
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END

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
```

### Graph Definition
```python
from langgraph.graph import StateGraph, END

def build_seeker_graph():
    graph = StateGraph(SeekerState)

    graph.add_node("parse_profile", parse_profile_node)
    graph.add_node("fetch_jobs", fetch_jobs_node)
    graph.add_node("score_jobs", score_jobs_node)
    graph.add_node("write_cover_letter", write_cover_letter_node)
    graph.add_node("await_approval", await_approval_node)   # human-in-loop
    graph.add_node("apply_job", apply_job_node)
    graph.add_node("log_activity", log_activity_node)

    graph.set_entry_point("parse_profile")
    graph.add_edge("parse_profile", "fetch_jobs")
    graph.add_edge("fetch_jobs", "score_jobs")
    graph.add_edge("score_jobs", "write_cover_letter")
    graph.add_edge("write_cover_letter", "await_approval")
    graph.add_conditional_edges(
        "await_approval",
        lambda s: "apply_job" if s["user_approved"] else END,
        {"apply_job": "apply_job", END: END}
    )
    graph.add_edge("apply_job", "log_activity")
    graph.add_edge("log_activity", END)

    return graph.compile(checkpointer=MemorySaver())
```

### Node Implementations

#### `parse_profile_node`
```python
async def parse_profile_node(state: SeekerState) -> SeekerState:
    gemini = get_gemini_client()
    
    prompt = f"""
    Extract structured information from this resume.
    Return ONLY valid JSON, no markdown.
    
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
    {state["resume_text"]}
    """
    
    response = gemini.generate_content(prompt)
    parsed = json.loads(response.text)
    
    state["parsed_profile"] = parsed
    state["activity_log"].append({
        "action": "parse_profile",
        "result": f"Extracted {len(parsed['skills'])} skills",
        "timestamp": datetime.now().isoformat()
    })
    return state
```

#### `score_jobs_node`
```python
async def score_jobs_node(state: SeekerState) -> SeekerState:
    gemini = get_gemini_client()
    scored = []
    
    for job in state["raw_jobs"]:
        prompt = f"""
        Score how well this candidate fits this job. Return ONLY JSON.
        
        Schema:
        {{
            "score": 78,
            "match_reasons": ["reason1", "reason2"],
            "gaps": ["missing skill 1"],
            "confidence": "high | medium | low",
            "recommendation": "Apply | Consider | Skip"
        }}
        
        Candidate Profile: {json.dumps(state["parsed_profile"])}
        Job Description: {job["description"]}
        """
        
        response = gemini.generate_content(prompt)
        score_data = json.loads(response.text)
        scored.append({**job, **score_data})
        time.sleep(1.5)  # rate limit safety
    
    state["scored_jobs"] = sorted(scored, key=lambda x: x["score"], reverse=True)
    return state
```

#### `write_cover_letter_node`
```python
async def write_cover_letter_node(state: SeekerState) -> SeekerState:
    gemini = get_gemini_client()
    job = next(j for j in state["scored_jobs"] if j["id"] == state["selected_job_id"])
    
    prompt = f"""
    Write a concise, genuine cover letter (max 200 words).
    Do NOT use generic phrases like "I am passionate about" or "I believe I would be".
    Make it specific to this exact job and company.
    
    Candidate: {json.dumps(state["parsed_profile"])}
    Job: {job["title"]} at {job["company"]}
    Job Description: {job["description"]}
    Key matching strengths: {job["match_reasons"]}
    """
    
    response = gemini.generate_content(prompt)
    state["cover_letter"] = response.text
    state["user_approved"] = False  # wait for human confirmation
    return state
```

#### `await_approval_node` (Human-in-Loop)
```python
async def await_approval_node(state: SeekerState) -> SeekerState:
    # This node PAUSES the graph and returns to frontend
    # Frontend shows cover letter + "Send?" confirmation
    # When user clicks Approve → graph resumes with user_approved=True
    # This is handled via LangGraph checkpointer + thread_id
    
    # The graph pauses here until resume() is called from the API
    state["activity_log"].append({
        "action": "awaiting_approval",
        "result": "Cover letter ready — waiting for user confirmation",
        "timestamp": datetime.now().isoformat()
    })
    return state
```

---

## 2. RecruiterAgent

### State Schema
```python
class RecruiterState(TypedDict):
    recruiter_id: str
    job_post_id: str
    jd_text: str
    parsed_requirements: dict      # {required_skills, nice_to_have, experience_min}
    candidates: List[dict]         # raw applications
    screened_candidates: List[dict] # with screen_score + breakdown
    ranked_candidates: List[dict]   # sorted, flagged
    questions_generated: dict       # {candidate_id: [q1, q2, q3]}
    recruiter_overrides: dict       # {candidate_id: {new_rank, notes}}
    pipeline_updates: List[dict]
    activity_log: List[dict]
```

### Graph Definition
```python
def build_recruiter_graph():
    graph = StateGraph(RecruiterState)

    graph.add_node("parse_jd", parse_jd_node)
    graph.add_node("screen_candidates", screen_candidates_node)
    graph.add_node("rank_candidates", rank_candidates_node)
    graph.add_node("generate_questions", generate_questions_node)
    graph.add_node("apply_overrides", apply_overrides_node)  # human-in-loop
    graph.add_node("update_pipeline", update_pipeline_node)

    graph.set_entry_point("parse_jd")
    graph.add_edge("parse_jd", "screen_candidates")
    graph.add_edge("screen_candidates", "rank_candidates")
    graph.add_edge("rank_candidates", "generate_questions")
    graph.add_edge("generate_questions", "apply_overrides")
    graph.add_edge("apply_overrides", "update_pipeline")
    graph.add_edge("update_pipeline", END)

    return graph.compile(checkpointer=MemorySaver())
```

### Node Implementations

#### `parse_jd_node`
```python
async def parse_jd_node(state: RecruiterState) -> RecruiterState:
    gemini = get_gemini_client()
    
    prompt = f"""
    Parse this job description into structured requirements. Return ONLY JSON.
    
    Schema:
    {{
        "required_skills": ["Python", "React"],
        "nice_to_have": ["Docker", "AWS"],
        "experience_min_years": 2,
        "education_requirement": "B.Tech or equivalent",
        "role_type": "IC | Manager | Hybrid",
        "key_responsibilities": ["responsibility1"],
        "culture_signals": ["fast-paced", "ownership-driven"]
    }}
    
    JD: {state["jd_text"]}
    """
    
    response = gemini.generate_content(prompt)
    state["parsed_requirements"] = json.loads(response.text)
    return state
```

#### `screen_candidates_node`
```python
async def screen_candidates_node(state: RecruiterState) -> RecruiterState:
    gemini = get_gemini_client()
    screened = []
    
    for candidate in state["candidates"]:
        prompt = f"""
        Screen this candidate against the job requirements. Return ONLY JSON.
        
        Schema:
        {{
            "screen_score": 84,
            "skills_match": {{"matched": ["Python"], "missing": ["Docker"]}},
            "experience_match": "strong | partial | weak",
            "red_flags": ["gap in employment 2023"],
            "green_flags": ["shipped production AI systems"],
            "interview_recommendation": "Strongly Recommend | Recommend | Maybe | Pass",
            "reasoning": "2-sentence explanation"
        }}
        
        Requirements: {json.dumps(state["parsed_requirements"])}
        Candidate Resume: {candidate["resume_text"]}
        """
        
        response = gemini.generate_content(prompt)
        screen_data = json.loads(response.text)
        screened.append({**candidate, **screen_data})
        time.sleep(1.5)
    
    state["screened_candidates"] = screened
    return state
```

#### `generate_questions_node`
```python
async def generate_questions_node(state: RecruiterState) -> RecruiterState:
    gemini = get_gemini_client()
    top_candidates = state["ranked_candidates"][:10]  # only top 10
    questions = {}
    
    for c in top_candidates:
        prompt = f"""
        Generate exactly 3 screening questions for this candidate for this role.
        Questions should be specific to their background and the role — not generic HR questions.
        Return ONLY JSON array: ["question1", "question2", "question3"]
        
        Role: {state["parsed_requirements"]["key_responsibilities"]}
        Candidate strengths: {c["green_flags"]}
        Candidate gaps: {c["skills_match"]["missing"]}
        """
        
        response = gemini.generate_content(prompt)
        questions[c["id"]] = json.loads(response.text)
        time.sleep(1.5)
    
    state["questions_generated"] = questions
    return state
```

---

## 3. FastAPI Routes

```python
# seeker routes
POST   /api/seeker/upload-resume       # triggers parse_profile
GET    /api/seeker/jobs                # fetch scored jobs
POST   /api/seeker/generate-cover-letter  # triggers write_cover_letter
POST   /api/seeker/approve-application    # resumes graph after approval
GET    /api/seeker/activity-feed          # SSE stream of agent logs

# recruiter routes
POST   /api/recruiter/post-job          # triggers parse_jd
GET    /api/recruiter/candidates/:job_id  # get ranked candidates
POST   /api/recruiter/override          # apply human override
GET    /api/recruiter/questions/:candidate_id
GET    /api/recruiter/pipeline/:job_id
```

---

## 4. Agent Activity Feed (SSE)

```python
from fastapi.responses import StreamingResponse
import asyncio

@router.get("/seeker/activity-feed/{user_id}")
async def activity_feed(user_id: str):
    async def event_generator():
        while True:
            logs = db.get_recent_logs(user_id, limit=5)
            for log in logs:
                yield f"data: {json.dumps(log)}\n\n"
            await asyncio.sleep(2)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

Frontend subscribes:
```typescript
const source = new EventSource(`/api/seeker/activity-feed/${userId}`);
source.onmessage = (e) => {
    const log = JSON.parse(e.data);
    setActivityFeed(prev => [log, ...prev]);
};
```

---

## 5. Gemini Key Rotation Utility

```python
# utils/gemini_client.py
import google.generativeai as genai
import os, time
from itertools import cycle

KEYS = [k for k in [
    os.getenv("GEMINI_KEY_1"),
    os.getenv("GEMINI_KEY_2"),
    os.getenv("GEMINI_KEY_3"),
] if k]

key_cycle = cycle(KEYS)

def get_gemini_client():
    key = next(key_cycle)
    genai.configure(api_key=key)
    return genai.GenerativeModel(
        'gemini-1.5-flash',
        generation_config={"temperature": 0.3, "max_output_tokens": 1000}
    )

def safe_generate(prompt: str, retries=3) -> str:
    for attempt in range(retries):
        try:
            client = get_gemini_client()
            response = client.generate_content(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e):
                time.sleep(5 * (attempt + 1))  # exponential backoff
            else:
                raise e
    raise Exception("All Gemini keys exhausted")
```

---

## 6. Human-in-Loop Checkpoints Summary

| Checkpoint | Side | What happens | How to resume |
|---|---|---|---|
| Cover letter approval | Seeker | Agent pauses, shows letter | User clicks "Send" |
| Job application confirm | Seeker | Shows job details + cover | User confirms |
| Candidate override | Recruiter | Agent ranking shown | Recruiter drags/edits |
| Questions review | Recruiter | 3 Qs shown before sending | Recruiter approves/edits |
| Pipeline stage change | Recruiter | Agent suggests move | Recruiter clicks confirm |

---

## 7. Running Locally (Antigravity)

```bash
# Backend
cd backend
pip install fastapi uvicorn langgraph langchain-google-genai python-multipart
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Test seeker agent
curl -X POST http://localhost:8000/api/seeker/upload-resume \
  -F "file=@resume.pdf" \
  -F "user_id=test_user_1"
```

---

## 8. Things to NOT over-engineer (stay lean)

- ❌ No real job board API needed — use Gemini web grounding or mock 20 jobs
- ❌ No email sending needed — just show questions in UI
- ❌ No payment/subscription — it's a portfolio project
- ❌ No real OAuth with job boards — mock the applier
- ✅ Focus on agent transparency UX — that's the differentiator
- ✅ Make the activity feed feel alive — that's the demo wow moment
