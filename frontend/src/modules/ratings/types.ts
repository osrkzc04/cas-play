// Avance mínimo del curso para habilitar la valoración (BR-031).
export const RATING_MIN_PROGRESS = 90;

export interface RatingSummary {
  course_id: string;
  average: number | null;
  total: number;
}

export interface PublicRating {
  id: string;
  score: number;
  comment: string | null;
  student_name: string;
  created_at: string;
}

export interface Rating {
  id: string;
  course_id: string;
  user_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface RatingPayload {
  score: number;
  comment?: string | null;
}

export interface AdminRating {
  id: string;
  course_id: string;
  course_title: string;
  student_name: string;
  score: number;
  comment: string | null;
  created_at: string;
}
