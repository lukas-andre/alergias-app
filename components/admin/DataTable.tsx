"use client";

import * as React from "react";
import { Search, Loader2, FileQuestion } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface DataTableColumn<TData> {
  /** Unique key for the column */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Render function for the cell content */
  render: (row: TData) => React.ReactNode;
  /** Optional: Make column sortable */
  sortable?: boolean;
  /** Optional: Custom className for the cell */
  className?: string;
}

export interface DataTableAction<TData> {
  /** Label for the action button */
  label: string;
  /** Click handler receiving the row data */
  onClick: (row: TData) => void;
  /** Optional: Variant for the button */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Optional: Show condition (defaults to always shown) */
  show?: (row: TData) => boolean;
}

export interface DataTableProps<TData> {
  /** Array of data to display */
  data: TData[];
  /** Column definitions */
  columns: DataTableColumn<TData>[];
  /** Optional: Actions for each row */
  actions?: DataTableAction<TData>[];
  /** Optional: Search placeholder text */
  searchPlaceholder?: string;
  /** Optional: Search function (defaults to searching all string values) */
  searchFn?: (row: TData, query: string) => boolean;
  /** Optional: Empty state message */
  emptyMessage?: string;
  /** Optional: Loading state */
  isLoading?: boolean;
  /** Optional: Get unique key for each row (defaults to index) */
  getRowKey?: (row: TData, index: number) => string;
}

export function DataTable<TData extends Record<string, any>>({
  data,
  columns,
  actions,
  searchPlaceholder = "Search...",
  searchFn,
  emptyMessage = "No data found.",
  isLoading = false,
  getRowKey = (_, index) => index.toString(),
}: DataTableProps<TData>) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Default search function: searches all string values in the row
  const defaultSearchFn = React.useCallback((row: TData, query: string) => {
    const lowerQuery = query.toLowerCase();
    return Object.values(row).some((value) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(lowerQuery);
      }
      if (Array.isArray(value)) {
        return value.some((item) =>
          typeof item === "string" && item.toLowerCase().includes(lowerQuery)
        );
      }
      return false;
    });
  }, []);

  const filterFn = searchFn || defaultSearchFn;

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    return data.filter((row) => filterFn(row, searchQuery));
  }, [data, searchQuery, filterFn]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-32"
                >
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm font-medium">Cargando...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-32"
                >
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <FileQuestion className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-sm font-medium">
                      {searchQuery ? `Sin resultados para "${searchQuery}"` : emptyMessage}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, index) => (
                <TableRow key={getRowKey(row, index)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions
                          .filter((action) => !action.show || action.show(row))
                          .map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant={action.variant || "ghost"}
                              size="sm"
                              onClick={() => action.onClick(row)}
                            >
                              {action.label}
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with results count */}
      {!isLoading && filteredData.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredData.length} de {data.length} resultado{data.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}
