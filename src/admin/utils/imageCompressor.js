/**
 * Utility to compress image files on the client side using HTML5 Canvas.
 * Reduces large high-res photos (e.g. 2MB - 15MB) down to ~100KB - 300KB
 * preserving visual quality while staying well below server payload limits.
 */
export const compressImage = async (file, options = {}) => {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return file;
  }

  // Skip non-image types or SVG files
  if (!file.type || !file.type.startsWith('image/') || file.type.includes('svg')) {
    return file;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    outputType = 'image/jpeg'
  } = options;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved target dimensions
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const bestRatio = Math.min(widthRatio, heightRatio);

          width = Math.round(width * bestRatio);
          height = Math.round(height * bestRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image onto canvas with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Construct new compressed File
            const newFilename = (file.name || 'image').replace(/\.[^/.]+$/, "") + '.jpg';
            const compressedFile = new File([blob], newFilename, {
              type: outputType,
              lastModified: Date.now(),
            });

            console.log(
              `[ImageCompressor] Compressed from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB (${width}x${height})`
            );

            // If compressed file is somehow larger than original, stick with original
            if (compressedFile.size >= file.size && file.size > 0) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          },
          outputType,
          quality
        );
      };

      img.onerror = (err) => {
        console.warn('[ImageCompressor] Failed to load image for compression, falling back to original:', err);
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch (err) {
      console.warn('[ImageCompressor] Error during image compression, falling back to original:', err);
      resolve(file);
    }
  });
};

export default compressImage;
