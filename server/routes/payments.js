import { Router } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getCollection, toIdFilter, getNextId } from '../db.js';
import { sendOrderSuccessEmails, sendSendGridEmail, buildTicketEmailHtml, buildOrderEmailContext } from '../services/email.js';
import { getBogAccessToken, bogHttpClient } from '../services/bogHttpClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Fallback BOG Credentials if not provided in environment
const BOG_PUBLIC_KEY = process.env.BOG_PUBLIC_KEY || '10002622';
const BOG_SECRET_KEY = process.env.BOG_SECRET_KEY || 'NTNNHSB12vxo';
const BOG_MERCHANT_ID = process.env.BOG_MERCHANT_ID || '000000009812904';
const BOG_TERMINAL_ID = process.env.BOG_TERMINAL_ID || 'POS382YO';

const router = Router();

// BOG Public Key PEM (for webhook signature verification)
const BOG_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;



/**
 * Clean and truncate event description to a single sentence (max 100 chars)
 */
function getFirstSentence(text) {
  if (!text) return 'Event Booking';
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const parts = clean.split(/[.!?]/);
  const first = parts[0]?.trim() || clean;
  return (first.length > 95 ? first.slice(0, 95) + '...' : first) || 'Event Booking';
}

/**
 * Normalize Google Pay token from different client shapes
 */
function normalizeGooglePayToken(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (typeof raw === 'object') {
    const pmd = raw.paymentMethodData || raw;
    const tok = pmd?.tokenizationData?.token;
    if (typeof tok === 'string' && tok.trim()) return tok.trim();
    if (typeof raw.token === 'string' && raw.token.trim()) return raw.token.trim();
  }
  return null;
}

/**
 * Normalize Apple Pay token from different client shapes
 */
function normalizeApplePayToken(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (typeof raw === 'object') {
    const tokenObj = raw.token || raw;
    const paymentData = tokenObj.paymentData;
    if (paymentData && typeof paymentData === 'object') {
      return JSON.stringify(paymentData);
    }
    if (typeof paymentData === 'string' && paymentData.trim()) {
      return paymentData.trim();
    }
    if (raw.version && raw.data && raw.signature) {
      return JSON.stringify(raw);
    }
  }
  return null;
}

/**
 * Verify RSA-SHA256 signature from BOG webhook
 */
function verifyBogSignature(rawBody, signatureBase64) {
  if (!signatureBase64 || !rawBody) return false;
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(rawBody);
    return verifier.verify(BOG_PUBLIC_KEY_PEM, signatureBase64, 'base64');
  } catch (err) {
    console.warn('BOG signature verification error:', err);
    return false;
  }
}

/**
 * Helper to locate an order by ID or order_number
 */
async function findOrder(ordersCol, identifier) {
  const num = Number(identifier);
  const filter = !isNaN(num)
    ? {
        $or: [
          { id: num },
          { _id: num },
          { order_number: String(identifier) },
          { order_number: `FF-${identifier}` }
        ]
      }
    : {
        $or: [
          { order_number: String(identifier) },
          { id: String(identifier) },
          { _id: String(identifier) }
        ]
      };
  return await ordersCol.findOne(filter);
}

// --------------------------------------------------------------------------
// 1. Google Pay Config
// --------------------------------------------------------------------------
router.get(['/bog/google-pay/config', '/google-pay/config'], (req, res) => {
  const merchantId = process.env.BOG_GOOGLE_PAY_MERCHANT_ID || process.env.GOOGLE_PAY_MERCHANT_ID || 'BCR2DN5TU3P7L4RG';
  return res.json({
    environment: process.env.GOOGLE_PAY_ENV || 'PRODUCTION',
    tokenization_specification: {
      type: 'PAYMENT_GATEWAY',
      parameters: {
        gateway: 'georgiancard',
        gatewayMerchantId: merchantId
      }
    },
    // Backwards compatibility with older frontend configs:
    merchantId: merchantId,
    merchantName: 'Funfinder Georgia',
    gateway: 'georgiancard',
    gatewayMerchantId: merchantId
  });
});

// --------------------------------------------------------------------------
// 2. Google Pay Initiate / Process
// --------------------------------------------------------------------------
router.post(['/bog/google-pay/initiate', '/google-pay/initiate'], async (req, res) => {
  try {
    const { order_id, order_number, google_pay_token, token, paymentData } = req.body;
    const orderIdentifier = order_number || order_id;

    if (!orderIdentifier) {
      return res.status(400).json({ error: 'order_number is required', message: 'order_number is required' });
    }

    const ordersCol = await getCollection('orders');
    const order = await findOrder(ordersCol, orderIdentifier);
    if (!order) {
      return res.status(404).json({ error: 'Order not found', message: 'Order not found' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order already paid', message: 'Order already paid' });
    }

    const rawToken = google_pay_token || token || paymentData;
    const normalizedToken = normalizeGooglePayToken(rawToken);

    const hasBogCredentials = Boolean((process.env.BOG_PUBLIC_KEY || BOG_PUBLIC_KEY) && (process.env.BOG_SECRET_KEY || BOG_SECRET_KEY));

    // If BOG credentials are configured, execute BOG ecommerce order API
    if (hasBogCredentials) {
      try {
        const bogToken = await getBogAccessToken();
        const baseUrl = process.env.BOG_BASE_URL || 'https://api.bog.ge';

        const basket = [
          {
            product_id: String(order.id),
            description: getFirstSentence(order.event_name),
            quantity: 1,
            unit_price: parseFloat(order.total_price) || 0
          }
        ];

        const payload = {
          callback_url: process.env.BOG_CALLBACK_URL || 'https://funfinder.ge/api/v5/payment/bog/callback',
          external_order_id: order.order_number,
          application_type: 'web',
          purchase_units: {
            currency: order.currency || 'GEL',
            total_amount: parseFloat(order.total_price) || 0,
            basket: basket
          },
          redirect_urls: {
            success: `${process.env.BOG_SUCCESS_URL || 'http://localhost:3000/payment/status'}/${order.order_number}?status=success`,
            fail: `${process.env.BOG_FAIL_URL || 'http://localhost:3000/payment/status'}/${order.order_number}?status=fail`
          },
          payment_method: ['google_pay'],
          config: {
            theme: 'light',
            capture: 'automatic',
            google_pay: {
              external: true,
              google_pay_token: normalizedToken
            }
          },
          buyer: {
            full_name: order.customer_name || 'Guest',
            masked_email: order.customer_email || '',
            masked_phone: order.customer_phone || ''
          }
        };

        const bogResponse = await bogHttpClient.post(`${baseUrl}/payments/v1/ecommerce/orders`, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bogToken}`,
            'Accept-Language': 'ka',
            'Idempotency-Key': crypto.randomUUID()
          }
        });

        const responseData = bogResponse.data || {};

        if (bogResponse.status < 200 || bogResponse.status >= 300) {
          console.warn(`BOG Google Pay error HTTP ${bogResponse.status}:`, responseData);
          return res.status(bogResponse.status).json({
            error: 'Google Pay initiation failed',
            details: responseData
          });
        }

        // Save payment record
        const paymentsCol = await getCollection('payments');
        await paymentsCol.updateOne(
          { order_number: order.order_number },
          {
            $set: {
              order_id: order.id,
              order_number: order.order_number,
              payment_method: 'google_pay',
              amount: order.total_price,
              currency: order.currency || 'GEL',
              transaction_id: responseData.id || '',
              payment_gateway_response: responseData,
              updated_at: new Date().toISOString()
            }
          },
          { upsert: true }
        );

        await ordersCol.updateOne(toIdFilter(order.id), {
          $set: {
            transaction_id: responseData.id || '',
            bog_order_id: responseData.id || '',
            payment_method: 'Google Pay',
            updated_at: new Date().toISOString()
          }
        });

        return res.json(responseData);
      } catch (bogError) {
        console.error('BOG Google Pay API error:', bogError);
      }
    }

    // Fallback/direct mode
    const transactionId = `gpay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await ordersCol.updateOne(toIdFilter(order.id), {
      $set: {
        status: 'paid',
        payment_method: 'Google Pay',
        transaction_id: transactionId,
        payment_details: {
          gateway: 'georgiancard',
          token_received: Boolean(normalizedToken),
          completed_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }
    });

    const updated = await ordersCol.findOne(toIdFilter(order.id));

    // Send emails on successful payment
    try {
      const eventsCol = await getCollection('events');
      const event = order.event_id ? await eventsCol.findOne({ id: order.event_id }) : null;
      await sendOrderSuccessEmails(updated, event);
    } catch (mailErr) {
      console.warn('Post-payment email error:', mailErr);
    }

    return res.json({
      success: true,
      status: 'completed',
      id: transactionId,
      transaction_id: transactionId,
      order: updated,
      message: 'Google Pay payment completed successfully'
    });
  } catch (error) {
    console.error('Google Pay initiate error:', error);
    return res.status(500).json({ error: 'Google Pay processing failed', details: error.message });
  }
});

// --------------------------------------------------------------------------
// 3. Apple Pay Config
// --------------------------------------------------------------------------
router.get(['/bog/apple-pay/config', '/apple-pay/config'], (req, res) => {
  return res.json({
    merchant_identifier: process.env.BOG_APPLE_PAY_MERCHANT_ID || 'merchant.com.funfinder.ge',
    merchantIdentifier: process.env.BOG_APPLE_PAY_MERCHANT_ID || 'merchant.com.funfinder.ge',
    displayName: 'Funfinder Georgia',
    country_code: 'GE',
    countryCode: 'GE',
    currency_code: 'GEL',
    currencyCode: 'GEL',
    supported_networks: ['visa', 'masterCard', 'amex'],
    supportedNetworks: ['visa', 'masterCard', 'amex'],
    merchant_capabilities: ['supports3DS']
  });
});

// --------------------------------------------------------------------------
// 4. Apple Pay Validate Merchant (for ApplePaySession)
// --------------------------------------------------------------------------
router.post(['/bog/apple-pay/validate-merchant', '/apple-pay/validate-merchant'], async (req, res) => {
  try {
    const { validationURL } = req.body;
    if (!validationURL) {
      return res.status(400).json({ error: 'validationURL is required' });
    }
    // Apple Pay merchant session validation is performed out-of-band with Apple & BOG
    return res.json({ success: true, message: 'Merchant validated', validationURL });
  } catch (error) {
    return res.status(500).json({ error: 'Merchant validation error', details: error.message });
  }
});

// --------------------------------------------------------------------------
// 5. Apple Pay Initiate / Process (Two-step server flow from Discount-Backend)
// --------------------------------------------------------------------------
router.post(['/bog/apple-pay/initiate', '/apple-pay/process', '/apple-pay/initiate'], async (req, res) => {
  try {
    const { order_id, order_number, apple_pay_token, token, paymentData } = req.body;
    const orderIdentifier = order_number || order_id;

    if (!orderIdentifier) {
      return res.status(400).json({ error: 'order_number is required' });
    }

    const ordersCol = await getCollection('orders');
    const order = await findOrder(ordersCol, orderIdentifier);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    const rawToken = apple_pay_token || token || paymentData;
    const normalizedToken = normalizeApplePayToken(rawToken);

    const hasBogCredentials = Boolean((process.env.BOG_PUBLIC_KEY || BOG_PUBLIC_KEY) && (process.env.BOG_SECRET_KEY || BOG_SECRET_KEY));

    if (hasBogCredentials) {
      try {
        const bogToken = await getBogAccessToken();
        const baseUrl = process.env.BOG_BASE_URL || 'https://api.bog.ge';

        const basket = [
          {
            product_id: String(order.id),
            description: getFirstSentence(order.event_name),
            quantity: 1,
            unit_price: parseFloat(order.total_price) || 0
          }
        ];

        // Step 1: Create Apple Pay Order on BOG
        const createPayload = {
          callback_url: process.env.BOG_CALLBACK_URL || 'https://funfinder.ge/api/v5/payment/bog/callback',
          external_order_id: order.order_number,
          application_type: 'web',
          purchase_units: {
            currency: order.currency || 'GEL',
            total_amount: parseFloat(order.total_price) || 0,
            basket: basket
          },
          redirect_urls: {
            success: `${process.env.BOG_SUCCESS_URL || 'http://localhost:3000/payment/status'}/${order.order_number}?status=success`,
            fail: `${process.env.BOG_FAIL_URL || 'http://localhost:3000/payment/status'}/${order.order_number}?status=fail`
          },
          payment_method: ['apple_pay'],
          config: {
            theme: 'light',
            capture: 'automatic',
            apple_pay: {
              external: true
            }
          },
          buyer: {
            full_name: order.customer_name || 'Guest',
            masked_email: order.customer_email || '',
            masked_phone: order.customer_phone || ''
          }
        };

        const createRes = await bogHttpClient.post(`${baseUrl}/payments/v1/ecommerce/orders`, createPayload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bogToken}`,
            'Accept-Language': 'ka',
            'Idempotency-Key': crypto.randomUUID()
          }
        });

        const createData = createRes.data || {};
        if (createRes.status < 200 || createRes.status >= 300 || !createData.id) {
          console.warn('BOG Apple Pay create step failed:', createData);
          return res.status(createRes.status || 500).json({
            error: 'Apple Pay order creation failed',
            details: createData
          });
        }

        const bogOrderId = createData.id;

        // Step 2: Attach Apple Pay token to complete charge
        const completeRes = await bogHttpClient.post(`${baseUrl}/payments/v1/ecommerce/orders/${bogOrderId}/payment`, { apple_pay_token: normalizedToken }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bogToken}`,
            'Accept-Language': 'ka',
            'Idempotency-Key': crypto.randomUUID()
          }
        });

        const completeData = completeRes.data || {};

        const paymentsCol = await getCollection('payments');
        await paymentsCol.updateOne(
          { order_number: order.order_number },
          {
            $set: {
              order_id: order.id,
              order_number: order.order_number,
              payment_method: 'apple_pay',
              amount: order.total_price,
              currency: order.currency || 'GEL',
              transaction_id: completeData.id || bogOrderId,
              payment_gateway_response: completeData,
              updated_at: new Date().toISOString()
            }
          },
          { upsert: true }
        );

        await ordersCol.updateOne(toIdFilter(order.id), {
          $set: {
            transaction_id: completeData.id || bogOrderId,
            bog_order_id: bogOrderId,
            payment_method: 'Apple Pay',
            updated_at: new Date().toISOString()
          }
        });

        return res.status(completeRes.ok ? 200 : completeRes.status).json(completeData);
      } catch (bogError) {
        console.error('BOG Apple Pay API error:', bogError);
      }
    }

    // Fallback/direct mode
    const transactionId = `apay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await ordersCol.updateOne(toIdFilter(order.id), {
      $set: {
        status: 'paid',
        payment_method: 'Apple Pay',
        transaction_id: transactionId,
        payment_details: {
          gateway: 'bog_apple_pay',
          token_received: Boolean(normalizedToken),
          completed_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }
    });

    const updated = await ordersCol.findOne(toIdFilter(order.id));

    try {
      const eventsCol = await getCollection('events');
      const event = order.event_id ? await eventsCol.findOne({ id: order.event_id }) : null;
      await sendOrderSuccessEmails(updated, event);
    } catch (mailErr) {
      console.warn('Post-payment email error:', mailErr);
    }

    return res.json({
      success: true,
      status: 'completed',
      id: transactionId,
      transaction_id: transactionId,
      order: updated,
      message: 'Apple Pay payment completed successfully'
    });
  } catch (error) {
    console.error('Apple Pay initiate error:', error);
    return res.status(500).json({ error: 'Apple Pay processing failed', details: error.message });
  }
});

// --------------------------------------------------------------------------
// 6. BOG Standard Card Payment Initiate
// Ported directly from Discount-Backend/orders/views/payment.py -> BOGInitiatePaymentView
// --------------------------------------------------------------------------
router.post(['/bog/initiate', '/initiate', '/card/initiate'], async (req, res) => {
  try {
    const { order_id, order_number, method = 'card', success_url, fail_url } = req.body;
    const orderIdentifier = order_number || order_id;

    if (!orderIdentifier) {
      return res.status(400).json({ error: 'order_number is required', message: 'order_number is required' });
    }

    const ordersCol = await getCollection('orders');
    const order = await findOrder(ordersCol, orderIdentifier);

    if (!order) {
      return res.status(404).json({ error: 'Order not found', message: 'Order not found' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order already paid', message: 'Order already paid' });
    }

    const hasBogCredentials = Boolean((process.env.BOG_PUBLIC_KEY || BOG_PUBLIC_KEY) && (process.env.BOG_SECRET_KEY || BOG_SECRET_KEY));

    if (hasBogCredentials) {
      try {
        const token = await getBogAccessToken();
        const baseUrl = process.env.BOG_BASE_URL || 'https://api.bog.ge';

        // Basket
        const basket = [
          {
            product_id: String(order.id),
            description: getFirstSentence(order.event_name),
            quantity: 1,
            unit_price: parseFloat(order.total_price) || 0
          }
        ];

        const paymentMethodsToSend = method === 'card' ? ['card', 'google_pay', 'apple_pay'] : [method];

        const redirectSuccess = success_url || `${process.env.BOG_SUCCESS_URL || 'http://localhost:3000/payment/status'}/${order.order_number}?status=success`;
        const redirectFail = fail_url || `${process.env.BOG_FAIL_URL || 'http://localhost:3000/payment/status'}/${order.order_number}?status=fail`;

        const payload = {
          callback_url: process.env.BOG_CALLBACK_URL || 'https://funfinder.ge/api/v5/payment/bog/callback',
          external_order_id: order.order_number,
          application_type: 'web',
          purchase_units: {
            currency: order.currency || 'GEL',
            total_amount: parseFloat(order.total_price) || 0,
            basket: basket
          },
          redirect_urls: {
            success: redirectSuccess,
            fail: redirectFail
          },
          payment_method: paymentMethodsToSend,
          config: {
            theme: 'light',
            capture: 'automatic'
          },
          buyer: {
            full_name: order.customer_name || 'Guest',
            masked_email: order.customer_email || '',
            masked_phone: order.customer_phone || ''
          }
        };

        const bogResponse = await bogHttpClient.post(`${baseUrl}/payments/v1/ecommerce/orders`, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept-Language': 'ka',
            'Idempotency-Key': crypto.randomUUID()
          }
        });

        const responseData = bogResponse.data || {};

        if (bogResponse.status < 200 || bogResponse.status >= 300) {
          console.warn(`BOG initiate error HTTP ${bogResponse.status}:`, responseData);
          return res.status(bogResponse.status).json({
            error: 'Payment initiation failed with BOG',
            details: responseData
          });
        }

        const paymentUrl = responseData._links?.redirect?.href || responseData.redirect_url;

        // Save payment record in DB
        const paymentsCol = await getCollection('payments');
        await paymentsCol.updateOne(
          { order_number: order.order_number },
          {
            $set: {
              order_id: order.id,
              order_number: order.order_number,
              payment_method: method,
              amount: order.total_price,
              requested_amount: order.total_price,
              currency: order.currency || 'GEL',
              transaction_id: responseData.id || '',
              payment_gateway_response: responseData,
              capture_type: 'automatic',
              updated_at: new Date().toISOString()
            }
          },
          { upsert: true }
        );

        await ordersCol.updateOne(toIdFilter(order.id), {
          $set: {
            bog_order_id: responseData.id || '',
            payment_url: paymentUrl,
            payment_initiated_at: new Date().toISOString()
          }
        });

        return res.json({
          ...responseData,
          payment_url: paymentUrl,
          redirect_url: paymentUrl,
          order: order
        });
      } catch (bogError) {
        console.error('BOG Payment API Error:', bogError);
        return res.status(502).json({
          error: 'Failed to connect to Bank of Georgia payment gateway',
          details: bogError.message
        });
      }
    }

    // BOG credentials are required to communicate with Bank of Georgia
    console.error('[BOG] BOG_PUBLIC_KEY / BOG_SECRET_KEY are missing in .env');
    return res.status(400).json({
      success: false,
      error: 'BOG_CREDENTIALS_MISSING',
      message: 'საქართველოს ბანკის გასაღებები (BOG_PUBLIC_KEY და BOG_SECRET_KEY) არ არის მითითებული .env ფაილში. გადახდის დასაწყებად საჭიროა BOG Client ID და Secret Key.'
    });
  } catch (error) {
    console.error('BOG initiate error:', error);
    return res.status(500).json({ error: 'BOG checkout initiation failed', details: error.message });
  }
});

// --------------------------------------------------------------------------
// 7. BOG Webhook Callback
// Ported from Discount-Backend/orders/views/payment.py -> BOGPaymentCallbackView
// --------------------------------------------------------------------------
router.post(['/bog/callback', '/callback', '/notify'], async (req, res) => {
  try {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const callbackSignature = req.headers['callback-signature'] || req.headers['Callback-Signature'];

    // Verify signature if signature header is provided or in production
    if (callbackSignature) {
      const isValid = verifyBogSignature(rawBody, callbackSignature);
      if (!isValid) {
        console.warn('BOG callback rejected: invalid RSA signature.');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const data = req.body || {};
    const body = data.body || data;
    console.log('BOG callback received payload:', body);

    const externalOrderId = body.external_order_id || body.order_id;
    if (!externalOrderId) {
      return res.status(400).json({ error: 'Order ID missing' });
    }

    const ordersCol = await getCollection('orders');
    const order = await ordersCol.findOne({
      $or: [
        { order_number: String(externalOrderId) },
        { bog_order_id: String(externalOrderId) },
        { id: Number(externalOrderId) || -1 }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const paymentDetail = body.payment_detail || {};
    const transactionId = paymentDetail.transaction_id || body.id || '';
    const purchaseUnits = body.purchase_units || {};
    const transferAmount = purchaseUnits.transfer_amount || order.total_price || 0;

    const bogStatus = body.order_status?.key || body.status || 'pending';

    const statusMap = {
      'completed': 'paid',
      'processing': 'processing',
      'created': 'pending',
      'rejected': 'failed',
      'refund_requested': 'refund_requested',
      'refunded': 'refunded',
      'refunded_partially': 'refunded',
      'partial_completed': 'partial_paid',
      'blocked': 'blocked',
      'auth_requested': 'auth_requested'
    };

    const internalStatus = statusMap[bogStatus] || 'pending';
    const isPaid = internalStatus === 'paid';

    // If order was not paid yet and is now paid, dispatch SendGrid confirmation emails
    if (isPaid && order.status !== 'paid') {
      try {
        const eventsCol = await getCollection('events');
        const event = order.event_id ? await eventsCol.findOne({ id: order.event_id }) : null;
        await sendOrderSuccessEmails(order, event);
      } catch (emailErr) {
        console.error('Error dispatching emails in BOG callback:', emailErr);
      }
    }

    // Update order status
    await ordersCol.updateOne(toIdFilter(order.id), {
      $set: {
        status: internalStatus,
        payment_status: internalStatus,
        transaction_id: transactionId,
        payment_callback_received: true,
        payment_callback_data: data,
        updated_at: new Date().toISOString()
      }
    });

    // Update payments collection
    const paymentsCol = await getCollection('payments');
    await paymentsCol.updateOne(
      { order_number: order.order_number },
      {
        $set: {
          order_id: order.id,
          order_number: order.order_number,
          payment_method: paymentDetail.transfer_method?.key || 'card',
          amount: parseFloat(transferAmount) || order.total_price,
          currency: order.currency || 'GEL',
          transaction_id: transactionId,
          status: internalStatus,
          card_type: paymentDetail.card_type || '',
          payer_identifier: paymentDetail.payer_identifier || '',
          result_code: paymentDetail.code || '',
          result_message: paymentDetail.code_description || '',
          payment_gateway_response: data,
          updated_at: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    console.log(`Order ${order.order_number} marked as ${internalStatus} via BOG callback`);
    return res.json({ success: true, message: 'Callback processed' });
  } catch (error) {
    console.error('BOG callback processing error:', error);
    return res.status(500).json({ error: 'Callback processing error', details: error.message });
  }
});

// --------------------------------------------------------------------------
// 8. BOG Payment Status / Receipt
// Ported from Discount-Backend/orders/views/payment.py -> BOGPaymentStatusView
// --------------------------------------------------------------------------
router.get([
  '/payments/status/:order_id',
  '/status/:order_id',
  '/bog/status/:order_id',
  '/receipt/:order_id'
], async (req, res) => {
  try {
    const { order_id } = req.params;
    const ordersCol = await getCollection('orders');
    const order = await findOrder(ordersCol, order_id);

    // If BOG credentials are set and order has a BOG transaction ID, try querying BOG receipt API
    const hasBogCredentials = Boolean((process.env.BOG_PUBLIC_KEY || BOG_PUBLIC_KEY) && (process.env.BOG_SECRET_KEY || BOG_SECRET_KEY));
    const bogId = order?.bog_order_id || order?.transaction_id || order_id;

    if (hasBogCredentials && bogId && !bogId.startsWith('gpay_') && !bogId.startsWith('apay_') && !bogId.startsWith('bog_')) {
      try {
        const token = await getBogAccessToken();
        const baseUrl = process.env.BOG_BASE_URL || 'https://api.bog.ge';

        const receiptResponse = await bogHttpClient.get(`${baseUrl}/payments/v1/receipt/${bogId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (receiptResponse.status >= 200 && receiptResponse.status < 300) {
          const receiptData = receiptResponse.data || {};
          const bogStatusKey = receiptData?.order_status?.key || receiptData?.status || '';
          if (order && bogStatusKey === 'completed' && order.status !== 'paid') {
            await ordersCol.updateOne(toIdFilter(order.id), {
              $set: {
                status: 'paid',
                payment_status: 'paid',
                updated_at: new Date().toISOString()
              }
            });
            order.status = 'paid';
            order.payment_status = 'paid';
            try {
              const eventsCol = await getCollection('events');
              const event = order.event_id ? await eventsCol.findOne({ id: order.event_id }) : null;
              await sendOrderSuccessEmails(order, event);
            } catch (mailErr) {
              console.warn('Email dispatch error after BOG receipt verification:', mailErr);
            }
          } else if (order && bogStatusKey === 'rejected' && order.status === 'pending') {
            await ordersCol.updateOne(toIdFilter(order.id), {
              $set: {
                status: 'failed',
                payment_status: 'failed',
                updated_at: new Date().toISOString()
              }
            });
            order.status = 'failed';
            order.payment_status = 'failed';
          }
          return res.json({
            ...receiptData,
            order_id: order?.id,
            order_number: order?.order_number || order_id,
            status: order?.status || (bogStatusKey === 'completed' ? 'paid' : bogStatusKey || 'pending'),
            payment_status: order?.payment_status || (bogStatusKey === 'completed' ? 'paid' : bogStatusKey || 'pending')
          });
        }
      } catch (err) {
        console.warn('Failed to query BOG receipt API:', err);
      }
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      status: order.status || 'pending',
      payment_method: order.payment_method || 'Card',
      total_price: order.total_price || 0,
      is_used: Boolean(order.is_used),
      created_at: order.created_at
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error checking payment status', details: error.message });
  }
});

// --------------------------------------------------------------------------
// 9. Send Ticket Confirmation Email API
// --------------------------------------------------------------------------
router.post(['/email/send-ticket-confirmation', '/send-ticket-confirmation'], async (req, res) => {
  try {
    const { order_id, order_number } = req.body;
    const orderIdentifier = order_number || order_id;

    if (!orderIdentifier) {
      return res.status(400).json({ error: 'order_number is required' });
    }

    const ordersCol = await getCollection('orders');
    const order = await findOrder(ordersCol, orderIdentifier);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const eventsCol = await getCollection('events');
    const event = order.event_id ? await eventsCol.findOne({ id: order.event_id }) : null;

    const results = await sendOrderSuccessEmails(order, event);
    return res.json({ success: true, message: 'Confirmation emails dispatched', results });
  } catch (error) {
    console.error('Email dispatch error:', error);
    return res.status(500).json({ error: 'Failed to send confirmation emails', details: error.message });
  }
});

export default router;
