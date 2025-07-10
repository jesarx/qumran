"use client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { usePathname, useSearchParams } from 'next/navigation';

import { BookMetadata } from "@/lib/definitions"

export default function PaginationComp({ metadata, object }: { metadata: BookMetadata, object: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Calculate which pages to display
  const getPageNumbers = () => {
    const { current_page, last_page } = metadata;
    const pages = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const range = [];
    for (let i = Math.max(2, current_page - 1); i <= Math.min(last_page - 1, current_page + 1); i++) {
      range.push(i);
    }

    // Add ellipsis and range if needed
    if (range[0] > 2) {
      pages.push('ellipsis1');
    }
    pages.push(...range);

    // Add ellipsis before last page if needed
    if (range[range.length - 1] < last_page - 1 && last_page > 1) {
      pages.push('ellipsis2');
    }

    // Add last page if there's more than one page
    if (last_page > 1) {
      pages.push(last_page);
    }

    return pages;
  };

  // Get current URL parameters to preserve other query params
  const getPageUrl = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Don't show pagination if there's only one page
  if (metadata.last_page <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="border-t-2 py-4 mt-4 flex-col items-center">
      <p className="text-center mb-4 text-sm">Mostrando {metadata.page_size} de {metadata.total_records} {object}</p>
      <Pagination >
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={metadata.current_page > 1 ? getPageUrl(metadata.current_page - 1) : '#'}
              aria-disabled={metadata.current_page === 1}
              className={metadata.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>

          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis1' || page === 'ellipsis2') {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            return (
              <PaginationItem key={`page-${page}`}>
                <PaginationLink
                  href={getPageUrl(page as number)}
                  isActive={metadata.current_page === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              href={metadata.current_page < metadata.last_page ? getPageUrl(metadata.current_page + 1) : '#'}
              aria-disabled={metadata.current_page === metadata.last_page}
              className={metadata.current_page === metadata.last_page ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
