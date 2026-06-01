interface ProfileHeaderProps {
  subtitle?: string;
  period?: string;
}

export default function ProfileHeader({ subtitle = 'Visualiza y actualiza tu información académica y documentos', period }: ProfileHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="font-serif text-3xl text-text-primary dark:text-dark-text-primary leading-tight">
          Perfil del Estudiante
        </h1>
        <p className="mt-1 text-xs text-text-muted dark:text-dark-text-muted">
          {subtitle}
        </p>
      </div>
      {period && (
        <span className="inline-flex items-center rounded-full border border-accent bg-accent-soft px-3 py-1 text-xs font-semibold tracking-wide text-accent dark:border-dark-accent dark:bg-dark-accent-soft dark:text-dark-accent">
          {period}
        </span>
      )}
    </div>
  );
}
