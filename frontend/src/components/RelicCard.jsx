import { useTranslation } from 'react-i18next';
import './RelicCard.css';

/**
 * Collection card — image, title, dynasty, museum, material.
 *
 * @param {{ relic: import('../models/relic.js').Relic, selected?: boolean, onSelect?: () => void }} props
 */
export default function RelicCard({ relic, selected, onSelect }) {
  const { t } = useTranslation();
  if (!relic) return null;

  const title = relic.name || t('relicDetail.untitled');
  const subtitle = [relic.dynasty, relic.museum].filter(Boolean).join(' · ');
  const material = relic.material?.trim();

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
      aria-label={t('relicCard.ariaLabel', {
        title,
        subtitle: subtitle || material || t('relicCard.periodLocationTbd'),
      })}
    >
      <div className="relic-card__image-wrap">
        <img
          src={relic.image_url || '/placeholder-relic.svg'}
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
            <span className="relic-card__placeholder">{t('relicCard.periodLocationTbd')}</span>
          ) : null}
        </p>
        {material ? <p className="relic-card__material">{material}</p> : null}
      </div>
    </article>
  );
}
