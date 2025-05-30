import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import numberToWords from 'number-to-words';
import { useEffect } from 'react';
import { Bill } from 'types/bills';
import { AppSettings } from 'types/settings';

interface GenerateBillPrintProps {
  bill: Bill;
  businessDetails?: AppSettings['business'];
  billSettings?: AppSettings['billSettings'];
}

const convertToWords = (amount: number): string => {
  const wholePart = Math.floor(amount);
  const decimalPart = Math.round((amount - wholePart) * 100);

  const wholeWords = numberToWords.toWords(wholePart);
  const formattedWholeWords = wholeWords.charAt(0).toUpperCase() + wholeWords.slice(1);

  if (decimalPart > 0) {
    const decimalWords = numberToWords.toWords(decimalPart);
    return `${formattedWholeWords} Rupees and ${decimalWords} Paise Only`;
  }

  return `${formattedWholeWords} Rupees Only`;
};

const formatPhoneNumbers = (phones: number[] | string | undefined): string => {
  if (!phones) return 'N/A';
  if (typeof phones === 'string') return phones;
  return phones.join(', ');
};

const GenerateBillPrint: React.FC<GenerateBillPrintProps> = ({
  bill,
  businessDetails,
  billSettings
}) => {
  useEffect(() => {
    const generatePDF = () => {
      // Calculate height based on content
      // Typical ratio for thermal paper is about 3:1 (height:width)
      const paperWidth = billSettings?.paperWidth || 80;
      const pageHeight = Math.max(150, 40 + (bill.items.length * 10)); // Minimum 150mm height

      // Convert mm to points (1 mm = 2.83465 points)
      const width = paperWidth * 2.83465;
      const height = pageHeight * 2.83465;

      // Create new document with custom thermal paper size
      const doc = new jsPDF({
        unit: 'pt',
        format: [width, height],
        orientation: 'portrait'
      });

      const margin = 20; // points
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);

      const fontSize = {
        title: 10,
        subtitle: 8,
        normal: 7,
        small: 6
      };

      let yPos = margin;
      const lineHeight = {
        title: 14,
        subtitle: 12,
        normal: 10,
        small: 8
      };

      // Header with business details
      doc.setFontSize(fontSize.subtitle);
      doc.text('|| SHREE GANESHAY NAMAH ||', pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight.subtitle;

      doc.setFontSize(fontSize.title);
      if (billSettings?.showLogo) {
        // Add logo if available and enabled
        // TODO: Implement logo
      }

      doc.text(businessDetails?.businessName || 'Business Name', pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight.title;

      doc.setFontSize(fontSize.small);
      if (billSettings?.showBusinessAddress) {
        doc.text(businessDetails?.businessAddress || '', pageWidth / 2, yPos, { align: 'center' });
        yPos += lineHeight.small;

        doc.text(
          `${businessDetails?.businessCity || ''} ${businessDetails?.businessState || ''} ${businessDetails?.businessPostalCode || ''}`.trim(),
          pageWidth / 2,
          yPos,
          { align: 'center' }
        );
        yPos += lineHeight.small;

        doc.text(`Ph: ${formatPhoneNumbers(businessDetails?.businessPhone)}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += lineHeight.small;
      }

      if (billSettings?.showGSTIN) {
        doc.text(`GSTIN: ${businessDetails?.businessGSTIN || ''}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += lineHeight.small + 2;
      }

      // Invoice title with return bill indication
      doc.setFontSize(fontSize.normal);
      doc.text(bill.isReturn ? 'RETURN - INVOICE' : 'TAXABLE - INVOICE', pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight.normal;

      if (bill.isReturn && bill.originalBillId) {
        doc.setFontSize(fontSize.small);
        doc.text(`(Original Bill: ${bill.originalBillId})`, pageWidth / 2, yPos, { align: 'center' });
        yPos += lineHeight.small;
      }

      // Add a divider line
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += lineHeight.small;

      // Customer & Invoice details
      doc.setFontSize(fontSize.normal);
      doc.text(`Name: ${bill.customerName || 'Walk-in Customer'}`, margin, yPos);
      doc.text(`Invoice No: ${bill.billId}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight.normal;

      doc.text(`Phone: ${bill.customerPhone || 'N/A'}`, margin, yPos);
      doc.text(`Date: ${new Date(bill.date).toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight.normal + 5;

      // Items table - optimized for thermal printers (narrower)
      autoTable(doc, {
        head: [['Item', 'Qty', 'Rate', 'Amount']],
        body: bill.items.map((item) => [
          `${item.productName}\n(${item.productCode})`,
          item.quantity.toString(),
          `${item.price.toFixed(2)}`,
          `${Math.abs(item.totalPrice).toFixed(2)}`
        ]),
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: fontSize.small,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.45 },
          1: { halign: 'center', cellWidth: contentWidth * 0.15 },
          2: { halign: 'right', cellWidth: contentWidth * 0.15 },
          3: { halign: 'right', cellWidth: contentWidth * 0.25 }
        }
      });

      // Get final position after table drawing
      const finalY = (doc as any).lastAutoTable.finalY || yPos + (bill.items.length * 10);
      let summaryStartY = finalY + 10;

      // Summary section
      doc.setFontSize(fontSize.normal);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(pageWidth - 120, summaryStartY, pageWidth - margin, summaryStartY);
      summaryStartY += 2;

      // Total calculations
      doc.text('Subtotal:', pageWidth - 90, summaryStartY + 8);
      doc.text(`${bill.subtotal.toFixed(2)}`, pageWidth - margin, summaryStartY + 8, { align: 'right' });

      doc.text(`GST (${bill.gstPercentage}%):`, pageWidth - 90, summaryStartY + 16);
      doc.text(`${bill.tax.toFixed(2)}`, pageWidth - margin, summaryStartY + 16, { align: 'right' });

      // Draw line before grand total
      doc.setLineWidth(0.5);
      doc.line(pageWidth - 120, summaryStartY + 20, pageWidth - margin, summaryStartY + 20);

      // Grand total with slightly larger font
      doc.setFontSize(fontSize.title);
      doc.text('Total:', pageWidth - 90, summaryStartY + 30);
      doc.text(`${bill.total.toFixed(2)}`, pageWidth - margin, summaryStartY + 30, { align: 'right' });
      summaryStartY += 35;

      // Amount in words
      doc.setFontSize(fontSize.normal);
      doc.text('Amount in words:', margin, summaryStartY);
      doc.text(convertToWords(bill.total), margin, summaryStartY + 10, { maxWidth: contentWidth });
      summaryStartY += 25;

      // Payment method
      doc.text(`Payment Method: ${bill.paymentMethod.toUpperCase()}`, margin, summaryStartY);
      summaryStartY += 15;

      // Footer
      if (billSettings?.showFooterText) {
        doc.setFontSize(fontSize.small);
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(margin, summaryStartY, pageWidth - margin, summaryStartY);
        summaryStartY += 10;
        doc.text(billSettings.footerText, pageWidth / 2, summaryStartY, { align: 'center' });
        summaryStartY += 15;
      }

      // Bank details if enabled
      if (billSettings?.showBankDetails) {
        doc.text('Bank: BANK OF INDIA', margin, summaryStartY);
        summaryStartY += 8;
        doc.text('A/C: 450020110000775', margin, summaryStartY);
        summaryStartY += 8;
        doc.text('IFSC: BKID0004500', margin, summaryStartY);
        summaryStartY += 15;
      }

      // Signature
      doc.text('For - ' + (businessDetails?.businessName || 'SUHAGAN'), pageWidth - margin, summaryStartY, { align: 'right' });
      summaryStartY += 8;
      doc.text('Authorized Signatory', pageWidth - margin, summaryStartY, { align: 'right' });

      // Open PDF in new window optimized for direct printing
      const pdfOutput = doc.output('datauristring');
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice #${bill.billId}</title>
              <style>
                /* Hide UI elements when printing */
                @media print {
                  .no-print { display: none !important; }
                  body { margin: 0; padding: 0; }
                  
                  /* Thermal printer specific settings */
                  @page {
                    size: ${paperWidth}mm auto;
                    margin: 0mm;
                  }
                }
                
                /* Style for screen view */
                body { 
                  margin: 0; 
                  padding: 0; 
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  background-color: #f5f5f5;
                  font-family: Arial, sans-serif;
                }
                .container {
                  max-width: 100%;
                  width: 100%;
                  padding: 20px;
                  box-sizing: border-box;
                }
                iframe {
                  width: ${paperWidth * 4}px;
                  height: 600px;
                  border: 1px solid #ccc;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  background-color: white;
                }
                .controls {
                  margin-top: 15px;
                  text-align: center;
                  padding: 10px;
                  background-color: white;
                  border-radius: 5px;
                  box-shadow: 0 0 5px rgba(0,0,0,0.05);
                }
                button {
                  padding: 8px 16px;
                  margin: 0 5px;
                  cursor: pointer;
                  background-color: #4CAF50;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  font-weight: bold;
                }
                button:hover {
                  background-color: #45a049;
                }
                .print-note {
                  font-size: 12px;
                  color: #666;
                  margin-top: 8px;
                }
                .size-selector {
                  margin-top: 10px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <iframe src="${pdfOutput}" id="pdf-frame"></iframe>
                <div class="controls no-print">
                  <button onclick="printInvoice()">Print Invoice</button>
                  <button onclick="downloadPDF()">Download PDF</button>
                  <div class="print-note">
                    Note: For thermal printers, select "Receipt" or "Thermal" paper size in print options.
                  </div>
                  <div class="size-selector">
                    <label for="paper-size">Paper Width: </label>
                    <select id="paper-size" onchange="changePaperSize()">
                      <option value="58" ${paperWidth === 58 ? 'selected' : ''}>58mm (Small Thermal)</option>
                      <option value="80" ${paperWidth === 80 ? 'selected' : ''}>80mm (Standard Thermal)</option>
                      <option value="210" ${paperWidth === 210 ? 'selected' : ''}>A4 (210mm)</option>
                    </select>
                  </div>
                </div>
              </div>
              <script>
                function printInvoice() {
                  const iframe = document.getElementById('pdf-frame');
                  
                  if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                  } else {
                    window.print();
                  }
                }
                
                function downloadPDF() {
                  const link = document.createElement('a');
                  link.href = '${pdfOutput}';
                  link.download = 'Invoice-${bill.billId}.pdf';
                  link.click();
                }
                
                function changePaperSize() {
                  const size = parseInt(document.getElementById('paper-size').value);
                  window.parent.postMessage({ type: 'PAPER_SIZE_CHANGE', size }, '*');
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                }
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    };

    generatePDF();
  }, [bill, businessDetails, billSettings]);

  return null;
};

export default GenerateBillPrint;