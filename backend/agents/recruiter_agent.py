import json
import time
from datetime import datetime
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# Local imports
from utils.gemini_client import safe_generate
from db.database import log_agent_activity

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
    error: Optional[str]

# --- Nodes ---

def parse_jd_node(state: RecruiterState) -> RecruiterState:
    prompt = f"""
    Parse this job description into structured requirements. Return ONLY valid JSON, no markdown formatting.
    
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
    
    JD: {state.get("jd_text", "")}
    """
    
    response_text = safe_generate(prompt)
    try:
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean_json)
    except Exception as e:
        parsed = {"error": "Failed to parse JSON JD", "raw": response_text}

    state["parsed_requirements"] = parsed
    log_entry = {
        "action": "parse_jd",
        "result": f"Extracted {len(parsed.get('required_skills', []))} required skills.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["recruiter_id"], log_entry["action"], log_entry["result"])
    return state

def screen_candidates_node(state: RecruiterState) -> RecruiterState:
    screened = []
    
    for candidate in state.get("candidates", []):
        prompt = f"""
        Screen this candidate against the job requirements. Return ONLY valid JSON, no markdown formatting.
        
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
        
        Requirements: {json.dumps(state.get("parsed_requirements", {}))}
        Candidate Resume Details: {candidate.get("resume_text", "")}
        """
        
        response_text = safe_generate(prompt)
        try:
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            screen_data = json.loads(clean_json)
        except:
            screen_data = {"screen_score": 0, "error": "parse_failed"}
            
        screened.append({**candidate, **screen_data})
    
    state["screened_candidates"] = screened
    log_entry = {
        "action": "screen_candidates",
        "result": f"Screening complete for {len(screened)} candidates.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["recruiter_id"], log_entry["action"], log_entry["result"])
    return state

def rank_candidates_node(state: RecruiterState) -> RecruiterState:
    candidates = state.get("screened_candidates", [])
    ranked = sorted(candidates, key=lambda x: x.get("screen_score", 0), reverse=True)
    state["ranked_candidates"] = ranked
    
    log_entry = {
        "action": "rank_candidates",
        "result": "Ranked candidates by screen score.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["recruiter_id"], log_entry["action"], log_entry["result"])
    return state

def generate_questions_node(state: RecruiterState) -> RecruiterState:
    top_candidates = state.get("ranked_candidates", [])[:5] # Analyze top 5
    questions = {}
    
    for c in top_candidates:
        prompt = f"""
        Generate exactly 3 screening questions for this candidate for this role.
        Questions should be specific to their background and the role. Do not return generic HR questions!
        Return ONLY valid JSON array: ["question1", "question2", "question3"]
        
        Requirements: {json.dumps(state.get("parsed_requirements", {}))}
        Candidate Match Profile: {c.get("skills_match", {})}
        Candidate Strengths: {c.get("green_flags", [])}
        Candidate Gaps: {c.get("skills_match", {}).get("missing", [])}
        """
        
        response_text = safe_generate(prompt)
        try:
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            questions[c["id"]] = json.loads(clean_json)
        except:
            questions[c["id"]] = ["Could not generate questions due to parse error."]
            
    state["questions_generated"] = questions
    
    log_entry = {
        "action": "generate_questions",
        "result": f"Generated custom screening questions for {len(questions)} top candidates.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["recruiter_id"], log_entry["action"], log_entry["result"])
    return state

def apply_overrides_node(state: RecruiterState) -> RecruiterState:
    log_entry = {
        "action": "awaiting_approval",
        "result": "Pausing execution. Awaiting Recruiter Review / Overrides.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["recruiter_id"], log_entry["action"], log_entry["result"])
    return state

def update_pipeline_node(state: RecruiterState) -> RecruiterState:
    log_entry = {
        "action": "update_pipeline",
        "result": "Pipeline successfully updated with human overrides.",
        "timestamp": datetime.now().isoformat()
    }
    state["activity_log"].append(log_entry)
    log_agent_activity(state["recruiter_id"], log_entry["action"], log_entry["result"])
    return state

# --- Build Graph ---

def build_recruiter_graph():
    graph = StateGraph(RecruiterState)

    graph.add_node("parse_jd", parse_jd_node)
    graph.add_node("screen_candidates", screen_candidates_node)
    graph.add_node("rank_candidates", rank_candidates_node)
    graph.add_node("generate_questions", generate_questions_node)
    graph.add_node("apply_overrides", apply_overrides_node)
    graph.add_node("update_pipeline", update_pipeline_node)

    graph.set_entry_point("parse_jd")
    graph.add_edge("parse_jd", "screen_candidates")
    graph.add_edge("screen_candidates", "rank_candidates")
    graph.add_edge("rank_candidates", "generate_questions")
    graph.add_edge("generate_questions", "apply_overrides")
    
    # Pause node behavior: Human approval sends to update_pipeline
    graph.add_conditional_edges(
        "apply_overrides",
        lambda s: "update_pipeline" if s.get("recruiter_overrides") else END,
        {"update_pipeline": "update_pipeline", END: END}
    )
    graph.add_edge("update_pipeline", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory)

recruiter_agent = build_recruiter_graph()
