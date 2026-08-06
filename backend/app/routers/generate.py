from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from groq import Groq
from app.config import settings
import io

router = APIRouter(prefix="/api/generate", tags=["generate"])
client = Groq(api_key=settings.groq_api_key)

MODEL = "qwen/qwen3.6-27b"


class GenerateRequest(BaseModel):
    notes: str
    mode: str = "generate"
    existing_text: str = ""


class GenerateResponse(BaseModel):
    success: bool
    text: str


PROMPTS = {
    "generate": "Write a formal letter body based on these notes. Return only the letter body text:\n\n{notes}",
    "generate-document": "Write a complete, thorough document as clean HTML based on this topic. Cover the subject in depth with multiple well-developed sections — do not produce a shallow summary:\n\n{notes}",
    "polish": "Polish and improve this text, keeping the same meaning:\n\n{existing_text}",
    "fix-grammar": "Fix grammar and spelling in this text, preserving formatting:\n\n{existing_text}",
    "continue": "Continue writing this document in the same style and tone:\n\n{existing_text}",
}


@router.post("", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    template = PROMPTS.get(req.mode, PROMPTS["generate"])
    prompt = template.format(notes=req.notes, existing_text=req.existing_text)

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=32768,
            temperature=0.7,
        )
        text = completion.choices[0].message.content or ""
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


CHAT_SYSTEM_PROMPT = """You are an expert writing assistant embedded in a document editor, similar in capability to Claude. You help the user produce genuinely thorough, well-developed documents — not summaries or outlines.

Behave like a real collaborator:
- Ask clarifying questions about scope, audience, length, and tone before drafting if the request is vague.
- If the user gives you a topic, treat it seriously: cover context, multiple angles, concrete detail, and logical structure — the way a subject-matter expert would write it, not a shallow overview.
- Draw on your own knowledge to add relevant facts, examples, and reasoning. Do not pad with generic filler sentences — every paragraph should carry real content.
- Default to comprehensive unless the user asks for something short. A "report" or "essay" should have multiple well-developed sections, not three thin paragraphs.
- You do not have live internet access — you can only draw on your training knowledge. If the user needs current facts or live data, say so honestly rather than inventing them.

When you have enough to write the full document (or the user explicitly asks you to produce it now):
1. Respond with one short conversational line.
2. Then output the ENTIRE document as clean HTML inside <DOCUMENT>...</DOCUMENT> tags.
   - Use <h1> for the title, <h2>/<h3> for section headings.
   - Use <p> for paragraphs — multiple substantial paragraphs per section, not one-liners.
   - Use <ul><li> or <ol><li> for lists where appropriate.
   - Do not include <html>/<body> tags — just the content itself.
3. Do not use <DOCUMENT> tags unless you are actually delivering the finished document — during discussion, just talk normally."""


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
            max_tokens=16384,
            temperature=0.7,
        )
        text = completion.choices[0].message.content or ""

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