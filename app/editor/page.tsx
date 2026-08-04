'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, File } from 'lucide-react';
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

function EditorPageContent() {
  const searchParams = useSearchParams();
  const letterType = searchParams.get('letter') || 'General Letter';
  const layoutParam = (searchParams.get('layout') || 'block') as 'block' | 'modified-block' | 'simplified';

  const [letterData, setLetterData] = useState<LetterData>({
    senderName: '', senderAddress: '', senderCity: '', senderEmail: '', senderPhone: '',
    recipientName: '', recipientTitle: '', recipientCompany: '', recipientAddress: '', recipientCity: '',
    date: new Date().toISOString().split('T')[0], subject: '', body: '',
  });

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

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* TOP ACTION BAR */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          
          {/* Left: Back Button & Title */}
          <div className="flex items-center gap-4">
            <Link href="/generator" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Change Type</span>
            </Link>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-slate-800">{letterType}</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wide hidden md:block">{layoutParam} Layout</p>
            </div>
          </div>

          {/* Right: Download Buttons */}
          <div className="flex items-center gap-3">
            
            {/* PDF Download Button */}
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

            {/* Word Download Button */}
            <button 
              onClick={handleDownloadWord}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
            >
              <File className="w-4 h-4" />
              Download Word
            </button>

          </div>
        </div>
      </div>

      {/* SPLIT SCREEN EDITOR */}
      <div className="grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          
          {/* LEFT SIDE: The Input Form */}
          <div className="h-[80vh]">
            <LetterForm data={letterData} onChange={handleChange} />
          </div>

          {/* RIGHT SIDE: The Live Preview */}
          <div className="h-[80vh] overflow-y-auto">
            <LetterPreview layout={layoutParam} data={letterData} />
          </div>

        </div>
      </div>
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