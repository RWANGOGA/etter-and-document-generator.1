import Link from 'next/link';
import { FileText, BookOpen, Layout, Download, CheckCircle, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="relative max-w-6xl mx-auto px-6 py-20 md:py-32 text-center overflow-hidden">
        {/* Animated Gradient Blobs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-100">
            Professional Document Generation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            Write Beautiful Documents <br className="hidden md:block" />
            <span className="text-blue-600">Without the Stress.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Whether you need a quick formal letter or a long, perfectly formatted coursework report, we handle the design so you can focus on the words.
          </p>
          
          {/* THE TWO PATHS */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/generator"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-105"
            >
              <FileText className="w-5 h-5" />
              Create a Formal Letter
            </Link>
            
            {/* NEW BUTTON FOR DOCUMENTS */}
            <Link 
              href="/documents"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:text-purple-600 transition-all shadow-sm hover:shadow-md hover:scale-105"
            >
              <BookOpen className="w-5 h-5" />
              Create a Document / Report
            </Link>
          </div>
        </div>
      </section>

      {/* CHOOSE YOUR TOOL SECTION */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Tool</h2>
            <p className="text-slate-600">Two powerful ways to create professional content.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Letter Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Letter Generator</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Perfect for quick, formal correspondence. Choose a layout, fill in the blanks, and download a perfectly formatted letter.
              </p>
              <ul className="space-y-2 text-sm text-slate-500 mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Resignation & Cover Letters</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Formal Complaints</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> AI Polish & Rewrite</li>
              </ul>
              <Link href="/generator" className="text-blue-600 font-semibold hover:underline">Start a Letter &rarr;</Link>
            </div>

            {/* Document Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Document Creator</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                A smart, zero-friction editor for long-form content. Just type your coursework or reports, and the system handles the formatting.
              </p>
              <ul className="space-y-2 text-sm text-slate-500 mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Coursework & Essays</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Business Proposals</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Smart Auto-Formatting</li>
              </ul>
              <Link href="/documents" className="text-purple-600 font-semibold hover:underline">Start a Document &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 relative overflow-hidden">
         <div className="max-w-4xl mx-auto px-6 text-center text-white relative z-10">
            <h2 className="text-3xl font-bold mb-4">Ready to create something amazing?</h2>
            <p className="text-blue-100 text-lg mb-8">It takes less than 2 minutes to generate a perfectly formatted document.</p>
            <Link 
               href="/generator"
               className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:scale-105"
            >
               <CheckCircle className="w-5 h-5" />
               Get Started Now
            </Link>
         </div>
      </section>

    </main>
  );
}