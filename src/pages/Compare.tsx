import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import type { College, RoundNum } from '../types';
import { getCity } from '../utils';

export default function Compare() {
  const { compareList, toggleCompare, colleges } = useApp();
  const nav = useNavigate();
  const [round, setRound] = useState<RoundNum>(1);
  const [category, setCategory] = useState('OPEN');

  const selected = useMemo<College[]>(
    () => compareList.map(cc => colleges.find(c => c.cc === cc)).filter((c): c is College => !!c),
    [compareList, colleges]
  );

  if (selected.length === 0) {
    return (
      <div className="compare-page">
        <div className="page-hero">
          <div className="hero-icon hero-icon-purple">
            <svg viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </div>
          <div>
            <h1 className="hero-title">Compare colleges</h1>
            <p className="hero-sub">Pick up to 3 colleges from the Explorer to compare</p>
          </div>
        </div>
        <div className="compare-empty">
          <h3>Nothing selected yet</h3>
          <p>
            Open the Explorer, hover a college card, and click the <strong>⇄</strong> badge in the
            top-right to add it here. Pick 2 or 3 colleges to compare side-by-side.
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => nav('/explorer')}
          >
            Go to Explorer
          </button>
        </div>
      </div>
    );
  }

  const allCats = [
    ...new Set(
      selected.flatMap(c =>
        Object.values(c.branches).flatMap(b =>
          [...b.r1cuts, ...b.r2cuts, ...b.r3cuts, ...b.r4cuts].map(cut => cut.cat)
        )
      )
    ),
  ].sort();

  function lowestForCollege(c: College, r: RoundNum, cat: string): number | null {
    const rKey = `r${r}cuts` as 'r1cuts' | 'r2cuts' | 'r3cuts' | 'r4cuts';
    let lowest: number | null = null;
    for (const b of Object.values(c.branches)) {
      for (const cut of b[rKey]) {
        if (cut.src !== 'CET' || cut.p == null) continue;
        const u = cut.cat.toUpperCase();
        const matches =
          cat === 'OPEN' ? u.includes('OPEN') : u === cat || u.startsWith(cat + ' ') || u.startsWith(cat + '-');
        if (!matches) continue;
        if (lowest == null || cut.p < lowest) lowest = cut.p;
      }
    }
    return lowest;
  }

  function bestBranchForCollege(c: College, r: RoundNum, cat: string): { name: string; p: number } | null {
    const rKey = `r${r}cuts` as 'r1cuts' | 'r2cuts' | 'r3cuts' | 'r4cuts';
    let best: { name: string; p: number } | null = null;
    for (const b of Object.values(c.branches)) {
      for (const cut of b[rKey]) {
        if (cut.src !== 'CET' || cut.p == null) continue;
        const u = cut.cat.toUpperCase();
        const matches =
          cat === 'OPEN' ? u.includes('OPEN') : u === cat || u.startsWith(cat + ' ') || u.startsWith(cat + '-');
        if (!matches) continue;
        if (!best || cut.p < best.p) best = { name: b.rn, p: cut.p };
      }
    }
    return best;
  }

  return (
    <div className="compare-page">
      <div className="page-hero">
        <div className="hero-icon hero-icon-purple">
          <svg viewBox="0 0 24 24">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </div>
        <div>
          <h1 className="hero-title">Compare colleges</h1>
          <p className="hero-sub">Side-by-side cut-off comparison</p>
        </div>
      </div>

      <div className="pred-form">
        <label className="field">
          <span className="field-lbl">CAP Round</span>
          <select value={round} onChange={e => setRound(Number(e.target.value) as RoundNum)}>
            <option value={1}>Round 1</option>
            <option value={2}>Round 2</option>
            <option value={3}>Round 3</option>
            <option value={4}>Round 4</option>
          </select>
        </label>
        <label className="field">
          <span className="field-lbl">Category</span>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="OPEN">OPEN</option>
            {allCats.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="compare-grid" style={{ marginTop: 16 }}>
        <table className="compare-table">
          <thead>
            <tr>
              <th style={{ minWidth: 140 }}></th>
              {selected.map(c => (
                <th key={c.cc} className="ct-cell">
                  <div className="ct-cn">
                    {c.cn.includes(',') ? c.cn.substring(0, c.cn.lastIndexOf(',')) : c.cn}
                  </div>
                  <div className="ct-cc">{c.cc}</div>
                  <button className="ct-rm" onClick={() => toggleCompare(c.cc)}>
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ct-row-lbl">City</td>
              {selected.map(c => (
                <td key={c.cc} className="ct-cell">
                  {getCity(c.cn) || <span className="compare-empty-cell">—</span>}
                </td>
              ))}
            </tr>
            <tr>
              <td className="ct-row-lbl">Branches</td>
              {selected.map(c => (
                <td key={c.cc} className="ct-cell">
                  <span className="compare-num">{Object.keys(c.branches).length}</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="ct-row-lbl">Rounds with data</td>
              {selected.map(c => {
                const rs = ([1, 2, 3, 4] as RoundNum[]).filter(r =>
                  Object.values(c.branches).some(b => b[`r${r}cuts` as const].length > 0)
                );
                return (
                  <td key={c.cc} className="ct-cell">
                    <div className="compare-rounds-row">
                      {rs.map(r => (
                        <span key={r} className={'bcnt bcnt-r' + r}>
                          R{r}
                        </span>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="ct-row-lbl">
                Lowest cut-off
                <br />
                <small style={{ fontWeight: 600, color: 'var(--muted)' }}>
                  (R{round} · {category})
                </small>
              </td>
              {selected.map(c => {
                const v = lowestForCollege(c, round, category);
                return (
                  <td key={c.cc} className="ct-cell">
                    {v != null ? (
                      <span className="compare-num">{v.toFixed(2)} %ile</span>
                    ) : (
                      <span className="compare-empty-cell">No data</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="ct-row-lbl">
                Best branch
                <br />
                <small style={{ fontWeight: 600, color: 'var(--muted)' }}>
                  (R{round} · {category})
                </small>
              </td>
              {selected.map(c => {
                const b = bestBranchForCollege(c, round, category);
                return (
                  <td key={c.cc} className="ct-cell">
                    {b ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {b.p.toFixed(2)} %ile
                        </div>
                      </>
                    ) : (
                      <span className="compare-empty-cell">No data</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="ct-row-lbl">All branches</td>
              {selected.map(c => (
                <td key={c.cc} className="ct-cell">
                  <ul style={{ paddingLeft: 16, margin: 0, fontSize: 11, color: 'var(--text)' }}>
                    {Object.values(c.branches)
                      .slice(0, 8)
                      .map((b, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>
                          {b.rn}
                        </li>
                      ))}
                    {Object.keys(c.branches).length > 8 && (
                      <li style={{ color: 'var(--muted)' }}>
                        +{Object.keys(c.branches).length - 8} more
                      </li>
                    )}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button className="btn-ghost-block" onClick={() => nav('/explorer')}>
          Add more colleges
        </button>
      </div>
    </div>
  );
}
