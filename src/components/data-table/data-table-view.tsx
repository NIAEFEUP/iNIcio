import type { Table } from "@tanstack/react-table";
import * as React from "react";
import {
  DataEmptyState,
  DataErrorState,
  DataLoadingState,
} from "@/components/data-table/data-state-view";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import type { ViewMode } from "@/components/data-table/view-mode-toggle";

export interface DataTableViewProps<T> {
  table: Table<T>;
  viewMode?: ViewMode;
  isLoading?: boolean;
  loadingMessage?: string;
  isError?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  renderGrid?: (table: Table<T>) => React.ReactNode;
  showPagination?: boolean;
}

export function DataTableView<T>({
  table,
  viewMode = "list",
  isLoading = false,
  loadingMessage,
  isError = false,
  errorTitle,
  errorMessage,
  emptyTitle = "No results found",
  emptyDescription = "Try resetting your filters or search query.",
  renderGrid,
  showPagination = true,
}: DataTableViewProps<T>) {
  const rows = table.getRowModel().rows;

  if (isLoading) {
    return <DataLoadingState message={loadingMessage} />;
  }

  if (isError) {
    return <DataErrorState title={errorTitle} message={errorMessage} />;
  }

  if (rows.length === 0) {
    return <DataEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const hasPagination =
    showPagination && Boolean(table.options.getPaginationRowModel);

  return (
    <>
      {viewMode === "list" || !renderGrid ? (
        <DataTable table={table} />
      ) : (
        renderGrid(table)
      )}
      {hasPagination && <DataTablePagination table={table} />}
    </>
  );
}
