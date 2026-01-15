# SecureNotes - SyncVault Example App

A minimal, production-ready example application demonstrating all SyncVault SDK features. Build encrypted, synced applications with ease.

## Features

- **End-to-End Encryption**: All data encrypted locally with AES-256-GCM before upload
- **OAuth 2.0 Authentication**: Secure sign-in via SyncVault account
- **Encrypted Storage**: Notes and preferences synced across devices
- **Storage Quotas**: Real-time display of storage usage with quota management
- **User Preferences**: Store and sync encrypted metadata (theme, timezone, language)
- **Automatic Sync**: Changes persist instantly across all devices
- **Auto-Save**: Notes saved automatically with 1-second debounce

## Getting Started

### Prerequisites

- Node.js 16+
- A SyncVault account with app credentials from the [Developer Dashboard](https://developers.syncvault.dev)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/syncvault-dev/example-notes-js.git
cd example-notes-js
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Fill in your credentials in `.env`:
```env
VITE_APP_TOKEN=your_app_token_from_dev_dashboard
VITE_REDIRECT_URI=http://localhost:5173
```

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:5173 in your browser

## Getting Your App Token

1. Go to https://developers.syncvault.dev and sign up/login
2. Create a new app in the developer dashboard
3. Copy your App Token
4. Paste it in `.env` as `VITE_APP_TOKEN`

## SDK Features Demonstrated

### Authentication
```javascript
// Get OAuth login URL
vault.getAuthUrl()

// Complete OAuth flow with password
await vault.exchangeCode(code, password)
```

### Data Storage
```javascript
// Store encrypted notes
await vault.put('notes/my-note.json', { title, content })

// List all notes
const files = await vault.list()

// Get decrypted note
const note = await vault.get('notes/my-note.json')

// Delete note
await vault.delete('notes/my-note.json')
```

### User Preferences (Metadata)
```javascript
// Get user preferences
const prefs = await vault.getMetadata()

// Update preferences
await vault.updateMetadata({ theme: 'dark' })
```

### Storage Quotas
```javascript
// Check storage usage
const quota = await vault.getQuota()
// { usedBytes, quotaBytes, unlimited }
```

## How It Works

1. **Authentication**: User signs in with SyncVault OAuth
2. **Password**: User enters encryption password (never sent to server)
3. **Encryption**: All data encrypted locally with password-derived key
4. **Upload**: Encrypted data stored on SyncVault server
5. **Sync**: Changes automatically synced across devices
6. **Decryption**: Data decrypted locally on other devices

The server never sees plaintext content.

## Project Structure

```
example-app/
├── src/
│   ├── App.jsx              # Main app with page navigation
│   ├── vault.js             # SDK initialization
│   ├── styles.css           # Global styles
│   ├── components/
│   │   ├── Notes.jsx        # Notes editor with quota display
│   │   └── Settings.jsx     # User preferences
├── .env.example
├── package.json
└── vite.config.js
```

## Development

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

## Error Handling

The SDK throws `SyncVaultError` with `message` and `statusCode`:
```javascript
try {
  await vault.put('notes/large.json', data)
} catch (err) {
  if (err.statusCode === 413) {
    console.error('Storage limit exceeded')
  }
}
```

## Security

- Never hardcode credentials
- Environment variables kept in `.env` (git-ignored)
- All encryption happens client-side
- OAuth redirect URI must match your registered app
- Passwords never sent to server

## License

MIT

## Production Deployment

Build the app for production:

```bash
npm run build
```

The `dist/` directory contains optimized static files ready for deployment:
- Upload to any static hosting (Vercel, Netlify, AWS S3, etc.)
- Ensure the redirect URI in your SyncVault app settings matches your production domain
- Update the `serverUrl` in `src/vault.js` if needed (default: https://api.syncvault.dev)

## Files

- `src/vault.js` - SDK configuration
- `src/App.jsx` - Main app with auth state
- `src/components/Auth.jsx` - Login/register forms
- `src/components/Notes.jsx` - Notes editor with CRUD operations
