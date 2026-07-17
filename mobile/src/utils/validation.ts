export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string' || email.trim().length === 0) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export interface PasswordStrength {
  valid: boolean;
  reasons: string[];
}

const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: unknown): PasswordStrength {
  const reasons: string[] = [];
  if (typeof password !== 'string') {
    return { valid: false, reasons: ['La contraseña debe ser un texto'] };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    reasons.push(`Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!/[A-Z]/.test(password)) {
    reasons.push('Debe contener una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    reasons.push('Debe contener una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    reasons.push('Debe contener un número');
  }
  return { valid: reasons.length === 0, reasons };
}

export function isValidStudentCode(code: unknown): code is string {
  if (typeof code !== 'string' || code.trim().length === 0) return false;
  const re = /^\d{8,10}$/;
  return re.test(code.trim());
}

export function isNotEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
