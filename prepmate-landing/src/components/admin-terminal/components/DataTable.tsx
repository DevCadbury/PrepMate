import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Pagination } from '../types';

interface DataTableProps<T> {
  columns: Array<{
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    width?: string;
  }>;
  data: T[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  filters?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  pagination,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
  onRowClick,
  isLoading = false,
  filters
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {onSearch && (
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-on-surface-muted)]" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="admin-input w-full pl-10"
            />
          </div>
        )}
        
        {filters && (
          <div className="flex items-center space-x-2">
            {filters}
          </div>
        )}
      </div>

      {/* Table Wrapper */}
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[var(--admin-on-surface-muted)] uppercase bg-[var(--admin-surface-container-high)] border-b border-[var(--admin-outline)]">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-4 font-semibold" style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading State
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--admin-outline)] animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-[var(--admin-surface-container-high)] rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[var(--admin-on-surface-muted)]">
                  No results found.
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((item, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-[var(--admin-outline)] transition-colors hover:bg-[var(--admin-surface-container-high)] ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-6 py-4 whitespace-nowrap">
                      {col.cell ? col.cell(item) : (item[col.accessorKey!] as any)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-sm text-[var(--admin-on-surface-muted)]">
            Showing <span className="font-medium text-[var(--admin-on-surface)]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[var(--admin-on-surface)]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[var(--admin-on-surface)]">{pagination.total}</span> entries
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-[var(--admin-outline)] rounded-md text-[var(--admin-on-surface-variant)] hover:bg-[var(--admin-surface-container-high)] hover:text-[var(--admin-on-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 border border-[var(--admin-outline)] rounded-md text-[var(--admin-on-surface-variant)] hover:bg-[var(--admin-surface-container-high)] hover:text-[var(--admin-on-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
