'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/app/lib/api';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (text: string) => void;
  /** 'generate' = letter body (plain text). 'generate-document' = full HTML document. */
  mode?: 'generate' | 'generate-document';
  title?: string;
  subtitle?: string;
  placeholder?: string;
}

export default function AIGenerateModal({
  isOpen,
  onClose,
  onGenerated,
  mode = 'generate',
  title,
  subtitle,
  placeholder,
}: AIGenerateModalProps) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isDocumentMode = mode === 'generate-document';

  const defaultTitle = isDocumentMode ? 'AI Document Writer' : 'AI Letter Generator';
  const defaultSubtitle = isDocumentMode
    ? "Tell me what you're writing about — I'll write the whole thing."
    : "Give me your notes, I'll write the letter.";
  const defaultPlaceholder = isDocumentMode
    ? 'e.g., I am writing a report about a flood that affected my district in April 2026. Cover the causes, the impact on residents, the emergency response, and recommendations going forward.'
    : "e.g., I am resigning from Tech Corp. My last day is July 1st. I got a better offer. I want to thank my manager, Sarah, for the opportunities.";

  const handleGenerate = async () => {
    if (!notes.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await api.generate({
        prompt: notes,
        mode: mode,
      });

      setIsLoading(false);

      if (result.success && result.text) {
        onGenerated(result.text);
        setNotes(''); // Clear for next time
        onClose();
      } else {
        setError(result.error || 'Failed to generate. Please check your API key and try again.');
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title || defaultTitle}</h3>
            <p className="text-sm text-slate-500">{subtitle || defaultSubtitle}</p>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          className="w-full p-3 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
        />

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            Cancel
          </button>
          <button 
            onClick={handleGenerate} 
            disabled={isLoading || !notes.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoading ? 'Writing...' : isDocumentMode ? 'Write Document' : 'Generate Letter'}
          </button>
        </div>
      </div>
    </div>
  );
}