import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { ConfirmActionDialog, type ConfirmActionState } from '@/app/components/ConfirmActionDialog';
import { parseApiError } from '@/app/utils/api';

type CommentRow = {
  id: number;
  user_id: number;
  relic_id: string;
  username: string;
  text: string;
  likes: number;
  created_at: string;
};

const thStyle = 'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50';
const tdStyle = 'px-4 py-3 text-sm text-white/80 align-top break-words';

const panelBg = { background: '#1a1a2e', border: '1px solid #2a2a3d' };

export function AdminComments() {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmActionState | null>(null);

  const fetchComments = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetch('/admin/comments', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return [];
        }
        return res.json();
      })
      .then((data: unknown[]) => setComments(Array.isArray(data) ? (data as CommentRow[]) : []))
      .catch(() => toast.error('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const requestDelete = (target: CommentRow) => {
    setConfirm({
      title: 'Delete comment?',
      description: `Remove this comment by ${target.username}? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        if (!user) return;
        setConfirm(null);
        const res = await fetch(`/admin/comments/${target.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return;
        }
        toast.success('Comment deleted');
        fetchComments();
      },
    });
  };

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        Comments
      </h1>

      {loading ? (
        <p className="text-white/50 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Loading...</p>
      ) : (
        <div className="max-w-full overflow-hidden rounded-2xl" style={panelBg}>
          <div className="max-w-full overflow-x-auto [scrollbar-gutter:stable]">
            <table className="w-full min-w-[640px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              <thead style={{ background: '#151525' }}>
                <tr>
                  <th className={thStyle}>ID</th>
                  <th className={thStyle}>Username</th>
                  <th className={thStyle}>Relic</th>
                  <th className={thStyle}>Text</th>
                  <th className={thStyle}>Likes</th>
                  <th className={thStyle}>Created</th>
                  <th className={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: '#2a2a3d' }}>
                    <td className={tdStyle}>{c.id}</td>
                    <td className={tdStyle}>{c.username}</td>
                    <td className={tdStyle}>
                      <Link
                        to={`/relics/${encodeURIComponent(c.relic_id)}`}
                        className="text-indigo-400 hover:text-indigo-300 no-underline"
                      >
                        {c.relic_id}
                      </Link>
                    </td>
                    <td className={tdStyle}>
                      <span className="line-clamp-3 max-w-[240px] break-words sm:max-w-[280px]">{c.text}</span>
                    </td>
                    <td className={tdStyle}>{c.likes}</td>
                    <td className={tdStyle} style={{ color: '#ffffff66' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className={tdStyle}>
                      <button
                        type="button"
                        onClick={() => requestDelete(c)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          color: '#f87171',
                          background: 'rgba(248,113,113,0.1)',
                          border: '1px solid rgba(248,113,113,0.3)',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {comments.length === 0 ? (
            <p className="px-4 py-8 text-center text-white/30 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              No comments found
            </p>
          ) : null}
        </div>
      )}

      <ConfirmActionDialog
        state={confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}
