import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export const generateInvoiceImage = async (order: OrderData): Promise<Blob | null> => {
  return new Promise((resolve) => {
    // Create container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '400px';
    container.style.background = '#ffffff';
    container.style.fontFamily = 'sans-serif';
    container.style.color = '#2d1e2f';
    container.style.padding = '30px';
    
    // Build HTML
    const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const regularItems = order.items.filter(item => (item as any).product_id !== 'meta_staff' && !item.name.startsWith('Billed by:'));
    
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #d94f8a; margin: 0; font-size: 28px; font-weight: 800;">Thirst.</h1>
        <div style="font-size: 12px; color: #787878; margin-top: 5px;">NO.01, Siva Vishnu kovil street,</div>
        <div style="font-size: 12px; color: #787878;">kakkalur, Thiruvallur - 602001</div>
      </div>
      
      <div style="border-top: 1px dashed #d94f8a; border-bottom: 1px dashed #d94f8a; padding: 10px 0; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
          <strong>Bill No:</strong> <span>${order.bill_no}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <strong>Date:</strong> <span>${dateStr}</span>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; color: #787878; margin-bottom: 5px;">Billed To:</div>
        <div style="font-size: 16px; font-weight: bold; color: #d94f8a;">${order.customer_name || 'Walk-in Customer'}</div>
        <div style="font-size: 14px; color: #787878;">${order.customer_phone || 'N/A'}</div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="border-bottom: 2px solid #2d1e2f;">
            <th style="text-align: left; padding: 8px 0; font-size: 14px;">Item</th>
            <th style="text-align: center; padding: 8px 0; font-size: 14px;">Qty</th>
            <th style="text-align: right; padding: 8px 0; font-size: 14px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${regularItems.map(item => `
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 8px 0; font-size: 14px;">${item.name}<br><span style="font-size: 12px; color: #787878;">Rs. ${item.price}</span></td>
              <td style="text-align: center; padding: 8px 0; font-size: 14px;">${item.qty}</td>
              <td style="text-align: right; padding: 8px 0; font-size: 14px; font-weight: bold;">Rs. ${item.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-top: 2px solid #2d1e2f; padding-top: 15px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
          <span>Subtotal</span> <span>Rs. ${order.subtotal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 15px; color: #dc2626;">
          <span>Discount</span> <span>- Rs. ${order.discount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; background: #d94f8a; color: white; padding: 10px; border-radius: 8px;">
          <span>TOTAL</span> <span>Rs. ${order.total}</span>
        </div>
      </div>
      
      <div style="text-align: center; font-size: 14px; color: #d94f8a; font-weight: bold; margin-bottom: 5px;">
        Thank you for indulging with Thirst!
      </div>
      <div style="text-align: center; font-size: 12px; color: #787878;">
        Paid via ${order.payment_method.toUpperCase()}
      </div>
    `;
    
    document.body.appendChild(container);
    
    html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
      document.body.removeChild(container);
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
    }).catch(err => {
      console.error(err);
      if (document.body.contains(container)) document.body.removeChild(container);
      resolve(null);
    });
  });
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

export const generateInvoicePDF = async (order: OrderData, autoDownload = true) => {
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

  if (autoDownload) {
    doc.save(`Thirst_Invoice_${order.bill_no}.pdf`);
  }
  
  return doc;
};
