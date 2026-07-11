import type { CourseStatus } from "@/shared/components";

export interface UserCounts {
  total: number;
  admins: number;
  instructors: number;
  students: number;
  active: number;
}

export interface CourseStatusCounts {
  total: number;
  draft: number;
  published: number;
  hidden: number;
  finished: number;
}

export interface AdminCourseRow {
  course_id: string;
  title: string;
  status: CourseStatus;
  enrollments: number;
  certificates: number;
  average_rating: number | null;
}

export interface AdminMetrics {
  users: UserCounts;
  courses: CourseStatusCounts;
  enrollments_total: number;
  certificates_total: number;
  top_courses: AdminCourseRow[];
}

export interface InstructorCourseRow {
  course_id: string;
  title: string;
  status: CourseStatus;
  enrollments: number;
  certificates: number;
  ratings_count: number;
  average_rating: number | null;
}

export interface InstructorMetrics {
  courses: CourseStatusCounts;
  enrollments_total: number;
  certificates_total: number;
  ratings_total: number;
  average_rating: number | null;
  courses_breakdown: InstructorCourseRow[];
}

export interface StudentCourseRow {
  course_id: string;
  title: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  has_certificate: boolean;
}

export interface StudentMetrics {
  enrolled_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  certificates_earned: number;
  courses_breakdown: StudentCourseRow[];
}
