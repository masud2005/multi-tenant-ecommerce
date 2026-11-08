const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

export function validateLandingImageFile(file: File): string | null {
  if (!ACCEPT.includes(file.type) && !file.type.startsWith('image/')) {
    return 'Please choose a PNG, JPG, WebP, or AVIF image.';
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be under 5MB.';
  }
  return null;
}

/** Compress large photos before saving into landing config (localStorage-friendly). */
export function readLandingImageFile(file: File, maxWidth = 1920, quality = 0.82): Promise<string> {
  const error = validateLandingImageFile(file);
  if (error) return Promise.reject(new Error(error));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const raw = String(reader.result || '');
      if (!raw.startsWith('data:image/')) {
        reject(new Error('Invalid image data.'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(raw);
      img.onload = () => {
        if (img.width <= maxWidth && file.size < 900_000) {
          resolve(raw);
          return;
        }
        const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(raw);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(raw);
        }
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}
