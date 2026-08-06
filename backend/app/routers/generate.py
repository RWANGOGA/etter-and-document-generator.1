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


PROMPTS = {
    "generate": """You are an expert at writing formal official letters (university, government, corporate).

Write ONLY the complete letter body (no analysis, no bullet points, no commentary).
Use standard formal letter structure:
- Clear subject line if appropriate
- Polite, professional, concise paragraphs
- Direct request
- Courteous closing

Notes from the user:
{notes}

Return nothing except the letter text itself.""",

    "generate-document": """Write a complete, thorough document as clean HTML based on this topic. 
Cover the subject in depth with multiple well-developed sections — do not produce a shallow summary:

{notes}""",

    "polish": "Polish and improve this text while keeping the exact same meaning and structure. Return only the improved text:\n\n{existing_text}",

    "fix-grammar": "Fix only grammar, spelling and minor punctuation. Preserve all formatting and meaning. Return only the corrected text:\n\n{existing_text}",

    "continue": "Continue writing this document in the same style, tone and level of detail. Do not repeat previous content:\n\n{existing_text}",
}


@router.post("", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    template = PROMPTS.get(req.mode, PROMPTS["generate"])
    prompt = template.format(notes=req.notes, existing_text=req.existing_text)

    system_msg = "You are a precise formal writing assistant. Follow the instructions exactly."
    temperature = 0.4 if req.mode in ("generate", "polish", "fix-grammar") else 0.7

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt},
            ],
            max_tokens=4096,
            temperature=temperature,
        )
        text = completion.choices[0].message.content or ""
        text = strip_thinking(text)
        return GenerateResponse(success=True, text=text.strip())
    except Exception as e:
        return GenerateResponse(success=False, text=str(e))


class ChatMessage(BaseModel):
    role: str
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

Formatting rule for your conversational replies (NOT the document itself): plain text only. Never use markdown symbols like **bold**, # headers, bullet dashes, or emojis in your conversational messages — the chat display renders plain text, so markdown characters would show up literally as asterisks and hash symbols. Write replies as normal prose sentences and paragraphs instead.

When you have enough to write the full document (or the user explicitly asks you to produce it now):
1. Respond with one short conversational line, in plain text per the rule above.
2. Then output the ENTIRE document as clean HTML inside <DOCUMENT>...</DOCUMENT> tags.
   - Use <h1> for the title, <h2>/<h3> for section headings.
   - Use <p> for paragraphs — multiple substantial paragraphs per section, not one-liners.
   - Use <ul><li> or <ol><li> for lists where appropriate.
   - Do not include <html>/<body> tags — just the content itself.
3. Do not use <DOCUMENT> tags unless you are actually delivering the finished document — during discussion, just talk normally."""


async def _call_groq(messages: list[dict]) -> tuple[str, bool]:
    """Returns (text, was_truncated)."""
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        max_tokens=4096,
        temperature=0.7,
    )
    choice = completion.choices[0]
    text = choice.message.content or ""
    truncated = choice.finish_reason == "length"
    return text, truncated


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
        full_text = ""
        current_messages = messages
        for _ in range(3):  # allow up to 3 continuation rounds
            chunk, truncated = await _call_groq(current_messages)
            full_text += chunk
            if not truncated:
                break
            # Ask the model to continue exactly where it left off
            current_messages = messages + [
                {"role": "assistant", "content": full_text},
                {"role": "user", "content": "Continue exactly where you left off. Do not repeat any earlier content, do not restart the <DOCUMENT> tag, just keep writing from the last character."},
            ]

        text = strip_thinking(full_text)

        document_html = None
        reply_text = text

        if "<DOCUMENT>" in text:
            start = text.index("<DOCUMENT>")
            reply_text = text[:start].strip()
            if "</DOCUMENT>" in text:
                document_html = text[start + len("<DOCUMENT>"):text.index("</DOCUMENT>")].strip()
            else:
                # still no closing tag even after continuations — take what we have
                document_html = text[start + len("<DOCUMENT>"):].strip()
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