import { getExtraRelicEntries } from '../models/relic.js';
import './RelicDetail.css';

/**
 * Detail panel — hero image, description, and key attributes.
 *
 * @param {{ relic: import('../models/relic.js').Relic|null, detailLoading?: boolean, onClose?: () => void }} props
 * `onClose` omitted on full-page views (use a route-level back button instead).
 */
export default function RelicDetail({ relic, detailLoading, onClose }) {
  const showClose = typeof onClose === 'function';
  if (!relic) {
    return (
      <div className="relic-detail relic-detail--empty">
        <p>Select a relic from the grid to view its full details.</p>
      </div>
    );
  }

  const extras = getExtraRelicEntries(relic);
  const title = relic.name || 'Untitled relic';

  return (
    <div className="relic-detail">
      <div className="relic-detail__hero">
        <img
          src={relic.image_url || '/placeholder-relic.svg'}
          alt={`${title} — illustration`}
          className="relic-detail__hero-img"
        />
      </div>

      <div className="relic-detail__header">
        <h2 className="relic-detail__title">{title}</h2>
        {showClose ? (
          <button type="button" className="relic-detail__close" onClick={onClose} aria-label="Close detail">
            ×
          </button>
        ) : null}
      </div>
      {detailLoading ? (
        <p className="relic-detail__loading" aria-live="polite">
          Loading full details…
        </p>
      ) : null}

      <h3 className="relic-detail__section-title">About this relic</h3>
      <p className="relic-detail__description">
        {relic.description?.trim() ? relic.description : 'No description provided.'}
      </p>

      <h3 className="relic-detail__section-title">Key attributes</h3>
      <dl className="relic-detail__dl relic-detail__dl--core">
        <div className="relic-detail__row">
          <dt>Dynasty</dt>
          <dd>{relic.dynasty || '—'}</dd>
        </div>
        <div className="relic-detail__row">
          <dt>Museum</dt>
          <dd>{relic.museum || '—'}</dd>
        </div>
        <div className="relic-detail__row">
          <dt>Material</dt>
          <dd>{relic.material || '—'}</dd>
        </div>
      </dl>

      {extras.length > 0 && (
        <div className="relic-detail__extras">
          <h3 className="relic-detail__extras-title">Additional fields (API / graph)</h3>
          <dl className="relic-detail__dl">
            {extras.map(([key, value]) => (
              <div key={key} className="relic-detail__row">
                <dt>{key}</dt>
                <dd>{formatExtraValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function formatExtraValue(value) {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
