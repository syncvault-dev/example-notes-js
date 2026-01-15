import { useState, useEffect, useCallback } from 'react';
import { vault } from '../vault';

const TITLE_MAX = 100;
const CONTENT_MAX = 50000;

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [quota, setQuota] = useState(null);
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    loadNotes();
    loadQuota();
    loadPreferences();
  }, []);

  async function loadNotes() {
    setLoading(true);
    setSyncing(true);
    try {
      const files = await vault.list();
      const noteFiles = files.filter(f => f.path.startsWith('notes/'));
      
      const loadedNotes = await Promise.all(
        noteFiles.map(async (file) => {
          try {
            const data = await vault.get(file.path);
            return {
              id: file.path.replace('notes/', '').replace('.json', ''),
              path: file.path,
              ...data,
              updatedAt: file.updatedAt
            };
          } catch (e) {
            console.error('Failed to load note:', file.path, e);
            return null;
          }
        })
      );

      const validNotes = loadedNotes.filter(Boolean).sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      
      setNotes(validNotes);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  async function loadQuota() {
    try {
      const quotaInfo = await vault.getQuota();
      setQuota(quotaInfo);
    } catch (err) {
      console.error('Failed to load quota:', err);
    }
  }

  async function loadPreferences() {
    try {
      const prefs = await vault.getMetadata();
      setPreferences(prefs || {});
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  }

  async function savePreferences(newPrefs) {
    try {
      await vault.updateMetadata(newPrefs);
      setPreferences(prev => ({ ...prev, ...newPrefs }));
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  }

  function selectNote(note) {
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);
  }

  async function createNote() {
    const id = Date.now().toString();
    const newNote = {
      id,
      path: `notes/${id}.json`,
      title: 'Untitled',
      content: '',
      updatedAt: new Date().toISOString()
    };

    setNotes([newNote, ...notes]);
    setSelectedId(id);
    setTitle('Untitled');
    setContent('');
  }

  const saveNote = useCallback(async () => {
    if (!selectedId) return;

    setSaving(true);
    setSaveError(null);
    try {
      const path = `notes/${selectedId}.json`;
      await vault.put(path, { title, content });
      
      setNotes(prev => prev.map(note => 
        note.id === selectedId 
          ? { ...note, title, content, updatedAt: new Date().toISOString() }
          : note
      ));
      
      // Reload quota after saving
      loadQuota();
    } catch (err) {
      console.error('Failed to save:', err);
      
      if (err.statusCode === 413) {
        setSaveError('Storage limit exceeded. Please upgrade your plan.');
      } else {
        setSaveError(err.message || 'Failed to save note');
      }
    } finally {
      setSaving(false);
    }
  }, [selectedId, title, content]);

  useEffect(() => {
    if (!selectedId) return;

    const timer = setTimeout(() => {
      saveNote();
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, selectedId, saveNote]);

  async function deleteNote() {
    if (!selectedId) return;
    
    try {
      await vault.delete(`notes/${selectedId}.json`);
      setNotes(prev => prev.filter(n => n.id !== selectedId));
      setSelectedId(null);
      setTitle('');
      setContent('');
      loadQuota();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return <div className="loading">Loading notes...</div>;
  }

  const quotaPercent = quota && !quota.unlimited ? Math.round((quota.usedBytes / quota.quotaBytes) * 100) : 0;

  return (
    <div className="notes-layout">
      <div className="sidebar">
        <div className="notes-list">
          <div className="notes-header">
            <h2>Notes</h2>
            <button className="btn-icon" onClick={createNote} title="New note">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          <div className="notes-items">
            {notes.length === 0 ? (
              <div className="empty-notes">
                No notes yet. Create one!
              </div>
            ) : (
              notes.map(note => (
                <button
                  key={note.id}
                  className={`note-item ${note.id === selectedId ? 'active' : ''}`}
                  onClick={() => selectNote(note)}
                >
                  <div className="note-item-title">
                    {note.title || 'Untitled'}
                  </div>
                  <div className="note-item-date">
                    {formatDate(note.updatedAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          {quota && (
            <div className="quota-info">
              <div className="quota-label">Storage</div>
              <div className="quota-bar">
                <div className="quota-used" style={{ width: `${Math.min(quotaPercent, 100)}%` }}></div>
              </div>
              <div className="quota-text">
                {formatBytes(quota.usedBytes)} / {quota.unlimited ? 'Unlimited' : formatBytes(quota.quotaBytes)}
              </div>
            </div>
          )}
          
          <div className="sync-status">
            <div className={`sync-dot ${syncing ? 'syncing' : ''}`}></div>
            {syncing ? 'Syncing...' : 'Synced'}
          </div>
        </div>
      </div>

      <div className="editor">
        {selectedId ? (
          <>
            <div className="editor-header">
              <input
                type="text"
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, TITLE_MAX))}
                placeholder="Note title"
              />
              <span className="char-count">{title.length} / {TITLE_MAX}</span>
            </div>
            <div className="editor-body">
              <textarea
                className="input"
                value={content}
                onChange={e => setContent(e.target.value.slice(0, CONTENT_MAX))}
                placeholder="Start writing..."
              />
              <div className="textarea-footer">
                <span className="char-count">{content.length} / {CONTENT_MAX}</span>
              </div>
            </div>
            <div className="editor-footer">
              <span className={`editor-status ${saving ? 'saving' : ''} ${saveError ? 'error' : ''}`}>
                {saving ? 'Saving...' : saveError ? saveError : 'All changes saved'}
              </span>
              <div className="editor-actions">
                <button className="btn btn-danger" onClick={deleteNote}>
                  Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-editor">
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  );
}
