import { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [short, setShort] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function shorten(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const res = await fetch('/api/v1/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setShort('');
        setError(data.error?.message || 'Something went wrong. Try again.');
        return;
      }
      setShort(data.shortUrl);
    } catch {
      setShort('');
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!short) return;
    try {
      await navigator.clipboard.writeText(short);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the field selects on focus so the user can copy manually */
    }
  }

  return (
    <main className="window">
      {/* ── Title bar with CHOTO and green square ── */}
      <header className="titlebar">
        <h1>CHOTO</h1>
        <div className="titlebar-square" aria-hidden="true" />
      </header>

      {/* ── Window Body ── */}
      <div className="window-body">
        {/* Top Field: Long URL */}
        <form onSubmit={shorten} className="field-group">
          <label htmlFor="long-url" className="field-label">
            PASTE YOUR URL HERE :
          </label>
          <div className="terminal-box">
            <input
              id="long-url"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoFocus
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="submit"
              className="btn-action"
              disabled={busy || !url.trim()}
              aria-label="Shorten URL"
            >
              {busy ? (
                <span className="spinner">
                  <span /><span /><span />
                </span>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <line x1="3" y1="12" x2="20" y2="12" />
                  <polyline points="14 6 20 12 14 18" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        <p className="error-msg" role="alert">{error}</p>

        {/* Bottom Field: Shortened URL */}
        <div className="field-group">
          <label htmlFor="short-url" className="field-label">
            SHORTENED URL :
          </label>
          <div className="terminal-box">
            <input
              id="short-url"
              type="text"
              readOnly
              placeholder="https://choto/xxxx"
              value={short}
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              className="btn-action"
              onClick={copy}
              disabled={!short}
              aria-label={copied ? 'Copied to clipboard' : 'Copy shortened link'}
            >
              {copied ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 8V4H4v12h4" />
                  <rect x="8" y="8" width="12" height="12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
