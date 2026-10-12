import streamlit as st
import requests
import time

# ---------------------- PAGE CONFIG ----------------------
st.set_page_config(
    page_title="PyTutor AI",
    page_icon="🐍",
    layout="wide"
)

# ---------------------- CUSTOM CSS ----------------------
st.markdown("""
<style>
/* Prevent header overlap with browser bar */
header[data-testid="stHeader"] {
    background-color: rgba(10, 13, 20, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    z-index: 99999 !important;
}

.block-container {
    padding-top: 4.5rem !important;
    padding-bottom: 2rem !important;
}

.stChatMessage {
    border-radius: 15px;
}

h1 {
    color: #2E8B57;
}

.footer {
    text-align: center;
    color: gray;
    margin-top: 30px;
}
</style>
""", unsafe_allow_html=True)

# ---------------------- SIDEBAR ----------------------
with st.sidebar:

    st.title("📚 PyTutor AI")

    st.markdown("---")

    st.subheader("Knowledge Base")
    st.success("Official Python Tutorial")

    st.subheader("LLM")
    st.info("openai/gpt-oss-120b")

    st.subheader("Embedding Model")
    st.info("all-MiniLM-L6-v2")

    st.subheader("Vector Database")
    st.info("ChromaDB")

    st.subheader("Framework")
    st.info("FastAPI + LangChain")

    st.markdown("---")

    st.subheader("💡 Example Questions")

    st.markdown("""
- What is Python?
- Explain inheritance.
- Define class.
- What is polymorphism?
- Explain list.
- What is exception handling?
""")

    st.markdown("---")

    if st.button("🗑 Clear Chat"):
        st.session_state.messages = []
        st.rerun()

# ---------------------- TITLE ----------------------

st.title("🐍 PyTutor AI")

st.caption(
    "Your Python RAG Assistant powered by LangChain, ChromaDB and Groq"
)

st.write(
    "Ask questions about Python using the **Official Python Tutorial**."
)

# ---------------------- SESSION ----------------------

if "messages" not in st.session_state:
    st.session_state.messages = []

# ---------------------- DISPLAY CHAT ----------------------

for msg in st.session_state.messages:

    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# ---------------------- USER INPUT ----------------------

question = st.chat_input("Ask your Python question...")

if question:

    st.session_state.messages.append(
        {
            "role": "user",
            "content": question
        }
    )

    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant"):

        start = time.time()

        with st.spinner("Thinking..."):

            try:

                response = requests.post(
                    "http://127.0.0.1:8000/predict",
                    json={
                       "query": question,
                       "history": st.session_state.messages
                     }
                )

                end = time.time()

                if response.status_code == 200:

                    res_data = response.json()
                    answer = res_data["answer"]
                    st.markdown(answer)

                    # Enterprise metrics display
                    meta_badges = [f"⏱ {end-start:.2f}s"]
                    if res_data.get("cached"):
                        meta_badges.append("⚡ Cached (0 tokens)")
                    elif res_data.get("fast_route"):
                        meta_badges.append("🛡️ Guardrail Fast-Path (0 tokens)")

                    tokens_meta = res_data.get("tokens")
                    if tokens_meta and tokens_meta.get("total_tokens", 0) > 0:
                        saved_str = f" | -{tokens_meta['tokens_saved']} saved" if tokens_meta.get("tokens_saved") else ""
                        meta_badges.append(f"🪙 {tokens_meta['total_tokens']} tokens{saved_str}")

                    st.caption(" • ".join(meta_badges))

                    st.session_state.messages.append(
                        {
                            "role": "assistant",
                            "content": answer
                        }
                    )

                else:

                    st.error(
                        response.json()["detail"]
                    )

            except Exception:

                st.error(
                    "❌ Unable to connect to the FastAPI backend.\n\n"
                    "Please make sure your API server is running."
                )

# ---------------------- FOOTER ----------------------

st.markdown("---")

st.markdown(
    "<div class='footer'>🚀 Built with FastAPI • LangChain • ChromaDB • Groq • Streamlit</div>",
    unsafe_allow_html=True
)