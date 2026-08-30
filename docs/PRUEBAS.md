# PRUEBAS.md — Pruebas de integración y funcionales

## 1. Objetivo

Verificar que los procesos representativos de la plataforma funcionan de extremo
a extremo, comprobando la interacción real entre capas
(`service → repository → PostgreSQL`) y algunos flujos completos desde la
perspectiva de uso.

Este documento complementa a las pruebas unitarias ya existentes en
`backend/tests/unit/` (lógica pura: política de contraseñas, transiciones de
estado, validación de opciones, elegibilidad de certificado, código de
certificado y perfil público del instructor).

## 2. Niveles de evidencia

| Nivel | Herramienta | Qué comprueba | Ámbito |
|---|---|---|---|
| **Integración** | pytest + base de datos de pruebas | Interacción real `service → repository → PostgreSQL`, reglas de negocio con persistencia y transacciones | `backend/tests/integration/` |
| **Funcional** | Postman + aplicación web | Flujos completos desde la perspectiva del usuario (petición HTTP real / interacción en la UI) | Colección Postman + navegador |

## 3. Infraestructura de integración (requisito previo)

Las pruebas unitarias no tocan la base de datos. Las de integración sí, por lo
que antes de ejecutarlas se debe montar:

1. **Base de datos de pruebas** — una BD PostgreSQL dedicada (p. ej.
   `cas_test`), **nunca** la de desarrollo. Se recomienda variable
   `TEST_DATABASE_URL` o un `.env.test`.
2. **`backend/tests/conftest.py`** con:
   - Fixture de motor/esquema: crear el esquema con las migraciones Alembic (o
     `Base.metadata.create_all` solo para el entorno de test).
   - Fixture de **sesión transaccional por test**: abrir transacción, ejecutar
     el test y hacer *rollback* al final para aislar cada caso.
   - Cliente HTTP (`TestClient`/`httpx`) con override de `get_db` apuntando a la
     sesión de prueba, para los casos que suben hasta el router.
3. **Factories / helpers** para crear datos base (rol, admin, instructor,
   estudiante, curso publicado, evaluación con 20 preguntas, matrícula).
4. **Aislamiento de efectos externos**: `EMAILS_ENABLED=False` (ya es el
   valor por defecto) y `MEDIA_ROOT` apuntando a un directorio temporal para
   videos, materiales y PDF de certificados.

Ejecución prevista:

```bash
cd backend
.venv/Scripts/python.exe -m pytest tests/integration -v
```

## 4. Procesos representativos y casos de integración

Cada caso apunta a la función real de negocio y a la regla que verifica.

### 4.1 Autenticación — `auth/service.py`

| # | Caso | Función | Regla | Esperado |
|---|---|---|---|---|
| 1 | Inicio de sesión válido | `login` | BR-035 | tokens emitidos + auditoría `LOGIN` |
| 2 | Correo inexistente | `login` | — | 401 + `LOGIN_FAILED(user_not_found)` |
| 3 | Contraseña incorrecta | `login` | — | 401 + `LOGIN_FAILED(invalid_password)` |
| 4 | Usuario inactivo | `login` | — | 401 + `LOGIN_FAILED(inactive)` |
| 5 | Renovación válida | `refresh_access_token` | — | nuevo access token |
| 6 | Renovación con token revocado/ inválido | `refresh_access_token` | — | 401 |
| 7 | Cierre de sesión activo | `logout` | — | refresh revocado |
| 8 | Cierre de sesión ya inactivo | `logout` | — | 400 |

### 4.2 Gestión de usuarios — `users/service.py`

| # | Caso | Función | Regla | Esperado |
|---|---|---|---|---|
| 1 | Alta de ADMIN/INSTRUCTOR | `create_user` | BR-037, BR-035 | usuario creado con contraseña temporal + auditoría `USER_CREATED` |
| 2 | Alta de rol STUDENT bloqueada | `create_user` | BR-036 | 400 (los estudiantes se crean al matricular) |
| 3 | Correo duplicado | `create_user` | — | 409 |
| 4 | Rol inexistente | `create_user` | — | 404 |
| 5 | Actualización de datos | `update_user` | BR-035 | cambios persistidos + auditoría `USER_UPDATED` |
| 6 | Correo a uno ya existente | `update_user` | — | 409 |
| 7 | Promover a STUDENT bloqueado | `update_user` | BR-036 | 400 |

### 4.3 Cursos y contenidos — `courses/service.py`, `lessons/service.py`

| # | Caso | Función | Regla | Esperado |
|---|---|---|---|---|
| 1 | Instructor crea curso propio | `create_course` | BR-003 | curso a su nombre + auditoría `COURSE_CREATED` |
| 2 | Admin crea con instructor válido | `create_course` | BR-003 | curso asignado al instructor |
| 3 | Admin con instructor inválido | `create_course` | — | 400 |
| 4 | Publicar borrador | `publish_course` | BR-002 | DRAFT→PUBLISHED + auditoría `COURSE_PUBLISHED` |
| 5 | Transición inválida | `_change_status` | BR-002 | 400 (p. ej. DRAFT→HIDDEN) |
| 6 | Curso finalizado es terminal | `finish_course` | BR-006 | FINISHED no admite más cambios |
| 7 | Vista pública solo si PUBLISHED | `get_public_course` | BR-004, BR-005 | DRAFT/HIDDEN→404; PUBLISHED→ok |
| 8 | Crear clase con posición | `create_lesson` | BR-007, BR-008 | posición autoincremental |
| 9 | Reordenar con conjunto exacto | `reorder_lessons` | — | reposiciona 1..n |
| 10 | Reordenar con conjunto inválido | `reorder_lessons` | — | 400 |
| 11 | Clase de vista previa pública | `get_consumable_lesson` | BR-011 | accesible sin matrícula |
| 12 | Contenido no-preview sin matrícula | `get_consumable_lesson` | BR-016 | 403 |
| 13 | Contenido accesible a matriculado | `get_consumable_lesson` | BR-016 | clase devuelta |

### 4.4 Matrículas y progreso — `enrollments/service.py`, `progress/service.py`

| # | Caso | Función | Regla | Esperado |
|---|---|---|---|---|
| 1 | Matrícula en curso publicado | `enroll` | BR-015, BR-035 | matrícula + auditoría `ENROLLMENT_CREATED` |
| 2 | Matrícula duplicada | `enroll` | BR-015 | 409 |
| 3 | Matrícula en curso no publicado | `enroll` | — | 404 |
| 4 | Alta administrativa (correo nuevo) | `create_admin_enrollment` | BR-036, BR-037 | crea estudiante + contraseña temporal + correo |
| 5 | Alta administrativa (correo existente) | `create_admin_enrollment` | BR-036 | reutiliza estudiante activo |
| 6 | Alta administrativa ya matriculado | `create_admin_enrollment` | BR-015 | 409 |
| 7 | Marcar clase completada | `complete_lesson` | BR-017 | `is_completed=True` + `completed_at` |
| 8 | Guardar último segundo | `save_last_second` | BR-018 | `last_second` persistido |
| 9 | Progreso sin matrícula | `complete_lesson` | BR-016 | 403 |
| 10 | Porcentaje de avance del curso | `get_course_progress` | BR-019 | %=completadas/total redondeado |

### 4.5 Evaluaciones — `evaluations/service.py`

| # | Caso | Función | Regla | Esperado |
|---|---|---|---|---|
| 1 | Crear evaluación única | `create_evaluation` | BR-020 | creada; segunda en el curso → 409 |
| 2 | Banco máximo de preguntas | `add_question` | BR-021 | hasta 20; la 21.ª → 400 |
| 3 | Iniciar intento (matriculado) | `start_attempt` | BR-016, BR-022 | 10 preguntas aleatorias, `IN_PROGRESS` |
| 4 | Iniciar sin matrícula | `start_attempt` | BR-016 | 403 |
| 5 | Reanudar intento en curso | `start_attempt` | BR-024 | no consume intento nuevo |
| 6 | Límite de intentos | `start_attempt` | BR-024 | tercer intento → 409 |
| 7 | Calificación automática | `submit_attempt` | BR-025 | nota=correctas/10·10; `passed = nota≥7` |
| 8 | Reenvío de intento enviado | `submit_attempt` | — | 400 |

### 4.6 Certificados — `certificates/service.py`

| # | Caso | Función | Regla | Esperado |
|---|---|---|---|---|
| 1 | Elegibilidad negativa | `get_eligibility` | BR-026 | no elegible con motivo (sin nota / nota <7) |
| 2 | Elegibilidad positiva | `get_eligibility` | BR-027 | elegible con nota ≥7 |
| 3 | Emisión no elegible | `issue_certificate` | BR-026 | 400 |
| 4 | Emisión correcta | `issue_certificate` | BR-028, BR-035 | código único + PDF + auditoría `CERTIFICATE_ISSUED` |
| 5 | Emisión duplicada | `issue_certificate` | — | 409 |
| 6 | Verificación pública válida | `verify_certificate` | BR-030 | datos públicos del certificado |
| 7 | Verificación de código inexistente | `verify_certificate` | — | 404 |
| 8 | Validez tras ocultar el curso | `verify_certificate` | BR-029 | sigue válido |

### 4.7 Valoraciones — `ratings/service.py`

| # | Caso | Función | Regla | Esperado |
|---|---|---|---|---|
| 1 | Valorar con avance ≥90% | `rate_course` | BR-031 | valoración registrada |
| 2 | Valorar con avance <90% | `rate_course` | BR-031 | 403 |
| 3 | Valorar sin matrícula | `rate_course` | BR-031 | 403 |
| 4 | Valoración duplicada | `rate_course` | BR-031 | 409 (una por matrícula) |
| 5 | Actualizar valoración propia | `update_my_rating` | — | valoración actualizada |
| 6 | Resumen del curso | `get_course_summary` | BR-032 | promedio y total |

## 5. Flujo funcional representativo (extremo a extremo)

Recorre las áreas encadenadas en un único caso de uso realista:

```
Curso publicado
  → estudiante se matricula
  → accede al contenido
  → registra progreso (completa clases)
  → realiza la evaluación final
  → obtiene calificación (≥7)
  → cumple condiciones de elegibilidad
  → emite el certificado
  → verifica públicamente el certificado
```

Puntos de verificación del flujo:

1. El curso solo es visible/accesible cuando está `PUBLISHED` (BR-004).
2. Sin matrícula, el contenido no-preview responde 403 (BR-016).
3. El progreso avanza al completar clases (BR-017, BR-019).
4. El intento presenta 10 preguntas y califica sobre 10 (BR-022, BR-025).
5. El certificado se emite solo con nota ≥7 (BR-026) y expone código + QR.
6. La verificación pública del código funciona sin autenticación (BR-030).

## 6. Pruebas funcionales (Postman + web)

### 6.1 Colección Postman

Colección lista para importar: `docs/postman/CAS_E2E.postman_collection.json`
(6 carpetas, 21 peticiones). Recorre el flujo E2E completo con scripts que
capturan tokens/ids y arman automáticamente las respuestas correctas de la
evaluación.

- Variables incluidas en la colección: `base_url` (por defecto
  `http://localhost:8000/api/v1`), credenciales semilla y los ids generados en
  ejecución (curso, módulo, clase, evaluación, intento, certificado).
- Cada petición valida con *tests* de Postman el código de estado y el cuerpo.
- **Ejecutar con el Collection Runner** (no petición por petición): el banco de
  20 preguntas se crea en bucle vía `setNextRequest`, y varios pasos dependen de
  variables fijadas por pasos anteriores.
- Requisitos: backend en marcha y usuarios semilla `admin@casplay.com`,
  `docente@casplay.com`, `estudiante@casplay.com`.

### 6.2 Aplicación web

- Login con el administrador semilla (`admin@casplay.com`).
- Matricular un estudiante desde el panel de administración.
- Ingresar como estudiante, consumir contenido, rendir la evaluación y descargar
  el certificado.
- Verificar el certificado desde la URL/QR público.

## 7. Evidencia esperada

Casos planificados por proceso. Las columnas de resultado se completan tras
ejecutar la suite de integración y los flujos funcionales.

| Proceso evaluado | Casos ejecutados | Aprobados | Fallidos |
|---|---|---|---|
| Autenticación | 8 | 8 | 0 |
| Gestión de usuarios | 7 | 7 | 0 |
| Cursos y contenidos | 13 | 13 | 0 |
| Matrículas y progreso | 10 | 10 | 0 |
| Evaluaciones | 8 | 8 | 0 |
| Certificados | 8 | 8 | 0 |
| Valoraciones | 6 | 6 | 0 |
| **Total** | **60** | **60** | **0** |

Resultado de la ejecución de integración: `60 passed`.
Suite completa (unitarios + integración): `102 passed`.

> Nota: los unitarios (42 casos, 42 aprobados) se documentan aparte; esta tabla
> cubre el nivel de integración. Ejecución:
> `cd backend && .venv/Scripts/python.exe -m pytest tests/integration -v`.
> Requiere una base `cas_test` en el PostgreSQL local; el esquema se crea y se
> elimina automáticamente en cada corrida.

## 8. Criterios de aprobación

- Todos los casos planificados ejecutados sin fallos.
- Cada regla de negocio citada verificada por al menos un caso.
- El flujo representativo completo ejecutado de principio a fin sin intervención
  manual sobre la base de datos.

## 9. Pruebas de seguridad

Se ejercita la API real vía `TestClient` (`backend/tests/integration/test_security.py`)
para observar a nivel HTTP los códigos que distinguen los modos de fallo:

- **401 Unauthorized**: no existe una autenticación válida.
- **403 Forbidden**: el usuario está autenticado, pero no tiene permiso.
- **404 Not Found**: el recurso se oculta cuando no pertenece al usuario.

Cubre JWT, refresh tokens persistidos/revocables, autorización por rol, control
de propiedad de recursos, recuperación de contraseña, política de contraseñas y
restricciones de acceso a recursos.

### 9.1 Casos por área

| Área | Caso | Endpoint | Esperado |
|---|---|---|---|
| Autenticación y tokens | Token ausente | `GET /auth/me` | 401 |
| Autenticación y tokens | Token malformado | `GET /auth/me` | 401 |
| Autenticación y tokens | Tipo incorrecto (refresh como access) | `GET /auth/me` | 401 |
| Autenticación y tokens | Refresh revocado (tras logout) | `POST /auth/refresh` | 401 |
| Autenticación y tokens | Usuario inactivo | `GET /auth/me` | 401 |
| Control de acceso | Estudiante a endpoint de ADMIN | `GET /users` | 403 |
| Control de acceso | Estudiante crea curso | `POST /courses` | 403 |
| Control de acceso | Instructor gestiona curso ajeno | `GET /courses/{id}/manage` | 403 |
| Control de acceso | ADMIN gestiona cualquier curso | `GET /courses/{id}/manage` | 200 |
| Control de acceso | Instructor sobre evaluación ajena | `POST /courses/{id}/evaluation` | 403 |
| Contraseñas y recuperación | Contraseña débil al cambiar | `POST /auth/change-password` | 400 |
| Contraseñas y recuperación | Token de recuperación inválido | `POST /auth/password-reset/confirm` | 400 |
| Contraseñas y recuperación | Correo desconocido (sin enumeración) | `POST /auth/password-reset/request` | 200 |
| Contraseñas y recuperación | Sesiones revocadas tras el cambio | `POST /auth/refresh` | 401 |
| Protección de recursos | No matriculado inicia evaluación | `POST /evaluations/{id}/attempts` | 403 |
| Protección de recursos | No matriculado consulta elegibilidad | `GET /courses/{id}/certificate/eligibility` | 403 |
| Protección de recursos | Certificado de otro usuario (oculto) | `GET /certificates/{id}` | 404 |
| Protección de recursos | Intento de otro usuario (oculto) | `GET /attempts/{id}` | 404 |
| Protección de recursos | Video no-preview sin matrícula | `GET /lessons/{id}/video` | 403 |
| Protección de recursos | Curso no publicado (público) | `GET /courses/{id}` | 404 |

### 9.2 Evidencia

| Área evaluada | Casos ejecutados | Aprobados | Fallidos |
|---|---|---|---|
| Autenticación y tokens | 5 | 5 | 0 |
| Control de acceso | 5 | 5 | 0 |
| Contraseñas y recuperación | 4 | 4 | 0 |
| Protección de recursos | 6 | 6 | 0 |
| **Total** | **20** | **20** | **0** |

Resultado de la ejecución: `20 passed`.
Suite completa (unitarios + integración + seguridad): `122 passed`.
Ejecución: `cd backend && .venv/Scripts/python.exe -m pytest tests/integration/test_security.py -v`.
