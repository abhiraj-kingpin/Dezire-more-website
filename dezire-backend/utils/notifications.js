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

// Shared branded shell — dark green header, serif body (Georgia, since
// email clients don't reliably load custom web fonts), gold accents,
// matching the site's luxury look. `bodyHtml` is the email-specific content.
function emailShell(bodyHtml) {
  return `
  <div style="background:#f4f1ea;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e8dfc8;">
      <div style="background:linear-gradient(135deg,#16261f,#1e3a2f);padding:28px 32px;text-align:center;">
        <div style="font-size:22px;letter-spacing:4px;color:#ffffff;font-weight:bold;">DEZIRE MORE</div>
        <div style="font-size:11px;letter-spacing:2px;color:#d4ae6e;text-transform:uppercase;margin-top:6px;">Ethnic Elegance. Modern You.</div>
      </div>
      <div style="padding:36px 32px;color:#1a1a1a;">
        ${bodyHtml}
      </div>
      <div style="background:#f7f3ea;padding:18px 32px;text-align:center;border-top:1px solid #e8dfc8;">
        <p style="margin:0;font-size:11px;color:#a08a55;letter-spacing:1px;">✦ DEZIRE MORE — QUINTESSENTIAL QUEENS ✦</p>
      </div>
    </div>
  </div>`;
}

function emailButton(href, label) {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}" style="display:inline-block;background:#1e3a2f;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:14px 36px;border-radius:4px;border:1px solid #d4ae6e;">${label}</a>
    </div>`;
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

  const html = emailShell(`
      <h2 style="color:#1e3a2f;margin:0 0 12px;font-size:20px;">Thank you for your order, ${order.customerName}!</h2>
      <p style="margin:0 0 16px;">Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        ${orderItemsHtml(order)}
        <tr><td style="padding-top:12px;border-top:1px solid #ddd;">Subtotal</td><td style="text-align:right;padding-top:12px;border-top:1px solid #ddd;">${formatCurrency(order.subtotal)}</td></tr>
        <tr><td>Delivery</td><td style="text-align:right;">${order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge)}</td></tr>
        <tr><td style="font-weight:bold;padding-top:8px;">Total</td><td style="text-align:right;font-weight:bold;padding-top:8px;">${formatCurrency(order.total)}</td></tr>
      </table>
      <p style="font-size:14px;"><strong>Payment:</strong> ${order.paymentMethod} — ${order.paymentStatus}</p>
      <p style="font-size:14px;"><strong>Delivery Address:</strong><br/>${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pin}</p>
      ${order.estimatedDelivery ? `<p style="font-size:14px;"><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toDateString()}</p>` : ''}
  `);

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

  const html = emailShell(`
      <h2 style="margin:0 0 12px;font-size:18px;">New Order — ${order.orderNumber}</h2>
      <p style="font-size:14px;"><strong>Customer:</strong> ${order.customerName}<br/>
         <strong>Phone:</strong> ${order.customerPhone}<br/>
         <strong>Email:</strong> ${order.customerEmail}</p>
      <p style="font-size:14px;"><strong>Address:</strong> ${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pin}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        ${orderItemsHtml(order)}
      </table>
      <p style="font-size:14px;"><strong>Total:</strong> ${formatCurrency(order.total)}<br/>
         <strong>Payment:</strong> ${order.paymentMethod} — ${order.paymentStatus}</p>
  `);

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: adminEmail,
    subject: `🛍️ New Order ${order.orderNumber} — ${formatCurrency(order.total)}`,
    html,
  });
  return { sent: true };
}

// Link-based email verification (signup). The button is the primary path;
// the raw URL is included as a fallback for email clients that strip links
// out of buttons or block images/styling.
async function sendVerificationEmail(email, verifyUrl) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'smtp-not-configured' };

  const html = emailShell(`
      <h2 style="color:#1e3a2f;margin:0 0 12px;font-size:20px;">Verify Your Email</h2>
      <p style="margin:0 0 8px;">Welcome to Dezire More! Please confirm this is your email address to activate your account.</p>
      ${emailButton(verifyUrl, 'Verify Email Address')}
      <p style="font-size:12px;color:#888;margin:0 0 4px;">Button not working? Copy and paste this link into your browser:</p>
      <p style="font-size:12px;color:#1e3a2f;word-break:break-all;margin:0 0 20px;">${verifyUrl}</p>
      <p style="font-size:13px;color:#888;">This link expires in 24 hours. If you didn't create a Dezire More account, you can safely ignore this email.</p>
  `);

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verify your email — Dezire More',
    html,
  });
  return { sent: true };
}

module.exports = { sendOrderConfirmationEmail, sendAdminOrderAlert, sendVerificationEmail };
