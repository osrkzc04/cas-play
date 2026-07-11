import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClipboardList, Layers, Plus } from "lucide-react";

import {
  Alert,
  Button,
  EmptyState,
  Modal,
  PageHeader,
  PageLoader,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useManagedCourse } from "@/modules/courses/hooks/useCourses";
import {
  useCreateModule,
  useModules,
  useReorderModules,
} from "../hooks/useModules";
import { ModuleForm } from "../components/ModuleForm";
import { ModuleCard } from "../components/ModuleCard";

export function CourseBuilderPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ?? "";
  const [adding, setAdding] = useState(false);

  const courseQuery = useManagedCourse(id);
  const { data: modules, isLoading, isError, error } = useModules(id);
  const createModule = useCreateModule(id);
  const reorderModules = useReorderModules(id);

  const moveModule = (moduleId: string, direction: -1 | 1) => {
    if (!modules) {
      return;
    }
    const ids = modules.map((m) => m.id);
    const i = ids.indexOf(moduleId);
    const j = i + direction;
    if (j < 0 || j >= ids.length) {
      return;
    }
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorderModules.mutate(ids);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Contenido del curso"
        title={courseQuery.data?.title ?? "Cargando…"}
        description="Organiza los módulos y las clases del curso."
        actions={
          <div className="flex gap-2">
            <Link to="/dashboard/courses">
              <Button variant="secondary">Volver</Button>
            </Link>
            <Link to={`/dashboard/courses/${id}/evaluation`}>
              <Button variant="secondary">
                <ClipboardList className="h-4 w-4" />
                Evaluación final
              </Button>
            </Link>
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Agregar módulo
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
      ) : !modules || modules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Este curso aún no tiene módulos"
          description="Crea el primer módulo para comenzar a estructurar el contenido."
          action={<Button onClick={() => setAdding(true)}>Agregar módulo</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={index}
              total={modules.length}
              onMove={moveModule}
              reordering={reorderModules.isPending}
            />
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Nuevo módulo">
        <ModuleForm
          isSubmitting={createModule.isPending}
          submitLabel="Crear módulo"
          onCancel={() => setAdding(false)}
          onSubmit={(values) =>
            createModule.mutate(values, { onSuccess: () => setAdding(false) })
          }
        />
      </Modal>
    </section>
  );
}
