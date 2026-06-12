import { Badge } from "@/shared/components/Badge";
import { courseStatusMeta } from "../courseStatus";
import type { CourseStatus } from "../types";

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const meta = courseStatusMeta[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
