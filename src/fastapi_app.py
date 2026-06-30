import os
from dotenv import load_dotenv
import streamlit as st

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq

# -------------------- Page Config --------------------
st.set_page_config(
    page_title="PyTutor AI",
    page_icon="🐍",
    layout="wide"
)

# -------------------- Load Environment --------------------
load_dotenv()

groq_api_key = st.secrets["GROQ_API_KEY"]

if not groq_api_key:
    st.error("GROQ_API_KEY not found in .env file")
    st.stop()

# -------------------- Load Models --------------------
@st.cache_resource
def load_models():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    db = Chroma(
        persist_directory="./chroma_db",
        embedding_function=embeddings
    )

    retriever = db.as_retriever(search_type="similarity")

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=groq_api_key,
        temperature=0.2,
        max_tokens=1024
    )

    return retriever, llm


retriever, llm = load_models()

# -------------------- Custom CSS --------------------
st.markdown("""
<style>

@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

html, body, [class*="css"]{
    font-family: 'Poppins', sans-serif;
}

/* Hide Streamlit Branding */
#MainMenu {visibility:hidden;}
footer {visibility:hidden;}
header {visibility:hidden;}

/* Background */
.stApp{
    background: linear-gradient(135deg,#eef2ff,#ffffff,#e0f2fe);
    background-attachment: fixed;
}

/* Hero */
.hero{
    background: linear-gradient(135deg,#4F46E5,#06B6D4);
    padding:40px;
    border-radius:25px;
    color:white;
    text-align:center;
    margin-bottom:25px;
    box-shadow:0 15px 40px rgba(0,0,0,.15);
}

.hero h1{
    font-size:52px;
    margin-bottom:10px;
}

.hero p{
    font-size:18px;
    opacity:.95;
}

/* Dashboard Cards */
.card{
    background:rgba(255,255,255,.65);
    backdrop-filter:blur(15px);
    border-radius:18px;
    padding:22px;
    box-shadow:0 8px 25px rgba(0,0,0,.08);
    transition:.3s;
    text-align:center;
    border:1px solid rgba(255,255,255,.4);
}

.card:hover{
    transform:translateY(-6px);
    box-shadow:0 20px 40px rgba(0,0,0,.15);
}

/* Welcome Card */
.welcome{
    background:white;
    border-radius:20px;
    padding:30px;
    border-left:8px solid #4F46E5;
    box-shadow:0 8px 25px rgba(0,0,0,.08);
}

/* Sidebar */
section[data-testid="stSidebar"]{
    background:#111827;
}

section[data-testid="stSidebar"] *{
    color:white;
}

/* Buttons */
.stButton>button{
    width:100%;
    border-radius:15px;
    background:#4F46E5;
    color:white;
    border:none;
    height:45px;
    font-weight:600;
}

.stButton>button:hover{
    background:#4338CA;
}

/* Chat Messages */

.stChatMessage{
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(18px);
    border-radius:20px;
    padding:18px;
    margin-bottom:18px;
    box-shadow:0 10px 25px rgba(0,0,0,.08);
    border:1px solid rgba(255,255,255,.4);
    transition:.3s;
}

.stChatMessage:hover{
    transform:translateY(-3px);
    box-shadow:0 18px 40px rgba(0,0,0,.15);
}
/* Chat Input */

.stChatInput{
    border-radius:18px;
}

.stChatInput textarea{
    border-radius:18px !important;
    border:2px solid #dbeafe !important;
    background:#ffffff !important;
    font-size:16px !important;
}

.stChatInput textarea:focus{
    border:2px solid #4F46E5 !important;
    box-shadow:0 0 15px rgba(79,70,229,.25);
}
.stMarkdown p{
    font-size:16px;
    line-height:1.8;
}

.stMarkdown li{
    margin-bottom:6px;
}
div[data-testid="stVerticalBlock"]{
    gap:1rem;
}
[data-testid="stCaptionContainer"]{
    color:#64748b;
    font-size:14px;
}
*{
    transition:.25s;
}

/* Footer */
.footer{
    text-align:center;
    color:#6B7280;
    margin-top:40px;
    padding:15px;
}

</style>
""", unsafe_allow_html=True)

# -------------------- Sidebar --------------------
with st.sidebar:

    st.markdown(
        """
        <div style="text-align:center;padding:10px;">
            <h1>🐍</h1>
            <h2 style="margin-bottom:0;">PyTutor AI</h2>
            <p style="color:#d1d5db;">
                Intelligent Python Learning Assistant
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("---")

    st.markdown("### 📚 Knowledge Base")
    st.success("Official Python Tutorial")

    st.markdown("### 🤖 LLM")
    st.info("Llama 3.3 70B Versatile")

    st.markdown("### 🧠 Embedding Model")
    st.info("sentence-transformers/all-MiniLM-L6-v2")

    st.markdown("### 🗂 Vector Database")
    st.info("ChromaDB")

    st.markdown("### ⚙ Framework")
    st.info("LangChain + Streamlit + Groq")

    st.markdown("---")

    with st.expander("💡 Example Questions", expanded=False):

        st.markdown("""
- What is Python?
- Explain classes.
- What is inheritance?
- Explain polymorphism.
- Explain generators.
- Explain decorators.
- What is exception handling?
- Explain list comprehension.
        """)

    st.markdown("---")

    with st.expander("ℹ About Project"):

        st.write("""
PyTutor AI is a Retrieval-Augmented Generation (RAG) assistant designed to help beginners learn Python using the Official Python Tutorial.

It combines:

- 📚 Official Documentation
- 🧠 HuggingFace Embeddings
- 🤖 Groq Llama 3.3
- 🗂 ChromaDB
- 🔗 LangChain
        """)

    st.markdown("---")

    if st.button("🗑 Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# -------------------- Title --------------------
# -------------------- Hero Section --------------------

st.markdown("""
<div class="hero">
    <h1>🐍 PyTutor AI</h1>
    <h3>Intelligent Python Learning Assistant</h3>

    <p>
        Ask Python programming questions using
        <b>Retrieval-Augmented Generation (RAG)</b>
        powered by the <b>Official Python Tutorial</b>.
    </p>
</div>
""", unsafe_allow_html=True)
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("""
    <div class="card">
        <h2>📚</h2>
        <h4>Knowledge Base</h4>
        <p>Official Python Tutorial</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="card">
        <h2>🤖</h2>
        <h4>LLM</h4>
        <p>Llama 3.3 70B</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="card">
        <h2>🧠</h2>
        <h4>Embeddings</h4>
        <p>all-MiniLM-L6-v2</p>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown("""
    <div class="card">
        <h2>🗂</h2>
        <h4>Vector Store</h4>
        <p>ChromaDB</p>
    </div>
    """, unsafe_allow_html=True)

st.write("")

# -------------------- Chat History --------------------

if "messages" not in st.session_state:
    st.session_state.messages = []

# Show welcome card before the first message
if len(st.session_state.messages) == 0:

    st.markdown("""
    <div class="welcome">

    <h2>👋 Welcome to <span style="color:#4F46E5;">PyTutor AI</span></h2>

    <p>
    Your intelligent Python learning assistant powered by
    <b>Retrieval-Augmented Generation (RAG)</b>.
    </p>

    <br>

    <h4>🚀 Try asking:</h4>

    <ul>
        <li>What is Python?</li>
        <li>Explain classes.</li>
        <li>What is inheritance?</li>
        <li>Explain generators.</li>
        <li>Explain decorators.</li>
        <li>What is polymorphism?</li>
    </ul>

    </div>
    """, unsafe_allow_html=True)

# Display previous chat
for message in st.session_state.messages:

    avatar = "👨‍💻" if message["role"] == "user" else "🐍"

    with st.chat_message(message["role"], avatar=avatar):
        st.markdown(message["content"])

# -------------------- User Input --------------------
if prompt := st.chat_input("Ask a Python question..."):

    st.session_state.messages.append(
        {
            "role": "user",
            "content": prompt
        }
    )

    with st.chat_message("user", avatar="👨‍💻"):
       st.markdown(prompt)

    # Build conversation history
    history_text = ""

    for msg in st.session_state.messages[:-1]:
        history_text += f'{msg["role"]}: {msg["content"]}\n'

    # Retrieve context
    # docs = retriever.invoke(prompt)
    with st.status("Retrieving relevant documents...", expanded=False) as status:

     docs = retriever.invoke(prompt)

     status.update(
        label="Knowledge Retrieved ✅",
        state="complete"
    )
    context = "\n\n".join(doc.page_content for doc in docs)

    final_prompt = f"""
You are a Python Programming Assistant.

Strict Rules (Highest Priority):

1. Answer ONLY questions related to Python programming.
2. Use ONLY the provided context to answer.
3. Before answering, determine whether the user's question is about Python.
4. If the question is NOT about Python (for example: SQL, MySQL, Oracle, DDL, DML, DBMS, Java, C, C++, HTML, CSS, JavaScript, Networking, Operating Systems, Machine Learning, or any other subject), DO NOT answer it.
5. For every non-Python question, reply EXACTLY:

Please ask questions related to Python only

6. Even if the provided context contains information about SQL, databases, DDL, DML, or any non-Python topic, NEVER use that information.
7. Ignore any retrieved document that is not about Python.
8. Do not guess or use outside knowledge.

Answer Style:
- Use simple, beginner-friendly language.
- Organize the answer using bullets or short paragraphs.
- If definitions exist in the context, explain them simply.
- Use examples from the context when available.
- Use conversation history for follow-up questions.

If the answer is not found in the Python-related context, reply EXACTLY:

I couldn't find the answer in the provided documents.

Conversation History:
{history_text}

Context:
{context}

Question:
{prompt}

Answer:
"""

    import time

with st.chat_message("assistant", avatar="🐍"):

    start_time = time.time()

    with st.spinner("🧠 Searching Python knowledge base..."):

        response = llm.invoke(final_prompt)

    end_time = time.time()

    answer = response.content

    st.markdown(answer)

    st.caption(
        f"⚡ Response generated in **{end_time-start_time:.2f} seconds**"
    )

 st.session_state.messages.append(
    {
        "role": "assistant",
        "content": answer
    }
)

# -------------------- Footer --------------------

st.markdown("---")

st.markdown("""
<div class="footer">

<h4>🐍 PyTutor AI</h4>

Built with ❤️ using

<br><br>

<b>Streamlit</b> •
<b>LangChain</b> •
<b>ChromaDB</b> •
<b>Hugging Face</b> •
<b>Groq</b>

</div>
""", unsafe_allow_html=True)
