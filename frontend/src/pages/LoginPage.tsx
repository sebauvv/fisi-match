import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginStudent } from '../api/authApi';
import type { AuthUser } from '../types/student';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginStudent(email, password);

      const user: AuthUser = {
        student_id: res.student_id,
        email: res.email,
        // Minimal fields — full profile loaded on demand via GET /students/{id}
        estudiante: {
          nombres_apellidos: res.nombres_apellidos,
          codigo_matricula: '',
          facultad: '',
          escuela: '',
          plan: '',
        },
        periodos_academicos: [],
        resumen_creditos: {
          creditaje_requerido_para_egresar: 0,
          creditaje_aprobado: 0,
          obligatorios: 0,
          de_especialidad: 0,
          electivos_generales: 0,
          electivos_de_especialidad: 0,
          optativos: 0,
          alternativos: 0,
          de_otra_especialidad: 0,
          mas_de_una_vez: 0,
          otros: 0,
          creditaje_faltante: 0,
          promedio_ponderado: 0,
        },
        cv_text: '',
        pdf_urls: {},
      };

      login(user, res.access_token);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
            FISI Match
          </h1>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            Sistema de Recomendacion de Asesor de Tesis
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-bg-surface p-8 shadow-sm dark:border-dark-border dark:bg-dark-bg-surface">
          <h2 className="mb-6 text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            Iniciar sesion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                Correo institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@unmsm.edu.pe"
                  className="w-full rounded-xl border border-border bg-bg-primary py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors focus:border-accent dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:focus:border-dark-accent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contrasena"
                  className="w-full rounded-xl border border-border bg-bg-primary py-3 pl-10 pr-10 text-sm text-text-primary outline-none transition-colors focus:border-accent dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:focus:border-dark-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error dark:bg-dark-error/10 dark:text-dark-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60 dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
            >
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
            No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-accent hover:underline dark:text-dark-accent">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
