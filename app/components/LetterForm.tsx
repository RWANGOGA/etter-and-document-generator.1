'use client';

import { useState } from 'react';
// Added Loader2 for the spinning animation
import { Sparkles, Wand2, Loader2 } from 'lucide-react'; 
import AIGenerateModal from './AIGenerateModal';
import { generateLetterContent } from '@/app/actions/aiActions';
import type { LetterData } from './LetterPreview';
import { computeLetterModel } from '@/app/lib/letterModel';
import SignaturePad from './SignaturePad';

interface LetterFormProps {
  data: LetterData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function LetterForm({ data, onChange }: LetterFormProps) {
  // Helper to make input styling consistent
  const inputClass = "w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        ✏️ Letter Details
      </h2>

      <form className="space-y-8">
        
        {/* SECTION 1: SENDER INFO */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-blue-600 border-b border-blue-100 pb-2">Your Information (Sender)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input name="senderName" value={data.senderName} onChange={onChange} className={inputClass} placeholder="John Doe" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="senderPhone" value={data.senderPhone} onChange={onChange} className={inputClass} placeholder="(555) 123-4567" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Street Address</label>
              <input name="senderAddress" value={data.senderAddress} onChange={onChange} className={inputClass} placeholder="123 Main St" />
            </div>
            <div>
              <label className={labelClass}>City, State, ZIP</label>
              <input name="senderCity" value={data.senderCity} onChange={onChange} className={inputClass} placeholder="New York, NY 10001" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input name="senderEmail" value={data.senderEmail} onChange={onChange} className={inputClass} placeholder="john@email.com" />
            </div>
          </div>
        </div>

        {/* SECTION 2: RECIPIENT INFO */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-blue-600 border-b border-blue-100 pb-2">Recipient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input name="recipientName" value={data.recipientName} onChange={onChange} className={inputClass} placeholder="Jane Smith" />
            </div>
            <div>
              <label className={labelClass}>Job Title</label>
              <input name="recipientTitle" value={data.recipientTitle} onChange={onChange} className={inputClass} placeholder="HR Manager" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Company Name</label>
              <input name="recipientCompany" value={data.recipientCompany} onChange={onChange} className={inputClass} placeholder="Tech Corp" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Street Address</label>
              <input name="recipientAddress" value={data.recipientAddress} onChange={onChange} className={inputClass} placeholder="456 Business Ave" />
            </div>
            <div>
              <label className={labelClass}>City, State, ZIP</label>
              <input name="recipientCity" value={data.recipientCity} onChange={onChange} className={inputClass} placeholder="New York, NY 10002" />
            </div>
          </div>
        </div>

        {/* SECTION 3: LETTER DETAILS */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-blue-600 border-b border-blue-100 pb-2">Letter Content</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" name="date" value={data.date} onChange={onChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Subject (Optional)</label>
              <input name="subject" value={data.subject} onChange={onChange} className={inputClass} placeholder="Resignation Notice" />
            </div>
          </div>

          <div>
            {/* --- AI ACTION BUTTONS --- */}
            <div className="flex gap-2 mb-2">
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate from Scratch
              </button>
              
              <button 
                type="button"
                onClick={async () => {
                  if (!data.body.trim()) return;
                  setIsPolishing(true);
                  const result = await generateLetterContent('', 'polish', data.body);
                  if (result.success && result.text) {
                    // Manually trigger the onChange logic for the body
                    const fakeEvent = { target: { name: 'body', value: result.text } } as any;
                    onChange(fakeEvent);
                  }
                  setIsPolishing(false);
                }}
                disabled={isPolishing || !data.body.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPolishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {isPolishing ? 'Polishing...' : 'Polish & Improve'}
              </button>
            </div>

            <label className={labelClass}>Letter Body</label>
            <textarea 
              name="body" 
              value={data.body} 
              onChange={onChange} 
              rows={10} 
              className={`${inputClass} resize-y`} 
              placeholder="Type your letter here. Use 'Enter' for new paragraphs..."
            ></textarea>
          </div>

          {/* SIGNATURE SECTION */}
          <div className="pt-4 border-t border-slate-100">
            <SignaturePad 
              onSignatureChange={(dataUrl) => {
                // We manually trigger the onChange logic for the signature
                const fakeEvent = { target: { name: 'signatureData', value: dataUrl } } as any;
                onChange(fakeEvent);
              }} 
            />
          </div>
        </div>

        {/* --- AI GENERATE MODAL --- */}
        <AIGenerateModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onGenerated={(text) => {
            const fakeEvent = { target: { name: 'body', value: text } } as any;
            onChange(fakeEvent);
          }} 
        />

      </form>
    </div>
  );
}