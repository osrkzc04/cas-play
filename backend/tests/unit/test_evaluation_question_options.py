"""Unitarios de la validación de opciones de pregunta (BR-023).

Objetivo real: EvaluationService._validate_question_options.
Lógica pura: exige exactamente una opción correcta y, para verdadero/falso,
exactamente dos opciones. Se instancia el service con __new__ para evitar la
construcción de repositorios (no se toca la base de datos).
"""

import pytest

from app.core.exceptions import BadRequestException
from app.modules.evaluations.schemas import OptionCreate
from app.modules.evaluations.service import EvaluationService
from app.shared.enums import QuestionType


@pytest.fixture
def service() -> EvaluationService:
    # __new__ omite __init__: el método bajo prueba no usa repositorios.
    return EvaluationService.__new__(EvaluationService)


def _options(*correct_flags: bool) -> list[OptionCreate]:
    return [
        OptionCreate(text=f"Opción {i}", is_correct=flag)
        for i, flag in enumerate(correct_flags)
    ]


def test_multiple_choice_with_single_correct_option(service):
    options = _options(False, True, False, False)
    service._validate_question_options(QuestionType.MULTIPLE_CHOICE, options)


def test_multiple_choice_without_correct_option_raises(service):
    with pytest.raises(BadRequestException) as exc:
        service._validate_question_options(
            QuestionType.MULTIPLE_CHOICE, _options(False, False, False)
        )
    assert "exactamente una opción correcta" in str(exc.value.detail)


def test_multiple_choice_with_two_correct_options_raises(service):
    with pytest.raises(BadRequestException) as exc:
        service._validate_question_options(
            QuestionType.MULTIPLE_CHOICE, _options(True, True, False)
        )
    assert "exactamente una opción correcta" in str(exc.value.detail)


def test_true_false_with_two_options_is_valid(service):
    service._validate_question_options(
        QuestionType.TRUE_FALSE, _options(True, False)
    )


@pytest.mark.parametrize("flags", [(True,), (True, False, False)])
def test_true_false_requires_exactly_two_options(service, flags):
    with pytest.raises(BadRequestException) as exc:
        service._validate_question_options(QuestionType.TRUE_FALSE, _options(*flags))
    assert "dos opciones" in str(exc.value.detail)
