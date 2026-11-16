/**
 * SendGrid Email Service for FunFinder
 * Ported from Discount-Backend/orders/views/payment.py
 */

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

/**
 * Builds email HTML using the official FunFinder ticket design
 */
export function buildTicketEmailHtml(ctx) {
  const heroImageHtml = ctx.hero_image_url
    ? `
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-radius:16px;overflow:hidden;">
            <tr>
              <td align="center" background="${ctx.hero_image_url}" bgcolor="#3A1D94" style="background-color:#3A1D94;background-image:url('${ctx.hero_image_url}');background-size:cover;background-position:center;background-repeat:no-repeat;border-radius:16px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="padding:64px 32px;background:linear-gradient(135deg, rgba(58,29,148,0.55) 0%, rgba(77,41,187,0.35) 100%);">
                      <p style="margin:0;font-family:'Montserrat','Inter',Arial,sans-serif;font-size:11px;font-weight:700;color:#D9D2FF;letter-spacing:2px;text-transform:uppercase;text-shadow:0 1px 4px rgba(0,0,0,0.4);">
                        ${ctx.hero_eyebrow || 'Order confirmed'}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ctx.subject || 'Order Confirmation'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
      @media screen and (max-width: 620px) {
        .email-container { width: 100% !important; }
        .stack-col { display: block !important; width: 100% !important; padding: 0 !important; margin-bottom: 16px; }
        .stack-center { text-align: center !important; }
        .main-title { font-size: 28px !important; }
      }
    </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#3A1D94;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <div style="display:none;font-size:1px;color:#3A1D94;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
        ${ctx.intro || 'Your ticket is ready. Save or print it before the event.'}
    </div>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#3A1D94" style="background-color:#3A1D94;width:100%;">
        <tr>
            <td align="center" style="padding:32px 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="width:600px;max-width:600px;margin:0 auto;">
                    <!-- Brand header -->
                    <tr>
                        <td align="center" style="padding:8px 24px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td valign="middle" style="padding-right:12px;">
                                        <img src="https://funfinder.ge/static/media/logo.f11e88da6e5f45cdace0.jpg" width="44" height="44" alt="FunFinder" style="display:block;border:0;outline:none;text-decoration:none;border-radius:10px;">
                                    </td>
                                    <td valign="middle" style="font-family:'Montserrat','Inter',Arial,sans-serif;font-size:18px;font-weight:800;color:#FFFFFF;letter-spacing:0.5px;line-height:1;">
                                        FUNFINDER
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    ${heroImageHtml}

                    <!-- Headline -->
                    <tr>
                        <td align="center" style="padding:32px 32px 12px;">
                            <h1 class="main-title" style="margin:0;font-family:'Montserrat','Inter',Arial,sans-serif;font-size:36px;font-weight:800;line-height:1.1;letter-spacing:-0.5px;color:#FFFFFF;">
                                ${ctx.heading || 'Order confirmation'}
                            </h1>
                        </td>
                    </tr>

                    <!-- Subtitle -->
                    <tr>
                        <td align="center" style="padding:0 40px 32px;">
                            <p class="subtitle" style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:1.55;color:#D9D2FF;">
                                ${ctx.intro || 'Thank you for your purchase! Please save or print your ticket before the event.'}
                            </p>
                        </td>
                    </tr>

                    <!-- Ticket card -->
                    <tr>
                        <td style="padding:0 16px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,0.25);">
                                <tr>
                                    <td style="padding:28px 28px 24px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td valign="middle" align="left">
                                                    <img src="https://funfinder.ge/static/media/logo.f11e88da6e5f45cdace0.jpg" width="40" height="40" alt="FunFinder" style="display:block;border:0;outline:none;text-decoration:none;border-radius:6px;">
                                                </td>
                                                <td valign="middle" align="right" style="font-family:'Arial Black',Arial,sans-serif;font-weight:900;font-size:13px;line-height:1.1;color:#333333;text-transform:uppercase;letter-spacing:0.5px;">
                                                    ${ctx.artist_line || 'FUNFINDER'}
                                                </td>
                                            </tr>
                                        </table>

                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:0;line-height:0;height:24px;">&nbsp;</td></tr></table>

                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="stack">
                                            <tr>
                                                <td valign="top" width="50%" class="stack-col" style="padding-right:12px;">
                                                    <p style="margin:0 0 6px;font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:700;color:#4D29BB;text-transform:uppercase;letter-spacing:0.6px;">
                                                        Location
                                                    </p>
                                                    <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;color:#4D29BB;line-height:1.4;">
                                                        ${ctx.location_name || 'Tbilisi, Georgia'}
                                                    </p>
                                                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;font-weight:500;color:#333333;line-height:1.5;">
                                                        ${ctx.location_address || ''}
                                                    </p>
                                                </td>
                                                <td valign="top" width="50%" class="stack-col" style="padding-left:12px;">
                                                    <p style="margin:0 0 6px;font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:700;color:#4D29BB;text-transform:uppercase;letter-spacing:0.6px;">
                                                        Date &amp; Time
                                                    </p>
                                                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;font-weight:500;color:#333333;line-height:1.5;">
                                                        ${ctx.event_datetime || 'Booking confirmed'}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:0;line-height:0;height:20px;">&nbsp;</td></tr></table>

                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom:8px;border-bottom:1px solid #eeeeee;">
                                                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:700;color:#4D29BB;text-transform:uppercase;letter-spacing:0.6px;">
                                                        Ticket info
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;">
                                            <tr>
                                                <td width="100" style="padding:6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#666666;">Name</td>
                                                <td style="padding:6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;color:#333333;">
                                                    ${ctx.customer_name || 'Valued Guest'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="100" style="padding:6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#666666;">Type</td>
                                                <td style="padding:6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;color:#333333;">
                                                    ${ctx.ticket_type || 'General Booking'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="100" style="padding:6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#666666;">Quantity</td>
                                                <td style="padding:6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;color:#333333;">
                                                    ${ctx.quantity || '1'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="100" style="padding:6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#666666;">Price</td>
                                                <td style="padding:6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#4D29BB;">
                                                    ${ctx.price || '0 GEL'}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Stub with QR code -->
                                <tr>
                                    <td bgcolor="#FAFAFE" style="background-color:#FAFAFE;border-top:2px dashed #E5E0F5;padding:24px 28px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="stack">
                                            <tr>
                                                <td valign="middle" class="stack-col" style="padding-right:16px;">
                                                    <p style="margin:0 0 6px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#333333;line-height:1.35;">
                                                        ${ctx.event_name || 'Funfinder Experience'}
                                                    </p>
                                                    <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#666666;">
                                                        ${ctx.ticket_type || 'General Booking'}
                                                    </p>
                                                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#666666;letter-spacing:0.3px;">
                                                        Ticket #<span style="color:#333333;font-weight:600;">${ctx.ticket_id || ''}</span>
                                                    </p>
                                                </td>
                                                <td valign="middle" align="right" width="112" class="stack-col stack-center">
                                                    <a href="${ctx.ticket_url || 'https://funfinder.ge/tickets'}" target="_blank" style="text-decoration:none;border:0;outline:none;">
                                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&amp;margin=8&amp;data=${encodeURIComponent(ctx.ticket_url || 'https://funfinder.ge/tickets')}" width="100" height="100" alt="QR Code" style="display:block;border:0;outline:none;text-decoration:none;width:100px;height:100px;">
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- View ticket button -->
                    <tr>
                        <td align="center" style="padding:28px 16px 8px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" bgcolor="#FFFFFF" style="border-radius:999px;background-color:#FFFFFF;">
                                        <a href="${ctx.ticket_url || 'https://funfinder.ge/tickets'}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#4D29BB;text-decoration:none;border-radius:999px;letter-spacing:0.3px;">
                                            View ticket online
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding:24px 32px 8px;">
                            <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:1.6;color:#B5A8E8;">
                                Need help? Reply to this email and our team will get back to you.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:0 32px 32px;">
                            <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:11px;line-height:1.6;color:#8B7AC4;">
                                &copy; ${ctx.year || new Date().getFullYear()} FunFinder. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Send an email via SendGrid API
 */
export async function sendSendGridEmail({ to, subject, html, from }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = from || process.env.SENDGRID_EMAIL_SENDER || 'funfinder.ge@gmail.com';

  if (!apiKey) {
    console.warn('[SendGrid] SENDGRID_API_KEY is not configured; skipping email dispatch.');
    return { success: false, reason: 'SENDGRID_API_KEY missing' };
  }

  const payload = {
    personalizations: [
      {
        to: [{ email: to }]
      }
    ],
    from: {
      email: senderEmail,
      name: 'FunFinder Georgia'
    },
    subject: subject,
    content: [
      {
        type: 'text/html',
        value: html
      }
    ]
  };

  try {
    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[SendGrid] Error sending email to ${to}: HTTP ${response.status}`, errText);
      return { success: false, status: response.status, error: errText };
    }

    console.log(`[SendGrid] Successfully sent email to ${to} (${subject})`);
    return { success: true };
  } catch (err) {
    console.error(`[SendGrid] Network error sending email to ${to}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Builds context dictionary for order emails
 */
export function buildOrderEmailContext(order, event = null) {
  const currency = order.currency || 'GEL';
  const eventName = order.event_name || event?.name || event?.title || 'Experience';
  const ticketType = event?.event_ticket || event?.category?.name || 'General Booking';

  let heroImageUrl = '';
  if (event?.images && event.images.length > 0) {
    const primary = event.images.find(img => img.is_primary) || event.images[0];
    const rawUrl = primary?.url || primary?.image || (typeof primary === 'string' ? primary : '');
    if (rawUrl) {
      heroImageUrl = rawUrl.startsWith('http') ? rawUrl : `${process.env.SITE_URL || 'https://funfinder.ge'}${rawUrl}`;
    }
  }

  const locationName = event?.city?.name || (typeof event?.city === 'string' ? event.city : '') || 'Tbilisi';
  const locationAddress = event?.location || '';
  const orderNumber = order.order_number || String(order.id);
  const ticketUrl = `${process.env.SITE_URL || 'https://funfinder.ge'}/orders/${orderNumber}`;

  let eventDatetime = '';
  if (order.event_date) {
    try {
      const d = new Date(order.event_date);
      eventDatetime = !isNaN(d.getTime()) ? d.toLocaleDateString('ka-GE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : order.event_date;
    } catch {
      eventDatetime = String(order.event_date);
    }
  }

  return {
    customer_name: order.customer_name || 'Guest',
    event_name: eventName,
    artist_line: eventName,
    location_name: locationName,
    location_address: locationAddress,
    event_datetime: eventDatetime,
    ticket_type: ticketType,
    quantity: String(order.people_count || order.tickets_count || 1),
    price: `${order.total_price || 0} ${currency}`,
    ticket_id: orderNumber,
    ticket_url: ticketUrl,
    hero_image_url: heroImageUrl,
    year: String(new Date().getFullYear())
  };
}

/**
 * Dispatches Customer, Vendor, and Admin emails on successful payment
 */
export async function sendOrderSuccessEmails(order, event = null) {
  const baseCtx = buildOrderEmailContext(order, event);
  const eventName = baseCtx.event_name;
  const companyName = event?.company?.name || order.company_name || 'Partner';
  const senderEmail = process.env.SENDGRID_EMAIL_SENDER || 'funfinder.ge@gmail.com';

  const promises = [];

  // 1. Customer Email
  if (order.customer_email) {
    const customerHtml = buildTicketEmailHtml({
      ...baseCtx,
      heading: 'Order confirmation',
      intro: `Thank you for your purchase, ${order.customer_name}! Please save or print your ticket before the event.`,
      hero_eyebrow: 'Order confirmed',
      subject: `Your FunFinder ticket — ${eventName}`
    });

    promises.push(
      sendSendGridEmail({
        to: order.customer_email,
        subject: `Your FunFinder ticket — ${eventName}`,
        html: customerHtml,
        from: senderEmail
      })
    );
  }

  // 2. Vendor Email
  const vendorEmail = process.env.FUNFINDER_VENDOR_NOTIFICATION_EMAIL || event?.company?.email;
  if (vendorEmail) {
    const vendorHtml = buildTicketEmailHtml({
      ...baseCtx,
      heading: 'New booking received',
      intro: `Hello ${companyName}, you have a new paid booking from ${order.customer_name} via FunFinder.`,
      hero_eyebrow: 'New booking',
      subject: `New booking — ${eventName}`
    });

    promises.push(
      sendSendGridEmail({
        to: vendorEmail,
        subject: `New booking — ${eventName}`,
        html: vendorHtml,
        from: senderEmail
      })
    );
  }

  // 3. Admin Email
  const adminEmail = process.env.FUNFINDER_ADMIN_EMAIL || 'funfinder.georgia@gmail.com';
  if (adminEmail) {
    const adminHtml = buildTicketEmailHtml({
      ...baseCtx,
      heading: 'New transaction',
      intro: `Payment processed for ${order.customer_name} (${order.customer_email || 'No email'}) — vendor: ${companyName}.`,
      hero_eyebrow: 'Admin alert',
      subject: `[ADMIN] New transaction #${order.order_number || order.id}`
    });

    promises.push(
      sendSendGridEmail({
        to: adminEmail,
        subject: `[ADMIN] New transaction #${order.order_number || order.id}`,
        html: adminHtml,
        from: senderEmail
      })
    );
  }

  const results = await Promise.allSettled(promises);
  console.log(`[SendGrid] Processed ${results.length} email notifications for order #${order.order_number || order.id}`);
  return results;
}

