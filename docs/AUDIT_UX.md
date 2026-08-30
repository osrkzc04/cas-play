# AUDIT_UX.md

## Auditoría de UX/UI

**Fecha:** 2026-08-07
**Alcance:** Frontend (`frontend/src`) — sistema de diseño, layouts, primitivas compartidas y pantallas clave de los roles STUDENT, INSTRUCTOR y ADMIN.
**Método:** Revisión de código estático desde seis perspectivas de diseño (UX Architect, UX Designer, UI/Visual Designer, Design System Architect, Accessibility Designer, Interaction Designer).
**Naturaleza:** Documento de observaciones. No implica cambios de código; sirve de insumo para priorización.

**Leyenda de severidad:** 🔴 Alta · 🟡 Media · 🟢 Baja / mejora

---

## 1. UX Architect — Arquitectura de información y flujos

- 🔴 **La navegación móvil pierde la jerarquía de secciones.** En `DashboardLayout.tsx:108-130`, por debajo de `lg` el sidebar se oculta y se reemplaza por una barra superior con scroll horizontal que aplana todos los ítems (desaparecen las secciones "Contenido / Gestión / …" de `navSectionOrder`). En pantallas grandes hay agrupación semántica; en móvil no. Con muchos ítems el scroll horizontal esconde opciones sin affordance visible.
- 🟡 **Hueco de breakpoint entre `md` y `lg`.** El sidebar y su botón de colapso solo existen en `lg` (`sidebarOpen && "lg:flex"`, botón dentro de `hidden … lg:flex`). En tablet (`md`) no hay ni sidebar ni breadcrumb: solo la barra horizontal. La tablet queda con la experiencia "móvil".
- 🟡 **Dos metáforas de navegación conviven.** El shell usa breadcrumb `Sección › Etiqueta` (`DashboardLayout.tsx:90-106`), pero `CourseDetailPage`/`LearnPage` usan enlaces "← Volver al catálogo" hechos a mano. No hay un patrón de retorno único.
- 🟡 **El aula rompe el shell.** `LearnPage` renderiza su propio `min-h-screen` con header propio, saliéndose del `DashboardLayout`. Decisión válida (modo foco tipo Udemy) pero conviene documentarla como patrón intencional; genera dos "carcasas" distintas.
- 🔴 **El intento de evaluación no vive en la URL.** `EvaluationAttemptPage` usa una máquina de estados local (`intro | taking | result`, `EvaluationAttemptPage.tsx:32`). Un refresh o navegación accidental durante `taking` resetea a `intro` y pierde las respuestas. No hay deep-link ni recuperación del intento en curso.
- 🟢 **No existe sistema global de notificaciones.** Todo el feedback es `Alert` inline contextual (consistente), pero acciones como "Marcar como completada" no dan confirmación explícita: solo cambian de estado / navegan.

---

## 2. UX Designer — Usabilidad y contenido

- 🟡 **Autoavance sin aviso.** "Marcar como completada" navega automáticamente a la siguiente clase (`LearnPage.tsx:112-116`) y el fin del video también autocompleta (`:187-189`). Puede desorientar; no hay confirmación ni "deshacer".
- 🔴 **Se puede enviar la evaluación incompleta sin advertencia.** `handleSubmit` (`EvaluationAttemptPage.tsx:69-86`) manda `selected_option_id: null` para las no respondidas. Se muestra "Respondidas X de N" pero no hay un guardia tipo "Tienes 3 preguntas sin responder, ¿enviar de todos modos?".
- 🟡 **Sin mostrar/ocultar contraseña** en `LoginPage` (y presumiblemente en cambio/reset de contraseña). Expectativa de usabilidad muy extendida.
- 🟢 **Paginación mínima.** `Pagination.tsx` es solo Anterior/Siguiente + "Página X de Y", sin números ni salto directo. Aceptable para catálogos pequeños; limita en listados administrativos largos.
- 🟢 **Fortaleza:** cobertura sólida y consistente de estados de carga / vacío / error (`PageLoader`, `EmptyState`, `Alert`) en todas las pantallas revisadas.
- 🟢 **Fortaleza:** buena lógica de reanudación en `CourseDetailPage` (Empezar / Continuar / Repasar según progreso, `:365-369`).

---

## 3. UI / Visual Designer — Identidad visual

- 🟢 **Fortaleza notable:** disciplina cromática. Un único acento (rojo `brand`), oro reservado a logro/certificado/rating, escala neutra tematizable. El `ProgressBar` que pasa a oro al 100% es un buen detalle de identidad.
- 🔴 **Los colores semánticos no son tematizables.** `Alert` y `Badge` usan clases crudas de Tailwind (`bg-green-50 text-green-700`, `bg-blue-50`, `bg-amber-100`), y hay usos inline (`text-green-600` en `LearnPage.tsx:248`, `EvaluationAttemptPage.tsx:239`). Solo `surface`, `card` y `gray` se invierten en modo oscuro (`index.css:24-37`). En dark mode, un `Alert` success/info/warning conserva fondo claro con texto oscuro → riesgo de contraste e incoherencia visual.
- 🟡 **`Modal` no usa la escala de elevación propia.** Emplea `shadow-xl` (default Tailwind) en lugar de los tokens `shadow-elevated/dropdown` definidos en `tailwind.config.js:64-71`.
- 🟢 **Radio del modal** `rounded-xl` (16px) mientras el comentario del componente dice "radio 12px" (`Modal.tsx:23`) — discrepancia menor entre intención documentada y clase aplicada.
- 🟢 Buen tamaño de objetivo táctil en botones (`md` = 44px de alto) y anillo de foco consistente.

---

## 4. Design System Architect — Consistencia del sistema

- 🔴 **Falta la capa de tokens semánticos de estado.** No existen `--color-success/-warning/-info/-danger`. Las decisiones de color de estado están duplicadas y dispersas (`Alert.tsx:14-25`, `Badge.tsx:14-39`, e inline en páginas). Es el mayor hueco arquitectónico del design system: rompe el contrato de theming y multiplica el punto de cambio.
- 🟡 **No hay primitiva `IconButton`.** El mismo bloque de clases de botón-ícono (`inline-flex h-9 w-9 … focus-visible:ring-2 …`) está copiado en `DashboardLayout`, `ThemeToggle`, `Modal` y las flechas de `LearnPage`. Copia-pega → riesgo de divergencia.
- 🟡 **Variantes redundantes en `Button`.** `secondary` y `outline` son idénticas (`Button.tsx:20-22`, documentado como compatibilidad). API con ruido; conviene deprecar una.
- 🟡 **Múltiples componentes de badge** (`Badge`, `StatusBadge`, `CourseStatusBadge`). Verificar solapamiento y una única fuente de verdad para tonos/estados.
- 🟢 **Naming de la escala gris confunde en dark.** `gray-900` es texto casi-blanco en oscuro (inversión en `index.css`). Documentado, pero un naming semántico (`fg`/`text-primary`) reduciría errores de contribuyentes.
- 🟢 **Fortaleza:** tokens como tripletes RGB con `<alpha-value>`, `darkMode: "class"`, `index.ts` central de componentes y helper `cn()`. Base muy sana.

---

## 5. Accessibility Designer — Accesibilidad (WCAG)

- 🔴 **`Modal` sin trampa de foco ni foco inicial.** `Modal.tsx` tiene `role="dialog"` + `aria-modal` y cierre con Escape, pero no mueve el foco al abrir, no atrapa el Tab (se puede tabular al contenido de fondo) y no devuelve el foco al disparador al cerrar. Contrasta con `DropdownMenu`, que sí gestiona foco (`DropdownMenu.tsx:88-90, 106-113`). Además usa `aria-label={title}` en vez de `aria-labelledby` apuntando al `<h2>` visible.
- 🟡 **`Tabs` incompletos según patrón ARIA.** Hay `role="tablist/tab"` y `aria-selected` (`Tabs.tsx`), pero falta navegación con flechas (roving tabindex) y no hay `aria-controls` → `role="tabpanel"`. Es un tablist "visual" más que funcional para lector de pantalla.
- 🟡 **`StarRating` interactivo con ARIA incongruente.** `role="radiogroup"` pero los hijos son `<button aria-label>`, no `role="radio"` con `aria-checked`, y no hay selección por flechas (`StarRating.tsx:32-67`). Semántica mixta.
- 🟡 **`role="alert"` usado también para mensajes no urgentes.** `Alert` siempre es `role="alert"` (assertive), incluso para informativos estáticos como "Ya estás inscrito" (`CourseDetailPage.tsx:357`). Interrumpe al lector en cada render/navegación; para no urgentes debería ser `role="status"`/`aria-live="polite"`.
- 🟡 **Sin "saltar al contenido".** Ningún layout ofrece skip-link; el usuario de teclado recorre todo el sidebar en cada página.
- 🟡 **Cambio de clase sin aviso a lector de pantalla.** Al navegar entre lecciones (`goToLesson`) no se reposiciona el foco ni hay región `aria-live`; el usuario no percibe que cambió el contenido (SPA).
- 🟢 **`ProgressBar` sin `aria-valuetext`/label** (`ProgressBar.tsx:18-24`): anuncia el número pero no "45% completado".
- 🟢 **Fortalezas:** `focus-visible` global (`index.css:64-66`), `aria-label` en todos los botones-ícono, `aria-invalid` en inputs, `aria-pressed` en toggles, radios nativos en preguntas, imágenes decorativas con `alt="" aria-hidden`, portada con `alt` descriptivo.

---

## 6. Interaction Designer — Interacción y micro-interacciones

- 🟡 **Controles duplicados en el reproductor.** `LearnPage` ofrece flechas superpuestas sobre el video (`:200-219`, `z-10`) y botones Anterior/Siguiente debajo (`:237-269`): dos modelos para la misma acción; las flechas overlay pueden solaparse con los controles nativos del video.
- 🟡 **El `DropdownMenu` se cierra ante cualquier scroll/resize** (`DropdownMenu.tsx:92, 96-97`). En páginas con scroll, un desplazamiento mínimo hace desaparecer el menú: se siente frágil.
- 🟡 **`Modal` sin animación de entrada/salida.** Aparece de golpe, incoherente con las transiciones cuidadas del resto (colores, sidebar, progreso).
- 🟡 **Evaluación sin autoguardado ni guardia de salida.** Durante `taking`, las respuestas viven solo en estado; no hay "¿Seguro que quieres salir?" ni persistencia. Combinado con que no está en la URL → pérdida de datos fácil.
- 🟢 **Enroll hace `refetch` manual** tras la mutación (`CourseDetailPage.tsx:95-97`) en vez de actualizar la caché → petición extra y micro-retardo visible.
- 🟢 **Preview de hover en estrellas** no aplica en táctil (`StarRating`), aceptable porque el tap sí funciona.
- 🟢 **Fortalezas:** transiciones de color/hover consistentes, `aria-pressed` en "Vista ampliada", colapso de sidebar fluido, spinners de carga en botones (`isLoading`).

---

## Top 5 prioridades (síntesis transversal)

| # | Hallazgo | Roles que lo señalan | Sev. |
|---|----------|----------------------|------|
| 1 | Colores de estado no tematizados → rompe dark mode y el design system | UI, DS Architect, A11y | 🔴 |
| 2 | `Modal` sin focus-trap / foco inicial / retorno de foco | A11y, Interaction | 🔴 |
| 3 | Evaluación en estado local (sin URL, sin autosave, sin guardia de salida) | UX Architect, UX, Interaction | 🔴 |
| 4 | Navegación móvil aplana secciones + hueco de breakpoint md/lg | UX Architect | 🔴/🟡 |
| 5 | Falta primitiva `IconButton` y `Tabs`/`StarRating` con ARIA incompleto | DS Architect, A11y | 🟡 |

---

---

# Segunda pasada — Recorridos de INSTRUCTOR y ADMIN

**Fecha:** 2026-08-07
**Alcance:** Construcción de contenido (`CourseBuilderPage`, `ModuleCard`, `VideoManager`), evaluaciones (`EvaluationManagerPage`), administración (`UsersListPage`, `AuditLogPage`), dashboard de métricas (`AdminDashboard`), estudiantes por curso (`CourseStudentsPage`) y primitivas de encabezado/métrica (`PageHeader`, `StatCard`).

## 7. UX Architect — Arquitectura (instructor/admin)

- 🟡 **Dos patrones de encabezado conviven.** `CourseBuilderPage`, `EvaluationManagerPage`, `CourseStudentsPage` y `AuditLogPage` usan la primitiva `PageHeader`; pero `UsersListPage` (`:38-48`) y `CatalogPage` renderizan un `<header>` con `<h1>` a mano. Adopción incompleta de `PageHeader`.
- 🟡 **Reordenamiento manual por flechas, no drag-and-drop.** Módulos (`ModuleCard.tsx:87-106`) y clases se reordenan con botones ↑/↓. Aceptable, pero tedioso en listas largas y sin vista previa del resultado antes del round-trip.
- 🟢 **Modales anidados densos.** Cada `ModuleCard` monta 3 modales (editar / nueva clase / eliminar) replicados por módulo. Funciona (el `Modal` retorna `null` si está cerrado), pero es mucha lógica de estado local repetida por tarjeta.

## 8. UX Designer — Usabilidad (instructor/admin)

- 🔴 **Activar/Desactivar usuario sin confirmación.** En `UsersListPage.tsx:99-112` el toggle se ejecuta directo desde el `DropdownMenu`. Desactivar una cuenta es una acción sensible; el resto de acciones destructivas (eliminar módulo/clase/evaluación) sí tienen modal de confirmación. Inconsistencia de gravedad.
- 🟡 **Eliminar/Reemplazar video sin confirmación.** `VideoManager.tsx:86-95` borra o reemplaza de inmediato. Un reemplazo accidental implica volver a subir hasta 500 MB. Contrasta con la confirmación que sí tienen módulos y clases.
- 🟡 **Botón "Cancelar" muerto al crear evaluación.** `EvaluationManagerPage.tsx:76` pasa `onCancel={() => undefined}`: en modo creación el botón Cancelar del `EvaluationForm` no hace nada.
- 🟡 **Paginación divergente y sin total.** `UsersListPage.tsx:124-142` reimplementa la paginación inline ("Página {page}" sin total, "Siguiente" deshabilitado por heurística `users.length < PAGE_SIZE`) en vez de usar el componente `Pagination` que sí muestra "Página X de Y". Además, sin total el usuario no sabe cuántas páginas hay.
- 🟢 **Fortalezas:** confirmaciones destructivas consistentes en contenido, y excelente feedback de subida de video (porcentaje, estado "Procesando…", validación de tamaño, reemplazar/eliminar) en `VideoManager`.

## 9. UI / Visual Designer — Identidad (instructor/admin)

- 🟡 **`details` de auditoría en crudo.** `AuditLogPage.tsx:118-123` muestra `JSON.stringify(log.details)` en monoespaciado truncado. Para una UI de administración resulta técnico y poco legible; conviene un formato humano por tipo de acción.
- 🟢 **Color semántico inline reaparece.** `text-green-700` en `VideoManager.tsx:69` refuerza el hallazgo #3 (colores de estado no tematizados).
- 🟢 **Fortalezas:** tablas visualmente consistentes (thead gris, `hover:bg-gray-50`, `tabular-nums` en cifras), `StatCard` con acento oro correctamente reservado a certificados (`AdminDashboard.tsx:50-55`), y `hover:shadow-elevated` como micro-elevación coherente.

## 10. Design System Architect — Sistema (instructor/admin)

- 🟡 **No existe primitiva de tabla.** El marcado `<table>` + `<thead>` con las mismas clases se repite en `UsersListPage`, `CourseStudentsPage`, `AuditLogPage` y `AdminDashboard`. Falta un `Table`/`DataTable` compartido → riesgo de divergencia y coste de mantenimiento.
- 🟡 **Paginación duplicada** (componente `Pagination` vs. inline en `UsersListPage`): dos implementaciones del mismo patrón conviviendo.
- 🟡 **Algoritmo de reordenamiento duplicado.** El swap de IDs está copiado en `CourseBuilderPage.tsx:33-45` (`moveModule`) y `ModuleCard.tsx:61-70` (`moveLesson`). Debería ser un helper único.
- 🟢 **Confirma multi-badge:** coexisten `StatusBadge` (`AdminDashboard`) y `Badge` con tonos (`UsersList`, `AuditLog`). Unificar fuente de verdad.
- 🟢 **`PageHeader` y `StatCard` son primitivas sólidas**; el problema es de adopción, no de diseño.

## 11. Accessibility Designer — Accesibilidad (instructor/admin)

- 🟡 **Botones-ícono sin nombre accesible en `ModuleCard`.** Editar (`Pencil`) y Eliminar (`Trash2`) en `ModuleCard.tsx:107-122` no tienen `aria-label` ni texto; para lector de pantalla son botones sin nombre. Nótese que los de reordenar (↑/↓) sí lo tienen (`:93, :100`) — inconsistencia dentro del mismo componente.
- 🟡 **Tablas sin semántica completa.** Ninguna tabla (`UsersList`, `CourseStudents`, `AuditLog`, `AdminDashboard`) usa `<caption>` ni `scope="col"` en los `<th>`. Reduce la navegabilidad para lector de pantalla.
- 🟢 **Reconfirma:** `ProgressBar` en `CourseStudentsPage` y `EvaluationManagerPage` sigue sin `aria-label`/`aria-valuetext` contextual.
- 🟢 **Fortalezas:** `Select` de filtro con `aria-label` (`AuditLogPage.tsx:65`), flechas de reordenar etiquetadas, badges de estado con texto además de color.

## 12. Interaction Designer — Interacción (instructor/admin)

- 🟡 **Reordenar bloquea toda la lista y sin optimismo.** `reordering` se pasa a todas las tarjetas, deshabilitando los controles de todos los módulos durante la mutación (`CourseBuilderPage.tsx:92`); no hay reordenamiento optimista, así que el ítem "salta" tras el round-trip. Fricción notable al construir contenido.
- 🟢 **Fortalezas:** feedback de subida granular en `VideoManager`; `AuditLogPage.tsx:130` atenúa la paginación (`opacity-60`) durante `isFetching` como señal sutil de recarga; `key={lesson.updated_at}` fuerza refrescar el reproductor al reemplazar el video.

---

## Top prioridades — actualizado tras segunda pasada

| # | Hallazgo | Sev. |
|---|----------|------|
| 1 | Colores de estado no tematizados → rompe dark mode y el design system | 🔴 |
| 2 | `Modal` sin focus-trap / foco inicial / retorno de foco | 🔴 |
| 3 | Evaluación (estudiante) en estado local: sin URL, autosave ni guardia de salida | 🔴 |
| 4 | Activar/Desactivar usuario y eliminar/reemplazar video **sin confirmación** | 🔴 |
| 5 | Navegación móvil aplana secciones + hueco de breakpoint md/lg | 🔴/🟡 |
| 6 | Faltan primitivas transversales: `IconButton`, `Table`/`DataTable`; `Pagination` y `PageHeader` con adopción incompleta | 🟡 |
| 7 | Semántica ARIA incompleta: `Tabs`, `StarRating`, tablas (`scope`), botones-ícono sin nombre en `ModuleCard` | 🟡 |

---

---

# Tercera pasada — Formularios y dashboards restantes

**Fecha:** 2026-08-07
**Alcance:** `CourseForm` (con `CoverUploader`, `TopicListEditor`), `QuestionForm`, `MaterialsManager`, `ProfileForm`, `UserForm`, `TextArea`, y dashboards `StudentDashboard` / `InstructorDashboard`.

## 13. UX Architect — Arquitectura (formularios)

- 🔴 **`QuestionForm` rompe el patrón de formularios mandado.** El `frontend/CLAUDE.md` exige React Hook Form + Zod y "evitar validaciones manuales duplicadas". `QuestionForm.tsx` es el único formulario complejo hecho con `useState` manual y validación a mano (`:69-77`), además de un `<textarea>` construido a pelo (`:95-101`) en vez de la primitiva `TextArea`. Divergencia arquitectónica con el resto (Course/Profile/User sí usan RHF+Zod).
- 🟡 **Vocabulario de CTA de reanudación inconsistente entre superficies.** `StudentDashboard.tsx:99-102` solo distingue "Repasar/Continuar" (un curso al 0% dice "Continuar"), mientras `CourseDetailPage` distingue "Empezar/Continuar/Repasar". Mismo concepto, dos vocabularios.

## 14. UX Designer — Usabilidad (formularios)

- 🔴 **Sin guardia de cambios sin guardar (transversal).** Ningún formulario (`CourseForm`, `QuestionForm`, `ProfileForm`, `UserForm`) avisa al navegar/recargar con datos sin guardar. En el formulario de curso —largo, con portada y temario— esto es una pérdida de datos fácil.
- 🟡 **Errores de `QuestionForm` poco precisos.** La validación manual muestra un único `Alert` global al final (`:163`) en vez de marcar el campo concreto (enunciado / opción vacía), a diferencia del resto de formularios que resaltan el campo con `FieldError`.
- 🟡 **Eliminar material sin confirmación** (`MaterialsManager.tsx:185-195`), inmediato. Refuerza el patrón "acción destructiva sin confirmar" (aquí de menor riesgo por ser reversible re-subiendo).
- 🟢 **Fortalezas:** `CourseForm` es ejemplar (secciones con `FormSection`, `CoverUploader` con vista previa, validación de tipo/tamaño y limpieza de `object URL`, `TopicListEditor` con `useFieldArray` y botones etiquetados). `UserForm` explica bien la contraseña temporal (`:94-99`).

## 15. UI / Visual Designer — Identidad (formularios)

- 🟢 **Colores semánticos crudos reaparecen** en `MaterialsManager.tsx:31-35` (`text-green-600`, `text-blue-600` + tonos de `Badge`). Tercera confirmación del hallazgo #3.
- 🟢 **Iconos de red social genéricos.** `ProfileForm` usa `Briefcase`=LinkedIn, `Camera`=Instagram, `Video`=YouTube (limitación conocida de lucide v1.18 sin iconos de marca). Aceptable, pero el mapeo icono↔red no es evidente para el usuario.
- 🟢 **Fortaleza:** `FormSection` y el uso de `fieldset/legend` dan una jerarquía visual de formulario limpia y consistente.

## 16. Design System Architect — Sistema (formularios)

- 🟡 **Inputs nativos que saltan las primitivas.** `QuestionForm` reimplementa un `<textarea>` (existe `TextArea`) y `UserForm.tsx:107-111` usa `<input type="checkbox">` crudo aunque existe el componente `Checkbox` en `shared/components`. Reuso incompleto → estilos y accesibilidad divergentes.
- 🟡 **`InstructorDashboard` reconfirma la falta de primitiva de tabla** (mismo marcado repetido que Admin, hallazgo #10). `StudentDashboard`, en cambio, usa tarjetas: bien.
- 🟢 **Fortaleza:** `TextArea` es una primitiva sólida y simétrica con `Input` (label, `aria-invalid`, `FieldError`); el problema es de adopción, no de diseño.

## 17. Accessibility Designer — Accesibilidad (formularios)

- 🟢 **`ProfileForm` es el mejor ejemplo de a11y de formulario:** `fieldset`/`legend` para el grupo de redes, iconos decorativos con `aria-hidden`, y errores por campo.
- 🟡 **Inputs de URL sin `type="url"`** en `ProfileForm` (LinkedIn/Instagram/YouTube son `text`): se pierde validación e teclado adecuado en móvil.
- 🟡 **`QuestionForm`: el enunciado no asocia su error.** Al mostrarse solo como `Alert` global, el lector de pantalla no vincula el mensaje con el `<textarea>` (`aria-invalid`/`aria-describedby` ausentes). Los radios de "opción correcta" sí tienen `aria-label` — bien.
- 🟢 **Fortaleza:** botones de eliminar en `CourseForm`/`MaterialsManager` con `aria-label` descriptivo por ítem.

## 18. Interaction Designer — Interacción (formularios)

- 🟢 **Fortalezas:** `CoverUploader` da vista previa inmediata con `URL.createObjectURL` y libera memoria al desmontar/reemplazar; `MaterialsManager` y `VideoManager` dan estado de carga por acción (`isLoading` por ítem). Buen feedback granular.
- 🟢 **Cambio de tipo de pregunta** en `QuestionForm` resetea opciones a Verdadero/Falso de forma coherente (`:41-47`), aunque sin transición.

---

## Síntesis final — Prioridades consolidadas (3 pasadas)

| # | Hallazgo | Sev. |
|---|----------|------|
| 1 | Colores de estado no tematizados → rompe dark mode y el design system (confirmado en Alert, Badge, LearnPage, VideoManager, MaterialsManager) | 🔴 |
| 2 | `Modal` sin focus-trap / foco inicial / retorno de foco | 🔴 |
| 3 | Evaluación (estudiante) en estado local: sin URL, autosave ni guardia de salida | 🔴 |
| 4 | Acciones destructivas sin confirmación: desactivar usuario, eliminar/reemplazar video, eliminar material | 🔴 |
| 5 | **Sin guardia de cambios sin guardar** en todos los formularios | 🔴 |
| 6 | `QuestionForm` rompe el estándar RHF+Zod del proyecto (estado/validación manual, inputs nativos) | 🔴/🟡 |
| 7 | Navegación móvil aplana secciones + hueco de breakpoint md/lg | 🔴/🟡 |
| 8 | Faltan primitivas transversales (`IconButton`, `Table`/`DataTable`) y hay reuso incompleto de `Pagination`, `PageHeader`, `Checkbox`, `TextArea` | 🟡 |
| 9 | Semántica ARIA incompleta: `Tabs`, `StarRating`, tablas (`scope`/`caption`), botones-ícono sin nombre en `ModuleCard`, inputs `type="url"` | 🟡 |
| 10 | Inconsistencias de contenido/CTA (vocabulario de reanudación, `details` de auditoría en crudo) | 🟢 |

---

## Cobertura y pendientes

**Revisado en detalle (tres pasadas):**
- **Sistema/base:** `index.css`, `tailwind.config.js`, layouts (`DashboardLayout`, `AuthLayout`).
- **Primitivas:** `Button`, `Input`, `TextArea`, `Select`, `Modal`, `Alert`, `Badge`, `ProgressBar`, `StarRating`, `ThemeToggle`, `EmptyState`, `Pagination`, `Tabs`, `DropdownMenu`, `PageHeader`, `StatCard`.
- **Estudiante:** `LoginPage`, `CatalogPage`, `CourseDetailPage`, `LearnPage`, `EvaluationAttemptPage`, `AttemptQuestionCard`, `StudentDashboard`.
- **Instructor:** `CourseBuilderPage`, `ModuleCard`, `VideoManager`, `MaterialsManager`, `EvaluationManagerPage`, `QuestionForm`, `CourseStudentsPage`, `InstructorDashboard`, `ProfileForm`, `CourseForm`.
- **Admin:** `UsersListPage`, `UserForm`, `AuditLogPage`, `AdminDashboard`.

**Pendiente / fuera de alcance de esta auditoría estática:**
- Pantallas no abiertas: `CertificateVerifyPage`, `MyCertificatesPage`, `AdminCertificatesListPage`, `AdminRatingsListPage`, perfil público de instructor, `EnrollmentFormPage`, `PasswordReset*`.
- `VideoPlayer` (controles nativos/personalizados y subtítulos) y `Checkbox` en uso real.
- **Validación en navegador real (imprescindible):** responsividad móvil/tablet/desktop, contraste medido en modo oscuro (especialmente `Alert`/`Badge` de estado), y recorrido completo con teclado y lector de pantalla. Los hallazgos de contraste y foco de este documento provienen de lectura de código y deben confirmarse en ejecución.

---

# Validación de hallazgos (verificación vs. código)

**Fecha:** 2026-08-07
**Método:** Re-verificación de cada hallazgo contra el código, priorizando las afirmaciones de *ausencia* mediante búsqueda global. Veredictos: **Confirmado** / **Matizado** / **Descartado**.

## Verificaciones de ausencia ejecutadas

| Afirmación | Búsqueda | Resultado |
|---|---|---|
| Ningún formulario protege cambios sin guardar | `useBlocker\|beforeunload\|isDirty` | **0 coincidencias** → confirmado |
| No existen primitivas `IconButton`/`Table`/`DataTable` | glob de esos archivos | **No existen** → confirmado |
| Las tablas no tienen semántica de encabezado | `scope=` / `<caption` sobre 9 `<table>` | **0 coincidencias** → confirmado |
| No hay "saltar al contenido" | `sr-only\|skip-link\|Saltar al contenido` | Solo `sr-only` en `PasswordRequirements`; sin skip-link → confirmado |
| `role="status"` no se usa (solo `role="alert"`) | `role="status"` | **Sí existe** en `Spinner` → refuerza que `Alert` podría usarlo |
| La primitiva `Checkbox` no se reutiliza | `import.*Checkbox\|<Checkbox` | **Sí se usa** en `LessonForm` → matiza el hallazgo |

## Veredictos por hallazgo

| # | Hallazgo | Veredicto | Evidencia |
|---|----------|-----------|-----------|
| 1 | Colores de estado no tematizados | ✅ Confirmado | `tailwind.config.js` solo extiende `surface/card/gray/brand/gold`; `index.css .dark` solo redefine esas vars. `green/blue/amber` son paleta Tailwind por defecto → no invierten en oscuro. |
| 2 | `Modal` sin focus-trap / foco inicial / retorno | ✅ Confirmado | `Modal.tsx` solo escucha `Escape` (`:36-43`); no hay `focus()` de entrada, ni trampa, ni retorno al disparador. |
| 3 | Evaluación en estado local (sin URL/autosave/guardia) | ✅ Confirmado | `EvaluationAttemptPage.tsx:32` usa `useState<Mode>`; el intento no está en la ruta ni se persiste. |
| 4 | Acciones destructivas sin confirmación | ✅ Confirmado | Desactivar usuario (`UsersListPage.tsx:107`), eliminar/reemplazar video (`VideoManager.tsx:86-95`), eliminar material (`MaterialsManager.tsx:192`) llaman `mutate` directo. (Módulo/clase/evaluación **sí** confirman.) |
| 5 | Sin guardia de cambios sin guardar | ✅ Confirmado | Búsqueda global sin coincidencias de `useBlocker/beforeunload/isDirty`. |
| 6 | `QuestionForm` rompe el estándar RHF+Zod | ✅ Confirmado | `QuestionForm.tsx` usa `useState` + validación manual (`:69-77`) y `<textarea>` propio (`:95-101`). |
| 7 | Nav móvil aplana secciones + tablet sin sidebar | 🟠 Matizado | Aplanado **confirmado** (`DashboardLayout.tsx:108-130` mapea `items`, no `sections`). Lo de "hueco md/lg" es en realidad una **decisión deliberada**: en `md` la tablet hereda la nav horizontal móvil (no es un bug, es un tradeoff que sacrifica sidebar/breadcrumb). |
| 8a | Faltan primitivas `IconButton`/`Table` | ✅ Confirmado | No existen; el `<table>` está **duplicado en 9 archivos** (más de lo estimado inicialmente). |
| 8b | Reuso incompleto de `Pagination`/`PageHeader` | ✅ Confirmado | `Pagination` reimplementado inline en `UsersListPage`; `PageHeader` ausente en `UsersListPage`/`CatalogPage`. |
| 8c | La primitiva `Checkbox` se ignora | 🟠 Matizado | `LessonForm` **sí** usa `<Checkbox>`; solo `UserForm.tsx:107-111` usa input nativo → es inconsistencia puntual, no falta de adopción general. |
| 9 | ARIA incompleto (Tabs, StarRating, tablas, iconos) | ✅ Confirmado | 9 tablas sin `scope`/`caption`; `Tabs` sin flechas ni `tabpanel`; `StarRating` `radiogroup`+`<button>`; `ModuleCard.tsx:107-122` iconos sin `aria-label`; `ProfileForm` inputs sin `type="url"`. |
| 10 | Inconsistencias de contenido/CTA | ✅ Confirmado | `StudentDashboard.tsx:99-102` solo "Repasar/Continuar" (0% → "Continuar"); `AuditLogPage.tsx:122` muestra `JSON.stringify` crudo. |

### Hallazgos secundarios verificados

| Hallazgo | Veredicto | Evidencia |
|---|-----------|-----------|
| `role="alert"` siempre (incluso no urgente) | ✅ Confirmado | `Alert.tsx:37` fijo; `role="status"` ya disponible en el código. |
| Sin skip-link en layouts | ✅ Confirmado | Búsqueda sin resultados. |
| `Button` `secondary` ≡ `outline` | ✅ Confirmado | `Button.tsx:20-22` clases idénticas. |
| `DropdownMenu` se cierra al hacer scroll | ✅ Confirmado | `DropdownMenu.tsx:92,96-97`. |
| `ProgressBar` sin `aria-valuetext`/label | ✅ Confirmado | `ProgressBar.tsx:18-24`. |
| `EvaluationForm` `onCancel` vacío al crear | ✅ Confirmado | `EvaluationManagerPage.tsx:76`. |
| Reordenar bloquea toda la lista | ✅ Confirmado | `reordering` propagado a todas las `ModuleCard` (`CourseBuilderPage.tsx:92`). |

## Balance de la validación

- **Sin falsos positivos descartados:** los 10 hallazgos del Top se sostienen contra el código.
- **2 matices** (nº 7 tablet, nº 8c Checkbox) que **ajustan el alcance/severidad** sin invalidar el hallazgo.
- **2 hallazgos reforzados:** la duplicación de tablas es mayor (9 archivos), y `role="status"` ya existe en el proyecto (facilita corregir el nº "alert").
- **Pendiente de validación en ejecución (no verificable estáticamente):** medición real de contraste en modo oscuro y comportamiento de foco/lector de pantalla.

---

# Correcciones aplicadas (por prioridad)

**Fecha:** 2026-08-07
**Verificación:** `tsc -b --noEmit` ✅ · `eslint src` ✅ · `npm run build` ✅

| # | Prioridad | Estado | Cambios |
|---|-----------|--------|---------|
| 1 | Colores de estado no tematizados | ✅ Corregido | Variantes `dark:` en `Alert` (4 tonos) y `Badge` (soft/outline); verdes de éxito inline con `dark:` en `LearnPage`, `EvaluationAttemptPage`, `VideoManager`. |
| 2 | `Modal` sin gestión de foco | ✅ Corregido | Foco inicial en el diálogo, trampa de `Tab` (ciclo shift/tab), retorno de foco al disparador al cerrar, `aria-labelledby` al título y elevación con token `shadow-elevated`. |
| 3 | Evaluación en estado local | ✅ Corregido | Guardia de salida (SPA + recarga) mientras se rinde, confirmación al enviar con preguntas sin responder y **reanudación del intento en curso** (ver decisiones diferidas). |
| 4 | Acciones destructivas sin confirmación | ✅ Corregido | Nueva primitiva `ConfirmDialog`; cableada en desactivar usuario (`UsersListPage`), eliminar video (`VideoManager`) y eliminar material (`MaterialsManager`). |
| 5 | Sin guardia de cambios sin guardar | ✅ Corregido | `UnsavedChangesPrompt` (bloqueo SPA con `useBlocker` + aviso `beforeunload`) en `CourseForm`, `ProfileForm`, `UserForm` (ver decisiones diferidas). |
| 6 | `QuestionForm` fuera del estándar RHF+Zod | ✅ Corregido | Reescrito con React Hook Form + `useFieldArray` + nuevo `questionSchema` (Zod); usa la primitiva `TextArea`, errores por campo, `fieldset/legend`. Se elimina el estado y la validación manuales y el `<textarea>` crudo. |

**Piezas nuevas del sistema de diseño (aportan al hallazgo #8):**
- `shared/components/ConfirmDialog.tsx` — diálogo de confirmación reutilizable (Modal + pie estándar).
- `shared/components/UnsavedChangesPrompt.tsx` — bloqueo de navegación (SPA + recarga) con cambios sin guardar.
- `shared/lib/useUnsavedChangesGuard.ts` — aviso nativo de recarga/cierre, base del componente anterior.

**No abordado en esta ronda (prioridad media/baja, quedan en backlog):** primitivas `IconButton`/`Table`; ARIA de `Tabs`/`StarRating`; `scope`/`caption` en las 9 tablas; `aria-label` en botones-ícono de `ModuleCard`; adopción de `Pagination`/`PageHeader` en `UsersListPage`/`CatalogPage`; `type="url"` en `ProfileForm`; `role="status"` para `Alert` no urgentes; cierre de `DropdownMenu` al hacer scroll; vocabulario de CTA de reanudación; `details` de auditoría en crudo.

---

# Decisiones diferidas — resueltas

**Fecha:** 2026-08-07
**Verificación:** `tsc` ✅ · `eslint` ✅ · `npm run build` ✅

## D1 · Migración a data router (`createBrowserRouter`)

**Motivación:** habilitar `useBlocker` para bloquear la navegación interna (SPA) con cambios sin guardar (cierre completo de #3 y #5).

**Análisis de riesgo:** se verificó que **ningún provider usa hooks de router** (`AuthContext` y `ThemeContext` solo usan axios/localStorage; la redirección la hacen los guards). Por eso los providers pueden envolver al `RouterProvider` sin reestructurar. Los guards (`PrivateRoute`, `RoleRoute`) usan `Navigate/Outlet/useLocation`, compatibles con data router.

**Cambios:**
- `AppRoutes.tsx` → exporta `router = createBrowserRouter(createRoutesFromElements(...))` con el mismo árbol de rutas.
- `App.tsx` → `<RouterProvider router={router} />`.
- `providers.tsx` → se elimina `<BrowserRouter>`; `Theme`/`Auth` envuelven al router.
- Nuevo `UnsavedChangesPrompt` (useBlocker + diálogo + `beforeunload`), adoptado en los 3 formularios de página y en el intento de evaluación.

**Pendiente de validar en ejecución:** recorrido real de rutas y redirecciones (login, roles, onboarding de contraseña) en navegador.

## D2 · Reanudar intento de evaluación en curso

**Hallazgo:** **no requería backend.** `EvaluationService.start_attempt` (`backend/.../evaluations/service.py:349-355`) ya detecta un intento `IN_PROGRESS` y lo **reanuda sin consumir un intento nuevo**, devolviendo sus preguntas fijadas; `_build_attempt_detail` siempre incluye `questions`. El defecto era solo de frontend (no se rehidrataba el intento).

**Cambios (solo `EvaluationAttemptPage`):**
- Se detecta el intento `IN_PROGRESS` desde `list_my_attempts`.
- `canStart` permite reanudar aunque no queden intentos disponibles (reanudar no consume).
- El botón cambia a **"Reanudar intento"** y aparece un aviso informativo; en la lista de intentos previos el intento en curso muestra un badge **"En curso"** (antes se pintaba erróneamente como "No aprobado").
- Junto con el bloqueo de salida de D1, se reduce la pérdida accidental del intento.

**Limitación honesta:** las respuestas seleccionadas **no** se persisten por-respuesta en el backend (el envío es atómico), así que al reanudar el estudiante ve las mismas preguntas pero debe volver a seleccionar. Persistir respuestas parciales sí requeriría un endpoint nuevo; se deja como mejora futura opcional, no como defecto bloqueante.

---

# Ronda de accesibilidad (quick wins)

**Fecha:** 2026-08-07
**Verificación:** `tsc` ✅ · `eslint` ✅ · `npm run build` ✅

| Hallazgo | Estado | Cambio |
|---|--------|--------|
| `Alert` siempre `role="alert"` | ✅ Corregido | `role` derivado del tono: `error`/`warning` → `alert` (assertive); `success`/`info` → `status` (polite). Sin tocar call sites. |
| Botones-ícono sin nombre en `ModuleCard` | ✅ Corregido | `aria-label` en editar/eliminar módulo + iconos `aria-hidden`. |
| `ProfileForm` inputs sin `type="url"` | ✅ Corregido | `type="url"` + `inputMode="url"` en LinkedIn/Instagram/YouTube. |
| `ProgressBar` sin `aria-valuetext` | ✅ Corregido | `aria-valuetext="{n}% completado"`. |
| Falta skip-link | ✅ Corregido | Enlace "Saltar al contenido" en `DashboardLayout` + `id="main-content"` en `<main>`. |
| Tablas sin `scope` | ✅ Corregido | `scope="col"` en los `<th>` de las **9 tablas**. |

**Pendiente aún en accesibilidad (no eran quick wins):**
- `<caption>` (sr-only) en las tablas — se aplicó `scope` pero no el `caption` nombrando cada tabla.
- `Tabs`: navegación por flechas + `aria-controls`/`role="tabpanel"`.
- `StarRating`: `role="radio"`/`aria-checked` (hoy `radiogroup` con `<button>`).

**Backlog restante (medio/bajo):** primitivas `IconButton`/`Table`; adopción de `Pagination`/`PageHeader` en `UsersListPage`/`CatalogPage`; `UserForm` con checkbox nativo (existe `Checkbox`); cierre de `DropdownMenu` al hacer scroll; `Modal` sin animación; vocabulario de CTA de reanudación; `details` de auditoría en crudo; `EvaluationForm` "Cancelar" muerto al crear; reordenar módulos sin optimismo. Más pantallas sin auditar (certificados, matrículas, auth, `VideoPlayer`) y la validación en navegador (responsive, contraste dark, teclado/lector).
