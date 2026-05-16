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

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);

      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || 'Invalid credentials');
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
      setError(err instanceof Error ? err.message : 'Login failed');
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
          Welcome Back
        </h1>
        <p
          className="text-center mb-8 text-sm sm:text-base"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--relic-text-muted)' }}
        >
          Sign in to your account to continue
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
              htmlFor="login-username"
            >
              Username
            </label>
            <input
              id="login-username"
              type="text"
              className={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
              htmlFor="login-password"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
        >
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium hover:underline"
            style={{ color: 'var(--relic-accent-bright)' }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}