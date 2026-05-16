import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type MuseumBucket = { museum: string; count: number };
type DynastyBucket = { dynasty: string; count: number };
type MaterialBucket = { material: string; count: number };

type StatsPayload = {
  total_relics: number;
  total_museums: number;
  total_dynasties: number;
  total_materials: number;
  by_museum: MuseumBucket[];
  by_dynasty: DynastyBucket[];
  by_material: MaterialBucket[];
};

type TimelinePeriod = { century: string; label: string; count: number };

type GeoRow = {
  name: string;
  lat: number;
  lng: number;
  country: string;
  city: string;
  relic_count: number;
};

type FetchErr = { type: 'http'; status: number } | { type: 'network' };

const PIE_COLORS = [
  'var(--relic-pie-1)',
  'var(--relic-pie-2)',
  'var(--relic-pie-3)',
  'var(--relic-pie-4)',
  'var(--relic-pie-5)',
  'var(--relic-pie-6)',
  'var(--relic-pie-7)',
  'var(--relic-pie-8)',
];

const chartTooltipStyle = {
  background: 'var(--relic-chart-tooltip-bg)',
  border: '1px solid var(--relic-chart-tooltip-border)',
  borderRadius: 8,
  color: 'var(--relic-text)',
} as const;

const axisTick = { fill: 'var(--relic-chart-axis)', fontSize: 11 } as const;

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatDynasty(name: string): string {
  const shortened = String(name ?? '')
    .replace(/^China,\s*/i, '')
    .replace(/\s*\(\d+.*\)/, '')
    .trim();
  if (shortened.length <= 20) return shortened;
  return `${shortened.slice(0, 17)}…`;
}

function normalizeStatsPayload(data: unknown): StatsPayload | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const byMuseumRaw = Array.isArray(d.by_museum) ? d.by_museum : [];
  const byDynastyRaw = Array.isArray(d.by_dynasty) ? d.by_dynasty : [];
  const byMaterialRaw = Array.isArray(d.by_material) ? d.by_material : [];

  const by_museum: MuseumBucket[] = [];
  for (const row of byMuseumRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const museum = String(r.museum ?? '').trim();
    if (!museum) continue;
    by_museum.push({ museum, count: Math.max(0, Math.round(num(r.count))) });
  }

  const by_dynasty: DynastyBucket[] = [];
  for (const row of byDynastyRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const dynasty = String(r.dynasty ?? '').trim();
    if (!dynasty) continue;
    by_dynasty.push({ dynasty, count: Math.max(0, Math.round(num(r.count))) });
  }

  const by_material: MaterialBucket[] = [];
  for (const row of byMaterialRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
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

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

export function StatsDashboardPage() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language.startsWith('zh') ? 'zh-CN' : i18n.language.startsWith('az') ? 'az-AZ' : undefined;
  const missing = t('relicDetail.missingValue');
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FetchErr | null>(null);

  const [timelinePeriods, setTimelinePeriods] = useState<TimelinePeriod[]>([]);
  const [tlLoading, setTlLoading] = useState(true);
  const [tlError, setTlError] = useState<FetchErr | null>(null);

  const [geoRows, setGeoRows] = useState<GeoRow[]>([]);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<FetchErr | null>(null);
  const [layoutTier, setLayoutTier] = useState<'narrow' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const mqSm = window.matchMedia('(max-width: 639px)');
    const mqLg = window.matchMedia('(max-width: 1023px)');
    const apply = () => {
      if (mqSm.matches) setLayoutTier('narrow');
      else if (mqLg.matches) setLayoutTier('tablet');
      else setLayoutTier('desktop');
    };
    apply();
    mqSm.addEventListener('change', apply);
    mqLg.addEventListener('change', apply);
    return () => {
      mqSm.removeEventListener('change', apply);
      mqLg.removeEventListener('change', apply);
    };
  }, []);

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
      if (!normalized) setError({ type: 'http', status: res.status });
    } catch {
      setStats(null);
      setError({ type: 'network' });
    } finally {
      setLoading(false);
    }
  }, []);

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
      const periods: TimelinePeriod[] = [];
      for (const row of raw) {
        if (!row || typeof row !== 'object') continue;
        const r = row as Record<string, unknown>;
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
      const rows: GeoRow[] = [];
      for (const row of raw) {
        if (!row || typeof row !== 'object') continue;
        const r = row as Record<string, unknown>;
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
    fetchStats();
  }, [fetchStats]);
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
    return src.slice(0, 10).map((row) => ({ name: row.material, value: row.count }));
  }, [stats]);

  const museumChartHeight = useMemo(() => {
    const n = stats?.by_museum?.length ?? 0;
    return Math.min(Math.max(n * 34 + 80, 280), 960);
  }, [stats]);

  const dynastyChartHeight = useMemo(() => {
    const n = stats?.by_dynasty?.length ?? 0;
    return Math.min(Math.max(n * 34 + 80, 260), 680);
  }, [stats]);

  const museumTickFormatter = (value: string) => {
    const s = String(value ?? '');
    const max = layoutTier === 'narrow' ? 22 : layoutTier === 'tablet' ? 34 : 42;
    if (s.length <= max) return s;
    return `${s.slice(0, max - 1)}…`;
  };

  const museumYAxisWidth = layoutTier === 'narrow' ? 96 : layoutTier === 'tablet' ? 140 : 168;
  const dynastyYAxisWidth = layoutTier === 'narrow' ? 80 : layoutTier === 'tablet' ? 118 : 132;
  const pieRadii =
    layoutTier === 'narrow'
      ? { inner: 40, outer: 72 }
      : layoutTier === 'tablet'
        ? { inner: 48, outer: 88 }
        : { inner: 56, outer: 108 };

  const materialsPieChartHeight =
    layoutTier === 'narrow' ? 210 : layoutTier === 'tablet' ? 250 : 280;

  return (
    <div className="pt-24 sm:pt-28 pb-16 sm:pb-24 px-3 sm:px-4 md:px-8 xl:px-10 max-w-[1400px] w-full min-w-0 mx-auto space-y-12 sm:space-y-14 bg-[var(--relic-page)] min-h-screen transition-colors">
      <header>
        <h1 className="mb-2 text-[var(--relic-text)]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}>
          {t('statsDashboard.pageTitle')}
        </h1>
        <p className="text-[var(--relic-text-muted)] max-w-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.125rem' }}>
          {t('statsDashboard.pageSubtitle')}
        </p>
      </header>

      {loading ? (
        <p className="text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t('stats.loading')}
        </p>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl p-6 border border-[var(--relic-error-border)] bg-[var(--relic-error-bg)] text-[var(--relic-error-text)]" role="alert">
          <p className="mb-3">
            {error.type === 'http' ? t('errors.stats.http', { status: error.status }) : t('statsDashboard.networkError')}
          </p>
          <button type="button" onClick={fetchStats} className="rounded-full px-5 py-2 bg-[var(--relic-accent-bright)] text-[var(--relic-btn-primary-fg)] text-sm">
            {t('stats.retry')}
          </button>
        </div>
      ) : null}

      {!loading && !error && stats ? (
        <>
          <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {[
              { label: t('stats.totalRelics'), value: stats.total_relics },
              { label: t('statsDashboard.cardMuseums'), value: stats.total_museums },
              { label: t('statsDashboard.cardDynastyLabels'), value: stats.total_dynasties },
              { label: t('statsDashboard.cardMaterials'), value: stats.total_materials },
            ].map((card) => (
              <article key={card.label} className="min-w-0 rounded-2xl p-5 sm:p-6" style={panel}>
                <p className="text-xs uppercase tracking-wide text-[var(--relic-text-subtle)] mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {card.label}
                </p>
                <p className="text-2xl sm:text-3xl font-semibold text-[var(--relic-accent-bright)] break-words [overflow-wrap:anywhere]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {card.value.toLocaleString(numberLocale)}
                </p>
              </article>
            ))}
          </section>

          <section className="min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-6 md:p-8" style={panel}>
            <h2 className="mb-4 text-lg text-[var(--relic-text)]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('stats.chartMuseumTitle')}
            </h2>
            <div className="w-full min-w-0 overflow-x-auto">
              <div style={{ height: museumChartHeight, minWidth: layoutTier === 'narrow' ? 320 : 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={stats.by_museum} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                    <XAxis type="number" tick={axisTick} />
                    <YAxis
                      type="category"
                      dataKey="museum"
                      width={museumYAxisWidth}
                      interval={0}
                      tick={axisTick}
                      tickFormatter={museumTickFormatter}
                    />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="var(--relic-chart-bar-primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>
          </section>

          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <section className="min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-6 md:p-8" style={panel}>
              <h2 className="mb-4 text-lg text-[var(--relic-text)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t('stats.chartDynastyTitle')}
              </h2>
              <div className="w-full min-w-0 overflow-x-auto">
                <div style={{ height: dynastyChartHeight, minWidth: layoutTier === 'narrow' ? 300 : 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={stats.by_dynasty} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                      <XAxis type="number" tick={axisTick} />
                      <YAxis
                        type="category"
                        dataKey="dynasty"
                        width={dynastyYAxisWidth}
                        interval={0}
                        tick={axisTick}
                        tickFormatter={(v: string) => formatDynasty(v)}
                      />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill="var(--relic-chart-bar-secondary)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            </section>

            <section className="min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-6 md:p-8" style={panel}>
              <h2
                id="stats-materials-pie-heading"
                className="mb-4 text-lg text-[var(--relic-text)]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t('statsDashboard.materialsTop10')}
              </h2>
              <div className="mx-auto w-full max-w-[min(100%,420px)]">
                <div style={{ height: materialsPieChartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <Pie
                        data={materialsPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={pieRadii.inner}
                        outerRadius={pieRadii.outer}
                        paddingAngle={1}
                        label={false}
                      >
                        {materialsPie.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke="var(--relic-pie-stroke)"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul
                  className="mt-5 grid grid-cols-1 gap-x-4 gap-y-2.5 text-left sm:grid-cols-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  aria-labelledby="stats-materials-pie-heading"
                >
                  {materialsPie.map((row, index) => (
                    <li key={`${row.name}-${index}`} className="flex min-w-0 items-start gap-2.5">
                      <span
                        className="mt-1.5 size-2.5 shrink-0 rounded-sm border border-[var(--relic-border-muted)]"
                        style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                        aria-hidden
                      />
                      <span className="min-w-0 text-[0.7rem] leading-snug text-[var(--relic-chart-axis)] sm:text-[0.8rem] [overflow-wrap:anywhere]">
                        <span className="text-[var(--relic-text)]">{row.name}</span>
                        <span className="text-[var(--relic-text-subtle)]"> — {row.value.toLocaleString(numberLocale)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </>
      ) : null}

      <section className="mt-2 min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-6 md:p-8" style={panel}>
        <h2 className="mb-4 text-lg text-[var(--relic-text)]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t('statsDashboard.timelineHeading')}
        </h2>
        {tlLoading ? <p className="text-[var(--relic-text-muted)] text-sm">{t('statsDashboard.loadingTimeline')}</p> : null}
        {!tlLoading && tlError ? (
          <div className="text-[var(--relic-error-text)] text-sm mb-2">
            {tlError.type === 'http' ? t('statsDashboard.timelineErrorHttp', { status: tlError.status }) : t('statsDashboard.networkError')}{' '}
            <button type="button" className="underline text-[var(--relic-accent-bright)]" onClick={fetchTimeline}>
              {t('stats.retry')}
            </button>
          </div>
        ) : null}
        {!tlLoading && !tlError && timelineChartData.length === 0 ? (
          <p className="text-[var(--relic-text-subtle)] text-sm">{t('statsDashboard.noTimelineData')}</p>
        ) : null}
        {!tlLoading && !tlError && timelineChartData.length > 0 ? (
          <div className="h-[320px] md:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineChartData} margin={{ top: 8, right: 12, left: 8, bottom: 52 }}>
                <XAxis
                  dataKey="century"
                  type="category"
                  interval={0}
                  angle={-32}
                  textAnchor="end"
                  height={48}
                  tick={{ fill: 'var(--relic-chart-axis)', fontSize: 10 }}
                />
                <YAxis type="number" tick={axisTick} allowDecimals={false} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number | string) => [value, t('statsDashboard.chartTooltipRelics')]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload as TimelinePeriod | undefined;
                    return item ? `${item.century} (${item.label})` : String(label ?? '');
                  }}
                />
                <Bar dataKey="count" fill="var(--relic-chart-bar-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl p-6 md:p-8 overflow-x-auto" style={panel}>
        <h2 className="mb-4 text-lg text-[var(--relic-text)]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t('statsDashboard.museumsMapTitle')}
        </h2>
        {geoLoading ? <p className="text-[var(--relic-text-muted)] text-sm">{t('statsDashboard.loadingGeo')}</p> : null}
        {!geoLoading && geoError ? (
          <div className="text-[var(--relic-error-text)] text-sm mb-2">
            {geoError.type === 'http' ? t('statsDashboard.geoErrorHttp', { status: geoError.status }) : t('statsDashboard.networkError')}{' '}
            <button type="button" className="underline text-[var(--relic-accent-bright)]" onClick={fetchGeo}>
              {t('stats.retry')}
            </button>
          </div>
        ) : null}
        {!geoLoading && !geoError && geoRows.length === 0 ? (
          <p className="text-[var(--relic-text-subtle)] text-sm">{t('statsDashboard.noGeoRows')}</p>
        ) : null}
        {!geoLoading && !geoError && geoRows.length > 0 ? (
          <table className="w-full text-sm text-left border-collapse min-w-[640px]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <thead>
              <tr className="text-[var(--relic-table-head)] border-b border-[var(--relic-border-muted)]">
                <th className="py-2 pr-4 font-medium">{t('filters.museum')}</th>
                <th className="py-2 pr-4 font-medium">{t('geo.city')}</th>
                <th className="py-2 pr-4 font-medium">{t('geo.country')}</th>
                <th className="py-2 pr-4 font-medium">{t('geo.coordinates')}</th>
                <th className="py-2 font-medium text-right">{t('geo.relics')}</th>
              </tr>
            </thead>
            <tbody className="text-[var(--relic-table-body)]">
              {geoRows.map((row) => (
                <tr key={row.name} className="border-b border-[var(--relic-table-row-border)]">
                  <td className="py-2 pr-4">{row.name}</td>
                  <td className="py-2 pr-4">{row.city || missing}</td>
                  <td className="py-2 pr-4">{row.country || missing}</td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {Number.isFinite(row.lat) && Number.isFinite(row.lng)
                      ? `${row.lat.toFixed(4)}, ${row.lng.toFixed(4)}`
                      : missing}
                  </td>
                  <td className="py-2 text-right">{row.relic_count.toLocaleString(numberLocale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
