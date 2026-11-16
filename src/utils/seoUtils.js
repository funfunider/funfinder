import { getImageUrl } from './imageUtils';

/**
 * Dynamically updates document title, meta tags, Open Graph, Twitter, Canonical,
 * html lang attribute, and Schema.org JSON-LD structured data.
 */
export const updateSeoMeta = ({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
  lang = 'ka',
  jsonLd = null,
}) => {
  if (typeof document === 'undefined') return;

  const siteName = 'Funfinder';
  const pageTitle = title ? `${title} | ${siteName}` : 'Funfinder - Events & Adventures in Georgia';
  const pageDesc = description
    ? description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').slice(0, 180).trim()
    : 'Discover Unforgettable Sea and Land Adventures in Georgia with Funfinder.';

  let pageImage = `${window.location.origin}/logo.jpg`;
  if (image) {
    pageImage = getImageUrl(image);
  }

  const pageUrl = url || window.location.href;

  // 1. Document title
  document.title = pageTitle;

  // 2. Set <html lang="...">
  if (lang) {
    document.documentElement.lang = lang;
  }

  // 3. Helper to set/update meta tag
  const setMetaTag = (attributeName, attributeValue, content) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 4. Basic SEO Meta
  setMetaTag('name', 'description', pageDesc);
  if (keywords) {
    setMetaTag('name', 'keywords', keywords);
  }

  // 5. Open Graph / Facebook / WhatsApp / iMessage / Telegram
  setMetaTag('property', 'og:site_name', siteName);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:title', pageTitle);
  setMetaTag('property', 'og:description', pageDesc);
  setMetaTag('property', 'og:image', pageImage);
  setMetaTag('property', 'og:image:secure_url', pageImage);
  setMetaTag('property', 'og:url', pageUrl);

  const localeMap = {
    ka: 'ka_GE',
    en: 'en_US',
    ru: 'ru_RU',
    tr: 'tr_TR',
    uk: 'uk_UA',
    zh: 'zh_CN',
    hy: 'hy_AM',
    kk: 'kk_KZ',
    ar: 'ar_AE',
    hi: 'hi_IN',
    he: 'he_IL',
  };
  setMetaTag('property', 'og:locale', localeMap[lang] || 'ka_GE');

  // 6. Twitter / X Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', pageTitle);
  setMetaTag('name', 'twitter:description', pageDesc);
  setMetaTag('name', 'twitter:image', pageImage);

  // 7. Canonical link
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', pageUrl.split('?')[0]);

  // 8. JSON-LD Structured Data
  let jsonLdEl = document.getElementById('dynamic-json-ld');
  if (jsonLd) {
    if (!jsonLdEl) {
      jsonLdEl = document.createElement('script');
      jsonLdEl.setAttribute('type', 'application/ld+json');
      jsonLdEl.setAttribute('id', 'dynamic-json-ld');
      document.head.appendChild(jsonLdEl);
    }
    jsonLdEl.textContent = JSON.stringify(jsonLd);
  } else if (jsonLdEl) {
    jsonLdEl.remove();
  }
};

/**
 * Builds Schema.org Event / TouristAttraction structured data
 */
export const buildEventJsonLd = (event, lang = 'ka') => {
  if (!event) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://funfinder.ge';
  const title = event.name || event.title || 'Adventure Event';
  const desc = (event.description || '').replace(/<[^>]*>/g, '').slice(0, 250).trim();
  const image = event.cover_image || (Array.isArray(event.images) && event.images[0]) || '/logo.jpg';
  const price = event.discounted_price || event.base_price || 0;
  const currency = event.currency || 'GEL';

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description: desc,
    image: getImageUrl(image),
    startDate: event.start_date || new Date().toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location || event.city?.name || 'Georgia',
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city?.name || 'Batumi',
        addressCountry: 'GE',
      },
    },
    offers: {
      '@type': 'Offer',
      url: `${origin}/activity/${event.category?.slug || 'tour'}/${event.slug || event.id}`,
      price: price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    },
    organizer: {
      '@type': 'Organization',
      name: 'Funfinder Georgia',
      url: 'https://funfinder.ge',
    },
  };
};
