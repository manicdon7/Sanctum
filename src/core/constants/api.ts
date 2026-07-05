/**
 * Sanctum API Constants
 * Centralised backend URL configuration.
 */

// Update this to your production URL when deploying.
// For local development, use the IP of your machine if testing on a physical device.
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://your-sanctum-server.example.com';
