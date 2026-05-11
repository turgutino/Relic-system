import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DocumentLang from './components/DocumentLang.jsx';
import HomePage from './pages/HomePage.jsx';
import RelicDetailPage from './pages/RelicDetailPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import { normalizeRelic } from './models/relic.js';
import './App.css';

/** @typedef {'name' | 'dynasty' | 'date'} SortField */

const PAGE_SIZE = 10;

const SORT_FIELDS = /** @type {const} */ (['name', 'dynasty', 'date']);

function parseSort(raw) {
  const v = (raw || 'name').toLowerCase();
  if (v === 'period') return 'dynasty';
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
  const artistFilter = searchParams.get('artist') ?? '';
  const classificationFilter = searchParams.get('classification') ?? '';
  const dateFromFilter = searchParams.get('date_from') ?? '';
  const dateToFilter = searchParams.get('date_to') ?? '';
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

  const advancedFieldsActive = Boolean(
    artistFilter.trim()
      || classificationFilter.trim()
      || dateFromFilter.trim()
      || dateToFilter.trim(),
  );
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(advancedFieldsActive);

  useEffect(() => {
    if (advancedFieldsActive) setAdvancedPanelOpen(true);
  }, [advancedFieldsActive]);

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
    setAdvancedPanelOpen(false);
  }, [searchParams, setSearchParams]);

  const runCatalogExport = useCallback(
    /** @param {'csv' | 'xlsx'} format */
    async (format, filename) => {
      const params = new URLSearchParams();
      params.set('format', format);
      if (dynastyFilter) params.set('dynasty', dynastyFilter);
      if (materialFilter) params.set('material', materialFilter);
      if (museumFilter) params.set('museum', museumFilter);
      if (committedSearch.trim()) params.set('search', committedSearch.trim());
      params.set('sort', sortField);
      params.set('order', sortOrder);
      try {
        const res = await fetch(`/relics/export?${params.toString()}`);
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    },
    [dynastyFilter, materialFilter, museumFilter, committedSearch, sortField, sortOrder],
  );

  const exportCatalogCsv = useCallback(() => {
    runCatalogExport('csv', 'relics_export.csv');
  }, [runCatalogExport]);

  const exportCatalogXlsx = useCallback(() => {
    runCatalogExport('xlsx', 'relics_export.xlsx');
  }, [runCatalogExport]);

  const fetchCatalog = useCallback(
    /** @param {AbortSignal | undefined} signal */
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        if (advancedFieldsActive) {
          const params = new URLSearchParams();
          params.set('page', String(Math.max(1, page)));
          params.set('limit', String(PAGE_SIZE));
          const qSearch = committedSearch.trim();
          if (qSearch) params.set('name', qSearch);
          if (museumFilter) params.set('museum', museumFilter);
          if (dynastyFilter) params.set('dynasty', dynastyFilter);
          if (materialFilter) params.set('material', materialFilter);
          const art = artistFilter.trim();
          if (art) params.set('artist', art);
          const cls = classificationFilter.trim();
          if (cls) params.set('classification', cls);
          const df = parseInt(dateFromFilter, 10);
          if (Number.isFinite(df)) params.set('date_from', String(df));
          const dt = parseInt(dateToFilter, 10);
          if (Number.isFinite(dt)) params.set('date_to', String(dt));
          params.set('sort', sortField);
          params.set('order', sortOrder);

          const res = await fetch(`/relics/search/advanced?${params.toString()}`, {
            signal,
          });
          if (signal?.aborted) return;
          if (!res.ok) {
            setRelics([]);
            setTotal(0);
            setError({ type: 'http', status: res.status });
            return;
          }
          const data = await res.json();
          if (signal?.aborted) return;
          const list = Array.isArray(data.items) ? data.items : [];
          const normalized = list.map(normalizeRelic).filter(Boolean);
          setRelics(normalized);
          setTotal(typeof data.total === 'number' ? data.total : normalized.length);
          return;
        }

        const params = new URLSearchParams();
        params.set('page', String(Math.max(1, page)));
        params.set('limit', String(PAGE_SIZE));
        if (dynastyFilter) params.set('dynasty', dynastyFilter);
        if (materialFilter) params.set('material', materialFilter);
        if (museumFilter) params.set('museum', museumFilter);
        const qCatalog = committedSearch.trim();
        if (qCatalog) params.set('search', qCatalog);
        params.set('sort', sortField);
        params.set('order', sortOrder);
        const res = await fetch(`/relics?${params.toString()}`, { signal });
        if (signal?.aborted) return;
        if (!res.ok) {
          setRelics([]);
          setTotal(0);
          setDynastyOptions([]);
          setMaterialOptions([]);
          setMuseumOptions([]);
          setError({ type: 'http', status: res.status });
          return;
        }
        const data = await res.json();
        if (signal?.aborted) return;
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
        if (
          signal?.aborted ||
          (e && typeof e === 'object' && 'name' in e && /** @type {{ name?: string }} */ (e).name === 'AbortError')
        ) {
          return;
        }
        setError({ type: 'network' });
        setRelics([]);
        setTotal(0);
      } finally {
        if (!signal || !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      advancedFieldsActive,
      artistFilter,
      classificationFilter,
      dateFromFilter,
      dateToFilter,
      dynastyFilter,
      materialFilter,
      museumFilter,
      committedSearch,
      page,
      sortField,
      sortOrder,
    ],
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchCatalog(ac.signal);
    return () => ac.abort();
  }, [fetchCatalog]);

  /** Load facet option lists while advanced search is active (`GET /relics` does not drive the grid). */
  useEffect(() => {
    if (!advancedFieldsActive) return undefined;
    const ac = new AbortController();
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '1');
    if (dynastyFilter) params.set('dynasty', dynastyFilter);
    if (materialFilter) params.set('material', materialFilter);
    if (museumFilter) params.set('museum', museumFilter);
    const q = committedSearch.trim();
    if (q) params.set('search', q);

    fetch(`/relics?${params.toString()}`, { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || ac.signal.aborted) return;
        if (Array.isArray(data.dynasties)) {
          setDynastyOptions(data.dynasties.filter(Boolean));
        }
        if (Array.isArray(data.materials)) {
          setMaterialOptions(data.materials.filter(Boolean));
        }
        if (Array.isArray(data.museums)) {
          setMuseumOptions(data.museums.filter(Boolean));
        }
      })
      .catch(() => {});
    return () => ac.abort();
  }, [advancedFieldsActive, dynastyFilter, materialFilter, museumFilter, committedSearch]);

  const retryCatalog = useCallback(() => {
    fetchCatalog(undefined);
  }, [fetchCatalog]);

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
      onRetry={retryCatalog}
      onClearFacetFilters={clearFacetFilters}
      onClearSearch={clearSearchOnly}
      onClearSearchAndFilters={clearSearchAndFilters}
      onOpenRelic={openRelic}
      advancedPanelOpen={advancedPanelOpen}
      onAdvancedPanelToggle={() => setAdvancedPanelOpen((o) => !o)}
      artistFilter={artistFilter}
      classificationFilter={classificationFilter}
      dateFromFilter={dateFromFilter}
      dateToFilter={dateToFilter}
      onArtistChange={(v) => {
        mergeParams((n) => {
          const t = v.trim();
          if (t) n.set('artist', t);
          else n.delete('artist');
          n.set('page', '1');
        });
      }}
      onClassificationChange={(v) => {
        mergeParams((n) => {
          const t = v.trim();
          if (t) n.set('classification', t);
          else n.delete('classification');
          n.set('page', '1');
        });
      }}
      onDateFromChange={(v) => {
        mergeParams((n) => {
          const t = v.trim();
          if (t) n.set('date_from', t);
          else n.delete('date_from');
          n.set('page', '1');
        });
      }}
      onDateToChange={(v) => {
        mergeParams((n) => {
          const t = v.trim();
          if (t) n.set('date_to', t);
          else n.delete('date_to');
          n.set('page', '1');
        });
      }}
      onExportCsv={exportCatalogCsv}
      onExportXlsx={exportCatalogXlsx}
    />
  );
}

export default function App() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentLang />
      <nav className="app-nav" aria-label={t('nav.ariaLabel')}>
        <div className="app-nav__inner">
          <NavLink className="app-nav__link" to="/" end>
            {t('nav.catalog')}
          </NavLink>
          <NavLink className="app-nav__link" to="/stats">
            {t('nav.stats')}
          </NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<CatalogView />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/relics/:id" element={<RelicDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
