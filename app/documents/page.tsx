'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mic } from 'lucide-react';
import DocumentEditor, { DocumentEditorHandle } from '@/app/components/DocumentEditor';
import { loadDocument, createDocument, saveDocument } from '@/app/lib/documentStorage';
import VoiceGenerateModal from '@/app/components/VoiceGenerateModal';

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const [documentId, setDocumentId] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Untitled Document');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const editorRef = useRef<DocumentEditorHandle>(null);

  useEffect(() => {
    const initializeDocument = async () => {
      try {
        const urlId = searchParams.get('id');

        if (urlId) {
          const existing = await loadDocument(urlId);
          if (existing) {
            setDocumentId(existing.id);
            setDocTitle(existing.title);
          } else {
            setError('Document not found.');
          }
        } else {
          const newDoc = await createDocument('freeform', 'Untitled Document', {
            kind: 'freeform',
            html: '<p></p>',
          });
          setDocumentId(newDoc.id);
          setDocTitle(newDoc.title);
          window.history.replaceState(null, '', `/documents?id=${newDoc.id}`);
        }
      } catch (err) {
        console.error('Failed to initialize document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsReady(true);
      }
    };

    initializeDocument();
  }, [searchParams]);

  const handleTitleChange = async (newTitle: string) => {
    setDocTitle(newTitle);
    if (documentId) {
      try {
        await saveDocument({ id: documentId, title: newTitle } as any);
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    }
  };

  // Voice gives back { title, topic, body } for a 'document-report' type.
  // Assemble it into simple HTML and push it into the TipTap editor.
  const handleVoiceFieldsUpdated = (fields: Record<string, string>) => {
    const parts: string[] = [];
    if (fields.title) parts.push(`<h1>${escapeHtml(fields.title)}</h1>`);
    if (fields.topic) parts.push(`<p><em>${escapeHtml(fields.topic)}</em></p>`);
    if (fields.body) {
      const paragraphs = fields.body
        .split('\n')
        .filter((p) => p.trim())
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('');
      parts.push(paragraphs);
    }
    editorRef.current?.applyVoiceContent(parts.join(''));

    if (fields.title && fields.title !== docTitle) {
      handleTitleChange(fields.title);
    }
  };

  if (!isReady) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading document...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">Error: {error}</p>
          <p className="text-sm text-slate-500 mb-4">
            Make sure the backend is running (docker compose up).
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <input
            type="text"
            value={docTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-lg font-bold text-slate-800 bg-transparent border-none outline-none text-center focus:ring-2 focus:ring-blue-200 rounded-lg px-3 py-1 transition-all max-w-xs truncate"
            placeholder="Name your document..."
          />

          <button
            onClick={() => setShowVoiceModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all shadow-sm"
            title="Write this document by speaking"
          >
            <Mic className="w-4 h-4" />
            Fill by Voice
          </button>
        </div>
      </div>

      <div className="grow">
        <DocumentEditor ref={editorRef} documentId={documentId} title={docTitle} />
      </div>

      <VoiceGenerateModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        documentType="document-report"
        onFieldsUpdated={handleVoiceFieldsUpdated}
      />
    </main>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </main>
    }>
      <DocumentsPageContent />
    </Suspense>
  );
}