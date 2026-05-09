import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <h3 className="filter-panel__title">{t('filters.title')}</h3>
      <p className="filter-panel__hint">{t('filters.hint')}</p>

      <label className="filter-panel__label" htmlFor="dynasty-filter">
        {t('filters.dynasty')}
      </label>
      <select
        id="dynasty-filter"
        className="filter-panel__select"
        value={selectedDynasty}
        onChange={(e) => onDynastyChange(e.target.value)}
      >
        <option value="">{t('filters.allPeriods')}</option>
        {dynastyOpts.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <label className="filter-panel__label filter-panel__label--spaced" htmlFor="material-filter">
        {t('filters.material')}
      </label>
      <select
        id="material-filter"
        className="filter-panel__select"
        value={selectedMaterial}
        onChange={(e) => onMaterialChange(e.target.value)}
      >
        <option value="">{t('filters.allMaterials')}</option>
        {materialOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <label className="filter-panel__label filter-panel__label--spaced" htmlFor="museum-filter">
        {t('filters.museum')}
      </label>
      <select
        id="museum-filter"
        className="filter-panel__select"
        value={selectedMuseum}
        onChange={(e) => onMuseumChange(e.target.value)}
      >
        <option value="">{t('filters.allMuseums')}</option>
        {museumOptions.map((mu) => (
          <option key={mu} value={mu}>
            {mu}
          </option>
        ))}
      </select>
    </div>
  );
}
