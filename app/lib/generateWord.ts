import { Document, Packer, Paragraph, TextRun, AlignmentType , ImageRun} from 'docx';
import { saveAs } from 'file-saver';
import type { LetterData } from '../components/LetterPreview';


// Helper to convert base64 image to a buffer for Word
const base64ToBuffer = (base64: string) => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, 'base64');
};
export async function downloadWord(data: LetterData, layout: 'block' | 'modified-block' | 'simplified') {
  const formattedDate = data.date ? new Date(data.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '';

  const senderAlign = layout === 'block' ? AlignmentType.LEFT : layout === 'modified-block' ? AlignmentType.RIGHT : AlignmentType.CENTER;
  const dateAlign = layout === 'modified-block' ? AlignmentType.RIGHT : AlignmentType.LEFT;

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Sender
        new Paragraph({ alignment: senderAlign, children: [new TextRun({ text: data.senderName, bold: true })] }),
        new Paragraph({ alignment: senderAlign, children: [new TextRun(data.senderAddress)] }),
        new Paragraph({ alignment: senderAlign, children: [new TextRun(data.senderCity)] }),
        new Paragraph({ alignment: senderAlign, children: [new TextRun(`${data.senderEmail} | ${data.senderPhone}`)] }),
        new Paragraph({ text: "" }), // Spacer

        // Date
        new Paragraph({ alignment: dateAlign, children: [new TextRun(formattedDate)] }),
        new Paragraph({ text: "" }), // Spacer

        // Recipient
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: data.recipientName, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(data.recipientTitle)] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(data.recipientCompany)] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(data.recipientAddress)] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(data.recipientCity)] }),
        new Paragraph({ text: "" }), // Spacer

        // Salutation
        new Paragraph({ children: [new TextRun(`Dear ${data.recipientName ? data.recipientName.split(' ')[0] : 'Sir/Madam'},`)] }),
        new Paragraph({ text: "" }),

        // Subject
        ...(data.subject ? [new Paragraph({ 
          alignment: AlignmentType.CENTER, 
          children: [new TextRun({ text: `RE: ${data.subject.toUpperCase()}`, bold: true, underline: {} })] 
        })] : []),

        // Body
        new Paragraph({ 
          alignment: AlignmentType.JUSTIFIED, 
          children: [new TextRun(data.body)] 
        }),
        new Paragraph({ text: "" }),

            // Closing
     new Paragraph({ children: [new TextRun("Sincerely,")] }),
     new Paragraph({ text: "" }),
     
     // Render Signature in Word
     ...(data.signatureData ? [new Paragraph({
       children: [new ImageRun({
         data: base64ToBuffer(data.signatureData),
         transformation: { width: 120, height: 40 },
         type: 'png',
       })]
     })] : []),
     
     new Paragraph({ text: "" }),
     new Paragraph({ children: [new TextRun({ text: data.senderName, bold: true })] }),
      ],
    }],
  });

  // Generate the file and trigger download
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.senderName || 'Letter'}_FormalLetter.docx`);
}