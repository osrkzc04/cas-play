"""Unitarios del perfil público del instructor (BR-040).

Objetivo real: InstructorProfileService.build_public (staticmethod).
Combina datos del usuario (nombre) con los del perfil (headline, especialidad,
biografía, redes, foto) en una vista pública. Debe funcionar con y sin perfil.
Se usan dobles ligeros (SimpleNamespace) porque el método solo lee atributos.
"""

import uuid
from types import SimpleNamespace

from app.modules.instructor_profiles.service import InstructorProfileService


def _user(profile):
    return SimpleNamespace(
        id=uuid.uuid4(),
        first_name="Ana",
        last_name="Pérez",
        instructor_profile=profile,
    )


def test_build_public_without_profile_uses_defaults():
    user = _user(profile=None)

    result = InstructorProfileService.build_public(user)

    assert result.user_id == user.id
    assert result.first_name == "Ana"
    assert result.last_name == "Pérez"
    # Sin perfil, los campos opcionales quedan vacíos y no hay foto.
    assert result.headline is None
    assert result.specialty is None
    assert result.about_me is None
    assert result.social_links is None
    assert result.photo_url is None


def test_build_public_with_profile_maps_all_fields():
    profile = SimpleNamespace(
        headline="Chef ejecutiva",
        specialty="Pastelería",
        about_me="20 años de experiencia",
        social_links={"linkedin": "https://linkedin.com/in/ana"},
        photo_path="instructor-photos/ana.png",
    )
    user = _user(profile=profile)

    result = InstructorProfileService.build_public(user)

    assert result.headline == "Chef ejecutiva"
    assert result.specialty == "Pastelería"
    assert result.about_me == "20 años de experiencia"
    assert result.social_links is not None
    # Con foto, se expone la URL pública del endpoint de foto (no la ruta interna).
    assert result.photo_url is not None
    assert str(user.id) in result.photo_url


def test_build_public_with_profile_without_photo_has_no_url():
    profile = SimpleNamespace(
        headline="Chef",
        specialty=None,
        about_me=None,
        social_links=None,
        photo_path=None,
    )
    result = InstructorProfileService.build_public(_user(profile=profile))

    assert result.headline == "Chef"
    assert result.photo_url is None
