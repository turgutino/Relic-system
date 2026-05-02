import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import RelicDetail from '../components/RelicDetail.jsx';
import { normalizeRelic } from '../models/relic.js';
import './RelicDetailPage.css';

/**
 * Standalone relic view; loads `GET /relics/:id`.
 * Back restores catalog query string saved in `location.state.catalogSearch`.
 */
export default function RelicDetailPage() {
  const { id: rawId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  /** @typedef {import('../models/relic.js').Relic} Relic */
  const [relic, setRelic] = useState(/** @type {Relic|null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));

  const id = rawId ?? '';
  const catalogSearch = location.state?.catalogSearch;

  useEffect(() => {
    if (!id.trim()) {
      setLoading(false);
      setRelic(null);
      setError('Invalid relic id.');
      return undefined;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/relics/${encodeURIComponent(id)}`, { signal: ac.signal })
      .then((res) => {
        if (res.status === 404) {
          setRelic(null);
          setError('Relic not found.');
          return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data == null || ac.signal.aborted) return;
        const n = normalizeRelic(data);
        setRelic(n);
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setError(e.message || 'Failed to load relic');
        setRelic(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [id]);

  const goCatalog = () => {
    const raw =
      typeof catalogSearch === 'string'
        ? catalogSearch.startsWith('?')
          ? catalogSearch.slice(1)
          : catalogSearch
        : '';
    navigate({ pathname: '/', search: raw ? `?${raw}` : '' });
  };

  return (
    <div className="relic-detail-page">
      <div className="relic-detail-page__toolbar">
        <button type="button" className="relic-detail-page__back" onClick={goCatalog}>
          ← Back to catalog
        </button>
      </div>

      {loading ? <p className="relic-detail-page__status">Loading relic…</p> : null}

      {!loading && error ? (
        <div className="relic-detail-page__error" role="alert">
          <p>{error}</p>
          <button type="button" className="relic-detail-page__back" onClick={goCatalog}>
            Back to catalog
          </button>
        </div>
      ) : null}

      {!loading && !error && relic ? (
        <div className="relic-detail-page__body">
          <RelicDetail relic={relic} detailLoading={false} />
        </div>
      ) : null}
    </div>
  );
}
