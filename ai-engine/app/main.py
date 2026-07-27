import io
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.graph.workflow import research_graph
from app.rag.store import ingest_document_text, list_indexed_documents, clear_indexed_documents
from pypdf import PdfReader

app = FastAPI(
    title="Multi-Agent Research Assistant API",
    description="Core Python AI engine powered by FastAPI, LangGraph, Groq, Qdrant, and DuckDuckGo Search",
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

@app.get("/indexed-docs")
def get_indexed_docs():
    return {"documents": list_indexed_documents()}

@app.delete("/clear-docs")
def clear_docs():
    try:
        clear_indexed_documents()
        return {
            "status": "success",
            "message": "Successfully cleared all indexed knowledge documents from Qdrant.",
            "indexed_documents": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear document index: {str(e)}")


@app.post("/upload-doc")
async def upload_document(file: UploadFile = File(...)):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    filename = file.filename
    contents = await file.read()
    
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    extracted_text = ""
    try:
        if filename.lower().endswith(".pdf"):
            pdf_file = io.BytesIO(contents)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        else:
            extracted_text = contents.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read/parse document '{filename}': {str(e)}")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail=f"Could not extract any text from '{filename}'.")

    try:
        chunks_count = ingest_document_text(filename, extracted_text)
        return {
            "status": "success",
            "filename": filename,
            "chunks_ingested": chunks_count,
            "indexed_documents": list_indexed_documents(),
            "message": f"Successfully indexed '{filename}' into vector store ({chunks_count} text chunks)."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index document in vector store: {str(e)}")

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

