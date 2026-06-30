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

/* Chat */
.stChatMessage{
    border-radius:20px;
    padding:12px;
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
    st.title("🐍 PyTutor AI")

    st.markdown("---")

    st.markdown("### 📚 Knowledge Base")
    st.write("Official Python Tutorial")

    st.markdown("### 🤖 LLM")
    st.write("Llama 3.3 70B (Groq)")

    st.markdown("### 🔍 Embeddings")
    st.write("all-MiniLM-L6-v2")

    st.markdown("### 🗂 Vector Store")
    st.write("ChromaDB")

    st.markdown("---")

    if st.button("🗑 Clear Chat"):
        st.session_state.messages = []
        st.rerun()

# -------------------- Title --------------------
st.title("🐍 PyTutor AI")
st.caption("Python RAG Assistant powered by LangChain + ChromaDB + Groq")

# -------------------- Chat History --------------------
if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# -------------------- User Input --------------------
if prompt := st.chat_input("Ask a Python question..."):

    st.session_state.messages.append(
        {
            "role": "user",
            "content": prompt
        }
    )

    with st.chat_message("user"):
        st.markdown(prompt)

    # Build conversation history
    history_text = ""

    for msg in st.session_state.messages[:-1]:
        history_text += f'{msg["role"]}: {msg["content"]}\n'

    # Retrieve context
    docs = retriever.invoke(prompt)
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

    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            response = llm.invoke(final_prompt)

            answer = response.content

            st.markdown(answer)

    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": answer
        }
    )
