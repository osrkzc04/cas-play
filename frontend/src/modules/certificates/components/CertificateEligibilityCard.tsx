import { Link } from "react-router-dom";
import { Award, Download } from "lucide-react";

import { Alert, Button, Card, ProgressBar } from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import type { Role } from "@/shared/auth/types";
import {
  useCertificateEligibility,
  useIssueCertificate,
} from "../hooks/useCertificates";

interface CertificateEligibilityCardProps {
  courseId: string;
  role: Role | undefined;
  enabled: boolean;
}

export function CertificateEligibilityCard({
  courseId,
  role,
  enabled,
}: CertificateEligibilityCardProps) {
  const { data: eligibility, isLoading } = useCertificateEligibility(
    courseId,
    role,
    enabled,
  );
  const issue = useIssueCertificate(courseId);

  if (!enabled || isLoading || !eligibility) {
    return null;
  }

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-gold-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-800">
          Certificado del curso
        </h3>
      </div>

      <div className="space-y-1">
        <ProgressBar value={eligibility.progress_percentage} showValue />
        <p className="text-xs text-gray-500">
          {eligibility.completed_lessons} de {eligibility.total_lessons} clases
          completadas
          {eligibility.final_score !== null &&
            ` · Evaluación final ${eligibility.final_score.toFixed(1)}/10`}
        </p>
      </div>

      {issue.isError && (
        <Alert tone="error">{getApiErrorMessage(issue.error)}</Alert>
      )}

      {eligibility.already_issued ? (
        <Link to="/dashboard/certificates">
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Ver mi certificado
          </Button>
        </Link>
      ) : eligibility.is_eligible ? (
        <Button
          className="w-full"
          onClick={() => issue.mutate()}
          isLoading={issue.isPending}
        >
          Emitir certificado
        </Button>
      ) : (
        <p className="text-xs text-gray-500">
          {eligibility.reason ??
            "Aprueba la evaluación final del curso para obtener tu certificado."}
        </p>
      )}
    </Card>
  );
}
