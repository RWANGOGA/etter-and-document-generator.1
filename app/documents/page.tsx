'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DocumentEditor from '@/app/components/DocumentEditor';
import { api } from '@/app/lib/api';

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const [documentId, setDocumentId] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Untitled Document');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initialize documentId from URL param or create new one
  useEffect(() => {
    const initializeDocument = async () => {
      try {
        const urlId = searchParams.get('id');
        
        if (urlId) {
          // Load existing document
          const doc = await api.documents.get(urlId);
          setDocumentId(doc.id);
          setDocTitle(doc.title);
        } else {
          // Create new document
          const newDoc = await api.documents.create({
            type: 'freeform',
            title: 'Untitled Document',
            content: {
              kind: 'freeform',
              html: '<p></p>',
            },
          });
          setDocumentId(newDoc.id);
          setDocTitle(newDoc.title);
          // Update URL with new document ID
          window.history.replaceState(
            null,
            '',
            `/documents?id=${newDoc.id}`
          );
        }
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setIsReady(true);
      }
    };

    if (typeof window !== 'undefined') {
      initializeDocument();
    }
  }, [searchParams]);

  // 2. Save title changes to the document record
  const handleTitleChange = async (newTitle: string) => {
    setDocTitle(newTitle);

    if (documentId) {
      try {
        await api.documents.update(documentId, { title: newTitle });
      } catch (err) {
        console.error('Failed to update document title:', err);
        setError(err instanceof Error ? err.message : 'Failed to save title');
      }
    }
  };

  if (!isReady || !documentId) {
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
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* EDITABLE TITLE INPUT */}
          <input
            type="text"
            value={docTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-lg font-bold text-slate-800 bg-transparent border-none outline-none text-center focus:ring-2 focus:ring-blue-200 rounded-lg px-3 py-1 transition-all max-w-xs truncate"
            placeholder="Name your document..."
          />

          <div className="w-16"></div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="grow">
        <DocumentEditor documentId={documentId} title={docTitle} />
      </div>
    </main>
  );
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