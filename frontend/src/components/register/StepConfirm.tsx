import { useState } from 'react';
import { Pencil, Eye } from 'lucide-react';
import type { StudentProfile } from '../../types/student';
import CoursesModal from '../ui/CoursesModal';
import { updateStudent } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';

interface StepConfirmProps {
  profile: StudentProfile;
  onConfirm: () => void;
}

export default function StepConfirm({ profile, onConfirm }: StepConfirmProps) {
  const [showCourses, setShowCourses] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editCV, setEditCV] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, token, updateUser } = useAuth();

  const est = profile.historial.estudiante;
  const resumen = profile.historial.resumen_creditos;
  const periods = profile.historial.periodos_academicos;
  const cvText = profile.cv?.cv_text || '';

  // Editable personal fields
  const [nombre, setNombre] = useState(est.nombres_apellidos);
  const [codigo, setCodigo] = useState(est.codigo_matricula);
  const [facultad, setFacultad] = useState(est.facultad);
  const [escuela, setEscuela] = useState(est.escuela);
  const [plan, setPlan] = useState(est.plan);
  const [editableCvText, setEditableCvText] = useState(cvText);

  // Credit summary rows
  const creditRows = [
    { label: 'Creditaje Requerido para Egresar', value: resumen.creditaje_requerido_para_egresar },
    { label: 'Creditaje Aprobado', value: resumen.creditaje_aprobado },
    { label: 'Obligatorios', value: resumen.obligatorios },
    { label: 'De Especialidad', value: resumen.de_especialidad },
    { label: 'Electivos Generales', value: resumen.electivos_generales },
    { label: 'Electivos de Especialidad', value: resumen.electivos_de_especialidad },
    { label: 'Optativos', value: resumen.optativos },
    { label: 'Alternativos', value: resumen.alternativos },
    { label: 'De Otra Especialidad', value: resumen.de_otra_especialidad },
    { label: 'Mas de una vez', value: resumen.mas_de_una_vez },
    { label: 'Otros', value: resumen.otros },
    { label: 'Creditaje Faltante', value: resumen.creditaje_faltante },
    { label: 'Promedio Ponderado', value: resumen.promedio_ponderado },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-8">
      {/* Section 1: Informacion Personal */}
      <section className="rounded-2xl border border-border bg-bg-surface p-6 dark:border-dark-border dark:bg-dark-bg-surface">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Informacion Personal
          </h3>
          <button
            type="button"
            onClick={() => setEditPersonal(!editPersonal)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-soft dark:text-dark-accent dark:hover:bg-dark-accent-soft"
          >
            <Pencil className="h-3.5 w-3.5" />
            {editPersonal ? 'Listo' : 'Editar'}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Nombre completo', value: nombre, setter: setNombre },
            { label: 'Codigo de matricula', value: codigo, setter: setCodigo },
            { label: 'Facultad', value: facultad, setter: setFacultad },
            { label: 'Escuela', value: escuela, setter: setEscuela },
            { label: 'Plan de estudios', value: plan, setter: setPlan },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="mb-1 block text-xs font-medium text-text-muted dark:text-dark-text-muted">
                {label}
              </label>
              {editPersonal ? (
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:focus:border-dark-accent"
                />
              ) : (
                <p className="rounded-lg bg-bg-surface-alt px-3 py-2 text-sm text-text-primary dark:bg-dark-bg-surface-alt dark:text-dark-text-primary">
                  {value}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Historial Academico */}
      <section className="rounded-2xl border border-border bg-bg-surface p-6 dark:border-dark-border dark:bg-dark-bg-surface">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Historial del Estudiante
          </h3>
          <button
            type="button"
            onClick={() => setShowCourses(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-soft dark:text-dark-accent dark:hover:bg-dark-accent-soft"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver Todo
          </button>
        </div>

        <p className="mb-3 text-xs font-medium text-text-muted dark:text-dark-text-muted">
          Resumen de Creditos Aprobados
        </p>

        <div className="space-y-1">
          {creditRows.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm odd:bg-bg-surface-alt dark:odd:bg-dark-bg-surface-alt"
            >
              <span className="text-text-secondary dark:text-dark-text-secondary">{label}</span>
              <span className="font-semibold text-text-primary dark:text-dark-text-primary">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Perfil Profesional */}
      <section className="rounded-2xl border border-border bg-bg-surface p-6 dark:border-dark-border dark:bg-dark-bg-surface">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Perfil Profesional
          </h3>
          <button
            type="button"
            onClick={() => setEditCV(!editCV)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-soft dark:text-dark-accent dark:hover:bg-dark-accent-soft"
          >
            <Pencil className="h-3.5 w-3.5" />
            {editCV ? 'Listo' : 'Editar'}
          </button>
        </div>

        {editCV ? (
          <textarea
            value={editableCvText}
            onChange={(e) => setEditableCvText(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-border bg-bg-primary p-3 font-mono text-sm text-text-primary outline-none focus:border-accent dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:focus:border-dark-accent"
          />
        ) : (
          <div className="whitespace-pre-wrap rounded-lg bg-bg-surface-alt p-4 font-mono text-sm leading-relaxed text-text-primary dark:bg-dark-bg-surface-alt dark:text-dark-text-primary">
            {editableCvText || 'No se proporciono CV.'}
          </div>
        )}
      </section>

      {/* Confirm button */}
      <button
        type="button"
        onClick={async () => {
          // Si hay JWT y student_id, persiste los cambios editados antes de continuar
          if (token && user?.student_id) {
            setSaving(true);
            try {
              const updated = await updateStudent(user.student_id, token, {
                nombres_apellidos: nombre,
                codigo_matricula: codigo,
                facultad,
                escuela,
                plan,
                cv_text: editableCvText,
              });
              // Sincroniza AuthContext y localStorage con la respuesta real de la API
              updateUser({
                estudiante: {
                  nombres_apellidos: updated.nombres_apellidos ?? nombre,
                  codigo_matricula: updated.codigo_matricula ?? codigo,
                  facultad: updated.facultad ?? facultad,
                  escuela: updated.escuela ?? escuela,
                  plan: updated.plan ?? plan,
                },
                cv_text: updated.cv_text ?? editableCvText,
              });
            } catch {
              // Fallo silencioso: continua de todos modos
            } finally {
              setSaving(false);
            }
          }
          onConfirm();
        }}
        disabled={saving}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60 dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
      >
        {saving ? 'Guardando...' : 'Confirmar y continuar'}
      </button>

      {/* Courses modal */}
      {showCourses && <CoursesModal periods={periods} onClose={() => setShowCourses(false)} />}
    </div>
  );
}
