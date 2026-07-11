import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";

import { Card, PageLoader } from "@/shared/components";
import { formatDate } from "@/shared/lib/format";
import { Brand } from "@/shared/layouts/Brand";
import { certificateService } from "../services/certificateService";

export function CertificateVerifyPage() {
  const { code } = useParams<{ code: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["certificate-verify", code],
    queryFn: () => certificateService.verify(code as string),
    enabled: Boolean(code),
    retry: false,
  });

  const isValid = !isError && data?.is_valid;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md space-y-5 p-8 text-center">
        <div className="flex justify-center">
          <Brand />
        </div>

        {isLoading ? (
          <PageLoader />
        ) : isValid && data ? (
          <>
            <CheckCircle2
              className="mx-auto h-14 w-14 text-green-600"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900">
                Certificado válido
              </h1>
              <p className="text-gray-600">{data.student_name}</p>
              <p className="text-sm text-gray-500">
                completó el curso <strong>{data.course_title}</strong>
              </p>
              <p className="text-xs text-gray-400">
                Emitido el {formatDate(data.issued_at)} · Código {data.code}
              </p>
            </div>
          </>
        ) : (
          <>
            <XCircle
              className="mx-auto h-14 w-14 text-brand-600"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900">
                Certificado no válido
              </h1>
              <p className="text-sm text-gray-500">
                No encontramos un certificado con el código{" "}
                <strong>{code}</strong>.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
