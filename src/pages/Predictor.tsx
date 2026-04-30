import { useMemo, useState } from 'react';
import { useApp } from '../context';
import type { College, RoundNum } from '../types';
import { CATEGORIES, getCity, sh } from '../utils';
import CollegeModal from '../components/CollegeModal';

type PredictionTier = 'safe' | 'moderate' | 'reach';
type Prediction = {
  college: College;
  branchCode: string;
  branchName: string;
  cutoffPercentile: number;
  cutoffRank: number | null;
  category: string;
  delta: number;
  tier: PredictionTier;
  round: RoundNum;
};

export default function Predictor() {
  const { colleges, user } = useApp();
  const [percentile, setPercentile] = useState<string>(
    user?.percentile ? String(user.percentile) : ''
  );
  const [category, setCategory] = useState<string>(user?.category || 'OPEN');
  const [round, setRound] = useState<RoundNum>(1);
  const [city, setCity] = useState('');
  const [branchQ, setBranchQ] = useState('');
  const [active, setActive] = useState<College | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const cityOptions = useMemo(
    () => [...new Set(colleges.map(c => getCity(c.cn)).filter(Boolean))].sort(),
    [colleges]
  );

  const predictions = useMemo<Prediction[]>(() => {
    if (!submitted) return [];
    const p = Number(percentile);
    if (!p || isNaN(p)) return [];
    const out: Prediction[] = [];
    const rKey = `r${round}cuts` as 'r1cuts' | 'r2cuts' | 'r3cuts' | 'r4cuts';
    const catU = category.toUpperCase();
    for (const col of colleges) {
      if (city && getCity(col.cn) !== city) continue;
      for (const [rc, b] of Object.entries(col.branches)) {
        if (branchQ && !b.rn.toLowerCase().includes(branchQ.toLowerCase())) continue;
        const cuts = b[rKey].filter(c => c.src === 'CET' && c.cat && c.p != null);
        const matching = cuts.filter(c => {
          const u = c.cat.toUpperCase();
          if (catU === 'OPEN') return u.includes('OPEN');
          return u === catU || u.startsWith(catU + ' ') || u.startsWith(catU + '-');
        });
        if (!matching.length) continue;
        const lowest = matching.reduce((a, c) => ((c.p ?? 100) < (a.p ?? 100) ? c : a));
        const cutP = lowest.p ?? 100;
        if (cutP > p + 0.5) continue;
        const delta = p - cutP;
        const tier: PredictionTier = delta >= 5 ? 'safe' : delta >= 1.5 ? 'moderate' : 'reach';
        out.push({
          college: col,
          branchCode: rc,
          branchName: b.rn,
          cutoffPercentile: cutP,
          cutoffRank: lowest.r,
          category: lowest.cat,
          delta,
          tier,
          round,
        });
      }
    }
    out.sort((a, z) => z.cutoffPercentile - a.cutoffPercentile);
    return out;
  }, [submitted, percentile, category, round, city, branchQ, colleges]);

  const tierCounts = useMemo(
    () => ({
      safe: predictions.filter(p => p.tier === 'safe').length,
      moderate: predictions.filter(p => p.tier === 'moderate').length,
      reach: predictions.filter(p => p.tier === 'reach').length,
    }),
    [predictions]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="predictor-page">
      <div className="page-hero predictor-hero">
        <div className="hero-icon hero-icon-purple">
          <svg viewBox="0 0 24 24">
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <div>
          <h1 className="hero-title">College Predictor</h1>
          <p className="hero-sub">Find colleges where you're likely to get admission</p>
        </div>
      </div>

      <form className="pred-form" onSubmit={submit}>
        <label className="field">
          <span className="field-lbl">Your CET Percentile *</span>
          <input
            type="number"
            step="0.0001"
            min="0"
            max="100"
            required
            value={percentile}
            onChange={e => setPercentile(e.target.value)}
            placeholder="e.g. 95.6432"
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
          <span className="field-lbl">CAP Round</span>
          <select
            value={round}
            onChange={e => setRound(Number(e.target.value) as RoundNum)}
          >
            <option value={1}>Round 1</option>
            <option value={2}>Round 2</option>
            <option value={3}>Round 3</option>
            <option value={4}>Round 4</option>
          </select>
        </label>
        <label className="field">
          <span className="field-lbl">City (optional)</span>
          <select value={city} onChange={e => setCity(e.target.value)}>
            <option value="">Any city</option>
            {cityOptions.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-full">
          <span className="field-lbl">Branch keyword (optional)</span>
          <input
            value={branchQ}
            onChange={e => setBranchQ(e.target.value)}
            placeholder="Computer / Mechanical / Civil / …"
          />
        </label>
        <button className="btn-primary btn-block field-full" type="submit">
          Predict colleges
        </button>
      </form>

      {submitted && (
        <>
          <div className="tier-bar">
            <div className="tier-chip tier-safe">
              <span className="tier-dot"></span>
              <strong>{tierCounts.safe}</strong> Safe
            </div>
            <div className="tier-chip tier-mod">
              <span className="tier-dot"></span>
              <strong>{tierCounts.moderate}</strong> Moderate
            </div>
            <div className="tier-chip tier-reach">
              <span className="tier-dot"></span>
              <strong>{tierCounts.reach}</strong> Reach
            </div>
            <div className="tier-meta">{predictions.length} matches</div>
          </div>

          <div className="pred-list">
            {predictions.length === 0 ? (
              <div className="no-results">
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  No matches in Round {round}
                </p>
                <p>Try a different round or relax the filters</p>
              </div>
            ) : (
              predictions.map((p, i) => (
                <div
                  key={`${p.college.cc}-${p.branchCode}`}
                  className={'pred-row tier-' + p.tier + ' card-anim'}
                  style={{ animationDelay: `${Math.min(i * 18, 400)}ms` }}
                  onClick={() => setActive(p.college)}
                >
                  <div className={'pred-tier-bar tier-' + p.tier}></div>
                  <div className="pred-row-main">
                    <div className="pred-cc">{p.college.cc}</div>
                    <div className="pred-cn">
                      {p.college.cn.includes(',')
                        ? p.college.cn.substring(0, p.college.cn.lastIndexOf(','))
                        : p.college.cn}
                    </div>
                    <div className="pred-bn">{sh(p.branchName)}</div>
                  </div>
                  <div className="pred-row-stats">
                    <div className="pred-cut">
                      <div className="pred-cut-val">{p.cutoffPercentile.toFixed(2)}</div>
                      <div className="pred-cut-lbl">cutoff %</div>
                    </div>
                    <div className={'pred-delta tier-' + p.tier}>
                      {p.delta >= 0 ? '+' : ''}
                      {p.delta.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <CollegeModal college={active} onClose={() => setActive(null)} />
    </div>
  );
}
