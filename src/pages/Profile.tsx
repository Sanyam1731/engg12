import { useState } from 'react';
import { useApp } from '../context';
import { CATEGORIES } from '../utils';

export default function Profile() {
  const { user, updateUser, prefs } = useApp();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    mobile: user?.mobile || '',
    category: user?.category || 'OPEN',
    percentile: user?.percentile != null ? String(user.percentile) : '',
    rank: user?.rank != null ? String(user.rank) : '',
    city: user?.city || '',
    dreamBranches: user?.dreamBranches?.join(', ') || '',
  }));
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  function save(e: React.FormEvent) {
    e.preventDefault();
    updateUser({
      name: form.name,
      mobile: form.mobile,
      category: form.category,
      percentile: form.percentile ? Number(form.percentile) : undefined,
      rank: form.rank ? Number(form.rank) : undefined,
      city: form.city,
      dreamBranches: form.dreamBranches
        ? form.dreamBranches
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : [],
    });
    setEdit(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const initials = (user.name || user.email)
    .split(/\s+/)
    .map(s => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-cover" />
        <div className="profile-avatar">{initials}</div>
        <div className="profile-head">
          <h1 className="profile-name">{user.name || 'Student'}</h1>
          <p className="profile-email">{user.email}</p>
          <div className="profile-meta">
            {user.category && <span className="modal-chip pchip-cat">{user.category}</span>}
            {user.percentile != null && (
              <span className="modal-chip pchip-pct">{user.percentile.toFixed(2)} %ile</span>
            )}
            {user.city && <span className="modal-chip pchip-city">{user.city}</span>}
            <span className="modal-chip pchip-pref">{prefs.length} preferences</span>
          </div>
        </div>

        {!edit ? (
          <div className="profile-details">
            <Detail label="Mobile" value={user.mobile || '—'} />
            <Detail label="Category" value={user.category || '—'} />
            <Detail
              label="Percentile"
              value={user.percentile != null ? user.percentile.toString() : '—'}
            />
            <Detail label="Rank" value={user.rank != null ? user.rank.toString() : '—'} />
            <Detail label="Home city" value={user.city || '—'} />
            <Detail
              label="Dream branches"
              value={user.dreamBranches?.length ? user.dreamBranches.join(', ') : '—'}
              full
            />
            <button className="btn-primary btn-block" onClick={() => setEdit(true)}>
              Edit profile
            </button>
            {saved && <div className="auth-ok">Saved ✓</div>}
          </div>
        ) : (
          <form className="auth-form auth-form-grid profile-form" onSubmit={save}>
            <label className="field">
              <span className="field-lbl">Full name</span>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-lbl">Mobile</span>
              <input
                value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-lbl">Category</span>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-lbl">Percentile</span>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="100"
                value={form.percentile}
                onChange={e => setForm({ ...form, percentile: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-lbl">Rank</span>
              <input
                type="number"
                min="0"
                value={form.rank}
                onChange={e => setForm({ ...form, rank: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-lbl">Home city</span>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </label>
            <label className="field field-full">
              <span className="field-lbl">Dream branches (comma separated)</span>
              <input
                value={form.dreamBranches}
                onChange={e => setForm({ ...form, dreamBranches: e.target.value })}
                placeholder="Computer Science, IT, AI & Data Science"
              />
            </label>
            <button className="btn-primary btn-block field-full" type="submit">
              Save changes
            </button>
            <button
              type="button"
              className="btn-ghost-block field-full"
              onClick={() => setEdit(false)}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={'detail-row' + (full ? ' detail-full' : '')}>
      <div className="detail-lbl">{label}</div>
      <div className="detail-val">{value}</div>
    </div>
  );
}
