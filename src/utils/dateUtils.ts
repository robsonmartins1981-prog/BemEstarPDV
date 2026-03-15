
import { format as dateFnsFormat } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Safely creates a Date object from a value.
 * Returns null if the value is invalid.
 */
export const safeDate = (value: any): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Safely formats a date using date-fns.
 * Returns a fallback string if the date is invalid.
 */
export const safeFormat = (
  dateValue: any, 
  formatStr: string = 'dd/MM/yyyy', 
  fallback: string = '--/--/----'
): string => {
  const date = safeDate(dateValue);
  if (!date) return fallback;
  try {
    return dateFnsFormat(date, formatStr, { locale: ptBR });
  } catch (error) {
    return fallback;
  }
};

/**
 * Safely formats a date using toLocaleString.
 */
export const safeLocaleString = (
  dateValue: any, 
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '--/--/----'
): string => {
  const date = safeDate(dateValue);
  if (!date) return fallback;
  try {
    return date.toLocaleString('pt-BR', options);
  } catch (error) {
    return fallback;
  }
};

/**
 * Safely formats a date using toLocaleDateString.
 */
export const safeLocaleDateString = (
  dateValue: any, 
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '--/--/----'
): string => {
  const date = safeDate(dateValue);
  if (!date) return fallback;
  try {
    return date.toLocaleDateString('pt-BR', options);
  } catch (error) {
    return fallback;
  }
};

/**
 * Safely formats a date using toLocaleTimeString.
 */
export const safeLocaleTimeString = (
  dateValue: any, 
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '--:--'
): string => {
  const date = safeDate(dateValue);
  if (!date) return fallback;
  try {
    return date.toLocaleTimeString('pt-BR', options);
  } catch (error) {
    return fallback;
  }
};
