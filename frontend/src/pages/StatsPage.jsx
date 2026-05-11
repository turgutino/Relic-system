import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import './StatsPage.css';

/**
 * @typedef {{ museum: string, count: number }} MuseumBucket
 * @typedef {{ dynasty: string, count: number }} DynastyBucket
 * @typedef {{ material: string, count: number }} MaterialBucket
 * @typedef {{
 *   total_relics: number,
 *   total_museums: number,
 *   total_dynasties: number,
 *   total_materials: number,
 *   by_museum: MuseumBucket[],
 *   by_dynasty: DynastyBucket[],
 *   by_material: MaterialBucket[],
 * }} StatsPayload
 */

const PIE_COLORS = [
  '#78350f',
  '#92400e',
  '#b45309',
  '#ca8a04',
  '#a16207',
  '#57534e',
  '#78716c',
  '#44403c',
  '#9a3412',
  '#c2410c',
];

const formatDynasty = (name) => {
  const shortened = String(name ?? '')
    .replace(/^China,\s*/i, '')
    .replace(/\s*\(\d+.*\)/, '')
    .trim();
  if (shortened.length <= 20) return shortened;
  return `${shortened.slice(0, 17)}...`;
};

/** @param {unknown} v */
function num(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** @param {unknown} data */
function normalizeStatsPayload(data) {
  if (!data || typeof data !== 'object') return null;
  const d = /** @type {Record<string, unknown>} */ (data);
  const byMuseumRaw = Array.isArray(d.by_museum) ? d.by_museum : [];
  const byDynastyRaw = Array.isArray(d.by_dynasty) ? d.by_dynasty : [];
  const byMaterialRaw = Array.isArray(d.by_material) ? d.by_material : [];

  /** @type {MuseumBucket[]} */
  const by_museum = [];
  for (const row of byMuseumRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const museum = String(r.museum ?? '').trim();
    if (!museum) continue;
    by_museum.push({ museum, count: Math.max(0, Math.round(num(r.count))) });
  }

  /** @type {DynastyBucket[]} */
  const by_dynasty = [];
  for (const row of byDynastyRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const dynasty = String(r.dynasty ?? '').trim();
    if (!dynasty) continue;
    by_dynasty.push({ dynasty, count: Math.max(0, Math.round(num(r.count))) });
  }

  /** @type {MaterialBucket[]} */
  const by_material = [];
  for (const row of byMaterialRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const material = String(r.material ?? '').trim();
    if (!material) continue;
    by_material.push({ material, count: Math.max(0, Math.round(num(r.count))) });
  }

  return {
    total_relics: Math.max(0, Math.round(num(d.total_relics))),
    total_museums: Math.max(0, Math.round(num(d.total_museums))),
    total_dynasties: Math.max(0, Math.round(num(d.total_dynasties))),
    total_materials: Math.max(0, Math.round(num(d.total_materials))),
    by_museum,
    by_dynasty,
    by_material,
  };
}

/** @typedef {{ type: 'http', status: number } | { type: 'network' }} StatsFetchError */

export default function StatsPage() {
  const { t } = useTranslation();
  /** @type {[StatsPayload|null, import('react').Dispatch<import('react').SetStateAction<StatsPayload|null>>]} */
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  /** @type {[StatsFetchError|null, import('react').Dispatch<import('react').SetStateAction<StatsFetchError|null>>]} */
  const [error, setError] = useState(null);

  /** @type {[Array<{ century: string, label: string, count: number }>, import('react').Dispatch<any>]} */
  const [timelinePeriods, setTimelinePeriods] = useState([]);
  const [tlLoading, setTlLoading] = useState(true);
  /** @type {[StatsFetchError|null, import('react').Dispatch<any>]} */
  const [tlError, setTlError] = useState(null);

  /** @type {[Array<{ name: string, lat: number, lng: number, country: string, city: string, relic_count: number }>, import('react').Dispatch<any>]} */
  const [geoRows, setGeoRows] = useState([]);
  const [geoLoading, setGeoLoading] = useState(true);
  /** @type {[StatsFetchError|null, import('react').Dispatch<any>]} */
  const [geoError, setGeoError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/stats');
      if (!res.ok) {
        setStats(null);
        setError({ type: 'http', status: res.status });
        return;
      }
      const raw = await res.json();
      const normalized = normalizeStatsPayload(raw);
      setStats(normalized);
      if (!normalized) {
        setError({ type: 'http', status: res.status });
      }
    } catch {
      setStats(null);
      setError({ type: 'network' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchTimeline = useCallback(async () => {
    setTlLoading(true);
    setTlError(null);
    try {
      const res = await fetch('/timeline');
      if (!res.ok) {
        setTimelinePeriods([]);
        setTlError({ type: 'http', status: res.status });
        return;
      }
      const data = await res.json();
      const raw = Array.isArray(data.periods) ? data.periods : [];
      const periods = [];
      for (const row of raw) {
        if (!row || typeof row !== 'object') continue;
        const r = /** @type {Record<string, unknown>} */ (row);
        const century = String(r.century ?? '').trim();
        const label = String(r.label ?? '').trim();
        const count = Math.max(0, Math.round(num(r.count)));
        if (!century) continue;
        periods.push({ century, label, count });
      }
      setTimelinePeriods(periods);
    } catch {
      setTimelinePeriods([]);
      setTlError({ type: 'network' });
    } finally {
      setTlLoading(false);
    }
  }, []);

  const fetchGeo = useCallback(async () => {
    setGeoLoading(true);
    setGeoError(null);
    try {
      const res = await fetch('/museums/geo');
      if (!res.ok) {
        setGeoRows([]);
        setGeoError({ type: 'http', status: res.status });
        return;
      }
      const data = await res.json();
      const raw = Array.isArray(data) ? data : [];
      const rows = [];
      for (const row of raw) {
        if (!row || typeof row !== 'object') continue;
        const r = /** @type {Record<string, unknown>} */ (row);
        const name = String(r.name ?? '').trim();
        if (!name) continue;
        rows.push({
          name,
          lat: Number(r.lat),
          lng: Number(r.lng),
          country: String(r.country ?? '').trim(),
          city: String(r.city ?? '').trim(),
          relic_count: Math.max(0, Math.round(num(r.relic_count))),
        });
      }
      setGeoRows(rows);
    } catch {
      setGeoRows([]);
      setGeoError({ type: 'network' });
    } finally {
      setGeoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  useEffect(() => {
    fetchGeo();
  }, [fetchGeo]);

  const timelineChartData = useMemo(
    () => timelinePeriods.map((p) => ({ ...p, key: `${p.century}-${p.label}` })),
    [timelinePeriods],
  );

  const materialsPie = useMemo(() => {
    const src = stats?.by_material ?? [];
    return src.slice(0, 10).map((row) => ({
      name: row.material,
      value: row.count,
    }));
  }, [stats]);

  const museumChartHeight = useMemo(() => {
    const n = stats?.by_museum?.length ?? 0;
    return Math.min(Math.max(n * 34 + 80, 280), 960);
  }, [stats]);

  const dynastyChartHeight = useMemo(() => {
    const n = stats?.by_dynasty?.length ?? 0;
    return Math.min(Math.max(n * 34 + 80, 260), 680);
  }, [stats]);

  const errorMessage =
    error &&
    (error.type === 'http'
      ? t('errors.stats.http', { status: error.status })
      : t('errors.stats.network'));

  const tlErrorMessage =
    tlError &&
    (tlError.type === 'http'
      ? t('errors.timeline.http', { status: tlError.status })
      : t('errors.timeline.network'));

  const geoErrorMessage =
    geoError &&
    (geoError.type === 'http'
      ? t('errors.geo.http', { status: geoError.status })
      : t('errors.geo.network'));

  const museumTickFormatter = (value) => {
    const s = String(value ?? '');
    if (s.length <= 42) return s;
    return `${s.slice(0, 39)}…`;
  };

  return (
    <div className="stats-page">
      <header className="stats-page__header">
        <div className="stats-page__title-wrap">
          <h1 className="stats-page__title">{t('stats.title')}</h1>
          <p className="stats-page__subtitle">{t('stats.subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </header>

      {loading ? <p className="stats-page__status">{t('stats.loading')}</p> : null}

      {!loading && error ? (
        <div className="stats-page__error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" className="stats-page__retry" onClick={fetchStats}>
            {t('stats.retry')}
          </button>
        </div>
      ) : null}

      {!loading && !error && stats ? (
        <>
          <section className="stats-page__cards" aria-label={t('stats.cardsAria')}>
            <article className="stats-page__card">
              <p className="stats-page__card-label">{t('stats.totalRelics')}</p>
              <p className="stats-page__card-value">{stats.total_relics}</p>
            </article>
            <article className="stats-page__card">
              <p className="stats-page__card-label">{t('stats.totalMuseums')}</p>
              <p className="stats-page__card-value">{stats.total_museums}</p>
            </article>
            <article className="stats-page__card">
              <p className="stats-page__card-label">{t('stats.totalDynasties')}</p>
              <p className="stats-page__card-value">{stats.total_dynasties}</p>
            </article>
            <article className="stats-page__card">
              <p className="stats-page__card-label">{t('stats.totalMaterials')}</p>
              <p className="stats-page__card-value">{stats.total_materials}</p>
            </article>
          </section>

          <section className="stats-page__panel" aria-labelledby="stats-museum-heading">
            <h2 id="stats-museum-heading" className="stats-page__panel-title">
              {t('stats.chartMuseumTitle')}
            </h2>
            <div className="stats-page__chart" style={{ height: museumChartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={stats.by_museum} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="museum"
                    width={168}
                    interval={0}
                    tick={{ fontSize: 11 }}
                    tickFormatter={museumTickFormatter}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--museum-accent, #78350f)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="stats-page__grid-two">
            <section className="stats-page__panel" aria-labelledby="stats-dynasty-heading">
              <h2 id="stats-dynasty-heading" className="stats-page__panel-title">
                {t('stats.chartDynastyTitle')}
              </h2>
              <div className="stats-page__chart" style={{ height: dynastyChartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={stats.by_dynasty} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="dynasty"
                      width={132}
                      interval={0}
                      tick={{ fontSize: 11 }}
                      tickFormatter={formatDynasty}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#92400e" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="stats-page__panel" aria-labelledby="stats-material-heading">
              <h2 id="stats-material-heading" className="stats-page__panel-title">
                {t('stats.chartMaterialTitle')}
              </h2>
              <div className="stats-page__chart" style={{ height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialsPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={108}
                      paddingAngle={1}
                      label={false}
                    >
                      {materialsPie.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#fff" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      ) : null}

      <section className="stats-page__panel" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="stats-page__panel-title">
          {t('timeline.title')}
        </h2>
        {tlLoading ? <p className="stats-page__status">{t('stats.loading')}</p> : null}
        {!tlLoading && tlError ? (
          <div className="stats-page__error stats-page__error--soft" role="alert">
            <p>{tlErrorMessage}</p>
            <button type="button" className="stats-page__retry" onClick={fetchTimeline}>
              {t('stats.retry')}
            </button>
          </div>
        ) : null}
        {!tlLoading && !tlError && timelineChartData.length === 0 ? (
          <p className="stats-page__status">{t('timeline.empty')}</p>
        ) : null}
        {!tlLoading && !tlError && timelineChartData.length > 0 ? (
          <div className="stats-page__chart stats-page__chart--timeline">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineChartData} margin={{ top: 8, right: 12, left: 8, bottom: 52 }}>
                <XAxis
                  dataKey="century"
                  type="category"
                  interval={0}
                  angle={-32}
                  textAnchor="end"
                  height={48}
                  tick={{ fontSize: 10 }}
                />
                <YAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [value, t('stats.totalRelics')]}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload;
                    return p ? `${p.century} (${p.label})` : '';
                  }}
                />
                <Bar dataKey="count" fill="#78350f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </section>

      <section className="stats-page__panel" aria-labelledby="geo-heading">
        <h2 id="geo-heading" className="stats-page__panel-title">
          {t('geo.title')}
        </h2>
        {geoLoading ? <p className="stats-page__status">{t('stats.loading')}</p> : null}
        {!geoLoading && geoError ? (
          <div className="stats-page__error stats-page__error--soft" role="alert">
            <p>{geoErrorMessage}</p>
            <button type="button" className="stats-page__retry" onClick={fetchGeo}>
              {t('stats.retry')}
            </button>
          </div>
        ) : null}
        {!geoLoading && !geoError && geoRows.length === 0 ? (
          <p className="stats-page__status">{t('geo.empty')}</p>
        ) : null}
        {!geoLoading && !geoError && geoRows.length > 0 ? (
          <div className="stats-page__geo-wrap">
            <table className="stats-page__geo-table">
              <thead>
                <tr>
                  <th scope="col">{t('filters.museum')}</th>
                  <th scope="col">{t('geo.city')}</th>
                  <th scope="col">{t('geo.country')}</th>
                  <th scope="col">{t('geo.coordinates')}</th>
                  <th scope="col" className="stats-page__geo-table-num">
                    {t('geo.relics')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {geoRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.city || '—'}</td>
                    <td>{row.country || '—'}</td>
                    <td className="stats-page__geo-coords">
                      {Number.isFinite(row.lat) && Number.isFinite(row.lng)
                        ? `${row.lat.toFixed(4)}, ${row.lng.toFixed(4)}`
                        : '—'}
                    </td>
                    <td className="stats-page__geo-table-num">{row.relic_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
