import { getExtraRelicEntries } from '../models/relic.js';
import './RelicDetail.css';

/**
 * Placeholder detail panel — core fields + "extra" key/values for future Neo4j properties.
 *
 * @param {{ relic: import('../models/relic.js').Relic|null, onClose?: () => void }} props
 */
export default function RelicDetail({ relic, onClose }) {
  if (!relic) {
    return (
      <div className="relic-detail relic-detail--empty">
        <p>Select a relic from the grid to view its full details.</p>
      </div>
    );
  }

  const extras = getExtraRelicEntries(relic);

  return (
    <div className="relic-detail">
      <div className="relic-detail__header">
        <h2>{relic.name}</h2>
        <button type="button" className="relic-detail__close" onClick={onClose} aria-label="Close detail">
          ×
        </button>
      </div>
      <dl className="relic-detail__dl relic-detail__dl--core">
        <div className="relic-detail__row">
          <dt>Dynasty</dt>
          <dd>{relic.dynasty || '—'}</dd>
        </div>
        <div className="relic-detail__row">
          <dt>Museum</dt>
          <dd>{relic.museum || '—'}</dd>
        </div>
      </dl>
      <div className="relic-detail__image-wrap">
        <img src={relic.image || '/placeholder-relic.svg'} alt="" />
      </div>
      <h3 className="relic-detail__section-title">Description</h3>
      <p className="relic-detail__description">
        {relic.description?.trim() ? relic.description : 'No description provided.'}
      </p>

      {/* Neo4j extension: render additional RETURN aliases / nested graph payloads */}
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
