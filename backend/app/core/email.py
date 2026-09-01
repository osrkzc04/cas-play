import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from html import escape
from pathlib import Path

from app.core.config import settings


logger = logging.getLogger(__name__)


# Paleta de marca CAS (ver design system: rojo / oro / gris). Centralizada aquí
# para mantener consistencia visual en todos los correos.
_BRAND_RED = "#B11116"
_BRAND_GOLD = "#C8A24C"
_TEXT_COLOR = "#1f2937"
_MUTED_COLOR = "#6b7280"
_PAGE_BG = "#f4f4f5"
_BORDER_COLOR = "#e5e7eb"

# El logo se incrusta como imagen inline (CID) en lugar de URL externa o base64:
# es lo más compatible con clientes de correo (Gmail bloquea data URIs y oculta
# imágenes remotas hasta que el usuario las acepta). Se resuelve relativo al
# paquete para no depender del directorio de trabajo.
_LOGO_PATH = Path(__file__).parent / "assets" / "cas-logo-horizontal.png"
_LOGO_CID = "cas-logo"


def send_email(to: str, subject: str, html_body: str) -> None:
    # Sin SMTP configurado (desarrollo) el correo no se despacha: se registra en
    # log para no interrumpir los flujos de negocio que dependen del envío.
    if not settings.EMAILS_ENABLED:
        logger.info(
            "EMAILS_ENABLED=False, correo no enviado. to=%s subject=%s", to, subject
        )
        return

    message = EmailMessage()
    message["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM))
    message["To"] = to
    message["Subject"] = subject
    message.set_content(
        "Este mensaje requiere un cliente compatible con HTML."
    )
    message.add_alternative(html_body, subtype="html")

    # Adjunta el logo referenciado como `cid:_LOGO_CID` en la plantilla. Se
    # asocia a la parte HTML (multipart/related) para que se muestre embebido.
    if _LOGO_PATH.exists():
        html_part = message.get_payload()[-1]
        html_part.add_related(
            _LOGO_PATH.read_bytes(),
            maintype="image",
            subtype="png",
            cid=f"<{_LOGO_CID}>",
        )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        if settings.SMTP_TLS:
            server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)


def render_email(
    *,
    title: str,
    intro: str,
    content_html: str = "",
    cta_label: str | None = None,
    cta_url: str | None = None,
    footer_note: str | None = None,
) -> str:
    """Plantilla base reutilizable para todos los correos de la plataforma.

    Se usa maquetación con tablas y CSS inline porque los clientes de correo
    (Outlook, Gmail) no soportan hojas de estilo externas ni layout moderno.

    `title` e `intro` se escapan por seguridad; `content_html` se inserta tal
    cual, por lo que solo deben pasarlo emisores internos (nunca entrada de
    usuario sin sanear).
    """
    safe_title = escape(title)
    safe_intro = escape(intro)

    cta_block = ""
    if cta_label and cta_url:
        cta_block = f"""
              <tr>
                <td style="padding: 24px 0 8px 0;">
                  <a href="{escape(cta_url, quote=True)}"
                     style="display: inline-block; background-color: {_BRAND_RED};
                            color: #ffffff; text-decoration: none; font-weight: 600;
                            padding: 12px 28px; border-radius: 6px; font-size: 15px;">
                    {escape(cta_label)}
                  </a>
                </td>
              </tr>"""

    footer_block = ""
    if footer_note:
        footer_block = f"""
              <tr>
                <td style="padding: 16px 0 0 0; color: {_MUTED_COLOR}; font-size: 13px;
                           line-height: 20px;">
                  {escape(footer_note)}
                </td>
              </tr>"""

    return f"""<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{safe_title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: {_PAGE_BG};
               font-family: Arial, Helvetica, sans-serif; color: {_TEXT_COLOR};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color: {_PAGE_BG}; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0"
                 style="max-width: 600px; width: 100%; background-color: #ffffff;
                        border-radius: 10px; overflow: hidden;
                        border: 1px solid {_BORDER_COLOR};">
            <tr>
              <td align="center" style="background-color: #ffffff; padding: 28px 32px 20px 32px;">
                <img src="cid:{_LOGO_CID}" alt="Culinary Arts School" height="56"
                     style="height: 56px; width: auto; display: block; border: 0;" />
              </td>
            </tr>
            <tr>
              <td style="height: 4px; background-color: {_BRAND_RED};
                         border-bottom: 2px solid {_BRAND_GOLD}; font-size: 0;
                         line-height: 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 22px; font-weight: 700; color: {_TEXT_COLOR};
                               padding-bottom: 12px;">
                      {safe_title}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 15px; line-height: 24px; color: {_TEXT_COLOR};">
                      {safe_intro}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 15px; line-height: 24px; color: {_TEXT_COLOR};">
                      {content_html}
                    </td>
                  </tr>{cta_block}{footer_block}
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color: #fafafa; padding: 20px 32px;
                         border-top: 1px solid {_BORDER_COLOR}; color: {_MUTED_COLOR};
                         font-size: 12px; line-height: 18px;">
                Este es un correo automático de la plataforma de aprendizaje de
                Culinary Arts School. Por favor no respondas a este mensaje.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def build_welcome_email(first_name: str, email: str, temporary_password: str) -> str:
    login_url = f"{settings.FRONTEND_BASE_URL}/login"

    content_html = f"""
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin: 16px 0; background-color: {_PAGE_BG};
                    border: 1px solid {_BORDER_COLOR}; border-radius: 8px;">
        <tr>
          <td style="padding: 16px 20px; font-size: 15px; line-height: 26px;">
            <strong>Correo:</strong> {escape(email)}<br />
            <strong>Contraseña temporal:</strong>
            <span style="font-family: 'Courier New', monospace; font-size: 16px;
                         color: {_BRAND_RED};">{escape(temporary_password)}</span>
          </td>
        </tr>
      </table>
      <p style="margin: 0;">Por seguridad, deberás cambiar esta contraseña la
      primera vez que inicies sesión.</p>
    """

    return render_email(
        title="Bienvenido a Culinary Arts School",
        intro=(
            f"Hola {first_name}, se ha creado tu cuenta en la plataforma de "
            "aprendizaje de CAS. Estas son tus credenciales de acceso temporales:"
        ),
        content_html=content_html,
        cta_label="Iniciar sesión",
        cta_url=login_url,
    )


def build_admin_password_reset_email(
    first_name: str,
    email: str,
    temporary_password: str,
) -> str:
    # Restablecimiento iniciado por un administrador: se entrega una contraseña
    # temporal y se exige el cambio en el próximo ingreso (igual que en el alta).
    login_url = f"{settings.FRONTEND_BASE_URL}/login"

    content_html = f"""
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin: 16px 0; background-color: {_PAGE_BG};
                    border: 1px solid {_BORDER_COLOR}; border-radius: 8px;">
        <tr>
          <td style="padding: 16px 20px; font-size: 15px; line-height: 26px;">
            <strong>Correo:</strong> {escape(email)}<br />
            <strong>Contraseña temporal:</strong>
            <span style="font-family: 'Courier New', monospace; font-size: 16px;
                         color: {_BRAND_RED};">{escape(temporary_password)}</span>
          </td>
        </tr>
      </table>
      <p style="margin: 0;">Por seguridad, deberás cambiar esta contraseña la
      próxima vez que inicies sesión.</p>
    """

    return render_email(
        title="Restablecimiento de contraseña",
        intro=(
            f"Hola {first_name}, un administrador restableció la contraseña de tu "
            "cuenta en la plataforma de CAS. Estas son tus credenciales de acceso "
            "temporales:"
        ),
        content_html=content_html,
        cta_label="Iniciar sesión",
        cta_url=login_url,
    )


def build_password_reset_email(first_name: str, token: str) -> str:
    reset_url = f"{settings.FRONTEND_BASE_URL}/password-reset/confirm?token={token}"

    content_html = f"""
      <p style="margin: 0 0 12px 0;">Hemos recibido una solicitud para
      restablecer tu contraseña. Haz clic en el botón de abajo y define tu
      nueva contraseña.</p>
      <p style="margin: 16px 0 8px 0; color: {_MUTED_COLOR}; font-size: 13px;">
      Si el botón no funciona, abre la pantalla "Ya tengo un token" e ingresa
      este código:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin: 4px 0; background-color: {_PAGE_BG};
                    border: 1px solid {_BORDER_COLOR}; border-radius: 8px;">
        <tr>
          <td style="padding: 16px 20px; font-family: 'Courier New', monospace;
                     font-size: 15px; color: {_BRAND_RED}; word-break: break-all;">
            {escape(token)}
          </td>
        </tr>
      </table>
    """

    return render_email(
        title="Restablecer tu contraseña",
        intro=f"Hola {first_name},",
        content_html=content_html,
        cta_label="Restablecer contraseña",
        cta_url=reset_url,
        footer_note=(
            f"Este enlace caduca en {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} "
            "minutos. Si no solicitaste este cambio, ignora este correo."
        ),
    )


def build_notification_email(
    *,
    title: str,
    message: str,
    recipient_name: str | None = None,
    cta_label: str | None = None,
    cta_url: str | None = None,
    footer_note: str | None = None,
) -> str:
    """Correo de notificación genérico reutilizable (avisos, recordatorios, etc.).

    Construye el cuerpo a partir de la plantilla base con un saludo opcional y un
    mensaje en texto plano que se escapa por seguridad.
    """
    greeting = f"Hola {recipient_name}," if recipient_name else "Hola,"
    content_html = (
        f"<p style=\"margin: 0;\">{escape(message)}</p>"
    )

    return render_email(
        title=title,
        intro=greeting,
        content_html=content_html,
        cta_label=cta_label,
        cta_url=cta_url,
        footer_note=footer_note,
    )
