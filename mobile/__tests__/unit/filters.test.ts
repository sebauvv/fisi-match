import { normalizeText, filterAdvisorsByName, filterAdvisorsByArea, groupByFirstLetter } from '../../src/utils/filters';
import type { Advisor } from '../../types/advisor';

const mockAdvisors: Advisor[] = [
  { id: '1', full_name: 'José María García López', research_areas: ['Inteligencia Artificial', 'Machine Learning'], thesis_count: 5, external_publications_count: 10, orcid: '0000-0001' },
  { id: '2', full_name: 'María Pérez Delgado', research_areas: ['Ingeniería de Software'], thesis_count: 3, external_publications_count: 7, orcid: null },
  { id: '3', full_name: 'Carlos Andrés Nuñez Flores', research_areas: ['Redes', 'Seguridad Informática'], thesis_count: 8, external_publications_count: 12, orcid: '0000-0002' },
];

describe('normalizeText', () => {
  it('convierte mayúsculas a minúsculas', () => {
    expect(normalizeText('José María')).toBe('jose maria');
  });

  it('elimina acentos', () => {
    expect(normalizeText('áéíóú ÁÉÍÓÚ')).toBe('aeiou aeiou');
  });

  it('normaliza ñ y ü', () => {
    expect(normalizeText('Nuñez übersetzen')).toBe('nunez ubersetzen');
  });

  it('retorna string vacío para entrada vacía', () => {
    expect(normalizeText('')).toBe('');
  });
});

describe('filterAdvisorsByName', () => {
  it('retorna asesores que coinciden con la búsqueda', () => {
    const result = filterAdvisorsByName(mockAdvisors, 'Jose');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('es case-insensitive', () => {
    const result = filterAdvisorsByName(mockAdvisors, 'jose');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('encuentra a pesar de acentos en la data', () => {
    const result = filterAdvisorsByName(mockAdvisors, 'Garcia');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('encuentra a pesar de acentos en el query', () => {
    const result = filterAdvisorsByName(mockAdvisors, 'José');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('retorna array vacío si no hay match', () => {
    const result = filterAdvisorsByName(mockAdvisors, 'ZzZz');
    expect(result).toHaveLength(0);
  });

  it('retorna todos si query es vacío', () => {
    const result = filterAdvisorsByName(mockAdvisors, '');
    expect(result).toHaveLength(3);
  });

  it('retorna array vacío si la lista de asesores está vacía', () => {
    const result = filterAdvisorsByName([], 'Jose');
    expect(result).toHaveLength(0);
  });
});

describe('filterAdvisorsByArea', () => {
  it('retorna asesores que coinciden con el área de investigación', () => {
    const result = filterAdvisorsByArea(mockAdvisors, 'Inteligencia');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('retorna asesores que coinciden con search parcial case-insensitive', () => {
    const result = filterAdvisorsByArea(mockAdvisors, 'software');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('retorna array vacío si no hay match', () => {
    const result = filterAdvisorsByArea(mockAdvisors, 'Bioinformática');
    expect(result).toHaveLength(0);
  });

  it('retorna todos si query es vacío', () => {
    const result = filterAdvisorsByArea(mockAdvisors, '');
    expect(result).toHaveLength(3);
  });
});

describe('groupByFirstLetter', () => {
  it('agrupa nombres por primera letra ordenado', () => {
    const items = [{ name: 'Zara' }, { name: 'Ana' }, { name: 'Carlos' }];
    const groups = groupByFirstLetter(items);
    expect([...groups.keys()]).toEqual(['A', 'C', 'Z']);
  });

  it('agrupa items bajo la misma letra', () => {
    const items = [{ name: 'Ana' }, { name: 'Alberto' }];
    const groups = groupByFirstLetter(items);
    expect(groups.get('A')).toHaveLength(2);
  });

  it('retorna map vacío para array vacío', () => {
    const groups = groupByFirstLetter([]);
    expect(groups.size).toBe(0);
  });
});
