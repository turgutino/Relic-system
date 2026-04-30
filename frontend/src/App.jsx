import { useCallback, useEffect, useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import { normalizeRelic } from './models/relic.js';
import './App.css';

/**
 * Fetches paginated `/relics` from the FastAPI backend (Vite dev proxy → :8000).
 */
const PAGE_SIZE = 10;

export default function App() {
  const [relics, setRelics] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dynastyFilter, setDynastyFilter] = useState('');
  const [dynastyOptions, setDynastyOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = search.trim();
      setDebouncedSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 400);
    return () => window.clearTimeout(id);
  }, [search]);

  const flushSearch = useCallback(() => {
    const next = search.trim();
    setDebouncedSearch(next);
    setPage(1);
  }, [search]);

  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const fetchRelics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (dynastyFilter) params.set('dynasty', dynastyFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/relics?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.items) ? data.items : [];
      const normalized = list.map(normalizeRelic).filter(Boolean);
      setRelics(normalized);
      setTotal(typeof data.total === 'number' ? data.total : normalized.length);
      if (!dynastyFilter && !debouncedSearch && Array.isArray(data.dynasties)) {
        setDynastyOptions(data.dynasties.filter(Boolean));
      }
    } catch (e) {
      setError(e.message || 'Failed to load relics');
      setRelics([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [dynastyFilter, debouncedSearch, page]);

  useEffect(() => {
    fetchRelics();
  }, [fetchRelics]);

  return (
    <HomePage
      relics={relics}
      total={total}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      dynasties={dynastyOptions}
      dynastyFilter={dynastyFilter}
      onDynastyChange={(v) => {
        setPage(1);
        setDynastyFilter(v);
      }}
      search={search}
      onSearchChange={setSearch}
      onSearchSubmit={flushSearch}
      loading={loading}
      error={error}
      onRetry={fetchRelics}
    />
  );
}
