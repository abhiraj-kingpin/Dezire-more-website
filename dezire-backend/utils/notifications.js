// Email is fully optional — if Resend isn't configured, notifications are
// silently skipped (logged once) rather than crashing order creation.
// Required env vars: RESEND_API_KEY, RESEND_FROM_EMAIL
//
// Sends over Resend's HTTPS API rather than raw SMTP. Render (and most
// PaaS hosts) block outbound SMTP ports (25/465/587) on free web services
// as an anti-spam measure — that's a platform-level firewall rule, not
// something fixable in app code. HTTPS (443) is never blocked, so an API-
// based provider works regardless of hosting plan.
let warned = false;

async function sendViaResend({ to, subject, html }) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    if (!warned) {
      console.warn('[notifications] RESEND_API_KEY/RESEND_FROM_EMAIL not set — emails are disabled.');
      warned = true;
    }
    return { sent: false, reason: 'resend-not-configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API error (${res.status}): ${body || res.statusText}`);
  }

  return { sent: true };
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

  return sendViaResend({
    to: order.customerEmail,
    subject: `Order Confirmed — ${order.orderNumber} | Dezire More`,
    html,
  });
}

async function sendAdminOrderAlert(order) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { sent: false, reason: 'admin-email-not-configured' };

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

  return sendViaResend({
    to: adminEmail,
    subject: `🛍️ New Order ${order.orderNumber} — ${formatCurrency(order.total)}`,
    html,
  });
}

const STATUS_MESSAGES = {
  'Payment Confirmed': 'We\'ve confirmed your payment — your order is being prepared.',
  'Processing':         'Your order is being processed by our team.',
  'Packed':              'Your order has been packed and is ready for dispatch.',
  'Shipped':             'Your order is on its way!',
  'Out for Delivery':    'Your order is out for delivery — it should arrive today.',
  'Delivered':           'Your order has been delivered. We hope you love it!',
  'Cancelled':           'Your order has been cancelled.',
};

// Sent whenever the admin panel moves an order to a customer-meaningful
// status — not every internal state, just the ones worth an email.
async function sendOrderStatusEmail(order) {
  const message = STATUS_MESSAGES[order.orderStatus];
  if (!message) return { sent: false, reason: 'status-not-notifiable' };

  const html = emailShell(`
      <h2 style="color:#1e3a2f;margin:0 0 12px;font-size:20px;">${order.orderStatus}</h2>
      <p style="margin:0 0 16px;">Hi ${order.customerName}, ${message}</p>
      <p style="font-size:14px;"><strong>Order:</strong> ${order.orderNumber}</p>
      ${order.estimatedDelivery && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled'
        ? `<p style="font-size:14px;"><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toDateString()}</p>`
        : ''}
  `);

  return sendViaResend({
    to: order.customerEmail,
    subject: `${order.orderStatus} — Order ${order.orderNumber} | Dezire More`,
    html,
  });
}

// Link-based email verification (signup). The button is the primary path;
// the raw URL is included as a fallback for email clients that strip links
// out of buttons or block images/styling.
async function sendVerificationEmail(email, verifyUrl) {
  const html = emailShell(`
      <h2 style="color:#1e3a2f;margin:0 0 12px;font-size:20px;">Verify Your Email</h2>
      <p style="margin:0 0 8px;">Welcome to Dezire More! Please confirm this is your email address to activate your account.</p>
      ${emailButton(verifyUrl, 'Verify Email Address')}
      <p style="font-size:12px;color:#888;margin:0 0 4px;">Button not working? Copy and paste this link into your browser:</p>
      <p style="font-size:12px;color:#1e3a2f;word-break:break-all;margin:0 0 20px;">${verifyUrl}</p>
      <p style="font-size:13px;color:#888;">This link expires in 24 hours. If you didn't create a Dezire More account, you can safely ignore this email.</p>
  `);

  return sendViaResend({
    to: email,
    subject: 'Verify your email — Dezire More',
    html,
  });
}

// Batches every price-drop / back-in-stock alert for one user into a single
// email (run periodically by utils/wishlistWatcher.js) rather than one email
// per product, so a wishlist with several changes doesn't spam the inbox.
async function sendWishlistAlertEmail(user, alerts) {
  const rows = alerts
    .map(a => `
      <tr>
        <td style="padding:8px 0;">${a.product.name}</td>
        <td style="padding:8px 0;text-align:right;">
          ${a.type === 'price-drop'
            ? `<span style="color:#888;text-decoration:line-through;margin-right:6px;">${formatCurrency(a.oldPrice)}</span>${formatCurrency(a.newPrice)}`
            : '<span style="color:#1e3a2f;font-weight:bold;">Back in Stock</span>'}
        </td>
      </tr>`)
    .join('');

  const html = emailShell(`
      <h2 style="color:#1e3a2f;margin:0 0 12px;font-size:20px;">Your Wishlist Just Got Better</h2>
      <p style="margin:0 0 16px;">Hi ${user.firstName}, here's what changed on items you saved:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        ${rows}
      </table>
      ${emailButton('https://www.deziremore.com/', 'Shop Now')}
  `);

  return sendViaResend({
    to: user.email,
    subject: alerts.some(a => a.type === 'price-drop') ? 'Price drop on your wishlist! — Dezire More' : 'Your wishlist item is back in stock! — Dezire More',
    html,
  });
}

// Sent when an exchange request's status changes (Approved/Rejected/Completed).
async function sendExchangeStatusEmail(exchange) {
  const messages = {
    Approved: 'Your exchange request has been approved. We\'ll arrange a pickup of the original item shortly.',
    Rejected: 'Your exchange request could not be approved.',
    Completed: 'Your exchange has been completed. We hope you love the replacement!',
  };
  const message = messages[exchange.status];
  if (!message) return { sent: false, reason: 'status-not-notifiable' };

  const html = emailShell(`
      <h2 style="color:#1e3a2f;margin:0 0 12px;font-size:20px;">Exchange ${exchange.status}</h2>
      <p style="margin:0 0 16px;">Hi ${exchange.customerName}, ${message}</p>
      <p style="font-size:14px;"><strong>Order:</strong> ${exchange.orderNumber}<br/>
         <strong>Item:</strong> ${exchange.productName}</p>
      ${exchange.adminNote ? `<p style="font-size:14px;"><strong>Note from our team:</strong> ${exchange.adminNote}</p>` : ''}
  `);

  return sendViaResend({
    to: exchange.customerEmail,
    subject: `Exchange ${exchange.status} — ${exchange.orderNumber} | Dezire More`,
    html,
  });
}

module.exports = {
  sendOrderConfirmationEmail,
  sendAdminOrderAlert,
  sendVerificationEmail,
  sendOrderStatusEmail,
  sendWishlistAlertEmail,
  sendExchangeStatusEmail,
};
