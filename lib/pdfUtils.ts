import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getCachedCompanySettings, CompanySettings, getFormattedAddress, formatIndianPhoneDisplay, getWhatsAppPhone } from './companySettings';

export type OrderData = {
  bill_no: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ name: string; qty: number; price: number; total: number; product_id?: string }>;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  payment_method: string;
  billed_by?: string;
  tax?: number;
};

/**
 * Format itemized WhatsApp message for a completed bill
 */
export function formatWhatsAppBillMessage(order: OrderData, customSettings?: CompanySettings): string {
  const settings = customSettings || getCachedCompanySettings();
  const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  
  const regularItems = order.items.filter(item => item.product_id !== 'meta_staff' && !item.name.startsWith('Billed by:'));
  const itemList = regularItems.map(item => `• ${item.qty}x ${item.name} — ₹${item.total.toFixed(0)}`).join('\n');
  const points = Math.floor(order.total / 100);

  return `*${(settings.name || 'THIRST.').toUpperCase()} — LUXURY DESSERTS* 🍰
📍 ${getFormattedAddress(settings) || 'Thiruvallur Flagship'}
📞 Tel: ${settings.phone || '+91 87548 81546'}
${settings.gstin ? `GSTIN: ${settings.gstin}` : ''}
───────────────────────────
🧾 *TAX INVOICE*
*Bill No:* ${order.bill_no}
*Date:* ${dateStr}
*Customer:* ${order.customer_name || 'Walk-in Customer'}
${order.billed_by ? `*Served by:* ${order.billed_by}` : ''}

*ORDER DETAILS:*
${itemList}

───────────────────────────
*Subtotal:* ₹${order.subtotal.toFixed(0)}
${order.discount > 0 ? `*Discount:* -₹${order.discount.toFixed(0)}\n` : ''}*TOTAL AMOUNT:* *₹${order.total.toFixed(0)}*
*Payment Mode:* ${order.payment_method.toUpperCase()}
${points > 0 ? `*Loyalty Points Earned:* ${points} pts ⭐\n` : ''}───────────────────────────
Thank you for indulging with Thirst.! ❤
We hope to see you again soon!`;
}

/**
 * Open WhatsApp with customer phone and formatted bill message
 */
export function sendBillViaWhatsApp(order: OrderData, customSettings?: CompanySettings) {
  const cleanPhone = getWhatsAppPhone(order.customer_phone);
  const message = formatWhatsAppBillMessage(order, customSettings);
  if (!cleanPhone) {
    alert('Please enter a valid customer phone number to send WhatsApp bill.');
    return;
  }
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Print compact thermal receipt directly to printer via browser print dialog.
 * Supports standard 80mm roll paper (default) or 58mm compact roll paper.
 */
export function printThermalReceipt(order: OrderData, paperWidth: '80mm' | '58mm' = '80mm', customSettings?: CompanySettings) {
  const settings = customSettings || getCachedCompanySettings();
  const is58mm = paperWidth === '58mm';

  const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const regularItems = order.items.filter(item => item.product_id !== 'meta_staff' && !item.name.startsWith('Billed by:'));
  const points = Math.floor(order.total / 100);

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt - ${order.bill_no}</title>
      <style>
        @page {
          size: ${paperWidth} auto;
          margin: 0mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          width: ${is58mm ? '52mm' : '72mm'};
          margin: 0 auto;
          padding: 4mm 2mm;
          color: #000;
          font-size: ${is58mm ? '10px' : '12px'};
          line-height: 1.3;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .center {
          text-align: center;
        }
        .bold {
          font-weight: bold;
        }
        .brand-title {
          font-size: ${is58mm ? '16px' : '20px'};
          font-weight: 900;
          letter-spacing: 1px;
          margin-bottom: 2px;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .double-divider {
          border-top: 2px solid #000;
          margin: 6px 0;
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 4px 0;
        }
        th, td {
          padding: 3px 0;
          font-size: ${is58mm ? '10px' : '11px'};
        }
        th {
          border-bottom: 1px dashed #000;
          font-weight: bold;
        }
        .item-row td {
          vertical-align: top;
        }
        .total-box {
          font-size: ${is58mm ? '13px' : '15px'};
          font-weight: 900;
          margin: 6px 0;
        }
        .footer-note {
          font-size: ${is58mm ? '9px' : '10px'};
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="brand-title">${(settings.name || 'THIRST.').toUpperCase()}</div>
        <div>${settings.tagline || 'Luxury Dessert Boutique'}</div>
        <div style="font-size: ${is58mm ? '9px' : '10px'}; margin-top: 2px;">
          ${settings.address_line1 || ''}${settings.address_line2 ? `, ${settings.address_line2}` : ''}<br />
          ${settings.city || 'Thiruvallur'}${settings.pincode ? ` - ${settings.pincode}` : ''}
        </div>
        <div style="font-size: ${is58mm ? '9px' : '10px'}; margin-top: 2px;">
          Tel: ${settings.phone || '+91 87548 81546'}
        </div>
        ${settings.gstin ? `<div style="font-size: ${is58mm ? '9px' : '10px'};">GSTIN: ${settings.gstin}</div>` : ''}
        ${settings.fssai ? `<div style="font-size: ${is58mm ? '9px' : '10px'};">FSSAI: ${settings.fssai}</div>` : ''}
      </div>

      <div class="double-divider"></div>
      <div class="center bold" style="letter-spacing: 1px;">TAX INVOICE / CASH BILL</div>
      <div class="divider"></div>

      <div class="flex-between">
        <span>Bill No:</span>
        <span class="bold">${order.bill_no}</span>
      </div>
      <div class="flex-between">
        <span>Date & Time:</span>
        <span>${dateStr}</span>
      </div>
      <div class="flex-between">
        <span>Customer:</span>
        <span class="bold">${order.customer_name || 'Walk-in'}</span>
      </div>
      ${order.customer_phone ? `
      <div class="flex-between">
        <span>Phone:</span>
        <span>${order.customer_phone}</span>
      </div>` : ''}
      ${order.billed_by ? `
      <div class="flex-between">
        <span>Cashier:</span>
        <span>${order.billed_by}</span>
      </div>` : ''}

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Item</th>
            <th style="text-align: center; width: 30px;">Qty</th>
            <th style="text-align: right; width: 45px;">Price</th>
            <th style="text-align: right; width: 50px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${regularItems.map(item => `
            <tr class="item-row">
              <td style="text-align: left;">${item.name}</td>
              <td style="text-align: center;">${item.qty}</td>
              <td style="text-align: right;">${item.price.toFixed(0)}</td>
              <td style="text-align: right; font-weight: bold;">${item.total.toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="flex-between">
        <span>Subtotal:</span>
        <span>Rs. ${order.subtotal.toFixed(2)}</span>
      </div>
      ${order.discount > 0 ? `
      <div class="flex-between">
        <span>Discount:</span>
        <span>-Rs. ${order.discount.toFixed(2)}</span>
      </div>` : ''}

      <div class="divider"></div>

      <div class="flex-between total-box">
        <span>NET TOTAL:</span>
        <span>Rs. ${order.total.toFixed(2)}</span>
      </div>

      <div class="divider"></div>

      <div class="flex-between">
        <span>Payment Mode:</span>
        <span class="bold">${order.payment_method.toUpperCase()}</span>
      </div>
      ${points > 0 ? `
      <div class="flex-between" style="margin-top: 3px;">
        <span>Points Earned:</span>
        <span class="bold">${points} pts</span>
      </div>` : ''}

      <div class="double-divider"></div>

      <div class="center footer-note">
        <div class="bold">THANK YOU FOR INDULGING!</div>
        <div>Please visit again for sweet celebrations.</div>
        <div style="margin-top: 4px; font-size: 8px;">* Computer Generated Invoice *</div>
      </div>
    </body>
    </html>
  `;

  // Create hidden iframe for dedicated printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    alert('Unable to initiate receipt printing. Please try again.');
    return;
  }

  doc.open();
  doc.write(receiptHtml);
  doc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print iframe error:', e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  };
}

/**
 * Generate Invoice Image for Social Sharing
 */
export const generateInvoiceImage = async (order: OrderData, customSettings?: CompanySettings): Promise<Blob | null> => {
  const settings = customSettings || getCachedCompanySettings();

  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '420px';
    container.style.background = '#ffffff';
    container.style.fontFamily = 'sans-serif';
    container.style.color = '#2d1e2f';
    container.style.padding = '30px';
    
    const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const regularItems = order.items.filter(item => item.product_id !== 'meta_staff' && !item.name.startsWith('Billed by:'));
    
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #d94f8a; margin: 0; font-size: 28px; font-weight: 800;">${settings.name || 'Thirst.'}</h1>
        <div style="font-size: 12px; color: #787878; margin-top: 5px;">${getFormattedAddress(settings)}</div>
        <div style="font-size: 12px; color: #787878;">Tel: ${settings.phone || '+91 87548 81546'}</div>
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
      ${order.billed_by ? `<div style="text-align: center; font-size: 12px; color: #787878; margin-bottom: 4px;">Served by: ${order.billed_by}</div>` : ''}
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
  try {
    const response = await fetch('/logo-v2.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
};

/**
 * Generate A4 PDF Invoice with dynamic company details
 */
export const generateInvoicePDF = async (order: OrderData, autoDownload = true, customSettings?: CompanySettings) => {
  const settings = customSettings || getCachedCompanySettings();
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

  // Top thick brand bar
  doc.setFillColor(...colors.berry);
  doc.rect(0, 0, pageWidth, 12, 'F');
  
  // Soft background for header
  doc.setFillColor(...colors.lightPink);
  doc.rect(0, 12, pageWidth, 140, 'F');

  try {
    const logoBase64 = await loadLogoAsBase64();
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 40, 50, 50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(...colors.dark);
      doc.text(settings.name || 'Thirst.', margin + 60, 75);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(...colors.dark);
      doc.text(settings.name || 'Thirst.', margin, 75);
    }
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...colors.dark);
    doc.text(settings.name || 'Thirst.', margin, 75);
  }

  // Company Address (Left)
  const addrOffset = margin + 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.gray);
  doc.text(`Flagship: ${settings.address_line1 || 'NO.01, Siva Vishnu kovil street'}`, addrOffset, 95);
  doc.text(`${settings.address_line2 ? `${settings.address_line2}, ` : ''}${settings.city || 'Thiruvallur'} - ${settings.pincode || '602001'}`, addrOffset, 110);
  doc.text(`Phone: ${settings.phone || '+91 87548 81546'}  |  Email: ${settings.email || 'thirst.freshchennai@gmail.com'}`, addrOffset, 125);
  if (settings.gstin) {
    doc.text(`GSTIN: ${settings.gstin}  |  FSSAI: ${settings.fssai || '22425478001152'}`, addrOffset, 138);
  }

  // Invoice Title & Details (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...colors.berry);
  doc.text('TAX INVOICE', pageWidth - margin, 65, { align: 'right' });

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
  doc.text(`Phone: ${order.customer_phone ? formatIndianPhoneDisplay(order.customer_phone) : 'N/A'}`, margin, 245);

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
  
  const regularItems = order.items.filter(item => item.product_id !== 'meta_staff' && !item.name.startsWith('Billed by:'));
  const staffMeta = order.items.find(item => item.product_id === 'meta_staff' || item.name.startsWith('Billed by:'));

  regularItems.forEach((item, index) => {
    if (y > pageHeight - 200) {
      doc.addPage();
      y = margin;
    }

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

  if (order.discount > 0) {
    y += 20;
    doc.text('Discount', totalsX, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`-Rs. ${order.discount.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
  }

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
  
  const serverName = order.billed_by || (staffMeta ? staffMeta.name.replace('Billed by: ', '') : '');
  if (serverName) {
    doc.text(`Served with love by ${serverName}`, pageWidth / 2, footerY + 15, { align: 'center' });
  }
  
  doc.text('Follow us @thirst_fresh  |  Visit us at www.thirstcafe.in', pageWidth / 2, footerY + 28, { align: 'center' });

  if (autoDownload) {
    doc.save(`Thirst_Invoice_${order.bill_no}.pdf`);
  }
  
  return doc;
};
