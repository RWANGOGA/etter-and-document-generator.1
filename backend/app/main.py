from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import documents, generate, convert, pdftools, voice, pptx_generate, xlsx_generate
from app.database import init_db
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="LetDoc API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(generate.router)
app.include_router(convert.router)
app.include_router(pdftools.router)
app.include_router(voice.router)
app.include_router(pptx_generate.router)
app.include_router(xlsx_generate.router)


@app.get("/health")
async def health():
    return {"status": "ok"}