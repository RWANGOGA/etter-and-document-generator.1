from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.models import DocumentModel
from app.schemas import DocumentCreate, DocumentUpdate, DocumentOut

router = APIRouter(prefix="/api/documents", tags=["documents"])

def to_out(doc: DocumentModel) -> dict:
    return {
        "id": doc.id,
        "type": doc.type,
        "title": doc.title,
        "createdAt": doc.created_at,
        "updatedAt": doc.updated_at,
        "content": doc.content,
    }

@router.get("", response_model=list[DocumentOut])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DocumentModel).order_by(DocumentModel.updated_at.desc()))
    docs = result.scalars().all()
    return [to_out(d) for d in docs]

@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(DocumentModel, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return to_out(doc)

@router.post("", response_model=DocumentOut)
async def create_document(payload: DocumentCreate, db: AsyncSession = Depends(get_db)):
    doc = DocumentModel(
        id=f"doc_{uuid.uuid4().hex[:12]}",
        type=payload.type,
        title=payload.title,
        content=payload.content.model_dump(),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return to_out(doc)

@router.put("/{doc_id}", response_model=DocumentOut)
async def update_document(doc_id: str, payload: DocumentUpdate, db: AsyncSession = Depends(get_db)):
    doc = await db.get(DocumentModel, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if payload.title is not None:
        doc.title = payload.title
    if payload.content is not None:
        doc.content = payload.content.model_dump()
    doc.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(doc)
    return to_out(doc)

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(DocumentModel, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    await db.commit()
    return {"success": True}
