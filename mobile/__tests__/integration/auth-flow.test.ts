import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginStudent } from '../../api/authApi';
import { getStudent, updateStudent } from '../../api/studentApi';
import { authHeaders } from '../../api/config';

const USER_KEY = 'fisi-match-user';
const TOKEN_KEY = 'fisi-match-token';

const mockToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.fake';
const mockStudentId = '550e8400-e29b-41d4-a716-446655440000';

describe('Auth Flow — loginStudent + persistencia AsyncStorage', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    (global.fetch as jest.Mock).mockReset();
  });

  it('login exitoso: llama POST /auth/login con email y password', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: mockToken,
        token_type: 'bearer',
        student_id: mockStudentId,
        email: 'test@unmsm.edu.pe',
        nombres_apellidos: 'Test User',
      }),
    });

    const result = await loginStudent('test@unmsm.edu.pe', 'Passw0rd');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@unmsm.edu.pe', password: 'Passw0rd' }),
      }),
    );
    expect(result.access_token).toBe(mockToken);
    expect(result.student_id).toBe(mockStudentId);
  });

  it('login fallido: lanza error con mensaje del servidor', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Credenciales incorrectas' }),
    });

    await expect(
      loginStudent('bad@test.com', 'wrong'),
    ).rejects.toThrow('Credenciales incorrectas');
  });

  it('login fallido sin detail: usa mensaje por defecto', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(
      loginStudent('bad@test.com', 'wrong'),
    ).rejects.toThrow('Credenciales incorrectas');
  });

  it('getStudent: llama GET /students/{id} con auth headers', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        student_id: mockStudentId,
        email: 'test@unmsm.edu.pe',
        codigo_matricula: '20201234',
        nombres_apellidos: 'Test User',
        thesis_idea: '',
        resumen_creditos: {
          creditaje_requerido_para_egresar: 200,
          creditaje_aprobado: 150,
          promedio_ponderado: 14.5,
        },
      }),
    });

    const user = await getStudent(mockStudentId, mockToken);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/students/${mockStudentId}`),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
    expect(user.student_id).toBe(mockStudentId);
    expect(user.resumen_creditos.creditaje_aprobado).toBe(150);
    expect(user.resumen_creditos.promedio_ponderado).toBe(14.5);
  });

  it('getStudent fallido: lanza error con detail', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Estudiante no encontrado' }),
    });

    await expect(
      getStudent('nonexistent', mockToken),
    ).rejects.toThrow('Estudiante no encontrado');
  });

  it('updateStudent: llama PUT /students/{id} con body parcial', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        student_id: mockStudentId,
        email: 'test@unmsm.edu.pe',
        codigo_matricula: '20201234',
        nombres_apellidos: 'Updated Name',
        thesis_idea: 'Nueva idea de tesis',
        resumen_creditos: {
          creditaje_requerido_para_egresar: 200,
          creditaje_aprobado: 150,
          promedio_ponderado: 14.5,
        },
      }),
    });

    const user = await updateStudent(mockStudentId, mockToken, {
      thesis_idea: 'Nueva idea de tesis',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/students/${mockStudentId}`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ thesis_idea: 'Nueva idea de tesis' }),
      }),
    );
    expect(user.thesis_idea).toBe('Nueva idea de tesis');
  });

  it('authHeaders: retorna headers con Content-Type y Authorization', () => {
    const headers = authHeaders('test-token');
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    });
  });
});
