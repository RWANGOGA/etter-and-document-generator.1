import type { DocumentRecord, DocumentTypeDef } from '@/app/types/document';
import type { LetterData } from '@/app/components/LetterPreview';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }

  return res.json();
}

export interface VoiceTurnResult {
  transcript: string;
  fields: Record<string, string>;
  field_just_answered: string | null;
  next_field: string | null;
  next_question: string | null;
  audio_base64: string | null;
  done: boolean;
}

export const api = {
  documents: {
    list: () => request<DocumentRecord[]>('/api/documents'),

    get: (id: string) => request<DocumentRecord>(`/api/documents/${id}`),

    create: (data: Pick<DocumentRecord, 'type' | 'title' | 'content'>) =>
      request<DocumentRecord>('/api/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Pick<DocumentRecord, 'title' | 'content'>>) =>
      request<DocumentRecord>(`/api/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/documents/${id}`, {
        method: 'DELETE',
      }),
  },

  convert: {
    letterLatexPdf: async (data: LetterData, layout: string): Promise<Blob> => {
      const res = await fetch(`${API_URL}/api/convert/letter-latex-pdf?layout=${layout}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`LaTeX PDF generation failed (${res.status}): ${body}`);
      }
      return res.blob();
    },

    letterLatexSource: async (data: LetterData, layout: string): Promise<Blob> => {
      const res = await fetch(`${API_URL}/api/convert/letter-latex-source?layout=${layout}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`LaTeX source generation failed: ${res.status}`);
      return res.blob();
    },

    documentLatexPdf: async (title: string, subtitle: string, html: string): Promise<Blob> => {
      const res = await fetch(`${API_URL}/api/convert/document-latex-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle, html }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Document LaTeX PDF failed (${res.status}): ${body}`);
      }
      return res.blob();
    },
  },

  pdfTools: {
    merge: async (files: File[]): Promise<Blob> => {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const res = await fetch(`${API_URL}/api/pdf/merge`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Merge failed: ${res.status}`);
      return res.blob();
    },

    split: async (file: File, startPage: number, endPage: number): Promise<Blob> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('start_page', String(startPage));
      formData.append('end_page', String(endPage));
      const res = await fetch(`${API_URL}/api/pdf/split`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Split failed: ${res.status}`);
      return res.blob();
    },

    compress: async (file: File, quality: number = 60): Promise<Blob> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', String(quality));
      const res = await fetch(`${API_URL}/api/pdf/compress`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Compress failed: ${res.status} ${body}`);
      }
      return res.blob();
    },

    watermark: async (file: File, text: string): Promise<Blob> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('text', text);
      const res = await fetch(`${API_URL}/api/pdf/watermark`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Watermark failed: ${res.status}`);
      return res.blob();
    },

    imagesToPdf: async (files: File[]): Promise<Blob> => {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const res = await fetch(`${API_URL}/api/pdf/images-to-pdf`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Image conversion failed: ${res.status}`);
      return res.blob();
    },
  },

  voice: {
    getDocumentTypes: () => request<DocumentTypeDef[]>('/api/voice/document-types'),

    getFirstQuestion: (documentType: string) =>
      request<{ field: string; question: string; audio_base64: string }>(
        `/api/voice/first-question?document_type=${encodeURIComponent(documentType)}`
      ),

    sendTurn: async (
      audioBlob: Blob,
      currentFields: Record<string, string>,
      documentType: string,
      askingField: string
    ): Promise<VoiceTurnResult> => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');
      formData.append('current_fields', JSON.stringify(currentFields));
      formData.append('document_type', documentType);
      formData.append('asking_field', askingField);

      const res = await fetch(`${API_URL}/api/voice/turn`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Voice turn failed: ${res.status}`);
      return res.json();
    },
  },

  generate: {
    chat: (messages: { role: string; content: string }[], attachedText: string = '') =>
      request<{ success: boolean; reply: string; document_html: string | null }>('/api/generate/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, attached_text: attachedText }),
      }),

    extractText: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/generate/extract-text`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Text extraction failed: ${res.status}`);
      const data = await res.json();
      return data.text;
    },
  },

  office: {
    generatePptx: async (payload: {
      topic: string;
      slide_count: number;
      theme: { primary_color: string; accent_color: string; text_color: string; font_family: string };
    }): Promise<Blob> => {
      const res = await fetch(`${API_URL}/api/pptx/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Presentation generation failed: ${body || res.statusText}`);
      }
      return res.blob();
    },

    pptxFromDocument: async (
      file: File,
      slideCount: number,
      instructions: string,
      theme: { primary_color: string; accent_color: string; text_color: string; font_family: string }
    ): Promise<Blob> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slide_count', String(slideCount));
      formData.append('instructions', instructions);
      formData.append('primary_color', theme.primary_color);
      formData.append('accent_color', theme.accent_color);
      formData.append('text_color', theme.text_color);
      formData.append('font_family', theme.font_family);
      const res = await fetch(`${API_URL}/api/pptx/from-document`, { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Presentation from document failed: ${body || res.statusText}`);
      }
      return res.blob();
    },

    pptxChat: (messages: { role: string; content: string }[]) =>
      request<{ success: boolean; reply: string; structure: Record<string, unknown> | null; ready: boolean }>(
        '/api/pptx/chat',
        { method: 'POST', body: JSON.stringify({ messages }) }
      ),

    pptxBuild: async (
      structure: Record<string, unknown>,
      theme: { primary_color: string; accent_color: string; text_color: string; font_family: string }
    ): Promise<Blob> => {
      const res = await fetch(`${API_URL}/api/pptx/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure, theme }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Build failed: ${body || res.statusText}`);
      }
      return res.blob();
    },

    generateXlsx: async (payload: {
      topic: string;
      row_count: number;
      theme: { primary_color: string; text_color: string; font_family: string };
    }): Promise<Blob> => {
      const res = await fetch(`${API_URL}/api/xlsx/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Spreadsheet generation failed: ${body || res.statusText}`);
      }
      return res.blob();
    },

    xlsxEnhance: async (
      file: File,
      instructions: string,
      theme: { primary_color: string; text_color: string; font_family: string }
    ): Promise<Blob> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instructions', instructions);
      formData.append('primary_color', theme.primary_color);
      formData.append('text_color', theme.text_color);
      formData.append('font_family', theme.font_family);
      const res = await fetch(`${API_URL}/api/xlsx/enhance`, { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Spreadsheet enhancement failed: ${body || res.statusText}`);
      }
      return res.blob();
    },

    xlsxChat: (messages: { role: string; content: string }[]) =>
      request<{ success: boolean; reply: string; structure: Record<string, unknown> | null; ready: boolean }>(
        '/api/xlsx/chat',
        { method: 'POST', body: JSON.stringify({ messages }) }
      ),

    xlsxBuild: async (
      structure: Record<string, unknown>,
      theme: { primary_color: string; text_color: string; font_family: string }
    ): Promise<Blob> => {
      const res = await fetch(`${API_URL}/api/xlsx/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure, theme }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Build failed: ${body || res.statusText}`);
      }
      return res.blob();
    },
  },
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function playBase64Audio(base64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback failed'));
    audio.play().catch(reject);
  });
}