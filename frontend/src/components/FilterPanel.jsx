import './FilterPanel.css';

/**
 * Sidebar filters wired to `/relics` query params.
 *
 * @param {object} props
 * @param {string[]} props.dynasties
 * @param {string[]} props.materials
 * @param {string[]} props.museums
 * @param {string} props.selectedDynasty
 * @param {string} props.selectedMaterial
 * @param {string} props.selectedMuseum
 * @param {(v: string) => void} props.onDynastyChange
 * @param {(v: string) => void} props.onMaterialChange
 * @param {(v: string) => void} props.onMuseumChange
 */
export default function FilterPanel({
  dynasties = [],
  materials = [],
  museums = [],
  selectedDynasty,
  selectedMaterial,
  selectedMuseum,
  onDynastyChange,
  onMaterialChange,
  onMuseumChange,
}) {
  const materialOptions =
    selectedMaterial && !materials.includes(selectedMaterial)
      ? [selectedMaterial, ...materials]
      : materials;
  const museumOptions =
    selectedMuseum && !museums.includes(selectedMuseum) ? [selectedMuseum, ...museums] : museums;
  const dynastyOpts =
    selectedDynasty && !dynasties.includes(selectedDynasty) ? [selectedDynasty, ...dynasties] : dynasties;

  return (
    <div className="filter-panel">
      <h3 className="filter-panel__title">Filters</h3>
      <p className="filter-panel__hint">Refine results by dynasty, material, museum, or search.</p>

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
        {dynastyOpts.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <label className="filter-panel__label filter-panel__label--spaced" htmlFor="material-filter">
        Material
      </label>
      <select
        id="material-filter"
        className="filter-panel__select"
        value={selectedMaterial}
        onChange={(e) => onMaterialChange(e.target.value)}
      >
        <option value="">All materials</option>
        {materialOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <label className="filter-panel__label filter-panel__label--spaced" htmlFor="museum-filter">
        Museum
      </label>
      <select
        id="museum-filter"
        className="filter-panel__select"
        value={selectedMuseum}
        onChange={(e) => onMuseumChange(e.target.value)}
      >
        <option value="">All museums</option>
        {museumOptions.map((mu) => (
          <option key={mu} value={mu}>
            {mu}
          </option>
        ))}
      </select>
    </div>
  );
}
