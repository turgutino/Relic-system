/**
 * Normalized relic shape from `/relics` (Neo4j / JSON sample).
 *
 * @typedef {Object} Relic
 * @property {string} id
 * @property {string} name
 * @property {string} dynasty
 * @property {string} museum
 * @property {string} material
 * @property {string} description
 * @property {string} image_url
 * @property {string} artist
 * @property {string} date
 * @property {string} culture
 * @property {string} period
 * @property {string} classification
 * @property {string} accession_number
 * @property {string} dimensions
 * @property {string} credit_line
 * @property {string} object_url
 * @property {string} [place]
 */

export const RELIC_CARD_FIELDS = ['name', 'dynasty', 'museum', 'material'];

/** Keys handled explicitly in detail UI or reserved — remainder may appear as “additional”. */
export const KNOWN_RELIC_KEYS = new Set([
  'id',
  'name',
  'dynasty',
  'museum',
  'material',
  'description',
  'image_url',
  'image',
  'artist',
  'date',
  'culture',
  'period',
  'classification',
  'accession_number',
  'dimensions',
  'credit_line',
  'object_url',
  'place',
]);

const OPTIONAL_STRING_KEYS = [
  'artist',
  'date',
  'culture',
  'period',
  'classification',
  'accession_number',
  'dimensions',
  'credit_line',
  'object_url',
  'place',
];

/**
 * @param {unknown} v
 * @returns {string}
 */
function strField(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  return String(v).trim();
}

/**
 * @param {Record<string, unknown>|null|undefined} raw
 * @returns {Relic|null}
 */
export function normalizeRelic(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id != null ? String(raw.id) : '';
  if (!id) return null;

  const rawImg = raw.image_url ?? raw.image;
  const image_url =
    typeof rawImg === 'string' && rawImg.trim() ? rawImg.trim() : '/placeholder-relic.svg';

  /** @type {Record<string, unknown>} */
  const rest = { ...raw };

  const relic = {
    ...rest,
    id,
    name: strField(raw.name),
    dynasty: strField(raw.dynasty),
    museum: strField(raw.museum),
    material: strField(raw.material),
    description: strField(raw.description),
    image_url,
  };

  for (const key of OPTIONAL_STRING_KEYS) {
    relic[key] = strField(raw[key]);
  }

  return /** @type {Relic} */ (relic);
}

/**
 * @param {Relic} relic
 * @returns {Array<[string, unknown]>}
 */
export function getExtraRelicEntries(relic) {
  if (!relic) return [];
  return Object.entries(relic).filter(([key]) => !KNOWN_RELIC_KEYS.has(key));
}
