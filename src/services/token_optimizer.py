import re
from typing import List, Dict, Any, Tuple
from ..config import settings

class TokenOptimizer:
    """Enterprise token optimization, compression, and accounting engine."""

    # Compact Enterprise System Prompt (down from ~600 tokens to ~130 tokens!)
    OPTIMIZED_SYSTEM_PROMPT = (
        "You are PyTutor AI, an enterprise Python programming assistant.\n"
        "Guidelines:\n"
        "1. Identity & Scope: You are PyTutor AI. If the user asks who you are, asks for an introduction, or greets you, introduce yourself warmly as PyTutor AI. For unrelated non-Python topics (e.g. non-programming subjects, or other languages like Java/C++/SQL without Python context), reply strictly: 'Please ask questions related to Python only'.\n"
        "2. Grounding & Citations: If the provided documentation contains relevant information, ground your answer in it and cite: [Source: <filename>, Page: <page>].\n"
        "3. Fallback: If documentation does not contain the answer but the query is valid Python, provide an accurate, beginner-friendly Python explanation with clear code examples.\n"
        "4. Tone: Keep responses concise, structured (bullets/markdown code blocks), and free of unnecessary filler."
    )

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Heuristic token estimation (~4 chars = 1 token for English text & code)."""
        if not text:
            return 0
        return max(1, len(text) // 4)

    @classmethod
    def compress_history(cls, history: List[Dict[str, str]]) -> Tuple[str, int]:
        """
        Compresses conversation history using a sliding window.
        Returns (compressed_history_text, original_tokens_saved).
        """
        if not history:
            return "", 0

        # Calculate original full history token count for accounting
        raw_full_text = "\n".join(f"{m.get('role', '')}: {m.get('content', '')}" for m in history)
        original_tokens = cls.estimate_tokens(raw_full_text)

        # Retain only the last N turns
        recent_turns = history[-settings.MAX_HISTORY_TURNS:]
        compressed_lines = []

        for msg in recent_turns:
            role = msg.get("role", "user")
            content = msg.get("content", "").strip()
            # Truncate overly long individual messages
            if len(content) > settings.MAX_HISTORY_CHARS_PER_MSG:
                content = content[:settings.MAX_HISTORY_CHARS_PER_MSG] + "..."
            compressed_lines.append(f"{role}: {content}")

        compressed_text = "\n".join(compressed_lines)
        compressed_tokens = cls.estimate_tokens(compressed_text)
        tokens_saved = max(0, original_tokens - compressed_tokens)

        return compressed_text, tokens_saved

    @classmethod
    def optimize_context(cls, docs: List[Any]) -> Tuple[str, List[Dict[str, Any]], int]:
        """
        Deduplicates, extracts citations, and compresses retrieved document chunks.
        Returns (formatted_context, citations_list, tokens_saved).
        """
        formatted_chunks = []
        citations = []
        seen_texts = set()
        raw_token_count = 0

        for i, doc in enumerate(docs[:settings.RETRIEVAL_TOP_K], 1):
            raw_text = getattr(doc, "page_content", str(doc))
            raw_token_count += cls.estimate_tokens(raw_text)

            # Deduplication
            normalized_snippet = raw_text.strip()[:120].lower()
            if normalized_snippet in seen_texts:
                continue
            seen_texts.add(normalized_snippet)

            # Metadata extraction
            metadata = getattr(doc, "metadata", {})
            source = metadata.get("source", "python_tutorial.pdf")
            source_file = source.replace("\\", "/").split("/")[-1]
            page_num = metadata.get("page", metadata.get("page_label", "1"))

            citations.append({
                "source": source_file,
                "page": page_num,
                "snippet": raw_text[:150] + "..." if len(raw_text) > 150 else raw_text
            })

            # Trim chunk if longer than limit
            clean_chunk = re.sub(r'\s+', ' ', raw_text).strip()
            if len(clean_chunk) > settings.MAX_CONTEXT_CHUNK_CHARS:
                clean_chunk = clean_chunk[:settings.MAX_CONTEXT_CHUNK_CHARS] + "..."

            formatted_chunks.append(f"[{i}] ({source_file}, p.{page_num}): {clean_chunk}")

        context_text = "\n".join(formatted_chunks)
        optimized_token_count = cls.estimate_tokens(context_text)
        tokens_saved = max(0, raw_token_count - optimized_token_count)

        return context_text, citations, tokens_saved

    @classmethod
    def build_prompt(cls, query: str, context: str, history_text: str) -> str:
        """Constructs high-efficiency token-optimized prompt."""
        sections = [cls.OPTIMIZED_SYSTEM_PROMPT]
        
        if history_text:
            sections.append(f"\nRecent Context:\n{history_text}")
            
        if context:
            sections.append(f"\nDocumentation:\n{context}")
            
        sections.append(f"\nQuestion: {query}\nAnswer:")
        return "\n".join(sections)
