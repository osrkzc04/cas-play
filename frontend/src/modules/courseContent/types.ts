export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  is_preview: boolean;
  position: number;
  has_video: boolean;
  material_count: number;
  created_at: string;
  updated_at: string;
}

export type MaterialType = "PDF" | "IMAGE" | "OFFICE";

export interface Material {
  id: string;
  lesson_id: string;
  original_name: string;
  material_type: MaterialType;
  created_at: string;
  updated_at: string;
}

export interface ModulePayload {
  title: string;
  description?: string | null;
}

export interface LessonPayload {
  title: string;
  description?: string | null;
  is_preview: boolean;
}
