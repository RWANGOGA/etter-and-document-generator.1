'use client';

// Define the shape of the data our preview needs
export interface LetterData {
  senderName: string;
  senderAddress: string;
  senderCity: string;
  senderEmail: string;
  senderPhone: string;
  
  recipientName: string;
  recipientTitle: string;
  recipientCompany: string;
  recipientAddress: string;
  recipientCity: string;
  
  date: string;
  subject: string;
  body: string;

  signatureData?: string; // Base64 image data for signature (optional)
}

interface LetterPreviewProps {
  layout: 'block' | 'modified-block' | 'simplified';
  data: LetterData;
}

export default function LetterPreview({ layout, data }: LetterPreviewProps) {
  
  // Helper function to format the date nicely
  const formattedDate = data.date ? new Date(data.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : 'Current Date';

  return (
    // The "Desk" background
    <div className="bg-slate-200 p-4 md:p-8 rounded-lg shadow-inner flex justify-center min-h-screen">
      
      {/* The A4 Paper - Notice the new padding and shadow! */}
      <div className="bg-white w-full max-w-[8.27in] min-h-[11.69in] shadow-2xl p-10 md:p-16 relative">
        
        {/* 1. SENDER ADDRESS BLOCK */}
        <div className={`mb-8 font-latex-address ${
          layout === 'block' ? 'text-left' : 
          layout === 'modified-block' ? 'text-right' : 
          'text-center'
        }`}>
          <p className="font-bold text-[13pt]">{data.senderName || 'Your Name'}</p>
          <p>{data.senderAddress || 'Your Street Address'}</p>
          <p>{data.senderCity || 'City, State, ZIP'}</p>
          <p>{data.senderEmail || 'email@example.com'}</p>
          <p>{data.senderPhone || '(123) 456-7890'}</p>
        </div>

        {/* 2. DATE */}
        <div className={`mb-8 font-latex-address ${
          layout === 'modified-block' ? 'text-right' : 'text-left'
        }`}>
          <p>{formattedDate}</p>
        </div>

        {/* 3. RECIPIENT ADDRESS BLOCK */}
        <div className="text-left mb-8 font-latex-address">
          <p className="font-bold">{data.recipientName || 'Recipient Name'}</p>
          <p>{data.recipientTitle || 'Recipient Title'}</p>
          <p>{data.recipientCompany || 'Company Name'}</p>
          <p>{data.recipientAddress || 'Recipient Street Address'}</p>
          <p>{data.recipientCity || 'Recipient City, State, ZIP'}</p>
        </div>

        {/* 4. SALUTATION */}
        <div className="mb-4 font-latex">
          <p>Dear {data.recipientName ? data.recipientName.split(' ')[0] : 'Sir/Madam'},</p>
        </div>

        {/* 5. SUBJECT LINE - Updated to look more formal */}
        {data.subject && (
          <div className="mb-6 font-latex font-bold text-center underline underline-offset-4 decoration-1">
            <p>RE: {data.subject.toUpperCase()}</p>
          </div>
        )}

        {/* 6. LETTER BODY - This is where the LaTeX magic happens! */}
        <div className="mb-8 font-latex whitespace-pre-wrap">
          <p>{data.body || 'Start typing your letter on the left, and it will appear here in real-time. The formatting will perfectly match the layout you selected.'}</p>
          <br />
          <p>Thank you for your time and consideration.</p>
        </div>

                {/* 7. CLOSING & SIGNATURE */}
        <div className="text-left mt-12 font-latex">
          <p>Sincerely,</p>
          <br />
          
          {/* Render the drawn signature image if it exists */}
          {data.signatureData && (
            <img 
              src={data.signatureData} 
              alt="Signature" 
              className="h-16 mb-2" // Adjust height to look like a real signature
            />
          )}
          
          <p className="font-bold text-[13pt]">{data.senderName || 'Your Name'}</p>
        </div>

      </div>
    </div>
  );
}