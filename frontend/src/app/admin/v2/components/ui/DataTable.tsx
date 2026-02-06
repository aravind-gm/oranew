'use client';

/**
 * ORA Admin Panel - Data Table Component
 * ======================================
 * 
 * Enterprise-grade data table with sorting, filtering, pagination
 * Shopify-inspired design
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from './index';

// ============================================
// TYPES
// ============================================

export interface Column<T extends Record<string, any> = Record<string, any>> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T extends Record<string, any> = Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId?: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filters?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  emptyState?: React.ReactNode;
  bulkActions?: { label: string; onClick: (selectedIds: string[]) => void; variant?: 'primary' | 'danger' }[];
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  stickyHeader?: boolean;
}

// ============================================
// DATA TABLE COMPONENT
// ============================================

export function DataTable<T extends Record<string, any> = Record<string, any>>({
  data,
  columns,
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId = (row: T) => (row.id as string) || String(data.indexOf(row)),
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  filters,
  pagination,
  emptyState,
  bulkActions,
  onRowClick,
  rowActions,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle sort
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  // Handle selection
  const allSelected = data.length > 0 && data.every((row) => selectedRows.includes(getRowId(row)));
  const someSelected = selectedRows.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map(getRowId));
    }
  };

  const handleSelectRow = (row: T) => {
    const id = getRowId(row);
    if (selectedRows.includes(id)) {
      onSelectionChange?.(selectedRows.filter((r) => r !== id));
    } else {
      onSelectionChange?.([...selectedRows, id]);
    }
  };

  // Get cell value
  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  // Pagination helpers
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const endItem = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : data.length;

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      {/* Toolbar */}
      {(searchable || filters || bulkActions) && (
        <div className="px-4 py-3 border-b border-[#e5e7eb] flex flex-col md:flex-row md:items-center gap-3">
          {/* Left side */}
          <div className="flex items-center gap-3 flex-1">
            {/* Bulk Actions */}
            {selectedRows.length > 0 && bulkActions && (
              <div className="flex items-center gap-2 pr-3 border-r border-[#e5e7eb]">
                <span className="text-sm font-medium text-[#4b5563]">
                  {selectedRows.length} selected
                </span>
                {bulkActions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || 'secondary'}
                    onClick={() => action.onClick(selectedRows)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Search */}
            {searchable && (
              <div className="relative flex-1 max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-[#d1d5db] rounded-lg bg-white text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#fde8b3] focus:border-[#d4af37]"
                />
              </div>
            )}
          </div>

          {/* Right side - Filters */}
          {filters && (
            <div className="flex items-center gap-2">
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-[#f6f7f9] ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {/* Checkbox column */}
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[#d1d5db] text-[#d4af37] focus:ring-[#d4af37]"
                  />
                </th>
              )}

              {/* Data columns */}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
                    text-[#4b5563]
                    ${column.sortable ? 'cursor-pointer select-none hover:bg-[#f3f4f6]' : ''}
                    ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                    {column.header}
                    {column.sortable && sortColumn === column.id && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              {rowActions && (
                <th className="w-12 px-4 py-3"></th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e5e7eb]">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-[#d4af37]" />
                    <span className="text-sm text-[#9ca3af]">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  {emptyState || (
                    <div className="text-[#9ca3af]">
                      No data found
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedRows.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    className={`
                      transition-colors
                      ${isSelected ? 'bg-[#fffbf0]' : 'hover:bg-[#f6f7f9]'}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                    onClick={() => onRowClick?.(row)}
                  >
                    {/* Checkbox */}
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(row)}
                          className="w-4 h-4 rounded border-[#d1d5db] text-[#d4af37] focus:ring-[#d4af37]"
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={`
                          px-4 py-3 text-sm text-[#111827]
                          ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
                          ${column.className || ''}
                        `}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}

                    {/* Row actions */}
                    {rowActions && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Info */}
          <div className="text-sm text-[#9ca3af]">
            Showing <span className="font-medium text-[#111827]">{startItem}</span> to{' '}
            <span className="font-medium text-[#111827]">{endItem}</span> of{' '}
            <span className="font-medium text-[#111827]">{pagination.total}</span> results
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Page size */}
            {pagination.onPageSizeChange && (
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-[#9ca3af]">Show</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-[#d1d5db] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#fde8b3]"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Page buttons */}
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-[#d1d5db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f6f7f9] transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-[#d1d5db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f6f7f9] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 text-sm text-[#111827]">
              Page {pagination.page} of {totalPages}
            </span>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-2 rounded-lg border border-[#d1d5db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f6f7f9] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => pagination.onPageChange(totalPages)}
              disabled={pagination.page === totalPages}
              className="p-2 rounded-lg border border-[#d1d5db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f6f7f9] transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TABLE ACTIONS DROPDOWN
// ============================================

interface TableActionsProps {
  children: React.ReactNode;
}

export function TableActions({ children }: TableActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-[#f6f7f9] transition-colors"
      >
        <MoreHorizontal size={18} className="text-[#9ca3af]" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-1 z-20">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

interface TableActionItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

export function TableActionItem({ onClick, icon, children, variant = 'default' }: TableActionItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
        ${variant === 'danger' 
          ? 'text-[#dc2626] hover:bg-[#fef2f2]' 
          : 'text-[#4b5563] hover:bg-[#f6f7f9] hover:text-[#111827]'
        }
      `}
    >
      {icon}
      {children}
    </button>
  );
}

export default DataTable;
