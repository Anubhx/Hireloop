from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import seeker, recruiter

app = FastAPI(title="HireLoop Agent API", version="1.0.0")

# Allow frontend NEXT.js access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(seeker.router, prefix="/api/seeker", tags=["Seeker Agent"])
app.include_router(recruiter.router, prefix="/api/recruiter", tags=["Recruiter Agent"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
