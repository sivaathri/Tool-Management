// Utility to compress and resize inspection photos before storing in PM checklist
export function compressImage(fileOrDataUrl, maxWidth = 1280, maxHeight = 960, quality = 0.75) {
  // Support both (file, { maxWidth, maxHeight, quality }) and positional args
  let targetWidth = maxWidth;
  let targetHeight = maxHeight;
  let targetQuality = quality;

  if (typeof maxWidth === 'object' && maxWidth !== null) {
    targetWidth = maxWidth.maxWidth || 1280;
    targetHeight = maxWidth.maxHeight || 960;
    targetQuality = maxWidth.quality !== undefined ? maxWidth.quality : 0.75;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > targetWidth) {
          height = Math.round((height * targetWidth) / width);
          width = targetWidth;
        }
      } else {
        if (height > targetHeight) {
          width = Math.round((width * targetHeight) / height);
          height = targetHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', targetQuality);

      // Estimate compressed size in KB/MB
      const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
      const sizeStr = approxBytes > 1024 * 1024
        ? `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(approxBytes / 1024)} KB`;

      resolve({
        dataUrl: compressedDataUrl,
        size: sizeStr,
        width,
        height
      });
    };
    img.onerror = (err) => reject(new Error('Failed to load image for compression'));

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      reject(new Error('Invalid image input: expected File, Blob, or Data URL string'));
    }
  });
}
