import os
import chromadb
import chromadb.utils.embedding_functions as embedding_functions
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import HF_TOKEN, HF_EMBEDDING_MODEL

# Create persistent storage directory for ChromaDB
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma_db"))
os.makedirs(DATA_DIR, exist_ok=True)

class ResilientEmbeddingFunction(chromadb.EmbeddingFunction):
    """
    Tries Hugging Face Cloud Inference API first.
    If network, DNS (ConnectError), or API limits occur, seamlessly falls back to local embeddings.
    """
    def __init__(self, hf_token: str, model_name: str):
        self.local_ef = embedding_functions.DefaultEmbeddingFunction()
        self.hf_ef = None
        if hf_token and not hf_token.startswith("your_"):
            try:
                self.hf_ef = embedding_functions.HuggingFaceEmbeddingFunction(
                    api_key=hf_token,
                    model_name=model_name
                )
            except Exception as e:
                print(f"[RAG Store] Could not initialize Hugging Face API ({e}). Defaulting to local.")

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        if self.hf_ef:
            try:
                return self.hf_ef(input)
            except Exception as e:
                print(f"[RAG Store] Hugging Face Cloud API request failed ({e}). Falling back to local embeddings.")
        return self.local_ef(input)

def get_embedding_function():
    token = HF_TOKEN.strip() if (HF_TOKEN and isinstance(HF_TOKEN, str)) else ""
    if token and not token.startswith("your_"):
        print(f"[RAG Store] Initialized Resilient Hugging Face Cloud Embedding API ({HF_EMBEDDING_MODEL})")
        return ResilientEmbeddingFunction(hf_token=token, model_name=HF_EMBEDDING_MODEL)
    print("[RAG Store] No HF_TOKEN set. Using local ChromaDB embedding model (all-MiniLM-L6-v2).")
    return embedding_functions.DefaultEmbeddingFunction()

# Initialize Chroma persistent client and collection
client = chromadb.PersistentClient(path=DATA_DIR)
embedding_fn = get_embedding_function()

try:
    collection = client.get_or_create_collection(
        name="research_docs",
        embedding_function=embedding_fn
    )
except ValueError as e:
    print(f"[RAG Store] Embedding function updated ({e}). Resetting collection configuration...")
    try:
        client.delete_collection(name="research_docs")
    except Exception:
        pass
    collection = client.create_collection(
        name="research_docs",
        embedding_function=embedding_fn
    )




def ingest_document_text(filename: str, text: str) -> int:
    """
    Splits document text into chunks and embeds/indexes them into persistent ChromaDB.
    """
    if not text or not text.strip():
        return 0

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    if not chunks:
        return 0

    documents = []
    metadatas = []
    ids = []

    for idx, chunk in enumerate(chunks):
        documents.append(chunk)
        metadatas.append({"source": filename, "chunk_index": idx})
        ids.append(f"{filename}_chunk_{idx}_{os.urandom(4).hex()}")

    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    return len(chunks)

def query_documents(query: str, top_k: int = 4) -> list[str]:
    """
    Queries vector store for matching text chunks and returns formatted context strings.
    """
    count = collection.count()
    if count == 0:
        return []

    n_results = min(top_k, count)
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )

    extracted_chunks = []
    if results and "documents" in results and results["documents"]:
        docs_list = results["documents"][0]
        meta_list = results.get("metadatas", [[]])[0] if results.get("metadatas") else []
        for i, doc in enumerate(docs_list):
            source = meta_list[i].get("source", "Uploaded Document") if (meta_list and i < len(meta_list) and meta_list[i]) else "Uploaded Document"
            extracted_chunks.append(f"[Document Source: {source}]\n{doc}")

    return extracted_chunks

def list_indexed_documents() -> list[str]:
    """
    Returns a list of unique document filenames currently indexed in ChromaDB.
    """
    count = collection.count()
    if count == 0:
        return []

    all_data = collection.get(include=["metadatas"])
    metadatas = all_data.get("metadatas", [])
    sources = set()
    for meta in metadatas:
        if meta and "source" in meta:
            sources.add(meta["source"])
    return sorted(list(sources))

def clear_indexed_documents() -> bool:
    """
    Deletes and resets the persistent ChromaDB collection to clear all indexed knowledge documents.
    """
    global collection
    try:
        client.delete_collection(name="research_docs")
    except Exception:
        pass
    collection = client.create_collection(
        name="research_docs",
        embedding_function=embedding_fn
    )
    return True

