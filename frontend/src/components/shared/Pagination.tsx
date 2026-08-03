import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit, hasNextPage, hasPrevPage } = meta;

  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-1 py-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> de{" "}
        <span className="font-medium text-foreground">{total}</span> resultados
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" disabled={!hasPrevPage} onClick={() => onPageChange(1)}>
          <ChevronsLeft />
        </Button>
        <Button variant="outline" size="icon" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft />
        </Button>
        <span className="min-w-20 px-2 text-center text-sm font-medium">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="icon" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
          <ChevronRight />
        </Button>
        <Button variant="outline" size="icon" disabled={!hasNextPage} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
