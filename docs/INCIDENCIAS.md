# Incidencias de implementación — CAS Play

Registro de las incidencias técnicas relevantes encontradas durante el
desarrollo y despliegue de la plataforma, con su causa raíz, la solución
aplicada y el estado actual. El objetivo es dejar trazabilidad de los problemas
que costó diagnosticar y de las decisiones que evitan que reaparezcan.

Clasificación por severidad:
- **Alta** — bloqueaba una funcionalidad o el despliegue.
- **Media** — afectaba una parte del flujo, con desvío o retrabajo.
- **Baja** — fricción de desarrollo o trampa a documentar.

---

## 1. Backend

### INC-01 · Enum de PostgreSQL no ampliable dentro de una transacción — Media
- **Síntoma:** al añadir el valor `USER_CREATED` al enum `audit_action` (auditoría
  de matrícula administrativa), la migración fallaba.
- **Causa:** `ALTER TYPE ... ADD VALUE` en PostgreSQL no puede ejecutarse dentro
  de un bloque transaccional normal.
- **Solución:** migración dedicada (`a7c4e1b9d2f8`) usando `autocommit_block()` de
  Alembic. Queda como patrón para futuros valores de enum.
- **Estado:** Resuelto.

### INC-02 · `HTTPBearer` devuelve 401 (no 403) sin cabecera — Baja
- **Síntoma:** las pruebas de seguridad esperaban 403 al faltar el token, pero la
  API respondía 401.
- **Causa:** comportamiento por defecto de `HTTPBearer` de FastAPI: sin cabecera
  `Authorization` retorna 401; el 403 queda para token presente pero sin permiso.
- **Solución:** se documentó la semántica (401 = sin/roto token, 403 = sin rol) y
  se alinearon las pruebas.
- **Estado:** Resuelto (comportamiento correcto, expectativa corregida).

---

## 2. Frontend

### INC-03 · `lucide-react` v1.18.0 sin iconos de marca — Media
- **Síntoma:** importar `Instagram`, `Linkedin`, `Youtube`, etc. para el perfil
  público del instructor daba `TS2305`/undefined.
- **Causa:** lucide eliminó los iconos de marca; esta versión no los exporta.
- **Solución:** usar iconos genéricos existentes (`Briefcase`→LinkedIn,
  `Camera`→Instagram, `Video`→YouTube, `Globe`, `Link`, `AtSign`). Verificar
  disponibilidad antes de importar.
- **Estado:** Resuelto (workaround estable).

### INC-04 · Subidas multipart forzadas a JSON por el cliente Axios — Media
- **Síntoma:** subir video/material (portada, foto de instructor) fallaba: el
  backend no recibía el `multipart/form-data`.
- **Causa:** el `axiosClient` fuerza `Content-Type: application/json` por defecto.
- **Solución:** en las peticiones con `FormData`, pasar
  `{ headers: { "Content-Type": undefined } }` para que el navegador fije el
  boundary correcto. Validado en vivo (video→`has_video`, PDF ok, ZIP→400).
- **Estado:** Resuelto.

### INC-05 · Inconsistencia de contrato de paginación — Baja
- **Síntoma:** confusión al consumir listados: unos endpoints paginan y otros no.
- **Causa:** `userService.list` usa `{ skip, limit }` y devuelve un array plano,
  mientras que `audit`/`courses` usan `{ page, size }` con `Paginated<T>`.
- **Solución:** documentado el patrón por módulo para evitar errores de consumo.
- **Estado:** Conocido / documentado (deuda menor).

---

## 3. Seguridad y contraseñas

### INC-06 · Política de contraseñas duplicada backend/frontend — Media (incidencia principal)

Es la incidencia más relevante del proyecto por su carácter estructural: no fue
un fallo puntual, sino una **duplicación de regla de negocio** que persiste en el
código y exige disciplina para no romperse en silencio.

- **Síntoma:** la misma política de robustez de contraseña está escrita dos veces,
  con riesgo de que cliente y servidor validen criterios distintos sin que ninguna
  prueba lo detecte.

- **Causa raíz — la regla vive en dos archivos:**
  - Backend: `backend/app/shared/password.py` → `validate_password_strength()`
    (lanza `BadRequestException` 400, mensaje en español). Se invoca en
    `auth/service.py` en `change_password` y `confirm_password_reset`.
  - Frontend: `frontend/src/modules/auth/schemas/passwordPolicy.ts` →
    `passwordSchema` (Zod) + `evaluatePassword()` para el checklist en vivo
    (`PasswordRequirements.tsx`).

  Criterios replicados: mínimo 8, máximo 128, ≥1 mayúscula, ≥1 minúscula, ≥1
  número y ≥1 símbolo de `@!$%&*`.

- **Duplicación interna adicional (trampa latente):** dentro de *cada* archivo el
  conjunto de símbolos está escrito **dos veces** — como constante y como literal
  del regex, que no derivan uno del otro:
  - Backend: `PASSWORD_SPECIAL_CHARS = "@!$%&*"` **y** aparte
    `_SPECIAL_PATTERN = re.compile(r"[@!$%&*]")`.
  - Frontend: `PASSWORD_SPECIAL_CHARS = "@!$%&*"` **y** aparte el test `/[@!$%&*]/`.

  Consecuencia: si alguien edita la constante (p. ej. añadir `#`), el mensaje al
  usuario cambiaría pero **el regex seguiría validando el conjunto viejo**, así que
  la validación aceptaría/rechazaría un símbolo distinto al anunciado, sin error de
  compilación ni prueba que lo delate.

- **Asimetría por diseño (correcta, no es el defecto):** el **login no** aplica la
  política (exige solo un valor no vacío y responde con mensaje genérico). Es
  intencional (ADR-007) para no filtrar las reglas ni facilitar la enumeración de
  usuarios, y para que cuentas semilla (admin `Admin12345`, sin símbolo) puedan
  entrar pero queden obligadas a cumplir en el siguiente cambio.

- **Impacto:** Medio. Hoy ambas definiciones coinciden; el riesgo es a futuro —
  toda modificación de la política obliga a tocar **cuatro** puntos (constante +
  regex, en dos archivos y dos lenguajes) sin ninguna verificación automática de
  consistencia. Un cambio parcial produciría un frontend que valida distinto del
  backend: rechazos confusos o, peor, contraseñas aceptadas por la API que el UI
  decía inválidas.

- **Estado:** Mitigado por convención (comentarios cruzados "mantener en sync" en
  ambos archivos). **No resuelto de raíz.**

- **Remediación propuesta (opciones, de menor a mayor esfuerzo):**
  1. *Quick win:* derivar el regex de la constante en cada archivo
     (`re.compile(f"[{re.escape(PASSWORD_SPECIAL_CHARS)}]")` en Python;
     `new RegExp(\`[${...}]\`)` en TS) para eliminar la duplicación interna. Deja
     un único punto de verdad por lenguaje.
  2. *Contrato verificable:* que el backend exponga la política en un endpoint
     (p. ej. `GET /auth/password-policy`) o un test de contrato que compare ambas
     definiciones, de modo que una divergencia rompa CI.
  3. *Fuente única:* generar la constante del frontend desde el backend en build.
     Probablemente sobredimensionado para el alcance de la tesis.

### INC-07 · Límite máximo de contraseña no está en la función de robustez — Baja
- **Síntoma:** trampa al escribir pruebas unitarias: `validate_password_strength`
  no rechazaba contraseñas de más de 128 caracteres.
- **Causa:** el máximo de 128 se valida en la capa de schemas Pydantic, no en la
  función de robustez (que solo verifica mínimo + clases de caracteres).
- **Solución:** documentado dónde se aplica cada límite.
- **Estado:** Conocido / documentado.

---

## 4. Despliegue (Dokploy / producción)

### INC-08 · El seed runner no registraba todos los modelos — Alta
- **Síntoma:** al desplegar, el seed inicial fallaba porque faltaban tablas/modelos
  en el metadata al arrancar.
- **Causa:** el runner de seed no importaba/registraba todos los modelos
  SQLAlchemy antes de operar.
- **Solución:** commit `f1da9a8` — registrar todos los modelos en el seed runner.
- **Estado:** Resuelto.

### INC-09 · Publicación de puertos HTTP para proxy externo (Plesk) — Media
- **Síntoma:** el proxy externo no alcanzaba los contenedores.
- **Causa:** configuración de red/puertos para el proxy inverso de Plesk.
- **Solución:** commit `456cfb4` — publicar puertos HTTP explícitamente para el
  proxy externo.
- **Estado:** Resuelto.

---

## 5. Entorno / Tooling (pipeline de recursos)

### INC-11 · pypdfium2 no abre rutas con caracteres no-ASCII — Alta
- **Síntoma:** en el pipeline de conversión PDF→Markdown (`recursos/convert_pdfs.py`,
  Docling 2.103.0 en Windows), archivos bajo `panadería/` o con `Nutrición` daban
  `ConversionError: ... is not valid`, mientras el mismo archivo funcionaba bajo
  `cocina/` (ruta ASCII).
- **Causa:** pypdfium2 no abre archivos cuya ruta contiene tildes/no-ASCII.
- **Solución:** leer los bytes en Python y pasar
  `DocumentStream(name, stream=BytesIO(...))` en vez de la ruta.
- **Estado:** Resuelto.

### INC-12 · OCR con desbordamiento de memoria y envenenamiento del pool — Alta
- **Síntoma:** crashes masivos (`std::bad_alloc`) en diapositivas con imagen a
  página completa; el crash nativo no se capturaba en Python y dejaba inservible
  el `ProcessPoolExecutor`.
- **Causa:** RapidOCR rasteriza a scale=3 (~216 DPI) y agota memoria; un fallo
  nativo no se maneja como excepción Python.
- **Solución:** monkeypatch a `scale=2`, `ocr_batch_size=1`, aislar cada PDF en un
  subproceso (modo `--single`) orquestado con hilos y reintento secuencial de los
  ERROR.
- **Estado:** Resuelto.

---

## 6. Datos de prueba pendientes de limpieza — Baja

Quedaron datos de validación por depurar al cierre: cursos
`"VALIDACION Sprint 12 (editado)"` y `"VALIDACION contenido"`, y usuarios
`val.instr.*@casplay.com` / `val.stu.*@casplay.com` (pass `Test12345`).
**Estado:** Pendiente de limpieza.

---

## Resumen

| ID | Incidencia | Área | Severidad | Estado |
|----|-----------|------|-----------|--------|
| INC-01 | Enum PG no ampliable en transacción | Backend | Media | Resuelto |
| INC-02 | HTTPBearer 401 vs 403 | Backend | Baja | Resuelto |
| INC-03 | lucide-react sin iconos de marca | Frontend | Media | Resuelto |
| INC-04 | Multipart forzado a JSON por Axios | Frontend | Media | Resuelto |
| INC-05 | Contrato de paginación inconsistente | Frontend | Baja | Documentado |
| **INC-06** | **Política de contraseñas duplicada (principal)** | **Seguridad** | **Media** | **Mitigado — deuda estructural** |
| INC-07 | Máximo de contraseña fuera de la función | Seguridad | Baja | Documentado |
| INC-08 | Seed runner sin todos los modelos | Despliegue | Alta | Resuelto |
| INC-09 | Puertos HTTP para proxy Plesk | Despliegue | Media | Resuelto |
| INC-11 | Rutas Unicode en pypdfium2 | Tooling | Alta | Resuelto |
| INC-12 | OCR OOM + pool envenenado | Tooling | Alta | Resuelto |

**Balance:** 11 incidencias registradas; 8 resueltas, 3 documentadas/mitigadas.
La incidencia principal es **INC-06** (duplicación de la política de contraseñas):
no es un fallo puntual sino **deuda estructural** que sigue en el código y depende
de disciplina para no desincronizarse. Las de severidad alta (INC-08, INC-11,
INC-12) estaban en el despliegue y en el pipeline de contenido, no en la lógica de
negocio de la API, que se mantuvo estable.
