import jsPDF from 'jspdf';

type OrderData = {
  bill_no: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  payment_method: string;
};

const loadLogoAsBase64 = async (): Promise<string> => {
  const response = await fetch('/logo-v2.png');
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

export const generateInvoicePDF = async (order: OrderData) => {
  const doc = new jsPDF('p', 'pt', 'a4'); 
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  // Brand Colors
  const colors = {
    berry: [217, 79, 138] as [number, number, number],
    dark: [45, 30, 47] as [number, number, number],
    lightPink: [253, 242, 248] as [number, number, number],
    gray: [120, 120, 120] as [number, number, number],
    lightGray: [240, 240, 240] as [number, number, number],
  };

  // --- HEADER SECTION ---
  // Top thick brand bar
  doc.setFillColor(...colors.berry);
  doc.rect(0, 0, pageWidth, 12, 'F');
  
  // Soft background for header
  doc.setFillColor(...colors.lightPink);
  doc.rect(0, 12, pageWidth, 140, 'F');

  try {
    const logoBase64 = await loadLogoAsBase64();
    doc.addImage(logoBase64, 'PNG', margin, 40, 50, 50);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...colors.dark);
    doc.text('Thirst.', margin + 60, 75);
  } catch (e) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...colors.dark);
    doc.text('Thirst.', margin, 75);
  }

  // Company Address (Left)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.gray);
  doc.text('NO.01, Siva Vishnu kovil street,', margin + 60, 95);
  doc.text('kakkalur, Thiruvallur - 602001', margin + 60, 110);
  doc.text('Phone: +91 87548 81546  |  Email: thirst.freshchennai@gmail.com', margin + 60, 125);

  // Invoice Title & Details (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...colors.berry);
  doc.text('INVOICE', pageWidth - margin, 65, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(...colors.dark);
  doc.text(`Bill No: ${order.bill_no}`, pageWidth - margin, 90, { align: 'right' });
  
  const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.gray);
  doc.text(`Date: ${dateStr}`, pageWidth - margin, 105, { align: 'right' });
  doc.text(`Payment: ${order.payment_method.toUpperCase()}`, pageWidth - margin, 120, { align: 'right' });

  // --- CUSTOMER SECTION ---
  doc.setDrawColor(...colors.lightGray);
  doc.setLineWidth(1);
  doc.line(margin, 180, pageWidth - margin, 180);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.dark);
  doc.text('Billed To:', margin, 210);

  doc.setFontSize(14);
  doc.setTextColor(...colors.berry);
  doc.text(order.customer_name || 'Walk-in Customer', margin, 230);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...colors.gray);
  doc.text(`Phone: ${order.customer_phone || 'N/A'}`, margin, 245);

  // --- ITEMS TABLE ---
  let y = 290;
  
  // Table Header
  doc.setFillColor(...colors.dark);
  doc.rect(margin, y, pageWidth - (margin * 2), 35, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM DESCRIPTION', margin + 15, y + 22);
  doc.text('QTY', 330, y + 22, { align: 'center' });
  doc.text('PRICE', 410, y + 22, { align: 'right' });
  doc.text('TOTAL', pageWidth - margin - 15, y + 22, { align: 'right' });

  y += 35;

  // Table Body
  doc.setFont('helvetica', 'normal');
  
  const regularItems = order.items.filter(item => (item as any).product_id !== 'meta_staff' && !item.name.startsWith('Billed by:'));
  const staffMeta = order.items.find(item => (item as any).product_id === 'meta_staff' || item.name.startsWith('Billed by:'));

  regularItems.forEach((item, index) => {
    if (y > pageHeight - 200) {
      doc.addPage();
      y = margin;
    }

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - (margin * 2), 30, 'F');
    }

    doc.setTextColor(...colors.dark);
    doc.setFontSize(10);
    doc.text(item.name, margin + 15, y + 20);
    doc.text(String(item.qty), 330, y + 20, { align: 'center' });
    doc.setTextColor(...colors.gray);
    doc.text(`Rs. ${item.price.toFixed(2)}`, 410, y + 20, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(`Rs. ${item.total.toFixed(2)}`, pageWidth - margin - 15, y + 20, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    y += 30;
  });

  // Table Bottom Line
  doc.setDrawColor(...colors.dark);
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y);

  // --- TOTALS SECTION ---
  y += 30;
  if (y > pageHeight - 150) {
    doc.addPage();
    y = margin + 30;
  }

  const totalsX = pageWidth - margin - 150;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...colors.gray);
  doc.text('Subtotal', totalsX, y);
  doc.text(`Rs. ${order.subtotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

  y += 20;
  doc.text('Discount', totalsX, y);
  doc.setTextColor(220, 38, 38);
  doc.text(`-Rs. ${order.discount.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

  y += 15;
  doc.setDrawColor(...colors.lightGray);
  doc.setLineWidth(1);
  doc.line(totalsX, y, pageWidth - margin, y);

  y += 10;
  // Grand Total Box
  doc.setFillColor(...colors.berry);
  doc.rect(totalsX - 10, y, 160 + margin, 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL', totalsX, y + 26);
  doc.text(`Rs. ${order.total.toFixed(2)}`, pageWidth - margin, y + 26, { align: 'right' });

  // --- FOOTER ---
  const footerY = pageHeight - 60;
  
  doc.setFillColor(...colors.lightPink);
  doc.rect(0, footerY - 20, pageWidth, 80, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.berry);
  doc.text('Thank you for indulging with Thirst!', pageWidth / 2, footerY, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  
  if (staffMeta) {
    doc.text(`Served with love by ${staffMeta.name.replace('Billed by: ', '')}`, pageWidth / 2, footerY + 15, { align: 'center' });
  }
  
  doc.text('Follow us @thirst_fresh  |  Visit us at www.thirstcafe.in', pageWidth / 2, footerY + 28, { align: 'center' });

  doc.save(`Thirst_Invoice_${order.bill_no}.pdf`);
  return doc;
};
