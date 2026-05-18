export async function parseApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: string | { msg?: string }[] };
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => (typeof item === 'string' ? item : item?.msg))
        .filter(Boolean)
        .join(', ');
    }
  } catch {
    /* response body not JSON */
  }
  return res.statusText || 'Request failed';
}
