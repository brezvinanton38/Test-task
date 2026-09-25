/** Public, non-secret config for the test company — safe to default so `npm test` works with zero setup. */
export const WIDGET_BASE_URL = process.env.WIDGET_BASE_URL ?? 'https://book.natodi.com';
export const API_BASE_URL = process.env.API_BASE_URL ?? 'https://api.natodi.com/api/v1/';
export const COMPANY_SLUG = process.env.COMPANY_SLUG ?? 'qa-test-barbershop-5116b6dd';
