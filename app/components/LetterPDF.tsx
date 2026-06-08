import { Document, Page, Text, View, StyleSheet,Image } from '@react-pdf/renderer';
import type { LetterData } from './LetterPreview';


// Define styles to mimic our beautiful LaTeX look
const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 12,
    fontFamily: 'Times-Roman', // Built-in formal font
    color: '#1a1a1a',
    lineHeight: 1.6,
  },
  addressBlock: {
    marginBottom: 20,
    fontSize: 11,
    lineHeight: 1.4,
  },
  dateBlock: {
    marginBottom: 20,
    fontSize: 11,
  },
  bodyText: {
    textAlign: 'justify',
    marginBottom: 20,
  },
  bold: {
    fontFamily: 'Times-Bold',
  }
});

interface LetterPDFProps {
  data: LetterData;
  layout: 'block' | 'modified-block' | 'simplified';
}

export default function LetterPDF({ data, layout }: LetterPDFProps) {
  const formattedDate = data.date ? new Date(data.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '';

  // Determine alignments based on layout
  const senderAlign = layout === 'block' ? 'left' : layout === 'modified-block' ? 'right' : 'center';
  const dateAlign = layout === 'modified-block' ? 'right' : 'left';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* 1. Sender Address */}
        <View style={[styles.addressBlock, { textAlign: senderAlign }]}>
          <Text style={styles.bold}>{data.senderName || 'Your Name'}</Text>
          <Text>{data.senderAddress}</Text>
          <Text>{data.senderCity}</Text>
          <Text>{data.senderEmail} | {data.senderPhone}</Text>
        </View>

        {/* 2. Date */}
        <View style={[styles.dateBlock, { textAlign: dateAlign }]}>
          <Text>{formattedDate}</Text>
        </View>

        {/* 3. Recipient Address (Always Left) */}
        <View style={[styles.addressBlock, { textAlign: 'left' }]}>
          <Text style={styles.bold}>{data.recipientName}</Text>
          <Text>{data.recipientTitle}</Text>
          <Text>{data.recipientCompany}</Text>
          <Text>{data.recipientAddress}</Text>
          <Text>{data.recipientCity}</Text>
        </View>

        {/* 4. Salutation */}
        <View style={{ marginBottom: 15 }}>
          <Text>Dear {data.recipientName ? data.recipientName.split(' ')[0] : 'Sir/Madam'},</Text>
        </View>

        {/* 5. Subject */}
        {data.subject && (
          <View style={{ marginBottom: 20, textAlign: 'center', textDecoration: 'underline' }}>
            <Text style={styles.bold}>RE: {data.subject.toUpperCase()}</Text>
          </View>
        )}

        {/* 6. Body */}
        <View style={styles.bodyText}>
          <Text>{data.body}</Text>
        </View>

             {/* 7. Closing */}
     <View style={{ marginTop: 40 }}>
        <Text>Sincerely,</Text>
        <Text style={{ height: 20 }}>{''}</Text>
       
       {/* Render Signature in PDF */}
       {data.signatureData && (
         <Image 
           src={data.signatureData} 
           style={{ width: 120, height: 40, marginBottom: 5 }} 
         />
       )}
       
       <Text style={styles.bold}>{data.senderName}</Text>
     </View>

      </Page>
    </Document>
  );
}