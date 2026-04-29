import { useCallback, useEffect, useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import { normalizeRelic } from './models/relic.js';
import './App.css';

/**
 * Fetches `/relics` from the FastAPI backend (Vite dev proxy → :8000).
 * Neo4j extension: when the API adds fields, normalization in `models/relic.js` picks them up.
 */
export default function App() {
  const [relics, setRelics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRelics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/relics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setRelics(list.map(normalizeRelic).filter(Boolean));
    } catch (e) {
      setError(e.message || 'Failed to load relics');
      setRelics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelics();
  }, [fetchRelics]);

  return (
    <HomePage
      relics={relics}
      loading={loading}
      error={error}
      onRetry={fetchRelics}
    />
  );
}
