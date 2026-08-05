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

    compress: async (file: File): Promise<Blob> => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/pdf/compress`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Compress failed: ${res.status}`);
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
      const res = await fetch(`${API_URL}/api/pdf/images-to-pdf`, { method: 'POST', body: formData });
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

      const res = await fetch(`${API_URL}/api/voice/turn`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Voice turn failed: ${res.status}`);
      return res.json();
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