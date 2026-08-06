import base64
import json
import edge_tts
from deepgram import DeepgramClient, PrerecordedOptions
from groq import Groq
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.schemas import get_document_type, DOCUMENT_TYPES

router = APIRouter(prefix="/api/voice", tags=["voice"])
deepgram = DeepgramClient(settings.deepgram_api_key)
groq_client = Groq(api_key=settings.groq_api_key)


async def transcribe_audio(audio_bytes: bytes, mimetype: str = "audio/webm") -> str:
    source = {"buffer": audio_bytes, "mimetype": mimetype}
    options = PrerecordedOptions(model="nova-2", smart_format=True, language="en")
    response = await deepgram.listen.asyncrest.v("1").transcribe_file(source, options)
    return response.results.channels[0].alternatives[0].transcript.strip()


def extract_field_value(field_label: str, multiline: bool, transcript: str, doc_type_name: str) -> str:
    style_note = "Write it as a well-formed paragraph." if multiline else "Keep it short and precise."
    prompt = f"""The user is filling out a {doc_type_name}. They were asked: {field_label}.
They said: "{transcript}"
Return ONLY the cleaned-up value, nothing else. {style_note}"""
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )
    return completion.choices[0].message.content.strip()


async def synthesize_speech(text: str) -> str:
    communicate = edge_tts.Communicate(text, voice="en-US-AriaNeural")
    audio_chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
    return base64.b64encode(b"".join(audio_chunks)).decode("utf-8")


def next_missing_field(type_id: str, fields: dict):
    doc_type = get_document_type(type_id)
    for f in doc_type.fields:
        if f.required and not fields.get(f.name, "").strip():
            return f
    return None


class VoiceTurnResponse(BaseModel):
    transcript: str
    fields: dict
    field_just_answered: str | None
    next_field: str | None
    next_question: str | None
    audio_base64: str | None
    done: bool


@router.get("/document-types")
async def get_document_types():
    return list(DOCUMENT_TYPES.values())


@router.get("/first-question")
async def first_question(document_type: str):
    doc_type = get_document_type(document_type)
    first_field = doc_type.fields[0]
    greeting = f"Let's fill in your {doc_type.displayName}. {first_field.question}"
    audio_b64 = await synthesize_speech(greeting)
    return {"field": first_field.name, "question": greeting, "audio_base64": audio_b64}


@router.post("/turn", response_model=VoiceTurnResponse)
async def voice_turn(
    audio: UploadFile = File(...),
    current_fields: str = Form(...),
    document_type: str = Form(...),
    asking_field: str = Form(...),
):
    try:
        fields = json.loads(current_fields)
        doc_type = get_document_type(document_type)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="current_fields must be valid JSON")
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    audio_bytes = await audio.read()
    try:
        transcript = await transcribe_audio(audio_bytes, mimetype=audio.content_type or "audio/webm")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

    field_def = next((f for f in doc_type.fields if f.name == asking_field), None)
    if not field_def:
        raise HTTPException(status_code=400, detail=f"Unknown field: {asking_field}")

    if not transcript:
        question_text = "Sorry, I didn't catch that. Could you say that again?"
        audio_b64 = await synthesize_speech(question_text)
        return VoiceTurnResponse(
            transcript="", fields=fields, field_just_answered=None,
            next_field=asking_field, next_question=question_text,
            audio_base64=audio_b64, done=False,
        )

    fields[asking_field] = extract_field_value(field_def.label, field_def.multiline, transcript, doc_type.displayName)
    nxt = next_missing_field(document_type, fields)

    if nxt is None:
        closing_text = f"That's everything I need for your {doc_type.displayName}. Take a look before downloading."
        audio_b64 = await synthesize_speech(closing_text)
        return VoiceTurnResponse(
            transcript=transcript, fields=fields, field_just_answered=asking_field,
            next_field=None, next_question=closing_text, audio_base64=audio_b64, done=True,
        )

    audio_b64 = await synthesize_speech(nxt.question)
    return VoiceTurnResponse(
        transcript=transcript, fields=fields, field_just_answered=asking_field,
        next_field=nxt.name, next_question=nxt.question, audio_base64=audio_b64, done=False,
    )