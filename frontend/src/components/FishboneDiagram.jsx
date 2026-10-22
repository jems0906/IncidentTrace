import './fishbone.css';

const branches = [
  { category: 'Task', x: 185, side: 'upper' },
  { category: 'Equipment / material', x: 365, side: 'upper' },
  { category: 'Environment', x: 545, side: 'upper' },
  { category: 'Supervision', x: 185, side: 'lower' },
  { category: 'Training', x: 365, side: 'lower' },
  { category: 'Procedures', x: 545, side: 'lower' },
];

function preview(text) {
  if (!text) return 'Investigator notes appear here';
  return text.length > 50 ? `${text.slice(0, 47).trimEnd()}...` : text;
}

export default function FishboneDiagram({ effect, causes }) {
  return <figure className="fishbone-figure">
    <svg className="fishbone-svg" viewBox="0 0 900 360" role="img" aria-labelledby="fishbone-title fishbone-description">
      <title id="fishbone-title">Cause-and-effect fishbone worksheet</title>
      <desc id="fishbone-description">Six investigator-authored factor categories connect to the event being examined. The diagram does not infer causes.</desc>
      <defs>
        <marker id="fishbone-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="#367b5d" />
        </marker>
      </defs>
      <line x1="48" y1="180" x2="770" y2="180" stroke="#367b5d" strokeWidth="3" markerEnd="url(#fishbone-arrow)" />
      {branches.map(({ category, x, side }) => {
        const upper = side === 'upper';
        const jointY = upper ? 180 : 180;
        const endY = upper ? 72 : 288;
        const labelY = upper ? 31 : 320;
        const noteY = upper ? 48 : 297;
        const anchor = x < 220 ? 'start' : x > 500 ? 'end' : 'middle';
        const labelX = x + (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0);
        return <g key={category}>
          <line x1={x - 30} y1={jointY} x2={x} y2={endY} stroke="#82a991" strokeWidth="2" />
          <circle cx={x - 30} cy={jointY} r="4" fill="#d28a54" />
          <text x={labelX} y={labelY} textAnchor={anchor} className="fishbone-category">{category}</text>
          <text x={labelX} y={noteY} textAnchor={anchor} className="fishbone-note">{preview(causes?.[category] || '')}</text>
        </g>;
      })}
      <path d="M770 180 L795 160 L795 200 Z" fill="#367b5d" />
      <rect x="796" y="126" width="96" height="108" rx="4" fill="#f1f5ef" stroke="#cbdccf" />
      <text x="844" y="148" textAnchor="middle" className="fishbone-effect-label">EFFECT</text>
      <foreignObject x="803" y="157" width="82" height="68">
        <div xmlns="http://www.w3.org/1999/xhtml" className="fishbone-effect-text">{effect || 'Event being examined'}</div>
      </foreignObject>
      <text x="48" y="169" className="fishbone-origin">CONDITIONS</text>
    </svg>
    <figcaption>Each branch displays investigator-entered notes. Empty branches are prompts, not implied causes.</figcaption>
  </figure>;
}
