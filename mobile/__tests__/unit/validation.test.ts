import { isValidEmail, validatePassword, isValidStudentCode, isNotEmpty } from '../../src/utils/validation';

describe('isValidEmail', () => {
  it('retorna true para email válido simple', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('retorna true para email con puntos y subdominios', () => {
    expect(isValidEmail('nombre.apellido@mail.unmsm.edu.pe')).toBe(true);
  });

  it('retorna false si no tiene @', () => {
    expect(isValidEmail('usuarioexample.com')).toBe(false);
  });

  it('retorna false si no tiene dominio', () => {
    expect(isValidEmail('usuario@')).toBe(false);
  });

  it('retorna false si es string vacío', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('retorna false si es null', () => {
    expect(isValidEmail(null)).toBe(false);
  });

  it('retorna false si es undefined', () => {
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe('validatePassword', () => {
  it('retorna valid=true si cumple todos los criterios', () => {
    const result = validatePassword('Passw0rd');
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('retorna valid=false si es muy corta (< 8 caracteres)', () => {
    const result = validatePassword('Pa1a');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Debe tener al menos 8 caracteres');
  });

  it('retorna valid=false si no tiene mayúscula', () => {
    const result = validatePassword('password1');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Debe contener una mayúscula');
  });

  it('retorna valid=false si no tiene número', () => {
    const result = validatePassword('Password');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Debe contener un número');
  });

  it('retorna valid=false si no es string', () => {
    const result = validatePassword(null);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('La contraseña debe ser un texto');
  });
});

describe('isValidStudentCode', () => {
  it('retorna true para código de 8 dígitos', () => {
    expect(isValidStudentCode('12345678')).toBe(true);
  });

  it('retorna true para código de 10 dígitos', () => {
    expect(isValidStudentCode('1234567890')).toBe(true);
  });

  it('retorna false si tiene letras', () => {
    expect(isValidStudentCode('1234A678')).toBe(false);
  });

  it('retorna false si es string vacío', () => {
    expect(isValidStudentCode('')).toBe(false);
  });

  it('retorna false si es null', () => {
    expect(isValidStudentCode(null)).toBe(false);
  });
});

describe('isNotEmpty', () => {
  it('retorna true para string con contenido', () => {
    expect(isNotEmpty('hola')).toBe(true);
  });

  it('retorna false para string vacío', () => {
    expect(isNotEmpty('')).toBe(false);
  });

  it('retorna false para solo espacios', () => {
    expect(isNotEmpty('   ')).toBe(false);
  });

  it('retorna false para null', () => {
    expect(isNotEmpty(null)).toBe(false);
  });

  it('retorna false para undefined', () => {
    expect(isNotEmpty(undefined)).toBe(false);
  });
});
