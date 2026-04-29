import './RelicCard.css';

/**
 * Minimal card: placeholder image + name + dynasty + museum.
 *
 * @param {{ relic: import('../models/relic.js').Relic, selected?: boolean, onSelect?: () => void }} props
 */
export default function RelicCard({ relic, selected, onSelect }) {
  if (!relic) return null;

  const title = relic.name || 'Untitled relic';
  const subtitle = [relic.dynasty, relic.museum].filter(Boolean).join(' · ');

  return (
    <article
      className={`relic-card ${selected ? 'relic-card--selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      aria-label={`${title}. ${subtitle}`}
    >
      <div className="relic-card__image-wrap">
        <img
          src={relic.image || '/placeholder-relic.svg'}
          alt=""
          className="relic-card__image"
          loading="lazy"
        />
      </div>
      <div className="relic-card__body">
        <h2 className="relic-card__title">{title}</h2>
        <p className="relic-card__meta">
          {relic.dynasty ? <span className="relic-card__line">{relic.dynasty}</span> : null}
          {relic.dynasty && relic.museum ? <span className="relic-card__sep">·</span> : null}
          {relic.museum ? <span className="relic-card__line">{relic.museum}</span> : null}
          {!relic.dynasty && !relic.museum ? (
            <span className="relic-card__placeholder">Period / location TBD</span>
          ) : null}
        </p>
      </div>
    </article>
  );
}
