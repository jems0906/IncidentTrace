import { useState } from 'react';
import { Check, ChevronDown, HardHat, Info, Sparkles, Users } from 'lucide-react';
import { dateLabel } from '../lib/format.js';
import { EmptyState, Field, SectionHeading } from './ui.jsx';

export default function ToolboxTalk({ incident, base, save, saving }) {
  const [attendeeDraft, setAttendeeDraft] = useState({});
  const findings = [incident.description, ...(incident.factors || []).map((factor) => `${factor.category}: ${factor.rationale}`), ...(incident.actions || []).map((action) => `Preventive action: ${action.title}`)].filter(Boolean);
  const suggested = `Today's learning: ${incident.title}.\n\nWhat happened\n${incident.description || 'Review the event record.'}\n\nConditions we identified\n${(incident.factors || []).map((factor) => `- ${factor.category}: ${factor.rationale}`).join('\n') || 'Discuss the conditions in the investigation record.'}\n\nWhat we are changing\n${(incident.actions || []).map((action) => `- ${action.title}`).join('\n') || 'Review the preventive actions assigned.'}\n\nCrew discussion\nWhat would help you recognize this situation, and what should we do if these conditions appear again?`;

  async function createTalk(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (await save(`${base}/toolbox`, Object.fromEntries(new FormData(form).entries()), 'POST', 'Toolbox talk recorded')) form.reset();
  }

  async function saveAttendance(talk) {
    const names = (attendeeDraft[talk.id] ?? (talk.attendees || []).join('\n')).split('\n').map((name) => name.trim()).filter(Boolean);
    await save(`${base}/toolbox/${talk.id}/attendance`, { attendees: names, understanding_check: talk.understanding_check }, 'PATCH', 'Attendance saved');
  }

  return <div className="toolbox-layout">
    <section className="panel talk-builder">
      <SectionHeading eyebrow="SHARE WHAT THE INVESTIGATION LEARNED" title="Crew learning" detail="Turn findings into a short, practical briefing. Attendance is recorded separately from competency." />
      <div className="talk-source"><Sparkles size={16} /><span><strong>Briefing based on this case</strong><small>{findings.length} source findings available · Review and edit before delivery</small></span></div>
      <form className="stack-form talk-form" onSubmit={createTalk}>
        <Field label="Talk title"><input name="title" required defaultValue={`Learning from ${incident.title}`} /></Field>
        <Field label="Facilitator"><input name="facilitator" placeholder="Facilitator name" /></Field>
        <Field label="Delivered on"><input name="delivered_at" type="datetime-local" /></Field>
        <Field label="Briefing and discussion prompts"><textarea name="content" rows="12" defaultValue={suggested} /></Field>
        <Field label="Understanding check prompt"><input name="understanding_check" defaultValue="What is one condition you would watch for, and what action would you take?" /></Field>
        <button className="button button-primary" disabled={saving}><Check size={15} /> Record delivery</button>
      </form>
    </section>
    <aside className="talk-aside">
      <section className="panel learning-note"><div className="learning-icon"><HardHat size={19} /></div><h3>Learning, shared clearly.</h3><p>Keep the briefing focused on the work conditions and controls revealed by the investigation. Invite questions and practical feedback from the crew.</p><div className="attendance-distinction"><Info size={15} /><span>Attendance confirms presence only. An understanding check is a discussion prompt, not a competency assessment.</span></div></section>
      <section className="panel attendance-panel">
        <div className="panel-head"><div><p className="eyebrow">DELIVERY RECORDS</p><h3>Talks & attendance</h3></div><span className="count-pill">{incident.talks?.length || 0}</span></div>
        {incident.talks?.length ? incident.talks.map((talk) => <article className="talk-record" key={talk.id}>
          <div className="talk-record-head"><strong>{talk.title}</strong><small>{dateLabel(talk.delivered_at)} · {talk.facilitator || 'Facilitator not recorded'}</small></div>
          <details><summary>Edit attendance <ChevronDown size={13} /></summary><textarea rows="4" value={attendeeDraft[talk.id] ?? (talk.attendees || []).join('\n')} onChange={(event) => setAttendeeDraft({ ...attendeeDraft, [talk.id]: event.target.value })} placeholder="One attendee per line" /><button className="button button-outline" onClick={() => saveAttendance(talk)}>Save attendance</button></details>
          <div className="attendee-count"><Users size={13} /> {talk.attendees?.length || 0} attendance records <span>· Not a competency record</span></div>
        </article>) : <EmptyState title="No briefings delivered" detail="Record delivery after the crew talk has taken place." />}
      </section>
    </aside>
  </div>;
}
