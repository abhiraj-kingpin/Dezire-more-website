function money(n) {
  return `Rs ${Number(n).toLocaleString('en-IN')}`;
}

// Generates a clean, simple invoice PDF for an order and triggers a download.
// No external template/library beyond jsPDF's own text/line drawing — kept
// deliberately plain rather than trying to fake a fancy branded layout.
// jsPDF is dynamically imported so its (fairly heavy) bundle is only ever
// fetched when someone actually clicks "Download Invoice", not on every
// page load.
export async function downloadInvoice(order) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  let y = 56;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Dezire More', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Ethnic Elegance. Modern You.', marginX, y + 14);
  doc.setTextColor(0);

  doc.setFontSize(11);
  doc.text('TAX INVOICE', 545 - marginX + marginX, y, { align: 'right' });

  y += 40;
  doc.setDrawColor(200);
  doc.line(marginX, y, 545, y);
  y += 24;

  doc.setFontSize(10);
  doc.text(`Order Number: ${order.orderNumber}`, marginX, y);
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 545, y, { align: 'right' });
  y += 16;
  doc.text(`Payment: ${order.paymentMethod} (${order.paymentStatus})`, marginX, y);
  doc.text(`Order Status: ${order.orderStatus}`, 545, y, { align: 'right' });
  // GSTIN is only shown once actually registered — set VITE_GST_NUMBER in
  // the frontend build env when it is; omitted rather than left blank so an
  // unregistered store's invoices don't imply a GSTIN that doesn't exist.
  if (import.meta.env.VITE_GST_NUMBER) {
    y += 16;
    doc.text(`GSTIN: ${import.meta.env.VITE_GST_NUMBER}`, marginX, y);
  }

  y += 28;
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To', marginX, y);
  doc.setFont('helvetica', 'normal');
  y += 14;
  doc.text(order.customerName, marginX, y);
  y += 14;
  doc.text(order.customerEmail, marginX, y);
  y += 14;
  doc.text(order.customerPhone, marginX, y);
  y += 14;
  doc.text(`${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pin}`, marginX, y, { maxWidth: 500 });

  y += 32;
  doc.setDrawColor(220);
  doc.line(marginX, y, 545, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.text('Item', marginX, y);
  doc.text('Qty', 300, y, { align: 'right' });
  doc.text('Price', 372, y, { align: 'right' });
  doc.text('GST', 430, y, { align: 'right' });
  doc.text('Amount', 545, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 10;
  doc.line(marginX, y, 545, y);
  y += 16;

  order.items.forEach(item => {
    const variant = [item.size, item.color].filter(Boolean).join(' / ');
    const label = variant ? `${item.name} (${variant})` : item.name;
    const gstAmount = item.gstAmount || 0;
    doc.text(label, marginX, y, { maxWidth: 230 });
    doc.text(String(item.quantity), 300, y, { align: 'right' });
    doc.text(money(item.price), 372, y, { align: 'right' });
    doc.text(item.gstRate != null ? `${item.gstRate}%` : '—', 430, y, { align: 'right' });
    doc.text(money(item.price * item.quantity + gstAmount), 545, y, { align: 'right' });
    y += 20;
  });

  y += 6;
  doc.line(marginX, y, 545, y);
  y += 20;

  doc.text('Subtotal (pre-GST)', 460, y, { align: 'right' });
  doc.text(money(order.subtotal), 545, y, { align: 'right' });
  y += 16;

  // GST breakdown by the two applicable rates, then the same total split
  // into CGST + SGST (each exactly half) for domestic intra-state orders —
  // the standard Indian tax-invoice presentation of the same figure two
  // ways: by rate, and by the CGST/SGST split GST law requires it be shown as.
  const totalGST = order.totalGST || 0;
  if (order.gstBreakdown?.gst5 > 0) {
    doc.text('GST (5% items)', 460, y, { align: 'right' });
    doc.text(money(order.gstBreakdown.gst5), 545, y, { align: 'right' });
    y += 16;
  }
  if (order.gstBreakdown?.gst18 > 0) {
    doc.text('GST (18% items)', 460, y, { align: 'right' });
    doc.text(money(order.gstBreakdown.gst18), 545, y, { align: 'right' });
    y += 16;
  }
  if (totalGST > 0) {
    doc.text('CGST (50% of GST)', 460, y, { align: 'right' });
    doc.text(money(totalGST / 2), 545, y, { align: 'right' });
    y += 16;
    doc.text('SGST (50% of GST)', 460, y, { align: 'right' });
    doc.text(money(totalGST / 2), 545, y, { align: 'right' });
    y += 16;
  }
  if (order.discountAmount > 0) {
    doc.text('Coupon Discount', 460, y, { align: 'right' });
    doc.text(`−${money(order.discountAmount)}`, 545, y, { align: 'right' });
    y += 16;
  }
  doc.text('Delivery', 460, y, { align: 'right' });
  doc.text(order.deliveryCharge === 0 ? 'FREE' : money(order.deliveryCharge), 545, y, { align: 'right' });
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total', 460, y, { align: 'right' });
  doc.text(money(order.total), 545, y, { align: 'right' });

  y += 50;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text('This is a system-generated invoice from Dezire More. For questions, reach us at hello@deziremore.in', marginX, y);

  doc.save(`Invoice-${order.orderNumber}.pdf`);
}
