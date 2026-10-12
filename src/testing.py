from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_chroma import Chroma

embeddings=FastEmbedEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

retriever=db.as_retriever(search_type='similarity')

query="what is python"

docs=retriever.invoke(query)

for i, doc in enumerate(docs,1):
    print(f"\nDocment {i}")
    print(doc.page_content)