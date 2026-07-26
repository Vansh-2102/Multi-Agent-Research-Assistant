from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.graph.workflow import research_graph

app = FastAPI(
    title="Multi-Agent Research Assistant API",
    description="Core Python AI engine powered by FastAPI, LangGraph, Groq, and DuckDuckGo Search",
    version="1.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    topic: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/run-research")
def run_research(request: ResearchRequest):
    if not request.topic or not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic field cannot be empty.")
    
    initial_state = {
        "topic": request.topic,
        "plan": "",
        "research_data": [],
        "draft": "",
        "reviewer_feedback": "",
        "revision_count": 0,
        "final_report": ""
    }

    try:
        result = research_graph.invoke(initial_state)
        final_report = result.get("final_report") or result.get("draft", "")
        return {
            "topic": request.topic,
            "report": final_report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research workflow execution failed: {str(e)}")
