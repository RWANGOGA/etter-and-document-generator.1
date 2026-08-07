'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, File, FileCode, Mic } from 'lucide-react';
import dynamic from 'next/dynamic';
const PDFDownloadLink = dynamic(
  async () => {
    const mod = await import('@react-pdf/renderer');
    return mod.PDFDownloadLink;
  },
  { ssr: false }
);
import LetterForm from '@/app/components/LetterForm';
import LetterPreview, { LetterData } from '@/app/components/LetterPreview';
import LetterPDF from '@/app/components/LetterPDF';
import { generateLetterWord } from './generateWord';
import { api, downloadBlob } from '@/app/lib/api';
import VoiceGenerateModal from '@/app/components/VoiceGenerateModal';
import type { DocumentRecord } from '@/app/types/document';

const EMPTY_LETTER: LetterData = {
  senderName: '', senderAddress: '', senderCity: '', senderEmail: '', senderPhone: '',
  recipientName: '', recipientTitle: '', recipientCompany: '', recipientAddress: '', recipientCity: '',
  date: new Date().toISOString().split('T')[0], subject: '', body: '',
};

function EditorPageContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');
  const letterTypeParam = searchParams.get('letter') || 'General Letter';
  const layoutParam = (searchParams.get('layout') || 'block') as 'block' | 'modified-block' | 'simplified';
  const shouldStartVoice = searchParams.get('voice') === '1';

  const [documentId, setDocumentId] = useState<string>(docId || '');
  const [letterType, setLetterType] = useState(letterTypeParam);
  const [letterData, setLetterData] = useState<LetterData>(EMPTY_LETTER);
  const [isLoading, setIsLoading] = useState(!!docId);
  const [isDownloadingLatex, setIsDownloadingLatex] = useState(false);
  const [latexError, setLatexError] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(shouldStartVoice);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load existing letter if an id is present
  useEffect(() => {
    if (!docId) return;
    setIsLoading(true);
    api.documents.get(docId)
      .then((doc) => {
        if (doc.content.kind === 'letter') {
          setLetterData(doc.content.data);
          setLetterType(doc.content.letterType);
        }
        setDocumentId(doc.id);
      })
      .catch((err) => {
        console.error('Failed to load letter:', err);
      })
      .finally(() => setIsLoading(false));
  }, [docId]);

  // Debounced save whenever letterData changes
  useEffect(() => {
    if (isLoading) return; // don't save while still loading initial data
    const timeout = setTimeout(() => {
      persistLetter();
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterData, layoutParam]);

  const persistLetter = async () => {
    setSaveStatus('saving');
    const content = {
      kind: 'letter' as const,
      layout: layoutParam,
      letterType,
      data: letterData,
    };

    try {
      if (documentId) {
        await api.documents.update(documentId, {
          title: letterData.senderName ? `${letterType} — ${letterData.senderName}` : letterType,
          content,
        });
      } else {
        const created = await api.documents.create({
          type: 'letter',
          title: letterType,
          content,
        });
        setDocumentId(created.id);
        window.history.replaceState(null, '', `/editor?id=${created.id}&letter=${encodeURIComponent(letterType)}&layout=${layoutParam}`);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save letter:', err);
      setSaveStatus('idle');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLetterData(prev => ({ ...prev, [name]: value }));
  };

  const memoizedPdfDocument = useMemo(() => {
    return <LetterPDF data={letterData} layout={layoutParam} />;
  }, [letterData, layoutParam]);

  const handleDownloadWord = () => {
    generateLetterWord(letterData, layoutParam);
  };

  const handleDownloadLatexPDF = async () => {
    setLatexError('');
    setIsDownloadingLatex(true);
    try {
      const blob = await api.convert.letterLatexPdf(letterData, layoutParam);
      downloadBlob(blob, `${letterData.senderName || 'Letter'}_LaTeX.pdf`);
    } catch (err) {
      console.error('LaTeX PDF error:', err);
      setLatexError(err instanceof Error ? err.message : 'LaTeX PDF generation failed');
    } finally {
      setIsDownloadingLatex(false);
    }
  };

  const handleVoiceFieldsUpdated = (fields: Record<string, string>) => {
    setLetterData(prev => ({ ...prev, ...fields }));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading letter...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">

      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center flex-wrap gap-2">

          <div className="flex items-center gap-4">
            <Link href="/generator" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Change Type</span>
            </Link>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-slate-800">{letterType}</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wide hidden md:block">
                {layoutParam} Layout
                {saveStatus === 'saving' && <span className="ml-2 text-amber-500 normal-case">Saving...</span>}
                {saveStatus === 'saved' && <span className="ml-2 text-green-600 normal-case">Saved</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all shadow-sm"
              title="Fill this letter by speaking"
            >
              <Mic className="w-4 h-4" />
              Fill by Voice
            </button>

            <PDFDownloadLink
              document={memoizedPdfDocument}
              fileName={`${letterData.senderName || 'Letter'}_FormalLetter.pdf`}
            >
              {({ loading }) => (
                <button
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  {loading ? 'Preparing...' : 'Download PDF'}
                </button>
              )}
            </PDFDownloadLink>

            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
            >
              <File className="w-4 h-4" />
              Download Word
            </button>

            <button
              onClick={handleDownloadLatexPDF}
              disabled={isDownloadingLatex}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-all shadow-sm disabled:opacity-50"
              title="Typeset with LaTeX for a publication-quality PDF"
            >
              <FileCode className="w-4 h-4" />
              {isDownloadingLatex ? 'Compiling...' : 'LaTeX PDF'}
            </button>
          </div>
        </div>

        {latexError && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pb-2">
            <p className="text-xs text-red-600">{latexError}</p>
          </div>
        )}
      </div>

      <div className="grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <div className="h-[80vh]">
            <LetterForm data={letterData} onChange={handleChange} />
          </div>
          <div className="h-[80vh] overflow-y-auto">
            <LetterPreview layout={layoutParam} data={letterData} />
          </div>
        </div>
      </div>

      <VoiceGenerateModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        documentType="letter-general"
        onFieldsUpdated={handleVoiceFieldsUpdated}
      />
    </main>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorPageContent />
    </Suspense>
  );
}