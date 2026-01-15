import { useState, useEffect } from 'react';
import { vault } from '../vault';

export default function Settings() {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    timezone: 'UTC',
    language: 'en'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setLoading(true);
    try {
      const prefs = await vault.getMetadata();
      if (prefs) {
        setPreferences(prev => ({ ...prev, ...prefs }));
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updatePreference(key, value) {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    setSaving(true);

    try {
      await vault.updateMetadata(newPrefs);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading preferences...</div>;
  }

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      
      <div className="settings-group">
        <h2>Preferences</h2>
        
        <div className="setting-item">
          <label className="setting-label">
            <span>Theme</span>
            <select 
              value={preferences.theme} 
              onChange={e => updatePreference('theme', e.target.value)}
              disabled={saving}
              className="input"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </label>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <span>Timezone</span>
            <select 
              value={preferences.timezone} 
              onChange={e => updatePreference('timezone', e.target.value)}
              disabled={saving}
              className="input"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Central European</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </label>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <span>Language</span>
            <select 
              value={preferences.language} 
              onChange={e => updatePreference('language', e.target.value)}
              disabled={saving}
              className="input"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="ru">Russian</option>
            </select>
          </label>
        </div>
      </div>

      <div className="settings-info">
        <p>Your preferences are stored on SyncVault servers and sync across all your devices.</p>
      </div>

      {saving && <div className="saving-indicator">Saving...</div>}
    </div>
  );
}
