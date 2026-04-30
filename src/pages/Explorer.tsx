import { memo, useMemo, useState } from 'react';
import { useApp } from '../context';
import type { College, RoundNum } from '../types';
import { getCity, sh } from '../utils';
import CollegeModal from '../components/CollegeModal';

export default function Explorer() {
  const { colleges, loading, loadError, compareList, toggleCompare } = useApp();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [branch, setBranch] = useState('');
  const [active, setActive] = useState<College | null>(null);

  const compareSet = useMemo(() => new Set(compareList), [compareList]);

  const cityOptions = useMemo(
    () => [...new Set(colleges.map(c => getCity(c.cn)).filter(Boolean))].sort(),
    [colleges]
  );
  const branchOptions = useMemo(
    () => [...new Set(colleges.flatMap(c => Object.values(c.branches).map(b => b.rn)))].sort(),
    [colleges]
  );

  const filtColleges = useMemo(() => {
    const q = search.toLowerCase().trim();
    return colleges.filter(col => {
      const mq = !q || col.cn.toLowerCase().includes(q) || col.cc.includes(q);
      const mc = !city || getCity(col.cn) === city;
      const mb = !branch || Object.values(col.branches).some(b => b.rn === branch);
      return mq && mc && mb;
    });
  }, [colleges, search, city, branch]);

  const totals = useMemo(() => {
    const sum = (key: 'r1cuts' | 'r2cuts' | 'r3cuts' | 'r4cuts') =>
      filtColleges.reduce(
        (s, c) => s + Object.values(c.branches).reduce((s2, b) => s2 + b[key].length, 0),
        0
      );
    return {
      r1: sum('r1cuts'),
      r2: sum('r2cuts'),
      r3: sum('r3cuts'),
      r4: sum('r4cuts'),
    };
  }, [filtColleges]);

  return (
    <>
      <div className="controls">
        <div className="controls-row">
          <div className="search-box">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              placeholder="Search college name or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="controls-row">
          <select className="filter-sel" value={city} onChange={e => setCity(e.target.value)}>
            <option value="">All cities</option>
            {cityOptions.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="filter-sel" value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="">All branches</option>
            {branchOptions.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="stat-bar">
          <div className="chip">
            <strong>{filtColleges.length}</strong> colleges
          </div>
          <div className="chip chip-r1">
            <strong>{totals.r1.toLocaleString()}</strong> R1
          </div>
          <div className="chip chip-r2">
            <strong>{totals.r2.toLocaleString()}</strong> R2
          </div>
          <div className="chip chip-r3">
            <strong>{totals.r3.toLocaleString()}</strong> R3
          </div>
          <div className="chip chip-r4">
            <strong>{totals.r4.toLocaleString()}</strong> R4
          </div>
        </div>
      </div>

      <p className="info-bar">
        {colleges.length > 0 &&
          (filtColleges.length < colleges.length ? (
            <>
              Showing <strong>{filtColleges.length}</strong> of <strong>{colleges.length}</strong>{' '}
              colleges
            </>
          ) : (
            <>
              All <strong>{colleges.length}</strong> colleges
            </>
          ))}
      </p>

      {loading && (
        <div className="spin-wrap">
          {loadError ? (
            <p style={{ color: 'red' }}>Error: {loadError}</p>
          ) : (
            <>
              <div className="spinner"></div>
              <p style={{ marginTop: 12 }}>Loading all 4 rounds…</p>
            </>
          )}
        </div>
      )}

      {!loading && !loadError && (
        <div className="cards-grid">
          {filtColleges.length === 0 ? (
            <div className="no-results">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No colleges found</p>
              <p>Try clearing the filters</p>
            </div>
          ) : (
            filtColleges.map(col => (
              <CollegeCard
                key={col.cc}
                col={col}
                onOpen={setActive}
                compareOn={compareSet.has(col.cc)}
                onToggleCompare={toggleCompare}
              />
            ))
          )}
        </div>
      )}

      <CollegeModal college={active} onClose={() => setActive(null)} />
    </>
  );
}

const CollegeCard = memo(function CollegeCard({
  col,
  onOpen,
  compareOn,
  onToggleCompare,
}: {
  col: College;
  onOpen: (c: College) => void;
  compareOn: boolean;
  onToggleCompare: (cc: string) => boolean;
}) {
  const branches = Object.values(col.branches);
  const cityName = getCity(col.cn);
  const displayName =
    cityName && col.cn.includes(',')
      ? col.cn.substring(0, col.cn.lastIndexOf(',')).trim()
      : col.cn;
  const totalRounds = ([1, 2, 3, 4] as RoundNum[]).filter(r =>
    branches.some(b => b[`r${r}cuts` as const].length > 0)
  ).length;
  const chips = branches.slice(0, 2).map(b => {
    const s = sh(b.rn);
    return s.length > 15 ? s.slice(0, 14) + '…' : s;
  });
  const moreCount = branches.length > 2 ? branches.length - 2 : 0;
  return (
    <div
      className={'college-card' + (compareOn ? ' compare-on' : '')}
      onClick={() => onOpen(col)}
    >
      <button
        className={'compare-toggle' + (compareOn ? ' on' : '')}
        onClick={e => {
          e.stopPropagation();
          onToggleCompare(col.cc);
        }}
        title={compareOn ? 'Remove from compare' : 'Add to compare'}
        aria-label="Toggle compare"
      >
        {compareOn ? (
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
        )}
      </button>
      <div className="card-body">
        <div className="card-top-row">
          <span className="card-code">{col.cc}</span>
        </div>
        <div className="card-name">{displayName}</div>
        {cityName && (
          <div className="card-city">
            <svg viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {cityName}
          </div>
        )}
        <div className="card-stat">
          <svg viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          {branches.length} branch{branches.length !== 1 ? 'es' : ''}
        </div>
        <div className="card-stat">
          <svg viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {totalRounds} round{totalRounds !== 1 ? 's' : ''} available &nbsp;·&nbsp; click to view
        </div>
      </div>
      <div className="card-footer">
        <div className="branch-chips">
          {chips.map((s, i) => (
            <span key={i} className="bchip">
              {s}
            </span>
          ))}
          {moreCount > 0 && <span className="bchip bchip-more">+{moreCount}</span>}
        </div>
        <div className="card-arrow">
          <svg viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
});
