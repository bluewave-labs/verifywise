export const ENV_VARs = {
  URL: `${window.location.protocol}//${window.location.hostname}:3000` || 'http://localhost:3000/',
  IS_DEMO_APP: import.meta.env.VITE_IS_DEMO_APP === 'true',
};