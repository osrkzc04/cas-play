import { Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout } from "@/shared/layouts/AuthLayout";
import { PublicLayout } from "@/shared/layouts/PublicLayout";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { ForbiddenPage } from "@/shared/pages/ForbiddenPage";
import { NotFoundPage } from "@/shared/pages/NotFoundPage";
import { STAFF_ROLES } from "@/shared/auth/roles";
import { PrivateRoute } from "./PrivateRoute";
import { RoleRoute } from "./RoleRoute";

import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { PasswordResetRequestPage } from "@/modules/auth/pages/PasswordResetRequestPage";
import { PasswordResetConfirmPage } from "@/modules/auth/pages/PasswordResetConfirmPage";
import { CatalogPage } from "@/modules/courses/pages/CatalogPage";
import { CourseDetailPage } from "@/modules/courses/pages/CourseDetailPage";
import { ManageCoursesPage } from "@/modules/courses/pages/ManageCoursesPage";
import { CourseFormPage } from "@/modules/courses/pages/CourseFormPage";
import { UsersListPage } from "@/modules/users/pages/UsersListPage";
import { UserFormPage } from "@/modules/users/pages/UserFormPage";
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Public catalog */}
      <Route element={<PublicLayout />}>
        <Route index element={<Navigate to="/courses" replace />} />
        <Route path="/courses" element={<CatalogPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        <Route
          path="/password-reset/confirm"
          element={<PasswordResetConfirmPage />}
        />
      </Route>

      {/* Private area */}
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

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
          </Route>

          <Route element={<RoleRoute roles={["ADMIN"]} />}>
            <Route path="/dashboard/users" element={<UsersListPage />} />
            <Route path="/dashboard/users/new" element={<UserFormPage />} />
            <Route
              path="/dashboard/users/:userId/edit"
              element={<UserFormPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
