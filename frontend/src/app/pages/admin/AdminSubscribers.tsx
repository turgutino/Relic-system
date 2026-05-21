import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { ConfirmActionDialog, type ConfirmActionState } from '@/app/components/ConfirmActionDialog';
import { parseApiError } from '@/app/utils/api';

type SubscriberRow = {
  id: number;
  email: string;
  created_at: string;
  is_active: boolean;
};

const thStyle = 'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50';
const tdStyle = 'px-4 py-3 text-sm text-white/80 align-top break-words';
const btnBase =
  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors';

const panelBg = { background: '#1a1a2e', border: '1px solid #2a2a3d' };

export function AdminSubscribers() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmActionState | null>(null);

  const fetchSubscribers = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetch('/admin/subscribers', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return [];
        }
        return res.json();
      })
      .then((data: unknown[]) => setSubscribers(Array.isArray(data) ? (data as SubscriberRow[]) : []))
      .catch(() => toast.error('Failed to load subscribers'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const requestDelete = (target: SubscriberRow) => {
    setConfirm({
      title: 'Delete subscriber?',
      description: `Remove ${target.email} from the subscriber list. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        setConfirm(null);
        if (!user) return;
        const res = await fetch(`/admin/subscribers/${target.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return;
        }
        toast.success(`${target.email} has been removed`);
        fetchSubscribers();
      },
    });
  };

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        Subscribers
      </h1>

      {loading ? (
        <p className="text-white/50 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Loading...</p>
      ) : (
        <div className="max-w-full overflow-hidden rounded-2xl" style={panelBg}>
          <div className="max-w-full overflow-x-auto [scrollbar-gutter:stable]">
            <table className="w-full min-w-[500px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              <thead style={{ background: '#151525' }}>
                <tr>
                  <th className={thStyle}>ID</th>
                  <th className={thStyle}>Email</th>
                  <th className={thStyle}>Status</th>
                  <th className={thStyle}>Subscribed</th>
                  <th className={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: '#2a2a3d' }}>
                    <td className={tdStyle}>{s.id}</td>
                    <td className={tdStyle}>{s.email}</td>
                    <td className={tdStyle}>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={tdStyle} style={{ color: '#ffffff66' }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className={tdStyle}>
                      <button
                        type="button"
                        onClick={() => requestDelete(s)}
                        className={btnBase}
                        style={{
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
          {subscribers.length === 0 ? (
            <p className="px-4 py-8 text-center text-white/30 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              No subscribers found
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
