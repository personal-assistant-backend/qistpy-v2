// Business constants referenced across frontend + backend.
// Keep in sync with seed data and SEO page generator.

// Cities covered for SEO longtail pages (Phase 8).
export const SUPPORTED_CITIES = [
  { slug: 'lahore', name: 'Lahore' },
  { slug: 'karachi', name: 'Karachi' },
  { slug: 'islamabad', name: 'Islamabad' },
  { slug: 'rawalpindi', name: 'Rawalpindi' },
  { slug: 'faisalabad', name: 'Faisalabad' },
  { slug: 'multan', name: 'Multan' },
  { slug: 'peshawar', name: 'Peshawar' },
  { slug: 'quetta', name: 'Quetta' },
  { slug: 'gujranwala', name: 'Gujranwala' },
  { slug: 'sialkot', name: 'Sialkot' },
] as const;

// Top-level categories for SEO longtail pages.
export const SEO_CATEGORIES = [
  { slug: 'mobiles', name: 'Mobiles' },
  { slug: 'bikes', name: 'Bikes' },
  { slug: 'laptops', name: 'Laptops' },
  { slug: 'leds', name: 'LEDs' },
  { slug: 'refrigerators', name: 'Refrigerators' },
  { slug: 'acs', name: 'ACs' },
  { slug: 'washing-machines', name: 'Washing Machines' },
  { slug: 'microwaves', name: 'Microwaves' },
] as const;

// Allowed installment durations (Phase 4 domain rule).
export const INSTALLMENT_DURATIONS = [3, 6, 9, 12] as const;
export type InstallmentDuration = (typeof INSTALLMENT_DURATIONS)[number];

// Currency formatting helper used by both Angular pipes and API responses.
export const CURRENCY_CODE = 'PKR';
export const CURRENCY_LOCALE = 'en-PK';
