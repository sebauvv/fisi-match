import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ParsedCv {
  habilidades: string[];
  experiencia: string[];
  proyectos: string[];
}

function parseCvText(text: string): ParsedCv {
  const sections: ParsedCv = { habilidades: [], experiencia: [], proyectos: [] };
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let current: keyof ParsedCv | null = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('habilidades tecnicas:') || lower.startsWith('habilidades técnicas:')) {
      current = 'habilidades';
      continue;
    }
    if (lower.startsWith('experiencia laboral:')) {
      current = 'experiencia';
      continue;
    }
    if (lower.startsWith('proyectos personales:')) {
      current = 'proyectos';
      continue;
    }
    if (current && line.startsWith('-')) {
      const content = line.replace(/^-\s*/, '');
      sections[current].push(content);
    }
  }
  return sections;
}

function extractTags(habilidades: string[]): string[] {
  return habilidades.flatMap((line) => {
    const parts = line.split(':');
    if (parts.length > 1) {
      return parts[1].split(',').map((s) => s.trim()).filter(Boolean);
    }
    return line.split(',').map((s) => s.trim()).filter(Boolean);
  });
}

interface SkillsSectionProps {
  cvText: string;
}

export default function SkillsSection({ cvText }: SkillsSectionProps) {
  const { updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cvText);

  const parsed = parseCvText(cvText);
  const tags = extractTags(parsed.habilidades);

  const handleSave = () => {
    updateUser({ cv_text: draft });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-bg-surface transition-colors dark:border-dark-border dark:bg-dark-bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-dark-border">
        <span className="flex items-center gap-2 text-sm font-bold text-text-primary dark:text-dark-text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-success dark:bg-dark-success" />
          Habilidades
        </span>
        <button
          onClick={() => (editing ? handleSave() : setEditing(true))}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-soft dark:text-dark-accent dark:hover:bg-dark-accent-soft"
        >
          {editing ? (
            <>
              <Check className="h-3 w-3" />
              Guardar
            </>
          ) : (
            <>
              <Pencil className="h-3 w-3" />
              Editar
            </>
          )}
        </button>
      </div>

      <div className="p-5">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[200px] w-full resize-y rounded-lg border border-border bg-bg-surface-alt p-3 text-sm leading-relaxed text-text-primary outline-none transition-colors focus:border-border-focus dark:border-dark-border dark:bg-dark-bg-surface-alt dark:text-dark-text-primary dark:focus:border-dark-border-focus"
            placeholder="Habilidades Tecnicas:\n- Categoria: tecnologia1, tecnologia2\n\nExperiencia Laboral:\n- Cargo en Empresa (Periodo): Descripcion\n\nProyectos Personales:\n- NombreProyecto: Descripcion"
          />
        ) : (
          <>
            {/* Technical Skills Tags */}
            <div className="mb-5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted dark:text-dark-text-muted">
                <span className="h-2 w-2 rounded-full bg-accent dark:bg-dark-accent" />
                Habilidades Técnicas
              </p>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-bg-surface-alt px-3 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent dark:border-dark-border dark:bg-dark-bg-surface-alt dark:text-dark-text-secondary dark:hover:border-dark-accent dark:hover:bg-dark-accent-soft dark:hover:text-dark-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted dark:text-dark-text-muted">
                  No se encontraron habilidades técnicas. Sube tu CV para extraerlas.
                </p>
              )}
            </div>

            {/* Work Experience */}
            {parsed.experiencia.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted dark:text-dark-text-muted">
                  <span className="h-2 w-2 rounded-full bg-success dark:bg-dark-success" />
                  Experiencia Laboral
                </p>
                <ul className="space-y-2">
                  {parsed.experiencia.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-primary dark:text-dark-text-primary">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success dark:bg-dark-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Personal Projects */}
            {parsed.proyectos.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted dark:text-dark-text-muted">
                  <span className="h-2 w-2 rounded-full bg-warning dark:bg-dark-warning" />
                  Proyectos Personales
                </p>
                <ul className="space-y-2">
                  {parsed.proyectos.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-primary dark:text-dark-text-primary">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning dark:bg-dark-warning" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length === 0 && parsed.experiencia.length === 0 && parsed.proyectos.length === 0 && (
              <p className="text-sm text-text-muted dark:text-dark-text-muted">
                No se encontró información estructurada en el CV. Sube un nuevo CV o edita manualmente.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
