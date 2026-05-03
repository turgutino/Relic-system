import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import RelicDetail from '../components/RelicDetail.jsx';
import { normalizeRelic } from '../models/relic.js';
import './RelicDetailPage.css';

/** @typedef {import('../models/relic.js').Relic} Relic */

export default function RelicDetailPage() {
  const { id: rawId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [relic, setRelic] = useState(/** @type {Relic|null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [relatedRelics, setRelatedRelics] = useState(/** @type {Relic[]} */ ([]));
  const [relatedLoading, setRelatedLoading] = useState(false);

  const id = rawId ?? '';
  const catalogQs = useMemo(
    () => (typeof location.state?.catalogSearch === 'string' ? location.state.catalogSearch : ''),
    [location.state?.catalogSearch],
  );

  const goCatalogSearch = catalogQs.startsWith('?') ? catalogQs.slice(1) : catalogQs;

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

  useEffect(() => {
    if (!id.trim()) {
      setRelatedRelics([]);
      return undefined;
    }
    const ac = new AbortController();
    setRelatedLoading(true);
    fetch(`/relics/${encodeURIComponent(id)}/related`, { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error('related');
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRelatedRelics(list.map(normalizeRelic).filter(Boolean));
      })
      .catch(() => {
        if (!ac.signal.aborted) setRelatedRelics([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setRelatedLoading(false);
      });
    return () => ac.abort();
  }, [id]);

  const openRelated = (rid) => {
    navigate(`/relics/${encodeURIComponent(String(rid))}`, {
      state: { catalogSearch: catalogQs || '' },
    });
  };

  const goCatalog = () => {
    navigate({ pathname: '/', search: goCatalogSearch ? `?${goCatalogSearch}` : '' });
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
        <>
          <div className="relic-detail-page__body">
            <RelicDetail relic={relic} detailLoading={false} />
          </div>

          <section className="relic-detail-page__related" aria-labelledby="related-heading">
            <h2 id="related-heading" className="relic-detail-page__related-title">
              Related relics
            </h2>
            {relatedLoading ? (
              <p className="relic-detail-page__related-status">Loading related relics…</p>
            ) : relatedRelics.length === 0 ? (
              <p className="relic-detail-page__related-status">No related relics found.</p>
            ) : (
              <ul className="relic-detail-page__related-list">
                {relatedRelics.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="relic-detail-page__related-link" onClick={() => openRelated(r.id)}>
                      <span className="relic-detail-page__related-name">{r.name}</span>
                      {r.dynasty ? (
                        <span className="relic-detail-page__related-meta">{r.dynasty}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
