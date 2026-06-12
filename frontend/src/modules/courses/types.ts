export type CourseStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "FINISHED";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateCoursePayload {
  title: string;
  description?: string | null;
  instructor_id?: string | null;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string | null;
  instructor_id?: string | null;
}

export type CourseStatusAction = "publish" | "hide" | "finish";
