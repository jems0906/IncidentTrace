import { FileText } from 'lucide-react';

export function Field({ label, children, className = '' }) {
  return <label className={`field ${className}`}><span>{label}</span>{children}</label>;
}

export function SectionHeading({ eyebrow, title, detail, action }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{detail && <p className="muted">{detail}</p>}</div>{action}</div>;
}

export function EmptyState({ title, detail }) {
  return <div className="empty-state"><span className="empty-icon"><FileText size={20} /></span><strong>{title}</strong><p>{detail}</p></div>;
}
