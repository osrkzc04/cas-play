import mimetypes
from collections.abc import Iterator
from pathlib import Path

from fastapi import Response
from fastapi.responses import StreamingResponse

_CHUNK_SIZE = 1024 * 1024


def _guess_content_type(path: Path) -> str:
    content_type, _ = mimetypes.guess_type(path.name)
    return content_type or "application/octet-stream"


def _parse_range(range_header: str, file_size: int) -> tuple[int, int] | None:
    # Formato esperado: "bytes=start-end" (end opcional).
    if not range_header.startswith("bytes="):
        return None

    raw = range_header.removeprefix("bytes=").split(",")[0].strip()
    start_text, _, end_text = raw.partition("-")

    try:
        start = int(start_text) if start_text else 0
        end = int(end_text) if end_text else file_size - 1
    except ValueError:
        return None

    if start > end or start >= file_size:
        return None

    return start, min(end, file_size - 1)


def _file_iterator(path: Path, start: int, length: int) -> Iterator[bytes]:
    with path.open("rb") as stream:
        stream.seek(start)
        remaining = length
        while remaining > 0:
            chunk = stream.read(min(_CHUNK_SIZE, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


def stream_video_response(path: Path, range_header: str | None) -> Response:
    """Entrega un video con soporte de HTTP Range.

    No se establece Content-Disposition: attachment para no ofrecer el
    archivo como descarga directa (BR-013). No constituye DRM.
    """
    file_size = path.stat().st_size
    content_type = _guess_content_type(path)

    parsed_range = _parse_range(range_header, file_size) if range_header else None

    if parsed_range is None:
        return StreamingResponse(
            _file_iterator(path, 0, file_size),
            media_type=content_type,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
            },
        )

    start, end = parsed_range
    length = end - start + 1

    return StreamingResponse(
        _file_iterator(path, start, length),
        status_code=206,
        media_type=content_type,
        headers={
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
        },
    )
