"""
Evaluador offline de calidad de recomendaciones (sin feedback de usuarios).

Estrategia: Metricas intrinsecas.
Mide propiedades deseables del motor sin necesitar labels ni ground-truth:
  - Separacion de scores: diferenciacion clara entre top y resto
  - Score gap top-2: confianza en la recomendacion #1
  - Cobertura de evidencia: diversidad de tipos (thesis/pub/profile) por asesor
  - Diversidad de asesores: que los recomendados no sean todos del mismo nicho
  - Estabilidad de ranking: parafrasis de la misma idea deben dar rankings similares

Costo: ~$0.001 por ejecucion completa (solo embeddings Bedrock Titan v2).
No requiere LLM, no requiere feedback de usuarios ni profesores.
"""

import math


# ── Test queries representativas de areas de la FISI ────────────────────────

EVALUATION_QUERIES = [
    # NLP / Procesamiento de Texto
    "Aplicación de procesamiento de lenguaje natural para clasificar documentos legales peruanos",
    "Sistema de análisis de sentimientos en redes sociales usando deep learning",
    "Chatbot inteligente para atención al estudiante universitario con NLP",

    # Machine Learning / IA
    "Modelo de machine learning para predicción de deserción universitaria",
    "Sistema de detección de fraudes en transacciones bancarias con redes neuronales",
    "Algoritmo de recomendación de cursos electivos basado en rendimiento académico",

    # Computer Vision
    "Sistema de reconocimiento facial para control de asistencia en la UNMSM",
    "Detección automática de enfermedades en cultivos usando visión por computadora",
    "Aplicación de deep learning para diagnóstico médico por imágenes de rayos X",

    # Software Engineering
    "Framework de pruebas automatizadas para aplicaciones móviles en Flutter",
    "Metodología ágil adaptada para proyectos de software en el sector público peruano",
    "Arquitectura de microservicios para sistema de gestión hospitalaria",

    # Data Science / Big Data
    "Plataforma de análisis de datos abiertos del gobierno peruano",
    "Sistema de predicción de demanda energética usando series temporales",
    "Dashboard de Business Intelligence para pymes peruanas",

    # Seguridad / Redes
    "Sistema de detección de intrusos en redes usando machine learning",
    "Plataforma de autenticación biométrica multifactor para banca digital",
    "Análisis de vulnerabilidades en aplicaciones web del sector público",

    # IoT / Sistemas Embebidos
    "Sistema IoT para monitoreo de calidad del aire en Lima Metropolitana",
    "Plataforma de agricultura de precisión con sensores y machine learning",

    # Educación / E-learning
    "Plataforma de aprendizaje adaptativo con inteligencia artificial",
    "Sistema de evaluación automática de código fuente para cursos de programación",
    "Gamificación aplicada a la enseñanza de algoritmos y estructuras de datos",

    # Gobierno / Gestión
    "Sistema de trámites digitales para la administración pública peruana",
    "Blockchain aplicado a la transparencia en procesos de contratación estatal",
]

# Paráfrasis para test de estabilidad (query original → paráfrasis)
STABILITY_PAIRS = [
    (
        "Aplicación de procesamiento de lenguaje natural para clasificar documentos legales peruanos",
        "Uso de NLP y técnicas de text mining para la categorización automática de textos jurídicos en el Perú",
    ),
    (
        "Sistema de detección de fraudes en transacciones bancarias con redes neuronales",
        "Detección de anomalías y fraude en operaciones financieras mediante deep learning",
    ),
    (
        "Sistema IoT para monitoreo de calidad del aire en Lima Metropolitana",
        "Red de sensores inteligentes para medir contaminación ambiental en Lima usando Internet de las Cosas",
    ),
    (
        "Plataforma de aprendizaje adaptativo con inteligencia artificial",
        "Sistema e-learning personalizado que adapta el contenido al estudiante con IA",
    ),
    (
        "Modelo de machine learning para predicción de deserción universitaria",
        "Predicción del abandono estudiantil en universidades peruanas usando algoritmos de aprendizaje automático",
    ),
]


# ── Metricas intrinsecas ────────────────────────────────────────────────────

def score_separation(recommendations: list[dict]) -> float:
    """
    Mide qué tan separados están los scores del top-K vs el resto.

    Calcula: mean(top_half) - mean(bottom_half). Mayor = mejor separación.
    """
    if len(recommendations) <= 1:
        return 0.0
    scores = [r["score"] for r in recommendations]
    mid = max(1, len(scores) // 2)
    top_mean = sum(scores[:mid]) / mid
    rest_mean = sum(scores[mid:]) / max(len(scores[mid:]), 1)
    return round(top_mean - rest_mean, 4)


def score_gap_top2(recommendations: list[dict]) -> float:
    """
    Gap entre el #1 y #2 asesor. Mayor gap = más confianza en el top pick.
    """
    if len(recommendations) < 2:
        return 0.0
    return round(recommendations[0]["score"] - recommendations[1]["score"], 4)


def evidence_coverage(recommendations: list[dict]) -> float:
    """
    Promedio de tipos de contenido distintos en la evidencia de cada asesor.

    Rango: 1.0 (solo un tipo) a 3.0 (thesis + publication + profile).
    Mayor = evidencia más diversa y confiable.
    """
    if not recommendations:
        return 0.0
    coverages = []
    for rec in recommendations:
        types = set()
        for ev in rec.get("evidence", rec.get("matching_evidence", [])):
            types.add(ev.get("content_type"))
        coverages.append(len(types))
    return round(sum(coverages) / len(coverages), 2)


def advisor_diversity(recommendations: list[dict]) -> float:
    """
    Mide la diversidad temática entre los asesores recomendados.

    Usa distancia Jaccard promedio entre los textos de evidencia de cada par
    de asesores. Rango: 0.0 (idénticos) a 1.0 (completamente distintos).
    """
    if len(recommendations) <= 1:
        return 0.0

    all_evidence_texts = []
    for rec in recommendations:
        texts = [ev.get("content_text", "")[:50]
                 for ev in rec.get("evidence", rec.get("matching_evidence", []))]
        all_evidence_texts.append(" ".join(texts))

    total_dist = 0.0
    pairs = 0
    for i in range(len(all_evidence_texts)):
        words_i = set(all_evidence_texts[i].lower().split())
        for j in range(i + 1, len(all_evidence_texts)):
            words_j = set(all_evidence_texts[j].lower().split())
            if words_i or words_j:
                jaccard = 1.0 - len(words_i & words_j) / max(len(words_i | words_j), 1)
                total_dist += jaccard
                pairs += 1

    return round(total_dist / max(pairs, 1), 4)


def ranking_stability_kendall(ranking_a: list[str], ranking_b: list[str]) -> float:
    """
    Calcula el coeficiente tau de Kendall entre dos rankings de advisor_ids.

    Rango: -1 (inverso) a 1 (idéntico). Mayor = más estable.
    Solo considera asesores que aparecen en ambos rankings.
    """
    common = set(ranking_a) & set(ranking_b)
    if len(common) < 2:
        return 1.0 if common else 0.0

    common_list = sorted(common)
    rank_a = {aid: i for i, aid in enumerate(ranking_a) if aid in common}
    rank_b = {aid: i for i, aid in enumerate(ranking_b) if aid in common}

    concordant = 0
    discordant = 0
    for i in range(len(common_list)):
        for j in range(i + 1, len(common_list)):
            a_i, a_j = common_list[i], common_list[j]
            diff_a = rank_a[a_i] - rank_a[a_j]
            diff_b = rank_b[a_i] - rank_b[a_j]
            if diff_a * diff_b > 0:
                concordant += 1
            elif diff_a * diff_b < 0:
                discordant += 1

    n = len(common_list)
    total_pairs = n * (n - 1) / 2
    if total_pairs == 0:
        return 1.0
    return round((concordant - discordant) / total_pairs, 4)


# ── Evaluación completa ─────────────────────────────────────────────────────

def evaluate_single_query(recommendations: list[dict]) -> dict:
    """
    Calcula todas las métricas intrínsecas para un set de recomendaciones.

    Args:
        recommendations: lista de dicts con score, evidence, advisor_id, etc.

    Returns:
        dict con todas las métricas calculadas
    """
    return {
        "num_advisors": len(recommendations),
        "top_score": recommendations[0]["score"] if recommendations else 0.0,
        "score_separation": score_separation(recommendations),
        "score_gap_top2": score_gap_top2(recommendations),
        "evidence_coverage": evidence_coverage(recommendations),
        "advisor_diversity": advisor_diversity(recommendations),
        "mean_score": round(
            sum(r["score"] for r in recommendations) / max(len(recommendations), 1), 4
        ),
        "mean_matching_chunks": round(
            sum(r.get("num_matching_chunks", 0) for r in recommendations) / max(len(recommendations), 1), 2
        ),
    }


def evaluate_batch(
    all_results: list[dict],
    stability_results: list[tuple[list[str], list[str]]] | None = None,
) -> dict:
    """
    Agrega métricas sobre un batch de queries evaluadas.

    Args:
        all_results: lista de dicts, cada uno output de evaluate_single_query()
        stability_results: pares de (ranking_a, ranking_b) para test de estabilidad

    Returns:
        dict con métricas agregadas
    """
    n = len(all_results)
    if n == 0:
        return {"error": "No results to evaluate"}

    def mean_of(key):
        vals = [r[key] for r in all_results if key in r]
        return round(sum(vals) / max(len(vals), 1), 4) if vals else 0.0

    report = {
        "num_queries": n,
        "avg_top_score": mean_of("top_score"),
        "avg_score_separation": mean_of("score_separation"),
        "avg_score_gap_top2": mean_of("score_gap_top2"),
        "avg_evidence_coverage": mean_of("evidence_coverage"),
        "avg_advisor_diversity": mean_of("advisor_diversity"),
        "avg_mean_score": mean_of("mean_score"),
        "avg_matching_chunks": mean_of("mean_matching_chunks"),
    }

    if stability_results:
        taus = [ranking_stability_kendall(a, b) for a, b in stability_results]
        report["avg_ranking_stability_tau"] = round(sum(taus) / len(taus), 4)
        report["stability_details"] = [
            {"tau": t, "pair_index": i} for i, t in enumerate(taus)
        ]

    return report


def format_report(batch_metrics: dict, per_query: list[dict] | None = None) -> str:
    """Formatea el reporte de evaluación como texto legible."""
    lines = [
        "=" * 60,
        "  REPORTE DE EVALUACIÓN - Motor de Recomendación FisiMatch",
        "=" * 60,
        "",
        f"  Queries evaluadas: {batch_metrics['num_queries']}",
        "",
        "  ── Métricas de Calidad ──",
        f"  Score promedio del top-1:      {batch_metrics['avg_top_score']}",
        f"  Separación de scores:          {batch_metrics['avg_score_separation']}",
        f"  Gap entre #1 y #2:             {batch_metrics['avg_score_gap_top2']}",
        f"  Cobertura de evidencia (1-3):  {batch_metrics['avg_evidence_coverage']}",
        f"  Diversidad entre asesores:     {batch_metrics['avg_advisor_diversity']}",
        f"  Chunks relevantes promedio:    {batch_metrics['avg_matching_chunks']}",
    ]

    if "avg_ranking_stability_tau" in batch_metrics:
        lines.extend([
            "",
            "  ── Estabilidad (Kendall τ) ──",
            f"  τ promedio (paráfrasis):       {batch_metrics['avg_ranking_stability_tau']}",
        ])
        for detail in batch_metrics.get("stability_details", []):
            lines.append(f"    Par {detail['pair_index']}: τ = {detail['tau']}")

    if per_query:
        lines.extend(["", "  ── Detalle por Query ──"])
        for i, pq in enumerate(per_query):
            lines.append(f"    Q{i+1}: top={pq['top_score']}, "
                        f"sep={pq['score_separation']}, "
                        f"cov={pq['evidence_coverage']}, "
                        f"div={pq['advisor_diversity']}")

    lines.extend(["", "=" * 60])
    return "\n".join(lines)
