/**
 * Normalized relic shape from `/relics` (JSON file or Neo4j-backed API).
 * Add new display fields in one place; backend can send extra keys anytime.
 *
 * Neo4j extension: map new node properties in backend `services/relics._records_to_relics`,
 * then read them here via spread (`...raw`) or explicit defaults below.
 *
 * @typedef {Object} Relic
 * @property {string} id
 * @property {string} name
 * @property {string} [dynasty]
 * @property {string} [museum]
 * @property {string} [description]
 * @property {string} [image]
 */

export const RELIC_CARD_FIELDS = ['name', 'dynasty', 'museum'];

/** Keys we render in cards / primary detail — everything else can show in "Graph / extra fields". */
export const KNOWN_RELIC_KEYS = new Set([
  'id',
  'name',
  'dynasty',
  'museum',
  'description',
  'image',
]);

/**
 * @param {Record<string, unknown>|null|undefined} raw
 * @returns {Relic|null}
 */
export function normalizeRelic(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id != null ? String(raw.id) : '';
  if (!id) return null;

  return {
    ...raw,
    id,
    name: typeof raw.name === 'string' && raw.name ? raw.name : 'Untitled relic',
    dynasty: typeof raw.dynasty === 'string' ? raw.dynasty : '',
    museum: typeof raw.museum === 'string' ? raw.museum : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    image: typeof raw.image === 'string' && raw.image ? raw.image : '/placeholder-relic.svg',
  };
}

/**
 * @param {Relic} relic
 * @returns {Array<[string, unknown]>}
 */
export function getExtraRelicEntries(relic) {
  if (!relic) return [];
  return Object.entries(relic).filter(([key]) => !KNOWN_RELIC_KEYS.has(key));
}
