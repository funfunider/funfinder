import https from 'https';
import dns from 'dns';
import axios from 'axios';

// Verified Akamai Anycast IPs for Bank of Georgia OAuth gateway
// Local ISP DNS in Georgia often resolves oauth2.bog.ge to unrouted 87.253.59.* nodes which time out.
const BOG_OAUTH_FALLBACK_IPS = ['2.19.51.186', '2.19.51.187'];
let ipPointer = 0;

export const bogHttpsAgent = new https.Agent({
  keepAlive: true,
  lookup: (hostname, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (hostname === 'oauth2.bog.ge') {
      const selectedIp = BOG_OAUTH_FALLBACK_IPS[ipPointer++ % BOG_OAUTH_FALLBACK_IPS.length];
      if (options && options.all) {
        return callback(null, [{ address: selectedIp, family: 4 }]);
      }
      return callback(null, selectedIp, 4);
    }

    return dns.lookup(hostname, options, callback);
  }
});

export const bogHttpClient = axios.create({
  httpsAgent: bogHttpsAgent,
  timeout: 15000,
  validateStatus: () => true // Allow handling all HTTP statuses explicitly
});

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtain OAuth2 Bearer token from Bank of Georgia
 */
export async function getBogAccessToken(clientId, clientSecret) {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 30000) {
    return cachedToken;
  }

  const id = clientId || process.env.BOG_PUBLIC_KEY || '10002622';
  const secret = clientSecret || process.env.BOG_SECRET_KEY || 'NTNNHSB12vxo';

  if (!id || !secret) {
    throw new Error('BOG_PUBLIC_KEY or BOG_SECRET_KEY not configured in environment');
  }

  const authUrl = process.env.BOG_AUTH_URL || 'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
  const basicAuth = Buffer.from(`${id}:${secret}`).toString('base64');

  const res = await bogHttpClient.post(authUrl, 'grant_type=client_credentials', {
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (res.status < 200 || res.status >= 300) {
    const errorBody = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    console.error(`BOG token request failed HTTP ${res.status}:`, errorBody);
    throw new Error(`Failed to get BOG token (status ${res.status}): ${errorBody}`);
  }

  const data = res.data || {};
  cachedToken = data.access_token;
  tokenExpiresAt = now + ((data.expires_in || 300) * 1000);
  return cachedToken;
}
