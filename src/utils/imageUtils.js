// Base URL for images
export const IMAGE_BASE_URL = "https://base.funfinder.ge/uploads/service_images/";

// Default image for activities without images
export const DEFAULT_ACTIVITY_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80";

/**
 * Helper function to get full image URL from any image data source.
 * Handles null, undefined, literal "undefined" string, absolute URLs, relative paths,
 * and database objects (e.g. primary_image: { image: "/uploads/..." }).
 *
 * @param {string|null|undefined|object} image - The image URL, filename, or object
 * @param {string} fallback - Optional custom fallback image URL
 * @returns {string} The resolved image URL
 */
export const getImageUrl = (image, fallback = DEFAULT_ACTIVITY_IMAGE) => {
  // If image is an object (e.g. primary_image: { id: 209, image: "..." } or { url: "..." })
  if (image && typeof image === "object") {
    image = image.image || image.url || image.raw_path || image.raw_image || image.src || image.path || image.file;
  }

  // Handle falsy values and literal 'undefined' or 'null' strings
  if (!image || image === "undefined" || image === "null") {
    return fallback;
  }

  // Convert to string if it's not a string
  let imageStr = typeof image === "string" ? image.trim() : String(image).trim();

  // Still check for stringified 'undefined'/'null'/'[object Object]' after conversion
  if (
    imageStr === "undefined" ||
    imageStr === "null" ||
    imageStr === "[object Object]" ||
    !imageStr
  ) {
    return fallback;
  }

  // 1. Strip accidental language prefix inside uploads (e.g. /en/uploads/... or https://.../en/uploads/...)
  imageStr = imageStr.replace(/\/(?:en|ka|ru|hi|ar|he|tr|hy|kk|uk|zh)\/uploads\//i, '/uploads/');

  // 2. Fix funfinder.ge/uploads without 'base.' -> base.funfinder.ge/uploads
  if (imageStr.includes('funfinder.ge/uploads/') && !imageStr.includes('base.funfinder.ge')) {
    imageStr = imageStr.replace('funfinder.ge/uploads/', 'base.funfinder.ge/uploads/');
  }

  // 3. If it's already a full URL (starts with http:// or https://), return as is
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) {
    return imageStr;
  }

  // 4. If it starts with '/', prepend the base backend URL
  if (imageStr.startsWith("/")) {
    if (imageStr.startsWith("/uploads/")) {
      return "https://base.funfinder.ge" + imageStr;
    }
    if (
      imageStr.startsWith("/media/") ||
      imageStr.startsWith("/slider_images/") ||
      imageStr.startsWith("/service_images/")
    ) {
      return "https://base.funfinder.ge" + imageStr;
    }
    return "https://base.funfinder.ge" + imageStr;
  }

  // 5. Handle uploaded filenames without leading slash
  if (
    imageStr.startsWith("event-") ||
    imageStr.startsWith("slider-") ||
    imageStr.startsWith("img-") ||
    imageStr.startsWith("b64-")
  ) {
    return `https://base.funfinder.ge/uploads/${imageStr}`;
  }

  // Otherwise, prepend the base URL
  return IMAGE_BASE_URL + imageStr;
};

/**
 * Helper function specifically for slider images
 */
export const getSliderImageUrl = (image) => {
  return getImageUrl(image);
};

export default getImageUrl;
