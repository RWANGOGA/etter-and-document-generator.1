'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string) => void;
}

export default function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Called when the user finishes drawing a stroke
  const handleEnd = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      onSignatureChange(dataUrl);
      setIsEmpty(false);
    }
  };

  // Clear the canvas
  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onSignatureChange('');
      setIsEmpty(true);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Digital Signature
        </label>
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Eraser className="w-3 h-3" />
          Clear
        </button>
      </div>
      
      {/* The Drawing Canvas */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          onEnd={handleEnd}
          canvasProps={{
            width: 400,
            height: 120,
            className: 'w-full h-[120px] cursor-crosshair',
          }}
          backgroundColor="transparent"
          penColor="#1e293b" // Dark slate color for the ink
          minWidth={1.5}
          maxWidth={2.5}
        />
      </div>
      <p className="text-xs text-slate-400">
        {isEmpty ? "Draw your signature above using your mouse or finger." : "Signature captured!"}
      </p>
    </div>
  );
}