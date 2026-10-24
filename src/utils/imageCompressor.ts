/**
 * imageCompressor.ts
 * Utilidad para optimizar fotos tomadas directamente desde celulares (iPhone, Android) o PC.
 * Reduce fotos pesadas de 10MB-25MB a ~300KB-700KB con nitidez excepcional
 * para que suban instantáneamente a Supabase o al servidor sin errores de límite de carga.
 */

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export async function compressImageForUpload(
  file: File,
  maxDimension = 1920,
  quality = 0.88
): Promise<CompressedImageResult> {
  // Si no es imagen o es SVG / GIF animado, no alterar
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      width: 0,
      height: 0,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  return new Promise((resolve) => {
    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Si ya es liviana (< 800KB) y de tamaño moderado (< 1920px), mantener
        if (originalSize < 800 * 1024 && width <= maxDimension && height <= maxDimension) {
          resolve({
            file,
            dataUrl: src,
            width,
            height,
            originalSize,
            compressedSize: originalSize,
          });
          return;
        }

        // Calcular escala proporcional manteniendo relación de aspecto
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            file,
            dataUrl: src,
            width,
            height,
            originalSize,
            compressedSize: originalSize,
          });
          return;
        }

        // Suavizado de imagen de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Elegir tipo de salida óptimo: WEBP o JPEG
        const outputMime = 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(outputMime, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                dataUrl: compressedDataUrl,
                width,
                height,
                originalSize,
                compressedSize: originalSize,
              });
              return;
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: outputMime,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              dataUrl: compressedDataUrl,
              width,
              height,
              originalSize,
              compressedSize: blob.size,
            });
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        // Fallback en caso de error
        resolve({
          file,
          dataUrl: src,
          width: 0,
          height: 0,
          originalSize,
          compressedSize: originalSize,
        });
      };

      img.src = src;
    };

    reader.onerror = () => {
      resolve({
        file,
        dataUrl: '',
        width: 0,
        height: 0,
        originalSize,
        compressedSize: originalSize,
      });
    };

    reader.readAsDataURL(file);
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}
