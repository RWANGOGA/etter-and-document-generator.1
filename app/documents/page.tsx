'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DocumentEditor from '@/app/components/DocumentEditor';

export default function DocumentsPage() {
  // 1. Initialize title from localStorage if it exists, otherwise 'Untitled Document'
  const [docTitle, setDocTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('doc-title') || 'Untitled Document';
    }
    return 'Untitled Document';
  });

  // 2. Auto-save the title whenever it changes
  useEffect(() => {
    localStorage.setItem('doc-title', docTitle);
  }, [docTitle]);

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
            onChange={(e) => setDocTitle(e.target.value)}
            className="text-lg font-bold text-slate-800 bg-transparent border-none outline-none text-center focus:ring-2 focus:ring-blue-200 rounded-lg px-3 py-1 transition-all max-w-xs truncate"
            placeholder="Name your document..."
          />

          <div className="w-16"></div> {/* Spacer for balance */ }
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-grow">
        <DocumentEditor />
      </div>
      
    </main>
  );
}