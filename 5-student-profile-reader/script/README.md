# Student Profile Reader (Fase 5)

Procesamiento de PDFs academicos de la UNMSM para generar un perfil JSON estructurado del estudiante. Soporta historial academico y reporte de matricula como fuentes de datos.

## Estructura

```
script/
  main.py                        Punto de entrada local (CLI)
  parsers/
    historial_parser.py          Extrae datos del historial academico
    matricula_parser.py          Extrae datos del reporte de matricula
    cv_parser.py                 Placeholder para procesamiento de CV con LLM
  examples/                      PDFs de ejemplo
  output/                        Salida JSON (generada automaticamente)
  requirements.txt
```

## Configuracion

```bash
cd 5-student-profile-reader/script
source .venv/bin/activate
pip install -r requirements.txt
```

## Uso

El script soporta dos modos de procesamiento:

### Modo tabla (pdfplumber) - historial y matricula

```bash
# Solo historial academico (salida por terminal)
python main.py --mode tabla --historial examples/historial-academico.pdf

# Historial + reporte de matricula (salida por terminal)
python main.py --mode tabla --historial examples/historial-academico.pdf --matricula examples/reporte_matricula.pdf

# Guarda como archivo JSON en /output
python main.py --mode tabla --historial examples/historial-academico.pdf --matricula examples/reporte_matricula.pdf --output
```

### Modo LLM (Bedrock) - CV (pendiente)

```bash
python main.py --mode llm --cv examples/SebastianCastillo_CV.pdf
```

Este modo sera implementado en la fase de integracion con AWS Lambda/Bedrock.

## Argumentos

| Argumento | Descripcion |
|---|---|
| `--mode tabla` | Procesa PDFs tabulares con pdfplumber |
| `--mode llm` | Procesa CV con LLM (pendiente) |
| `--historial <pdf>` | Ruta al PDF de historial academico |
| `--matricula <pdf>` | (Opcional) Ruta al reporte de matricula del periodo vigente |
| `--cv <pdf>` | Ruta al PDF del CV |
| `--output` | Guarda el resultado en `/output` en vez de imprimir por terminal |

## Procesamiento

### Historial academico

Del PDF se extraen:

1. **Datos del estudiante**: codigo de matricula, nombres, facultad, escuela, plan de estudios.
2. **Periodos academicos**: por cada semestre se extrae la lista de cursos con ciclo, plan, tipo, codigo, asignatura, calificacion, creditos y seccion.
3. **Resumen de creditos aprobados**: creditaje requerido, aprobado, faltante, promedio ponderado y desglose por tipo.

### Reporte de matricula (opcional)

Si se proporciona, los cursos del periodo vigente se agregan al perfil con `calificacion: "En progreso"` y `plan: "-"`, `tipo: "-"`. Esto complementa el historial con los cursos que se estan cursando actualmente.

El reporte de matricula es opcional. Un estudiante egresado o sin matricula actual no lo tendria.

## Formato de salida

```json
{
  "estudiante": {
    "codigo_matricula": "22200247",
    "nombres_apellidos": "CASTILLO LAYME SEBASTIAN FERNANDO",
    "facultad": "20 - INGENIERIA DE SISTEMAS E INFORMATICA",
    "escuela": "2 - E.P. De Ingenieria De Software",
    "plan": "2018 - Plan De Estudios 2018"
  },
  "periodos_academicos": [
    {
      "periodo": "2022-1",
      "cursos": [
        {
          "ciclo": "1",
          "plan": "2018",
          "tipo": "O",
          "codigo": "INO104",
          "asignatura": "CALCULO I",
          "calificacion": "15",
          "creditos": "4.0",
          "seccion": "1"
        }
      ]
    }
  ],
  "resumen_creditos": {
    "creditaje_requerido_para_egresar": 226.0,
    "creditaje_aprobado": 194.0,
    "creditaje_faltante": 32.0,
    "promedio_ponderado": 15.701
  }
}
```

## Consideraciones tecnicas

- La libreria `pdfplumber` es puro Python y no requiere binarios del sistema, lo que la hace compatible con AWS Lambda.
- Los parsers estan separados de `main.py` para que puedan ser importados directamente desde un futuro `lambda_handler.py`.
- Las tablas que cruzan paginas en el PDF se manejan correctamente: tablas sin fila de encabezado se reconocen como continuacion del periodo anterior.
