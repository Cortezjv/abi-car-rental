/**
 * Philippine Phone Number Formatter
 * Converts: 09123456789 → +639123456789
 * Also handles: 9123456789 → +639123456789
 */
export function formatPhilippinePhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with '0', remove it and add +63
  if (cleaned.startsWith('0')) {
    cleaned = '63' + cleaned.substring(1);
  }
  // If it's 10 digits starting with 9 (mobile number without 0)
  else if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '63' + cleaned;
  }
  // If it's already in 63 format but without +
  else if (cleaned.startsWith('63') && cleaned.length === 12) {
    // Keep as is
  }
  
  // Add + prefix
  return '+' + cleaned;
}

/**
 * Validate if phone number is a valid Philippine mobile number
 */
export function isValidPhilippinePhone(phone: string): boolean {
  const formatted = formatPhilippinePhone(phone);
  // Should be +63 followed by 10 digits (total 13 chars)
  return /^\+63\d{10}$/.test(formatted);
}

/**
 * Display format for UI (show as 0XXX XXX XXXX)
 */
export function displayPhoneFormat(phone: string): string {
  const formatted = formatPhilippinePhone(phone);
  // Remove +63, add 0 prefix for display
  const national = '0' + formatted.substring(3);
  // Format: 0912 345 6789
  return national.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
}
