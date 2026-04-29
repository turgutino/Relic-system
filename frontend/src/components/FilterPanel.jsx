import './FilterPanel.css';

/**
 * Placeholder filters — dynasty wired; `filterDraft` reserved for Neo4j facet fields later.
 *
 * @param {object} props
 * @param {string[]} props.dynasties
 * @param {string} props.selectedDynasty
 * @param {(v: string) => void} props.onDynastyChange
 * @param {{ material?: string, provenance?: string }} [props.filterDraft]
 * @param {(updater: (prev: object) => object) => void} [props.onFilterDraftChange]  // setState-style
 */
export default function FilterPanel({
  dynasties,
  selectedDynasty,
  onDynastyChange,
  filterDraft = { material: '', provenance: '' },
  onFilterDraftChange,
}) {
  const draft = filterDraft || { material: '', provenance: '' };

  return (
    <div className="filter-panel">
      <h3 className="filter-panel__title">Filters</h3>
      <p className="filter-panel__hint">
        Placeholder: extend with museum, material, or Cypher-driven facets when the graph grows.
      </p>

      <label className="filter-panel__label" htmlFor="dynasty-filter">
        Dynasty
      </label>
      <select
        id="dynasty-filter"
        className="filter-panel__select"
        value={selectedDynasty}
        onChange={(e) => onDynastyChange(e.target.value)}
      >
        <option value="">All periods</option>
        {dynasties.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Neo4j extension: bind these to graph-backed facets or full-text search */}
      <label className="filter-panel__label filter-panel__label--spaced" htmlFor="filter-material">
        Material (placeholder)
      </label>
      <input
        id="filter-material"
        className="filter-panel__input"
        type="text"
        placeholder="e.g. bronze, jade"
        value={draft.material ?? ''}
        onChange={(e) =>
          onFilterDraftChange?.((prev) => ({
            ...prev,
            material: e.target.value,
          }))
        }
        readOnly={!onFilterDraftChange}
        title={onFilterDraftChange ? 'Draft state for future filtering' : undefined}
      />

      <label className="filter-panel__label filter-panel__label--spaced" htmlFor="filter-provenance">
        Provenance note (placeholder)
      </label>
      <input
        id="filter-provenance"
        className="filter-panel__input"
        type="text"
        placeholder="Future graph attribute"
        value={draft.provenance ?? ''}
        onChange={(e) =>
          onFilterDraftChange?.((prev) => ({
            ...prev,
            provenance: e.target.value,
          }))
        }
        readOnly={!onFilterDraftChange}
      />
    </div>
  );
}
