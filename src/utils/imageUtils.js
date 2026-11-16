// Base URL for images
export const IMAGE_BASE_URL = "https://funfinder.ge/uploads/service_images/";

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
    image = image.image || image.url || image.src || image.path || image.file;
  }

  // Handle falsy values and literal 'undefined' or 'null' strings
  if (!image || image === "undefined" || image === "null") {
    return fallback;
  }

  // Convert to string if it's not a string
  const imageStr = typeof image === "string" ? image.trim() : String(image).trim();

  // Still check for stringified 'undefined'/'null'/'[object Object]' after conversion
  if (
    imageStr === "undefined" ||
    imageStr === "null" ||
    imageStr === "[object Object]" ||
    !imageStr
  ) {
    return fallback;
  }

  // If it's already a full URL (starts with http:// or https://), return as is
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) {
    return imageStr;
  }

  // If it starts with '/', check if it is an API upload path or a local public asset
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (imageStr.startsWith("/")) {
    if (imageStr.startsWith("/uploads/")) {
      return isLocal ? imageStr : "https://funfinder.ge" + imageStr;
    }
    if (
      imageStr.startsWith("/media/") ||
      imageStr.startsWith("/slider_images/") ||
      imageStr.startsWith("/service_images/")
    ) {
      return "https://funfinder.ge" + imageStr;
    }
    return imageStr;
  }

  // Handle uploaded filenames without leading slash
  if (
    imageStr.startsWith("event-") ||
    imageStr.startsWith("slider-") ||
    imageStr.startsWith("img-") ||
    imageStr.startsWith("b64-")
  ) {
    return isLocal ? `/uploads/${imageStr}` : `https://funfinder.ge/uploads/${imageStr}`;
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
