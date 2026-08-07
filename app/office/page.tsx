'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Presentation, Table2, Loader2, Palette, Upload, MessageSquare, Sparkles, Send } from 'lucide-react';
import { api, downloadBlob } from '@/app/lib/api';

type FileMode = 'pptx' | 'xlsx';
type Tab = 'quick' | 'document' | 'chat';

const FONT_OPTIONS = ['Calibri', 'Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS'];

const PRESET_THEMES = [
  { name: 'Corporate Blue', primary: '1E3A5F', accent: '2B6CB0', text: '333333' },
  { name: 'Deep Crimson', primary: '7A1F2B', accent: 'C0392B', text: '2A2A2A' },
  { name: 'Forest', primary: '1F3D2B', accent: '3A7D44', text: '2A2A2A' },
  { name: 'Slate Mono', primary: '1E293B', accent: '475569', text: '1E293B' },
  { name: 'Sunset', primary: '9A3B12', accent: 'E07A2C', text: '2A2A2A' },
];

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function OfficePage() {
  const [fileMode, setFileMode] = useState<FileMode>('pptx');
  const [tab, setTab] = useState<Tab>('quick');

  // Theme (shared across tabs)
  const [primaryColor, setPrimaryColor] = useState('1E3A5F');
  const [accentColor, setAccentColor] = useState('2B6CB0');
  const [textColor, setTextColor] = useState('333333');
  const [fontFamily, setFontFamily] = useState('Calibri');

  // Quick tab
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(8);

  // Document tab
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docInstructions, setDocInstructions] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat tab
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStructure, setChatStructure] = useState<Record<string, unknown> | null>(null);
  const [chatReady, setChatReady] = useState(false);

  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const applyPreset = (preset: (typeof PRESET_THEMES)[number]) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    setTextColor(preset.text);
  };

  const switchFileMode = (m: FileMode) => {
    setFileMode(m);
    setError('');
    setChatMessages([]);
    setChatStructure(null);
    setChatReady(false);
  };

  const theme = { primary_color: primaryColor, accent_color: accentColor, text_color: textColor, font_family: fontFamily };
  const xlsxTheme = { primary_color: primaryColor, text_color: textColor, font_family: fontFamily };

  // --- Quick generate ---
  const handleQuickGenerate = async () => {
    if (!topic.trim()) {
      setError('Tell it what the file should be about first.');
      return;
    }
    setError('');
    setIsBusy(true);
    try {
      if (fileMode === 'pptx') {
        const blob = await api.office.generatePptx({ topic, slide_count: count, theme });
        downloadBlob(blob, 'presentation.pptx');
      } else {
        const blob = await api.office.generateXlsx({ topic, row_count: count, theme: xlsxTheme });
        downloadBlob(blob, 'spreadsheet.xlsx');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  // --- From document ---
  const handleDocumentGenerate = async () => {
    if (!uploadFile) {
      setError('Upload a file first.');
      return;
    }
    setError('');
    setIsBusy(true);
    try {
      if (fileMode === 'pptx') {
        const blob = await api.office.pptxFromDocument(uploadFile, count, docInstructions, theme);
        downloadBlob(blob, 'presentation.pptx');
      } else {
        const blob = await api.office.xlsxEnhance(uploadFile, docInstructions, xlsxTheme);
        downloadBlob(blob, 'enhanced.xlsx');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  // --- Chat ---
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isBusy) return;
    const newMessages: ChatMsg[] = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setError('');
    setIsBusy(true);
    try {
      const result =
        fileMode === 'pptx'
          ? await api.office.pptxChat(newMessages)
          : await api.office.xlsxChat(newMessages);

      if (!result.success) {
        setError(result.reply);
        return;
      }
      setChatMessages([...newMessages, { role: 'assistant', content: result.reply }]);
      if (result.ready && result.structure) {
        setChatStructure(result.structure);
        setChatReady(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleChatBuild = async () => {
    if (!chatStructure) return;
    setError('');
    setIsBusy(true);
    try {
      if (fileMode === 'pptx') {
        const blob = await api.office.pptxBuild(chatStructure, theme);
        downloadBlob(blob, 'presentation.pptx');
      } else {
        const blob = await api.office.xlsxBuild(chatStructure, xlsxTheme);
        downloadBlob(blob, 'spreadsheet.xlsx');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const accent = fileMode === 'pptx' ? 'blue' : 'purple';

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">Slides & Sheets</h1>
        <p className="text-slate-500 mb-8">
          Describe what you need, upload something to work from, or just talk it through — it writes the content and builds the file.
        </p>

        {/* File type toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => switchFileMode('pptx')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
              fileMode === 'pptx' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
          >
            <Presentation className="w-4 h-4" />
            Presentation
          </button>
          <button
            onClick={() => switchFileMode('xlsx')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
              fileMode === 'xlsx' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300'
            }`}
          >
            <Table2 className="w-4 h-4" />
            Spreadsheet
          </button>
        </div>

        {/* Method tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
          {([
            { id: 'quick', label: 'Quick Topic', icon: Sparkles },
            { id: 'document', label: fileMode === 'pptx' ? 'From a Document' : 'Upload & Improve', icon: Upload },
            { id: 'chat', label: 'Talk It Through', icon: MessageSquare },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
                tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {/* QUICK TAB */}
          {tab === 'quick' && (
            <>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">What's it about?</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    fileMode === 'pptx'
                      ? 'e.g. Q3 marketing strategy for a mid-size SaaS company'
                      : 'e.g. Monthly budget tracker for a small design studio'
                  }
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  {fileMode === 'pptx' ? `Slide count (${count})` : `Row count (${count})`}
                </label>
                <input
                  type="range"
                  min={fileMode === 'pptx' ? 3 : 5}
                  max={fileMode === 'pptx' ? 20 : 50}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* DOCUMENT TAB */}
          {tab === 'document' && (
            <>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  {fileMode === 'pptx' ? 'Upload a document to turn into slides' : 'Upload a spreadsheet to improve'}
                </label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-sm text-slate-500">
                    {uploadFile ? uploadFile.name : fileMode === 'pptx' ? 'PDF, Word, or text file' : 'Excel file (.xlsx)'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={fileMode === 'pptx' ? '.pdf,.docx,.txt' : '.xlsx'}
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {fileMode === 'pptx' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Slide count ({count})</label>
                  <input
                    type="range"
                    min={3}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  {fileMode === 'pptx' ? 'Anything specific to focus on? (optional)' : 'What should be improved? (optional)'}
                </label>
                <textarea
                  value={docInstructions}
                  onChange={(e) => setDocInstructions(e.target.value)}
                  placeholder={
                    fileMode === 'pptx'
                      ? 'e.g. focus on the results section, keep it high-level'
                      : 'e.g. clean up inconsistent dates, add a totals column'
                  }
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </>
          )}

          {/* CHAT TAB */}
          {tab === 'chat' && (
            <div>
              <div className="border border-slate-200 rounded-lg h-72 overflow-y-auto p-4 mb-3 space-y-3 bg-slate-50">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-slate-400 text-center mt-8">
                    Tell it what you're trying to build — it'll ask a couple of questions, then hand you a file.
                  </p>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              {chatReady && (
                <button
                  onClick={handleChatBuild}
                  disabled={isBusy}
                  className={`w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-white text-sm transition-colors disabled:opacity-50 ${
                    fileMode === 'pptx' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Build & Download
                </button>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                  placeholder="Type your answer..."
                  className="flex-grow border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={isBusy || !chatInput.trim()}
                  className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Theme controls — shown for quick + document tabs */}
          {tab !== 'chat' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Style</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_THEMES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-400 transition-colors text-xs font-medium text-slate-600"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: `#${preset.primary}` }} />
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Primary</label>
                  <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-1.5">
                    <input
                      type="color"
                      value={`#${primaryColor}`}
                      onChange={(e) => setPrimaryColor(e.target.value.slice(1))}
                      className="w-6 h-6 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs text-slate-500 font-mono">#{primaryColor}</span>
                  </div>
                </div>

                {fileMode === 'pptx' && (
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Accent</label>
                    <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-1.5">
                      <input
                        type="color"
                        value={`#${accentColor}`}
                        onChange={(e) => setAccentColor(e.target.value.slice(1))}
                        className="w-6 h-6 rounded cursor-pointer border-0"
                      />
                      <span className="text-xs text-slate-500 font-mono">#{accentColor}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Text</label>
                  <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-1.5">
                    <input
                      type="color"
                      value={`#${textColor}`}
                      onChange={(e) => setTextColor(e.target.value.slice(1))}
                      className="w-6 h-6 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs text-slate-500 font-mono">#{textColor}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-slate-500 block mb-1">Font</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {tab !== 'chat' && (
            <button
              onClick={tab === 'quick' ? handleQuickGenerate : handleDocumentGenerate}
              disabled={isBusy}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 ${
                accent === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {isBusy ? 'Generating...' : `Generate ${fileMode === 'pptx' ? 'Presentation' : 'Spreadsheet'}`}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}