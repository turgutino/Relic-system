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

/** @typedef {'name' | 'dynasty' | 'period'} SortField */

const PAGE_SIZE = 10;

const SORT_FIELDS = /** @type {const} */ (['name', 'dynasty', 'period']);

function parseSort(raw) {
  const v = (raw || 'name').toLowerCase();
  return SORT_FIELDS.includes(v) ? v : 'name';
}

function CatalogView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const dynastyFilter = searchParams.get('dynasty') ?? '';
  const materialFilter = searchParams.get('material') ?? '';
  const museumFilter = searchParams.get('museum') ?? '';
  const committedSearch = searchParams.get('search') ?? '';
  const page = useMemo(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1), [searchParams]);
  const viewIsList = searchParams.get('view') === 'list';
  const sortField = parseSort(searchParams.get('sort'));
  const sortOrder = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

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
    const keep = new URLSearchParams();
    if (searchParams.get('view')) keep.set('view', searchParams.get('view') || '');
    if (searchParams.get('sort')) keep.set('sort', searchParams.get('sort') || '');
    if (searchParams.get('order')) keep.set('order', searchParams.get('order') || '');
    setSearchParams(keep, { replace: true });
    setSearchInput('');
  }, [searchParams, setSearchParams]);

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
      params.set('sort', sortField);
      params.set('order', sortOrder);
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
  }, [dynastyFilter, materialFilter, museumFilter, committedSearch, page, sortField, sortOrder]);

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

  const setViewList = useCallback(
    (list) => {
      mergeParams((n) => {
        if (list) n.set('view', 'list');
        else n.delete('view');
      });
    },
    [mergeParams],
  );

  const setSortField = useCallback(
    (field) => {
      const f = parseSort(field);
      mergeParams((n) => {
        n.set('sort', f);
        n.set('page', '1');
      });
    },
    [mergeParams],
  );

  const setSortOrder = useCallback(
    (ord) => {
      mergeParams((n) => {
        n.set('order', ord === 'desc' ? 'desc' : 'asc');
        n.set('page', '1');
      });
    },
    [mergeParams],
  );

  return (
    <HomePage
      relics={relics}
      total={total}
      page={page}
      totalPages={totalPages}
      onPageChange={setCatalogPage}
      viewIsList={viewIsList}
      onViewChange={setViewList}
      sortField={sortField}
      sortOrder={sortOrder}
      onSortFieldChange={setSortField}
      onSortOrderChange={setSortOrder}
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
