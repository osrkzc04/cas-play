export interface CurriculumLesson {
  id: string;
  title: string;
  description: string | null;
  position: number;
  is_preview: boolean;
  has_video: boolean;
}

export interface CurriculumEvaluation {
  id: string;
  title: string;
  question_count: number;
  is_ready: boolean;
}

export interface CurriculumModule {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: CurriculumLesson[];
}

export interface Curriculum {
  course_id: string;
  modules: CurriculumModule[];
  final_evaluation: CurriculumEvaluation | null;
}
