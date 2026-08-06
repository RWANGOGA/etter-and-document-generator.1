from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pypdf import PdfReader, PdfWriter
from PIL import Image as PILImage
import fitz  # PyMuPDF
import io

router = APIRouter(prefix="/api/pdf", tags=["pdf-tools"])


@router.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 PDFs to merge")

    writer = PdfWriter()
    for file in files:
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        for page in reader.pages:
            writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=merged.pdf"},
    )


@router.post("/split")
async def split_pdf(
    file: UploadFile = File(...),
    start_page: int = Form(...),
    end_page: int = Form(...),
):
    content = await file.read()
    reader = PdfReader(io.BytesIO(content))
    writer = PdfWriter()

    total = len(reader.pages)
    if start_page < 1 or end_page > total or start_page > end_page:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid page range for a {total}-page PDF",
        )

    for i in range(start_page - 1, end_page):
        writer.add_page(reader.pages[i])

    output = io.BytesIO()
    writer.write(output)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=split_{start_page}-{end_page}.pdf"
        },
    )
@router.post("/compress")
async def compress_pdf(file: UploadFile = File(...), quality: int = Form(50)):
    from PIL import Image as PILImage

    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")

    for page in doc:
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]

                # Re-encode through Pillow at the requested JPEG quality
                pil_img = PILImage.open(io.BytesIO(image_bytes))
                if pil_img.mode in ("RGBA", "P"):
                    pil_img = pil_img.convert("RGB")

                buffer = io.BytesIO()
                pil_img.save(buffer, format="JPEG", quality=quality, optimize=True)
                recompressed = buffer.getvalue()

                # Only replace if it's actually smaller
                if len(recompressed) < len(image_bytes):
                    doc.update_stream(xref, recompressed)
            except Exception:
                continue

    output = io.BytesIO()
    # garbage=4 removes unused objects, deflate compresses streams/fonts
    doc.save(output, garbage=4, deflate=True, deflate_images=True, clean=True)
    doc.close()

    return Response(content=output.getvalue(), media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=compressed.pdf"
    })


@router.post("/watermark")
async def watermark_pdf(file: UploadFile = File(...), text: str = Form(...)):
    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")

    for page in doc:
        rect = page.rect
        # Better centered diagonal watermark
        page.insert_text(
            (rect.width * 0.15, rect.height * 0.55),
            text,
            fontsize=min(48, rect.width / 12),
            rotate=45,
            color=(0.75, 0.75, 0.75),
            overlay=True,
        )

    output = io.BytesIO()
    doc.save(output, garbage=3, deflate=True)
    doc.close()

    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=watermarked.pdf"},
    )


@router.post("/images-to-pdf")
async def images_to_pdf(files: list[UploadFile] = File(...)):
    images = []
    for file in files:
        content = await file.read()
        img = PILImage.open(io.BytesIO(content)).convert("RGB")
        images.append(img)

    if not images:
        raise HTTPException(status_code=400, detail="No images provided")

    output = io.BytesIO()
    images[0].save(
        output,
        format="PDF",
        save_all=True,
        append_images=images[1:],
    )

    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=images.pdf"},
    )