import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';

const panelStyle = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const inputStyle =
  'w-full rounded-xl px-4 py-3 text-sm bg-[var(--relic-input-bg)] border border-[var(--relic-border)] text-[var(--relic-text)] placeholder:text-[var(--relic-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--relic-accent-bright)] transition-shadow';

const btnGrad = 'linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)';

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || 'Registration failed');
      }

      const data = await res.json() as {
        access_token: string;
        user_id: number;
        username: string;
        is_admin: boolean;
      };

      login(data.access_token, {
        id: data.user_id,
        username: data.username,
        is_admin: data.is_admin,
      });

      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8"
      style={{ background: 'var(--relic-page)' }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10"
        style={panelStyle}
      >
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl mb-2 text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: 'var(--relic-text)' }}
        >
          Create Account
        </h1>
        <p
          className="text-center mb-8 text-sm sm:text-base"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--relic-text-muted)' }}
        >
          Join the Overseas Relic community
        </p>

        {error && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'var(--relic-error-bg)',
              border: '1px solid var(--relic-error-border)',
              color: 'var(--relic-error-text)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
              htmlFor="reg-username"
            >
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              className={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
              htmlFor="reg-email"
            >
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              className={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
              htmlFor="reg-password"
            >
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              className={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
              htmlFor="reg-confirm"
            >
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              type="password"
              className={inputStyle}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-3 text-base font-medium transition-opacity disabled:opacity-60 mt-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: btnGrad,
              color: 'var(--relic-btn-primary-fg)',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium hover:underline"
            style={{ color: 'var(--relic-accent-bright)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}