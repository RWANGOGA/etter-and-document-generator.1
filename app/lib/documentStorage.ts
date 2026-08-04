import type { DocumentRecord } from '@/app/types/document';

const INDEX_KEY = 'letdoc-document-ids';

function getIndex(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveIndex(ids: string[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function saveDocument(doc: DocumentRecord) {
  localStorage.setItem(`letdoc-doc-${doc.id}`, JSON.stringify(doc));
  const ids = getIndex();
  if (!ids.includes(doc.id)) {
    saveIndex([...ids, doc.id]);
  }
}

export function loadDocument(id: string): DocumentRecord | null {
  const raw = localStorage.getItem(`letdoc-doc-${id}`);
  return raw ? JSON.parse(raw) : null;
}

export function listDocuments(): DocumentRecord[] {
  return getIndex()
    .map(loadDocument)
    .filter((d): d is DocumentRecord => d !== null);
}

export function deleteDocument(id: string) {
  localStorage.removeItem(`letdoc-doc-${id}`);
  saveIndex(getIndex().filter((docId) => docId !== id));
}

export function createDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}