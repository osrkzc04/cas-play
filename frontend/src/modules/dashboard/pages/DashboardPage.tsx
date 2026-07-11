import { PageHeader } from "@/shared/components";
import { useAuth } from "@/shared/auth/useAuth";
import { roleLabels } from "@/shared/auth/roles";
import { AdminDashboard } from "@/modules/metrics/components/AdminDashboard";
import { InstructorDashboard } from "@/modules/metrics/components/InstructorDashboard";
import { StudentDashboard } from "@/modules/metrics/components/StudentDashboard";

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={roleLabels[user.role]}
        title={`Hola, ${user.first_name}`}
      />

      {user.role === "ADMIN" && <AdminDashboard />}
      {user.role === "INSTRUCTOR" && <InstructorDashboard />}
      {user.role === "STUDENT" && <StudentDashboard />}
    </section>
  );
}
