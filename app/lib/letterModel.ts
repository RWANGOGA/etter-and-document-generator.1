import type { LetterData } from '@/app/components/LetterPreview';

export type LetterLayout = 'block' | 'modified-block' | 'simplified';
export type Align = 'left' | 'right' | 'center';

export interface LetterModel {
  senderAlign: Align;
  dateAlign: Align;
  formattedDate: string;
  salutation: string;
  subjectLine: string | null;
  hasSignature: boolean;
  data: LetterData;
}

function getAlignments(layout: LetterLayout): { senderAlign: Align; dateAlign: Align } {
  switch (layout) {
    case 'block':
      return { senderAlign: 'left', dateAlign: 'left' };
    case 'modified-block':
      return { senderAlign: 'right', dateAlign: 'right' };
    case 'simplified':
      return { senderAlign: 'center', dateAlign: 'left' };
  }
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getSalutation(recipientName: string): string {
  const firstName = recipientName ? recipientName.split(' ')[0] : '';
  return `Dear ${firstName || 'Sir/Madam'},`;
}

function getSubjectLine(subject: string): string | null {
  if (!subject?.trim()) return null;
  return `RE: ${subject.toUpperCase()}`;
}

export function computeLetterModel(data: LetterData, layout: LetterLayout): LetterModel {
  const { senderAlign, dateAlign } = getAlignments(layout);

  return {
    senderAlign,
    dateAlign,
    formattedDate: formatDate(data.date),
    salutation: getSalutation(data.recipientName),
    subjectLine: getSubjectLine(data.subject),
    hasSignature: !!data.signatureData,
    data,
  };
}