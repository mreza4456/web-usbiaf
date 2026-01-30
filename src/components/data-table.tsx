"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns3Cog, Loader2, PlusCircle } from "lucide-react"
import { Card, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: keyof TData
  isLoading?: boolean
  showRowNumbers?: boolean
  // ✅ Props dinamis untuk title, badge, dan button
  title?: string
  badgeText?: string
  addButtonText?: string
  onAddClick?: () => void
  showAddButton?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  isLoading = false,
  showRowNumbers = true,
  title = "All Order",
  badgeText,
  addButtonText = "Add Order",
  onAddClick,
  showAddButton = true
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // ✅ Dinamis: Hitung jumlah data untuk badge (jika tidak di-override)
  const defaultBadgeText = `${data.length} ${title.replace("All ", "")}`

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <h3 className="font-bold">{title}</h3>
            <Badge variant="outline" className="bg-gray-200">
              {badgeText || defaultBadgeText}
            </Badge>
          </div>
          <div className="flex justify-end items-center gap-4">
            {/* Filter */}
            {filterColumn && (
              <Input
                placeholder={`Filter ${String(filterColumn)}...`}
                value={
                  (table.getColumn(String(filterColumn))?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn(String(filterColumn))?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            )}

            {/* Toggle Columns */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Columns3Cog />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Button - Dinamis */}
            {showAddButton && (
              <Button className="bg-slate-800 hover:bg-slate-700" onClick={onAddClick}>
                {addButtonText} <PlusCircle className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
            </div>
          )}

          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-gray-200">
                  {showRowNumbers && (
                    <TableHead className="w-16 text-center font-semibold text-slate-700">
                      No
                    </TableHead>
                  )}
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow className="hover:bg-gray-200"
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {showRowNumbers && (
                      <TableCell className="text-center font-medium text-slate-500 ">
                        {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + index + 1}
                      </TableCell>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center hover:bg-gray-200">
                    {isLoading ? "Loading..." : "No results."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  )
}