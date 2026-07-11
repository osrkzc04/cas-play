export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE";

export interface AnswerOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  statement: string;
  question_type: QuestionType;
  options: AnswerOption[];
}

export interface Evaluation {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  question_count: number;
  is_ready: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvaluationDetail extends Evaluation {
  questions: Question[];
}

export interface EvaluationPayload {
  title: string;
  description?: string | null;
}

export interface OptionPayload {
  text: string;
  is_correct: boolean;
}

export interface QuestionPayload {
  statement: string;
  question_type: QuestionType;
  options: OptionPayload[];
}

// El banco debe alcanzar 20 preguntas para que la evaluación quede lista (BR-021).
export const QUESTION_BANK_SIZE = 20;

// Cada intento presenta 10 preguntas aleatorias; máximo 2 intentos (BR-022/023).
export const QUESTIONS_PER_ATTEMPT = 10;
export const MAX_ATTEMPTS = 2;
export const PASSING_SCORE = 7;

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED";

export interface OptionPublic {
  id: string;
  text: string;
}

export interface QuestionPublic {
  id: string;
  statement: string;
  question_type: QuestionType;
  options: OptionPublic[];
}

export interface AnswerResult {
  question_id: string;
  selected_option_id: string | null;
  correct_option_id: string;
  is_correct: boolean;
}

export interface AttemptDetail {
  id: string;
  evaluation_id: string;
  attempt_number: number;
  status: AttemptStatus;
  score: number | null;
  passed: boolean | null;
  total_questions: number;
  correct_count: number | null;
  questions: QuestionPublic[];
  answers: AnswerResult[];
}

export interface AttemptSummary {
  id: string;
  attempt_number: number;
  status: AttemptStatus;
  score: number | null;
  passed: boolean | null;
  created_at: string;
  submitted_at: string | null;
}

export interface AttemptAnswerInput {
  question_id: string;
  selected_option_id: string | null;
}
