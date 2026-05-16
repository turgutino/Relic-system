import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Calendar, ZoomIn } from 'lucide-react';
import type { Relic } from '@/models/relic';
import { normalizeRelic } from '@/models/relic';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { SafeHtmlDescription } from '@/app/components/SafeHtmlDescription';
import { RelicKnowledgeGraph } from '@/app/components/RelicKnowledgeGraph';
import { RelicImageLightbox } from '@/app/components/RelicImageLightbox';
import { sanitizeRelicHtml } from '@/utils/sanitizeRelicHtml';

type DetailError =
  | { type: 'invalidId' }
  | { type: 'notFound' }
  | { type: 'http'; status: number }
  | { type: 'network' };

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

export function RelicDetailPage() {
  const { t } = useTranslation();
  const { id: rawId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [relic, setRelic] = useState<Relic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DetailError | null>(null);
  const [related, setRelated] = useState<Relic[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const id = rawId ?? '';

  const catalogQs = useMemo(() => {
    const st = location.state as { catalogSearch?: string } | null;
    return typeof st?.catalogSearch === 'string' ? st.catalogSearch : '';
  }, [location.state]);

  const catalogPath = catalogQs ? `/catalog${catalogQs.startsWith('?') ? catalogQs : `?${catalogQs}`}` : '/catalog';

  useEffect(() => {
    if (!id.trim()) {
      setLoading(false);
      setRelic(null);
      setError({ type: 'invalidId' });
      return undefined;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/relics/${encodeURIComponent(id)}`, { signal: ac.signal })
      .then((res) => {
        if (res.status === 404) {
          setRelic(null);
          setError({ type: 'notFound' });
          return null;
        }
        if (!res.ok) {
          setRelic(null);
          setError({ type: 'http', status: res.status });
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data == null || ac.signal.aborted) return;
        const n = normalizeRelic(data);
        if (!n) {
          setRelic(null);
          setError({ type: 'notFound' });
          return;
        }
        setRelic(n);
      })
      .catch((e) => {
        if ((e as { name?: string })?.name === 'AbortError') return;
        setError({ type: 'network' });
        setRelic(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [id]);

  useEffect(() => {
    if (!id.trim() || !relic) {
      setRelated([]);
      return undefined;
    }
    const ac = new AbortController();
    setRelatedLoading(true);
    fetch(`/relics/${encodeURIComponent(id)}/related`, { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (ac.signal.aborted) return;
        const list = Array.isArray(data) ? data : [];
        setRelated(list.map(normalizeRelic).filter(Boolean) as Relic[]);
      })
      .catch(() => {
        if (!ac.signal.aborted) setRelated([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setRelatedLoading(false);
      });
    return () => ac.abort();
  }, [id, relic]);

  const errMsg =
    error?.type === 'invalidId'
      ? t('errors.detail.invalidId')
      : error?.type === 'notFound'
        ? t('errors.detail.notFound')
        : error?.type === 'http'
          ? t('errors.detail.http', { status: error.status })
          : error?.type === 'network'
            ? t('errors.networkShort')
            : '';

  const missing = t('relicDetail.missingValue');

  return (
    <div className="pt-24 sm:pt-28 pb-20 sm:pb-24 px-3 sm:px-4 md:px-10 max-w-[1100px] w-full min-w-0 mx-auto bg-[var(--relic-page)] min-h-screen transition-colors">
      <button
        type="button"
        onClick={() => navigate(catalogPath)}
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--relic-accent-bright)] hover:text-[var(--relic-gold-mid)]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <ArrowLeft size={18} />
        {t('detailPage.backToCatalog')}
      </button>

      {loading ? (
        <p className="text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t('detailPage.loadingShort')}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-2xl p-8 border border-[var(--relic-error-border)] bg-[var(--relic-error-bg)] text-[var(--relic-error-text)]" role="alert">
          <p className="mb-4">{errMsg}</p>
          <Link to="/catalog" className="text-[var(--relic-accent-bright)] underline">
            {t('catalogPage.browseCatalog')}
          </Link>
        </div>
      ) : null}

      {!loading && !error && relic ? (
        <>
          <article className="rounded-3xl overflow-hidden mb-14" style={panel}>
            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-0 min-w-0">
              <button
                type="button"
                className="group relative block h-full min-h-[320px] w-full cursor-zoom-in overflow-hidden border-0 bg-black p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--relic-accent-bright)] md:min-h-[480px]"
                onClick={() => setLightboxOpen(true)}
                aria-label={t('detailPage.imageExpandAria')}
              >
                <ImageWithFallback src={relic.image_url} alt={relic.name} className="h-full w-full object-cover" />
                <span
                  className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center justify-center rounded-full border border-[var(--relic-border-muted)] bg-[var(--relic-panel-solid)]/92 p-2 text-[var(--relic-text)] shadow-md backdrop-blur-sm opacity-90 ring-1 ring-[color-mix(in_srgb,var(--relic-text)_8%,transparent)] transition-opacity group-hover:opacity-100"
                  aria-hidden
                >
                  <ZoomIn size={18} strokeWidth={2} />
                </span>
              </button>
              <div className="min-w-0 p-6 sm:p-8 md:p-12">
                <h1
                  className="mb-6"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    color: 'var(--relic-text)',
                    lineHeight: 1.2,
                  }}
                >
                  {relic.name || t('relicDetail.untitled')}
                </h1>
                <dl className="space-y-4 text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem' }}>
                  <div className="flex gap-2 items-start">
                    <MapPin size={18} className="mt-0.5 text-[var(--relic-accent-bright)] shrink-0" />
                    <div>
                      <dt className="text-[var(--relic-text-subtle)] text-xs uppercase tracking-wide">{t('detailPage.museumDt')}</dt>
                      <dd className="text-[var(--relic-text)]">{relic.museum || missing}</dd>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Calendar size={18} className="mt-0.5 text-[var(--relic-accent-bright)] shrink-0" />
                    <div>
                      <dt className="text-[var(--relic-text-subtle)] text-xs uppercase tracking-wide">{t('detailPage.periodDateLabel')}</dt>
                      <dd className="text-[var(--relic-text)]">{[relic.dynasty, relic.date].filter(Boolean).join(' · ') || missing}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-[var(--relic-text-subtle)] text-xs uppercase tracking-wide">{t('detailPage.materialDt')}</dt>
                    <dd className="text-[var(--relic-text)]">{relic.material || missing}</dd>
                  </div>
                  {relic.artist ? (
                    <div>
                      <dt className="text-[var(--relic-text-subtle)] text-xs uppercase tracking-wide">{t('detailPage.artistDt')}</dt>
                      <dd className="text-[var(--relic-text)]">{relic.artist}</dd>
                    </div>
                  ) : null}
                  {relic.classification ? (
                    <div>
                      <dt className="text-[var(--relic-text-subtle)] text-xs uppercase tracking-wide">{t('detailPage.classificationDt')}</dt>
                      <dd className="text-[var(--relic-text)]">{relic.classification}</dd>
                    </div>
                  ) : null}
                </dl>
                {relic.description?.trim() && sanitizeRelicHtml(relic.description).trim() ? (
                  <SafeHtmlDescription
                    html={relic.description}
                    className="mt-8 pt-8 border-t border-[var(--relic-border-muted)] text-[var(--relic-text-muted)] leading-relaxed [&_a]:text-[var(--relic-accent-bright)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--relic-border-accent)] [&_blockquote]:pl-3 [&_em]:italic [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem' }}
                  />
                ) : null}
                {relic.object_url ? (
                  <a
                    href={relic.object_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-8 text-[var(--relic-accent-bright)] underline text-sm"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {t('detailPage.viewSourceRecord')}
                  </a>
                ) : null}
              </div>
            </div>
          </article>

          <section>
            <h2 className="mb-6 text-xl text-[var(--relic-text)]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('detailPage.relatedTitle')}
            </h2>
            {relatedLoading ? (
              <p className="text-[var(--relic-text-muted)] text-sm">{t('detailPage.relatedLoading')}</p>
            ) : related.length === 0 ? (
              <p className="text-[var(--relic-text-subtle)] text-sm">{t('detailPage.relatedEmpty')}</p>
            ) : (
              <ul className="grid min-w-0 gap-5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/relics/${encodeURIComponent(r.id)}`}
                      state={{ catalogSearch: catalogQs }}
                      className="block rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform"
                      style={panel}
                    >
                      <div className="h-36 overflow-hidden">
                        <ImageWithFallback src={r.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <div className="font-semibold text-[var(--relic-text)] line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {r.name}
                        </div>
                        <div className="text-xs text-[var(--relic-text-muted)] mt-1 truncate">{r.museum}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <RelicImageLightbox
            open={lightboxOpen}
            src={relic.image_url}
            alt={relic.name || t('relicDetail.untitled')}
            onClose={() => setLightboxOpen(false)}
          />

          <RelicKnowledgeGraph
            centerRelic={relic}
            related={related}
            onNavigateRelic={(rid) =>
              navigate(`/relics/${encodeURIComponent(rid)}`, { state: { catalogSearch: catalogQs } })
            }
          />
        </>
      ) : null}
    </div>
  );
}
