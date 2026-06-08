'use client';

import { Briefcase, Home, FileText, Heart, Users, AlertCircle } from 'lucide-react';

// Define the shape of our letter categories
interface LetterCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  letters: string[];
}

const categories: LetterCategory[] = [
  {
    id: 'employment',
    title: 'Employment & Work',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-700',
    letters: ['Resignation Letter', 'Cover Letter', 'Sick Leave Request'],
  },
  {
    id: 'housing',
    title: 'Housing & Property',
    icon: <Home className="w-6 h-6" />,
    color: 'bg-green-100 text-green-700',
    letters: ['Notice to Landlord', 'Repair Request', 'Tenant Complaint'],
  },
  {
    id: 'business',
    title: 'Business & Formal',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-purple-100 text-purple-700',
    letters: ['Formal Complaint', 'Apology Letter', 'Payment Reminder'],
  },
  {
    id: 'personal',
    title: 'Personal & References',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-orange-100 text-orange-700',
    letters: ['Character Reference', 'Recommendation Request', 'Personal Apology'],
  },
];

interface LetterTypeSelectorProps {
  onSelect: (letterType: string) => void;
}

export default function LetterTypeSelector({ onSelect }: LetterTypeSelectorProps) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          What type of letter do you need?
        </h1>
        <p className="text-slate-500">
          Select a category to get started. We'll handle the formal formatting for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div 
            key={category.id}
            className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white cursor-pointer group"
            onClick={() => onSelect(category.id)}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${category.color}`}>
                {category.icon}
              </div>
              <h2 className="text-xl font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {category.title}
              </h2>
            </div>
            
            <ul className="space-y-2 ml-2">
              {category.letters.map((letter) => (
                <li key={letter} className="text-slate-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  {letter}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}