import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router-dom";

import { AuthLayout } from "@/shared/layouts/AuthLayout";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { ForbiddenPage } from "@/shared/pages/ForbiddenPage";
import { NotFoundPage } from "@/shared/pages/NotFoundPage";
import { STAFF_ROLES } from "@/shared/auth/roles";
import { PrivateRoute } from "./PrivateRoute";
import { RoleRoute } from "./RoleRoute";

import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { PasswordResetRequestPage } from "@/modules/auth/pages/PasswordResetRequestPage";
import { PasswordResetConfirmPage } from "@/modules/auth/pages/PasswordResetConfirmPage";
import { ChangePasswordPage } from "@/modules/auth/pages/ChangePasswordPage";
import { CatalogPage } from "@/modules/courses/pages/CatalogPage";
import { CourseDetailPage } from "@/modules/courses/pages/CourseDetailPage";
import { ManageCoursesPage } from "@/modules/courses/pages/ManageCoursesPage";
import { CourseFormPage } from "@/modules/courses/pages/CourseFormPage";
import { CourseStudentsPage } from "@/modules/courses/pages/CourseStudentsPage";
import { CourseBuilderPage } from "@/modules/courseContent/pages/CourseBuilderPage";
import { EvaluationManagerPage } from "@/modules/evaluations/pages/EvaluationManagerPage";
import { UsersListPage } from "@/modules/users/pages/UsersListPage";
import { UserFormPage } from "@/modules/users/pages/UserFormPage";
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";
import { AuditLogPage } from "@/modules/audit/pages/AuditLogPage";
import { StyleGuidePage } from "@/modules/styleguide/pages/StyleGuidePage";
import { LearnPage } from "@/modules/learning/pages/LearnPage";
import { EvaluationAttemptPage } from "@/modules/evaluations/pages/EvaluationAttemptPage";
import { MyCoursesPage } from "@/modules/enrollments/pages/MyCoursesPage";
import { EnrollmentsListPage } from "@/modules/enrollments/pages/EnrollmentsListPage";
import { EnrollmentFormPage } from "@/modules/enrollments/pages/EnrollmentFormPage";
import { MyCertificatesPage } from "@/modules/certificates/pages/MyCertificatesPage";
import { CertificateVerifyPage } from "@/modules/certificates/pages/CertificateVerifyPage";
import { AdminCertificatesListPage } from "@/modules/certificates/pages/AdminCertificatesListPage";
import { AdminRatingsListPage } from "@/modules/ratings/pages/AdminRatingsListPage";
import { InstructorProfilePage } from "@/modules/instructor-profile/pages/InstructorProfilePage";

// Data router (createBrowserRouter): habilita `useBlocker` para bloquear la
// navegación interna con cambios sin guardar (ver UnsavedChangesPrompt).
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* La página comercial es externa: dentro del app todo exige login.
          La raíz lleva al dashboard; si no hay sesión, PrivateRoute deriva al login. */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Login: layout propio a dos columnas (panel de marca + formulario) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Resto de auth: tarjeta centrada compartida */}
      <Route element={<AuthLayout />}>
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        <Route
          path="/password-reset/confirm"
          element={<PasswordResetConfirmPage />}
        />
      </Route>

      {/* Private area */}
      <Route element={<PrivateRoute />}>
        {/* Cambio de contraseña obligatorio (onboarding); pantalla completa */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Experiencia de aprendizaje del estudiante (pantalla completa) */}
        <Route element={<RoleRoute roles={["STUDENT"]} />}>
          <Route
            path="/courses/:courseId/learn/:lessonId"
            element={<LearnPage />}
          />
          <Route
            path="/courses/:courseId/exam"
            element={<EvaluationAttemptPage />}
          />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Catálogo dentro del shell de la app (mismo formato para todos los roles) */}
          <Route path="/courses" element={<CatalogPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />

          <Route element={<RoleRoute roles={["STUDENT"]} />}>
            <Route path="/dashboard/my-courses" element={<MyCoursesPage />} />
            <Route
              path="/dashboard/certificates"
              element={<MyCertificatesPage />}
            />
          </Route>

          <Route element={<RoleRoute roles={["INSTRUCTOR"]} />}>
            <Route
              path="/dashboard/profile"
              element={<InstructorProfilePage />}
            />
          </Route>

          <Route element={<RoleRoute roles={STAFF_ROLES} />}>
            <Route
              path="/dashboard/courses"
              element={<ManageCoursesPage />}
            />
            <Route
              path="/dashboard/courses/new"
              element={<CourseFormPage />}
            />
            <Route
              path="/dashboard/courses/:courseId/edit"
              element={<CourseFormPage />}
            />
            <Route
              path="/dashboard/courses/:courseId/content"
              element={<CourseBuilderPage />}
            />
            <Route
              path="/dashboard/courses/:courseId/students"
              element={<CourseStudentsPage />}
            />
            <Route
              path="/dashboard/courses/:courseId/evaluation"
              element={<EvaluationManagerPage />}
            />
          </Route>

          <Route element={<RoleRoute roles={["ADMIN"]} />}>
            <Route
              path="/dashboard/enrollments"
              element={<EnrollmentsListPage />}
            />
            <Route
              path="/dashboard/enrollments/new"
              element={<EnrollmentFormPage />}
            />
            <Route path="/dashboard/users" element={<UsersListPage />} />
            <Route path="/dashboard/users/new" element={<UserFormPage />} />
            <Route
              path="/dashboard/users/:userId/edit"
              element={<UserFormPage />}
            />
            <Route
              path="/dashboard/issued-certificates"
              element={<AdminCertificatesListPage />}
            />
            <Route
              path="/dashboard/ratings"
              element={<AdminRatingsListPage />}
            />
            <Route path="/dashboard/audit" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>

      {/* Validación pública de certificados (sin sesión) */}
      <Route path="/verify/:code" element={<CertificateVerifyPage />} />

      {/* Guía de estilo del sistema de diseño (referencia del equipo) */}
      <Route path="/style-guide" element={<StyleGuidePage />} />

      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);
