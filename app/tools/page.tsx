'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { api, downloadBlob } from '@/app/lib/api';

type Tool = 'merge' | 'split' | 'compress' | 'watermark' | 'images-to-pdf';

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkText, setWatermarkText] = useState('');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [quality, setQuality] = useState(60);          // ← new
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const tools: { id: Tool; label: string; multi: boolean }[] = [
    { id: 'merge', label: 'Merge PDFs', multi: true },
    { id: 'split', label: 'Split PDF', multi: false },
    { id: 'compress', label: 'Compress PDF', multi: false },
    { id: 'watermark', label: 'Add Watermark', multi: false },
    { id: 'images-to-pdf', label: 'Images to PDF', multi: true },
  ];

  const handleRun = async () => {
    if (!activeTool || files.length === 0) return;
    setError('');
    setIsProcessing(true);
    try {
      let blob: Blob;
      switch (activeTool) {
        case 'merge':
          blob = await api.pdfTools.merge(files);
          downloadBlob(blob, 'merged.pdf');
          break;
        case 'split':
          blob = await api.pdfTools.split(files[0], startPage, endPage);
          downloadBlob(blob, `split_${startPage}-${endPage}.pdf`);
          break;
        case 'compress':
          blob = await api.pdfTools.compress(files[0], quality);  // ← pass quality
          downloadBlob(blob, 'compressed.pdf');
          break;
        case 'watermark':
          blob = await api.pdfTools.watermark(files[0], watermarkText);
          downloadBlob(blob, 'watermarked.pdf');
          break;
        case 'images-to-pdf':
          blob = await api.pdfTools.imagesToPdf(files);
          downloadBlob(blob, 'images.pdf');
          break;
      }
      setFiles([]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTool = tools.find((t) => t.id === activeTool);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-800 mb-6">PDF Tools</h1>

        {!activeTool && (
          <div className="grid grid-cols-2 gap-4">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <h3 className="font-semibold text-slate-800">{tool.label}</h3>
              </button>
            ))}
          </div>
        )}

        {activeTool && currentTool && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{currentTool.label}</h2>
              <button
                onClick={() => {
                  setActiveTool(null);
                  setFiles([]);
                  setError('');
                }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                Cancel
              </button>
            </div>

            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-8 cursor-pointer hover:border-blue-400 transition-colors mb-4">
              <Upload className="w-8 h-8 text-slate-400" />
              <span className="text-sm text-slate-500">
                {files.length > 0
                  ? `${files.length} file(s) selected`
                  : 'Click to select file(s)'}
              </span>
              <input
                type="file"
                accept={
                  activeTool === 'images-to-pdf'
                    ? 'image/*'
                    : 'application/pdf'
                }
                multiple={currentTool.multi}
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>

            {activeTool === 'split' && (
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    Start Page
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                    className="border border-slate-300 rounded px-3 py-2 w-24"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    End Page
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                    className="border border-slate-300 rounded px-3 py-2 w-24"
                  />
                </div>
              </div>
            )}

            {activeTool === 'compress' && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">
                  Quality ({quality})
                </label>
                <input
                  type="range"
                  min={10}
                  max={95}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Smaller</span>
                  <span>Better quality</span>
                </div>
              </div>
            )}

            {activeTool === 'watermark' && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g., CONFIDENTIAL"
                  className="border border-slate-300 rounded px-3 py-2 w-full"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <button
              onClick={handleRun}
              disabled={isProcessing || files.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isProcessing ? 'Processing...' : `Run ${currentTool.label}`}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}