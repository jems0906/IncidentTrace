import { useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, ClipboardCheck, Download, FileText, Filter, HardHat, Image, Info, MapPin, Menu, Plus, Search, Shield, ShieldAlert, Sparkles, Users, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '';
const sections = [
  { id: 'overview', label: 'Case overview', icon: Activity },
  { id: 'timeline', label: 'Timeline & evidence', icon: CalendarDays },
  { id: 'rca', label: 'Root cause analysis', icon: Search },
  { id: 'actions', label: 'Preventive actions', icon: ClipboardCheck },
  { id: 'toolbox', label: 'Crew learning', icon: HardHat },
];
const factorCategories = ['Task', 'Equipment / material', 'Environment', 'Supervision', 'Training', 'Procedures'];
const blankRca = { what_happened: '', how_happened: '', why_happened: '', correction: '', five_whys: ['', '', '', '', ''], fishbone: {}, reviewed_by: '', factors: [] };
const dateLabel = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => value ? new Intl.DateTimeFormat('en', options).format(new Date(value)) : 'Not recorded';
const timeLabel = (value) => value ? new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function Field({ label, children, className = '' }) {
  return <label className={`field ${className}`}><span>{label}</span>{children}</label>;
}
function SectionHeading({ eyebrow, title, detail, action }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{detail && <p className="muted">{detail}</p>}</div>{action}</div>;
}
function EmptyState({ title, detail }) {
  return <div className="empty-state"><span className="empty-icon"><FileText size={20} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

export { default } from './AppShell.jsx';

function LegacyApp() {
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
    const form = new FormData(event.currentTarget);
    const created = await save('/api/incidents', Object.fromEntries(form.entries()), 'POST', 'Incident recorded');
    if (created) {
      setCreateOpen(false);
      await refresh(false);
    }
  }

  async function downloadReport() {
    try {
      const response = await fetch(`${API_URL}${base}/report.md`);
      if (!response.ok) throw new Error('Report could not be generated.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `incidenttrace-investigation-${active.id}.md`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (problem) { setError(problem.message); }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#overview" onClick={() => setSection('overview')}><span className="brand-mark"><Activity size={19} strokeWidth={2.3} /></span><span>incident<span className="brand-light">trace</span><small>SAFETY LEARNING</small></span></a>
      <div className="workspace-select"><span className="workspace-avatar">N</span><span><strong>Northstar Operations</strong><small>Safety workspace</small></span><ChevronDown size={15} /></div>
      <div className="nav-label">INVESTIGATIONS <span>{incidents.length}</span></div>
      <div className="case-search"><Search size={15} /><input aria-label="Search investigations" placeholder="Find a case" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /><kbd>/</kbd></div>
      <div className="case-list">
        {filtered.map((item) => <button className={`case-item ${item.id === (active?.id) ? 'case-active' : ''}`} key={item.id} onClick={() => { setSelectedId(item.id); setSection('overview'); setMobileNav(false); }}>
          <span className={`case-dot ${item.status === 'Closed' ? 'dot-closed' : ''}`} /><span className="case-copy"><strong>{item.title}</strong><small>{item.incident_type} · {dateLabel(item.occurred_at, { month: 'short', day: 'numeric' })}</small></span><span className="case-status">{item.status}</span>
        </button>)}
        {!filtered.length && <p className="sidebar-empty">No matching investigations</p>}
      </div>
      <button className="new-case" onClick={() => setCreateOpen(true)}><Plus size={16} /> New investigation</button>
      <div className="sidebar-bottom"><div className="user-avatar">AM</div><div><strong>Alex Morgan</strong><small>Safety coordinator</small></div><button className="icon-button" title="Help and guidance" aria-label="Help and guidance"><CircleHelp size={17} /></button></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(!mobileNav)}><Menu size={19} /></button><div className="breadcrumbs"><span>Investigations</span><span className="crumb-slash">/</span><strong>{active?.title || 'Workspace'}</strong></div><div className="top-actions"><span className="sync-status"><i /> All changes saved</span><button className="icon-button" title="Help center" aria-label="Help center"><CircleHelp size={17} /></button><div className="user-avatar top-avatar">AM</div></div></header>
      <div className="page-wrap">
        {error && <div className="alert alert-error"><ShieldAlert size={17} /><span>{error}</span><button onClick={() => refresh()} aria-label="Retry"><Activity size={15} /> Retry</button></div>}
        {loading ? <div className="loading-state"><span className="loader" />Loading investigation workspace</div> : !active ? <div className="welcome-state"><div className="welcome-symbol"><Shield size={24} /></div><p className="eyebrow">INCIDENTTRACE WORKSPACE</p><h1>Make every incident<br />a chance to learn.</h1><p>Record what happened, build an evidence-supported timeline, and follow preventive actions through effectiveness review.</p><button className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Record an incident</button><div className="welcome-note"><Info size={15} /> No-fault reporting. Focus on conditions and systems, not blame.</div></div> : <>
          <div className="case-header"><div className="case-title-wrap"><div className="case-kicker"><span className="type-chip">{active.incident_type}</span><span className="case-ref">CASE-{String(active.id).padStart(4, '0')}</span><span className="status-chip"><i /> {active.status}</span></div><h1>{active.title}</h1><div className="case-meta"><span><CalendarDays size={14} /> {dateLabel(active.occurred_at)}</span><span><MapPin size={14} /> {active.location || 'Location not recorded'}</span><span><Users size={14} /> Reported by {active.reporter || 'Unknown'}</span></div></div><div className="header-actions"><button className="button button-quiet" onClick={downloadReport}><Download size={15} /> Export report</button><button className="button button-primary" onClick={() => setSection('actions')}><Plus size={15} /> Add action</button></div></div>
          <nav className="section-tabs" aria-label="Investigation sections">{sections.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? 'tab-active' : ''} onClick={() => setSection(id)}><Icon size={16} /><span>{label}</span>{id === 'actions' && active.actions?.some((action) => action.status !== 'Closed') && <b>{active.actions.filter((action) => action.status !== 'Closed').length}</b>}</button>)}</nav>
          {section === 'overview' && <Overview incident={active} onNavigate={setSection} onExport={downloadReport} />}
          {section === 'timeline' && <Timeline incident={active} base={base} save={save} saving={saving} />}
          {section === 'rca' && <RCAWorkspace incident={active} base={base} save={save} saving={saving} />}
          {section === 'actions' && <ActionsWorkspace incident={active} base={base} save={save} saving={saving} />}
          {section === 'toolbox' && <ToolboxWorkspace incident={active} base={base} save={save} saving={saving} />}
        </>}
      </div>
    </main>
    {createOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}><form className="modal" onSubmit={createIncident}><div className="modal-head"><div><p className="eyebrow">NEW INVESTIGATION</p><h2>Record an incident</h2></div><button type="button" className="icon-button" onClick={() => setCreateOpen(false)} aria-label="Close"><X size={18} /></button></div><p className="modal-intro">A no-fault record helps us understand what conditions made this event possible.</p><div className="form-grid"><Field label="Investigation title"><input name="title" required placeholder="Briefly describe the event" /></Field><Field label="Event type"><select name="incident_type" defaultValue="Near miss"><option>Injury</option><option>Vehicle incident</option><option>Property damage</option><option>Near miss</option><option>Environmental</option></select></Field><Field label="Date and time"><input name="occurred_at" type="datetime-local" /></Field><Field label="Location"><input name="location" placeholder="Site, area, or route" /></Field><Field label="Reported by"><input name="reporter" placeholder="Name" /></Field><Field label="What happened?" className="field-wide"><textarea name="description" rows="3" placeholder="Describe the event as observed. Avoid assumptions about cause." /></Field><Field label="Immediate actions to make the scene safe" className="field-wide"><textarea name="immediate_actions" rows="2" placeholder="What was done before the investigation began?" /></Field></div><div className="modal-foot"><span><Shield size={14} /> No blame. Learn and prevent recurrence.</span><button className="button button-primary" disabled={saving}><Plus size={15} /> Create investigation</button></div></form></div>}
    {notice && <div className="toast"><Check size={16} />{notice}</div>}
    {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
  </div>;
}

function Overview({ incident, onNavigate, onExport }) {
  const openActions = incident.actions?.filter((action) => action.status !== 'Closed').length || 0;
  const timelineData = (incident.timeline || []).map((event, index) => ({ step: `E${index + 1}`, condition: 1, time: timeLabel(event.occurred_at), event: event.event }));
  return <div className="overview-content">
    <div className="metrics-row"><div className="metric-card"><div className="metric-label">Investigation status <span className="metric-icon mint"><Activity size={16} /></span></div><strong>{incident.status}</strong><small>Human-reviewed case record</small></div><div className="metric-card"><div className="metric-label">Evidence collected <span className="metric-icon coral"><FileText size={16} /></span></div><strong>{incident.evidence?.length || 0}<em> items</em></strong><small>{incident.timeline?.length || 0} timeline entries</small></div><div className="metric-card"><div className="metric-label">Contributing factors <span className="metric-icon gold"><Search size={16} /></span></div><strong>{incident.factors?.length || 0}<em> identified</em></strong><small>Selected and justified by investigator</small></div><div className="metric-card"><div className="metric-label">Actions to verify <span className="metric-icon blue"><ClipboardCheck size={16} /></span></div><strong>{openActions}<em> open</em></strong><small>Effectiveness review required to close</small></div></div>
    <div className="overview-grid"><section className="panel incident-summary"><div className="panel-head"><div><p className="eyebrow">CASE NARRATIVE</p><h3>What happened</h3></div><span className="panel-index">01</span></div><p className="body-copy">{incident.description || 'No event description has been recorded.'}</p><div className="immediate-box"><span className="immediate-icon"><ShieldAlert size={17} /></span><div><strong>Immediate actions</strong><p>{incident.immediate_actions || 'No immediate actions recorded.'}</p></div></div><div className="summary-footer"><span><Info size={14} /> Investigation focuses on root causes, not blame.</span><button className="text-button" onClick={() => onNavigate('timeline')}>View investigation <ArrowUpRight size={14} /></button></div></section>
      <section className="panel timeline-preview"><div className="panel-head"><div><p className="eyebrow">SEQUENCE OF EVENTS</p><h3>Evidence timeline</h3></div><button className="icon-button" onClick={() => onNavigate('timeline')} title="Open timeline" aria-label="Open timeline"><ArrowUpRight size={16} /></button></div>{timelineData.length ? <><div className="chart-legend"><span><i /> Documented events</span><span>{timelineData.length} entries</span></div><div className="timeline-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={timelineData} margin={{ top: 15, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="eventFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#319d79" stopOpacity={0.22} /><stop offset="100%" stopColor="#319d79" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid stroke="#e8e9e3" vertical={false} /><XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fill: '#8a908b', fontSize: 11 }} /><YAxis hide domain={[0, 2]} /><Tooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><strong>{payload[0].payload.time}</strong><span>{payload[0].payload.event}</span></div> : null} /><Area type="monotone" dataKey="condition" stroke="#319d79" strokeWidth={2} fill="url(#eventFill)" dot={{ r: 3, fill: '#319d79', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer></div><div className="timeline-first"><span className="timeline-pin" /><span>{incident.timeline[0].event}</span><small>{timeLabel(incident.timeline[0].occurred_at)}</small></div><button className="text-button timeline-link" onClick={() => onNavigate('timeline')}>Explore all events and evidence <ArrowUpRight size={14} /></button></> : <EmptyState title="No events added yet" detail="Build an evidence-supported sequence of events." />}</section>
      <section className="panel factor-panel"><div className="panel-head"><div><p className="eyebrow">INVESTIGATOR ASSESSMENT</p><h3>Contributing factors</h3></div><button className="text-button" onClick={() => onNavigate('rca')}>Review <ArrowUpRight size={14} /></button></div>{incident.factors?.length ? <div className="factor-list">{incident.factors.map((factor) => <div className="factor-row" key={factor.id}><span className="factor-mark">{factor.category.slice(0, 1)}</span><span><strong>{factor.category}</strong><small>{factor.rationale}</small></span></div>)}</div> : <EmptyState title="No factors documented" detail="Factors are selected and justified by the investigator." />}</section>
      <section className="panel action-panel"><div className="panel-head"><div><p className="eyebrow">PREVENT RECURRENCE</p><h3>Action tracking</h3></div><button className="text-button" onClick={() => onNavigate('actions')}>Open actions <ArrowUpRight size={14} /></button></div>{incident.actions?.length ? incident.actions.slice(0, 3).map((action) => <div className="action-preview" key={action.id}><span className={`action-check ${action.status === 'Closed' ? 'checked' : ''}`}>{action.status === 'Closed' && <Check size={12} />}</span><span><strong>{action.title}</strong><small>{action.owner} · Due {dateLabel(action.due_date, { month: 'short', day: 'numeric' })}</small></span><span className={`status-label ${action.status === 'Closed' ? 'status-done' : ''}`}>{action.status}</span></div>) : <EmptyState title="No preventive actions" detail="Link a practical action to an identified cause." />}</section>
    </div><div className="below-note"><span className="note-mark"><Sparkles size={15} /></span><p><strong>Learning over blame.</strong> Investigation records capture evidence and human reasoning. IncidentTrace does not infer causes or assign fault.</p><button className="button button-quiet" onClick={onExport}><Download size={14} /> Summary</button></div>
  </div>;
}

function Timeline({ incident, base, save, saving }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  async function addEvent(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    values.occurred_at = new Date(values.occurred_at).toISOString();
    if (await save(`${base}/timeline`, values, 'POST', 'Timeline event added')) form.reset();
  }
  async function addEvidence(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (await save(`${base}/evidence`, Object.fromEntries(new FormData(form).entries()), 'POST', 'Evidence added')) form.reset();
  }
  return <div className="workspace-grid"><section className="panel wide-panel"><SectionHeading eyebrow="RECONSTRUCT THE SEQUENCE" title="Evidence timeline" detail="Record what is known, when it happened, and what supports each entry." action={<button className="button button-quiet" onClick={() => setEvidenceOpen(!evidenceOpen)}><Plus size={15} /> Register evidence</button>} />
    <form className="inline-form event-form" onSubmit={addEvent}><Field label="Date and time"><input name="occurred_at" type="datetime-local" required /></Field><Field label="Event"><input name="event" required placeholder="What was observed or reported?" /></Field><Field label="Source"><input name="source" placeholder="Interview, photo, record..." /></Field><button className="button button-primary" disabled={saving}><Plus size={15} /> Add event</button></form>
    {incident.timeline?.length ? <div className="event-list">{incident.timeline.map((event, index) => <div className="event-row" key={event.id}><div className="event-time"><strong>{timeLabel(event.occurred_at)}</strong><small>{dateLabel(event.occurred_at, { month: 'short', day: 'numeric' })}</small></div><span className="event-stem"><i /></span><div className="event-body"><p>{event.event}</p><small><FileText size={12} /> {event.source || 'Source not recorded'}</small></div><span className="event-sequence">{String(index + 1).padStart(2, '0')}</span></div>)}</div> : <EmptyState title="Timeline is ready for evidence" detail="Add events in chronological order. Each entry should identify its source." />}
  </section><section className="panel evidence-panel"><div className="panel-head"><div><p className="eyebrow">EVIDENCE REGISTER</p><h3>Sources reviewed</h3></div><span className="count-pill">{incident.evidence?.length || 0}</span></div>{evidenceOpen && <form className="evidence-form" onSubmit={addEvidence}><Field label="Evidence type"><select name="evidence_type"><option>Photo</option><option>Document</option><option>Interview</option><option>Procedure</option><option>Other</option></select></Field><Field label="Label"><input name="label" required placeholder="e.g. Bay 3 floor photo" /></Field><Field label="Link (optional)"><input name="url" type="url" placeholder="https://..." /></Field><Field label="Notes"><textarea name="details" rows="2" placeholder="What does this source establish?" /></Field><Field label="Recorded by"><input name="recorded_by" placeholder="Investigator" /></Field><button className="button button-primary" disabled={saving}><Plus size={14} /> Save evidence</button></form>}{incident.evidence?.length ? incident.evidence.map((item) => <div className="evidence-item" key={item.id}><span className="evidence-icon">{item.evidence_type === 'Photo' ? <Image size={17} /> : <FileText size={17} />}</span><div><strong>{item.label}</strong><small>{item.evidence_type} · {item.recorded_by || 'Investigator'}</small>{item.details && <p>{item.details}</p>}{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={12} /></a>}</div></div>) : <EmptyState title="No evidence registered" detail="Add metadata and links for records, photos, interviews, or procedures." />}</section></div>;
}

function RCAWorkspace({ incident, base, save, saving }) {
  const [worksheet, setWorksheet] = useState(() => ({ ...blankRca, ...(incident.rca || {}), five_whys: incident.rca?.five_whys?.length ? incident.rca.five_whys : ['', '', '', '', ''], factors: incident.factors || [] }));
  const [factorDraft, setFactorDraft] = useState({ category: factorCategories[0], rationale: '' });
  useEffect(() => setWorksheet({ ...blankRca, ...(incident.rca || {}), five_whys: incident.rca?.five_whys?.length ? incident.rca.five_whys : ['', '', '', '', ''], factors: incident.factors || [] }), [incident]);
  const update = (key, value) => setWorksheet((current) => ({ ...current, [key]: value }));
  function addFactor() {
    if (!factorDraft.rationale.trim()) return;
    update('factors', [...worksheet.factors, { ...factorDraft }]);
    setFactorDraft({ category: factorCategories[0], rationale: '' });
  }
  return <div className="rca-layout"><div className="rca-main"><section className="panel worksheet-panel"><SectionHeading eyebrow="HUMAN-REVIEWED WORKSHEET" title="Root cause analysis" detail="A structured record of investigator reasoning. The software never declares a root cause." /><div className="osha-prompts">{[['what_happened', 'What happened?'], ['how_happened', 'How did it happen?'], ['why_happened', 'Why did it happen?'], ['correction', 'What needs to be corrected?']].map(([key, prompt], index) => <Field key={key} label={<><span className="prompt-number">0{index + 1}</span>{prompt}</>}><textarea rows="2" value={worksheet[key] || ''} onChange={(event) => update(key, event.target.value)} placeholder="Record the evidence and reasoning..." /></Field>)}</div><div className="review-row"><Field label="Reviewed by"><input value={worksheet.reviewed_by || ''} onChange={(event) => update('reviewed_by', event.target.value)} placeholder="Investigator name" /></Field><span><Shield size={14} /> Human-reviewed record</span></div></section>
      <section className="panel five-whys-panel"><div className="panel-head"><div><p className="eyebrow">ITERATIVE QUESTIONING</p><h3>5 Whys worksheet</h3></div><span className="worksheet-tag">INVESTIGATOR-LED</span></div><p className="muted">Follow the evidence through system conditions. Five is a guide, not a required stopping point.</p><div className="why-list">{worksheet.five_whys.map((answer, index) => <div className="why-row" key={index}><span className="why-count">WHY {index + 1}</span><input value={answer} onChange={(event) => update('five_whys', worksheet.five_whys.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} placeholder={index === 0 ? 'Why did the event occur?' : 'Why was that condition present?'} /></div>)}</div></section>
      <section className="panel fishbone-panel"><div className="panel-head"><div><p className="eyebrow">CAUSE-AND-EFFECT WORKSHEET</p><h3>Fishbone exploration</h3></div><span className="worksheet-tag">STRUCTURED PROMPTS</span></div><p className="muted">Explore system conditions by category. These are prompts for review, not software conclusions.</p><div className="fishbone-grid">{factorCategories.map((category) => <Field label={category} key={category}><textarea rows="2" value={worksheet.fishbone?.[category] || ''} onChange={(event) => update('fishbone', { ...worksheet.fishbone, [category]: event.target.value })} placeholder="What conditions may have contributed?" /></Field>)}</div></section><div className="save-row"><span><Info size={14} /> Only investigator-selected factors are included in the report.</span><button className="button button-primary" disabled={saving} onClick={() => save(`${base}/rca`, worksheet, 'PUT', 'RCA worksheet saved')}><Check size={15} /> Save worksheet</button></div></div>
    <aside className="panel factor-editor"><div className="panel-head"><div><p className="eyebrow">INVESTIGATOR SELECTS</p><h3>Contributing factors</h3></div><span className="count-pill">{worksheet.factors.length}</span></div><p className="muted">Select a taxonomy and justify it with the investigation record.</p><div className="factor-entry"><Field label="Factor category"><select value={factorDraft.category} onChange={(event) => setFactorDraft({ ...factorDraft, category: event.target.value })}>{factorCategories.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Evidence-based rationale"><textarea rows="3" value={factorDraft.rationale} onChange={(event) => setFactorDraft({ ...factorDraft, rationale: event.target.value })} placeholder="What evidence supports this factor?" /></Field><button className="button button-outline" onClick={addFactor}><Plus size={14} /> Add factor</button></div><div className="factor-editor-list">{worksheet.factors.map((factor, index) => <div className="factor-editor-item" key={`${factor.category}-${index}`}><span className="factor-mark">{factor.category.slice(0, 1)}</span><div><strong>{factor.category}</strong><p>{factor.rationale}</p></div><button className="icon-button" onClick={() => update('factors', worksheet.factors.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${factor.category}`}><X size={14} /></button></div>)}</div></aside></div>;
}

function ActionsWorkspace({ incident, base, save, saving }) {
  async function createAction(event) {
    event.preventDefault();
    if (await save(`${base}/actions`, Object.fromEntries(new FormData(event.currentTarget).entries()), 'POST', 'Preventive action assigned')) event.currentTarget.reset();
  }
  async function reviewAction(action, nextStatus) {
    const reviewer = window.prompt('Reviewer name (must be different from the action owner):');
    if (!reviewer) return;
    const result = window.prompt('Effectiveness review: did the fix prevent recurrence? Record evidence:');
    if (!result) return;
    await save(`${base}/actions/${action.id}`, { status: nextStatus, reviewer, review_result: result }, 'PATCH', 'Effectiveness review recorded');
  }
  async function markCompleted(action) {
    await save(`${base}/actions/${action.id}`, { status: 'Completed' }, 'PATCH', 'Action marked completed; independent review is still required');
  }
  return <div className="actions-layout"><section className="panel actions-main"><SectionHeading eyebrow="CORRECTIVE AND PREVENTIVE ACTIONS" title="Prevent recurrence" detail="Every action links a finding to an owner, interim controls, and a due date." /><div className="action-guidance"><Shield size={16} /><span>Actions stay open until effectiveness is reviewed by someone other than the action owner.</span></div>{incident.actions?.length ? <div className="action-table">{incident.actions.map((action) => <article className="action-card" key={action.id}><div className="action-card-top"><span className={`action-status-dot ${action.status.toLowerCase()}`} /><div className="action-card-title"><h3>{action.title}</h3><span className={`status-label ${action.status === 'Closed' ? 'status-done' : ''}`}>{action.status}</span></div></div><p className="action-cause"><span>LINKED FINDING</span>{action.root_cause || 'No linked cause recorded'}</p><div className="action-details"><div><small>OWNER</small><strong>{action.owner}</strong></div><div><small>DUE DATE</small><strong>{dateLabel(action.due_date, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></div><div><small>INTERIM CONTROL</small><strong>{action.interim_controls || 'Not specified'}</strong></div></div>{action.review_result && <div className="review-result"><Check size={14} /><span><strong>Effectiveness review · {action.reviewer}</strong><small>{action.review_result}</small></span></div>}{action.status !== 'Closed' && <div className="action-controls">{action.status === 'Open' && <button className="button button-outline" onClick={() => save(`${base}/actions/${action.id}`, { status: 'In progress' }, 'PATCH', 'Action updated')}><Activity size={14} /> Mark in progress</button>}{action.status !== 'Completed' && <button className="button button-quiet" onClick={() => markCompleted(action)}><Check size={14} /> Mark completed</button>}{action.status === 'Completed' && <button className="button button-primary" onClick={() => reviewAction(action, 'Closed')}><ClipboardCheck size={14} /> Review effectiveness</button>}</div>}</article>)}</div> : <EmptyState title="No actions assigned" detail="Translate the investigation findings into a practical preventive action." />}</section>
    <aside className="panel new-action-panel"><div className="panel-head"><div><p className="eyebrow">ASSIGN AN ACTION</p><h3>New preventive action</h3></div><span className="panel-index">01</span></div><form className="stack-form" onSubmit={createAction}><Field label="Action"><input name="title" required placeholder="What will be changed?" /></Field><Field label="Linked root cause or finding"><textarea name="root_cause" rows="3" placeholder="Connect the action to a documented finding" /></Field><Field label="Owner"><input name="owner" required placeholder="Accountable person" /></Field><Field label="Due date"><input name="due_date" type="date" /></Field><Field label="Interim controls"><textarea name="interim_controls" rows="3" placeholder="How will risk be managed until the action is complete?" /></Field><button className="button button-primary full-button" disabled={saving}><Plus size={15} /> Assign action</button></form><div className="reviewer-note"><Users size={15} /><span><strong>Independent review</strong><small>The reviewer must not be the action owner.</small></span></div></aside></div>;
}

function ToolboxWorkspace({ incident, base, save, saving }) {
  const [attendeeDraft, setAttendeeDraft] = useState({});
  const findings = [incident.description, ...(incident.factors || []).map((factor) => `${factor.category}: ${factor.rationale}`), ...(incident.actions || []).map((action) => `Preventive action: ${action.title}`)].filter(Boolean);
  const suggested = `Today's learning: ${incident.title}.\n\nWhat happened\n${incident.description || 'Review the event record.'}\n\nConditions we identified\n${(incident.factors || []).map((factor) => `• ${factor.category}: ${factor.rationale}`).join('\n') || 'Discuss the conditions in the investigation record.'}\n\nWhat we are changing\n${(incident.actions || []).map((action) => `• ${action.title}`).join('\n') || 'Review the preventive actions assigned.'}\n\nCrew discussion\nWhat would help you recognize this situation, and what should we do if these conditions appear again?`;
  async function createTalk(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (await save(`${base}/toolbox`, Object.fromEntries(new FormData(form).entries()), 'POST', 'Toolbox talk recorded')) form.reset();
  }
  async function saveAttendance(talk) {
    const names = (attendeeDraft[talk.id] ?? (talk.attendees || []).join('\n')).split('\n').map((name) => name.trim()).filter(Boolean);
    await save(`${base}/toolbox/${talk.id}/attendance`, { attendees: names, understanding_check: talk.understanding_check }, 'PATCH', 'Attendance saved');
  }
  return <div className="toolbox-layout"><section className="panel talk-builder"><SectionHeading eyebrow="SHARE WHAT THE INVESTIGATION LEARNED" title="Crew learning" detail="Turn findings into a short, practical briefing. Attendance is recorded separately from competency." /><div className="talk-source"><Sparkles size={16} /><span><strong>Briefing based on this case</strong><small>{findings.length} source findings available · Review and edit before delivery</small></span></div><form className="stack-form talk-form" onSubmit={createTalk}><Field label="Talk title"><input name="title" required defaultValue={`Learning from ${incident.title}`} /></Field><Field label="Facilitator"><input name="facilitator" placeholder="Facilitator name" /></Field><Field label="Delivered on"><input name="delivered_at" type="datetime-local" /></Field><Field label="Briefing and discussion prompts"><textarea name="content" rows="12" defaultValue={suggested} /></Field><Field label="Understanding check prompt"><input name="understanding_check" defaultValue="What is one condition you would watch for, and what action would you take?" /></Field><button className="button button-primary" disabled={saving}><Check size={15} /> Record delivery</button></form></section>
    <aside className="talk-aside"><section className="panel learning-note"><div className="learning-icon"><HardHat size={19} /></div><h3>Learning, shared clearly.</h3><p>Keep the briefing focused on the work conditions and controls revealed by the investigation. Invite questions and practical feedback from the crew.</p><div className="attendance-distinction"><Info size={15} /><span>Attendance confirms presence only. An understanding check is a discussion prompt, not a competency assessment.</span></div></section><section className="panel attendance-panel"><div className="panel-head"><div><p className="eyebrow">DELIVERY RECORDS</p><h3>Talks & attendance</h3></div><span className="count-pill">{incident.talks?.length || 0}</span></div>{incident.talks?.length ? incident.talks.map((talk) => <article className="talk-record" key={talk.id}><div className="talk-record-head"><strong>{talk.title}</strong><small>{dateLabel(talk.delivered_at)} · {talk.facilitator || 'Facilitator not recorded'}</small></div><details><summary>Edit attendance <ChevronDown size={13} /></summary><textarea rows="4" value={attendeeDraft[talk.id] ?? (talk.attendees || []).join('\n')} onChange={(event) => setAttendeeDraft({ ...attendeeDraft, [talk.id]: event.target.value })} placeholder="One attendee per line" /><button className="button button-outline" onClick={() => saveAttendance(talk)}>Save attendance</button></details><div className="attendee-count"><Users size={13} /> {talk.attendees?.length || 0} attendance records <span>· Not a competency record</span></div></article>) : <EmptyState title="No briefings delivered" detail="Record delivery after the crew talk has taken place." />}</section></aside></div>;
}
