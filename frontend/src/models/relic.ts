export type Relic = {
  id: string;
  name: string;
  dynasty: string;
  museum: string;
  material: string;
  description: string;
  image_url: string;
  artist: string;
  date: string;
  culture: string;
  period: string;
  classification: string;
  accession_number: string;
  dimensions: string;
  credit_line: string;
  object_url: string;
  place?: string;
};

function strField(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  return String(v).trim();
}

export function normalizeRelic(raw: unknown): Relic | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = row.id != null ? String(row.id) : '';
  if (!id) return null;

  const rawImg = row.image_url ?? row.image;
  const imageUrlCandidate =
    typeof rawImg === 'string' && rawImg.trim() ? rawImg.trim() : '/placeholder-relic.svg';

  const relic: Relic = {
    id,
    name: strField(row.name),
    dynasty: strField(row.dynasty),
    museum: strField(row.museum),
    material: strField(row.material),
    description: strField(row.description),
    image_url: imageUrlCandidate,
    artist: strField(row.artist),
    date: strField(row.date),
    culture: strField(row.culture),
    period: strField(row.period),
    classification: strField(row.classification),
    accession_number: strField(row.accession_number),
    dimensions: strField(row.dimensions),
    credit_line: strField(row.credit_line),
    object_url: strField(row.object_url),
    place: strField(row.place),
  };

  return relic;
}
