"""Unitarios de las transiciones de estado de curso (BR-002, BR-006).

Objetivo real: CourseService._ALLOWED_STATUS_TRANSITIONS.
Tabla de datos pura: define qué cambios de estado son válidos. FINISHED es
terminal para preservar la integridad de los certificados emitidos.
"""

import pytest

from app.modules.courses.service import CourseService
from app.shared.enums import CourseStatus

TRANSITIONS = CourseService._ALLOWED_STATUS_TRANSITIONS


@pytest.mark.parametrize(
    "source, target",
    [
        (CourseStatus.DRAFT, CourseStatus.PUBLISHED),
        (CourseStatus.PUBLISHED, CourseStatus.HIDDEN),
        (CourseStatus.PUBLISHED, CourseStatus.FINISHED),
        (CourseStatus.HIDDEN, CourseStatus.PUBLISHED),
        (CourseStatus.HIDDEN, CourseStatus.FINISHED),
    ],
)
def test_allowed_transitions(source, target):
    assert target in TRANSITIONS[source]


@pytest.mark.parametrize(
    "source, target",
    [
        (CourseStatus.DRAFT, CourseStatus.HIDDEN),
        (CourseStatus.DRAFT, CourseStatus.FINISHED),
        (CourseStatus.PUBLISHED, CourseStatus.DRAFT),
        (CourseStatus.HIDDEN, CourseStatus.DRAFT),
        (CourseStatus.FINISHED, CourseStatus.PUBLISHED),
        (CourseStatus.FINISHED, CourseStatus.HIDDEN),
        (CourseStatus.FINISHED, CourseStatus.DRAFT),
    ],
)
def test_disallowed_transitions(source, target):
    assert target not in TRANSITIONS[source]


def test_finished_is_terminal():
    # Un curso finalizado no admite ninguna transición (BR-006).
    assert TRANSITIONS[CourseStatus.FINISHED] == set()


def test_every_status_has_an_entry():
    # La tabla cubre todos los estados posibles; no debe quedar ninguno sin definir.
    assert set(TRANSITIONS.keys()) == set(CourseStatus)
