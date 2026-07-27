import os
import uuid
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import HF_TOKEN, HF_EMBEDDING_MODEL

# Persistent storage directory for local Qdrant
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "qdrant_db"))
os.makedirs(DATA_DIR, exist_ok=True)

QDRANT_URL = os.getenv("QDRANT_URL", "").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip()
COLLECTION_NAME = "research_docs"
VECTOR_SIZE = 384  # Standard size for MiniLM / bge-small-en-v1.5

class CloudEmbedder:
    """
    Encodes text into 384-dimensional dense vectors using Hugging Face Cloud Inference API.
    Lightweight, fast, and eliminates heavy local PyTorch / SentenceTransformers dependencies.
    """
    def __init__(self, hf_token: str, model_name: str):
        self.hf_token = hf_token if (hf_token and not hf_token.startswith("your_")) else None
        self.model_name = model_name or "BAAI/bge-small-en-v1.5"

    def encode(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        if not self.hf_token:
            print("[RAG Qdrant] Warning: No HF_TOKEN provided for cloud embeddings.")
            return []

        try:
            url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{self.model_name}"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            response = requests.post(url, headers=headers, json={"inputs": texts}, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    if isinstance(data[0], list) and isinstance(data[0][0], float):
                        return data
                    elif isinstance(data[0], list) and isinstance(data[0][0], list):
                        # Mean pooling over token embeddings
                        pooled = []
                        for doc_tokens in data:
                            dim = len(doc_tokens[0])
                            avg = [sum(doc_tokens[i][d] for i in range(len(doc_tokens))) / len(doc_tokens) for d in range(dim)]
                            pooled.append(avg)
                        return pooled
            else:
                print(f"[RAG Qdrant] Hugging Face Cloud API error ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"[RAG Qdrant] Hugging Face Cloud API request failed: {e}")

        return []

# Initialize Embedder
embedder = CloudEmbedder(hf_token=HF_TOKEN, model_name=HF_EMBEDDING_MODEL)

# Initialize Qdrant Client (Remote Cloud if URL provided, else Local Disk)
def get_qdrant_client() -> QdrantClient:
    if QDRANT_URL:
        print(f"[RAG Qdrant] Connecting to remote Qdrant cluster at {QDRANT_URL}")
        return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY if QDRANT_API_KEY else None)
    else:
        print(f"[RAG Qdrant] Initializing local persistent Qdrant at {DATA_DIR}")
        return QdrantClient(path=DATA_DIR)

client = get_qdrant_client()

def ensure_collection_exists():
    try:
        if not client.collection_exists(COLLECTION_NAME):
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
            )
            print(f"[RAG Qdrant] Created collection '{COLLECTION_NAME}'.")
    except Exception as e:
        print(f"[RAG Qdrant] Error checking/creating collection: {e}")

ensure_collection_exists()

def ingest_document_text(filename: str, text: str) -> int:
    """
    Splits document text into chunks, generates cloud vector embeddings, and indexes them into Qdrant.
    """
    if not text or not text.strip():
        return 0

    ensure_collection_exists()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    if not chunks:
        return 0

    embeddings = embedder.encode(chunks)
    if not embeddings:
        print(f"[RAG Qdrant] Could not generate embeddings for '{filename}'. Check HF_TOKEN.")
        return 0

    points = []
    for idx, (chunk, vector) in enumerate(zip(chunks, embeddings)):
        point_id = str(uuid.uuid4())
        payload = {
            "source": filename,
            "chunk_index": idx,
            "text": chunk
        }
        points.append(PointStruct(id=point_id, vector=vector, payload=payload))

    client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"[RAG Qdrant] Successfully indexed {len(chunks)} chunks from '{filename}'.")
    return len(chunks)

def query_documents(query: str, top_k: int = 4) -> list[str]:
    """
    Queries Qdrant for matching text chunks and returns formatted context strings.
    """
    if not query or not query.strip():
        return []

    ensure_collection_exists()

    query_vectors = embedder.encode([query])
    if not query_vectors:
        return []

    query_vector = query_vectors[0]

    try:
        if hasattr(client, "search"):
            hits = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=top_k
            )
        else:
            res = client.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                limit=top_k
            )
            hits = res.points if hasattr(res, "points") else []

        extracted_chunks = []
        for hit in hits:
            payload = hit.payload or {}
            source = payload.get("source", "Uploaded Document")
            text = payload.get("text", "")
            if text:
                extracted_chunks.append(f"[Document Source: {source}]\n{text}")

        return extracted_chunks
    except Exception as e:
        print(f"[RAG Qdrant] Query execution failed: {e}")
        return []

def list_indexed_documents() -> list[str]:
    """
    Returns a list of unique document filenames currently indexed in Qdrant.
    """
    ensure_collection_exists()
    try:
        records, _ = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=10000,
            with_payload=True,
            with_vectors=False
        )
        sources = set()
        for record in records:
            if record.payload and "source" in record.payload:
                sources.add(record.payload["source"])
        return sorted(list(sources))
    except Exception as e:
        print(f"[RAG Qdrant] Error listing documents: {e}")
        return []

def clear_indexed_documents() -> bool:
    """
    Deletes and recreates the Qdrant collection to clear all indexed knowledge documents.
    """
    try:
        client.delete_collection(collection_name=COLLECTION_NAME)
    except Exception as e:
        print(f"[RAG Qdrant] Note on deleting collection: {e}")
    
    ensure_collection_exists()
    return True
