import { useEffect, useState } from 'react';
import { Activity, CalendarDays, Check, ChevronDown, CircleHelp, ClipboardCheck, Download, FileText, HardHat, MapPin, Menu, Plus, Search, Shield, ShieldAlert, Users } from 'lucide-react';
import CaseOverview from './components/CaseOverview.jsx';
import IncidentIntake from './components/IncidentIntake.jsx';
import PreventiveActions from './components/PreventiveActions.jsx';
import RCAWorksheet from './components/RCAWorksheet.jsx';
import TimelineBuilder from './components/TimelineBuilder.jsx';
import ToolboxTalk from './components/ToolboxTalk.jsx';
import { downloadReport, request } from './lib/api.js';
import { dateLabel } from './lib/format.js';

const sections = [
  { id: 'overview', label: 'Case overview', icon: Activity },
  { id: 'timeline', label: 'Timeline & evidence', icon: CalendarDays },
  { id: 'rca', label: 'Root cause analysis', icon: Search },
  { id: 'actions', label: 'Preventive actions', icon: ClipboardCheck },
  { id: 'toolbox', label: 'Crew learning', icon: HardHat },
];

export default function AppShell() {
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [section, setSection] = useState('overview');
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function refresh(keepSelection = true) {
    try {
      const data = await request('/api/incidents');
      setIncidents(data);
      if (!keepSelection || !data.some((item) => item.id === selectedId)) setSelectedId(data[0]?.id ?? null);
      setError('');
    } catch (problem) {
      setError(problem.message || 'Could not reach the IncidentTrace API.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(false); }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const active = incidents.find((item) => item.id === selectedId) || incidents[0];
  const filtered = incidents.filter((item) => `${item.title} ${item.location} ${item.incident_type}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const base = active ? `/api/incidents/${active.id}` : '';

  async function save(path, body, method = 'POST', success = 'Changes saved') {
    setSaving(true);
    setError('');
    try {
      await request(path, { method, body: JSON.stringify(body) });
      await refresh();
      setNotice(success);
      return true;
    } catch (problem) {
      setError(problem.message || 'Could not save changes.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function createIncident(event) {
    event.preventDefault();
    const created = await save('/api/incidents', Object.fromEntries(new FormData(event.currentTarget).entries()), 'POST', 'Incident recorded');
    if (created) {
      setCreateOpen(false);
      await refresh(false);
    }
  }

  async function exportReport(format) {
    try {
      await downloadReport(active.id, format);
    } catch (problem) {
      setError(problem.message || 'Report could not be generated.');
    }
  }

  const workspace = active ? <>
    <div className="case-header">
      <div className="case-title-wrap"><div className="case-kicker"><span className="type-chip">{active.incident_type}</span><span className="case-ref">CASE-{String(active.id).padStart(4, '0')}</span><span className="status-chip"><i /> {active.status}</span></div><h1>{active.title}</h1><div className="case-meta"><span><CalendarDays size={14} /> {dateLabel(active.occurred_at)}</span><span><MapPin size={14} /> {active.location || 'Location not recorded'}</span><span><Users size={14} /> Reported by {active.reporter || 'Unknown'}</span></div></div>
      <div className="header-actions"><button className="button button-quiet" onClick={() => exportReport('md')}><FileText size={15} /> Markdown</button><button className="button button-quiet" onClick={() => exportReport('pdf')}><Download size={15} /> PDF</button><button className="button button-primary" onClick={() => setSection('actions')}><Plus size={15} /> Add action</button></div>
    </div>
    <nav className="section-tabs" aria-label="Investigation sections">{sections.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? 'tab-active' : ''} onClick={() => setSection(id)}><Icon size={16} /><span>{label}</span>{id === 'actions' && active.actions?.some((action) => action.status !== 'Closed') && <b>{active.actions.filter((action) => action.status !== 'Closed').length}</b>}</button>)}</nav>
    {section === 'overview' && <CaseOverview incident={active} onNavigate={setSection} onExportMarkdown={() => exportReport('md')} />}
    {section === 'timeline' && <TimelineBuilder incident={active} base={base} save={save} saving={saving} />}
    {section === 'rca' && <RCAWorksheet incident={active} base={base} save={save} saving={saving} />}
    {section === 'actions' && <PreventiveActions incident={active} base={base} save={save} saving={saving} />}
    {section === 'toolbox' && <ToolboxTalk incident={active} base={base} save={save} saving={saving} />}
  </> : <div className="welcome-state"><div className="welcome-symbol"><Shield size={24} /></div><p className="eyebrow">INCIDENTTRACE WORKSPACE</p><h1>Make every incident<br />a chance to learn.</h1><p>Record what happened, build an evidence-supported timeline, and follow preventive actions through effectiveness review.</p><button className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Record an incident</button><div className="welcome-note"><ShieldAlert size={15} /> No-fault reporting. Focus on conditions and systems, not blame.</div></div>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#overview" onClick={() => setSection('overview')}><span className="brand-mark"><Activity size={19} strokeWidth={2.3} /></span><span>incident<span className="brand-light">trace</span><small>SAFETY LEARNING</small></span></a>
      <div className="workspace-select"><span className="workspace-avatar">N</span><span><strong>Northstar Operations</strong><small>Safety workspace</small></span><ChevronDown size={15} /></div>
      <div className="nav-label">INVESTIGATIONS <span>{incidents.length}</span></div>
      <div className="case-search"><Search size={15} /><input aria-label="Search investigations" placeholder="Find a case" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /><kbd>/</kbd></div>
      <div className="case-list">{filtered.map((item) => <button className={`case-item ${item.id === active?.id ? 'case-active' : ''}`} key={item.id} onClick={() => { setSelectedId(item.id); setSection('overview'); setMobileNav(false); }}><span className={`case-dot ${item.status === 'Closed' ? 'dot-closed' : ''}`} /><span className="case-copy"><strong>{item.title}</strong><small>{item.incident_type} · {dateLabel(item.occurred_at, { month: 'short', day: 'numeric' })}</small></span><span className="case-status">{item.status}</span></button>)}{!filtered.length && <p className="sidebar-empty">No matching investigations</p>}</div>
      <button className="new-case" onClick={() => setCreateOpen(true)}><Plus size={16} /> New investigation</button>
      <div className="sidebar-bottom"><div className="user-avatar">AM</div><div><strong>Alex Morgan</strong><small>Safety coordinator</small></div><button className="icon-button" title="Help and guidance" aria-label="Help and guidance"><CircleHelp size={17} /></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(!mobileNav)}><Menu size={19} /></button><div className="breadcrumbs"><span>Investigations</span><span className="crumb-slash">/</span><strong>{active?.title || 'Workspace'}</strong></div><div className="top-actions"><span className="sync-status"><i /> All changes saved</span><button className="icon-button" title="Help center" aria-label="Help center"><CircleHelp size={17} /></button><div className="user-avatar top-avatar">AM</div></div></header>
      <div className="page-wrap">{error && <div className="alert alert-error"><ShieldAlert size={17} /><span>{error}</span><button onClick={() => refresh()} aria-label="Retry"><Activity size={15} /> Retry</button></div>}{loading ? <div className="loading-state"><span className="loader" />Loading investigation workspace</div> : workspace}</div>
    </main>
    {createOpen && <IncidentIntake onClose={() => setCreateOpen(false)} onSubmit={createIncident} saving={saving} />}
    {notice && <div className="toast"><Check size={16} />{notice}</div>}
    {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
  </div>;
}
