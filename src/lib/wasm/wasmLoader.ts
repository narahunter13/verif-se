let isLoaded = false;

export const loadWasm = async (): Promise<boolean> => {
  if (isLoaded) return true;

  try {
    const wasmBindgen = await import('$lib/wasm/image_compressor.js');
    await wasmBindgen.default('/wasm/image_compressor_bg.wasm');
    isLoaded = true;
    return true;
  } catch (err) {
    console.warn('WASM not available, using fallback compression:', err);
    return false;
  }
};

export const compressImage = async (
  file: File,
  quality: number = 80,
  maxWidth: number = 1280
): Promise<{ data: Uint8Array; base64: string }> => {
  return fallbackCompress(file, quality, maxWidth);
};

const fallbackCompress = (
  file: File,
  quality: number,
  maxWidth: number
): Promise<{ data: Uint8Array; base64: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          blob.arrayBuffer().then((buffer) => {
            const data = new Uint8Array(buffer);
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < data.length; i += chunkSize) {
              binary += String.fromCharCode(...data.subarray(i, i + chunkSize));
            }
            const base64 = btoa(binary);
            resolve({ data, base64 });
          });
        },
        'image/jpeg',
        quality / 100
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
