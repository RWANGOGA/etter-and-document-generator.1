'use client';

import { ArrowLeft } from 'lucide-react';

// A simple map connecting categories to their specific letters
const letterOptions: Record<string, string[]> = {
  employment: ['Resignation Letter', 'Cover Letter', 'Sick Leave Request'],
  housing: ['Notice to Landlord', 'Repair Request', 'Tenant Complaint'],
  business: ['Formal Complaint', 'Apology Letter', 'Payment Reminder'],
  personal: ['Character Reference', 'Recommendation Request', 'Personal Apology'],
};

interface SpecificLetterSelectorProps {
  category: string;
  onSelect: (letterType: string) => void;
  onBack: () => void;
}

export default function SpecificLetterSelector({ category, onSelect, onBack }: SpecificLetterSelectorProps) {
  const letters = letterOptions[category] || [];
  
  // Make the category name look nice (e.g., 'employment' -> 'Employment')
  const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Categories
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          {categoryTitle} Letters
        </h1>
        <p className="text-slate-500">
          Choose the exact type of letter you want to create.
        </p>
      </div>

      {/* List of Specific Letters */}
      <div className="space-y-3">
        {letters.map((letter) => (
          <button
            key={letter}
            onClick={() => onSelect(letter)}
            className="w-full text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {letter}
              </h3>
              <span className="text-slate-400 group-hover:text-blue-500 transition-colors text-xl">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}