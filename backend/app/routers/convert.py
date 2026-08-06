from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.schemas import LetterData
from app.services.latex_service import render_letter_latex, compile_latex_to_pdf, render_document_latex

router = APIRouter(prefix="/api/convert", tags=["convert"])


class DocumentLatexRequest(BaseModel):
    title: str = "Untitled Document"
    subtitle: str = ""
    html: str


@router.post("/document-latex-pdf")
async def get_document_latex_pdf(payload: DocumentLatexRequest):
    try:
        tex = render_document_latex(payload.title, payload.subtitle, payload.html)
        pdf_bytes = compile_latex_to_pdf(tex)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={
            "Content-Disposition": "attachment; filename=document.pdf"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/letter-latex-source")
async def get_latex_source(data: LetterData, layout: str = "block"):
    tex = render_letter_latex(data, layout)
    return Response(content=tex, media_type="text/x-tex", headers={
        "Content-Disposition": "attachment; filename=letter.tex"
    })


@router.post("/letter-latex-pdf")
async def get_latex_pdf(data: LetterData, layout: str = "block"):
    try:
        tex = render_letter_latex(data, layout)
        pdf_bytes = compile_latex_to_pdf(tex)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={
            "Content-Disposition": "attachment; filename=letter.pdf"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))