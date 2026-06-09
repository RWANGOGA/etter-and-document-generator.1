'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image'; 
// 1. Fixed the import: Added ChevronDown to the list of icons
import { 
  Bold, Italic, List, Heading1, Heading2, Sparkles, Loader2, 
  Underline as UnderlineIcon, Palette, Stamp, X, Printer, 
  RotateCcw, Image as ImageIcon, ChevronDown 
} from 'lucide-react';
import { SlashCommand } from './editor/SlashCommandExtension';
import { generateLetterContent } from '@/app/actions/aiActions';

export default function DocumentEditor() {
  const [isFixing, setIsFixing] = useState(false);
  const [theme, setTheme] = useState('academic'); // Default to Academic
  const [watermark, setWatermark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('doc-watermark') || '';
    }
    return '';
  });
  const [showWatermarkInput, setShowWatermarkInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedContent = typeof window !== 'undefined' ? localStorage.getItem('doc-content') : null;

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
    content: savedContent || '<p></p>',
    editorProps: {
      attributes: {
        spellcheck: 'true', 
        autocorrect: 'on',
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[800px] p-12 font-serif text-slate-800 leading-relaxed relative z-10',
      },
    },
    onUpdate: ({ editor }) => {
      localStorage.setItem('doc-content', editor.getHTML());
    },
  });

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

  const handlePrint = () => {
    window.print();
  };

  const handleClearDocument = () => {
    if (window.confirm('Are you sure? This will delete your current document and start fresh.')) {
      localStorage.removeItem('doc-title');
      localStorage.removeItem('doc-content');
      localStorage.removeItem('doc-watermark');
      window.location.reload();
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

        {/* THEME SWITCHER */}
        <div className="relative">
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3 py-1.5 pr-8 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
          >
            <option value="academic">🎓 Academic</option>
            <option value="modern">💼 Modern Business</option>
            <option value="minimalist">✨ Minimalist</option>
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

        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm" title="Save as PDF">
          <Printer className="w-3.5 h-3.5" />
          Save as PDF
        </button>

        <button onClick={handleFixGrammar} disabled={isFixing || !editor.getText().trim()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isFixing ? 'Fixing...' : 'AI Fix Grammar'}
        </button>
      </div>

      {/* Watermark Input Bar */}
      {showWatermarkInput && (
        <div className="no-print bg-amber-50 border-b border-amber-200 p-3 flex items-center gap-3 animate-in slide-in-from-top-2">
          <Stamp className="w-4 h-4 text-amber-600" />
          <input type="text" value={watermark} onChange={(e) => setWatermark(e.target.value.toUpperCase())} placeholder="e.g., DRAFT, CONFIDENTIAL" className="flex-grow bg-white border border-amber-300 rounded px-3 py-1.5 text-sm font-bold text-amber-800 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase" autoFocus />
          <button onClick={() => { setWatermark(''); setShowWatermarkInput(false); }} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg" title="Remove Watermark"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* The "A4 Paper" Typing Area */}
      <div className="bg-white shadow-lg border border-slate-200 rounded-b-xl flex-grow overflow-y-auto relative">
        <div className="print-area bg-white w-full min-h-full p-12 relative">
          {watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
              <span className="text-8xl md:text-9xl font-black text-slate-200/60 rotate-[-35deg] select-none whitespace-nowrap tracking-widest">
                {watermark}
              </span>
            </div>
          )}
          
          {/* 2. Applied the Theme Class here! */}
          <div className={`relative z-10 ${
            theme === 'academic' ? 'theme-academic' : 
            theme === 'modern' ? 'theme-modern' : 
            'theme-minimalist'
          }`}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}