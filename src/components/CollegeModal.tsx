import { useEffect, useMemo, useState } from 'react';
import type { Branch, College, RoundKey, RoundNum } from '../types';
import { catCls, getCity } from '../utils';
import { useApp } from '../context';

type Props = {
  college: College | null;
  onClose: () => void;
};

export default function CollegeModal({ college, onClose }: Props) {
  const { addPref, hasPref, trackView } = useApp();
  const [round, setRound] = useState<RoundNum>(1);
  const [mSrch, setMSrch] = useState('');
  const [mCat, setMCat] = useState('');
  const [openBranches, setOpenBranches] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!college) return;
    const branches = Object.values(college.branches);
    const rTotals = ([1, 2, 3, 4] as RoundNum[]).map(r => ({
      r,
      t: branches.reduce((s, b) => s + b[`r${r}cuts` as const].length, 0),
    }));
    setRound(rTotals.find(x => x.t > 0)?.r || 1);
    setMSrch('');
    setMCat('');
    setOpenBranches({});
    trackView(college.cc);
  }, [college, trackView]);

  useEffect(() => {
    if (!college) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [college]);

  useEffect(() => {
    if (!college) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [college, onClose]);

  if (!college) return null;

  function overlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function tryAdd(branchCode: string, branchName: string) {
    if (!college) return;
    const ok = addPref({
      collegeCode: college.cc,
      collegeName: college.cn,
      branchCode,
      branchName,
    });
    setToast(ok ? 'Added to preferences ✓' : 'Already in preferences');
    setTimeout(() => setToast(null), 1600);
  }

  const branches = Object.values(college.branches);
  const branchKeys = Object.keys(college.branches);
  const cityName = getCity(college.cn);
  const rTotals = ([1, 2, 3, 4] as RoundNum[]).map(r => ({
    r,
    t: branches.reduce((s, b) => s + b[`r${r}cuts` as const].length, 0),
  }));
  const allCats = [
    ...new Set(
      branches.flatMap(b => [...b.r1cuts, ...b.r2cuts, ...b.r3cuts, ...b.r4cuts].map(c => c.cat))
    ),
  ].sort();

  const rKey = `r${round}cuts` as RoundKey;
  const hCls = `h-r${round}`;
  const q = mSrch.toLowerCase();
  const items = branches
    .map((b, i) => ({ b, rc: branchKeys[i] }))
    .filter(({ b }) => {
      const mq = !q || b.rn.toLowerCase().includes(q);
      const hasCuts = b[rKey].length > 0;
      const catOk = !mCat || b[rKey].some(c => c.cat === mCat);
      return mq && hasCuts && catOk;
    });

  return (
    <div className="modal-overlay open" onClick={overlayClick}>
      <div className="modal">
        <div className="modal-hdr">
          <div className="modal-hdr-top">
            <div style={{ minWidth: 0 }}>
              <div className="modal-cc">{college.cc}</div>
              <div className="modal-cn">{college.cn}</div>
              <div className="modal-meta">
                <span className="modal-chip">{branches.length} branches</span>
                {rTotals
                  .filter(x => x.t > 0)
                  .map(x => (
                    <span
                      key={x.r}
                      className="modal-chip"
                      style={{ background: 'rgba(255,255,255,.15)' }}
                    >
                      R{x.r}: {x.t}
                    </span>
                  ))}
                {cityName && <span className="modal-chip">{cityName}</span>}
              </div>
            </div>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="modal-rtabs">
          {([1, 2, 3, 4] as RoundNum[]).map(v => (
            <button
              key={v}
              className={'modal-rtab' + (v === round ? ' on' : '')}
              onClick={() => setRound(v)}
            >
              <span className={'dot dot-r' + v}></span>Round {v}
            </button>
          ))}
        </div>
        <div className="modal-filters">
          <input
            placeholder="Filter branches…"
            value={mSrch}
            onChange={e => setMSrch(e.target.value)}
          />
          <select value={mCat} onChange={e => setMCat(e.target.value)}>
            <option value="">All categories</option>
            {allCats.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-body">
          {items.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)' }}>
              No data for Round {round} with current filters
            </div>
          ) : (
            items.map(({ b, rc }, idx) => (
              <BranchBlock
                key={rc}
                b={b}
                rc={rc}
                round={round}
                rKey={rKey}
                hCls={hCls}
                mCat={mCat}
                isFirst={idx === 0}
                openBranches={openBranches}
                setOpenBranches={setOpenBranches}
                inPrefs={hasPref(college.cc, rc)}
                onAdd={() => tryAdd(rc, b.rn)}
              />
            ))
          )}
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

type BranchBlockProps = {
  b: Branch;
  rc: string;
  round: RoundNum;
  rKey: RoundKey;
  hCls: string;
  mCat: string;
  isFirst: boolean;
  openBranches: Record<string, boolean>;
  setOpenBranches: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  inPrefs: boolean;
  onAdd: () => void;
};

function BranchBlock({
  b,
  rc,
  round,
  rKey,
  hCls,
  mCat,
  isFirst,
  openBranches,
  setOpenBranches,
  inPrefs,
  onAdd,
}: BranchBlockProps) {
  const isOpen = openBranches[rc] !== undefined ? openBranches[rc] : isFirst;

  const cuts = useMemo(
    () =>
      b[rKey]
        .filter(c => !mCat || c.cat === mCat)
        .slice()
        .sort((a, z) => {
          if (a.src !== z.src) return a.src === 'CET' ? -1 : 1;
          return (a.r || 999999) - (z.r || 999999);
        }),
    [b, rKey, mCat]
  );

  const trend = useMemo(() => {
    const lowest = (key: RoundKey) => {
      const open = b[key].filter(c => c.src === 'CET' && c.cat?.toUpperCase().includes('OPEN'));
      if (!open.length) return null;
      return open.reduce((m, c) => (c.p != null && (m == null || c.p < m) ? c.p : m), null as number | null);
    };
    return [
      lowest('r1cuts'),
      lowest('r2cuts'),
      lowest('r3cuts'),
      lowest('r4cuts'),
    ];
  }, [b]);

  const aiCnt = cuts.filter(c => c.src === 'AI').length;
  const cetCnt = cuts.filter(c => c.src === 'CET').length;

  return (
    <div className="branch-block">
      <div className={'branch-hdr-row' + (isOpen ? ' open' : '')}>
        <button
          className="branch-hdr"
          onClick={() => setOpenBranches(prev => ({ ...prev, [rc]: !isOpen }))}
        >
          <div className="branch-info">
            <div className="branch-name">{b.rn}</div>
            <div className="branch-code">{rc}</div>
            <TrendStrip values={trend} />
          </div>
          <div className="branch-cnts">
            {cetCnt > 0 && <span className={'bcnt bcnt-r' + round}>{cetCnt} CET</span>}
            {aiCnt > 0 && <span className="bcnt bcnt-ai">{aiCnt} AI</span>}
          </div>
          <svg className="branch-chev" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button
          className={'pref-add-btn' + (inPrefs ? ' added' : '')}
          onClick={e => {
            e.stopPropagation();
            if (!inPrefs) onAdd();
          }}
          title={inPrefs ? 'Already added' : 'Add to preferences'}
          disabled={inPrefs}
        >
          {inPrefs ? (
            <svg viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
      </div>
      {isOpen && (
        <div className="branch-body open">
          <table className="cuts-tbl">
            <thead className={hCls}>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Rank</th>
                <th>Percentile</th>
              </tr>
            </thead>
            <tbody>
              {cuts.map((c, i) => (
                <tr key={i} className={c.src === 'AI' ? 'ai-row' : ''}>
                  <td style={{ color: '#bbb', fontSize: 10 }}>{i + 1}</td>
                  <td>
                    <span className={'badge ' + catCls(c.cat)}>{c.cat}</span>
                  </td>
                  <td>
                    <div className="t-rank">
                      {c.r != null ? Number(c.r).toLocaleString() : '—'}
                    </div>
                  </td>
                  <td>
                    <div className="t-pct">
                      {c.p != null ? Number(c.p).toFixed(2) : '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TrendStrip({ values }: { values: (number | null)[] }) {
  const validVals = values.filter((v): v is number => v != null);
  if (validVals.length < 2) return null;
  const min = Math.min(...validVals);
  const max = Math.max(...validVals);
  const range = max - min || 1;
  return (
    <div className="trend-strip" title="OPEN cut-off across rounds (lower = harder)">
      {values.map((v, i) => {
        if (v == null) {
          return (
            <span key={i} className="trend-cell trend-empty">
              <span className="trend-rlbl">R{i + 1}</span>
              <span className="trend-bar"></span>
              <span className="trend-pct">—</span>
            </span>
          );
        }
        const h = 4 + ((v - min) / range) * 16;
        return (
          <span key={i} className="trend-cell">
            <span className="trend-rlbl">R{i + 1}</span>
            <span className="trend-bar" style={{ height: `${h}px` }}></span>
            <span className="trend-pct">{v.toFixed(1)}</span>
          </span>
        );
      })}
    </div>
  );
}
