'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip, Loader2, Sparkles, FileUp } from 'lucide-react';
import { api } from '@/app/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentReady: (html: string) => void;
}

export default function AIChatPanel({ isOpen, onClose, onDocumentReady }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! Tell me what you'd like written — a report, essay, proposal, anything — or upload a reference file and I'll work from it." },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedText, setAttachedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsUploading(true);
    try {
      const text = await api.generate.extractText(file);
      setAttachedText(text);
      setAttachedFileName(file.name);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Got it — I've read "${file.name}". What would you like me to do with it?` },
      ]);
    } catch (err) {
      console.error(err);
      setError('Could not read that file. Try a PDF, DOCX, or plain text file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const result = await api.generate.chat(newMessages, attachedText);

      if (result.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
        if (result.document_html) {
          onDocumentReady(result.document_html);
        }
      } else {
        setError(result.reply || 'The AI ran into a problem. Try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not reach the AI. Check that the backend is running.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900">AI Document Assistant</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close chat">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        {attachedFileName && (
          <div className="px-5 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-2 text-xs text-slate-600">
            <FileUp className="w-3.5 h-3.5" />
            Using reference: <span className="font-medium">{attachedFileName}</span>
            <button
              onClick={() => { setAttachedText(''); setAttachedFileName(''); }}
              className="ml-auto text-slate-400 hover:text-red-500"
            >
              Remove
            </button>
          </div>
        )}

        {error && (
          <p className="px-5 py-2 text-xs text-red-600 border-t border-slate-100">{error}</p>
        )}

        {/* Input */}
        <div className="border-t border-slate-200 p-3 flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            title="Upload a reference file"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what you want written..."
            rows={1}
            className="flex-grow resize-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}