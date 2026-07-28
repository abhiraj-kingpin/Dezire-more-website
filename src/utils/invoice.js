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
  doc.text('Qty', 380, y, { align: 'right' });
  doc.text('Price', 460, y, { align: 'right' });
  doc.text('Amount', 545, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 10;
  doc.line(marginX, y, 545, y);
  y += 16;

  order.items.forEach(item => {
    const variant = [item.size, item.color].filter(Boolean).join(' / ');
    const label = variant ? `${item.name} (${variant})` : item.name;
    doc.text(label, marginX, y, { maxWidth: 300 });
    doc.text(String(item.quantity), 380, y, { align: 'right' });
    doc.text(money(item.price), 460, y, { align: 'right' });
    doc.text(money(item.price * item.quantity), 545, y, { align: 'right' });
    y += 20;
  });

  y += 6;
  doc.line(marginX, y, 545, y);
  y += 20;

  doc.text('Subtotal', 460, y, { align: 'right' });
  doc.text(money(order.subtotal), 545, y, { align: 'right' });
  y += 16;
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
