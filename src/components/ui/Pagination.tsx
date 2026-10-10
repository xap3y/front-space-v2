"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import HoverDiv from "@/components/HoverDiv";
import styles from "./ui.module.css";
import { SelectControl } from "./SelectControl";

export interface PaginationProps {
    page: number;
    pages?: number;
    hasNext?: boolean;
    onChange?: (page: number) => void;
    onPrevious?: () => void;
    onNext?: () => void;
    disabled?: boolean;
    pageSize?: number;
    pageSizes?: readonly number[];
    onPageSizeChange?: (size: number) => void;
}

/** Public page numbers are always one-based, even for zero-based APIs. */
export default function Pagination({
    page,
    pages,
    hasNext,
    onChange,
    onPrevious,
    onNext,
    disabled = false,
    pageSize,
    pageSizes = [10, 25, 50],
    onPageSizeChange,
}: PaginationProps) {
    const total = pages === undefined ? undefined : Math.max(1, pages);
    const nextDisabled = hasNext === false || (total !== undefined && page >= total);

    return (
        <nav aria-label="Pagination" className={styles.pagination}>
            <div>
                {pageSize !== undefined && onPageSizeChange && (
                    <label className={styles.pageSize}>
                        <span>Per page</span>
                        <SelectControl
                            compact
                            value={pageSize}
                            disabled={disabled}
                            onChange={(event) => onPageSizeChange(Number(event.target.value))}
                        >
                            {Array.from(new Set([...pageSizes, pageSize])).sort((a, b) => a - b).map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </SelectControl>
                    </label>
                )}
            </div>
            <div className={styles.toolbar}>
                <HoverDiv
                    aria-label="Previous page"
                    className={`${styles.button} ${styles.small} ${styles.icon}`}
                    disabled={disabled || page <= 1}
                    onClick={() => onPrevious ? onPrevious() : onChange?.(Math.max(1, page - 1))}
                    icon={<FaChevronLeft aria-hidden="true" />}
                />
                <span aria-live="polite" className={styles.pageNumber}>{page} / {total ?? "—"}</span>
                <HoverDiv
                    aria-label="Next page"
                    className={`${styles.button} ${styles.small} ${styles.icon}`}
                    disabled={disabled || nextDisabled}
                    onClick={() => onNext ? onNext() : onChange?.(total === undefined ? page + 1 : Math.min(total, page + 1))}
                    icon={<FaChevronRight aria-hidden="true" />}
                />
            </div>
        </nav>
    );
}
