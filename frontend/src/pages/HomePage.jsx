import RelicCard from '../components/RelicCard.jsx';
import RelicListRow from '../components/RelicListRow.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import './HomePage.css';

/**
 * @typedef {import('../models/relic.js').Relic} Relic
 */

export default function HomePage({
  relics,
  total = 0,
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
  viewIsList = false,
  onViewChange = () => {},
  sortField = 'name',
  sortOrder = 'asc',
  onSortFieldChange = () => {},
  onSortOrderChange = () => {},
  dynasties = [],
  dynastyFilter = '',
  onDynastyChange = () => {},
  materials = [],
  materialFilter = '',
  onMaterialChange = () => {},
  museums = [],
  museumFilter = '',
  onMuseumChange = () => {},
  search = '',
  onSearchChange = () => {},
  onSearchSubmit = () => {},
  loading,
  error,
  onRetry,
  onClearFacetFilters = () => {},
  onClearSearch = () => {},
  onClearSearchAndFilters = () => {},
  onOpenRelic = () => {},
}) {
  const hasFacetFilters = Boolean(dynastyFilter || materialFilter || museumFilter);
  const searchActive = Boolean(search.trim());

  return (
    <div className="home">
      <header className="home__header">
        <h1>Overseas Relic Knowledge</h1>
        <p className="home__tagline">
          Catalog from API — Neo4j when configured, else sample JSON
        </p>

        <div className="home__catalog-tools" aria-label="View and sorting">
          <div className="home__catalog-tools-row">
            <span className="home__catalog-tools-label">View</span>
            <div className="home__view-switch" role="group" aria-label="Catalog layout">
              <button
                type="button"
                className={`home__segment ${!viewIsList ? 'home__segment--active' : ''}`}
                aria-pressed={!viewIsList}
                onClick={() => onViewChange(false)}
              >
                Cards
              </button>
              <button
                type="button"
                className={`home__segment ${viewIsList ? 'home__segment--active' : ''}`}
                aria-pressed={viewIsList}
                onClick={() => onViewChange(true)}
              >
                List
              </button>
            </div>
          </div>
          <div className="home__catalog-tools-row home__catalog-tools-row--grow">
            <label className="home__catalog-sort-label" htmlFor="catalog-sort-field">
              Sort by
            </label>
            <select
              id="catalog-sort-field"
              className="home__catalog-sort-select"
              value={sortField}
              onChange={(e) => onSortFieldChange(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="dynasty">Dynasty</option>
              <option value="period">Period</option>
            </select>
            <label className="home__catalog-sort-label home__catalog-sort-label--inline" htmlFor="catalog-sort-order">
              Order
            </label>
            <select
              id="catalog-sort-order"
              className="home__catalog-sort-select home__catalog-sort-select--narrow"
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

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

        {(hasFacetFilters || searchActive) && (
          <div className="home__active-filters" aria-label="Active filters">
            <span className="home__active-filters-intro">Applied:</span>
            {dynastyFilter ? (
              <span className="home__filter-chip">
                Dynasty: {dynastyFilter}
                <button type="button" className="home__filter-chip-clear" onClick={() => onDynastyChange('')}>
                  Clear
                </button>
              </span>
            ) : null}
            {materialFilter ? (
              <span className="home__filter-chip">
                Material: {materialFilter}
                <button type="button" className="home__filter-chip-clear" onClick={() => onMaterialChange('')}>
                  Clear
                </button>
              </span>
            ) : null}
            {museumFilter ? (
              <span className="home__filter-chip">
                Museum: {museumFilter}
                <button type="button" className="home__filter-chip-clear" onClick={() => onMuseumChange('')}>
                  Clear
                </button>
              </span>
            ) : null}
            {searchActive ? (
              <span className="home__filter-chip">
                Search: {search.trim()}
                <button type="button" className="home__filter-chip-clear" onClick={onClearSearch}>
                  Clear
                </button>
              </span>
            ) : null}
            <button type="button" className="home__filters-clear-all" onClick={onClearSearchAndFilters}>
              Clear all
            </button>
            {hasFacetFilters ? (
              <button type="button" className="home__filters-clear-facets-only" onClick={onClearFacetFilters}>
                Clear filters only
              </button>
            ) : null}
          </div>
        )}
      </header>

      <main className="home__main">
        <aside className="home__aside">
          <FilterPanel
            dynasties={dynasties}
            selectedDynasty={dynastyFilter}
            onDynastyChange={onDynastyChange}
            materials={materials}
            selectedMaterial={materialFilter}
            onMaterialChange={onMaterialChange}
            museums={museums}
            selectedMuseum={museumFilter}
            onMuseumChange={onMuseumChange}
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
          <ul className={`relic-grid ${viewIsList ? 'relic-grid--hidden' : ''}`}>
            {!viewIsList &&
              relics.map((relic) => (
                <li key={relic.id}>
                  <RelicCard relic={relic} onSelect={() => onOpenRelic(relic.id)} />
                </li>
              ))}
          </ul>
          <ul className={`relic-list ${!viewIsList ? 'relic-grid--hidden' : ''}`}>
            {viewIsList &&
              relics.map((relic) => (
                <li key={relic.id}>
                  <RelicListRow relic={relic} onOpen={() => onOpenRelic(relic.id)} />
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
        </section>
      </main>
    </div>
  );
}
