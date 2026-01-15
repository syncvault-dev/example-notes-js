import { SyncVault } from '@syncvault/sdk';

// Get configuration from environment variables
const APP_TOKEN = import.meta.env.VITE_APP_TOKEN;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://api.syncvault.dev';

// Validate required environment variables
if (!APP_TOKEN) {
  throw new Error('VITE_APP_TOKEN is required. Please check your .env file.');
}

if (!REDIRECT_URI) {
  throw new Error('VITE_REDIRECT_URI is required. Please check your .env file.');
}

export const vault = new SyncVault({
  appToken: APP_TOKEN,
  redirectUri: REDIRECT_URI,
  serverUrl: SERVER_URL
});

export { SyncVault };
