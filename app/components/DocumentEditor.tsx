'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { Bold, Italic, List, Heading1, Heading2, Sparkles, Loader2, Underline as UnderlineIcon, Palette, Stamp, X, Download, RotateCcw } from 'lucide-react';
import { SlashCommand } from './editor/SlashCommandExtension';
import { generateLetterContent } from '@/app/actions/aiActions';

export default function DocumentEditor() {
  const [isFixing, setIsFixing] = useState(false);
  
  // 1. Initialize watermark from localStorage
  const [watermark, setWatermark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('doc-watermark') || '';
    }
    return '';
  });
  const [showWatermarkInput, setShowWatermarkInput] = useState(false);
  
  const exportRef = useRef<HTMLDivElement>(null);

  // 2. Get saved content for initial load
  const savedContent = typeof window !== 'undefined' ? localStorage.getItem('doc-content') : null;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'Type "/" to see commands, or just start typing...' }),
      SlashCommand,
      TextStyle,
      Color,
    ],
    // 3. Load saved content on startup
    content: savedContent || '<p></p>',
    editorProps: {
      attributes: {
        spellcheck: 'true', 
        autocorrect: 'on',
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[800px] p-12 font-serif text-slate-800 leading-relaxed relative z-10',
      },
    },
    // 4. Auto-save content EVERY time the user types or formats
    onUpdate: ({ editor }) => {
      localStorage.setItem('doc-content', editor.getHTML());
    },
  });

  // 5. Auto-save watermark whenever it changes
  useEffect(() => {
    localStorage.setItem('doc-watermark', watermark);
  }, [watermark]);

  if (!editor) return null;

  const handleFixGrammar = async () => {
    const currentText = editor.getText();
    if (!currentText.trim()) return;
    setIsFixing(true);
    const result = await generateLetterContent('', 'fix-grammar', currentText);
    if (result.success && result.text) editor.commands.setContent(result.text);
    setIsFixing(false);
  };

  const handleDownloadPDF = async () => {
    if (!exportRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const element = exportRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } as any;

    html2pdf().set(opt).from(element).save();
  };

  // 6. Function to clear all saved data (Start Fresh)
  const handleClearDocument = () => {
    if (window.confirm('Are you sure? This will delete your current document and start fresh.')) {
      localStorage.removeItem('doc-title');
      localStorage.removeItem('doc-content');
      localStorage.removeItem('doc-watermark');
      window.location.reload(); // Reload to reset everything
    }
  };

  const btnClass = (active: boolean) => `p-2 rounded-lg transition-colors ${active ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 p-2 flex gap-1 rounded-t-xl shadow-sm flex-wrap items-center">
        
        {/* Text Styles */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold"><Bold className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic"><Italic className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline"><UnderlineIcon className="w-4 h-4" /></button>
        
        {/* Color Picker */}
        <div className="relative group">
          <button className={btnClass(false)} title="Text Color"><Palette className="w-4 h-4" /></button>
          <input type="color" onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} value={editor.getAttributes('textStyle').color || '#000000'} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
        </div>

        <div className="w-px bg-slate-200 mx-1 h-6"></div>

        {/* Headings & Lists */}
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1"><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2"><Heading2 className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List"><List className="w-4 h-4" /></button>

        <div className="flex-grow"></div>

        {/* NEW: Start Fresh Button */}
        <button onClick={handleClearDocument} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors" title="Clear Document">
          <RotateCcw className="w-3.5 h-3.5" />
          New
        </button>

        {/* Watermark Button */}
        <button onClick={() => setShowWatermarkInput(!showWatermarkInput)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${watermark ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'}`} title="Add Watermark">
          <Stamp className="w-3.5 h-3.5" />
          {watermark ? 'Edit Watermark' : 'Watermark'}
        </button>

        {/* PDF Download Button */}
        <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm" title="Download as PDF">
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>

        {/* AI Fix Grammar Button */}
        <button onClick={handleFixGrammar} disabled={isFixing || !editor.getText().trim()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isFixing ? 'Fixing...' : 'AI Fix Grammar'}
        </button>
      </div>

      {/* Watermark Input Bar */}
      {showWatermarkInput && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center gap-3 animate-in slide-in-from-top-2">
          <Stamp className="w-4 h-4 text-amber-600" />
          <input type="text" value={watermark} onChange={(e) => setWatermark(e.target.value.toUpperCase())} placeholder="e.g., DRAFT, CONFIDENTIAL" className="flex-grow bg-white border border-amber-300 rounded px-3 py-1.5 text-sm font-bold text-amber-800 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase" autoFocus />
          <button onClick={() => { setWatermark(''); setShowWatermarkInput(false); }} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg" title="Remove Watermark"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* The "A4 Paper" Typing Area + Export Wrapper */}
      <div className="bg-white shadow-lg border border-slate-200 rounded-b-xl flex-grow overflow-y-auto relative">
        <div ref={exportRef} className="bg-white w-full min-h-full p-12 relative">
          {watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
              <span className="text-8xl md:text-9xl font-black text-slate-200 opacity-60 rotate-[-35deg] select-none whitespace-nowrap tracking-widest">
                {watermark}
              </span>
            </div>
          )}
          <div className="relative z-10">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}