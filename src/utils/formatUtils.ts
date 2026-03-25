
/**
 * Formats a number as a currency string in BRL (R$) with exactly 2 decimal places.
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formats a number as a decimal string with exactly 2 decimal places (no currency symbol).
 */
export const formatDecimal = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0,00';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Parses a currency input string (e.g., "1.234,56") into a number.
 * Assumes the input is being typed and follows the pattern of shifting decimals.
 */
export const parseCurrencyInput = (value: string): number => {
  const digits = value.replace(/\D/g, '');
  return parseInt(digits || '0', 10) / 100;
};

/**
 * Formats a quantity with up to 3 decimal places, removing trailing zeros.
 */
export const formatQuantity = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
};

/**
 * Comprime uma imagem base64 para reduzir seu tamanho.
 */
export const compressImage = (base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Se a imagem original for PNG ou se quisermos preservar transparência, 
      // usamos webp (que suporta transparência e comprime bem) ou png.
      const isPng = base64.startsWith('data:image/png');
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      
      // Tenta usar webp se disponível, pois suporta transparência e é menor que png
      try {
        const webp = canvas.toDataURL('image/webp', quality);
        if (webp.startsWith('data:image/webp')) {
          resolve(webp);
          return;
        }
      } catch (e) {
        // Fallback para o tipo detectado
      }

      const compressed = canvas.toDataURL(mimeType, quality);
      resolve(compressed);
    };
    img.onerror = (err) => reject(err);
  });
};
