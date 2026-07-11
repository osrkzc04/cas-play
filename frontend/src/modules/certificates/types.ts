export interface Certificate {
  id: string;
  code: string;
  course_id: string;
  course_title: string;
  student_name: string;
  final_score: number;
  issued_at: string;
  pdf_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateEligibility {
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  final_score: number | null;
  passing_score: number;
  has_evaluation: boolean;
  is_eligible: boolean;
  already_issued: boolean;
  reason: string | null;
}

// Un curso se considera "finalizado" cuando el estudiante completó todo el
// contenido (100%) y aprobó la evaluación final. Un certificado ya emitido
// implica evaluación aprobada, por lo que también cuenta como aprobada.
export function isCourseFinished(eligibility: CertificateEligibility): boolean {
  const passedFinalExam =
    eligibility.final_score !== null &&
    eligibility.final_score >= eligibility.passing_score;
  return (
    eligibility.progress_percentage >= 100 &&
    (passedFinalExam || eligibility.already_issued)
  );
}

export interface CertificateVerification {
  is_valid: boolean;
  code: string;
  student_name: string;
  course_title: string;
  issued_at: string;
}
