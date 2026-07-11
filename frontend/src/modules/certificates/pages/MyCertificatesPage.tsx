import { useState } from "react";
import { Award, Download } from "lucide-react";

import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  Spinner,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { formatDate } from "@/shared/lib/format";
import {
  useDownloadCertificate,
  useMyCertificates,
} from "../hooks/useCertificates";
import type { Certificate } from "../types";

const PAGE_SIZE = 10;

export function MyCertificatesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useMyCertificates(page, PAGE_SIZE);
  const download = useDownloadCertificate();

  const certificates = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis certificados"
        description="Descarga los certificados de los cursos que has completado."
      />

      {download.isError && (
        <Alert tone="error">{getApiErrorMessage(download.error)}</Alert>
      )}

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
      ) : certificates.length === 0 ? (
        <EmptyState
          title="Aún no tienes certificados"
          description="Completa un curso y aprueba sus evaluaciones para obtener tu certificado."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {certificates.map((certificate: Certificate) => (
              <li key={certificate.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <Award
                      className="h-8 w-8 shrink-0 text-gold-500"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {certificate.course_title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Código {certificate.code} · Emitido el{" "}
                        {formatDate(certificate.issued_at)} · Evaluación final{" "}
                        {certificate.final_score.toFixed(1)}/10
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    isLoading={
                      download.isPending &&
                      download.variables?.id === certificate.id
                    }
                    onClick={() => download.mutate(certificate)}
                  >
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                    Descargar PDF
                  </Button>
                </Card>
              </li>
            ))}
          </ul>

          {data && (
            <Pagination
              page={page}
              pages={data.pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
