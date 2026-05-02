import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import RelicDetailPage from './pages/RelicDetailPage.jsx';
import { normalizeRelic } from './models/relic.js';
import './App.css';

/**
 * Fetches paginated `/relics` from the FastAPI backend (Vite dev proxy → :8000).
 * Catalog filters + page live in URL query (?search=&dynasty=&material=&museum=&page=).
 */
const PAGE_SIZE = 10;

function CatalogView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const dynastyFilter = searchParams.get('dynasty') ?? '';
  const materialFilter = searchParams.get('material') ?? '';
  const museumFilter = searchParams.get('museum') ?? '';
  const committedSearch = searchParams.get('search') ?? '';
  const page = useMemo(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1), [searchParams]);

  const [searchInput, setSearchInput] = useState(committedSearch);

  useEffect(() => {
    setSearchInput(committedSearch);
  }, [committedSearch]);

  const [relics, setRelics] = useState([]);
  const [total, setTotal] = useState(0);
  const [dynastyOptions, setDynastyOptions] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [museumOptions, setMuseumOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mergeParams = useCallback(
    /** @param {(n: URLSearchParams) => void} fn */
    (fn, replace = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        fn(next);
        return next;
      }, { replace });
    },
    [setSearchParams],
  );

  /** Debounced URL update for search (matches prior API behavior). */
  useEffect(() => {
    const tid = window.setTimeout(() => {
      const next = searchInput.trim();
      const prev = committedSearch.trim();
      if (next === prev) return;
      mergeParams((n) => {
        if (next) n.set('search', next);
        else n.delete('search');
        n.set('page', '1');
      });
    }, 400);
    return () => window.clearTimeout(tid);
  }, [searchInput, committedSearch, mergeParams]);

  const flushSearch = useCallback(() => {
    const next = searchInput.trim();
    mergeParams((n) => {
      if (next) n.set('search', next);
      else n.delete('search');
      n.set('page', '1');
    });
  }, [searchInput, mergeParams]);

  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  useEffect(() => {
    if (page <= totalPages) return;
    mergeParams((n) => {
      n.set('page', String(Math.max(1, totalPages)));
    });
  }, [page, totalPages, mergeParams]);

  const clearFacetFilters = useCallback(() => {
    mergeParams((n) => {
      n.delete('dynasty');
      n.delete('material');
      n.delete('museum');
      n.set('page', '1');
    });
  }, [mergeParams]);

  const clearSearchOnly = useCallback(() => {
    setSearchInput('');
    mergeParams((n) => {
      n.delete('search');
      n.set('page', '1');
    });
  }, [mergeParams]);

  const clearSearchAndFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setSearchInput('');
  }, [setSearchParams]);

  const fetchRelics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(Math.max(1, page)));
      params.set('limit', String(PAGE_SIZE));
      if (dynastyFilter) params.set('dynasty', dynastyFilter);
      if (materialFilter) params.set('material', materialFilter);
      if (museumFilter) params.set('museum', museumFilter);
      if (committedSearch) params.set('search', committedSearch);
      const res = await fetch(`/relics?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.items) ? data.items : [];
      const normalized = list.map(normalizeRelic).filter(Boolean);
      setRelics(normalized);
      setTotal(typeof data.total === 'number' ? data.total : normalized.length);
      if (Array.isArray(data.dynasties)) {
        setDynastyOptions(data.dynasties.filter(Boolean));
      }
      if (Array.isArray(data.materials)) {
        setMaterialOptions(data.materials.filter(Boolean));
      }
      if (Array.isArray(data.museums)) {
        setMuseumOptions(data.museums.filter(Boolean));
      }
    } catch (e) {
      setError(e.message || 'Failed to load relics');
      setRelics([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [dynastyFilter, materialFilter, museumFilter, committedSearch, page]);

  useEffect(() => {
    fetchRelics();
  }, [fetchRelics]);

  const openRelic = useCallback(
    (relicId) => {
      navigate(`/relics/${encodeURIComponent(String(relicId))}`, {
        state: { catalogSearch: location.search || '' },
      });
    },
    [navigate, location.search],
  );

  const setCatalogPage = useCallback((p) => {
    mergeParams((n) => {
      n.set('page', String(Math.max(1, p)));
    });
  }, [mergeParams]);

  return (
    <HomePage
      relics={relics}
      total={total}
      page={page}
      totalPages={totalPages}
      onPageChange={setCatalogPage}
      dynasties={dynastyOptions}
      dynastyFilter={dynastyFilter}
      onDynastyChange={(v) => {
        mergeParams((n) => {
          if (v) n.set('dynasty', v);
          else n.delete('dynasty');
          n.set('page', '1');
        });
      }}
      materials={materialOptions}
      materialFilter={materialFilter}
      onMaterialChange={(v) => {
        mergeParams((n) => {
          if (v) n.set('material', v);
          else n.delete('material');
          n.set('page', '1');
        });
      }}
      museums={museumOptions}
      museumFilter={museumFilter}
      onMuseumChange={(v) => {
        mergeParams((n) => {
          if (v) n.set('museum', v);
          else n.delete('museum');
          n.set('page', '1');
        });
      }}
      search={searchInput}
      onSearchChange={setSearchInput}
      onSearchSubmit={flushSearch}
      loading={loading}
      error={error}
      onRetry={fetchRelics}
      onClearFacetFilters={clearFacetFilters}
      onClearSearch={clearSearchOnly}
      onClearSearchAndFilters={clearSearchAndFilters}
      onOpenRelic={openRelic}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogView />} />
      <Route path="/relics/:id" element={<RelicDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
