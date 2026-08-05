import type { DocumentRecord } from '@/app/types/document';
import { api } from '@/app/lib/api';

export async function saveDocument(doc: DocumentRecord): Promise<DocumentRecord> {
  // If it already exists on the server, update; otherwise this path
  // shouldn't be hit for brand-new docs — use createDocument instead.
  return api.documents.update(doc.id, { title: doc.title, content: doc.content });
}

export async function createDocument(
  type: DocumentRecord['type'],
  title: string,
  content: DocumentRecord['content']
): Promise<DocumentRecord> {
  return api.documents.create({ type, title, content });
}

export async function loadDocument(id: string): Promise<DocumentRecord | null> {
  try {
    return await api.documents.get(id);
  } catch {
    return null;
  }
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return api.documents.list();
}

export async function deleteDocument(id: string): Promise<void> {
  await api.documents.delete(id);
}