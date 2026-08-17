import { SECTIONS } from './platformSections';

const ROLE_ACCESS = { operations: ['admin', 'risk_analyst'] };

export default function PlatformNav({ activeSection, onChange, user }) {
  const sections = user ? SECTIONS.filter(({ id }) => !ROLE_ACCESS[id] || ROLE_ACCESS[id].includes(user.role)) : SECTIONS;
  return (
    <nav className="border-b border-line bg-panel/80" aria-label="Platform modules">
      <div className="max-w-[1600px] mx-auto px-6 flex gap-1 overflow-x-auto">
        {sections.map(({ id, label, icon: Icon }, index) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`shrink-0 flex items-center gap-2 px-3 py-3 border-b-2 text-xs font-medium transition-colors ${
              activeSection === id
                ? 'border-signal text-signal'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
            }`}
            aria-current={activeSection === id ? 'page' : undefined}
          >
            <span className="font-mono text-[9px] text-ink-dim">0{index + 1}</span>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}


