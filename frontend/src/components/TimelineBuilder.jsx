import { useState } from 'react';
import { ArrowUpRight, FileText, Image, Plus } from 'lucide-react';
import { dateLabel, timeLabel } from '../lib/format.js';
import { EmptyState, Field, SectionHeading } from './ui.jsx';

export default function TimelineBuilder({ incident, base, save, saving }) {
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

  return <div className="workspace-grid">
    <section className="panel wide-panel">
      <SectionHeading eyebrow="RECONSTRUCT THE SEQUENCE" title="Evidence timeline" detail="Record what is known, when it happened, and what supports each entry." action={<button className="button button-quiet" onClick={() => setEvidenceOpen(!evidenceOpen)}><Plus size={15} /> Register evidence</button>} />
      <form className="inline-form event-form" onSubmit={addEvent}>
        <Field label="Date and time"><input name="occurred_at" type="datetime-local" required /></Field>
        <Field label="Event"><input name="event" required placeholder="What was observed or reported?" /></Field>
        <Field label="Source"><input name="source" placeholder="Interview, photo, record..." /></Field>
        <button className="button button-primary" disabled={saving}><Plus size={15} /> Add event</button>
      </form>
      {incident.timeline?.length ? <div className="event-list">{incident.timeline.map((event, index) => <div className="event-row" key={event.id}>
        <div className="event-time"><strong>{timeLabel(event.occurred_at)}</strong><small>{dateLabel(event.occurred_at, { month: 'short', day: 'numeric' })}</small></div>
        <span className="event-stem"><i /></span>
        <div className="event-body"><p>{event.event}</p><small><FileText size={12} /> {event.source || 'Source not recorded'}</small></div>
        <span className="event-sequence">{String(index + 1).padStart(2, '0')}</span>
      </div>)}</div> : <EmptyState title="Timeline is ready for evidence" detail="Add events in chronological order. Each entry should identify its source." />}
    </section>
    <section className="panel evidence-panel">
      <div className="panel-head"><div><p className="eyebrow">EVIDENCE REGISTER</p><h3>Sources reviewed</h3></div><span className="count-pill">{incident.evidence?.length || 0}</span></div>
      {evidenceOpen && <form className="evidence-form" onSubmit={addEvidence}>
        <Field label="Evidence type"><select name="evidence_type"><option>Photo</option><option>Document</option><option>Interview</option><option>Procedure</option><option>Other</option></select></Field>
        <Field label="Label"><input name="label" required placeholder="e.g. Bay 3 floor photo" /></Field>
        <Field label="Link (optional)"><input name="url" type="url" placeholder="https://..." /></Field>
        <Field label="Notes"><textarea name="details" rows="2" placeholder="What does this source establish?" /></Field>
        <Field label="Recorded by"><input name="recorded_by" placeholder="Investigator" /></Field>
        <button className="button button-primary" disabled={saving}><Plus size={14} /> Save evidence</button>
      </form>}
      {incident.evidence?.length ? incident.evidence.map((item) => <div className="evidence-item" key={item.id}>
        <span className="evidence-icon">{item.evidence_type === 'Photo' ? <Image size={17} /> : <FileText size={17} />}</span>
        <div><strong>{item.label}</strong><small>{item.evidence_type} · {item.recorded_by || 'Investigator'}</small>{item.details && <p>{item.details}</p>}{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={12} /></a>}</div>
      </div>) : <EmptyState title="No evidence registered" detail="Add metadata and links for records, photos, interviews, or procedures." />}
    </section>
  </div>;
}
