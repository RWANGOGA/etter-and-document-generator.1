'use client';

import { ArrowLeft, Check } from 'lucide-react';

interface LayoutOption {
  id: string;
  title: string;
  description: string;
}

const layouts: LayoutOption[] = [
  {
    id: 'block',
    title: 'Block Style',
    description: 'Standard US format. All text and addresses are aligned to the left. Most common for business.',
  },
  {
    id: 'modified-block',
    title: 'Modified Block',
    description: 'Traditional formal style. Sender address and date are on the right, recipient on the left.',
  },
  {
    id: 'simplified',
    title: 'Simplified / Letterhead',
    description: 'Modern and clean. Sender info is centered at the top, like a company letterhead.',
  },
];

interface LayoutSelectorProps {
  letterType: string;
  onSelect: (layout: string) => void;
  onBack: () => void;
}

export default function LayoutSelector({ letterType, onSelect, onBack }: LayoutSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Change Letter Type
      </button>

      <div className="text-center mb-8">
        <p className="text-blue-600 font-semibold mb-2">{letterType}</p>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Choose Your Letter Layout
        </h1>
        <p className="text-slate-500">
          Select how the addresses and text should be formatted on the page.
        </p>
      </div>

      {/* Layout Cards with Visual Previews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onSelect(layout.id)}
            className="text-left bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-lg transition-all group"
          >
            {/* Mini Visual Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 h-40 flex flex-col justify-between">
              
              {layout.id === 'block' && (
                <div className="space-y-2 text-left">
                  <div className="space-y-1">
                    <div className="h-2 w-16 bg-slate-300 rounded"></div>
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                  </div>
                  <div className="h-2 w-10 bg-slate-400 rounded mt-4"></div>
                  <div className="space-y-1">
                    <div className="h-2 w-14 bg-slate-300 rounded"></div>
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                  </div>
                </div>
              )}

              {layout.id === 'modified-block' && (
                <div className="space-y-2">
                  <div className="flex flex-col items-end space-y-1">
                    <div className="h-2 w-16 bg-slate-300 rounded"></div>
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                  </div>
                  <div className="h-2 w-10 bg-slate-400 rounded mt-4"></div>
                  <div className="space-y-1 text-left">
                    <div className="h-2 w-14 bg-slate-300 rounded"></div>
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                  </div>
                </div>
              )}

              {layout.id === 'simplified' && (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div className="h-2 w-20 bg-slate-300 rounded"></div>
                  </div>
                  <div className="h-2 w-10 bg-slate-400 rounded mt-4"></div>
                  <div className="space-y-1 text-left">
                    <div className="h-2 w-14 bg-slate-300 rounded"></div>
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                  </div>
                </div>
              )}

            </div>

            {/* Text Details */}
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-1">
              {layout.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {layout.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}