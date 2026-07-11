export interface LessonProgress {
  lesson_id: string;
  last_second: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface CourseProgress {
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  percentage: number;
  last_lesson_id: string | null;
  lessons: LessonProgress[];
}
