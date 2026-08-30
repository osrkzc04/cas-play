"""Unitarios del código de certificado (BR-028).

Objetivo real: app.modules.certificates.generator.generate_code.
Función pura: produce un código con formato CAS-XXXX-XXXX-XXXX en hexadecimal
mayúsculas, usado como identificador único y validado públicamente (BR-030).
"""

import re

from app.modules.certificates import generator

CODE_PATTERN = re.compile(r"^CAS-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$")


def test_code_matches_expected_format():
    assert CODE_PATTERN.match(generator.generate_code())


def test_code_is_uppercase():
    code = generator.generate_code()
    assert code == code.upper()


def test_code_has_three_hex_groups():
    body = generator.generate_code().removeprefix("CAS-")
    groups = body.split("-")
    assert len(groups) == 3
    assert all(len(group) == 4 for group in groups)


def test_codes_are_practically_unique():
    # No garantiza unicidad absoluta (eso lo asegura el índice + reintento en el
    # service), pero un lote razonable no debe colisionar.
    codes = {generator.generate_code() for _ in range(1000)}
    assert len(codes) == 1000
