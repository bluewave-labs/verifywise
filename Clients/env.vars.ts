export const ENV_VARs = {
  URL: import.meta.env.VITE_APP_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3000` || 'http://localhost:3000/',
  IS_DEMO_APP: import.meta.env.VITE_IS_DEMO_APP === 'true',
};