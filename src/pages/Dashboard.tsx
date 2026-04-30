import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import type { College } from '../types';
import { getCity, sh } from '../utils';
import CollegeModal from '../components/CollegeModal';

export default function Dashboard() {
  const { user, colleges, prefs, recentlyViewed, loading } = useApp();
  const nav = useNavigate();
  const [active, setActive] = useState<College | null>(null);

  const stats = useMemo(() => {
    let totalBranches = 0;
    let totalCuts = 0;
    const cities = new Set<string>();
    for (const c of colleges) {
      const bs = Object.values(c.branches);
      totalBranches += bs.length;
      for (const b of bs) {
        totalCuts += b.r1cuts.length + b.r2cuts.length + b.r3cuts.length + b.r4cuts.length;
      }
      const city = getCity(c.cn);
      if (city) cities.add(city);
    }
    return {
      colleges: colleges.length,
      branches: totalBranches,
      cuts: totalCuts,
      cities: cities.size,
    };
  }, [colleges]);

  const recommendations = useMemo<{ college: College; cutoff: number }[]>(() => {
    if (!user?.percentile) return [];
    const cat = (user.category || 'OPEN').toUpperCase();
    const out: { college: College; cutoff: number }[] = [];
    for (const c of colleges) {
      let lowest: number | null = null;
      for (const b of Object.values(c.branches)) {
        for (const cut of b.r1cuts) {
          if (cut.src !== 'CET' || cut.p == null) continue;
          const u = cut.cat?.toUpperCase() || '';
          const matches =
            cat === 'OPEN' ? u.includes('OPEN') : u === cat || u.startsWith(cat + ' ') || u.startsWith(cat + '-');
          if (!matches) continue;
          if (lowest == null || cut.p < lowest) lowest = cut.p;
        }
      }
      if (lowest != null && lowest <= user.percentile && user.percentile - lowest <= 6) {
        out.push({ college: c, cutoff: lowest });
      }
    }
    return out.sort((a, z) => z.cutoff - a.cutoff).slice(0, 5);
  }, [colleges, user]);

  const recentColleges = useMemo<College[]>(
    () =>
      recentlyViewed
        .map(cc => colleges.find(c => c.cc === cc))
        .filter((c): c is College => !!c)
        .slice(0, 5),
    [recentlyViewed, colleges]
  );

  if (!user) return null;
  const firstName = user.name?.split(' ')[0] || 'there';

  return (
    <div className="dash-page">
      <section className="dash-hero">
        <div className="dash-hero-inner">
          <div className="dash-hero-text">
            <p className="dash-greet">Hi {firstName} 👋</p>
            <h1 className="dash-title">Your admissions HQ</h1>
            <p className="dash-sub">
              Explore <strong>{stats.colleges.toLocaleString()}</strong> colleges across{' '}
              <strong>{stats.cities}</strong> cities · <strong>{stats.branches.toLocaleString()}</strong>{' '}
              branches · <strong>{stats.cuts.toLocaleString()}</strong> cut-offs.
            </p>
          </div>
          <div className="dash-hero-stats">
            <div className="dash-stat">
              <div className="dash-stat-num">{prefs.length}</div>
              <div className="dash-stat-lbl">My preferences</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-num">
                {user.percentile != null ? user.percentile.toFixed(2) : '—'}
              </div>
              <div className="dash-stat-lbl">CET %ile</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-num">{user.category || 'OPEN'}</div>
              <div className="dash-stat-lbl">Category</div>
            </div>
          </div>
        </div>
      </section>

      <div className="dash-actions">
        <ActionCard
          title="Explore colleges"
          desc="Browse 372+ colleges with full cut-off history"
          icon={
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          }
          gradient="grad-navy"
          onClick={() => nav('/explorer')}
        />
        <ActionCard
          title="Predict your shot"
          desc="Find safe, moderate, and reach colleges by percentile"
          icon={
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          }
          gradient="grad-purple"
          onClick={() => nav('/predictor')}
        />
        <ActionCard
          title="Build preferences"
          desc={prefs.length === 0 ? 'Save and rank your dream branches' : `${prefs.length} branches saved`}
          icon={
            <svg viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          }
          gradient="grad-gold"
          onClick={() => nav('/preferences')}
        />
        <ActionCard
          title="Compare side-by-side"
          desc="Pick up to 3 colleges and see them head-to-head"
          icon={
            <svg viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          }
          gradient="grad-teal"
          onClick={() => nav('/compare')}
        />
      </div>

      {!loading && user.percentile != null && recommendations.length > 0 && (
        <section className="dash-section">
          <div className="dash-sec-head">
            <h2>Recommended for you</h2>
            <p>
              Top safe matches at <strong>{user.percentile.toFixed(2)} %ile</strong> ({user.category}) — Round 1
            </p>
          </div>
          <div className="dash-rec-list">
            {recommendations.map(({ college, cutoff }) => (
              <button
                key={college.cc}
                className="dash-rec-card"
                onClick={() => setActive(college)}
              >
                <div className="dash-rec-cc">{college.cc}</div>
                <div className="dash-rec-cn">
                  {college.cn.includes(',')
                    ? college.cn.substring(0, college.cn.lastIndexOf(','))
                    : college.cn}
                </div>
                <div className="dash-rec-meta">
                  <span className="dash-rec-cut">{cutoff.toFixed(2)}</span>
                  <span className="dash-rec-cut-lbl">cut-off</span>
                  <span className="dash-rec-delta">
                    +{(user.percentile! - cutoff).toFixed(2)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {user.percentile == null && !loading && (
        <section className="dash-section">
          <div className="dash-tip-card">
            <div className="dash-tip-icon">💡</div>
            <div>
              <h3>Set your percentile to unlock recommendations</h3>
              <p>Add your CET percentile and category in your profile to see colleges that fit your score.</p>
            </div>
            <button className="btn-primary btn-sm" onClick={() => nav('/profile')}>
              Update profile
            </button>
          </div>
        </section>
      )}

      {recentColleges.length > 0 && (
        <section className="dash-section">
          <div className="dash-sec-head">
            <h2>Recently viewed</h2>
            <p>Last {recentColleges.length} colleges you opened</p>
          </div>
          <div className="dash-recent-list">
            {recentColleges.map(c => {
              const branchCount = Object.keys(c.branches).length;
              const cityName = getCity(c.cn);
              const sample = Object.values(c.branches)[0];
              return (
                <button
                  key={c.cc}
                  className="dash-recent-card"
                  onClick={() => setActive(c)}
                >
                  <div className="dash-recent-cc">{c.cc}</div>
                  <div className="dash-recent-cn">
                    {c.cn.includes(',') ? c.cn.substring(0, c.cn.lastIndexOf(',')) : c.cn}
                  </div>
                  <div className="dash-recent-meta">
                    {cityName && <span>📍 {cityName}</span>}
                    <span>
                      {branchCount} branch{branchCount !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  {sample && (
                    <div className="dash-recent-bn">
                      {sh(sample.rn)}
                      {branchCount > 1 ? ` +${branchCount - 1}` : ''}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {prefs.length > 0 && (
        <section className="dash-section">
          <div className="dash-sec-head">
            <h2>Top of your preference list</h2>
            <p>Branches ranked highest by you</p>
          </div>
          <ol className="dash-pref-list">
            {prefs.slice(0, 5).map((p, i) => (
              <li key={p.id}>
                <span className="dash-pref-rank">{i + 1}</span>
                <div className="dash-pref-info">
                  <div className="dash-pref-cn">
                    {p.collegeName.includes(',')
                      ? p.collegeName.substring(0, p.collegeName.lastIndexOf(','))
                      : p.collegeName}
                  </div>
                  <div className="dash-pref-bn">{sh(p.branchName)}</div>
                </div>
              </li>
            ))}
            {prefs.length > 5 && (
              <button className="dash-pref-more" onClick={() => nav('/preferences')}>
                View all {prefs.length} →
              </button>
            )}
          </ol>
        </section>
      )}

      <CollegeModal college={active} onClose={() => setActive(null)} />
    </div>
  );
}

function ActionCard({
  title,
  desc,
  icon,
  gradient,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button className={'action-card ' + gradient} onClick={onClick}>
      <div className="action-icon">{icon}</div>
      <div className="action-text">
        <div className="action-title">{title}</div>
        <div className="action-desc">{desc}</div>
      </div>
      <svg className="action-arrow" viewBox="0 0 24 24">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

