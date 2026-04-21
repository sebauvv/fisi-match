"""
Placeholder para procesamiento de CV con AWS Bedrock LLM.

Este modulo sera implementado cuando se adapte el sistema a Lambda.
Por ahora expone la interfaz esperada.
"""


def parse_cv(pdf_path: str) -> dict:
    """Procesa un CV en PDF usando un LLM (Bedrock).

    Args:
        pdf_path: ruta al PDF del CV.

    Returns:
        dict con el perfil extraido del CV.

    Raises:
        NotImplementedError: este modulo aun no esta implementado.
    """
    raise NotImplementedError(
        "El procesamiento de CV con LLM sera implementado "
        "en la fase de integracion con AWS Lambda/Bedrock."
    )
