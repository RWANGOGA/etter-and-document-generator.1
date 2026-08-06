
import re
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from groq import Groq
from app.config import settings
import io

router = APIRouter(prefix="/api/generate", tags=["generate"])
client = Groq(api_key=settings.groq_api_key)

MODEL = "qwen/qwen3.6-27b"


def strip_thinking(text: str) -> str:
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


class GenerateRequest(BaseModel):
    notes: str
    mode: str = "generate"
    existing_text: str = ""


class GenerateResponse(BaseModel):
    success: bool
    text: str


# 1. STRICT SYSTEM PROMPT FOR QUICK EDITOR ACTIONS
# This ensures that when the user clicks "Polish", "Fix Grammar", etc., 
# the AI doesn't chat—it just outputs the fixed text.
GENERATE_SYSTEM_PROMPT = """You are a professional writing assistant. Your task is to output ONLY the requested text. 
Do not include any introductory text, conversational filler, summaries, or explanations. 
Start immediately with the first word of the requested text and end with the last word."""


# 2. UPDATED PROMPTS FOR QUICK ACTIONS
PROMPTS = {
    "generate": (
        "Write a polished, professional formal letter based on the notes provided. "
        "Include standard formal letter formatting (Sender Address, Date, Recipient Address, Subject, Salutation, Body, Sign-off). "
        "Output ONLY the letter text.\n\nNotes:\n{notes}"
    ),
    "generate-document": (
        "Write a complete, thorough document as clean HTML based on this topic. "
        "Cover the subject in depth with multiple well-developed sections. "
        "Output ONLY the HTML content.\n\nTopic:\n{notes}"
    ),
    "polish": (
        "Polish and improve this text, keeping the exact same meaning. "
        "Output ONLY the polished text.\n\nText:\n{existing_text}"
    ),
    "fix-grammar": (
        "Fix grammar and spelling in this text, preserving formatting. "
        "Output ONLY the corrected text.\n\nText:\n{existing_text}"
    ),
    "continue": (
        "Continue writing this document in the same style and tone. "
        "Output ONLY the continuation text.\n\nText:\n{existing_text}"
    ),
}


@router.post("", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    template = PROMPTS.get(req.mode, PROMPTS["generate"])
    prompt = template.format(notes=req.notes, existing_text=req.existing_text)

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": GENERATE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096,
            temperature=0.3, # Lowered for strict, professional output
        )
        text = completion.choices[0].message.content or ""
        text = strip_thinking(text)
        return GenerateResponse(success=True, text=text.strip())
    except Exception as e:
        return GenerateResponse(success=False, text=str(e))


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    attached_text: str = ""


class ChatResponse(BaseModel):
    success: bool
    reply: str
    document_html: str | None = None


# 3. CLAUDE/QWEN-LIKE SYSTEM PROMPT FOR CHAT
CHAT_SYSTEM_PROMPT = """You are a highly capable, conversational, and analytical AI assistant, similar to Claude or Qwen, embedded in a document editor.

1. ANALYZING & SUMMARIZING (When user asks "what is in this?", "summarize", "tell me about this"):
- Provide a clear, structured breakdown of the uploaded text (use bullet points, bold text for key details, and analyze the tone/purpose).
- Always end your conversational reply by offering proactive next steps (e.g., "If you'd like me to polish this letter, adjust its tone, or draft a follow-up, just let me know.").
- CRITICAL: Do NOT use <DOCUMENT> tags for summaries or analysis. Just reply with standard Markdown text so it appears naturally in the chat window.

2. DRAFTING & GENERATING (When user asks you to WRITE a new document, essay, or report):
- Provide a brief, polite conversational introduction.
- Then output the ENTIRE document as clean HTML inside <DOCUMENT>...</DOCUMENT> tags.
- Use standard HTML tags (<h1>, <h2>, <h3>, <p>, <ul>, <li>). Do not include <html> or <body> tags.

3. EDITING & REWRITING (When user asks you to "polish", "rewrite", "make it more professional", or "fix" an uploaded document):
- Provide a brief conversational confirmation.
- Output the fully rewritten text inside <DOCUMENT>...</DOCUMENT> tags so it populates directly into their editor.

GENERAL RULES:
- Be helpful, articulate, and professional.
- Draw on your extensive knowledge base to provide deep, insightful analysis.
- Never use <DOCUMENT> tags unless you are outputting the final drafted/edited text meant for the editor canvas."""


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    if req.attached_text:
        messages.append({
            "role": "system",
            "content": f"The user uploaded a reference file with this content:\n\n{req.attached_text[:8000]}"
        })

    for m in req.messages:
        messages.append({"role": m.role, "content": m.content})

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=4096,
            temperature=0.5, # Balanced temperature for conversational yet accurate replies
        )
        text = completion.choices[0].message.content or ""
        text = strip_thinking(text)

        document_html = None
        reply_text = text

        if "<DOCUMENT>" in text and "</DOCUMENT>" in text:
            start = text.index("<DOCUMENT>")
            end = text.index("</DOCUMENT>") + len("</DOCUMENT>")
            document_html = text[start + len("<DOCUMENT>"):text.index("</DOCUMENT>")].strip()
            reply_text = (text[:start] + text[end:]).strip()
            if not reply_text:
                reply_text = "Here's your document — take a look and let me know if you'd like any changes."

        return ChatResponse(success=True, reply=reply_text, document_html=document_html)
    except Exception as e:
        return ChatResponse(success=False, reply=f"Something went wrong: {e}")


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    content = await file.read()
    filename = (file.filename or "").lower()
    text = ""

    try:
        if filename.endswith(".pdf"):
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        elif filename.endswith(".docx"):
            import docx
            d = docx.Document(io.BytesIO(content))
            text = "\n".join(p.text for p in d.paragraphs)
        else:
            text = content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    return {"text": text[:20000]}