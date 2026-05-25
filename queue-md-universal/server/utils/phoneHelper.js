/**
 * Helper to match phone numbers with flexible formatting (spaces, dashes, country code).
 * Converts a phone input string to a regex.
 * 
 * @param {string} phoneStr - The input phone number string.
 * @param {boolean} anchorEnd - Whether to anchor the regex to the end of the string.
 * @returns {RegExp|null} The regex matching the phone number, or null if no digits found.
 */
const getPhoneRegex = (phoneStr, anchorEnd = true) => {
  if (!phoneStr) return null;
  // Strip all non-digit characters
  const digits = phoneStr.replace(/\D/g, "");
  if (digits.length === 0) return null;
  
  // Take last 10 digits to match either with or without +91
  const matchDigits = digits.length >= 10 ? digits.slice(-10) : digits;
  
  // Create a regex pattern where each digit can be followed by optional non-digits (\D*)
  let pattern = matchDigits.split('').map(d => `${d}\\D*`).join('');
  if (anchorEnd) {
    pattern += '$';
  }
  return new RegExp(pattern);
};

module.exports = {
  getPhoneRegex
};
