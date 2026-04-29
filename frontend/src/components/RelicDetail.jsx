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
        <p>Select a relic to see details (placeholder panel — ready for graph-backed fields).</p>
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
      <p className="relic-detail__meta">
        {[relic.dynasty, relic.museum].filter(Boolean).join(' — ') || 'Dynasty / museum from graph or API'}
      </p>
      <div className="relic-detail__image-wrap">
        <img src={relic.image || '/placeholder-relic.svg'} alt="" />
      </div>
      <p className="relic-detail__description">
        {relic.description ||
          'Description placeholder — connect richer text / relations from Neo4j when available.'}
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
