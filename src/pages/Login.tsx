import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context';

export default function Login() {
  const { login } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const error = login(email, password);
    if (error) {
      setErr(error);
      return;
    }
    const redirect = (loc.state as { from?: string } | null)?.from || '/dashboard';
    nav(redirect, { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-anim">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to explore colleges and build your preferences</p>

        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span className="field-lbl">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span className="field-lbl">Password</span>
            <div className="field-pw">
              <input
                type={show ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShow(s => !s)}
                aria-label="Toggle password"
              >
                {show ? '🙈' : '👁'}
              </button>
            </div>
          </label>
          {err && <div className="auth-err">{err}</div>}
          <button className="btn-primary btn-block" type="submit">
            Sign in
          </button>
        </form>

        <div className="auth-foot">
          New here?{' '}
          <Link to="/signup" className="auth-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
