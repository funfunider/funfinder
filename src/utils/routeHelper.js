/**
 * Route helper utilities for event details links
 */

/**
 * Slugify a string by converting to lowercase, removing punctuation/symbols,
 * replacing spaces with hyphens, and collapsing multiple hyphens.
 * Supports Unicode/Georgian characters.
 * @param {string} text - Input text
 * @returns {string} Slugified text
 */
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep letters, numbers, spaces, and hyphens only
    .replace(/\s+/g, '-')              // Replace spaces with hyphens
    .replace(/-+/g, '-')               // Collapse duplicate hyphens
    .replace(/^-+|-+$/g, '')           // Trim leading/trailing hyphens
    .trim();
};

/**
 * Get the path for an event detail page in the format: /activity/:category/:title
 * @param {Object} event - Event object
 * @returns {string} Route URL
 */
export const getEventDetailUrl = (event) => {
  if (!event) return '/';
  
  // Get category name
  const category = event.category?.name || event.category_name || event.category || 'Other';
  
  // Get event title/name
  const title = event.name || event.title || '';
  
  return `/activity/${slugify(category)}/${slugify(title)}`;
};
