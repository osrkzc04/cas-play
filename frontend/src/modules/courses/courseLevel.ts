import type { CourseLevel } from "./types";

export const courseLevelLabels: Record<CourseLevel, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

export const courseLevelOptions = (
  Object.keys(courseLevelLabels) as CourseLevel[]
).map((level) => ({
  value: level,
  label: courseLevelLabels[level],
}));
