"""
Extrae datos de matricula vigente desde un PDF de Reporte de Matricula (SUM UNMSM).

Retorna un dict con: periodo, cursos[].
Los cursos se formatean para ser compatibles con el esquema del historial academico.
"""

import re
import pdfplumber


def _extract_periodo(full_text: str) -> str | None:
    """Extrae el periodo academico del reporte de matricula."""
    match = re.search(r"Periodo Académico\s*:\s*(\d{4}-\d)", full_text)
    return match.group(1).strip() if match else None


def _parse_matricula_row(row: list) -> dict | None:
    """Convierte una fila de la tabla de matricula en un dict compatible con historial.

    Columnas esperadas: Ciclo, Codigo, Asignatura, Cred., Seccion, Docente Asignado.
    """
    if not row or len(row) < 5:
        return None

    ciclo = (row[0] or "").strip()
    if ciclo.lower() in ("ciclo", ""):
        return None

    asignatura = (row[2] or "").replace("\n", " ").strip()
    codigo = (row[1] or "").strip()

    return {
        "ciclo": ciclo,
        "plan": "-",
        "tipo": "-",
        "codigo": codigo,
        "asignatura": asignatura,
        "calificacion": "En progreso",
        "creditos": (row[3] or "").strip(),
        "seccion": (row[4] or "").strip(),
    }


def parse_matricula(pdf_path: str) -> dict:
    """Procesa un PDF de reporte de matricula y retorna cursos en progreso.

    Args:
        pdf_path: ruta al PDF de reporte de matricula.

    Returns:
        dict con claves: periodo, cursos[].
    """
    with pdfplumber.open(pdf_path) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        periodo = _extract_periodo(full_text)

        cursos = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    course = _parse_matricula_row(row)
                    if course:
                        cursos.append(course)

    return {
        "periodo": periodo,
        "cursos": cursos,
    }
