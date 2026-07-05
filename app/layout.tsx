import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import "./globals.css";

// Import the beautiful fonts
const garamond = EB_Garamond({ 
  subsets: ["latin"], 
  variable: "--font-serif", // This makes it available in CSS
  weight: ["400", "500", "600", "700"] 
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

export const metadata: Metadata = {
  title: "LetterGen - Professional Letters",
  description: "Create beautiful, LaTeX-quality formal letters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font variables to the body */}
      <body className={`${inter.variable} ${garamond.variable} flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased font-sans`}>
        
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold font-serif">L</div>
              <h1 className="text-xl font-bold text-slate-800">LetDoc</h1>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6">
          <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
            &copy; 2026 LetDoc
          </div>
        </footer>

      </body>
    </html>
  );
}