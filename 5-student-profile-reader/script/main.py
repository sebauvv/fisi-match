"""
Punto de entrada local para el procesamiento de PDFs academicos.

Soporta dos modos:
  - tabla: procesa historial academico y (opcionalmente) reporte de matricula con pdfplumber
  - llm:   procesa CV con AWS Bedrock (placeholder)

Uso:
    python main.py --mode tabla --historial <pdf> [--matricula <pdf>] [--output]
    python main.py --mode llm --cv <pdf> [--output]
"""

import argparse
import json
import os
import sys

from parsers.historial_parser import parse_historial
from parsers.matricula_parser import parse_matricula
from parsers.cv_parser import parse_cv


def enrich_with_matricula(perfil: dict, matricula_data: dict) -> dict:
    """Agrega los cursos del reporte de matricula como un nuevo periodo al perfil.

    Los cursos del reporte no tienen calificacion, por lo que se marcan
    con 'En progreso' y los campos faltantes (plan, tipo) se marcan con '-'.
    """
    if not matricula_data.get("cursos"):
        return perfil

    nuevo_periodo = {
        "periodo": matricula_data["periodo"],
        "cursos": matricula_data["cursos"],
    }

    perfil["periodos_academicos"].append(nuevo_periodo)
    return perfil


def save_output(result: dict, output_dir: str, codigo: str):
    """Guarda el resultado como JSON en el directorio de salida."""
    os.makedirs(output_dir, exist_ok=True)

    filename = f"perfil_{codigo}.json" if codigo else "perfil_estudiante.json"
    filepath = os.path.join(output_dir, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Resultado guardado en: {filepath}")


def run_tabla(args):
    """Modo tabla: procesa historial y opcionalmente reporte de matricula."""
    if not args.historial:
        print("Se requiere --historial <pdf> en modo tabla.", file=sys.stderr)
        sys.exit(1)

    print(f"Procesando historial: {args.historial}")
    perfil = parse_historial(args.historial)

    total_cursos = sum(len(p["cursos"]) for p in perfil["periodos_academicos"])
    print(f"  Periodos: {len(perfil['periodos_academicos'])}")
    print(f"  Cursos: {total_cursos}")

    if args.matricula:
        print(f"Procesando matricula: {args.matricula}")
        matricula_data = parse_matricula(args.matricula)
        perfil = enrich_with_matricula(perfil, matricula_data)
        print(f"  Cursos en progreso agregados: {len(matricula_data['cursos'])}")
        print(f"  Periodo matricula: {matricula_data['periodo']}")

    return perfil


def run_llm(args):
    """Modo LLM: procesa CV (placeholder)."""
    if not args.cv:
        print("Se requiere --cv <pdf> en modo llm.", file=sys.stderr)
        sys.exit(1)

    return parse_cv(args.cv)


def main():
    parser = argparse.ArgumentParser(
        description="Procesador de PDFs academicos para perfil de estudiante"
    )
    parser.add_argument(
        "--mode",
        choices=["tabla", "llm"],
        required=True,
        help="Modo de procesamiento: 'tabla' (pdfplumber) o 'llm' (Bedrock)",
    )
    parser.add_argument("--historial", help="Ruta al PDF de historial academico")
    parser.add_argument("--matricula", help="Ruta al PDF de reporte de matricula (opcional)")
    parser.add_argument("--cv", help="Ruta al PDF del CV")
    parser.add_argument(
        "--output",
        action="store_true",
        help="Guarda el resultado como JSON en /output",
    )

    args = parser.parse_args()

    if args.mode == "tabla":
        result = run_tabla(args)
    elif args.mode == "llm":
        result = run_llm(args)

    if args.output:
        output_dir = os.path.join(os.path.dirname(__file__), "output")
        codigo = result.get("estudiante", {}).get("codigo_matricula", "")
        save_output(result, output_dir, codigo)
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
