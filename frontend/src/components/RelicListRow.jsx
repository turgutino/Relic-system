import './RelicListRow.css';

/**
 * Compact list row — same navigate action as cards.
 *
 * @param {{ relic: import('../models/relic.js').Relic, onOpen: () => void }} props
 */
export default function RelicListRow({ relic, onOpen }) {
  if (!relic) return null;

  const title = relic.name || 'Untitled relic';

  return (
    <article
      className="relic-row"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={rowKeyDown(onOpen)}
    >
      <div className="relic-row__thumb">
        <img src={relic.image_url || '/placeholder-relic.svg'} alt="" className="relic-row__img" loading="lazy" />
      </div>
      <div className="relic-row__body">
        <h3 className="relic-row__title">{title}</h3>
        <p className="relic-row__meta">
          {[relic.dynasty, relic.museum].filter(Boolean).join(' · ') || '—'}
        </p>
        {relic.material ? <p className="relic-row__material">{relic.material}</p> : null}
      </div>
    </article>
  );
}

function rowKeyDown(onOpen) {
  /** @param {import('react').KeyboardEvent} e */
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen?.();
    }
  };
}
