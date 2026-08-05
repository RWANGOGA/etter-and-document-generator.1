import type { LetterData } from '@/app/components/LetterPreview';
import type { LetterLayout } from '@/app/lib/letterModel';

export type DocumentType = 'letter' | 'freeform';

export interface LetterContent {
  kind: 'letter';
  layout: LetterLayout;
  letterType: string; // e.g. "Resignation Letter"
  data: LetterData;
}

export interface FreeformContent {
  kind: 'freeform';
  html: string;
  watermark?: string;
}

export type DocumentContent = LetterContent | FreeformContent;

export interface DocumentRecord {
  id: string;
  type: DocumentType;
  title: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  content: DocumentContent;
}

// --- Voice / document-type registry (mirrors backend/app/schemas.py) ---

export interface FieldDef {
  name: string;
  label: string;
  question: string;
  required: boolean;
  multiline: boolean;
}

export interface DocumentTypeDef {
  id: string;
  category: 'letter' | 'document';
  displayName: string;
  fields: FieldDef[];
}