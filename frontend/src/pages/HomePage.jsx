import { useTranslation } from 'react-i18next';
import FilterPanel from '../components/FilterPanel.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import RelicCard from '../components/RelicCard.jsx';
import RelicListRow from '../components/RelicListRow.jsx';
import './HomePage.css';

/**
 * @typedef {import('../models/relic.js').Relic} Relic
 * @typedef {{ type: 'http', status: number } | { type: 'network' }} CatalogFetchError
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
  /** @type {CatalogFetchError|null} */
  error,
  onRetry,
  onClearFacetFilters = () => {},
  onClearSearch = () => {},
  onClearSearchAndFilters = () => {},
  onOpenRelic = () => {},
  advancedPanelOpen = false,
  onAdvancedPanelToggle = () => {},
  artistFilter = '',
  classificationFilter = '',
  dateFromFilter = '',
  dateToFilter = '',
  onArtistChange = () => {},
  onClassificationChange = () => {},
  onDateFromChange = () => {},
  onDateToChange = () => {},
  onExportCsv = () => {},
  onExportXlsx = () => {},
}) {
  const { t } = useTranslation();
  const hasFacetFilters = Boolean(dynastyFilter || materialFilter || museumFilter);
  const searchActive = Boolean(search.trim());
  const advArtist = Boolean(artistFilter.trim());
  const advClass = Boolean(classificationFilter.trim());
  const advFrom = Boolean(dateFromFilter.trim());
  const advTo = Boolean(dateToFilter.trim());
  const hasAdvancedFilters = advArtist || advClass || advFrom || advTo;

  const catalogErrorMessage =
    error &&
    (error.type === 'http'
      ? t('errors.catalog.http', { status: error.status })
      : t('errors.catalog.network'));

  return (
    <div className="home">
      <header className="home__header">
        <div className="home__header-top">
          <div className="home__header-brand">
            <h1>{t('home.title')}</h1>
            <p className="home__tagline">{t('home.tagline')}</p>
          </div>
          <div className="home__header-actions">
            <div className="home__export-actions">
              <button
                type="button"
                className="home__export-btn"
                onClick={onExportCsv}
                title={t('export.csv')}
              >
                {t('export.button')}
              </button>
              <button
                type="button"
                className="home__export-btn"
                onClick={onExportXlsx}
                title={t('export.excel')}
              >
                {t('export.buttonExcel')}
              </button>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="home__catalog-tools" aria-label={t('home.catalogToolsAria')}>
          <div className="home__catalog-tools-row">
            <span className="home__catalog-tools-label">{t('home.viewLabel')}</span>
            <div className="home__view-switch" role="group" aria-label={t('home.viewLabel')}>
              <button
                type="button"
                className={`home__segment ${!viewIsList ? 'home__segment--active' : ''}`}
                aria-pressed={!viewIsList}
                onClick={() => onViewChange(false)}
              >
                {t('home.viewCards')}
              </button>
              <button
                type="button"
                className={`home__segment ${viewIsList ? 'home__segment--active' : ''}`}
                aria-pressed={viewIsList}
                onClick={() => onViewChange(true)}
              >
                {t('home.viewList')}
              </button>
            </div>
          </div>
          <div className="home__catalog-tools-row home__catalog-tools-row--grow">
            <label className="home__catalog-sort-label" htmlFor="catalog-sort-field">
              {t('home.sortBy')}
            </label>
            <select
              id="catalog-sort-field"
              className="home__catalog-sort-select"
              value={sortField}
              onChange={(e) => onSortFieldChange(e.target.value)}
            >
              <option value="name">{t('home.sortFieldName')}</option>
              <option value="dynasty">{t('home.sortFieldDynasty')}</option>
              <option value="date">{t('home.sortFieldDate')}</option>
            </select>
            <label className="home__catalog-sort-label home__catalog-sort-label--inline" htmlFor="catalog-sort-order">
              {t('home.sortOrderLabel')}
            </label>
            <select
              id="catalog-sort-order"
              className="home__catalog-sort-select home__catalog-sort-select--narrow"
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value)}
            >
              <option value="asc">{t('home.sortAscending')}</option>
              <option value="desc">{t('home.sortDescending')}</option>
            </select>
          </div>
        </div>

        <div className="home__search-block">
          <form
            className="home__search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
          >
            <label className="home__search-label" htmlFor="relic-search">
              {t('home.searchLabel')}
            </label>
            <input
              id="relic-search"
              className="home__search-input"
              type="search"
              placeholder={t('home.searchPlaceholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="home__search-submit">
              {t('home.searchSubmit')}
            </button>
          </form>
          <button
            type="button"
            className={`home__advanced-toggle ${advancedPanelOpen ? 'home__advanced-toggle--active' : ''}`}
            aria-expanded={advancedPanelOpen}
            onClick={onAdvancedPanelToggle}
          >
            {t('advancedSearch.toggle')}
          </button>
        </div>

        {advancedPanelOpen ? (
          <div className="home__advanced-fields" aria-label={t('advancedSearch.toggle')}>
            <label className="home__advanced-field">
              <span className="home__advanced-label">{t('advancedSearch.artist')}</span>
              <input
                type="text"
                className="home__advanced-input"
                value={artistFilter}
                onChange={(e) => onArtistChange(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="home__advanced-field">
              <span className="home__advanced-label">{t('advancedSearch.classification')}</span>
              <input
                type="text"
                className="home__advanced-input"
                value={classificationFilter}
                onChange={(e) => onClassificationChange(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="home__advanced-field home__advanced-field--narrow">
              <span className="home__advanced-label">{t('advancedSearch.dateFrom')}</span>
              <input
                type="number"
                className="home__advanced-input"
                inputMode="numeric"
                value={dateFromFilter}
                onChange={(e) => onDateFromChange(e.target.value)}
              />
            </label>
            <label className="home__advanced-field home__advanced-field--narrow">
              <span className="home__advanced-label">{t('advancedSearch.dateTo')}</span>
              <input
                type="number"
                className="home__advanced-input"
                inputMode="numeric"
                value={dateToFilter}
                onChange={(e) => onDateToChange(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {(hasFacetFilters || searchActive || hasAdvancedFilters) && (
          <div className="home__active-filters" aria-label={t('home.activeFiltersAria')}>
            <span className="home__active-filters-intro">{t('home.applied')}</span>
            {dynastyFilter ? (
              <span className="home__filter-chip">
                {t('home.chipDynasty', { value: dynastyFilter })}
                <button type="button" className="home__filter-chip-clear" onClick={() => onDynastyChange('')}>
                  {t('home.clearChip')}
                </button>
              </span>
            ) : null}
            {materialFilter ? (
              <span className="home__filter-chip">
                {t('home.chipMaterial', { value: materialFilter })}
                <button type="button" className="home__filter-chip-clear" onClick={() => onMaterialChange('')}>
                  {t('home.clearChip')}
                </button>
              </span>
            ) : null}
            {museumFilter ? (
              <span className="home__filter-chip">
                {t('home.chipMuseum', { value: museumFilter })}
                <button type="button" className="home__filter-chip-clear" onClick={() => onMuseumChange('')}>
                  {t('home.clearChip')}
                </button>
              </span>
            ) : null}
            {searchActive ? (
              <span className="home__filter-chip">
                {t('home.chipSearch', { value: search.trim() })}
                <button type="button" className="home__filter-chip-clear" onClick={onClearSearch}>
                  {t('home.clearChip')}
                </button>
              </span>
            ) : null}
            {advArtist ? (
              <span className="home__filter-chip">
                {t('advancedSearch.artist')}: {artistFilter.trim()}
                <button type="button" className="home__filter-chip-clear" onClick={() => onArtistChange('')}>
                  {t('home.clearChip')}
                </button>
              </span>
            ) : null}
            {advClass ? (
              <span className="home__filter-chip">
                {t('advancedSearch.classification')}: {classificationFilter.trim()}
                <button type="button" className="home__filter-chip-clear" onClick={() => onClassificationChange('')}>
                  {t('home.clearChip')}
                </button>
              </span>
            ) : null}
            {advFrom ? (
              <span className="home__filter-chip">
                {t('advancedSearch.dateFrom')}: {dateFromFilter.trim()}
                <button type="button" className="home__filter-chip-clear" onClick={() => onDateFromChange('')}>
                  {t('home.clearChip')}
                </button>
              </span>
            ) : null}
            {advTo ? (
              <span className="home__filter-chip">
                {t('advancedSearch.dateTo')}: {dateToFilter.trim()}
                <button type="button" className="home__filter-chip-clear" onClick={() => onDateToChange('')}>
                  {t('home.clearChip')}
                </button>
              </span>
            ) : null}
            <button type="button" className="home__filters-clear-all" onClick={onClearSearchAndFilters}>
              {t('home.clearAll')}
            </button>
            {hasFacetFilters ? (
              <button type="button" className="home__filters-clear-facets-only" onClick={onClearFacetFilters}>
                {t('home.clearFacetsOnly')}
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
          {loading && <p className="home__status">{t('home.loading')}</p>}
          {error && (
            <div className="home__error" role="alert">
              <p>{catalogErrorMessage}</p>
              <button type="button" onClick={onRetry}>
                {t('home.retry')}
              </button>
            </div>
          )}
          {!loading && !error && relics.length === 0 && (
            <p className="home__status">{t('home.empty')}</p>
          )}
          {!loading && !error && viewIsList && relics.length > 0 ? (
            <div className="relic-list__toolbar">
              <span className="relic-list__toolbar-cell relic-list__toolbar-cell--thumb" />
              <span className="relic-list__toolbar-cell">{t('relicList.colTitle')}</span>
              <span className="relic-list__toolbar-cell">{t('relicList.colDynasty')}</span>
              <span className="relic-list__toolbar-cell">{t('relicList.colMuseum')}</span>
              <span className="relic-list__toolbar-cell">{t('relicList.colMaterial')}</span>
            </div>
          ) : null}
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
            <nav className="home__pagination" aria-label={t('home.paginationAria')}>
              <span className="home__pagination-info">
                {t('home.paginationInfo', { page, totalPages, total })}
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
