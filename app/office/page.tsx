'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Presentation, Table2, Loader2, Palette } from 'lucide-react';
import { api } from '@/app/lib/api';
import { downloadBlob } from '@/app/lib/api';

type Mode = 'pptx' | 'xlsx';

const FONT_OPTIONS = ['Calibri', 'Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS'];

const PRESET_THEMES = [
  { name: 'Corporate Blue', primary: '1E3A5F', accent: '2B6CB0', text: '333333' },
  { name: 'Deep Crimson', primary: '7A1F2B', accent: 'C0392B', text: '2A2A2A' },
  { name: 'Forest', primary: '1F3D2B', accent: '3A7D44', text: '2A2A2A' },
  { name: 'Slate Mono', primary: '1E293B', accent: '475569', text: '1E293B' },
  { name: 'Sunset', primary: '9A3B12', accent: 'E07A2C', text: '2A2A2A' },
];

export default function OfficePage() {
  const [mode, setMode] = useState<Mode>('pptx');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(8);
  const [primaryColor, setPrimaryColor] = useState('1E3A5F');
  const [accentColor, setAccentColor] = useState('2B6CB0');
  const [textColor, setTextColor] = useState('333333');
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const applyPreset = (preset: (typeof PRESET_THEMES)[number]) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    setTextColor(preset.text);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Tell it what the file should be about first.');
      return;
    }
    setError('');
    setIsGenerating(true);
    try {
      if (mode === 'pptx') {
        const blob = await api.office.generatePptx({
          topic,
          slide_count: count,
          theme: { primary_color: primaryColor, accent_color: accentColor, text_color: textColor, font_family: fontFamily },
        });
        downloadBlob(blob, 'presentation.pptx');
      } else {
        const blob = await api.office.generateXlsx({
          topic,
          row_count: count,
          theme: { primary_color: primaryColor, text_color: textColor, font_family: fontFamily },
        });
        downloadBlob(blob, 'spreadsheet.xlsx');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">Slides & Sheets</h1>
        <p className="text-slate-500 mb-8">
          Describe what you need. It writes the content and builds the file — you just choose how it looks.
        </p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('pptx')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
              mode === 'pptx'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
          >
            <Presentation className="w-4 h-4" />
            Presentation
          </button>
          <button
            onClick={() => setMode('xlsx')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
              mode === 'xlsx'
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300'
            }`}
          >
            <Table2 className="w-4 h-4" />
            Spreadsheet
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              What's it about?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                mode === 'pptx'
                  ? 'e.g. Q3 marketing strategy for a mid-size SaaS company'
                  : 'e.g. Monthly budget tracker for a small design studio'
              }
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              {mode === 'pptx' ? `Slide count (${count})` : `Row count (${count})`}
            </label>
            <input
              type="range"
              min={mode === 'pptx' ? 3 : 5}
              max={mode === 'pptx' ? 20 : 50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
            />
          </div>

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
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `#${preset.primary}` }}
                  />
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

              {mode === 'pptx' && (
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 ${
              mode === 'pptx' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isGenerating ? 'Generating...' : `Generate ${mode === 'pptx' ? 'Presentation' : 'Spreadsheet'}`}
          </button>
        </div>
      </div>
    </main>
  );
}