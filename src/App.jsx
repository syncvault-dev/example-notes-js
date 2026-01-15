import { useState, useEffect } from 'react';
import { vault } from './vault';
import Notes from './components/Notes';
import Settings from './components/Settings';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [code, setCode] = useState(null);
  const [page, setPage] = useState('notes');

  useEffect(() => {
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('OAuth error:', error);
      window.history.replaceState({}, '', window.location.pathname);
      setLoading(false);
      return;
    }

    if (authCode) {
      setCode(authCode);
      setNeedsPassword(true);
      window.history.replaceState({}, '', window.location.pathname);
      setLoading(false);
      return;
    }

    // Check for stored session
    const storedToken = localStorage.getItem('syncvault_token');
    const storedPassword = localStorage.getItem('syncvault_password');
    const storedUser = localStorage.getItem('syncvault_user');

    if (storedToken && storedPassword && storedUser) {
      vault.setAuth(storedToken, storedPassword);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  async function handlePasswordSubmit(password) {
    try {
      const userData = await vault.exchangeCode(code, password);
      
      // Store session
      localStorage.setItem('syncvault_token', vault.token);
      localStorage.setItem('syncvault_password', password);
      localStorage.setItem('syncvault_user', JSON.stringify(userData));
      
      setUser(userData);
      setNeedsPassword(false);
      setCode(null);
    } catch (err) {
      alert('Authentication failed: ' + err.message);
    }
  }

  function handleLogin() {
    window.location.href = vault.getAuthUrl();
  }

  function handleLogout() {
    vault.logout();
    localStorage.removeItem('syncvault_token');
    localStorage.removeItem('syncvault_password');
    localStorage.removeItem('syncvault_user');
    setUser(null);
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return <PasswordPrompt onSubmit={handlePasswordSubmit} />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            SecureNotes
          </div>
          <div className="powered-by">
            Powered by <span>SyncVault</span>
          </div>
          <div className="user-info">
            <span className="username">@{user.username}</span>
            <nav className="header-nav">
              <button 
                className={`nav-link ${page === 'notes' ? 'active' : ''}`}
                onClick={() => setPage('notes')}
              >
                Notes
              </button>
              <button 
                className={`nav-link ${page === 'settings' ? 'active' : ''}`}
                onClick={() => setPage('settings')}
              >
                Settings
              </button>
            </nav>
            <button onClick={handleLogout} className="btn btn-secondary">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          {page === 'notes' ? <Notes /> : <Settings />}
        </div>
      </main>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>SecureNotes</span>
        </div>
        <p className="auth-subtitle">
          Powered by <span>SyncVault</span>
        </p>
        <h1 className="auth-title">Welcome</h1>
        <p className="auth-desc">Sign in with your SyncVault account to access your encrypted notes.</p>
        <button onClick={onLogin} className="btn btn-primary" style={{ width: '100%' }}>
          Sign in with SyncVault
        </button>
      </div>
    </div>
  );
}

function PasswordPrompt({ onSubmit }) {
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (password) {
      onSubmit(password);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="auth-title">Encryption Password</h1>
        <p className="auth-desc">
          Enter your encryption password. This is used to encrypt and decrypt your notes locally.
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your encryption password"
              autoFocus
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
