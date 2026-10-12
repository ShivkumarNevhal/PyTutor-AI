import os
import time
import uuid
import shutil
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .config import settings
from .services.rag_engine import rag_engine

# ----------------- LIFESPAN MANAGEMENT -----------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Enterprise lifespan manager for resource warmup and cleanup."""
    print("🚀 Initializing PyTutor AI Enterprise Engine...")
    try:
        rag_engine.initialize()
        print("✅ RAG Engine, Embeddings & Vector Database ready.")
    except Exception as e:
        print(f"⚠️ Warning during warmup: {e}")
    yield
    print("🛑 Shutting down PyTutor AI Enterprise...")

# ----------------- APP INITIALIZATION -----------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-grade, Token-Optimized Retrieval-Augmented Generation (RAG) Platform.",
    lifespan=lifespan
)

# ----------------- CORS CONFIGURATION -----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- ENTERPRISE MIDDLEWARE -----------------
@app.middleware("http")
async def enterprise_tracing_middleware(request: Request, call_next):
    """Injects distributed request tracing ID and records processing latency."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()
    
    response: Response = await call_next(request)
    
    process_time = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time}ms"
    return response

# ----------------- PYDANTIC SCHEMAS -----------------
class Message(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question")
    history: Optional[List[Message]] = Field(default=[], description="Previous conversation turns")

class TokenMetrics(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    tokens_saved: int

class CitationItem(BaseModel):
    source: str
    page: str | int
    snippet: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    citations: Optional[List[CitationItem]] = []
    cached: Optional[bool] = False
    fast_route: Optional[str] = None
    tokens: Optional[TokenMetrics] = None
    latency_ms: Optional[float] = None

# ----------------- API ENDPOINTS -----------------

@app.get("/")
def home():
    """System metadata and operational capabilities."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "🟢 Operational",
        "llm_model": settings.GROQ_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL,
        "vector_database": "ChromaDB (Persistent)",
        "features": {
            "token_optimization": "Active (Sliding window history + chunk deduplication + prompt compression)",
            "zero_token_guardrails": "Active (Instant greeting & off-topic fast routes)",
            "response_cache": "Active (In-memory LRU with normalized query matching)",
            "streaming_support": "Active (/predict/stream)"
        },
        "endpoints": {
            "query": "/predict (POST)",
            "stream": "/predict/stream (POST)",
            "stats": "/stats (GET)",
            "health": "/health (GET)",
            "documents": "/documents (GET)",
            "upload": "/upload (POST)"
        }
    }

@app.get("/health")
def health_check():
    """Enterprise readiness probe."""
    return {
        "status": "healthy",
        "engine_initialized": rag_engine.is_initialized,
        "cache_size": len(rag_engine.cache._cache),
        "timestamp": time.time()
    }

@app.get("/stats")
def get_metrics():
    """Token savings and cache performance metrics."""
    return {
        "cache_performance": rag_engine.cache.get_stats(),
        "token_savings_features": {
            "history_window_limit": settings.MAX_HISTORY_TURNS,
            "retrieval_k": settings.RETRIEVAL_TOP_K,
            "compressed_system_prompt_saving": "~450 tokens/request",
            "zero_token_guardrails": "Bypasses LLM for greetings & off-topic questions"
        }
    }

@app.post("/predict", response_model=QueryResponse)
async def generate_answer(payload: QueryRequest):
    """
    Enterprise RAG answer generation with token reduction, caching, and citations.
    """
    try:
        raw_history = [{"role": m.role, "content": m.content} for m in payload.history]
        result = await rag_engine.query(payload.query, raw_history)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Enterprise RAG execution error: {str(e)}"
        )

@app.post("/predict/stream")
async def stream_answer(payload: QueryRequest):
    """
    Server-Sent Events (SSE) streaming endpoint for minimal perceived latency.
    """
    try:
        raw_history = [{"role": m.role, "content": m.content} for m in payload.history]
        
        async def event_generator():
            async for token in rag_engine.stream_query(payload.query, raw_history):
                yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Streaming failed: {str(e)}"
        )

@app.get("/documents")
def get_documents():
    """List indexed PDF documents in knowledge base."""
    docs_dir = settings.DOCS_DIR
    if not os.path.exists(docs_dir):
        return {"documents": []}
    files = [f for f in os.listdir(docs_dir) if f.lower().endswith(".pdf")]
    return {"documents": files}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and dynamically index a PDF document with token-efficient chunking."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are currently supported.")
    
    try:
        docs_dir = settings.DOCS_DIR
        os.makedirs(docs_dir, exist_ok=True)
        file_path = os.path.join(docs_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        chunks_added = rag_engine.index_document(file_path)

        return {
            "status": "success",
            "filename": file.filename,
            "chunks_added": chunks_added,
            "message": f"Successfully indexed {file.filename} into knowledge base ({chunks_added} chunks)."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}"
        )