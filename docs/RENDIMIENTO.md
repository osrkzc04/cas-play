# Prueba de rendimiento — CAS Play API

Herramienta: **Locust 2.46.3**
Objetivo (host): `https://apicas.kamaycode.ec`
Script: [`perf/locustfile.py`](../perf/locustfile.py)
Fecha: 2026-08-12

## Alcance

La prueba refleja el uso previsto de la plataforma (cursos cortos asincrónicos),
no un test de estrés de miles de usuarios. Se evalúan tres escenarios alineados a
la capacidad esperada del proyecto:

| Escenario | Usuarios concurrentes | Propósito |
|-----------|-----------------------|-----------|
| Carga baja | 10 | Comportamiento base |
| Carga esperada | 30 | Uso habitual |
| Carga máxima prevista | 50 | Límite esperado del proyecto |

## Modelo de carga

Tráfico mixto por rol, ponderado según el uso real esperado (mayoría de
estudiantes, algunos visitantes anónimos, pocos docentes/administradores):

| Clase de usuario | Peso | Acciones simuladas |
|------------------|------|--------------------|
| `StudentUser` | 6 | Catálogo, mis inscripciones, detalle de curso, currículum, estado de inscripción, valoración, perfil |
| `AnonymousVisitor` | 3 | Catálogo público, detalle de curso, valoraciones, resumen de valoraciones, health |
| `InstructorUser` | 1 | Gestión de cursos, perfil docente, detalle de gestión |
| `AdminUser` | 1 | Inscripciones admin, valoraciones admin, gestión de cursos |

Parámetros por escenario: `spawn-rate = 5`, duración `60 s`, tiempo de reflexión
`between(1, 4) s` por acción. Los IDs de curso se descubren en tiempo de
ejecución desde el catálogo publicado para evitar rutas inexistentes (404).

## Resultados

| Usuarios | Solicitudes | Fallidas | Tiempo medio | P95 | Solicitudes/s |
|----------|-------------|----------|--------------|-----|---------------|
| 10 | 236 | 0 (0.00%) | 241 ms | 500 ms | 4.03 |
| 30 | 676 | 0 (0.00%) | 241 ms | 430 ms | 11.60 |
| 50 | 1088 | 0 (0.00%) | 249 ms | 470 ms | 18.67 |

CSV completos (por endpoint y percentiles) en `perf/results/{low,expected,max}_stats.csv`.

## Análisis

- **Fiabilidad:** 0 solicitudes fallidas en los tres escenarios. La API responde
  correctamente a toda la carga prevista.
- **Latencia estable:** el tiempo medio se mantiene en ~240–250 ms de 10 a 50
  usuarios; no hay degradación al aumentar la concurrencia dentro del alcance.
- **P95 acotado:** entre 430 y 500 ms. El valor algo mayor en carga baja proviene
  del pico de los `POST /auth/login` (bcrypt, ~480–580 ms) que pesan más en una
  muestra pequeña.
- **Throughput:** escala de forma casi lineal (4 → 11.6 → 18.7 req/s), limitado
  principalmente por el tiempo de reflexión simulado, no por el servidor.

**Conclusión:** la API soporta con holgura la carga máxima prevista (50 usuarios)
sin errores y con latencias estables, adecuada para el alcance de CAS Play.

## Cómo reproducir

```bash
python -m pip install locust
# baja / esperada / máxima
python -m locust -f perf/locustfile.py --headless --host https://apicas.kamaycode.ec -u 10 -r 5 -t 1m --csv perf/results/low
python -m locust -f perf/locustfile.py --headless --host https://apicas.kamaycode.ec -u 30 -r 5 -t 1m --csv perf/results/expected
python -m locust -f perf/locustfile.py --headless --host https://apicas.kamaycode.ec -u 50 -r 5 -t 1m --csv perf/results/max
```

Credenciales configurables por variables de entorno (`CAS_ADMIN_EMAIL`,
`CAS_STUDENT_PASSWORD`, etc.) para no fijar secretos.
