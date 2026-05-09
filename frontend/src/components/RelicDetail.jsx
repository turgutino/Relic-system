import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getExtraRelicEntries } from '../models/relic.js';
import './RelicDetail.css';

/**
 * Full-page relic layout: hero image (zoom), description, metadata table, museum link.
 *
 * @param {{ relic: import('../models/relic.js').Relic|null, detailLoading?: boolean, onClose?: () => void }} props
 */
export default function RelicDetail({ relic, detailLoading, onClose }) {
  const { t } = useTranslation();
  const [zoomOpen, setZoomOpen] = useState(false);
  const showClose = typeof onClose === 'function';

  const closeZoom = useCallback(() => setZoomOpen(false), []);

  useEffect(() => {
    if (!zoomOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeZoom();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomOpen, closeZoom]);

  const attrRows = useMemo(() => {
    if (!relic) return [];
    const pairs = [
      ['dynasty', t('relicDetail.attrDynasty'), relic.dynasty],
      ['museum', t('relicDetail.attrMuseum'), relic.museum],
      ['material', t('relicDetail.attrMaterial'), relic.material],
      ['artist', t('relicDetail.attrArtist'), relic.artist],
      ['date', t('relicDetail.attrDate'), relic.date],
      ['culture', t('relicDetail.attrCulture'), relic.culture],
      ['period', t('relicDetail.attrPeriod'), relic.period],
      ['classification', t('relicDetail.attrClassification'), relic.classification],
      ['dimensions', t('relicDetail.attrDimensions'), relic.dimensions],
      ['accession_number', t('relicDetail.attrAccession'), relic.accession_number],
      ['credit_line', t('relicDetail.attrCreditLine'), relic.credit_line],
      ['place', t('relicDetail.attrPlace'), relic.place],
    ];
    return pairs.filter(([, , val]) => typeof val === 'string' && val.trim().length > 0);
  }, [relic, t]);

  const extras = useMemo(() => (relic ? getExtraRelicEntries(relic) : []), [relic]);

  if (!relic) {
    return (
      <div className="relic-detail relic-detail--empty">
        <p>{t('relicDetail.emptyPrompt')}</p>
      </div>
    );
  }

  const title = relic.name || t('relicDetail.untitled');
  const descriptionText = relic.description?.trim();
  const objectUrl = relic.object_url?.trim();
  const hasLiveImage = /^https?:\/\//i.test(relic.image_url || '');

  return (
    <div className="relic-detail">
      <div className="relic-detail__hero-wrap">
        <button
          type="button"
          className={`relic-detail__hero-trigger ${hasLiveImage ? 'relic-detail__hero-trigger--zoom' : ''}`}
          onClick={() => hasLiveImage && setZoomOpen(true)}
          aria-label={hasLiveImage ? t('relicDetail.zoomOpen') : title}
          disabled={!hasLiveImage}
        >
          <div className="relic-detail__hero">
            <img
              src={relic.image_url || '/placeholder-relic.svg'}
              alt={t('relicDetail.imageAlt', { title })}
              className="relic-detail__hero-img"
            />
          </div>
          {hasLiveImage ? <span className="relic-detail__zoom-hint">{t('relicDetail.zoomHint')}</span> : null}
        </button>
      </div>

      {zoomOpen ? (
        <div
          className="relic-detail__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t('relicDetail.zoomDialog')}
          onClick={closeZoom}
        >
          <button type="button" className="relic-detail__lightbox-close" onClick={closeZoom} aria-label={t('relicDetail.zoomClose')}>
            ×
          </button>
          <img
            src={relic.image_url}
            alt=""
            className="relic-detail__lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      <div className="relic-detail__header">
        <h1 className="relic-detail__title">{title}</h1>
        {showClose ? (
          <button type="button" className="relic-detail__close" onClick={onClose} aria-label={t('relicDetail.closeAria')}>
            ×
          </button>
        ) : null}
      </div>

      {detailLoading ? (
        <p className="relic-detail__loading" aria-live="polite">
          {t('relicDetail.loadingFull')}
        </p>
      ) : null}

      {objectUrl && /^https?:\/\//i.test(objectUrl) ? (
        <p className="relic-detail__actions">
          <a className="relic-detail__museum-link" href={objectUrl} target="_blank" rel="noopener noreferrer">
            {t('relicDetail.viewAtMuseum')}
          </a>
        </p>
      ) : null}

      <section className="relic-detail__section" aria-labelledby="relic-desc-heading">
        <h2 id="relic-desc-heading" className="relic-detail__section-title">
          {t('relicDetail.aboutTitle')}
        </h2>
        <div className="relic-detail__prose">
          {descriptionText ? descriptionText : <p className="relic-detail__muted">{t('relicDetail.noDescription')}</p>}
        </div>
      </section>

      {attrRows.length > 0 ? (
        <section className="relic-detail__section" aria-labelledby="relic-meta-heading">
          <h2 id="relic-meta-heading" className="relic-detail__section-title">
            {t('relicDetail.keyAttributes')}
          </h2>
          <dl className="relic-detail__meta-table">
            {attrRows.map(([key, label, val]) => (
              <div key={key} className="relic-detail__meta-row">
                <dt>{label}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {extras.length > 0 ? (
        <section className="relic-detail__section relic-detail__section--extras" aria-labelledby="relic-extras-heading">
          <h2 id="relic-extras-heading" className="relic-detail__section-title">
            {t('relicDetail.extrasTitle')}
          </h2>
          <dl className="relic-detail__meta-table">
            {extras.map(([key, value]) => (
              <div key={key} className="relic-detail__meta-row">
                <dt>{key}</dt>
                <dd>{formatExtraValue(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function formatExtraValue(value) {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
