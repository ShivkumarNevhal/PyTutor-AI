import re
from typing import Optional, Tuple

class GuardrailEngine:
    """Zero-token intelligent guardrail and fast router."""

    # Common greetings and pleasantries
    GREETING_PATTERNS = [
        r"^(hi|hello|hey|heyy|greetings|howdy)(!|\.|\?|\s)*$",
        r"^(good\s+(morning|afternoon|evening|day))(!|\.|\?|\s)*$",
        r"^(how\s+are\s+you|hows\s+it\s+going|whats\s+up|sup)(!|\.|\?|\s)*$",
        r"^(thank\s+you|thanks|thx|thank\s+you\s+so\s+much)(!|\.|\?|\s)*$",
        r"^(bye|goodbye|see\s+you|cya)(!|\.|\?|\s)*$"
    ]

    # Introduction and identity queries
    IDENTITY_PATTERNS = [
        r".*\b(who\s+are\s+you|what\s+is\s+your\s+name|your\s+name)\b.*",
        r".*\b(give\s+me\s+(an?\s+)?introduction|give\s+introduction|introduce\s+yourself)\b.*",
        r".*\b(tell\s+me\s+about\s+yourself|about\s+you)\b.*",
        r".*\b(what\s+can\s+you\s+do|what\s+do\s+you\s+do|your\s+capabilities)\b.*",
        r".*\b(what\s+is\s+pytutor(\s+ai)?|about\s+pytutor)\b.*",
        r"^(help|intro|introduction)(!|\.|\?|\s)*$"
    ]

    # Explicit non-Python technologies when asked purely without Python context
    NON_PYTHON_KEYWORDS = [
        r"\b(mysql|oracle|postgresql|ddl|dml|dbms|sql\s+server)\b",
        r"\b(java|c\+\+|c#|php|ruby|swift|kotlin|rust|golang|dart)\b",
        r"\b(html|css|tailwind|bootstrap|angular|vue|reactjs)\b",
        r"\b(docker|kubernetes|aws\s+cloud|azure\s+devops)\b"
    ]

    # Python contextual words that allow queries even if they mention databases or tools
    PYTHON_WHITELIST_KEYWORDS = [
        r"\b(python|py|django|flask|fastapi|pandas|numpy|sqlite3|sqlalchemy|scipy|matplotlib|seaborn|pip|venv|pydantic)\b"
    ]

    GREETING_RESPONSE = (
        "Hello! 👋 Welcome to PyTutor AI Enterprise.\n\n"
        "I'm your enterprise Python programming assistant powered by token-optimized RAG. "
        "How can I help you with Python today?"
    )

    INTRODUCTION_RESPONSE = (
        "Hello! 👋 I am **PyTutor AI**, your enterprise Python programming assistant.\n\n"
        "### What I Can Do:\n"
        "- 🐍 **Answer Python Questions**: Explain core syntax, data structures, functions, OOP, decorators, and advanced concepts.\n"
        "- 📚 **Document Grounding**: Retrieve accurate answers with citations from official Python tutorial documentation.\n"
        "- 💻 **Code Debugging & Examples**: Provide clean, idiomatic Python code snippets with explanations.\n"
        "- ⚡ **Token-Optimized**: Designed for ultra-fast response latency and efficient token usage.\n\n"
        "Feel free to ask any Python question to get started!"
    )

    PLEASANTRY_RESPONSE = (
        "You're very welcome! 😊 Feel free to ask if you have any more Python questions."
    )

    NON_PYTHON_RESPONSE = "Please ask questions related to Python only."

    @classmethod
    def check_fast_routes(cls, query: str) -> Optional[Tuple[str, str]]:
        """
        Fast route checker.
        Returns (response_text, route_type) or None if query requires full RAG + LLM.
        Zero LLM tokens are consumed for matched routes.
        """
        cleaned = query.strip().lower()

        # 1. Check identity and introduction questions first
        for pattern in cls.IDENTITY_PATTERNS:
            if re.match(pattern, cleaned):
                return cls.INTRODUCTION_RESPONSE, "identity_intro_zero_token"

        # 2. Check greetings & pleasantries
        for pattern in cls.GREETING_PATTERNS:
            if re.match(pattern, cleaned):
                if any(k in cleaned for k in ["thank", "thx"]):
                    return cls.PLEASANTRY_RESPONSE, "pleasantry_zero_token"
                return cls.GREETING_RESPONSE, "greeting_zero_token"

        # 3. Check obvious non-Python queries (unless Python is explicitly mentioned)
        has_python_context = any(re.search(pat, cleaned) for pat in cls.PYTHON_WHITELIST_KEYWORDS)
        if not has_python_context:
            for pattern in cls.NON_PYTHON_KEYWORDS:
                if re.search(pattern, cleaned):
                    # Check if asking general questions about other languages or DBs
                    return cls.NON_PYTHON_RESPONSE, "guardrail_rejected_zero_token"

        return None
