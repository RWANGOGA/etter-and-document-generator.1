'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, BookOpen, Trash2, Plus, Search, Clock } from 'lucide-react';
import { api } from '@/app/lib/api';
import type { DocumentRecord } from '@/app/types/document';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'letter' | 'freeform'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const docs = await api.documents.list();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Could not load your documents. Check that the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this document permanently?')) return;

    setDeletingId(id);
    try {
      await api.documents.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Could not delete this document. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = documents
    .filter((d) => filter === 'all' || d.type === filter)
    .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDocHref = (doc: DocumentRecord) => {
  if (doc.type === 'letter') {
    const layout = doc.content.kind === 'letter' ? doc.content.layout : 'block';
    const letterType = doc.content.kind === 'letter' ? doc.content.letterType : doc.title;
    return `/editor?id=${doc.id}&letter=${encodeURIComponent(letterType)}&layout=${layout}`;
  }
  return `/documents?id=${doc.id}`;

};

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-lg font-bold text-slate-800">My Documents</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/generator"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Letter
            </Link>
            <Link
              href="/documents"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Document
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'letter', 'freeform'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f === 'all' ? 'All' : f === 'letter' ? 'Letters' : 'Documents'}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-16 text-slate-500">Loading your documents...</div>
        )}

        {error && !isLoading && (
          <div className="text-center py-16">
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <button onClick={loadDocuments} className="text-blue-600 hover:underline text-sm">
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">
              {documents.length === 0 ? "You haven't created any documents yet." : 'No documents match your search.'}
            </p>
            {documents.length === 0 && (
              <div className="flex justify-center gap-3">
                <Link href="/generator" className="text-blue-600 font-semibold hover:underline">
                  Create a Letter
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/documents" className="text-purple-600 font-semibold hover:underline">
                  Create a Document
                </Link>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <Link
                key={doc.id}
                href={getDocHref(doc)}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    doc.type === 'letter' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {doc.type === 'letter' ? <FileText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    disabled={deletingId === doc.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-semibold text-slate-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
                  {doc.title || 'Untitled Document'}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  Updated {formatDate(doc.updatedAt)}
                </div>

                <span className={`inline-block mt-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  doc.type === 'letter' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  {doc.type === 'letter' ? 'Letter' : 'Document'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}