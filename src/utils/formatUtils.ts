
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
