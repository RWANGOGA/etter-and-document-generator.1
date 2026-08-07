import Link from 'next/link';
import { FileText, BookOpen, Wrench, LayoutGrid } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-hidden">

      {/* TOP NAV — standalone bar, not overlaying the hero */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-slate-900 font-bold text-lg tracking-tight">LetDoc</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            My Documents
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section
        className="relative px-6 py-24 md:py-40 text-center overflow-hidden"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1800&q=85")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
        }}
      >
        {/* Rich gradient overlay instead of flat dark tint */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-950/85 via-indigo-950/75 to-blue-900/70" />

        {/* Layered glow blobs for depth */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-25 animate-blob animation-delay-4000" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-semibold text-blue-200 bg-blue-500/10 rounded-full border border-blue-400/30 backdrop-blur-sm">
            <div className="w-5 h-5 rounded-full bg-linear-to-br from-blue-300 to-cyan-300 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-900" />
            </div>
            Professional Documents, Zero Design Skills Needed
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 animate-fade-in-up">
            Write Documents People <br className="hidden md:block" />
            <span className="bg-linear-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Actually Want to Read.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
            From a quick formal letter to a fully formatted coursework report — type your words, and we handle every margin, heading, and page break.
          </p>

          {/* THE THREE PATHS */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-400">
            <Link
              href="/generator"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:scale-105"
            >
              <FileText className="w-5 h-5" />
              Create a Formal Letter
            </Link>

            <Link
              href="/documents"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-white/10 border-2 border-white/30 rounded-xl hover:border-purple-400 hover:text-purple-300 hover:bg-white/15 transition-all shadow-sm hover:shadow-md hover:scale-105 backdrop-blur-sm"
            >
              <BookOpen className="w-5 h-5" />
              Create a Document / Report
            </Link>

            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-white/10 border-2 border-white/30 rounded-xl hover:border-emerald-400 hover:text-emerald-300 hover:bg-white/15 transition-all shadow-sm hover:shadow-md hover:scale-105 backdrop-blur-sm"
            >
              <Wrench className="w-5 h-5" />
              PDF Tools
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12 text-sm text-white/60 animate-fade-in-up animation-delay-600">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No sign-up required
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Download as PDF or Word
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Ready in under 2 minutes
            </span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-linear-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Three Steps. Zero Stress.</h2>
            <p className="text-slate-600">No formatting menus to fight with — just write, and it looks right.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center px-4">
              <div className="w-20 h-20 mx-auto bg-linear-to-br from-blue-100 to-blue-50 border-2 border-blue-200 rounded-3xl flex items-center justify-center mb-5 shadow-md hover:shadow-lg transition-shadow">
                <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Pick a Style</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Choose a layout — academic, modern business, minimalist, or a classic published-book look.</p>
            </div>
            <div className="text-center px-4">
              <div className="w-20 h-20 mx-auto bg-linear-to-br from-purple-100 to-purple-50 border-2 border-purple-200 rounded-3xl flex items-center justify-center mb-5 shadow-md hover:shadow-lg transition-shadow">
                <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4-2h2v20h-2zm4 4h2v16h-2zm4 8h2v8h-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Just Type</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Headings, spacing, and structure are handled automatically as you write — no manual formatting.</p>
            </div>
            <div className="text-center px-4">
              <div className="w-20 h-20 mx-auto bg-linear-to-br from-emerald-100 to-emerald-50 border-2 border-emerald-200 rounded-3xl flex items-center justify-center mb-5 shadow-md hover:shadow-lg transition-shadow">
                <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 12a7 7 0 11-14 0 7 7 0 0114 0z M9 16.17L5.83 13m0 0l-1.41 1.41M4.42 13l1.41 1.41m0 0L9 18.17" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M14 8h-4m0 0L8 4m0 0l2 4" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Download & Send</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Export a polished PDF or an editable Word file, ready to submit or send.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CHOOSE YOUR TOOL SECTION */}
      <section
        className="py-20 border-y border-slate-100 relative overflow-hidden"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1800&q=85")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Warmer tinted overlay for a more cohesive feel with the hero */}
        <div className="absolute inset-0 bg-linear-to-b from-white/92 via-white/90 to-slate-50/92" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Tool</h2>
            <p className="text-slate-600">Three focused tools, each built for a different kind of writing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Letter Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Letter Generator</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Perfect for quick, formal correspondence. Choose a layout, fill in the blanks, and download a perfectly formatted letter.
              </p>
              <ul className="space-y-2 text-sm text-slate-500 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Resignation &amp; Cover Letters
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Formal Complaints
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Instant Polish &amp; Rewrite
                </li>
              </ul>
              <Link href="/generator" className="text-blue-600 font-semibold hover:underline">Start a Letter &rarr;</Link>
            </div>

            {/* Document Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Document Creator</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                A smart, zero-friction editor for long-form content. Just type your coursework or reports, and the system handles the formatting.
              </p>
              <ul className="space-y-2 text-sm text-slate-500 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Coursework &amp; Essays
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Business Proposals
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automatic Formatting
                </li>
              </ul>
              <Link href="/documents" className="text-purple-600 font-semibold hover:underline">Start a Document &rarr;</Link>
            </div>

            {/* PDF Tools Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-6">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">PDF Tools</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Merge, split, compress, and watermark your PDFs — no upload limits, no watermark ads.
              </p>
              <ul className="space-y-2 text-sm text-slate-500 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Merge &amp; Split PDFs
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Compress large files
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Add watermarks
                </li>
              </ul>
              <Link href="/tools" className="text-emerald-600 font-semibold hover:underline">Open Tools &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1800&q=85")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-blue-950/88 via-indigo-950/85 to-purple-950/88" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob" />

        <div className="max-w-4xl mx-auto px-6 text-center text-white relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Next Document Starts Here.</h2>
          <p className="text-blue-100 text-lg mb-8">It takes less than 2 minutes to go from a blank page to a document worth sending.</p>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Get Started Now
          </Link>
        </div>
      </section>

    </main>
  );
}