export function AlternativeEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50 h-full animate-in fade-in duration-300">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
          💡
        </div>
        <h2 className="font-serif text-2xl text-slate-900 dark:text-white mb-3">
          Descubre Nuevas Perspectivas
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
          Selecciona un reporte de alineamiento en el panel lateral para generar temas alternativos. Identificaremos brechas en tu perfil y te sugeriremos proyectos, cursos y temas optimizados para ti.
        </p>
      </div>
    </div>
  );
}
