import { useEffect, useState } from 'react';
import RelicCard from '../components/RelicCard.jsx';
import RelicDetail from '../components/RelicDetail.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import { normalizeRelic } from '../models/relic.js';
import './HomePage.css';

/**
 * @typedef {import('../models/relic.js').Relic} Relic
 */

/**
 * Home: card grid + filter + detail. `relics` are normalized in `App.jsx`.
 *
 * Neo4j extension: pass more slice props from here (e.g. `graphMeta`) when API exposes source hints.
 */
export default function HomePage({
  relics,
  total = 0,
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
  dynasties = [],
  dynastyFilter = '',
  onDynastyChange = () => {},
  search = '',
  onSearchChange = () => {},
  onSearchSubmit = () => {},
  loading,
  error,
  onRetry,
}) {
  const [selectedRelic, setSelectedRelic] = useState(/** @type {Relic|null} */ (null));
  const [relatedRelics, setRelatedRelics] = useState(/** @type {Relic[]} */ ([]));
  const [relatedLoading, setRelatedLoading] = useState(false);
  /** Placeholder aggregate state for future filters (material, museum multi-select, etc.) */
  const [filterDraft, setFilterDraft] = useState(() => ({ material: '', provenance: '' }));

  useEffect(() => {
    setSelectedRelic((prev) => {
      if (!prev) return prev;
      const match = relics.find((r) => r.id === prev.id);
      return match ?? null;
    });
  }, [relics]);

  useEffect(() => {
    const id = selectedRelic?.id;
    if (!id) {
      setRelatedRelics([]);
      setRelatedLoading(false);
      return;
    }
    const ac = new AbortController();
    setRelatedLoading(true);
    fetch(`/relics/${encodeURIComponent(id)}/related`, { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error('related');
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRelatedRelics(list.map(normalizeRelic).filter(Boolean));
      })
      .catch(() => {
        if (!ac.signal.aborted) setRelatedRelics([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setRelatedLoading(false);
      });
    return () => ac.abort();
  }, [selectedRelic?.id]);

  return (
    <div className="home">
      <header className="home__header">
        <h1>Overseas Relic Knowledge</h1>
        <p className="home__tagline">
          Catalog from API — Neo4j when configured, else sample JSON
        </p>
        <form
          className="home__search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
        >
          <label className="home__search-label" htmlFor="relic-search">
            Search
          </label>
          <input
            id="relic-search"
            className="home__search-input"
            type="search"
            placeholder="Name or museum…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="home__search-submit">
            Search
          </button>
        </form>
      </header>

      <main className="home__main">
        <aside className="home__aside">
          <FilterPanel
            dynasties={dynasties}
            selectedDynasty={dynastyFilter}
            onDynastyChange={onDynastyChange}
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
          {!loading && !error && relics.length === 0 && (
            <p className="home__status">No relics match this filter.</p>
          )}
          <ul className="relic-grid">
            {relics.map((relic) => (
              <li key={relic.id}>
                <RelicCard
                  relic={relic}
                  selected={relic.id === selectedRelic?.id}
                  onSelect={() => setSelectedRelic(relic)}
                />
              </li>
            ))}
          </ul>

          {!loading && !error && totalPages > 1 && (
            <nav className="home__pagination" aria-label="Pagination">
              <span className="home__pagination-info">
                Page {page} of {totalPages} ({total} relics)
              </span>
              <div className="home__pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`home__pagination-btn ${p === page ? 'home__pagination-btn--active' : ''}`}
                    onClick={() => onPageChange(p)}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </nav>
          )}

          <RelicDetail relic={selectedRelic} onClose={() => setSelectedRelic(null)} />

          {selectedRelic && (
            <div className="home__related">
              <h3 className="home__related-title">Related relics</h3>
              {relatedLoading ? (
                <p className="home__related-status">Loading related relics…</p>
              ) : relatedRelics.length === 0 ? (
                <p className="home__related-status">No related relics.</p>
              ) : (
                <ul className="home__related-list">
                  {relatedRelics.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="home__related-item"
                        onClick={() => setSelectedRelic(r)}
                      >
                        <span className="home__related-name">{r.name}</span>
                        {r.dynasty ? (
                          <span className="home__related-dynasty">{r.dynasty}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
