export async function processChartImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // Cap dimensions at 1600px for optimal Gemini Vision OCR & analysis
      const maxDim = 1600;
      let targetWidth = width;
      let targetHeight = height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          targetWidth = maxDim;
          targetHeight = Math.round((height * maxDim) / width);
        } else {
          targetHeight = maxDim;
          targetWidth = Math.round((width * maxDim) / height);
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw original chart image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Image enhancement: Auto-frame and enhance contrast for price axis & timestamp OCR clarity
      try {
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;
        
        // Slight contrast and sharpness enhancement for candlestick charts & axis text
        const contrast = 1.05; // 5% contrast boost
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // R
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // G
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // B
        }
        ctx.putImageData(imageData, 0, 0);
      } catch (err) {
        // Fallback if getImageData is tainted by cross-origin
        console.warn('Canvas processing enhancement skipped due to cross-origin restriction:', err);
      }

      const processedDataUrl = canvas.toDataURL('image/png', 0.95);
      resolve(processedDataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
