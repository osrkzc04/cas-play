"""Unitarios del motivo de elegibilidad del certificado (BR-026, BR-027).

Objetivo real: CertificateService._eligibility_reason.
Lógica pura: decide por qué un estudiante NO puede recibir el certificado, o
None si es elegible. La emisión exige completar el 100% del contenido y aprobar
la evaluación final con la nota mínima (7/10). Se instancia con __new__ para no
construir repositorios (PASSING_SCORE es atributo de clase).
"""

import pytest

from app.modules.certificates.service import CertificateService


@pytest.fixture
def service() -> CertificateService:
    return CertificateService.__new__(CertificateService)


def test_incomplete_content_returns_reason(service):
    reason = service._eligibility_reason(
        has_evaluation=True,
        final_score=10.0,
        total_lessons=10,
        completed_lessons=9,
    )
    assert reason is not None
    assert "100% del contenido" in reason


def test_no_evaluation_returns_reason(service):
    reason = service._eligibility_reason(
        has_evaluation=False,
        final_score=None,
        total_lessons=5,
        completed_lessons=5,
    )
    assert reason is not None
    assert "evaluación final" in reason


def test_no_score_returns_reason(service):
    reason = service._eligibility_reason(
        has_evaluation=True,
        final_score=None,
        total_lessons=5,
        completed_lessons=5,
    )
    assert reason is not None
    assert "rendir" in reason


def test_score_below_passing_returns_reason(service):
    reason = service._eligibility_reason(
        has_evaluation=True,
        final_score=6.99,
        total_lessons=5,
        completed_lessons=5,
    )
    assert reason is not None
    assert "no alcanza el mínimo" in reason


@pytest.mark.parametrize("score", [7.0, 8.5, 10.0])
def test_full_content_and_passing_is_eligible(service, score):
    # 100% contenido + nota >= 7 => elegible (reason None). 7.0 es el límite exacto.
    reason = service._eligibility_reason(
        has_evaluation=True,
        final_score=score,
        total_lessons=5,
        completed_lessons=5,
    )
    assert reason is None


def test_course_without_lessons_does_not_block_on_content(service):
    # Curso sin clases (total 0): el contenido no puede bloquear la emisión.
    reason = service._eligibility_reason(
        has_evaluation=True,
        final_score=8.0,
        total_lessons=0,
        completed_lessons=0,
    )
    assert reason is None
