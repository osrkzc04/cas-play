"""
Prueba de rendimiento de CAS Play (API en producción) con Locust.

Modela el uso previsto de la plataforma: catálogo de cursos asincrónicos con una
mayoría de estudiantes navegando y aprendiendo, algunos visitantes anónimos
mirando el catálogo público y, ocasionalmente, un docente o un administrador
consultando sus paneles.

Escenarios de carga (usuarios concurrentes):
    - Carga baja:            10  -> comportamiento base
    - Carga esperada:        30  -> uso habitual
    - Carga máxima prevista:  50  -> límite esperado del proyecto

No se busca estresar el servidor con cientos/miles de usuarios: eso se aleja del
alcance definido para CAS Play.

Uso (headless):
    python -m locust -f perf/locustfile.py --headless \
        --host https://apicas.kamaycode.ec \
        -u 10 -r 5 -t 1m --csv perf/results/low
"""

import os
import random

from locust import HttpUser, between, task


# Credenciales reales de producción. Se pueden sobrescribir por variables de
# entorno para no fijar secretos en el repositorio.
ADMIN = (
    os.getenv("CAS_ADMIN_EMAIL", "admin@casplay.com"),
    os.getenv("CAS_ADMIN_PASSWORD", "Admin12345"),
)
INSTRUCTOR = (
    os.getenv("CAS_INSTRUCTOR_EMAIL", "oscarpgualoto@gmail.com"),
    os.getenv("CAS_INSTRUCTOR_PASSWORD", "wIeQP&u3xOl4E!J42m"),
)
STUDENT = (
    os.getenv("CAS_STUDENT_EMAIL", "oskrk04@hotmail.com"),
    os.getenv("CAS_STUDENT_PASSWORD", "@XMx#4$Biob&0KcLIe"),
)

API = "/api/v1"


class _CasUser(HttpUser):
    """Base con login y descubrimiento de IDs de curso reales."""

    abstract = True
    # Tiempo de reflexión entre acciones: simula lectura/navegación humana.
    wait_time = between(1, 4)

    credentials = None  # (email, password) o None para anónimo

    def on_start(self):
        self.token = None
        self.course_ids = self._discover_courses()
        if self.credentials:
            self._login(*self.credentials)

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    def _login(self, email, password):
        with self.client.post(
            f"{API}/auth/login",
            json={"email": email, "password": password},
            name="POST /auth/login",
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                self.token = res.json().get("access_token")
                res.success()
            else:
                res.failure(f"login {res.status_code}")

    @property
    def auth(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def _discover_courses(self):
        # Usa IDs reales del catálogo publicado para que las rutas /{id} no
        # devuelvan 404 y la prueba refleje consultas legítimas.
        try:
            res = self.client.get(
                f"{API}/courses?page=1&size=20",
                name="GET /courses (catalog)",
            )
            return [c["id"] for c in res.json().get("items", [])]
        except Exception:
            return []

    def _course(self):
        return random.choice(self.course_ids) if self.course_ids else None


class AnonymousVisitor(_CasUser):
    """Visitante sin sesión que explora el catálogo público."""

    weight = 3
    credentials = None

    @task(5)
    def browse_catalog(self):
        self.client.get(
            f"{API}/courses?page=1&size=10", name="GET /courses (catalog)"
        )

    @task(4)
    def view_course(self):
        cid = self._course()
        if cid:
            self.client.get(f"{API}/courses/{cid}", name="GET /courses/{id}")

    @task(2)
    def ratings_summary(self):
        cid = self._course()
        if cid:
            self.client.get(
                f"{API}/courses/{cid}/ratings/summary",
                name="GET /courses/{id}/ratings/summary",
            )

    @task(2)
    def ratings_list(self):
        cid = self._course()
        if cid:
            self.client.get(
                f"{API}/courses/{cid}/ratings?page=1&size=10",
                name="GET /courses/{id}/ratings",
            )

    @task(1)
    def health(self):
        self.client.get(f"{API}/health", name="GET /health")


class StudentUser(_CasUser):
    """Estudiante autenticado: navega, entra a sus cursos y consume contenido."""

    weight = 6
    credentials = STUDENT

    @task(5)
    def browse_catalog(self):
        self.client.get(
            f"{API}/courses?page=1&size=10", name="GET /courses (catalog)"
        )

    @task(3)
    def my_enrollments(self):
        self.client.get(
            f"{API}/enrollments/me?page=1&size=10",
            headers=self.auth,
            name="GET /enrollments/me",
        )

    @task(3)
    def view_course(self):
        cid = self._course()
        if cid:
            self.client.get(f"{API}/courses/{cid}", name="GET /courses/{id}")

    @task(3)
    def curriculum(self):
        cid = self._course()
        if cid:
            self.client.get(
                f"{API}/courses/{cid}/curriculum",
                headers=self.auth,
                name="GET /courses/{id}/curriculum",
            )

    @task(2)
    def enrollment_status(self):
        cid = self._course()
        if cid:
            self.client.get(
                f"{API}/courses/{cid}/enrollment",
                headers=self.auth,
                name="GET /courses/{id}/enrollment",
            )

    @task(2)
    def my_rating(self):
        cid = self._course()
        if cid:
            self.client.get(
                f"{API}/courses/{cid}/rating",
                headers=self.auth,
                name="GET /courses/{id}/rating",
            )

    @task(1)
    def me(self):
        self.client.get(f"{API}/auth/me", headers=self.auth, name="GET /auth/me")


class InstructorUser(_CasUser):
    """Docente que revisa sus cursos y su perfil."""

    weight = 1
    credentials = INSTRUCTOR

    @task(4)
    def manage_courses(self):
        self.client.get(
            f"{API}/courses/manage?page=1&size=10",
            headers=self.auth,
            name="GET /courses/manage",
        )

    @task(2)
    def own_profile(self):
        self.client.get(
            f"{API}/instructor/profile",
            headers=self.auth,
            name="GET /instructor/profile",
        )

    @task(2)
    def manage_course_detail(self):
        cid = self._course()
        if cid:
            self.client.get(
                f"{API}/courses/{cid}/manage",
                headers=self.auth,
                name="GET /courses/{id}/manage",
            )

    @task(1)
    def me(self):
        self.client.get(f"{API}/auth/me", headers=self.auth, name="GET /auth/me")


class AdminUser(_CasUser):
    """Administrador consultando paneles de gestión."""

    weight = 1
    credentials = ADMIN

    @task(3)
    def admin_enrollments(self):
        self.client.get(
            f"{API}/admin/enrollments?page=1&size=20",
            headers=self.auth,
            name="GET /admin/enrollments",
        )

    @task(3)
    def admin_ratings(self):
        self.client.get(
            f"{API}/admin/ratings?page=1&size=20",
            headers=self.auth,
            name="GET /admin/ratings",
        )

    @task(2)
    def manage_courses(self):
        self.client.get(
            f"{API}/courses/manage?page=1&size=10",
            headers=self.auth,
            name="GET /courses/manage",
        )

    @task(1)
    def me(self):
        self.client.get(f"{API}/auth/me", headers=self.auth, name="GET /auth/me")
