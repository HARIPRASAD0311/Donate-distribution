/**
 * ResQNet Core Formatting Utilities
 */

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return isoString;
  }
}

export function formatQuantity(num, unit = '') {
  if (num === undefined || num === null) return '0';
  return `${new Intl.NumberFormat('en-US').format(num)} ${unit}`.trim();
}

export function formatCurrencyUsd(amount) {
  if (amount === undefined || amount === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
