import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';

export default function CompareBar() {
  const { compareList, colleges, toggleCompare, clearCompare } = useApp();
  const nav = useNavigate();

  if (compareList.length === 0) return null;

  const map: Record<string, string> = {};
  colleges.forEach(c => (map[c.cc] = c.cn));

  return (
    <div className="compare-bar">
      <span className="compare-bar-lbl">Compare:</span>
      <div className="compare-bar-chips">
        {compareList.map(cc => {
          const cn = map[cc] || cc;
          const short = cn.includes(',') ? cn.substring(0, cn.lastIndexOf(',')) : cn;
          return (
            <span key={cc} className="compare-bar-chip">
              <span title={cn}>{short}</span>
              <button onClick={() => toggleCompare(cc)} aria-label="Remove">
                ×
              </button>
            </span>
          );
        })}
      </div>
      <div className="compare-bar-actions">
        <button
          className="btn-primary"
          disabled={compareList.length < 2}
          onClick={() => nav('/compare')}
        >
          Compare ({compareList.length})
        </button>
        <button className="btn-ghost" onClick={clearCompare} title="Clear">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
