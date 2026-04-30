import { useMemo, useState } from 'react';
import { useApp } from '../context';
import type { College } from '../types';
import { getCity, sh } from '../utils';
import CollegeModal from '../components/CollegeModal';

type Tab = 'mine' | 'browse';

export default function Preferences() {
  const { prefs, removePref, movePref, colleges, addPref, hasPref, user } = useApp();
  const [tab, setTab] = useState<Tab>(prefs.length === 0 ? 'browse' : 'mine');
  const [search, setSearch] = useState('');
  const [browseQ, setBrowseQ] = useState('');
  const [browseCity, setBrowseCity] = useState('');
  const [browseBranch, setBrowseBranch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<College | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const collegeMap = useMemo(() => {
    const m: Record<string, College> = {};
    colleges.forEach(c => (m[c.cc] = c));
    return m;
  }, [colleges]);

  const cityOptions = useMemo(
    () => [...new Set(colleges.map(c => getCity(c.cn)).filter(Boolean))].sort(),
    [colleges]
  );
  const branchOptions = useMemo(
    () => [...new Set(colleges.flatMap(c => Object.values(c.branches).map(b => b.rn)))].sort(),
    [colleges]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return prefs;
    return prefs.filter(
      p =>
        p.collegeName.toLowerCase().includes(q) ||
        p.branchName.toLowerCase().includes(q) ||
        p.collegeCode.includes(q)
    );
  }, [prefs, search]);

  const browseResults = useMemo(() => {
    const q = browseQ.toLowerCase().trim();
    return colleges
      .filter(c => {
        const matchQ =
          !q ||
          c.cn.toLowerCase().includes(q) ||
          c.cc.includes(q) ||
          Object.values(c.branches).some(b => b.rn.toLowerCase().includes(q));
        const matchCity = !browseCity || getCity(c.cn) === browseCity;
        const matchBranch = !browseBranch || Object.values(c.branches).some(b => b.rn === browseBranch);
        return matchQ && matchCity && matchBranch;
      })
      .slice(0, 100);
  }, [colleges, browseQ, browseCity, browseBranch]);

  function tryAdd(c: College, branchCode: string, branchName: string) {
    const ok = addPref({
      collegeCode: c.cc,
      collegeName: c.cn,
      branchCode,
      branchName,
    });
    setToast(ok ? `${sh(branchName)} added ✓` : 'Already in your list');
    setTimeout(() => setToast(null), 1600);
  }

  function buildPrintHTML(forPdf: boolean) {
    const esc = (s: string) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const today = new Date();
    const dateLong = today.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dateShort = today.toISOString().slice(0, 10);

    const userInfo: { lbl: string; val: string }[] = [];
    if (user?.name) userInfo.push({ lbl: 'Candidate', val: user.name });
    if (user?.email) userInfo.push({ lbl: 'Email', val: user.email });
    if (user?.category) userInfo.push({ lbl: 'Category', val: user.category });
    if (user?.percentile != null)
      userInfo.push({ lbl: 'Percentile', val: user.percentile.toFixed(4) });
    if (user?.mobile) userInfo.push({ lbl: 'Mobile', val: user.mobile });
    if (user?.city) userInfo.push({ lbl: 'City', val: user.city });

    const rows = prefs
      .map((p, i) => {
        const college = collegeMap[p.collegeCode];
        const cityName = college ? getCity(college.cn) || '' : '';
        const cleanCN = p.collegeName.includes(',')
          ? p.collegeName.substring(0, p.collegeName.lastIndexOf(','))
          : p.collegeName;
        return `
        <tr>
          <td class="t-rank">${i + 1}</td>
          <td>
            <div class="t-code">${esc(p.collegeCode)}</div>
            <div class="t-cn">${esc(cleanCN)}</div>
            ${cityName ? `<div class="t-city">${esc(cityName)}</div>` : ''}
          </td>
          <td>
            <div class="t-bn">${esc(p.branchName)}</div>
            <div class="t-bc">${esc(p.branchCode)}</div>
          </td>
        </tr>`;
      })
      .join('');

    const docTitle = forPdf
      ? `Preferences-${user?.name?.replace(/\s+/g, '_') || 'list'}-${dateShort}`
      : `Preferences List · ${dateLong}`;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(docTitle)}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #0d1f3c;
      font-size: 11px;
      line-height: 1.4;
      padding: 24px;
      background: #f4f6fb;
    }
    .sheet {
      background: #fff;
      max-width: 760px;
      margin: 0 auto;
      padding: 28px 32px;
      border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; max-width: none; padding: 0; border-radius: 0; }
      .no-print { display: none !important; }
    }

    .doc-hdr {
      border-bottom: 3px solid #0d1f3c;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .doc-brand {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .doc-brand small {
      display: block;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      margin-top: 3px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .doc-meta {
      font-size: 10px;
      color: #64748b;
      text-align: right;
      line-height: 1.5;
    }
    .doc-meta strong { color: #0d1f3c; font-weight: 700; }

    h1.doc-title {
      font-size: 22px;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }
    .doc-sub {
      font-size: 11px;
      color: #64748b;
      margin: 0 0 16px;
    }

    .info-card {
      background: #f4f6fb;
      border: 1px solid #e0e3ec;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 18px;
      font-size: 10.5px;
    }
    .info-card .lbl { color: #64748b; font-weight: 600; }
    .info-card .val { font-weight: 700; color: #0d1f3c; }

    table.prefs-tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    table.prefs-tbl thead th {
      background: #0d1f3c;
      color: #fff;
      text-align: left;
      padding: 9px 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    table.prefs-tbl tbody td {
      padding: 8px 10px;
      border-bottom: 1px solid #e0e3ec;
      vertical-align: top;
    }
    table.prefs-tbl tbody tr:nth-child(even) td { background: #f8f9fc; }
    table.prefs-tbl tr { page-break-inside: avoid; }

    .t-rank {
      font-weight: 800;
      font-size: 13px;
      width: 36px;
      text-align: center;
      color: #0d1f3c;
      background: #fff7e0 !important;
    }
    .t-code {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.06em;
    }
    .t-cn { font-weight: 700; margin-top: 2px; font-size: 11px; }
    .t-city { font-size: 10px; color: #64748b; margin-top: 2px; }
    .t-bn { font-weight: 600; }
    .t-bc {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
      letter-spacing: 0.06em;
    }

    .sign-row {
      margin-top: 40px;
      display: flex;
      gap: 60px;
      page-break-inside: avoid;
    }
    .sign-box {
      flex: 1;
      border-top: 1px solid #0d1f3c;
      padding-top: 4px;
      font-size: 10px;
      color: #64748b;
      text-align: center;
    }

    .doc-foot {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e0e3ec;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 9.5px;
    }

    .print-actions {
      position: fixed;
      top: 14px;
      right: 14px;
      display: flex;
      gap: 8px;
      z-index: 10;
    }
    .print-actions button {
      background: #0d1f3c;
      color: #fff;
      border: none;
      padding: 9px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    }
    .print-actions button.secondary {
      background: #fff;
      color: #0d1f3c;
      border: 1px solid #cbd5e1;
    }
    .print-actions button:hover { filter: brightness(1.08); }
  </style>
</head>
<body>
  <div class="print-actions no-print">
    <button onclick="window.print()">${forPdf ? 'Save as PDF' : 'Print'}</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>

  <div class="sheet">
    <div class="doc-hdr">
      <div class="doc-brand">
        Mr. Admission-Wala
        <small>MHT-CET College Preference List · 2025-26</small>
      </div>
      <div class="doc-meta">
        Generated: <strong>${esc(dateLong)}</strong><br/>
        Total preferences: <strong>${prefs.length}</strong>
      </div>
    </div>

    <h1 class="doc-title">My College Preferences</h1>
    <p class="doc-sub">Ranked list of branches in order of priority for CAP allotment.</p>

    ${
      userInfo.length
        ? `<div class="info-card">${userInfo
            .map(
              ({ lbl, val }) =>
                `<div><span class="lbl">${esc(lbl)}:</span> <span class="val">${esc(val)}</span></div>`
            )
            .join('')}</div>`
        : ''
    }

    <table class="prefs-tbl">
      <thead>
        <tr>
          <th style="width:42px">#</th>
          <th>College</th>
          <th>Branch</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="sign-row">
      <div class="sign-box">Candidate signature</div>
      <div class="sign-box">Date</div>
    </div>

    <div class="doc-foot">
      <span>Generated via Mr. Admission-Wala · ${esc(dateLong)}</span>
      <span>${prefs.length} preference${prefs.length !== 1 ? 's' : ''}</span>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      ${forPdf ? 'setTimeout(function(){ window.print(); }, 250);' : ''}
    });
  </script>
</body>
</html>`;
  }

  function openPrintView(forPdf: boolean) {
    if (prefs.length === 0) return;
    const html = buildPrintHTML(forPdf);
    const w = window.open('', '_blank', 'width=920,height=760');
    if (!w) {
      setToast('Allow pop-ups to print/download');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function exportCSV() {
    if (prefs.length === 0) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      ['Rank', 'College Code', 'College Name', 'Branch Code', 'Branch Name', 'Added On'].join(','),
      ...prefs.map((p, i) =>
        [
          i + 1,
          esc(p.collegeCode),
          esc(p.collegeName),
          esc(p.branchCode),
          esc(p.branchName),
          esc(new Date(p.addedAt).toISOString().slice(0, 10)),
        ].join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preferences-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="prefs-page">
      <div className="page-hero prefs-hero">
        <div className="hero-icon hero-icon-gold">
          <svg viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="hero-title">My Preferences</h1>
          <p className="hero-sub">
            {prefs.length === 0
              ? 'Search colleges below and tap + to build your preference list'
              : `${prefs.length} branch${prefs.length !== 1 ? 'es' : ''} saved`}
          </p>
        </div>
      </div>

      <div className="tab-switch">
        <button
          className={'tab-btn' + (tab === 'mine' ? ' on' : '')}
          onClick={() => setTab('mine')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          My list
          {prefs.length > 0 && <span className="tab-count">{prefs.length}</span>}
        </button>
        <button
          className={'tab-btn' + (tab === 'browse' ? ' on' : '')}
          onClick={() => setTab('browse')}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Browse colleges
        </button>
      </div>

      {tab === 'mine' ? (
        <>
          {prefs.length > 0 && (
            <>
              <div className="prefs-toolbar">
                <button className="export-btn" onClick={() => openPrintView(false)}>
                  <svg viewBox="0 0 24 24">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print
                </button>
                <button className="export-btn" onClick={() => openPrintView(true)}>
                  <svg viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 18 15 15" />
                  </svg>
                  Save PDF
                </button>
                <button className="export-btn" onClick={exportCSV}>
                  <svg viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export CSV
                </button>
              </div>
              <div className="search-box prefs-search">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  placeholder="Search your preferences…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </>
          )}

          {prefs.length === 0 ? (
            <div className="prefs-empty">
              <svg viewBox="0 0 24 24" className="empty-art">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              <h3>No preferences yet</h3>
              <p>
                Switch to <strong>Browse colleges</strong> above and tap <strong>+</strong> on a
                branch to add it.
              </p>
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setTab('browse')}>
                Browse colleges
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="no-results">
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No matches</p>
              <p>Try clearing the search</p>
            </div>
          ) : (
            <ol className="prefs-list">
              {filtered.map((p, i) => {
                const college = collegeMap[p.collegeCode];
                const realIdx = prefs.findIndex(x => x.id === p.id);
                return (
                  <li
                    key={p.id}
                    className="pref-item card-anim"
                    style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
                  >
                    <div className="pref-rank">{realIdx + 1}</div>
                    <div
                      className="pref-main"
                      onClick={() => college && setActive(college)}
                      role="button"
                    >
                      <div className="pref-cc">{p.collegeCode}</div>
                      <div className="pref-cn">
                        {p.collegeName.includes(',')
                          ? p.collegeName.substring(0, p.collegeName.lastIndexOf(','))
                          : p.collegeName}
                      </div>
                      <div className="pref-bn">{sh(p.branchName)}</div>
                    </div>
                    <div className="pref-actions">
                      <button
                        className="icon-btn"
                        onClick={() => movePref(p.id, -1)}
                        disabled={realIdx === 0}
                        title="Move up"
                        aria-label="Move up"
                      >
                        <svg viewBox="0 0 24 24">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => movePref(p.id, 1)}
                        disabled={realIdx === prefs.length - 1}
                        title="Move down"
                        aria-label="Move down"
                      >
                        <svg viewBox="0 0 24 24">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        onClick={() => removePref(p.id)}
                        title="Remove"
                        aria-label="Remove"
                      >
                        <svg viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      ) : (
        <>
          <div className="browse-controls">
            <div className="search-box">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                placeholder="Search college, code, or branch…"
                value={browseQ}
                onChange={e => setBrowseQ(e.target.value)}
              />
            </div>
            <div className="browse-filters">
              <select
                className="filter-sel"
                value={browseCity}
                onChange={e => setBrowseCity(e.target.value)}
              >
                <option value="">All cities</option>
                {cityOptions.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="filter-sel"
                value={browseBranch}
                onChange={e => setBrowseBranch(e.target.value)}
              >
                <option value="">All branches</option>
                {branchOptions.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="browse-meta">
              {browseResults.length} of {colleges.length} colleges
              {colleges.length > 0 && browseResults.length === 100 && ' (showing first 100)'}
            </div>
          </div>

          <div className="browse-list">
            {browseResults.length === 0 ? (
              <div className="no-results">
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No colleges found</p>
                <p>Try clearing the filters</p>
              </div>
            ) : (
              browseResults.map((c, i) => {
                const isOpen = !!expanded[c.cc];
                const branches = Object.entries(c.branches);
                const cityName = getCity(c.cn);
                const displayName =
                  cityName && c.cn.includes(',')
                    ? c.cn.substring(0, c.cn.lastIndexOf(',')).trim()
                    : c.cn;
                const addedCount = branches.filter(([rc]) => hasPref(c.cc, rc)).length;
                return (
                  <div
                    key={c.cc}
                    className={'browse-item card-anim' + (isOpen ? ' open' : '')}
                    style={{ animationDelay: `${Math.min(i * 18, 300)}ms` }}
                  >
                    <button
                      className="browse-hdr"
                      onClick={() =>
                        setExpanded(prev => ({ ...prev, [c.cc]: !isOpen }))
                      }
                    >
                      <div className="browse-info">
                        <div className="browse-cc">{c.cc}</div>
                        <div className="browse-cn">{displayName}</div>
                        <div className="browse-meta-row">
                          {cityName && <span className="browse-city">📍 {cityName}</span>}
                          <span className="browse-branch-count">
                            {branches.length} branch{branches.length !== 1 ? 'es' : ''}
                          </span>
                          {addedCount > 0 && (
                            <span className="browse-added">
                              {addedCount} in list
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="browse-chev" viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="browse-branches">
                        {branches.map(([rc, b]) => {
                          const inPrefs = hasPref(c.cc, rc);
                          return (
                            <div
                              key={rc}
                              className={'browse-branch' + (inPrefs ? ' added' : '')}
                            >
                              <div className="bb-info">
                                <div className="bb-name">{b.rn}</div>
                                <div className="bb-code">{rc}</div>
                              </div>
                              <button
                                className={'pref-add-btn-pill' + (inPrefs ? ' added' : '')}
                                onClick={() => !inPrefs && tryAdd(c, rc, b.rn)}
                                disabled={inPrefs}
                              >
                                {inPrefs ? (
                                  <>
                                    <svg viewBox="0 0 24 24">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <svg viewBox="0 0 24 24">
                                      <line x1="12" y1="5" x2="12" y2="19" />
                                      <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Add
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                        <button
                          className="browse-view-details"
                          onClick={() => setActive(c)}
                        >
                          View cut-offs ▸
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {toast && <div className="page-toast">{toast}</div>}

      <CollegeModal college={active} onClose={() => setActive(null)} />
    </div>
  );
}
