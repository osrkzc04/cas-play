export type CourseStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "FINISHED";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface CourseTopic {
  id: string;
  course_id: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  level: CourseLevel | null;
  cover_image_url: string | null;
  duration_hours: number | null;
  requirements: string | null;
  target_audience: string | null;
  instructor_id: string;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends Course {
  topics: CourseTopic[];
}

export interface CourseInfoPayload {
  summary?: string | null;
  description?: string | null;
  level?: CourseLevel | null;
  duration_hours?: number | null;
  requirements?: string | null;
  target_audience?: string | null;
}

export interface CreateCoursePayload extends CourseInfoPayload {
  title: string;
  instructor_id?: string | null;
}

export interface UpdateCoursePayload extends CourseInfoPayload {
  title?: string;
  instructor_id?: string | null;
}

export interface CourseTopicItemPayload {
  content: string;
}

export interface ReplaceTopicsPayload {
  items: CourseTopicItemPayload[];
}

export interface CourseStudent {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  enrolled_at: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
}

export type CourseStatusAction = "publish" | "hide" | "finish";
