export async function generateDocumentWord(editorHtml: string, watermark?: string) {
  // @ts-expect-error - html-docx-js ships no TypeScript types
  const htmlDocx = await import('html-docx-js/dist/html-docx');
  const { saveAs } = await import('file-saver');

  const watermarkBanner = watermark
    ? `<p style="color:#b45309;font-weight:bold;letter-spacing:2px;text-align:center;">${watermark}</p>`
    : '';

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Document</title></head>
      <body style="font-family: Georgia, 'Times New Roman', serif; color:#1f2937;">
        ${watermarkBanner}
        ${editorHtml}
      </body>
    </html>
  `;

  const blob = htmlDocx.asBlob(fullHtml);
  saveAs(blob, 'document.docx');
}