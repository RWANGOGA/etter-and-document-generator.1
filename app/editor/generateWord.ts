import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { computeLetterModel, type Align } from '@/app/lib/letterModel';
import type { LetterData } from '../components/LetterPreview';

// Helper to convert base64 image to a buffer for Word
const base64ToBuffer = (base64: string) => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

const docxAlign: Record<Align, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  right: AlignmentType.RIGHT,
  center: AlignmentType.CENTER,
};

export async function generateLetterWord(data: LetterData, layout: 'block' | 'modified-block' | 'simplified') {
  const model = computeLetterModel(data, layout);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Sender
        new Paragraph({ alignment: docxAlign[model.senderAlign], children: [new TextRun({ text: data.senderName, bold: true })] }),
        new Paragraph({ alignment: docxAlign[model.senderAlign], children: [new TextRun(data.senderAddress)] }),
        new Paragraph({ alignment: docxAlign[model.senderAlign], children: [new TextRun(data.senderCity)] }),
        new Paragraph({ alignment: docxAlign[model.senderAlign], children: [new TextRun(`${data.senderEmail} | ${data.senderPhone}`)] }),
        new Paragraph({ text: '' }), // Spacer

        // Date
        new Paragraph({ alignment: docxAlign[model.dateAlign], children: [new TextRun(model.formattedDate)] }),
        new Paragraph({ text: '' }), // Spacer

        // Recipient
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: data.recipientName, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(data.recipientTitle)] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(data.recipientCompany)] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(data.recipientAddress)] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(data.recipientCity)] }),
        new Paragraph({ text: '' }), // Spacer

        // Salutation
        new Paragraph({ children: [new TextRun(model.salutation)] }),
        new Paragraph({ text: '' }),

        // Subject
        ...(model.subjectLine ? [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: model.subjectLine, bold: true, underline: {} })],
        })] : []),

        // Body
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun(data.body)],
        }),
        new Paragraph({ text: '' }),

        // Closing
        new Paragraph({ children: [new TextRun('Sincerely,')] }),
        new Paragraph({ text: '' }),

        // Signature
        ...(model.hasSignature ? [new Paragraph({
          children: [new ImageRun({
            data: base64ToBuffer(data.signatureData!),
            transformation: { width: 120, height: 40 },
            type: 'png',
          })],
        })] : []),

        new Paragraph({ text: '' }),
        new Paragraph({ children: [new TextRun({ text: data.senderName, bold: true })] }),
      ],
    }],
  });

  // Generate the file and trigger download
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.senderName || 'Letter'}_FormalLetter.docx`);
}