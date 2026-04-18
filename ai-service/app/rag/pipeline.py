"""RAG pipeline: embed documents → store in ChromaDB → retrieve + generate with Claude."""
from __future__ import annotations

import json
from typing import AsyncIterator

import chromadb
from langchain_anthropic import ChatAnthropic
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings

_SYSTEM_PROMPT = """You are Aurelia, an AI-powered personal finance advisor.
Answer the user's question using ONLY the financial context provided below.
If the context doesn't contain enough information, say so clearly.
Be concise, accurate, and helpful. Format numbers as currency when appropriate.

Context from the user's documents:
{context}"""

_CATEGORIES = [
    "Food", "Transport", "Housing", "Entertainment",
    "Healthcare", "Shopping", "Income", "Other",
]


# ── Singletons (initialised once in lifespan) ─────────────────────────────────

_chroma_client: chromadb.HttpClient | None = None
_embeddings: HuggingFaceEmbeddings | None = None
_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)


def init_rag() -> None:
    """Call once at startup to warm up the embedding model and ChromaDB connection."""
    global _chroma_client, _embeddings
    _embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )
    _chroma_client = chromadb.HttpClient(
        host=settings.chroma_host,
        port=settings.chroma_port,
    )


def _get_vector_store(user_id: str) -> Chroma:
    assert _chroma_client is not None and _embeddings is not None, "RAG not initialised"
    return Chroma(
        client=_chroma_client,
        collection_name=f"user_{user_id}_documents",
        embedding_function=_embeddings,
    )


def _make_llm(streaming: bool = False) -> ChatAnthropic:
    return ChatAnthropic(
        model=settings.claude_model,
        anthropic_api_key=settings.anthropic_api_key,
        streaming=streaming,
        max_tokens=2048,
    )


# ── Ingestion ─────────────────────────────────────────────────────────────────

def ingest_text(user_id: str, doc_id: str, text: str, source_name: str) -> int:
    """Chunk, embed, and store document text. Returns number of chunks stored."""
    chunks = _splitter.split_text(text)
    if not chunks:
        return 0

    docs = [
        Document(
            page_content=chunk,
            metadata={"doc_id": doc_id, "user_id": user_id,
                       "source": source_name, "chunk_idx": i},
        )
        for i, chunk in enumerate(chunks)
    ]
    vs = _get_vector_store(user_id)
    vs.add_documents(docs)
    return len(docs)


def delete_document_chunks(user_id: str, doc_id: str) -> None:
    """Remove all chunks belonging to a document from the vector store."""
    vs = _get_vector_store(user_id)
    try:
        vs.delete(where={"doc_id": doc_id})
    except Exception:
        pass


# ── Retrieval + Generation ─────────────────────────────────────────────────────

def _format_docs(docs: list[Document]) -> str:
    return "\n\n---\n\n".join(d.page_content for d in docs)


async def query(
    user_id: str,
    question: str,
    history: list[tuple[str, str]],
) -> tuple[str, list[dict]]:
    """Run a RAG query. Returns (answer, sources)."""
    vs = _get_vector_store(user_id)
    retriever = vs.as_retriever(search_type="similarity", search_kwargs={"k": 5})

    # Build history messages for the prompt
    history_messages = []
    for human, ai in history[-6:]:  # last 3 turns
        history_messages.append(("human", human))
        history_messages.append(("ai", ai))

    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        *history_messages,
        ("human", "{question}"),
    ])

    llm = _make_llm(streaming=False)
    chain = (
        {"context": retriever | _format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    # Fetch context docs for source citations
    context_docs = await retriever.ainvoke(question)
    answer = await chain.ainvoke(question)

    sources = [
        {
            "doc_id": d.metadata.get("doc_id"),
            "source": d.metadata.get("source"),
            "excerpt": d.page_content[:200],
        }
        for d in context_docs
    ]
    return answer, sources


async def stream_query(
    user_id: str,
    question: str,
    history: list[tuple[str, str]],
) -> AsyncIterator[str]:
    """Stream tokens from the RAG chain as SSE data lines."""
    vs = _get_vector_store(user_id)
    retriever = vs.as_retriever(search_type="similarity", search_kwargs={"k": 5})

    history_messages = []
    for human, ai in history[-6:]:
        history_messages.append(("human", human))
        history_messages.append(("ai", ai))

    context_docs = await retriever.ainvoke(question)
    context_text = _format_docs(context_docs)

    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        *history_messages,
        ("human", "{question}"),
    ])

    llm = _make_llm(streaming=True)
    chain = prompt | llm | StrOutputParser()

    sources = [
        {
            "doc_id": d.metadata.get("doc_id"),
            "source": d.metadata.get("source"),
            "excerpt": d.page_content[:200],
        }
        for d in context_docs
    ]

    # First yield sources so client can display them immediately
    yield json.dumps({"type": "sources", "sources": sources})

    async for token in chain.astream({"context": context_text, "question": question}):
        yield json.dumps({"type": "token", "content": token})

    yield json.dumps({"type": "done"})
