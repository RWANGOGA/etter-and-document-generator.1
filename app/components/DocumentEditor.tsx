'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import {
  Bold, Italic, List, Heading1, Heading2, Sparkles, Loader2,
  Underline as UnderlineIcon, Palette, Stamp, X, Printer,
  RotateCcw, Image as ImageIcon, ChevronDown, PenLine, Wand2,
  Download, FileText, FileType, FileCode, MessageSquare
} from 'lucide-react';
import { SlashCommand } from './editor/SlashCommandExtension';
import { generateLetterContent } from '@/app/actions/aiActions';
import AIGenerateModal from './AIGenerateModal';
import AIChatPanel from './AIChatPanel';
import { generateDocumentWord } from '@/app/lib/documentWordExport';
import { saveDocument, loadDocument, deleteDocument } from '@/app/lib/documentStorage';
import { api, downloadBlob } from '@/app/lib/api';
import type { DocumentRecord } from '@/app/types/document';

interface DocumentEditorProps {
  documentId: string;
  title: string;
}

export interface DocumentEditorHandle {
  applyVoiceContent: (html: string) => void;
}

const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(function DocumentEditor(
  { documentId, title },
  ref
) {
  const router = useRouter();
  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);
  const [continueError, setContinueError] = useState('');
  const [showAIDocModal, setShowAIDocModal] = useState(false);
  const [showAIChatPanel, setShowAIChatPanel] = useState(false);
  const [theme, setTheme] = useState('academic');

  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [initialHtml, setInitialHtml] = useState('<p></p>');
  const [watermark, setWatermark] = useState('');
  const [showWatermarkInput, setShowWatermarkInput] = useState(false);

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [isDownloadingLatex, setIsDownloadingLatex] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadDocument(documentId).then((doc) => {
      if (cancelled) return;
      if (doc && doc.content.kind === 'freeform') {
        setInitialHtml(doc.content.html);
        setWatermark(doc.content.watermark || '');
      }
      setIsLoadingDoc(false);
    }).catch((err) => {
      console.error('Failed to load document:', err);
      setIsLoadingDoc(false);
    });
    return () => { cancelled = true; };
  }, [documentId]);

  const persist = (html: string, wm: string) => {
    saveDocument({
      id: documentId,
      title,
      content: { kind: 'freeform', html, watermark: wm },
    } as any).catch((err) => console.error('Failed to save document:', err));
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'Type "/" to see commands, or just start typing...' }),
      SlashCommand,
      Underline,
      TextStyle,
      Color,
      Image,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        spellcheck: 'true',
        autocorrect: 'on',
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[800px] p-12 font-serif text-slate-800 leading-relaxed relative z-10',
      },
    },
    onUpdate: ({ editor }) => {
      persist(editor.getHTML(), watermark);
    },
  });

  useEffect(() => {
    if (editor) {
      persist(editor.getHTML(), watermark);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watermark]);

  useImperativeHandle(ref, () => ({
    applyVoiceContent: (html: string) => {
      if (!editor) return;
      const hasExistingContent = editor.getText().trim().length > 0;
      if (hasExistingContent) {
        const confirmed = window.confirm(
          'This will add the voice-generated content to your document. Continue?'
        );
        if (!confirmed) return;
      }
      editor.commands.setContent(html);
      persist(editor.getHTML(), watermark);
    },
  }));

  // Render any Mermaid diagram blocks the AI has inserted into the document
  useEffect(() => {
    if (!editor) return;
    import('mermaid').then((mermaidModule) => {
      const mermaid = mermaidModule.default;
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
      const nodes = document.querySelectorAll('pre.mermaid:not([data-processed])');
      nodes.forEach(async (node, i) => {
        const code = node.textContent || '';
        if (!code.trim()) return;
        try {
          const { svg } = await mermaid.render(`mermaid-diagram-${Date.now()}-${i}`, code);
          node.innerHTML = svg;
          node.setAttribute('data-processed', 'true');
        } catch (err) {
          console.error('Mermaid render error:', err);
        }
      });
    });
  }, [editor?.getHTML()]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoadingDoc || !editor) {
    return <div className="p-12 text-slate-500 flex items-center justify-center h-full">Loading document...</div>;
  }

  const handleFixGrammar = async () => {
    const currentText = editor.getText();
    setFixError('');

    if (!currentText.trim()) {
      setFixError('Nothing to fix — the document is empty.');
      return;
    }

    setIsFixing(true);
    try {
      const result = await generateLetterContent('', 'fix-grammar', currentText);
      if (result.success && result.text) {
        editor.commands.setContent(result.text);
      } else {
        setFixError(result.text || 'AI Fix Grammar failed for an unknown reason.');
      }
    } catch (err) {
      console.error('handleFixGrammar unexpected error:', err);
      setFixError('Unexpected error while contacting the AI. Check the terminal logs.');
    } finally {
      setIsFixing(false);
    }
  };

  const handleDocumentGenerated = (html: string) => {
    const hasExistingContent = editor.getText().trim().length > 0;
    if (hasExistingContent) {
      const confirmed = window.confirm(
        'This will replace the current document content with the AI-written document. Continue?'
      );
      if (!confirmed) return;
    }
    editor.commands.setContent(html);
    persist(editor.getHTML(), watermark);
  };

  const handleContinueWriting = async () => {
    const currentText = editor.getText();
    setContinueError('');

    if (!currentText.trim()) {
      setContinueError('Start writing a sentence or two first, then I can continue from there — or use "AI Write Document" to start from scratch.');
      return;
    }

    setIsContinuing(true);
    try {
      const result = await generateLetterContent('', 'continue', editor.getHTML());
      if (result.success && result.text) {
        editor.chain().focus('end').insertContent(result.text).run();
        persist(editor.getHTML(), watermark);
      } else {
        setContinueError(result.text || 'AI could not continue the document.');
      }
    } catch (err) {
      console.error('handleContinueWriting unexpected error:', err);
      setContinueError('Unexpected error while contacting the AI. Check the terminal logs.');
    } finally {
      setIsContinuing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setDownloadError('');
    setIsDownloadingPDF(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('document.pdf');
    } catch (err) {
      console.error('handleDownloadPDF error:', err);
      setDownloadError('Could not generate the PDF. Check the terminal/browser console for details.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadWordClick = async () => {
    setDownloadError('');
    setIsDownloadingWord(true);
    try {
      await generateDocumentWord(editor.getHTML(), watermark);
    } catch (err) {
      console.error('handleDownloadWordClick error:', err);
      setDownloadError('Could not generate the Word document. Check the terminal/browser console for details.');
    } finally {
      setIsDownloadingWord(false);
    }
  };

  const handleDownloadLatexPDF = async () => {
    setDownloadError('');
    setIsDownloadingLatex(true);
    try {
      const blob = await api.convert.documentLatexPdf(title, '', editor.getHTML());
      downloadBlob(blob, `${title || 'Document'}_LaTeX.pdf`);
    } catch (err) {
      console.error('LaTeX PDF error:', err);
      setDownloadError('Could not generate LaTeX PDF. Check that the backend is running.');
    } finally {
      setIsDownloadingLatex(false);
    }
  };

  const handleClearDocument = () => {
    if (window.confirm('Are you sure? This will delete your current document and start fresh.')) {
      deleteDocument(documentId)
        .then(() => {
          router.push('/documents');
        })
        .catch((err) => {
          console.error('Failed to delete document:', err);
        });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const btnClass = (active: boolean) => `p-2 rounded-lg transition-colors ${active ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <AIGenerateModal
        isOpen={showAIDocModal}
        onClose={() => setShowAIDocModal(false)}
        onGenerated={handleDocumentGenerated}
        mode="generate-document"
      />

      <AIChatPanel
        isOpen={showAIChatPanel}
        onClose={() => setShowAIChatPanel(false)}
        onDocumentReady={(html) => {
          handleDocumentGenerated(html);
          setShowAIChatPanel(false);
        }}
      />

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 p-2 flex gap-1 rounded-t-xl shadow-sm flex-wrap items-center">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold"><Bold className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic"><Italic className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline"><UnderlineIcon className="w-4 h-4" /></button>

        <div className="relative group">
          <button className={btnClass(false)} title="Text Color"><Palette className="w-4 h-4" /></button>
          <input type="color" onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} value={editor.getAttributes('textStyle').color || '#000000'} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
        </div>

        <div className="w-px bg-slate-200 mx-1 h-6"></div>

        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1"><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2"><Heading2 className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List"><List className="w-4 h-4" /></button>

        <button onClick={() => fileInputRef.current?.click()} className={btnClass(false)} title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="flex-grow"></div>

        <div className="relative">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3 py-1.5 pr-8 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
          >
            <option value="academic">🎓 Academic</option>
            <option value="modern">💼 Modern Business</option>
            <option value="minimalist">✨ Minimalist</option>
            <option value="book">📚 Book / LaTeX</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
        </div>

        <button onClick={handleClearDocument} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors" title="Clear Document">
          <RotateCcw className="w-3.5 h-3.5" />
          New
        </button>

        <button onClick={() => setShowWatermarkInput(!showWatermarkInput)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${watermark ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'}`} title="Add Watermark">
          <Stamp className="w-3.5 h-3.5" />
          {watermark ? 'Edit Watermark' : 'Watermark'}
        </button>

        <div className="relative" ref={downloadMenuRef}>
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
            title="Download this document"
          >
            <Download className="w-3.5 h-3.5" />
            Download
            <ChevronDown className="w-3 h-3" />
          </button>

          {showDownloadMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 overflow-hidden">
              <button
                onClick={() => { setShowDownloadMenu(false); handleDownloadPDF(); }}
                disabled={isDownloadingPDF}
                className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
              >
                {isDownloadingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                {isDownloadingPDF ? 'Preparing PDF...' : 'Download as PDF'}
              </button>
              <button
                onClick={() => { setShowDownloadMenu(false); handleDownloadWordClick(); }}
                disabled={isDownloadingWord}
                className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 border-t border-slate-100"
              >
                {isDownloadingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileType className="w-3.5 h-3.5" />}
                {isDownloadingWord ? 'Preparing Word...' : 'Download as Word (.docx)'}
              </button>
              <button
                onClick={() => { setShowDownloadMenu(false); handleDownloadLatexPDF(); }}
                disabled={isDownloadingLatex}
                className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 border-t border-slate-100"
              >
                {isDownloadingLatex ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCode className="w-3.5 h-3.5" />}
                {isDownloadingLatex ? 'Compiling...' : 'Download LaTeX PDF'}
              </button>
              <button
                onClick={() => { setShowDownloadMenu(false); handlePrint(); }}
                className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
              >
                <Printer className="w-3.5 h-3.5" />
                Print (Browser)
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAIChatPanel(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 rounded-lg hover:bg-purple-800 transition-all shadow-sm"
          title="Chat with AI to build your document"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          AI Chat
        </button>

        <button
          onClick={() => setShowAIDocModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all shadow-sm"
          title="Let AI write the full document for you"
        >
          <Wand2 className="w-3.5 h-3.5" />
          AI Write Document
        </button>

        <button
          onClick={handleContinueWriting}
          disabled={isContinuing || !editor.getText().trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="AI continues writing from where you left off"
        >
          {isContinuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
          {isContinuing ? 'Writing...' : 'Continue Writing'}
        </button>

        <button onClick={handleFixGrammar} disabled={isFixing || !editor.getText().trim()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isFixing ? 'Fixing...' : 'AI Fix Grammar'}
        </button>
      </div>

      {fixError && (
        <div className="no-print bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-red-600 font-medium">{fixError}</p>
          <button onClick={() => setFixError('')} className="p-1 text-red-500 hover:bg-red-100 rounded" title="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {continueError && (
        <div className="no-print bg-indigo-50 border-b border-indigo-200 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-indigo-700 font-medium">{continueError}</p>
          <button onClick={() => setContinueError('')} className="p-1 text-indigo-500 hover:bg-indigo-100 rounded" title="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {downloadError && (
        <div className="no-print bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-red-600 font-medium">{downloadError}</p>
          <button onClick={() => setDownloadError('')} className="p-1 text-red-500 hover:bg-red-100 rounded" title="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showWatermarkInput && (
        <div className="no-print bg-amber-50 border-b border-amber-200 p-3 flex items-center gap-3 animate-in slide-in-from-top-2">
          <Stamp className="w-4 h-4 text-amber-600" />
          <input type="text" value={watermark} onChange={(e) => setWatermark(e.target.value.toUpperCase())} placeholder="e.g., DRAFT, CONFIDENTIAL" className="flex-grow bg-white border border-amber-300 rounded px-3 py-1.5 text-sm font-bold text-amber-800 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase" autoFocus />
          <button onClick={() => { setWatermark(''); setShowWatermarkInput(false); }} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg" title="Remove Watermark"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white shadow-lg border border-slate-200 rounded-b-xl flex-grow overflow-y-auto relative">
        <div ref={printAreaRef} className={`print-area w-full min-h-full p-12 relative ${theme === 'book' ? 'bg-[#fdfbf3]' : 'bg-white'}`}>
          {watermark && (
            <div className="watermark-layer absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
              <span className="text-8xl md:text-9xl font-black text-slate-300/70 rotate-[-35deg] select-none whitespace-nowrap tracking-widest">
                {watermark}
              </span>
            </div>
          )}

          <div className={`relative z-10 ${
            theme === 'academic' ? 'theme-academic' :
            theme === 'modern' ? 'theme-modern' :
            theme === 'book' ? 'theme-book' :
            'theme-minimalist'
          }`}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .watermark-layer,
        .watermark-layer * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          @page { size: A4; margin: 18mm; }
        }

        .theme-academic h1 { font-size: 2rem; font-weight: 700; color: #1e3a5f; margin-bottom: 0.75rem; line-height: 1.25; }
        .theme-academic h2 { font-size: 1.5rem; font-weight: 600; color: #2b4a6f; margin-top: 1.75rem; margin-bottom: 0.5rem; }
        .theme-academic h3 { font-size: 1.2rem; font-weight: 600; color: #3a5a7f; margin-top: 1.25rem; margin-bottom: 0.4rem; }
        .theme-academic p { color: #374151; line-height: 1.8; margin-bottom: 1rem; }
        .theme-academic ul, .theme-academic ol { color: #374151; line-height: 1.8; padding-left: 1.5rem; margin-bottom: 1rem; }
        .theme-academic blockquote { border-left: 3px solid #cbd5e1; padding-left: 1rem; color: #64748b; font-style: italic; margin: 1rem 0; }

        .theme-modern .ProseMirror { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important; }
        .theme-modern h1 { font-size: 2.1rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
        .theme-modern h2 { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin-top: 1.75rem; margin-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.25rem; }
        .theme-modern h3 { font-size: 1.1rem; font-weight: 700; color: #334155; margin-top: 1.25rem; margin-bottom: 0.4rem; }
        .theme-modern p { color: #334155; line-height: 1.75; margin-bottom: 1rem; }
        .theme-modern ul, .theme-modern ol { color: #334155; line-height: 1.75; padding-left: 1.5rem; margin-bottom: 1rem; }
        .theme-modern blockquote { border-left: 3px solid #94a3b8; padding-left: 1rem; color: #475569; font-style: italic; margin: 1rem 0; }

        .theme-minimalist h1 { font-size: 1.8rem; font-weight: 600; color: #18181b; margin-bottom: 0.6rem; }
        .theme-minimalist h2 { font-size: 1.3rem; font-weight: 500; color: #3f3f46; margin-top: 1.5rem; margin-bottom: 0.4rem; }
        .theme-minimalist h3 { font-size: 1.05rem; font-weight: 500; color: #52525b; margin-top: 1rem; margin-bottom: 0.3rem; }
        .theme-minimalist p { color: #52525b; line-height: 1.9; margin-bottom: 1rem; }
        .theme-minimalist ul, .theme-minimalist ol { color: #52525b; line-height: 1.9; padding-left: 1.4rem; margin-bottom: 1rem; }
        .theme-minimalist blockquote { border-left: 2px solid #d4d4d8; padding-left: 1rem; color: #71717a; font-style: italic; margin: 1rem 0; }

        .theme-book .ProseMirror { font-family: Georgia, 'Times New Roman', serif !important; color: #262220; }
        .theme-book { counter-reset: book-h2; }
        .theme-book h1 {
          text-align: center;
          font-variant: small-caps;
          letter-spacing: 0.06em;
          font-size: 2.1rem;
          font-weight: 700;
          color: #1c1a17;
          margin: 0 0 2rem 0;
          padding-bottom: 1rem;
          border-bottom: 1px solid #d6cfc0;
        }
        .theme-book h2 {
          counter-increment: book-h2;
          counter-reset: book-h3;
          font-size: 1.4rem;
          font-weight: 600;
          color: #3a2f1e;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .theme-book h2::before { content: counter(book-h2) ".  "; color: #8a6d3b; }
        .theme-book h3 {
          counter-increment: book-h3;
          font-size: 1.15rem;
          font-weight: 600;
          color: #4a3d28;
          margin-top: 1.4rem;
          margin-bottom: 0.5rem;
        }
        .theme-book h3::before { content: counter(book-h2) "." counter(book-h3) "  "; color: #8a6d3b; }
        .theme-book p {
          text-align: justify;
          hyphens: auto;
          text-indent: 1.5em;
          line-height: 1.9;
          color: #2c2620;
          margin-bottom: 0;
        }
        .theme-book p:first-of-type { text-indent: 0; }
        .theme-book p:first-of-type::first-letter {
          float: left;
          font-size: 3.6em;
          line-height: 0.85;
          font-weight: 700;
          padding-right: 0.08em;
          padding-top: 0.02em;
          color: #7c4a1e;
        }
        .theme-book ul, .theme-book ol { line-height: 1.9; color: #2c2620; padding-left: 1.6rem; margin-bottom: 1rem; }
        .theme-book blockquote {
          border-left: 3px solid #b9a67c;
          padding-left: 1rem;
          color: #5c4f3a;
          font-style: italic;
          margin: 1rem 0;
        }

        pre.mermaid {
          background: transparent;
          border: none;
          padding: 1rem 0;
          text-align: center;
          overflow-x: auto;
        }
        pre.mermaid svg {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
});

export default DocumentEditor;