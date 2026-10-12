import os
import time
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from concurrent.futures import ThreadPoolExecutor

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq

from ..config import settings
from .cache_service import EnterpriseCache
from .guardrails import GuardrailEngine
from .token_optimizer import TokenOptimizer

class EnterpriseRAGEngine:
    """Enterprise RAG Engine featuring token minimization, caching, and guardrails."""

    def __init__(self):
        self.cache = EnterpriseCache(
            max_size=settings.CACHE_MAX_SIZE,
            ttl_seconds=settings.CACHE_TTL_SECONDS
        )
        self.embeddings = None
        self.db = None
        self.retriever = None
        self.llm = None
        self._executor = ThreadPoolExecutor(max_workers=4)
        self.is_initialized = False

    def initialize(self):
        """Initializes embeddings, Chroma vector store, and Groq LLM client."""
        if self.is_initialized:
            return

        # 1. Initialize HuggingFace embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL
        )

        # 2. Initialize Chroma vector store
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        self.db = Chroma(
            persist_directory=settings.CHROMA_PERSIST_DIR,
            embedding_function=self.embeddings
        )
        self.retriever = self.db.as_retriever(
            search_kwargs={"k": settings.RETRIEVAL_TOP_K}
        )

        # 3. Initialize Groq LLM client
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is missing! Please configure it in your .env file.")

        self.llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS
        )
        self.is_initialized = True

    async def _async_retrieve(self, query: str):
        """Asynchronously retrieve documents using thread executor to prevent event loop blocking."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self._executor, self.retriever.invoke, query)

    async def _async_invoke_llm(self, prompt: str):
        """Asynchronously invoke LLM."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self._executor, self.llm.invoke, prompt)

    async def query(self, user_query: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Executes query through the enterprise token-optimization pipeline.
        Steps:
        1. Guardrail check (Zero-token fast path)
        2. Cache check (Zero-token fast path)
        3. Token optimization (History pruning & context deduplication)
        4. Vector retrieval
        5. LLM execution with token budgeting
        6. Response caching & metric calculation
        """
        if not self.is_initialized:
            self.initialize()

        start_time = time.time()
        history = history or []

        # Step 1: Zero-Token Guardrail Check
        fast_route = GuardrailEngine.check_fast_routes(user_query)
        if fast_route:
            response_text, route_type = fast_route
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "answer": response_text,
                "citations": [],
                "cached": False,
                "fast_route": route_type,
                "tokens": {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "tokens_saved": 450  # Prevented full RAG prompt pipeline
                },
                "latency_ms": elapsed_ms
            }

        # Step 2: Zero-Token Response Cache Check (only for queries without extended custom history)
        if settings.CACHE_ENABLED and len(history) <= 1:
            cached_result = self.cache.get(user_query)
            if cached_result:
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                result = dict(cached_result)
                result["cached"] = True
                result["latency_ms"] = elapsed_ms
                return result

        # Step 3: Conversation History Compression
        history_text, history_tokens_saved = TokenOptimizer.compress_history(history)

        # Step 4: Vector Retrieval & Context Compression
        docs = await self._async_retrieve(user_query)
        context_text, citations, context_tokens_saved = TokenOptimizer.optimize_context(docs)

        # Step 5: Build Compact Prompt
        prompt = TokenOptimizer.build_prompt(user_query, context_text, history_text)
        prompt_tokens_est = TokenOptimizer.estimate_tokens(prompt)

        # Step 6: Invoke Groq LLM
        response = await self._async_invoke_llm(prompt)
        answer_text = response.content

        # Step 7: Calculate Actual / Estimated Tokens
        completion_tokens_est = TokenOptimizer.estimate_tokens(answer_text)
        total_tokens_saved = history_tokens_saved + context_tokens_saved + 200  # 200 baseline savings from compressed system prompt

        # Groq usage metadata if available
        if hasattr(response, "response_metadata") and "token_usage" in response.response_metadata:
            usage = response.response_metadata["token_usage"]
            prompt_tokens = usage.get("prompt_tokens", prompt_tokens_est)
            completion_tokens = usage.get("completion_tokens", completion_tokens_est)
            total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)
        else:
            prompt_tokens = prompt_tokens_est
            completion_tokens = completion_tokens_est
            total_tokens = prompt_tokens + completion_tokens

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        result_payload = {
            "answer": answer_text,
            "citations": citations,
            "cached": False,
            "fast_route": None,
            "tokens": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "tokens_saved": total_tokens_saved
            },
            "latency_ms": elapsed_ms
        }

        # Cache valid successful responses
        if settings.CACHE_ENABLED:
            self.cache.set(user_query, result_payload, tokens_saved_estimate=total_tokens)

        return result_payload

    async def stream_query(
        self, user_query: str, history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        """Streaming generator for Server-Sent Events (SSE)."""
        if not self.is_initialized:
            self.initialize()

        # Check fast routes first
        fast_route = GuardrailEngine.check_fast_routes(user_query)
        if fast_route:
            response_text, _ = fast_route
            for word in response_text.split(" "):
                yield word + " "
                await asyncio.sleep(0.01)
            return

        # Compress history & optimize context
        history = history or []
        history_text, _ = TokenOptimizer.compress_history(history)
        docs = await self._async_retrieve(user_query)
        context_text, _, _ = TokenOptimizer.optimize_context(docs)
        prompt = TokenOptimizer.build_prompt(user_query, context_text, history_text)

        # Stream chunks from Groq
        loop = asyncio.get_running_loop()
        def _get_stream():
            return self.llm.stream(prompt)

        stream = await loop.run_in_executor(self._executor, _get_stream)
        for chunk in stream:
            if hasattr(chunk, "content") and chunk.content:
                yield chunk.content

    def index_document(self, file_path: str) -> int:
        """Indexes a document with optimized chunk sizes into ChromaDB."""
        if not self.is_initialized:
            self.initialize()

        from langchain_community.document_loaders import PyPDFLoader
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        loader = PyPDFLoader(file_path)
        documents = loader.load()

        # Token-optimized chunking (500 chars with 80 overlap for high density)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=80,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = splitter.split_documents(documents)

        if chunks:
            self.db.add_documents(chunks)
            self.retriever = self.db.as_retriever(
                search_kwargs={"k": settings.RETRIEVAL_TOP_K}
            )
            # Invalidate cache on new document ingestion
            self.cache.clear()

        return len(chunks)

# Global singleton
rag_engine = EnterpriseRAGEngine()
