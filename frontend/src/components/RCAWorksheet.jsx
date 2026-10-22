import { useEffect, useState } from 'react';
import { Check, Info, Shield, X } from 'lucide-react';
import FishboneDiagram from './FishboneDiagram.jsx';
import FiveWhysWorksheet from './FiveWhysWorksheet.jsx';
import { Field, SectionHeading } from './ui.jsx';

const factorCategories = ['Task', 'Equipment / material', 'Environment', 'Supervision', 'Training', 'Procedures'];
const blankRca = { what_happened: '', how_happened: '', why_happened: '', correction: '', five_whys: ['', '', '', '', ''], fishbone: {}, reviewed_by: '', factors: [] };

export default function RCAWorksheet({ incident, base, save, saving }) {
  const [worksheet, setWorksheet] = useState(() => ({ ...blankRca, ...(incident.rca || {}), five_whys: incident.rca?.five_whys?.length ? incident.rca.five_whys : ['', '', '', '', ''], factors: incident.factors || [] }));
  const [factorDraft, setFactorDraft] = useState({ category: factorCategories[0], rationale: '' });
  useEffect(() => setWorksheet({ ...blankRca, ...(incident.rca || {}), five_whys: incident.rca?.five_whys?.length ? incident.rca.five_whys : ['', '', '', '', ''], factors: incident.factors || [] }), [incident]);

  const update = (key, value) => setWorksheet((current) => ({ ...current, [key]: value }));
  function addFactor() {
    if (!factorDraft.rationale.trim()) return;
    update('factors', [...worksheet.factors, { ...factorDraft }]);
    setFactorDraft({ category: factorCategories[0], rationale: '' });
  }

  return <div className="rca-layout">
    <div className="rca-main">
      <section className="panel worksheet-panel">
        <SectionHeading eyebrow="HUMAN-REVIEWED WORKSHEET" title="Root cause analysis" detail="A structured record of investigator reasoning. The software never declares a root cause." />
        <div className="osha-prompts">{[['what_happened', 'What happened?'], ['how_happened', 'How did it happen?'], ['why_happened', 'Why did it happen?'], ['correction', 'What needs to be corrected?']].map(([key, prompt], index) => <Field key={key} label={<><span className="prompt-number">0{index + 1}</span>{prompt}</>}><textarea rows="2" value={worksheet[key] || ''} onChange={(event) => update(key, event.target.value)} placeholder="Record the evidence and reasoning..." /></Field>)}</div>
        <div className="review-row"><Field label="Reviewed by"><input value={worksheet.reviewed_by || ''} onChange={(event) => update('reviewed_by', event.target.value)} placeholder="Investigator name" /></Field><span><Shield size={14} /> Human-reviewed record</span></div>
      </section>
      <FiveWhysWorksheet answers={worksheet.five_whys} onChange={(answers) => update('five_whys', answers)} />
      <section className="panel fishbone-panel">
        <div className="panel-head"><div><p className="eyebrow">CAUSE-AND-EFFECT WORKSHEET</p><h3>Fishbone exploration</h3></div><span className="worksheet-tag">INVESTIGATOR-LED</span></div>
        <p className="muted">Use the diagram to organize evidence and hypotheses. The investigator supplies and reviews every note.</p>
        <FishboneDiagram effect={worksheet.what_happened} causes={worksheet.fishbone} />
        <div className="fishbone-grid">{factorCategories.map((category) => <Field label={category} key={category}><textarea rows="2" value={worksheet.fishbone?.[category] || ''} onChange={(event) => update('fishbone', { ...worksheet.fishbone, [category]: event.target.value })} placeholder="What conditions may have contributed?" /></Field>)}</div>
      </section>
      <div className="save-row"><span><Info size={14} /> Only investigator-selected factors are included in the report.</span><button className="button button-primary" disabled={saving} onClick={() => save(`${base}/rca`, worksheet, 'PUT', 'RCA worksheet saved')}><Check size={15} /> Save worksheet</button></div>
    </div>
    <aside className="panel factor-editor">
      <div className="panel-head"><div><p className="eyebrow">INVESTIGATOR SELECTS</p><h3>Contributing factors</h3></div><span className="count-pill">{worksheet.factors.length}</span></div>
      <p className="muted">Select a taxonomy and justify it with the investigation record.</p>
      <div className="factor-entry">
        <Field label="Factor category"><select value={factorDraft.category} onChange={(event) => setFactorDraft({ ...factorDraft, category: event.target.value })}>{factorCategories.map((category) => <option key={category}>{category}</option>)}</select></Field>
        <Field label="Evidence-based rationale"><textarea rows="3" value={factorDraft.rationale} onChange={(event) => setFactorDraft({ ...factorDraft, rationale: event.target.value })} placeholder="What evidence supports this factor?" /></Field>
        <button className="button button-outline" onClick={addFactor}>Add factor</button>
      </div>
      <div className="factor-editor-list">{worksheet.factors.map((factor, index) => <div className="factor-editor-item" key={`${factor.category}-${index}`}><span className="factor-mark">{factor.category.slice(0, 1)}</span><div><strong>{factor.category}</strong><p>{factor.rationale}</p></div><button className="icon-button" onClick={() => update('factors', worksheet.factors.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${factor.category}`}><X size={14} /></button></div>)}</div>
    </aside>
  </div>;
}
