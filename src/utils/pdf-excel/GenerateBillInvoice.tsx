import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill } from '../../types/bills';
import { AppSettings } from '../../types/settings';

// Add the declaration for the autotable plugin to avoid TypeScript errors
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
  }
}

export const GenerateBillInvoice = async (bill: Bill, appSettings: AppSettings): Promise<void> => {
  const businessSettings = appSettings.business;
  const billSettings = appSettings.billSettings;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(52, 73, 94);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(businessSettings.businessName || 'Business Name', pageWidth / 2, 30, { align: 'center' });

  // Business details (only show if enabled in settings)
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  let currentY = 50;

  if (billSettings.showBusinessAddress && businessSettings.businessAddress) {
    doc.text(businessSettings.businessAddress, 15, currentY);
    currentY += 6;

    const cityStateZip = [
      businessSettings.businessCity,
      businessSettings.businessState,
      businessSettings.businessPostalCode
    ].filter(Boolean).join(', ');

    if (cityStateZip) {
      doc.text(cityStateZip, 15, currentY);
      currentY += 6;
    }
  }

  if (businessSettings.businessPhone) {
    doc.text(`Phone: ${businessSettings.businessPhone}`, 15, currentY);
    currentY += 6;
  }

  if (businessSettings.businessEmail) {
    doc.text(`Email: ${businessSettings.businessEmail}`, 15, currentY);
    currentY += 6;
  }

  if (billSettings.showGSTIN && businessSettings.businessGSTIN) {
    doc.text(`GSTIN: ${businessSettings.businessGSTIN}`, 15, currentY);
    currentY += 6;
  }

  // Right column - Invoice details
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice #: ${bill.billId}`, pageWidth - 15, 50, { align: 'right' });

  const formattedDate = new Date(bill.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.text(`Date: ${formattedDate}`, pageWidth - 15, 56, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // Calculate customer section start position
  const customerSectionY = Math.max(currentY + 10, 78);

  // Customer details
  doc.setFillColor(240, 240, 240);
  doc.rect(15, customerSectionY, pageWidth - 30, 25, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information:', 20, customerSectionY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${bill.customerName || 'Walk-in Customer'}`, 20, customerSectionY + 14);
  doc.text(`Phone: ${bill.customerPhone || 'N/A'}`, 20, customerSectionY + 21);

  // Payment method
  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Method: `, pageWidth - 75, customerSectionY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1), pageWidth - 15, customerSectionY + 7, { align: 'right' });

  // Add products table
  const tableColumn = ['#', 'Product', 'Price', 'Qty', 'Total'];
  const tableRows = bill.items.map((item, index) => [
    index + 1,
    item.productName,
    `${item.price.toFixed(2)}`,
    item.quantity,
    `${item.totalPrice.toFixed(2)}`
  ]);

  const tableStartY = customerSectionY + 35;

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: tableStartY,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });

  // Add total calculations
  const finalY = (doc as any).lastAutoTable.finalY || 150;

  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 100, finalY + 10, pageWidth - 15, finalY + 10);

  doc.text('Subtotal:', pageWidth - 100, finalY + 20);
  doc.text(`${bill.subtotal.toFixed(2)}`, pageWidth - 15, finalY + 20, { align: 'right' });

  // Use GST rate from settings
  const gstRate = appSettings.billing.defaultGST || 18;
  doc.text(`GST (${gstRate}%):`, pageWidth - 100, finalY + 27);
  doc.text(`${bill.tax.toFixed(2)}`, pageWidth - 15, finalY + 27, { align: 'right' });

  doc.line(pageWidth - 100, finalY + 32, pageWidth - 15, finalY + 32);

  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 100, finalY + 40);
  doc.text(`${bill.total.toFixed(2)}`, pageWidth - 15, finalY + 40, { align: 'right' });

  // Add footer (only if enabled in settings)
  if (billSettings.showFooterText) {
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(1);
    doc.line(15, doc.internal.pageSize.getHeight() - 35, pageWidth - 15, doc.internal.pageSize.getHeight() - 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const footerText = billSettings.footerText || 'Thank you for your business!';
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 25, { align: 'center' });
    doc.text('Terms & Conditions Apply', pageWidth / 2, doc.internal.pageSize.getHeight() - 18, { align: 'center' });
  }

  // Save the PDF
  doc.save(`Invoice-${bill.billId}.pdf`);
};

export const PrintBillInvoice = (bill: Bill, appSettings: AppSettings): void => {
  const businessSettings = appSettings.business;
  const billSettings = appSettings.billSettings;

  // Create a new PDF document
  const doc = new jsPDF();

  // Set document properties
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add company logo/header
  doc.setFillColor(52, 73, 94); // Dark blue header
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(businessSettings.businessName || 'Your Business Name', pageWidth / 2, 30, { align: 'center' });

  // Add invoice information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  // Left column - Business details (only show if enabled in settings)
  let currentY = 50;

  if (billSettings.showBusinessAddress && businessSettings.businessAddress) {
    doc.text(businessSettings.businessAddress, 15, currentY);
    currentY += 6;

    const cityStateZip = [
      businessSettings.businessCity,
      businessSettings.businessState,
      businessSettings.businessPostalCode
    ].filter(Boolean).join(', ');

    if (cityStateZip) {
      doc.text(cityStateZip, 15, currentY);
      currentY += 6;
    }
  }

  if (businessSettings.businessPhone) {
    doc.text(`Phone: ${businessSettings.businessPhone}`, 15, currentY);
    currentY += 6;
  }

  if (businessSettings.businessEmail) {
    doc.text(`Email: ${businessSettings.businessEmail}`, 15, currentY);
    currentY += 6;
  }

  if (billSettings.showGSTIN && businessSettings.businessGSTIN) {
    doc.text(`GSTIN: ${businessSettings.businessGSTIN}`, 15, currentY);
    currentY += 6;
  }

  // Right column - Invoice details
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice #: ${bill.billId}`, pageWidth - 15, 50, { align: 'right' });

  const formattedDate = new Date(bill.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.text(`Date: ${formattedDate}`, pageWidth - 15, 56, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // Calculate customer section start position
  const customerSectionY = Math.max(currentY + 10, 78);

  // Customer details
  doc.setFillColor(240, 240, 240);
  doc.rect(15, customerSectionY, pageWidth - 30, 25, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information:', 20, customerSectionY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${bill.customerName || 'Walk-in Customer'}`, 20, customerSectionY + 14);
  doc.text(`Phone: ${bill.customerPhone || 'N/A'}`, 20, customerSectionY + 21);

  // Payment method
  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Method: `, pageWidth - 75, customerSectionY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1), pageWidth - 15, customerSectionY + 7, { align: 'right' });

  // Add products table
  const tableColumn = ['#', 'Product', 'Price', 'Qty', 'Total'];
  const tableRows = bill.items.map((item, index) => [
    index + 1,
    item.productName,
    `${item.price.toFixed(2)}`,
    item.quantity,
    `${item.totalPrice.toFixed(2)}`
  ]);

  const tableStartY = customerSectionY + 35;

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: tableStartY,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });

  // Add total calculations
  const finalY = (doc as any).lastAutoTable.finalY || 150;

  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 100, finalY + 10, pageWidth - 15, finalY + 10);

  doc.text('Subtotal:', pageWidth - 100, finalY + 20);
  doc.text(`${bill.subtotal.toFixed(2)}`, pageWidth - 15, finalY + 20, { align: 'right' });

  // Use GST rate from settings
  const gstRate = appSettings.billing.defaultGST || 18;
  doc.text(`GST (${gstRate}%):`, pageWidth - 100, finalY + 27);
  doc.text(`${bill.tax.toFixed(2)}`, pageWidth - 15, finalY + 27, { align: 'right' });

  doc.line(pageWidth - 100, finalY + 32, pageWidth - 15, finalY + 32);

  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 100, finalY + 40);
  doc.text(`${bill.total.toFixed(2)}`, pageWidth - 15, finalY + 40, { align: 'right' });

  // Add footer (only if enabled in settings)
  if (billSettings.showFooterText) {
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(1);
    doc.line(15, doc.internal.pageSize.getHeight() - 35, pageWidth - 15, doc.internal.pageSize.getHeight() - 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const footerText = billSettings.footerText || 'Thank you for your business!';
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 25, { align: 'center' });
    doc.text('Terms & Conditions Apply', pageWidth / 2, doc.internal.pageSize.getHeight() - 18, { align: 'center' });
  }

  // Open PDF in new window and print
  const pdfData = doc.output('datauristring');
  const printWindow = window.open('');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
        </head>
        <body>
          <embed width="100%" height="100%" src="${pdfData}" type="application/pdf" />
        </body>
      </html>
    `);
    printWindow.document.close();

    // Trigger print after the PDF is loaded
    printWindow.onload = function () {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    };
  }
};