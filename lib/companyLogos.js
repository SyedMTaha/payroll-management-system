// Company name to logo mapping
// Store logos in: public/assets/fleet/
// Add your company names and their corresponding logo file names here

export const COMPANY_LOGOS = {
  // Update with your actual company names and logo paths
  'FNP': '/assets/fleet/fnp-logo.png',
  'Careem': '/assets/fleet/careem-logo.jfif',
  'Aramex': '/assets/fleet/logo-aramex.svg',
  // Add more companies as needed
};

// Default logo fallback if company not found
export const DEFAULT_LOGO = '/assets/logo/logo.png';

/**
 * Get logo URL for a company
 * @param {string} companyName - The company name
 * @returns {string} - The logo URL or default logo
 */
export const getCompanyLogo = (companyName) => {
  if (!companyName) return DEFAULT_LOGO;
  return COMPANY_LOGOS[companyName] || DEFAULT_LOGO;
};

/**
 * Get all available companies
 * @returns {string[]} - Array of company names
 */
export const getAvailableCompanies = () => {
  return Object.keys(COMPANY_LOGOS);
};
