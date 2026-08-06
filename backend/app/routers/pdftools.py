import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from ilovepdf import MergeTask, SplitTask, CompressTask
from PIL import Image as PILImage
import fitz  # PyMuPDF
import io

from app.config import settings

router = APIRouter(prefix="/api/pdf", tags=["pdf-tools"])


def _new_task(task_cls):
    return task_cls(
        public_key=settings.ilovepdf_public_key,
        secret_key=settings.ilovepdf_secret_key,
    )


def _run_task_and_get_output(task, tmpdir: str, input_paths: list[str]) -> bytes:
    try:
        task.execute()
        task.download(tmpdir)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"iLovePDF task failed: {e}")

    all_files = [f for f in os.listdir(tmpdir) if f.endswith(".pdf")]
    if not all_files:
        raise HTTPException(
            status_code=502,
            detail=f"No output file returned from iLovePDF. tmpdir had: {os.listdir(tmpdir)}",
        )

    # download() overwrites in place using the input filename, so just take the first (only) pdf
    with open(os.path.join(tmpdir, all_files[0]), "rb") as f:
        return f.read()


@router.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 PDFs to merge")

    with tempfile.TemporaryDirectory() as tmpdir:
        input_paths = []
        task = _new_task(MergeTask)
        for file in files:
            content = await file.read()
            path = os.path.join(tmpdir, file.filename or f"file_{len(input_paths)}.pdf")
            with open(path, "wb") as f:
                f.write(content)
            input_paths.append(path)
            task.add_file(path)

        data = _run_task_and_get_output(task, tmpdir, input_paths)

    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=merged.pdf"},
    )


@router.post("/split")
async def split_pdf(
    file: UploadFile = File(...),
    start_page: int = Form(...),
    end_page: int = Form(...),
):
    with tempfile.TemporaryDirectory() as tmpdir:
        content = await file.read()
        input_path = os.path.join(tmpdir, file.filename or "input.pdf")
        with open(input_path, "wb") as f:
            f.write(content)

        task = _new_task(SplitTask)
        task.add_file(input_path)
        task.ranges = [f"{start_page}-{end_page}"]
        task.merge_after = True

        data = _run_task_and_get_output(task, tmpdir, [input_path])

    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=split_{start_page}-{end_page}.pdf"},
    )


@router.post("/compress")
async def compress_pdf(file: UploadFile = File(...), quality: int = Form(50)):
    with tempfile.TemporaryDirectory() as tmpdir:
        content = await file.read()
        input_path = os.path.join(tmpdir, file.filename or "input.pdf")
        with open(input_path, "wb") as f:
            f.write(content)

        task = _new_task(CompressTask)
        task.add_file(input_path)

        data = _run_task_and_get_output(task, tmpdir, [input_path])

    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=compressed.pdf"},
    )


@router.post("/watermark")
async def watermark_pdf(file: UploadFile = File(...), text: str = Form(...)):
    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")

    for page in doc:
        rect = page.rect
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