/**
 * Reviews API client. Hits the v3 customer review endpoints.
 *   GET  /event/<id>/list   — public
 *   POST /event/<id>/create — requires customer_session_token cookie
 */

const getLanguage = () => {
  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && ['en', 'ka', 'ru', 'hi', 'ar', 'he'].includes(parts[0])) {
      return parts[0];
    }
    return window.localStorage.getItem('ff_language') || 'en';
  }
  return 'en';
};

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const envUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined;
const API_BASE_URL =
  envUrl && (isLocal || !envUrl.includes('localhost'))
    ? envUrl
    : isLocal
      ? 'http://localhost:5000'
      : 'https://funfinder-front.vercel.app';
const getBaseUrl = () => `${API_BASE_URL}/${getLanguage()}/api/v3/review`;

async function request(endpoint, { headers, ...options } = {}) {
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(headers || {}),
    },
  });

  let body = null;
  try { body = await response.json(); } catch { /* empty body */ }

  if (!response.ok) {
    const err = new Error(body?.detail || body?.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return body;
}

const reviewsApi = {
  listForEvent: (eventId) => request(`/event/${eventId}/list`),

  create: (eventId, { rating, comment = '' }) =>
    request(`/event/${eventId}/create`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
};

export default reviewsApi;
