import type { Course } from "@/modules/courses/types";
import type { ManagedUser } from "@/modules/users/types";

export interface EnrollmentStatus {
  is_enrolled: boolean;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
  updated_at: string;
}

export interface EnrolledCourse {
  id: string;
  created_at: string;
  course: Course;
}

export interface AdminEnrollmentItem {
  id: string;
  created_at: string;
  student: ManagedUser;
  course: Course;
}

export interface AdminEnrollmentPayload {
  course_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface AdminEnrollmentResult {
  enrollment: Enrollment;
  user: ManagedUser;
  user_created: boolean;
}

export interface UserLookup {
  exists: boolean;
  user: ManagedUser | null;
}
