"""
Ghost Cloner MVP — Personal IP Content Generator
=================================================
A Streamlit application that transforms rough voice memos or text notes
into polished social media posts that mimic the user's unique writing style.

Tech Stack:
  - Frontend  : Streamlit
  - AI Logic  : LangChain (LCEL)
  - LLM       : OpenAI GPT-4o
  - STT       : OpenAI Whisper-1
  - Vector DB : ChromaDB (in-memory, per-session)
"""

import os
import tempfile
import textwrap

import chromadb
import openai
import streamlit as st
from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Ghost Cloner MVP",
    page_icon="👻",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Custom CSS — subtle polish
# ---------------------------------------------------------------------------
st.markdown(
    """
    <style>
        /* Tighten sidebar padding */
        section[data-testid="stSidebar"] > div { padding-top: 1.5rem; }

        /* Output column card styling */
        .output-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 1.2rem 1.4rem;
            border: 1px solid #e0e0e0;
            margin-bottom: 0.5rem;
        }
        .platform-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 0.6rem;
        }
        .xhs-badge  { background: #ff2442; color: white; }
        .li-badge   { background: #0a66c2; color: white; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Session-state initialisation
# ---------------------------------------------------------------------------
DEFAULTS = {
    "api_key_confirmed": False,
    "style_examples": [""] * 5,
    "style_db_ready": False,
    "transcribed_text": "",
    "xhs_output": "",
    "li_output": "",
    "generation_done": False,
    "chroma_client": None,
    "vectorstore": None,
}
for key, value in DEFAULTS.items():
    if key not in st.session_state:
        st.session_state[key] = value

# ---------------------------------------------------------------------------
# Helper: build / rebuild the ChromaDB vectorstore
# ---------------------------------------------------------------------------
def build_vectorstore(api_key: str, examples: list[str]) -> Chroma:
    """
    Creates an in-memory ChromaDB collection and populates it with the
    user's style examples, using OpenAI embeddings.
    """
    client = chromadb.Client()
    # Always start fresh so re-submissions don't accumulate duplicates
    try:
        client.delete_collection("style_examples")
    except Exception:
        pass
    collection = client.get_or_create_collection("style_examples")

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=api_key,
    )
    vectorstore = Chroma(
        client=client,
        collection_name="style_examples",
        embedding_function=embeddings,
    )
    ids = [f"example_{i}" for i in range(len(examples))]
    vectorstore.add_texts(texts=examples, ids=ids)
    return vectorstore


# ---------------------------------------------------------------------------
# Helper: transcribe audio with Whisper
# ---------------------------------------------------------------------------
def transcribe_audio(api_key: str, audio_bytes: bytes, suffix: str) -> str:
    """Sends audio bytes to OpenAI Whisper-1 and returns the transcript."""
    client = openai.OpenAI(api_key=api_key)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    try:
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(model="whisper-1", file=f)
        return result.text
    finally:
        os.remove(tmp_path)


# ---------------------------------------------------------------------------
# Helper: generate content via LangChain + GPT-4o
# ---------------------------------------------------------------------------
GENERATION_PROMPT = PromptTemplate.from_template(
    textwrap.dedent(
        """
        You are a world-class social media ghostwriter. Your task is to rewrite
        the user's raw input into two distinct platform-optimised formats while
        faithfully mimicking the writing style demonstrated in the examples below.

        ═══════════════════════════════════════════════════════════
        WRITING STYLE EXAMPLES (study these carefully):
        ═══════════════════════════════════════════════════════════
        {style_examples}

        ═══════════════════════════════════════════════════════════
        USER'S RAW INPUT:
        ═══════════════════════════════════════════════════════════
        {user_input}

        ═══════════════════════════════════════════════════════════
        OUTPUT INSTRUCTIONS:
        ═══════════════════════════════════════════════════════════
        Produce exactly two sections using the XML-style tags below.
        Do NOT include any text outside these tags.

        Xiaohongshu section requirements:
        - Conversational, warm, and trendy tone
        - Use plenty of relevant emojis throughout
        - End with 5–8 popular Chinese-style hashtags (e.g. #生活 #干货分享)
        - Keep it under 500 characters

        LinkedIn section requirements:
        - Professional, insightful, and authoritative tone
        - Use a compelling hook in the first line
        - Structure with short paragraphs; may include a brief bullet list
        - End with a thought-provoking question or call-to-action
        - 150–300 words

        <XHS_OUTPUT>
        [write Xiaohongshu post here]
        </XHS_OUTPUT>

        <LI_OUTPUT>
        [write LinkedIn post here]
        </LI_OUTPUT>
        """
    )
)


def generate_content(api_key: str, user_input: str, vectorstore: Chroma) -> tuple[str, str]:
    """
    Retrieves the top-3 most relevant style examples from ChromaDB,
    constructs the prompt, calls GPT-4o, and returns (xhs_text, linkedin_text).
    """
    # Retrieve relevant style examples
    retriever = vectorstore.as_retriever(
        search_type="similarity", search_kwargs={"k": min(3, vectorstore._collection.count())}
    )
    docs = retriever.invoke(user_input)
    style_block = "\n\n---\n\n".join(d.page_content for d in docs) if docs else "(none provided)"

    # Build LCEL chain
    llm = ChatOpenAI(
        model="gpt-4o",
        openai_api_key=api_key,
        temperature=0.75,
        max_tokens=1500,
    )
    chain = GENERATION_PROMPT | llm | StrOutputParser()

    raw = chain.invoke({"style_examples": style_block, "user_input": user_input})

    # Parse output using XML-style tags
    xhs_text = ""
    li_text = ""
    try:
        import re
        xhs_match = re.search(r"<XHS_OUTPUT>(.*?)</XHS_OUTPUT>", raw, re.DOTALL)
        li_match  = re.search(r"<LI_OUTPUT>(.*?)</LI_OUTPUT>",  raw, re.DOTALL)
        if xhs_match:
            xhs_text = xhs_match.group(1).strip()
        if li_match:
            li_text = li_match.group(1).strip()
        # Fallback: if tags are missing, try legacy header-based parsing
        if not xhs_text and not li_text:
            parts = raw.split("XIAOHONGSHU VERSION:")
            body = parts[-1] if len(parts) > 1 else raw
            li_split = body.split("LINKEDIN VERSION:")
            xhs_text = li_split[0].strip()
            li_text = li_split[1].strip() if len(li_split) > 1 else ""
    except Exception:
        xhs_text = raw
        li_text = ""

    return xhs_text, li_text


# ===========================================================================
# SIDEBAR
# ===========================================================================
with st.sidebar:
    st.title("👻 Ghost Cloner")
    st.caption("Turn rough ideas into polished posts.")
    st.info("可把此链接发给朋友，多人同时使用，各自在此填写 API Key。")
    st.divider()

    # ── API Key ──────────────────────────────────────────────────────────────
    st.subheader("🔑 OpenAI API Key")
    api_key_input = st.text_input(
        "Paste your key here:",
        type="password",
        placeholder="sk-...",
        help="Your key is used only within this session and is never stored.",
    )
    if api_key_input:
        st.session_state["api_key_confirmed"] = True

    st.divider()

    # ── Style Examples ───────────────────────────────────────────────────────
    st.subheader("✍️ Your Writing Style Examples")
    st.caption(
        "Paste 3–5 posts you have previously written. "
        "The more examples you provide, the better the style match."
    )

    for i in range(5):
        st.session_state["style_examples"][i] = st.text_area(
            f"Example {i + 1}",
            value=st.session_state["style_examples"][i],
            height=90,
            placeholder="Paste one of your previous posts here…",
            key=f"example_{i}",
        )

    valid_examples = [ex.strip() for ex in st.session_state["style_examples"] if ex.strip()]

    if st.button("💾 Save Style to Knowledge Base", use_container_width=True):
        if not api_key_input:
            st.error("Please enter your OpenAI API Key first.")
        elif len(valid_examples) < 1:
            st.warning("Please add at least one style example.")
        else:
            with st.spinner("Embedding your style examples…"):
                try:
                    vs = build_vectorstore(api_key_input, valid_examples)
                    st.session_state["vectorstore"] = vs
                    st.session_state["style_db_ready"] = True
                    st.success(f"✅ {len(valid_examples)} example(s) saved!")
                except Exception as e:
                    st.error(f"Failed to build knowledge base: {e}")

    if st.session_state["style_db_ready"]:
        st.info(f"Knowledge base ready — {len(valid_examples)} example(s) loaded.")


# ===========================================================================
# MAIN AREA
# ===========================================================================
st.title("Personal IP Content Generator")
st.markdown(
    "Transform your raw thoughts — a voice memo or rough notes — into "
    "**platform-optimised social media posts** that sound exactly like you."
)
st.divider()

# ── Step 1: Content Input ────────────────────────────────────────────────────
st.header("Step 1 — Provide Your Raw Content")

input_tab, audio_tab = st.tabs(["📝 Text Input", "🎙️ Audio Upload"])

user_input = ""

with input_tab:
    text_input = st.text_area(
        "Enter your rough thoughts, bullet points, or draft here:",
        height=200,
        placeholder="e.g. 'Just had a breakthrough insight about productivity — the real enemy isn't distraction, it's decision fatigue…'",
    )
    if text_input.strip():
        user_input = text_input.strip()

with audio_tab:
    st.markdown(
        "Upload an **MP3** or **WAV** voice memo. "
        "Whisper will transcribe it automatically."
    )
    audio_file = st.file_uploader(
        "Choose an audio file:",
        type=["mp3", "wav"],
        label_visibility="collapsed",
    )

    if audio_file is not None:
        st.audio(audio_file)
        col_btn, col_status = st.columns([1, 3])
        with col_btn:
            transcribe_btn = st.button("🎙️ Transcribe", use_container_width=True)
        if transcribe_btn:
            if not api_key_input:
                st.error("Please enter your OpenAI API Key in the sidebar.")
            else:
                with st.spinner("Transcribing with Whisper…"):
                    try:
                        suffix = "." + audio_file.name.split(".")[-1]
                        transcript = transcribe_audio(
                            api_key_input, audio_file.getvalue(), suffix
                        )
                        st.session_state["transcribed_text"] = transcript
                        st.success("Transcription complete!")
                    except Exception as e:
                        st.error(f"Transcription failed: {e}")

    if st.session_state["transcribed_text"]:
        st.session_state["transcribed_text"] = st.text_area(
            "Transcribed text (edit if needed):",
            value=st.session_state["transcribed_text"],
            height=180,
            key="transcript_editor",
        )
        if st.session_state["transcribed_text"].strip():
            user_input = st.session_state["transcribed_text"].strip()

st.divider()

# ── Step 2: Generate ─────────────────────────────────────────────────────────
st.header("Step 2 — Generate Polished Posts")

generate_btn = st.button(
    "✨ Generate Content",
    type="primary",
    use_container_width=False,
    disabled=not bool(user_input),
)

if generate_btn:
    if not api_key_input:
        st.error("Please enter your OpenAI API Key in the sidebar.")
    elif not user_input:
        st.warning("Please provide some input text or transcribe an audio file.")
    else:
        # Auto-build vectorstore if user skipped the sidebar save step
        if not st.session_state["style_db_ready"] or st.session_state["vectorstore"] is None:
            if valid_examples:
                with st.spinner("Building style knowledge base…"):
                    try:
                        vs = build_vectorstore(api_key_input, valid_examples)
                        st.session_state["vectorstore"] = vs
                        st.session_state["style_db_ready"] = True
                    except Exception as e:
                        st.error(f"Failed to build knowledge base: {e}")
                        st.stop()
            else:
                # No examples — use a placeholder so the chain still works
                st.warning(
                    "No style examples provided. Generating with a general social media style. "
                    "Add examples in the sidebar for a personalised output."
                )
                placeholder_examples = [
                    "Sharing my honest thoughts on this. It's been a wild ride, "
                    "but every step taught me something valuable. #growth"
                ]
                with st.spinner("Initialising…"):
                    try:
                        vs = build_vectorstore(api_key_input, placeholder_examples)
                        st.session_state["vectorstore"] = vs
                        st.session_state["style_db_ready"] = True
                    except Exception as e:
                        st.error(f"Initialisation failed: {e}")
                        st.stop()

        with st.spinner("Cloning your style and generating content… this may take 15–30 seconds."):
            try:
                xhs, linkedin = generate_content(
                    api_key_input,
                    user_input,
                    st.session_state["vectorstore"],
                )
                st.session_state["xhs_output"] = xhs
                st.session_state["li_output"] = linkedin
                st.session_state["generation_done"] = True
            except Exception as e:
                st.error(f"Generation failed: {e}")

st.divider()

# ── Step 3: Output Display ───────────────────────────────────────────────────
st.header("Step 3 — Your Polished Posts")

if st.session_state["generation_done"]:
    col_xhs, col_li = st.columns(2, gap="large")

    with col_xhs:
        st.markdown(
            '<span class="platform-badge xhs-badge">📕 Xiaohongshu / RedNote</span>',
            unsafe_allow_html=True,
        )
        st.markdown("#### Xiaohongshu Version")
        st.markdown(st.session_state["xhs_output"])
        st.caption("Use the copy button (top-right) on the code block below to copy the raw text.")
        st.code(st.session_state["xhs_output"], language=None, wrap_lines=True)

    with col_li:
        st.markdown(
            '<span class="platform-badge li-badge">💼 LinkedIn</span>',
            unsafe_allow_html=True,
        )
        st.markdown("#### LinkedIn Version")
        st.markdown(st.session_state["li_output"])
        st.caption("Use the copy button (top-right) on the code block below to copy the raw text.")
        st.code(st.session_state["li_output"], language=None, wrap_lines=True)

    st.divider()
    st.success(
        "✅ Content generated successfully! "
        "Click the copy icon in the top-right corner of each code block to copy the text."
    )

    if st.button("🔄 Generate Again with Same Input"):
        st.session_state["generation_done"] = False
        st.rerun()

else:
    st.info(
        "Your generated posts will appear here. "
        "Fill in your content above and click **✨ Generate Content** to get started."
    )

# ---------------------------------------------------------------------------
# Footer
# ---------------------------------------------------------------------------
st.markdown("---")
st.caption(
    "Ghost Cloner MVP · Powered by OpenAI GPT-4o, Whisper, LangChain & ChromaDB · "
    "Your API key is used only in this session. 可多人同时使用，把链接发给朋友即可，各自在侧栏填写自己的 API Key。"
)
