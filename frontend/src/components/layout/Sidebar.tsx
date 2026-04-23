import { X, Search, BookOpen, FileText, Compass, ClipboardList, Lightbulb } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Explorador de Profesores', icon: Search },
  { label: 'Explorador de Tesis', icon: BookOpen },
  { label: 'Explorador de Articulos Externos', icon: FileText },
  { label: 'Recomendacion de Asesor', icon: Compass },
  { label: 'Reporte de Alineamiento', icon: ClipboardList },
  { label: 'Recomendacion de Temas Alternativos', icon: Lightbulb },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-bg-surface transition-transform duration-300 dark:border-dark-border dark:bg-dark-bg-surface ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5 dark:border-dark-border">
          <span className="text-lg font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
            FISI Match
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover dark:text-dark-text-muted dark:hover:bg-dark-bg-hover"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary dark:text-dark-text-secondary dark:hover:bg-dark-bg-hover dark:hover:text-dark-text-primary"
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 dark:border-dark-border">
          <p className="text-xs text-text-muted dark:text-dark-text-muted">
            FISI Match v0.1
          </p>
        </div>
      </aside>
    </>
  );
}
