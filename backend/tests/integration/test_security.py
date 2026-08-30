"""Seguridad — pruebas HTTP de autenticación, autorización y protección de recursos.

Se ejercita la app real vía TestClient para observar los códigos que distinguen:
- 401 Unauthorized: no hay autenticación válida.
- 403 Forbidden: autenticado pero sin permiso.
- 404 Not Found: el recurso se oculta cuando no pertenece al usuario.
"""

from app.core.jwt import create_refresh_token
from app.modules.certificates.service import CertificateService
from app.modules.evaluations.schemas import AnswerSubmit, AttemptSubmit
from app.modules.evaluations.service import EvaluationService

PREFIX = "/api/v1"
PASSWORD = "Passw0rd@"


def _login(client, email, password=PASSWORD):
    return client.post(
        f"{PREFIX}/auth/login", json={"email": email, "password": password}
    ).json()


def _pass_and_issue(db, factory, course, instructor, student):
    """Aprueba la evaluación y emite el certificado del estudiante dado."""
    factory.enroll(student, course)
    evaluation = factory.evaluation_with_bank(course, instructor)
    service = EvaluationService(db)
    attempt = service.start_attempt(evaluation.id, student)
    correct = factory.correct_option_map(evaluation.id)
    service.submit_attempt(
        attempt.id,
        AttemptSubmit(
            answers=[
                AnswerSubmit(question_id=q.id, selected_option_id=correct[q.id])
                for q in attempt.questions
            ]
        ),
        student,
    )
    return CertificateService(db).issue_certificate(course.id, student)


# ---------------------------------------------------------------------------
# 1) Autenticación y tokens
# ---------------------------------------------------------------------------


def test_missing_token_is_rejected(client, factory):
    # Sin cabecera Authorization no hay autenticación válida: 401.
    response = client.get(f"{PREFIX}/auth/me")
    assert response.status_code == 401


def test_malformed_token_unauthorized(client, factory):
    response = client.get(
        f"{PREFIX}/auth/me", headers={"Authorization": "Bearer not-a-jwt"}
    )
    assert response.status_code == 401


def test_wrong_token_type_unauthorized(client, factory):
    user = factory.student(password=PASSWORD)
    tokens = _login(client, user.email)
    # Un refresh token no es válido como access token (claim type != access).
    response = client.get(
        f"{PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {tokens['refresh_token']}"},
    )
    assert response.status_code == 401


def test_revoked_refresh_token_unauthorized(client, factory):
    user = factory.student(password=PASSWORD)
    tokens = _login(client, user.email)
    client.post(f"{PREFIX}/auth/logout", json={"refresh_token": tokens["refresh_token"]})

    response = client.post(
        f"{PREFIX}/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert response.status_code == 401


def test_inactive_user_token_unauthorized(client, db, factory):
    user = factory.student(password=PASSWORD)
    headers = factory.bearer(user)
    user.is_active = False
    db.commit()

    response = client.get(f"{PREFIX}/auth/me", headers=headers)
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 2) Control de acceso (roles y propiedad de recursos)
# ---------------------------------------------------------------------------


def test_student_cannot_access_admin_endpoint(client, factory):
    student = factory.student()
    response = client.get(f"{PREFIX}/users", headers=factory.bearer(student))
    assert response.status_code == 403


def test_student_cannot_create_course(client, factory):
    student = factory.student()
    response = client.post(
        f"{PREFIX}/courses",
        headers=factory.bearer(student),
        json={"title": "Intento no autorizado"},
    )
    assert response.status_code == 403


def test_instructor_cannot_manage_foreign_course(client, factory):
    owner = factory.instructor()
    other = factory.instructor()
    course = factory.course(owner)

    response = client.get(
        f"{PREFIX}/courses/{course.id}/manage", headers=factory.bearer(other)
    )
    assert response.status_code == 403


def test_admin_can_manage_any_course(client, factory):
    owner = factory.instructor()
    admin = factory.admin()
    course = factory.course(owner)

    response = client.get(
        f"{PREFIX}/courses/{course.id}/manage", headers=factory.bearer(admin)
    )
    assert response.status_code == 200


def test_instructor_cannot_manage_foreign_evaluation(client, factory):
    owner = factory.instructor()
    other = factory.instructor()
    course = factory.course(owner, published=True)

    response = client.post(
        f"{PREFIX}/courses/{course.id}/evaluation",
        headers=factory.bearer(other),
        json={"title": "Ajena"},
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# 3) Contraseñas y recuperación
# ---------------------------------------------------------------------------


def test_weak_password_rejected_on_change(client, factory):
    user = factory.student(password=PASSWORD)
    response = client.post(
        f"{PREFIX}/auth/change-password",
        headers=factory.bearer(user),
        json={"current_password": PASSWORD, "new_password": "weak"},
    )
    assert response.status_code == 400


def test_invalid_reset_token_rejected(client, factory):
    response = client.post(
        f"{PREFIX}/auth/password-reset/confirm",
        json={"token": "token-inexistente", "new_password": "NuevaClave1@"},
    )
    assert response.status_code == 400


def test_reset_request_unknown_email_does_not_enumerate(client, factory):
    # No se revela si el correo existe: respuesta 200 genérica igual que si existiera.
    response = client.post(
        f"{PREFIX}/auth/password-reset/request",
        json={"email": "desconocido@casplay.com"},
    )
    assert response.status_code == 200


def test_sessions_revoked_after_password_change(client, factory):
    user = factory.student(password=PASSWORD)
    tokens = _login(client, user.email)

    changed = client.post(
        f"{PREFIX}/auth/change-password",
        headers=factory.bearer(user),
        json={"current_password": PASSWORD, "new_password": "NuevaClave1@"},
    )
    assert changed.status_code == 200

    # El refresh previo al cambio queda invalidado.
    response = client.post(
        f"{PREFIX}/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 4) Protección de recursos (condiciones de acceso)
# ---------------------------------------------------------------------------


def test_unenrolled_student_cannot_start_attempt(client, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    evaluation = factory.evaluation_with_bank(course, instructor)

    response = client.post(
        f"{PREFIX}/evaluations/{evaluation.id}/attempts",
        headers=factory.bearer(student),
    )
    assert response.status_code == 403


def test_unenrolled_student_cannot_check_eligibility(client, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)

    response = client.get(
        f"{PREFIX}/courses/{course.id}/certificate/eligibility",
        headers=factory.bearer(student),
    )
    assert response.status_code == 403


def test_foreign_certificate_is_hidden(client, db, factory):
    instructor = factory.instructor()
    owner = factory.student()
    intruder = factory.student()
    course = factory.course(instructor, published=True)
    certificate = _pass_and_issue(db, factory, course, instructor, owner)

    response = client.get(
        f"{PREFIX}/certificates/{certificate.id}", headers=factory.bearer(intruder)
    )
    assert response.status_code == 404


def test_foreign_attempt_is_hidden(client, db, factory):
    instructor = factory.instructor()
    owner = factory.student()
    intruder = factory.student()
    course = factory.course(instructor, published=True)
    factory.enroll(owner, course)
    evaluation = factory.evaluation_with_bank(course, instructor)
    attempt = EvaluationService(db).start_attempt(evaluation.id, owner)

    response = client.get(
        f"{PREFIX}/attempts/{attempt.id}", headers=factory.bearer(intruder)
    )
    assert response.status_code == 404


def test_non_preview_video_requires_enrollment(client, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)

    response = client.get(
        f"{PREFIX}/lessons/{lessons[0].id}/video", headers=factory.bearer(student)
    )
    assert response.status_code == 403


def test_unpublished_course_is_not_public(client, factory):
    instructor = factory.instructor()
    course = factory.course(instructor)  # DRAFT

    response = client.get(f"{PREFIX}/courses/{course.id}")
    assert response.status_code == 404
