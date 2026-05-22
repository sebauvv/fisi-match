import { useNavigate } from 'react-router-dom';
import { PenLine, Target, Lightbulb, Compass, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Action {
  icon: typeof PenLine;
  label: string;
  desc: string;
  path: string;
  gradient: string;
}

export default function QuickActions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const actions: Action[] = [];

  if (!user.thesis_idea || !user.thesis_idea.trim()) {
    actions.push({
      icon: PenLine, label: 'Define tu idea de tesis',
      desc: 'Escribe tu tema para desbloquear las herramientas de análisis',
      path: '/profile', gradient: 'from-[#5B8DEF]/10 to-[#8B5CF6]/10 dark:from-[#5B8DEF]/20 dark:to-[#8B5CF6]/20',
    });
  }

  if (!user.cv_text) {
    actions.push({
      icon: Upload, label: 'Sube tu CV',
      desc: 'Mejora la precisión del análisis con tu experiencia',
      path: '/profile', gradient: 'from-[#C4893D]/10 to-[#EC4899]/10 dark:from-[#C4893D]/20 dark:to-[#EC4899]/20',
    });
  }

  if (user.thesis_idea?.trim()) {
    actions.push({
      icon: Target, label: 'Evalúa tu alineamiento',
      desc: 'Descubre qué tan preparado estás para tu tema',
      path: '/reporte-alineamiento', gradient: 'from-[#3D8B5E]/10 to-[#4F6D7A]/10 dark:from-[#3D8B5E]/20 dark:to-[#4F6D7A]/20',
    });
    actions.push({
      icon: Compass, label: 'Busca tu asesor ideal',
      desc: 'Encuentra profesores alineados a tu investigación',
      path: '/recomendacion-asesor', gradient: 'from-[#4F6D7A]/10 to-[#5B8DEF]/10 dark:from-[#4F6D7A]/20 dark:to-[#5B8DEF]/20',
    });
    actions.push({
      icon: Lightbulb, label: 'Explora temas alternativos',
      desc: 'Descubre rutas de investigación complementarias',
      path: '/temas-alternativos', gradient: 'from-[#8B5CF6]/10 to-[#EC4899]/10 dark:from-[#8B5CF6]/20 dark:to-[#EC4899]/20',
    });
  }

  if (!actions.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
      <h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
        ¿Qué hacer ahora?
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.slice(0, 4).map(a => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className={`group flex items-start gap-3 rounded-xl bg-gradient-to-br ${a.gradient} p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]`}>
            <a.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent dark:text-dark-accent" />
            <div>
              <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{a.label}</p>
              <p className="mt-0.5 text-[11px] text-text-muted dark:text-dark-text-muted">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
