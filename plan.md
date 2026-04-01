# HireLoop — Agentic Hiring Platform
## Full Build Plan (Zero to Production)

> **Stack**: Next.js 14 · FastAPI · LangGraph · Gemini API (free tier) · SQLite → PostgreSQL · TailwindCSS · Shadcn/UI
> **IDE**: Antigravity + OpenCode
> **Timeline**: 4 weeks (part-time sprint)

---

## 1. Vision

HireLoop is a **two-sided agentic hiring platform**:
- **Job Seekers** get an AI agent that finds jobs, scores fit, writes cover letters, and applies — with full transparency into every action.
- **Recruiters** get an AI agent that screens candidates, ranks them, asks follow-up questions, and surfaces the best — with human-override at every step.

The core UX thesis: **"AI does the grunt work. Humans make the calls."**

---

## 2. User Personas

### Persona A — Arjun (Job Seeker)
- 2025 grad, applying to 30+ jobs/day
- Frustrated by copy-paste cover letters and ATS black holes
- Wants: fast applications, real feedback, know where he stands

### Persona B — Priya (Recruiter / Hiring Manager)
- Receives 200+ applications per role
- Wants to find signal in noise fast
- Wants: ranked candidates, smart filters, no bias, audit trail

---

## 3. Core Features

### Job Seeker Side
| Feature | Description |
|---|---|
| Profile Builder | Upload resume → agent extracts skills, projects, experience |
| Job Discovery | Agent searches jobs (Gemini + web scraping) based on profile |
| Fit Scoring | Each job gets a 0–100 match score with breakdown |
| Cover Letter Generator | Gemini writes tailored cover letter per job |
| Application Tracker | Kanban board: Discovered → Applied → Screening → Interview → Offer |
| Agent Activity Feed | Live feed of what the agent is doing right now |
| Nudge System | Agent flags stale applications, suggests follow-ups |

### Recruiter Side
| Feature | Description |
|---|---|
| Job Post Manager | Create JD → agent extracts required skills, weights them |
| Candidate Inbox | All applicants auto-screened and ranked by agent |
| Score Card | Per-candidate breakdown: skills match, experience, soft signals |
| AI Interviewer | Agent sends 3 async screening questions to candidates |
| Override Panel | Recruiter can override agent ranking, add notes, change status |
| Pipeline Dashboard | Funnel view: Applied → Screened → Shortlisted → Hired |
| Audit Log | Every agent action is logged and explainable |

---

## 4. Agent Architecture

### Seeker Agent (`seeker_agent`)
```
User Profile → [Profile Parser] → [Job Fetcher] → [Fit Scorer] → [Cover Letter Writer] → [Applier]
                                        ↕
                               [Activity Logger]
```

**Nodes (LangGraph)**:
1. `parse_profile` — extract skills/exp from resume text via Gemini
2. `fetch_jobs` — search jobs via Gemini web grounding or mock data
3. `score_fit` — structured output: `{score, reasons, missing_skills}`
4. `write_cover_letter` — Gemini generates, user can edit before send
5. `apply_job` — dry_run default, real mode with confirmation
6. `log_activity` — writes every action to SQLite

### Recruiter Agent (`recruiter_agent`)
```
Job Description → [JD Parser] → [Candidate Screener] → [Ranker] → [Question Generator]
                                          ↕
                                  [Override Handler]
```

**Nodes (LangGraph)**:
1. `parse_jd` — extract required + nice-to-have skills, culture signals
2. `screen_candidate` — compare resume vs JD, score 0–100
3. `rank_batch` — sort all candidates, flag top 10%
4. `generate_questions` — 3 tailored screening Qs per candidate
5. `handle_override` — recruiter input updates agent weights
6. `log_decision` — every ranking decision is stored with reasoning

---

## 5. Database Schema (SQLite → Postgres)

```sql
-- Users
users (id, email, role [seeker|recruiter], created_at)

-- Seeker
profiles (id, user_id, raw_resume, parsed_skills[], experience_years, summary)
job_listings (id, title, company, jd_text, url, source, scraped_at)
applications (id, seeker_id, job_id, status, fit_score, cover_letter, applied_at)
agent_logs (id, user_id, action_type, payload, timestamp)

-- Recruiter
job_posts (id, recruiter_id, title, jd_text, required_skills[], status)
candidates (id, job_post_id, seeker_id, screen_score, rank, questions_sent, recruiter_notes, status)
pipeline_stages (id, candidate_id, stage, changed_by [agent|human], changed_at)
```

---

## 6. Tech Stack (Detailed)

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR, easy deploy to Vercel |
| Styling | TailwindCSS + Shadcn/UI | Fast, consistent, accessible |
| Backend | FastAPI | Async, easy LangGraph integration |
| Agent Framework | LangGraph | State machines, human-in-loop built-in |
| LLM | Gemini 1.5 Flash (free tier) | Generous quota, fast |
| DB | SQLite (dev) → Neon PostgreSQL (prod) | Zero setup locally |
| Auth | Clerk (free tier) | Role-based, fast setup |
| Deploy | Vercel (frontend) + Render/Railway (backend) | Free tiers |
| State | Zustand (frontend agent state) | Lightweight |

---

## 7. Gemini API Usage Plan (Free Tier Safe)

- Use `gemini-1.5-flash` everywhere (not Pro) — 1500 req/day free
- Batch cover letter generation (not real-time per keystroke)
- Cache job scores — don't re-score same job+resume combo
- Key rotation: use 2–3 free Google accounts, rotate via env vars
- Rate limit wrapper: `time.sleep(2)` between Gemini calls in agents

```python
GEMINI_KEYS = [os.getenv("GEMINI_KEY_1"), os.getenv("GEMINI_KEY_2")]
current_key_index = 0

def get_gemini_client():
    global current_key_index
    key = GEMINI_KEYS[current_key_index % len(GEMINI_KEYS)]
    current_key_index += 1
    return genai.GenerativeModel('gemini-1.5-flash', ...)
```

---

## 8. Project Folder Structure

```
hireloop/
├── frontend/                   # Next.js 14
│   ├── app/
│   │   ├── (auth)/             # login, signup
│   │   ├── seeker/             # seeker dashboard
│   │   │   ├── dashboard/
│   │   │   ├── jobs/
│   │   │   ├── applications/
│   │   │   └── agent-feed/
│   │   └── recruiter/          # recruiter dashboard
│   │       ├── dashboard/
│   │       ├── pipeline/
│   │       ├── candidates/
│   │       └── settings/
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── seeker/
│   │   └── recruiter/
│   └── lib/
│       ├── api.ts              # FastAPI client
│       └── store.ts            # Zustand stores
│
├── backend/                    # FastAPI
│   ├── main.py
│   ├── agents/
│   │   ├── seeker_agent.py     # LangGraph seeker graph
│   │   └── recruiter_agent.py  # LangGraph recruiter graph
│   ├── routers/
│   │   ├── seeker.py
│   │   └── recruiter.py
│   ├── models/
│   │   └── schemas.py
│   ├── db/
│   │   └── database.py
│   └── utils/
│       └── gemini_client.py    # Key rotation + rate limiting
│
└── README.md
```

---

## 9. Week-by-Week Build Plan

### Week 1 — Foundation
- [ ] Init Next.js + FastAPI repos
- [ ] Set up Clerk auth with seeker/recruiter roles
- [ ] DB schema + SQLite setup
- [ ] Build profile upload + resume parser (Gemini)
- [ ] Build basic job listing CRUD

### Week 2 — Seeker Agent
- [ ] Build `seeker_agent` LangGraph graph (all 5 nodes)
- [ ] Fit scoring with structured Gemini output
- [ ] Cover letter generator with edit-before-send UX
- [ ] Application tracker Kanban UI
- [ ] Agent Activity Feed (WebSocket or polling)

### Week 3 — Recruiter Agent
- [ ] Build `recruiter_agent` LangGraph graph
- [ ] Candidate screening + ranking pipeline
- [ ] Recruiter pipeline dashboard
- [ ] Override panel + audit log UI
- [ ] Async screening questions flow

### Week 4 — Polish + Deploy
- [ ] Connect both sides (seeker applies → recruiter receives)
- [ ] End-to-end flow test
- [ ] Deploy: Vercel + Render
- [ ] Record demo video (Loom)
- [ ] Add to portfolio + LinkedIn post

---

## 10. Key UX Decisions (Agentic Design Principles)

1. **Always show agent reasoning** — every score shows WHY (not just 72/100)
2. **Confirm before irreversible actions** — applying to a job always asks "Send?"
3. **Undo within 5 minutes** — agent actions can be cancelled
4. **Human-in-loop checkpoints** — recruiter can pause agent at any stage
5. **Confidence indicators** — agent shows "high / medium / low" confidence
6. **Audit trail** — every agent decision is logged with timestamp + reason

---

## 11. Portfolio Positioning

This project proves:
- **Agentic AI** — LangGraph multi-node agents with real tool use
- **Full-Stack** — Next.js + FastAPI end-to-end
- **UX Thinking** — Human-in-loop design, not just "AI slapped on"
- **Product Sense** — Two-sided marketplace, real user personas
- **Shipping** — Live Vercel deploy, working demo

**Case study title**: *"Designing for Trust in Agentic AI — HireLoop"*

---

## 12. Environment Variables Needed

```env
# Backend
GEMINI_KEY_1=your_key_1
GEMINI_KEY_2=your_key_2
DATABASE_URL=sqlite:///./hireloop.db
SECRET_KEY=your_jwt_secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

## 13. remeber one thing the whole project will be reviewed by codex , claudecode and many high level agents so work correctly and make it bug free and also make it production ready 

