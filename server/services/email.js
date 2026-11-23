/**
 * Email Service for FunFinder using Nodemailer (Gmail / SMTP)
 */

import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

let mailTransporter = null;

export function getMailTransporter() {
  if (mailTransporter) return mailTransporter;

  const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'funfinder.georgia@gmail.com';
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || 'omabuzuwzgaksexq';
  const pass = rawPass.replace(/\s+/g, '');

  if (process.env.SMTP_HOST) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass }
    });
  } else {
    mailTransporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: { user, pass }
    });
  }

  return mailTransporter;
}

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
                                        <img src="${ctx.logo_src || 'cid:funfinder-logo'}" width="44" height="44" alt="FunFinder" style="display:block;border:0;outline:none;text-decoration:none;border-radius:10px;">
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
                                                    <img src="${ctx.logo_src || 'cid:funfinder-logo'}" width="40" height="40" alt="FunFinder" style="display:block;border:0;outline:none;text-decoration:none;border-radius:6px;">
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
                                                        <img src="${ctx.qr_src || 'cid:ticket-qrcode'}" width="100" height="100" alt="QR Code" style="display:block;border:0;outline:none;text-decoration:none;width:100px;height:100px;">
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
 * Send an email via Nodemailer (Gmail / SMTP)
 */
export async function sendEmail({ to, subject, html, from, text, attachments }) {
  const senderEmail = from || process.env.EMAIL_FROM || `"FunFinder Georgia" <${process.env.SMTP_USER || 'funfinder.georgia@gmail.com'}>`;

  if (!to) {
    console.warn('[Mailer] Missing recipient email address; skipping.');
    return { success: false, reason: 'Recipient email is missing' };
  }

  try {
    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from: senderEmail,
      to,
      subject,
      html,
      text,
      attachments
    });

    console.log(`[Mailer] Successfully sent email to ${to} (${subject}) - MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Mailer] Error sending email to ${to}:`, err);
    return { success: false, error: err.message };
  }
}

// Backwards compatibility for existing imports in routes
export const sendSendGridEmail = sendEmail;

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
 * Dispatches Customer, Vendor, and Admin emails on successful payment with unique QR code
 */
export async function sendOrderSuccessEmails(order, event = null) {
  const baseCtx = buildOrderEmailContext(order, event);
  const eventName = baseCtx.event_name;
  const companyName = event?.company?.name || order.company_name || 'Partner';
  const senderEmail = process.env.EMAIL_FROM || `"FunFinder Georgia" <${process.env.SMTP_USER || 'funfinder.georgia@gmail.com'}>`;

  // 1. Prepare inline attachments (QR code buffer & Logo)
  const attachments = [];
  const qrPayload = baseCtx.ticket_url || `https://funfinder.ge/orders/${order.order_number || order.id}`;

  try {
    const qrBuffer = await QRCode.toBuffer(qrPayload, {
      width: 250,
      margin: 2,
      color: {
        dark: '#3A1D94',
        light: '#FFFFFF'
      }
    });

    attachments.push({
      filename: 'qrcode.png',
      content: qrBuffer,
      cid: 'ticket-qrcode'
    });
  } catch (qrErr) {
    console.warn('[Mailer] Could not generate QR buffer:', qrErr);
  }

  try {
    const logoPath = path.resolve(process.cwd(), 'public/logo.jpg');
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'logo.jpg',
        path: logoPath,
        cid: 'funfinder-logo'
      });
    }
  } catch (logoErr) {
    console.warn('[Mailer] Could not attach local logo:', logoErr);
  }

  const promises = [];

  // 1. Customer Email (კლიენტისთვის - ბილეთი უნიკალური QR კოდით)
  if (order.customer_email) {
    const customerHtml = buildTicketEmailHtml({
      ...baseCtx,
      heading: 'Order confirmation',
      intro: `Thank you for your purchase, ${order.customer_name}! Please save or print your ticket before the event.`,
      hero_eyebrow: 'Order confirmed',
      subject: `Your FunFinder ticket — ${eventName}`
    });

    promises.push(
      sendEmail({
        to: order.customer_email,
        subject: `Your FunFinder ticket — ${eventName}`,
        html: customerHtml,
        from: senderEmail,
        attachments
      })
    );
  }

  // 2. Vendor / Company Email (კომპანიისთვის/ორგანიზატორისთვის შეტყობინება)
  const vendorEmail = process.env.FUNFINDER_VENDOR_NOTIFICATION_EMAIL || event?.company?.email || order.company_email;
  if (vendorEmail) {
    const vendorHtml = buildTicketEmailHtml({
      ...baseCtx,
      heading: 'New booking received',
      intro: `Hello ${companyName}, you have a new paid booking from ${order.customer_name} via FunFinder.`,
      hero_eyebrow: 'New booking',
      subject: `New booking — ${eventName}`
    });

    promises.push(
      sendEmail({
        to: vendorEmail,
        subject: `New booking — ${eventName}`,
        html: vendorHtml,
        from: senderEmail,
        attachments
      })
    );
  }

  // 3. Admin & Team Management Emails
  // მოთხოვნის შესაბამისად: ბილეთის შეძენისას წერილი ყოველთვის ეგზავნება info@funfinder.ge და i.diasamidze@funfinder.ge
  const defaultAdminRecipients = [
    'info@funfinder.ge',
    'i.diasamidze@funfinder.ge'
  ];

  // Optional extra recipients from environment variables
  const envRecipients = (process.env.FUNFINDER_ADMIN_EMAILS || process.env.FUNFINDER_ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  const allAdminRecipients = Array.from(new Set([...defaultAdminRecipients, ...envRecipients]));

  for (const adminRecipient of allAdminRecipients) {
    const adminHtml = buildTicketEmailHtml({
      ...baseCtx,
      heading: 'New Ticket & Order Confirmation',
      intro: `New paid ticket purchase from ${order.customer_name} (${order.customer_email || 'No email'}) — Vendor: ${companyName}.`,
      hero_eyebrow: 'FunFinder Notification',
      subject: `[FunFinder] New Ticket #${order.order_number || order.id} — ${eventName}`
    });

    promises.push(
      sendEmail({
        to: adminRecipient,
        subject: `[FunFinder] New Ticket #${order.order_number || order.id} — ${eventName}`,
        html: adminHtml,
        from: senderEmail,
        attachments
      })
    );
  }

  const results = await Promise.allSettled(promises);
  console.log(`[Mailer] Processed ${results.length} email notifications for order #${order.order_number || order.id}`);
  return results;
}

/**
 * Sends a 6-digit verification OTP email for customer registration
 */
export async function sendVerificationCodeEmail({ email, code, firstname = '' }) {
  const greeting = firstname ? `გამარჯობა ${firstname},` : 'გამარჯობა,';
  const attachments = [];

  try {
    const logoPath = path.resolve(process.cwd(), 'public/logo.jpg');
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'logo.jpg',
        path: logoPath,
        cid: 'funfinder-logo'
      });
    }
  } catch (_) {}

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f9; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #3A1D94 0%, #6E3FF3 100%); padding: 32px 20px; text-align: center; color: #ffffff; }
        .body { padding: 32px 28px; text-align: center; }
        .code-box { background: #FAF9FF; border: 2px dashed #6E3FF3; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .code { font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #3A1D94; font-family: 'Courier New', monospace; display: inline-block; padding-left: 10px; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; padding: 18px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <img src="cid:funfinder-logo" width="44" height="44" alt="FunFinder" style="border-radius: 10px; display: inline-block; margin-bottom: 10px;" />
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">FUNFINDER</h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1.5px;">ელ-ფოსტის დადასტურება</p>
        </div>
        <div class="body">
          <p style="font-size: 16px; color: #334155; margin: 0 0 12px;">${greeting}</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">
            მადლობა FunFinder-ზე რეგისტრაციისთვის! რეგისტრაციის დასასრულებლად გამოიყენეთ ქვემოთ მოცემული ერთჯერადი ვერიფიკაციის კოდი:
          </p>
          <div class="code-box">
            <span class="code">${code}</span>
          </div>
          <p style="font-size: 13px; color: #94a3b8; margin: 0;">
            ⏳ კოდი აქტიურია <strong>10 წუთის</strong> განმავლობაში.<br>
            თუ თქვენ არ გაგივლიათ რეგისტრაცია, შეგიძლიათ უგულებელყოთ ეს წერილი.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} FunFinder Georgia. ყველა უფლება დაცულია.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `${code} — თქვენი FunFinder ვერიფიკაციის კოდი`,
    html,
    attachments
  });
}

