'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LetterTypeSelector from '@/app/components/LetterTypeSelection';
import SpecificLetterSelector from '@/app/components/SpecificLetterSelector';
import LayoutSelector from '@/app/components/LayoutSelector';

export default function GeneratorPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);

  const handleCategorySelect = (category: string) => setSelectedCategory(category);
  const handleLetterSelect = (letter: string) => setSelectedLetter(letter);
  
  const handleLayoutSelect = (layout: string) => {
    setSelectedLayout(layout);
    // Once layout is selected, we will route them to the editor!
    // We pass the choices in the URL so the editor knows what to do.
    window.location.href = `/editor?letter=${encodeURIComponent(selectedLetter || '')}&layout=${layout}`;
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null); setSelectedLetter(null); setSelectedLayout(null);
  };
  const handleBackToLetters = () => {
    setSelectedLetter(null); setSelectedLayout(null);
  };
  const handleBackToLayout = () => {
    setSelectedLayout(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Back to Home Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* STEP 1: Categories */}
        {!selectedCategory && (
          <LetterTypeSelector onSelect={handleCategorySelect} />
        )}

        {/* STEP 2: Specific Letters */}
        {selectedCategory && !selectedLetter && (
          <SpecificLetterSelector 
            category={selectedCategory} 
            onSelect={handleLetterSelect}
            onBack={handleBackToCategories}
          />
        )}

        {/* STEP 3: Layout */}
        {selectedLetter && !selectedLayout && (
          <LayoutSelector 
            letterType={selectedLetter}
            onSelect={handleLayoutSelect}
            onBack={handleBackToLetters}
          />
        )}

      </div>
    </main>
  );
}