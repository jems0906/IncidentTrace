export default function FiveWhysWorksheet({ answers, onChange }) {
  return <section className="panel five-whys-panel">
    <div className="panel-head"><div><p className="eyebrow">ITERATIVE QUESTIONING</p><h3>5 Whys worksheet</h3></div><span className="worksheet-tag">INVESTIGATOR-LED</span></div>
    <p className="muted">Follow the evidence through system conditions. Five is a guide, not a required stopping point.</p>
    <div className="why-list">{answers.map((answer, index) => <div className="why-row" key={index}><span className="why-count">WHY {index + 1}</span><input value={answer} onChange={(event) => onChange(answers.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} placeholder={index === 0 ? 'Why did the event occur?' : 'Why was that condition present?'} /></div>)}</div>
  </section>;
}
