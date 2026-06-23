/**
 * ─── API URL CONFIGURATION ───────────────────────────────────────────────────
 *
 * SAME PC (localhost):
 *   apiUrl: 'http://localhost:3000/api'
 *
 * OTHER DEVICE ON SAME WiFi:
 *   apiUrl: 'http://localhost:3000/api'
 *   (replace with your PC's IPv4 from `ipconfig`)
 *
 * After changing: restart dev server + clear Angular cache:
 *   cd apps/web && rmdir /s /q .angular && cd ../.. && pnpm dev:web
 */
export const environment = {
  production: false,
  apiUrl: '/api',
};
