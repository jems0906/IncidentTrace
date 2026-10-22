import { Plus, Shield, X } from 'lucide-react';
import { Field } from './ui.jsx';

export default function IncidentIntake({ onClose, onSubmit, saving }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="modal" onSubmit={onSubmit}>
      <div className="modal-head"><div><p className="eyebrow">NEW INVESTIGATION</p><h2>Record an incident</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <p className="modal-intro">A no-fault record helps us understand what conditions made this event possible.</p>
      <div className="form-grid">
        <Field label="Investigation title"><input name="title" required placeholder="Briefly describe the event" /></Field>
        <Field label="Event type"><select name="incident_type" defaultValue="Near miss"><option>Injury</option><option>Vehicle incident</option><option>Property damage</option><option>Near miss</option><option>Environmental</option></select></Field>
        <Field label="Date and time"><input name="occurred_at" type="datetime-local" /></Field>
        <Field label="Location"><input name="location" placeholder="Site, area, or route" /></Field>
        <Field label="Reported by"><input name="reporter" placeholder="Name" /></Field>
        <Field label="What happened?" className="field-wide"><textarea name="description" rows="3" placeholder="Describe the event as observed. Avoid assumptions about cause." /></Field>
        <Field label="Immediate actions to make the scene safe" className="field-wide"><textarea name="immediate_actions" rows="2" placeholder="What was done before the investigation began?" /></Field>
      </div>
      <div className="modal-foot"><span><Shield size={14} /> No blame. Learn and prevent recurrence.</span><button className="button button-primary" disabled={saving}><Plus size={15} /> Create investigation</button></div>
    </form>
  </div>;
}
