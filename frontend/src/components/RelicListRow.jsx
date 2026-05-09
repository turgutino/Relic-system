import { useTranslation } from 'react-i18next';
import './RelicListRow.css';

/**
 * Table-style row — name, dynasty, museum, material.
 *
 * @param {{ relic: import('../models/relic.js').Relic, onOpen: () => void }} props
 */
export default function RelicListRow({ relic, onOpen }) {
  const { t } = useTranslation();
  if (!relic) return null;

  const title = relic.name || t('relicDetail.untitled');

  return (
    <article
      className="relic-row"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={rowKeyDown(onOpen)}
      aria-label={t('relicCard.ariaLabel', {
        title,
        subtitle: [relic.dynasty, relic.museum, relic.material].filter(Boolean).join(' · ') || t('relicDetail.missingValue'),
      })}
    >
      <div className="relic-row__thumb" aria-hidden>
        <img src={relic.image_url || '/placeholder-relic.svg'} alt="" className="relic-row__img" loading="lazy" />
      </div>
      <div className="relic-row__cell relic-row__cell--title">{title}</div>
      <div className="relic-row__cell relic-row__cell--dynasty">{relic.dynasty || t('relicDetail.missingValue')}</div>
      <div className="relic-row__cell relic-row__cell--museum">{relic.museum || t('relicDetail.missingValue')}</div>
      <div className="relic-row__cell relic-row__cell--material">{relic.material || t('relicDetail.missingValue')}</div>
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
