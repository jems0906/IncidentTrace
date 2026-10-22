import { useState } from 'react';
import { Activity, Check, ClipboardCheck, Shield, Users } from 'lucide-react';
import { dateLabel } from '../lib/format.js';
import { EmptyState, Field, SectionHeading } from './ui.jsx';
import './capa.css';

export default function PreventiveActions({ incident, base, save, saving }) {
  async function createAction(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (await save(`${base}/actions`, Object.fromEntries(new FormData(form).entries()), 'POST', 'Preventive action assigned')) form.reset();
  }

  async function reviewAction(action) {
    const reviewer = window.prompt('Reviewer name (must be different from the action owner):');
    if (!reviewer) return;
    const result = window.prompt('Effectiveness review: did the fix prevent recurrence? Record evidence:');
    if (!result) return;
    await save(`${base}/actions/${action.id}`, { status: 'Closed', reviewer, review_result: result }, 'PATCH', 'Effectiveness review recorded');
  }

  async function markCompleted(action) {
    await save(`${base}/actions/${action.id}`, { status: 'Completed' }, 'PATCH', 'Action marked completed; independent review is still required');
  }

  return <div className="actions-layout">
    <section className="panel actions-main">
      <SectionHeading eyebrow="CORRECTIVE AND PREVENTIVE ACTIONS" title="Prevent recurrence" detail="Every action links a finding to an owner, interim controls, and a due date." />
      <div className="action-guidance"><Shield size={16} /><span>Actions stay open until effectiveness is reviewed by someone other than the action owner.</span></div>
      {incident.actions?.length ? <div className="action-table">{incident.actions.map((action) => <article className="action-card" key={action.id}>
        <div className="action-card-top"><span className={`action-status-dot ${action.status.toLowerCase()}`} /><div className="action-card-title"><h3>{action.title}</h3><div className="action-badges"><span className={`status-label priority-${(action.priority || 'Medium').toLowerCase()}`}>{action.priority || 'Medium'} priority</span><span className={`status-label ${action.status === 'Closed' ? 'status-done' : ''}`}>{action.status}</span></div></div></div>
        <p className="action-source"><span>SOURCE</span>{action.source || 'Incident investigation'}</p>
        <p className="action-cause"><span>LINKED FINDING</span>{action.root_cause || 'No linked cause recorded'}</p>
        <div className="action-details"><div><small>OWNER</small><strong>{action.owner}</strong></div><div><small>DUE DATE</small><strong>{dateLabel(action.due_date)}</strong></div><div><small>INTERIM CONTROL</small><strong>{action.interim_controls || 'Not specified'}</strong></div></div>
        {action.detail && <p className="action-verification"><strong>Verification notes</strong>{action.detail}</p>}
        {action.review_result && <div className="review-result"><Check size={14} /><span><strong>Effectiveness review · {action.reviewer}</strong><small>{action.review_result}</small></span></div>}
        {action.status !== 'Closed' && <div className="action-controls">
          {action.status === 'Open' && <button className="button button-outline" onClick={() => save(`${base}/actions/${action.id}`, { status: 'In progress' }, 'PATCH', 'Action updated')}><Activity size={14} /> Mark in progress</button>}
          {action.status !== 'Completed' && <button className="button button-quiet" onClick={() => markCompleted(action)}><Check size={14} /> Mark completed</button>}
          {action.status === 'Completed' && <button className="button button-primary" onClick={() => reviewAction(action)}><ClipboardCheck size={14} /> Review effectiveness</button>}
        </div>}
      </article>)}</div> : <EmptyState title="No actions assigned" detail="Translate the investigation findings into a practical preventive action." />}
    </section>
    <aside className="panel new-action-panel">
      <div className="panel-head"><div><p className="eyebrow">ASSIGN AN ACTION</p><h3>New preventive action</h3></div><span className="panel-index">01</span></div>
      <form className="stack-form" onSubmit={createAction}>
        <Field label="Action"><input name="title" required placeholder="What will be changed?" /></Field>
        <Field label="Source reference"><input name="source" defaultValue={`INC-${String(incident.id).padStart(4, '0')}`} placeholder="Incident, audit, or observation ID" /></Field>
        <Field label="Linked root cause or finding"><textarea name="root_cause" rows="3" placeholder="Connect the action to a documented finding" /></Field>
        <Field label="Owner"><input name="owner" required placeholder="Accountable person" /></Field>
        <Field label="Due date"><input name="due_date" type="date" /></Field>
        <Field label="Priority"><select name="priority" defaultValue="Medium"><option>High</option><option>Medium</option><option>Low</option></select></Field>
        <Field label="Verification notes"><textarea name="detail" rows="2" placeholder="What evidence will confirm the action is effective?" /></Field>
        <Field label="Interim controls"><textarea name="interim_controls" rows="3" placeholder="How will risk be managed until the action is complete?" /></Field>
        <button className="button button-primary full-button" disabled={saving}><ClipboardCheck size={15} /> Assign action</button>
      </form>
      <div className="reviewer-note"><Users size={15} /><span><strong>Independent review</strong><small>The reviewer must not be the action owner.</small></span></div>
    </aside>
  </div>;
}
