import { Button } from "./Button";

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center justify-center gap-3" aria-label="Paginación">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </Button>
      <span className="text-sm text-gray-600">
        Página {page} de {pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
      >
        Siguiente
      </Button>
    </nav>
  );
}
