const BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

export const API = {
  BASE_URL: BASE,
  JOBS: `${BASE}/jobs`,
  SETTINGS: `${BASE}/setting`,
  FAQ: `${BASE}/faqs`,
  BRANCHES: `${BASE}/branches`,
  BLOG: `${BASE}/blog`,
  GALLERY: `${BASE}/gallery`,
  FEATURED_GALLARY: `${BASE}/gallery/featured`,
  CLIENTS: `${BASE}/partners`,
  PRODUCTS: `${BASE}/products`,
  VIDEO: `${BASE}/video`,
  COUPON: `${BASE}/coupon`,
  CHECKOUT: `${BASE}/checkout`,
  CUSTOMIZATION: `${BASE}/customization`,
  CATEGORY: `${BASE}/categories`,
  PAGE: `${BASE}/page`,
  PAGES: `${BASE}/pages`,
} as const;
