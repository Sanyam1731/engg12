import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { CATEGORIES } from '../utils';

export default function Signup() {
  const { signup } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState<string>('OPEN');
  const [percentile, setPercentile] = useState<string>('');
  const [city, setCity] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const error = signup({
      email,
      password,
      name,
      mobile,
      category,
      percentile: percentile ? Number(percentile) : undefined,
      city,
      createdAt: Date.now(),
    });
    if (error) {
      setErr(error);
      return;
    }
    nav('/dashboard', { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-anim auth-wide">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Track your dream colleges across all 4 CAP rounds</p>

        <form className="auth-form auth-form-grid" onSubmit={submit}>
          <label className="field">
            <span className="field-lbl">Full name *</span>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Aarav Sharma"
            />
          </label>
          <label className="field">
            <span className="field-lbl">Email *</span>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span className="field-lbl">Password *</span>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
            />
          </label>
          <label className="field">
            <span className="field-lbl">Mobile</span>
            <input
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="+91 9XXXXXXXXX"
            />
          </label>
          <label className="field">
            <span className="field-lbl">Category</span>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-lbl">CET Percentile</span>
            <input
              type="number"
              step="0.0001"
              min="0"
              max="100"
              value={percentile}
              onChange={e => setPercentile(e.target.value)}
              placeholder="e.g. 95.6432"
            />
          </label>
          <label className="field field-full">
            <span className="field-lbl">Home city</span>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Pune / Mumbai / …"
            />
          </label>

          {err && <div className="auth-err field-full">{err}</div>}
          <button className="btn-primary btn-block field-full" type="submit">
            Create account
          </button>
        </form>

        <div className="auth-foot">
          Already a member?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
