import { useMemo, useState } from 'react';
import RelicCard from '../components/RelicCard.jsx';
import RelicDetail from '../components/RelicDetail.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import './HomePage.css';

/**
 * @typedef {import('../models/relic.js').Relic} Relic
 */

/**
 * Home: card grid + filter + detail. `relics` are normalized in `App.jsx`.
 *
 * Neo4j extension: pass more slice props from here (e.g. `graphMeta`) when API exposes source hints.
 */
export default function HomePage({ relics, loading, error, onRetry }) {
  const [selectedId, setSelectedId] = useState(/** @type {string|null} */ (null));
  const [dynastyFilter, setDynastyFilter] = useState('');
  /** Placeholder aggregate state for future filters (material, museum multi-select, etc.) */
  const [filterDraft, setFilterDraft] = useState(() => ({ material: '', provenance: '' }));

  const dynasties = useMemo(() => {
    const set = new Set(relics.map((r) => r.dynasty).filter(Boolean));
    return [...set].sort();
  }, [relics]);

  const filtered = useMemo(() => {
    let rows = relics;
    if (dynastyFilter) rows = rows.filter((r) => r.dynasty === dynastyFilter);
    // Neo4j extension: apply filterDraft.material / museum graph facets here
    return rows;
  }, [relics, dynastyFilter]);

  const selected = relics.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="home">
      <header className="home__header">
        <h1>Overseas Relic Knowledge</h1>
        <p className="home__tagline">
          Catalog from API — Neo4j when configured, else sample JSON
        </p>
      </header>

      <main className="home__main">
        <aside className="home__aside">
          <FilterPanel
            dynasties={dynasties}
            selectedDynasty={dynastyFilter}
            onDynastyChange={setDynastyFilter}
            filterDraft={filterDraft}
            onFilterDraftChange={setFilterDraft}
          />
        </aside>

        <section className="home__content">
          {loading && <p className="home__status">Loading relics…</p>}
          {error && (
            <div className="home__error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={onRetry}>
                Retry
              </button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="home__status">No relics match this filter.</p>
          )}
          <ul className="relic-grid">
            {filtered.map((relic) => (
              <li key={relic.id}>
                <RelicCard
                  relic={relic}
                  selected={relic.id === selectedId}
                  onSelect={() => setSelectedId(relic.id)}
                />
              </li>
            ))}
          </ul>

          <RelicDetail relic={selected} onClose={() => setSelectedId(null)} />
        </section>
      </main>
    </div>
  );
}
