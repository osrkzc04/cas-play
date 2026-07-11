import uuid

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.modules.certificates.dependencies import require_admin, require_student
from app.modules.certificates.schemas import (
    CertificateEligibilityResponse,
    CertificateResponse,
    CertificateVerificationResponse,
)
from app.modules.certificates.service import CertificateService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.pagination import PaginatedResponse
from app.shared.storage import resolve_path


router = APIRouter(tags=["Certificates"])


# --------------------------------------------------------------------------- #
# Emisión y elegibilidad (STUDENT)
# --------------------------------------------------------------------------- #

@router.get(
    "/courses/{course_id}/certificate/eligibility",
    response_model=CertificateEligibilityResponse,
)
def get_certificate_eligibility(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = CertificateService(db)
    return service.get_eligibility(course_id, current_user)


@router.post(
    "/courses/{course_id}/certificate",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
)
def issue_certificate(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = CertificateService(db)
    return service.issue_certificate(course_id, current_user)


# --------------------------------------------------------------------------- #
# Consulta de certificados propios (STUDENT)
# --------------------------------------------------------------------------- #

@router.get(
    "/certificates/me",
    response_model=PaginatedResponse[CertificateResponse],
)
def list_my_certificates(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = CertificateService(db)
    return service.list_my_certificates(current_user=current_user, page=page, size=size)


# --------------------------------------------------------------------------- #
# Supervisión global de certificados emitidos (ADMIN)
# --------------------------------------------------------------------------- #

@router.get(
    "/admin/certificates",
    response_model=PaginatedResponse[CertificateResponse],
)
def list_all_certificates(
    course_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = CertificateService(db)
    return service.list_all_certificates(course_id=course_id, page=page, size=size)


@router.get(
    "/admin/certificates/{certificate_id}/download",
)
def download_certificate_admin(
    certificate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> FileResponse:
    service = CertificateService(db)
    certificate = service.get_certificate_for_admin_download(certificate_id)
    return FileResponse(
        resolve_path(certificate.pdf_path),
        media_type="application/pdf",
        filename=f"certificado-{certificate.code}.pdf",
    )


# --------------------------------------------------------------------------- #
# Validación pública (BR-030). Se declara antes de la ruta por id para no
# colisionar con el parámetro {certificate_id}.
# --------------------------------------------------------------------------- #

@router.get(
    "/certificates/verify/{code}",
    response_model=CertificateVerificationResponse,
)
def verify_certificate(
    code: str,
    db: Session = Depends(get_db),
):
    service = CertificateService(db)
    return service.verify_certificate(code)


@router.get(
    "/certificates/{certificate_id}",
    response_model=CertificateResponse,
)
def get_certificate(
    certificate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = CertificateService(db)
    return service.get_certificate(certificate_id, current_user)


@router.get(
    "/certificates/{certificate_id}/download",
)
def download_certificate(
    certificate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
) -> FileResponse:
    service = CertificateService(db)
    certificate = service.get_certificate_for_download(certificate_id, current_user)
    return FileResponse(
        resolve_path(certificate.pdf_path),
        media_type="application/pdf",
        filename=f"certificado-{certificate.code}.pdf",
    )
