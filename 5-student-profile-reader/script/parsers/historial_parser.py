"""
Extrae datos academicos estructurados desde un PDF de Historial Academico (SUM UNMSM).

Retorna un dict con claves: estudiante, periodos_academicos, resumen_creditos.
Compatible con pdfplumber (puro Python, apto para AWS Lambda).
"""

import re
import pdfplumber


def _extract_student_info(full_text: str) -> dict:
    """Extrae datos personales del estudiante desde las lineas iniciales del texto."""
    fields = {
        "codigo_matricula": r"Código de Matrícula\s*:\s*(.+)",
        "nombres_apellidos": r"Nombres y Apellidos\s*:\s*(.+)",
        "facultad": r"Facultad\s*:\s*(.+)",
        "escuela": r"Escuela\s*:\s*(.+)",
        "plan": r"Plan\s*:\s*(.+)",
    }
    info = {}
    for key, pattern in fields.items():
        match = re.search(pattern, full_text)
        info[key] = match.group(1).strip() if match else None
    return info


def _parse_course_row(row: list) -> dict | None:
    """Convierte una fila de tabla pdfplumber en un dict de curso.

    Espera 8 columnas: Ciclo, Plan, Tipo, Asignatura, Calif., Cred., Sec., Acta.
    Si la fila es un header (contiene 'Ciclo' en la primera celda), retorna None.
    """
    if not row or len(row) < 7:
        return None

    ciclo = (row[0] or "").strip()
    if ciclo.lower() in ("ciclo", ""):
        return None

    asignatura_raw = (row[3] or "").replace("\n", " ").strip()

    codigo = ""
    asignatura = asignatura_raw
    if " - " in asignatura_raw:
        parts = asignatura_raw.split(" - ", 1)
        codigo = parts[0].strip()
        asignatura = parts[1].strip()

    return {
        "ciclo": ciclo,
        "plan": (row[1] or "").strip(),
        "tipo": (row[2] or "").strip(),
        "codigo": codigo,
        "asignatura": asignatura,
        "calificacion": (row[4] or "").strip(),
        "creditos": (row[5] or "").strip(),
        "seccion": (row[6] or "").strip(),
    }


def _find_period_headers(full_text: str) -> list[str]:
    """Encuentra todos los headers 'Periodo Academico YYYY-S' en el texto."""
    return re.findall(r"Periodo Académico\s+(\d{4}-\d)", full_text)


def _extract_credits_summary(full_text: str) -> dict:
    """Extrae la tabla de Resumen de Creditos Aprobados desde texto plano."""
    summary = {}
    field_map = {
        "Creditaje Requerido para Egresar": "creditaje_requerido_para_egresar",
        "Creditaje Apobrado": "creditaje_aprobado",
        "Creditaje Aprobado": "creditaje_aprobado",
        "Obligatorios": "obligatorios",
        "De Especialidad": "de_especialidad",
        "Electivos Generales": "electivos_generales",
        "Electivos de Especialidad": "electivos_de_especialidad",
        "Optativos": "optativos",
        "Alternativos": "alternativos",
        "De Otra Especialidad": "de_otra_especialidad",
        "Más de una vez": "mas_de_una_vez",
        "Otros": "otros",
        "Creditaje Faltante": "creditaje_faltante",
        "Promedio Ponderado": "promedio_ponderado",
    }

    for label, key in field_map.items():
        pattern = re.escape(label) + r"\s+([\d.]+)"
        match = re.search(pattern, full_text)
        if match:
            val = match.group(1)
            summary[key] = float(val) if "." in val else int(val)

    return summary


def _assign_courses_to_periods(pages, period_headers: list[str]) -> list[dict]:
    """Asocia cada tabla extraida al periodo academico correspondiente.

    Regla simple:
    - Si la primera fila de la tabla es un header ('Ciclo', ...), se trata
      de un nuevo periodo. Se consume el siguiente header de la lista global.
    - Si no tiene header (la tabla empieza directo con datos), es una continuacion
      del periodo anterior (tabla cortada por el salto de pagina).
    """
    periods = []
    header_idx = 0

    for page in pages:
        tables = page.extract_tables()

        for table in tables:
            if not table:
                continue

            first_cell = (table[0][0] or "").strip().lower() if table[0] else ""
            is_new_period = first_cell == "ciclo"

            courses = []
            for row in table:
                course = _parse_course_row(row)
                if course:
                    courses.append(course)

            if not courses:
                continue

            if is_new_period and header_idx < len(period_headers):
                periods.append({
                    "periodo": period_headers[header_idx],
                    "cursos": courses,
                })
                header_idx += 1
            elif periods:
                periods[-1]["cursos"].extend(courses)

    return periods



def parse_historial(pdf_path: str) -> dict:
    """Procesa un PDF de historial academico y retorna el perfil estructurado.

    Args:
        pdf_path: ruta absoluta o relativa al PDF.

    Returns:
        dict con claves: estudiante, periodos_academicos, resumen_creditos.
    """
    with pdfplumber.open(pdf_path) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)

        estudiante = _extract_student_info(full_text)
        period_headers = _find_period_headers(full_text)
        periodos = _assign_courses_to_periods(pdf.pages, period_headers)
        resumen = _extract_credits_summary(full_text)

    return {
        "estudiante": estudiante,
        "periodos_academicos": periodos,
        "resumen_creditos": resumen,
    }
