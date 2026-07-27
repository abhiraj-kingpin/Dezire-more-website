const nodemailer = require('nodemailer');

// Email is fully optional — if SMTP env vars aren't set, notifications are
// silently skipped (logged once) rather than crashing order creation.
// Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// (SMTP_FROM defaults to SMTP_USER if not set).
let transporter = null;
let warned = false;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    if (!warned) {
      console.warn('[notifications] SMTP env vars not set — order emails are disabled.');
      warned = true;
    }
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function formatCurrency(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function orderItemsHtml(order) {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${item.name}${item.size ? ` (${item.size})` : ''} × ${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>`
    )
    .join('');
}

async function sendOrderConfirmationEmail(order) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'smtp-not-configured' };

  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
      <h2 style="color:#1e3a2f;">Thank you for your order, ${order.customerName}!</h2>
      <p>Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${orderItemsHtml(order)}
        <tr><td style="padding-top:12px;border-top:1px solid #ddd;">Subtotal</td><td style="text-align:right;padding-top:12px;border-top:1px solid #ddd;">${formatCurrency(order.subtotal)}</td></tr>
        <tr><td>Delivery</td><td style="text-align:right;">${order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge)}</td></tr>
        <tr><td style="font-weight:bold;padding-top:8px;">Total</td><td style="text-align:right;font-weight:bold;padding-top:8px;">${formatCurrency(order.total)}</td></tr>
      </table>
      <p><strong>Payment:</strong> ${order.paymentMethod} — ${order.paymentStatus}</p>
      <p><strong>Delivery Address:</strong><br/>${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pin}</p>
      ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toDateString()}</p>` : ''}
      <p style="margin-top:24px;color:#888;font-size:13px;">Dezire More — Ethnic Elegance. Modern You.</p>
    </div>`;

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: order.customerEmail,
    subject: `Order Confirmed — ${order.orderNumber} | Dezire More`,
    html,
  });
  return { sent: true };
}

async function sendAdminOrderAlert(order) {
  const t = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!t || !adminEmail) return { sent: false, reason: 'smtp-or-admin-email-not-configured' };

  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
      <h2>New Order — ${order.orderNumber}</h2>
      <p><strong>Customer:</strong> ${order.customerName}<br/>
         <strong>Phone:</strong> ${order.customerPhone}<br/>
         <strong>Email:</strong> ${order.customerEmail}</p>
      <p><strong>Address:</strong> ${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pin}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${orderItemsHtml(order)}
      </table>
      <p><strong>Total:</strong> ${formatCurrency(order.total)}<br/>
         <strong>Payment:</strong> ${order.paymentMethod} — ${order.paymentStatus}</p>
    </div>`;

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: adminEmail,
    subject: `🛍️ New Order ${order.orderNumber} — ${formatCurrency(order.total)}`,
    html,
  });
  return { sent: true };
}

module.exports = { sendOrderConfirmationEmail, sendAdminOrderAlert };
