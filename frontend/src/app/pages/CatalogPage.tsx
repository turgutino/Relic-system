import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, LayoutGrid, List } from 'lucide-react';
import type { Relic } from '@/models/relic';
import { normalizeRelic } from '@/models/relic';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { CompareStickyBar } from '@/app/components/CompareStickyBar';
import { getPaginationItems } from '@/app/components/ui/pagination';
import { useCompareSelection } from '@/app/context/CompareSelectionContext';

const PAGE_SIZE = 10;
const SORT_FIELDS = ['name', 'dynasty', 'date'] as const;

function parseSort(raw: string | null): 'name' | 'dynasty' | 'date' {
  const v = (raw || 'name').toLowerCase();
  if (v === 'period') return 'dynasty';
  return SORT_FIELDS.includes(v as (typeof SORT_FIELDS)[number]) ? (v as 'name' | 'dynasty' | 'date') : 'name';
}

type CatalogFetchError =
  | { type: 'http'; status: number }
  | { type: 'network' };

const panelStyle = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(10px)',
} as const;

const selectStyle =
  'w-full min-w-0 max-w-full rounded-xl px-3 py-2.5 text-sm bg-[var(--relic-input-bg)] border border-[var(--relic-border)] text-[var(--relic-text)] focus:outline-none focus:ring-1 focus:ring-[var(--relic-accent-bright)]';

export function CatalogPage() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language.startsWith('zh') ? 'zh-CN' : i18n.language.startsWith('az') ? 'az-AZ' : undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toggle, isSelected, selected: compareSelected } = useCompareSelection();

  const dynastyFilter = searchParams.get('dynasty') ?? '';
  const materialFilter = searchParams.get('material') ?? '';
  const museumFilter = searchParams.get('museum') ?? '';
  const committedSearch = searchParams.get('search') ?? '';
  const artistFilter = searchParams.get('artist') ?? '';
  const classificationFilter = searchParams.get('classification') ?? '';
  const dateFromFilter = searchParams.get('date_from') ?? '';
  const dateToFilter = searchParams.get('date_to') ?? '';

  const page = useMemo(
    () => Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
    [searchParams],
  );
  const viewIsList = searchParams.get('view') === 'list';
  const sortField = parseSort(searchParams.get('sort'));
  const sortOrder = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

  const [searchInput, setSearchInput] = useState(committedSearch);

  useEffect(() => {
    setSearchInput(committedSearch);
  }, [committedSearch]);

  const [relics, setRelics] = useState<Relic[]>([]);
  const [total, setTotal] = useState(0);
  const [dynastyOptions, setDynastyOptions] = useState<string[]>([]);
  const [materialOptions, setMaterialOptions] = useState<string[]>([]);
  const [museumOptions, setMuseumOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CatalogFetchError | null>(null);

  const [nlOpen, setNlOpen] = useState(false);
  const [nlQuery, setNlQuery] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);
  const [nlResults, setNlResults] = useState<Relic[] | null>(null);
  const [nlParsed, setNlParsed] = useState<Record<string, unknown> | null>(null);
  const [nlTotal, setNlTotal] = useState(0);
  const nlInputRef = useRef<HTMLInputElement>(null);

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
    (fn: (n: URLSearchParams) => void, replace = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          fn(next);
          return next;
        },
        { replace },
      );
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
    async (format: 'csv' | 'xlsx', filename: string) => {
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

  const fetchCatalog = useCallback(
    async (signal: AbortSignal | undefined) => {
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
          const normalized = list.map(normalizeRelic).filter(Boolean) as Relic[];
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
        const normalized = list.map(normalizeRelic).filter(Boolean) as Relic[];
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
      } catch (e: unknown) {
        const aborted =
          signal?.aborted ||
          (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'AbortError');
        if (aborted) return;
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

  const handleNlSearch = useCallback(async () => {
    if (!nlQuery.trim() || nlLoading) return;
    setNlLoading(true);
    setNlError(null);
    setNlResults(null);
    setNlParsed(null);
    try {
      const res = await fetch('/relics/query/natural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nlQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNlError(res.status === 503 ? 'AI search is not configured on this server (OPENAI_API_KEY missing).' : `Search failed (${res.status})`);
        return;
      }
      const list = Array.isArray(data.items) ? data.items : [];
      setNlResults(list.map(normalizeRelic).filter(Boolean) as Relic[]);
      setNlTotal(typeof data.total === 'number' ? data.total : list.length);
      setNlParsed(data.parsed_filters ?? null);
    } catch {
      setNlError('Network error. Please try again.');
    } finally {
      setNlLoading(false);
    }
  }, [nlQuery, nlLoading]);

  const openRelic = useCallback(
    (relicId: string | number) => {
      navigate(`/relics/${encodeURIComponent(String(relicId))}`, {
        state: { catalogSearch: location.search || '' },
      });
    },
    [navigate, location.search],
  );

  const hasFacetFilters = Boolean(dynastyFilter || materialFilter || museumFilter);
  const searchActive = Boolean(searchInput.trim());
  const advArtist = Boolean(artistFilter.trim());
  const advClass = Boolean(classificationFilter.trim());
  const advFrom = Boolean(dateFromFilter.trim());
  const advTo = Boolean(dateToFilter.trim());
  const hasAdvancedFilters = advArtist || advClass || advFrom || advTo;

  const dynastyOpts =
    dynastyFilter && !dynastyOptions.includes(dynastyFilter)
      ? [dynastyFilter, ...dynastyOptions]
      : dynastyOptions;
  const materialOpts =
    materialFilter && !materialOptions.includes(materialFilter)
      ? [materialFilter, ...materialOptions]
      : materialOptions;
  const museumOpts =
    museumFilter && !museumOptions.includes(museumFilter)
      ? [museumFilter, ...museumOptions]
      : museumOptions;

  const chipBtn =
    'text-xs underline text-[var(--relic-accent-bright)] hover:text-[var(--relic-gold-mid)] bg-transparent border-none cursor-pointer p-0';

  const compareBarPad = compareSelected.length >= 1 ? 'pb-40 md:pb-44 lg:pb-52' : 'pb-24 sm:pb-28';

  return (
    <div className={`pt-24 sm:pt-28 w-full min-w-0 max-w-[1600px] mx-auto px-3 sm:px-4 md:px-8 xl:px-10 bg-[var(--relic-page)] min-h-screen transition-colors ${compareBarPad}`}>
      <header className="mb-10">
        <h1
          className="mb-2"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 700,
            color: 'var(--relic-text)',
          }}
        >
          {t('catalogPage.title')}
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          {t('catalogPage.subtitle')}
        </p>
      </header>

      {nlOpen ? (
        <div
          className="mb-8 rounded-2xl overflow-hidden"
          style={{
            background: 'var(--relic-panel-bg)',
            border: '1px solid var(--relic-border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header bar */}
          <div
            className="flex flex-col items-start justify-between gap-3 px-4 py-4 border-b sm:flex-row sm:items-center sm:px-6"
            style={{ borderColor: 'var(--relic-border)' }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span style={{ fontSize: '1.1rem' }}>✦</span>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--relic-text)',
                }}
              >
                Ask AI — Natural Language Search
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setNlOpen(false); setNlResults(null); setNlError(null); }}
              className="text-[var(--relic-text-muted)] hover:text-[var(--relic-text)] text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Input area */}
          <div className="px-4 py-5 sm:px-6">
            <p
              className="mb-4 text-sm text-[var(--relic-text-muted)]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Describe what you're looking for in plain English. AI will extract filters and search the collection.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={nlInputRef}
                type="text"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNlSearch(); }}
                placeholder='e.g. "Tang dynasty bronze vessels" or "jade artifacts from London museums"'
                className={`min-w-0 flex-1 rounded-xl px-4 py-3 text-sm ${selectStyle}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleNlSearch}
                disabled={nlLoading || !nlQuery.trim()}
                className="w-full shrink-0 rounded-xl px-6 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 transition-opacity sm:w-auto"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: 'linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)',
                  color: 'var(--relic-btn-primary-fg)',
                }}
              >
                {nlLoading ? 'Searching…' : 'Search'}
              </button>
            </div>

            {/* Example queries */}
            {!nlResults && !nlLoading && !nlError ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Tang dynasty bronze vessels',
                  'Ming porcelain from London',
                  'jade artifacts before 1000 AD',
                  'silk paintings from Song dynasty',
                ].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => { setNlQuery(ex); }}
                    className="rounded-full px-3 py-1 text-xs border transition-colors hover:border-[var(--relic-accent-bright)] hover:text-[var(--relic-accent-bright)]"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      borderColor: 'var(--relic-border-muted)',
                      color: 'var(--relic-text-muted)',
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Loading state */}
            {nlLoading ? (
              <div className="mt-6 flex items-center gap-3 text-sm text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div
                  className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--relic-accent-bright)', borderTopColor: 'transparent' }}
                />
                AI is analyzing your query…
              </div>
            ) : null}

            {/* Error state */}
            {nlError ? (
              <div
                className="mt-4 rounded-xl px-4 py-3 text-sm"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: 'var(--relic-error-bg)',
                  color: 'var(--relic-error-text)',
                  border: '1px solid var(--relic-error-border)',
                }}
              >
                {nlError}
              </div>
            ) : null}

            {/* Parsed filters chips */}
            {nlParsed && !nlLoading ? (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Detected:
                </span>
                {Object.entries(nlParsed)
                  .filter(([, v]) => v !== null && v !== undefined && v !== '')
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        background: 'var(--relic-accent-muted-bg)',
                        border: '1px solid var(--relic-border-accent)',
                        color: 'var(--relic-accent-bright)',
                      }}
                    >
                      <span className="opacity-70">{k}:</span> {String(v)}
                    </span>
                  ))}
              </div>
            ) : null}

            {/* Results */}
            {nlResults && !nlLoading ? (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-sm text-[var(--relic-text-muted)]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {nlTotal} result{nlTotal !== 1 ? 's' : ''} found
                  </span>
                  <button
                    type="button"
                    onClick={() => { setNlResults(null); setNlParsed(null); setNlError(null); }}
                    className="text-xs underline text-[var(--relic-accent-bright)]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Clear results
                  </button>
                </div>

                {nlResults.length === 0 ? (
                  <p className="text-sm text-[var(--relic-text-muted)]" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }}>
                    No relics matched your query. Try rephrasing.
                  </p>
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {nlResults.map((relic) => (
                      <li key={relic.id}>
                        <button
                          type="button"
                          onClick={() => openRelic(relic.id)}
                          className="w-full text-left rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
                          style={{
                            background: 'var(--relic-card-grid)',
                            border: '1px solid var(--relic-card-grid-border)',
                          }}
                        >
                          <div className="h-36 overflow-hidden">
                            <ImageWithFallback
                              src={relic.image_url}
                              alt={relic.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <p
                              className="font-semibold line-clamp-2 mb-1"
                              style={{ fontFamily: "'Playfair Display', serif", color: 'var(--relic-text)', fontSize: '0.95rem' }}
                            >
                              {relic.name || t('catalogPage.untitled')}
                            </p>
                            <p
                              className="text-xs line-clamp-1"
                              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
                            >
                              {[relic.dynasty, relic.museum].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3 mb-8 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          className="flex w-full min-w-0 flex-col gap-2 min-[420px]:flex-row sm:flex-1 sm:min-w-[240px]"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            flushSearch();
          }}
        >
          <input
            type="search"
            placeholder={t('catalogPage.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`min-w-0 flex-1 rounded-full px-4 py-2.5 text-sm sm:px-5 ${selectStyle}`}
          />
          <button
            type="submit"
            className="w-full rounded-full px-6 py-2.5 text-sm font-medium min-[420px]:w-auto"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: 'linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)',
              color: 'var(--relic-btn-primary-fg)',
            }}
          >
            {t('home.searchSubmit')}
          </button>
        </form>

        <div className="flex w-full min-w-0 flex-wrap gap-2 items-center sm:w-auto sm:min-w-0">
          <button
            type="button"
            onClick={() =>
              mergeParams((n) => {
                n.delete('view');
              })}
            className={`rounded-full p-2.5 border ${!viewIsList ? 'border-[var(--relic-accent-bright)] text-[var(--relic-accent-bright)]' : 'border-[var(--relic-border-muted)] text-[var(--relic-text-muted)]'}`}
            aria-label={t('catalogPage.cardViewAria')}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            onClick={() =>
              mergeParams((n) => {
                n.set('view', 'list');
              })}
            className={`rounded-full p-2.5 border ${viewIsList ? 'border-[var(--relic-accent-bright)] text-[var(--relic-accent-bright)]' : 'border-[var(--relic-border-muted)] text-[var(--relic-text-muted)]'}`}
            aria-label={t('catalogPage.listViewAria')}
          >
            <List size={18} />
          </button>

          <label
            className="flex w-full min-w-[10rem] flex-col gap-1 text-xs text-[var(--relic-text-muted)] min-[480px]:w-auto min-[480px]:flex-row min-[480px]:items-center min-[480px]:gap-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t('catalogPage.sortShort')}
            <select
              value={sortField}
              onChange={(e) => {
                mergeParams((n) => {
                  n.set('sort', parseSort(e.target.value));
                  n.set('page', '1');
                });
              }}
              className={`rounded-xl px-2 py-2 min-[480px]:w-auto ${selectStyle}`}
            >
              <option value="name">{t('home.sortFieldName')}</option>
              <option value="dynasty">{t('home.sortFieldDynasty')}</option>
              <option value="date">{t('home.sortFieldDate')}</option>
            </select>
          </label>
          <select
            value={sortOrder}
            onChange={(e) => {
              mergeParams((n) => {
                n.set('order', e.target.value === 'desc' ? 'desc' : 'asc');
                n.set('page', '1');
              });
            }}
            className={`rounded-xl px-2 py-2 min-w-[7rem] ${selectStyle}`}
          >
            <option value="asc">{t('home.sortAscending')}</option>
            <option value="desc">{t('home.sortDescending')}</option>
          </select>

          <button
            type="button"
            onClick={() => runCatalogExport('csv', 'relics_export.csv')}
            className="rounded-full px-4 py-2 text-xs border border-[var(--relic-border-accent)] text-[var(--relic-text)] hover:border-[var(--relic-accent-bright)] whitespace-nowrap"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t('export.button')}
          </button>
          <button
            type="button"
            onClick={() => runCatalogExport('xlsx', 'relics_export.xlsx')}
            className="rounded-full px-4 py-2 text-xs border border-[var(--relic-border-accent)] text-[var(--relic-text)] hover:border-[var(--relic-accent-bright)] whitespace-nowrap"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t('export.buttonExcel')}
          </button>
          <button
            type="button"
            onClick={() => { setNlOpen(o => !o); setNlResults(null); setNlError(null); setNlQuery(''); }}
            className="rounded-full px-4 py-2 text-xs font-medium border transition-all whitespace-nowrap"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: nlOpen ? 'linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)' : 'transparent',
              color: nlOpen ? 'var(--relic-btn-primary-fg)' : 'var(--relic-accent-bright)',
              borderColor: 'var(--relic-accent-bright)',
            }}
          >
            ✦ Ask AI
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAdvancedPanelOpen((o) => !o)}
        className="mb-4 text-sm text-[var(--relic-accent-bright)] underline-offset-4 hover:underline"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {advancedPanelOpen ? t('catalogPage.advancedHide') : t('catalogPage.advancedShow')}
      </button>

      {advancedPanelOpen ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl mb-8" style={panelStyle}>
          <label className="flex flex-col gap-1 text-xs text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t('catalogPage.facetArtistLabel')}
            <input
              value={artistFilter}
              onChange={(e) => {
                const v = e.target.value;
                mergeParams((n) => {
                  const t = v.trim();
                  if (t) n.set('artist', t);
                  else n.delete('artist');
                  n.set('page', '1');
                });
              }}
              className={`rounded-xl px-3 py-2 ${selectStyle}`}
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t('catalogPage.facetClassificationLabel')}
            <input
              value={classificationFilter}
              onChange={(e) =>
                mergeParams((n) => {
                  const t = e.target.value.trim();
                  if (t) n.set('classification', t);
                  else n.delete('classification');
                  n.set('page', '1');
                })}
              className={`rounded-xl px-3 py-2 ${selectStyle}`}
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t('catalogPage.facetYearFrom')}
            <input
              type="number"
              value={dateFromFilter}
              onChange={(e) =>
                mergeParams((n) => {
                  const t = e.target.value.trim();
                  if (t) n.set('date_from', t);
                  else n.delete('date_from');
                  n.set('page', '1');
                })}
              className={`rounded-xl px-3 py-2 ${selectStyle}`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t('catalogPage.facetYearTo')}
            <input
              type="number"
              value={dateToFilter}
              onChange={(e) =>
                mergeParams((n) => {
                  const t = e.target.value.trim();
                  if (t) n.set('date_to', t);
                  else n.delete('date_to');
                  n.set('page', '1');
                })}
              className={`rounded-xl px-3 py-2 ${selectStyle}`}
            />
          </label>
        </div>
      ) : null}

      {(hasFacetFilters || searchActive || hasAdvancedFilters) && (
        <div className="flex min-w-0 flex-wrap gap-2 items-center mb-8 p-4 rounded-2xl text-sm" style={panelStyle}>
          <span className="text-[var(--relic-text-muted)] mr-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t('home.applied')}
          </span>
          {dynastyFilter ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--relic-chip-bg)] border border-[var(--relic-border)] text-[var(--relic-text)]">
              {t('home.chipDynasty', { value: dynastyFilter })}
              <button
                type="button"
                className={chipBtn}
                onClick={() =>
                  mergeParams((n) => {
                    n.delete('dynasty');
                    n.set('page', '1');
                  })}
              >
                {t('catalogPage.chipClear')}
              </button>
            </span>
          ) : null}
          {materialFilter ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--relic-chip-bg)] border border-[var(--relic-border)] text-[var(--relic-text)]">
              {t('home.chipMaterial', { value: materialFilter })}
              <button
                type="button"
                className={chipBtn}
                onClick={() =>
                  mergeParams((n) => {
                    n.delete('material');
                    n.set('page', '1');
                  })}
              >
                {t('catalogPage.chipClear')}
              </button>
            </span>
          ) : null}
          {museumFilter ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--relic-chip-bg)] border border-[var(--relic-border)] text-[var(--relic-text)]">
              {t('home.chipMuseum', { value: museumFilter })}
              <button
                type="button"
                className={chipBtn}
                onClick={() =>
                  mergeParams((n) => {
                    n.delete('museum');
                    n.set('page', '1');
                  })}
              >
                {t('catalogPage.chipClear')}
              </button>
            </span>
          ) : null}
          {searchActive ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--relic-chip-bg)] border border-[var(--relic-border)] text-[var(--relic-text)]">
              {t('home.chipSearch', { value: searchInput.trim() })}
              <button type="button" className={chipBtn} onClick={clearSearchOnly}>
                {t('catalogPage.chipClear')}
              </button>
            </span>
          ) : null}
          {advArtist ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--relic-chip-bg)] border border-[var(--relic-border)] text-[var(--relic-text)]">
              {t('catalogPage.chipArtist', { value: artistFilter.trim() })}
              <button
                type="button"
                className={chipBtn}
                onClick={() =>
                  mergeParams((n) => {
                    n.delete('artist');
                    n.set('page', '1');
                  })}
              >
                {t('catalogPage.chipClear')}
              </button>
            </span>
          ) : null}
          {advClass ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--relic-chip-bg)] border border-[var(--relic-border)] text-[var(--relic-text)]">
              {t('catalogPage.chipClass', { value: classificationFilter.trim() })}
              <button
                type="button"
                className={chipBtn}
                onClick={() =>
                  mergeParams((n) => {
                    n.delete('classification');
                    n.set('page', '1');
                  })}
              >
                {t('catalogPage.chipClear')}
              </button>
            </span>
          ) : null}
          {advFrom ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--relic-chip-bg)] border border-[var(--relic-border)] text-[var(--relic-text)]">
              {t('catalogPage.chipFrom', { value: dateFromFilter.trim() })}
              <button
                type="button"
                className={chipBtn}
                onClick={() =>
                  mergeParams((n) => {
                    n.delete('date_from');
                    n.set('page', '1');
                  })}
              >
                {t('catalogPage.chipClear')}
              </button>
            </span>
          ) : null}
          {advTo ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--relic-chip-bg)] border border-[var(--relic-border)] text-[var(--relic-text)]">
              {t('catalogPage.chipTo', { value: dateToFilter.trim() })}
              <button
                type="button"
                className={chipBtn}
                onClick={() =>
                  mergeParams((n) => {
                    n.delete('date_to');
                    n.set('page', '1');
                  })}
              >
                {t('catalogPage.chipClear')}
              </button>
            </span>
          ) : null}
          <button
            type="button"
            onClick={clearSearchAndFilters}
            className="w-full rounded-full px-4 py-1.5 text-xs border border-[var(--relic-border-accent)] text-[var(--relic-text)] sm:ml-auto sm:w-auto"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t('home.clearAll')}
          </button>
          {hasFacetFilters ? (
            <button
              type="button"
              onClick={clearFacetFilters}
              className="w-full rounded-full px-4 py-1.5 text-xs border border-[var(--relic-border-muted)] text-[var(--relic-text-muted)] sm:w-auto"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {t('home.clearFacetsOnly')}
            </button>
          ) : null}
        </div>
      )}

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-10 items-start">
        <aside className="rounded-2xl p-4 sm:p-5 lg:sticky lg:top-28 min-w-0" style={panelStyle}>
          <h3 className="mb-4 text-[var(--relic-text)]" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>
            {t('filters.title')}
          </h3>
          <div className="space-y-4">
            <label className="block text-xs text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('filters.dynasty')}
              <select
                value={dynastyFilter}
                onChange={(e) =>
                  mergeParams((n) => {
                    const v = e.target.value;
                    if (v) n.set('dynasty', v);
                    else n.delete('dynasty');
                    n.set('page', '1');
                  })}
                className={`mt-1 ${selectStyle}`}
              >
                <option value="">{t('filters.allPeriods')}</option>
                {dynastyOpts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('filters.material')}
              <select
                value={materialFilter}
                onChange={(e) =>
                  mergeParams((n) => {
                    const v = e.target.value;
                    if (v) n.set('material', v);
                    else n.delete('material');
                    n.set('page', '1');
                  })}
                className={`mt-1 ${selectStyle}`}
              >
                <option value="">{t('filters.allMaterials')}</option>
                {materialOpts.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('filters.museum')}
              <select
                value={museumFilter}
                onChange={(e) =>
                  mergeParams((n) => {
                    const v = e.target.value;
                    if (v) n.set('museum', v);
                    else n.delete('museum');
                    n.set('page', '1');
                  })}
                className={`mt-1 ${selectStyle}`}
              >
                <option value="">{t('filters.allMuseums')}</option>
                {museumOpts.map((mu) => (
                  <option key={mu} value={mu}>
                    {mu}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>

        <section className="min-w-0">
          {loading ? (
            <p className="text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('catalogPage.loadingCollection')}
            </p>
          ) : null}

          {error ? (
            <div className="rounded-2xl p-6 mb-6 border border-[var(--relic-error-border)] bg-[var(--relic-error-bg)] text-[var(--relic-error-text)]" role="alert">
              <p className="mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                {error.type === 'http'
                  ? t('errors.catalog.http', { status: error.status })
                  : t('catalogPage.networkErrorCatalog')}
              </p>
              <button
                type="button"
                onClick={retryCatalog}
                className="rounded-full px-5 py-2 text-sm bg-[var(--relic-accent-bright)] text-[var(--relic-btn-primary-fg)]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {t('home.retry')}
              </button>
            </div>
          ) : null}

          {!loading && !error && relics.length === 0 ? (
            <p className="text-[var(--relic-text-muted)]" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem' }}>
              {t('catalogPage.emptyFiltered')}
            </p>
          ) : null}

          {!loading && !error && !viewIsList ? (
            <ul className="grid min-w-0 gap-5 sm:gap-6 md:gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {relics.map((relic) => {
                const sel = isSelected(relic.id);
                const addBlocked = !sel && compareSelected.length >= 3;
                return (
                  <li key={relic.id} className="min-w-0">
                    <div
                      className="rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-2"
                      style={{
                        background: 'var(--relic-card-grid)',
                        border: '1px solid var(--relic-card-grid-border)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1">
                        <label
                          className={`flex cursor-pointer items-center gap-2 text-xs ${addBlocked ? 'cursor-not-allowed opacity-60' : ''}`}
                          style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={sel}
                            disabled={addBlocked}
                            aria-label={t('compare.checkboxAria')}
                            onChange={() =>
                              toggle({
                                id: relic.id,
                                name: relic.name || '',
                                image_url: relic.image_url,
                              })
                            }
                            className="size-4 shrink-0 rounded border-[var(--relic-border)] accent-[var(--relic-accent-bright)]"
                          />
                          <span>{t('compare.addToggle')}</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => openRelic(relic.id)}
                        className="w-full cursor-pointer text-left"
                      >
                        <div className="relative h-44 overflow-hidden sm:h-52">
                          <ImageWithFallback
                            src={relic.image_url}
                            alt={relic.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-5">
                          <h3
                            className="mb-2 line-clamp-2"
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: '1.2rem',
                              color: 'var(--relic-text)',
                            }}
                          >
                            {relic.name || t('catalogPage.untitled')}
                          </h3>
                          <div className="flex items-start gap-2 text-sm text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--relic-accent-bright)]" />
                            <span className="line-clamp-2">{relic.museum || '—'}</span>
                          </div>
                          <p className="mt-2 text-xs text-[var(--relic-text-subtle)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {[relic.dynasty, relic.material].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {!loading && !error && viewIsList ? (
            <ul className="space-y-3">
              {relics.map((relic) => {
                const sel = isSelected(relic.id);
                const addBlocked = !sel && compareSelected.length >= 3;
                return (
                  <li key={relic.id} className="min-w-0">
                    <div
                      className="flex min-w-0 flex-col gap-3 rounded-2xl p-2 transition-colors hover:bg-[var(--relic-interactive-hover)] min-[460px]:flex-row"
                      style={{
                        background: 'var(--relic-panel-bg-soft)',
                        border: '1px solid var(--relic-card-grid-border)',
                      }}
                    >
                      <label
                        className={`flex shrink-0 cursor-pointer flex-col items-center justify-center px-2 ${addBlocked ? 'cursor-not-allowed opacity-60' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          disabled={addBlocked}
                          aria-label={t('compare.checkboxAria')}
                          onChange={() =>
                            toggle({
                              id: relic.id,
                              name: relic.name || '',
                              image_url: relic.image_url,
                            })
                          }
                          className="size-4 rounded border-[var(--relic-border)] accent-[var(--relic-accent-bright)]"
                        />
                        <span className="mt-1 max-w-[4rem] text-center text-[10px] leading-tight text-[var(--relic-text-subtle)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {t('compare.addToggle')}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => openRelic(relic.id)}
                        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-3 rounded-xl p-2 text-left min-[460px]:flex-row min-[460px]:gap-4"
                      >
                        <div className="h-36 w-full shrink-0 overflow-hidden rounded-xl min-[460px]:h-20 min-[460px]:w-20">
                          <ImageWithFallback src={relic.image_url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-[var(--relic-text)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {relic.name || t('catalogPage.untitled')}
                          </div>
                          <div className="truncate text-sm text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {relic.dynasty} · {relic.museum}
                          </div>
                          <div className="text-xs text-[var(--relic-text-subtle)] break-words" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {relic.material}
                          </div>
                        </div>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {!loading && !error && totalPages > 1 ? (
            <nav
              className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between sm:gap-4"
              aria-label={t('home.paginationAria')}
            >
              <span className="text-sm text-[var(--relic-text-muted)] shrink-0" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('catalogPage.paginationPageItems', {
                  page,
                  totalPages,
                  total: total.toLocaleString(numberLocale),
                })}
              </span>
              <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {getPaginationItems(page, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="flex min-w-[2.25rem] select-none items-center justify-center px-1 text-sm text-[var(--relic-text-subtle)]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        mergeParams((n) => {
                          n.set('page', String(Math.max(1, item)));
                        })}
                      className={`min-w-[2.25rem] shrink-0 rounded-full px-3 py-1.5 text-sm border ${
                        item === page
                          ? 'border-[var(--relic-accent-bright)] text-[var(--relic-accent-bright)] bg-[var(--relic-accent-muted-bg)]'
                          : 'border-[var(--relic-border-muted)] text-[var(--relic-text-muted)] hover:border-[var(--relic-accent-bright)]/40'
                      }`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      aria-current={item === page ? 'page' : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </nav>
          ) : null}
        </section>
      </div>

      <CompareStickyBar />
    </div>
  );
}
