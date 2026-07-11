import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { Alert } from "@/shared/components/Alert";
import { Card } from "@/shared/components/Card";
import { PageLoader } from "@/shared/components/PageLoader";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { CourseForm } from "../components/CourseForm";
import {
  courseKeys,
  useCreateCourse,
  useManagedCourse,
  useUpdateCourse,
} from "../hooks/useCourses";
import { courseService } from "../services/courseService";
import type { CourseFormValues } from "../schemas/courseSchema";
import type {
  CourseInfoPayload,
  CourseTopicItemPayload,
  CourseLevel,
} from "../types";

function emptyToNull(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildInfoPayload(values: CourseFormValues): CourseInfoPayload {
  return {
    summary: emptyToNull(values.summary),
    description: emptyToNull(values.description),
    level: values.level ? (values.level as CourseLevel) : null,
    duration_hours:
      values.duration_hours === "" || values.duration_hours === undefined
        ? null
        : Number(values.duration_hours),
    requirements: emptyToNull(values.requirements),
    target_audience: emptyToNull(values.target_audience),
  };
}

function buildTopicItems(values: CourseFormValues): CourseTopicItemPayload[] {
  return values.topics
    .map((item) => item.content.trim())
    .filter((content) => content.length > 0)
    .map((content) => ({ content }));
}

export function CourseFormPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const isEdit = Boolean(courseId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const courseQuery = useManagedCourse(courseId);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(courseId ?? "");

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (
    values: CourseFormValues,
    coverFile: File | null,
  ) => {
    setSubmitError(null);
    setSaving(true);

    try {
      const info = buildInfoPayload(values);
      const course = isEdit
        ? await updateCourse.mutateAsync({ title: values.title, ...info })
        : await createCourse.mutateAsync({ title: values.title, ...info });

      if (coverFile) {
        await courseService.uploadCover(course.id, coverFile);
      }

      await courseService.replaceTopics(course.id, {
        items: buildTopicItems(values),
      });

      queryClient.invalidateQueries({ queryKey: courseKeys.all });

      // Tras crear, el instructor pasa al builder para armar el contenido
      // (módulos → clases → video + materiales).
      navigate(
        isEdit
          ? "/dashboard/courses"
          : `/dashboard/courses/${course.id}/content`,
      );
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && courseQuery.isLoading) {
    return <PageLoader />;
  }

  if (isEdit && (courseQuery.isError || !courseQuery.data)) {
    return <Alert tone="error">{getApiErrorMessage(courseQuery.error)}</Alert>;
  }

  const course = courseQuery.data;
  const topics = (course?.topics ?? []).map((topic) => ({
    content: topic.content,
  }));

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Editar curso" : "Nuevo curso"}
        </h1>
        <p className="text-sm text-gray-500">
          {isEdit
            ? "Actualiza la información del curso."
            : "Al guardar, continuarás al contenido para agregar módulos, clases, videos y materiales. El curso queda en borrador hasta publicarlo."}
        </p>
      </header>

      {submitError && <Alert tone="error">{submitError}</Alert>}

      <Card className="p-6">
        <CourseForm
          defaultValues={{
            title: course?.title,
            summary: course?.summary ?? "",
            description: course?.description ?? "",
            level: course?.level ?? "",
            duration_hours: course?.duration_hours ?? "",
            requirements: course?.requirements ?? "",
            target_audience: course?.target_audience ?? "",
            topics,
          }}
          currentCoverUrl={course?.cover_image_url ?? null}
          isSubmitting={saving}
          submitLabel={isEdit ? "Guardar cambios" : "Crear curso"}
          onSubmit={handleSubmit}
        />
      </Card>
    </section>
  );
}
