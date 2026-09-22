import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";

export interface DataTableSortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: React.ReactNode;
  className?: string;
}

export function DataTableSortableHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableSortableHeaderProps<TData, TValue>) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className={cn(
        "text-xs font-semibold text-muted-foreground uppercase gap-1 px-0 hover:bg-transparent",
        className,
      )}
    >
      {title}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-1 size-3 text-foreground" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-1 size-3 text-foreground" />
      ) : (
        <ArrowUpDown className="ml-1 size-3 opacity-50" />
      )}
    </Button>
  );
}

export function getSelectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

export interface DataTableActionsCellProps<T> {
  item: T;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  className?: string;
}

export function DataTableActionsCell<T>({
  item,
  onEdit,
  onDelete,
  className,
}: DataTableActionsCellProps<T>) {
  return (
    <div
      className={cn(
        "flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity",
        className,
      )}
    >
      {onEdit && (
        <Button
          variant="outline"
          size="icon-xs"
          className="h-7 w-7"
          onClick={() => onEdit(item)}
          aria-label="Edit"
        >
          <Edit2 className="size-3" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="outline"
          size="icon-xs"
          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50/10"
          onClick={() => onDelete(item)}
          aria-label="Delete"
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}

export interface GetActionsColumnOptions<T> {
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function getActionsColumn<T>({
  onEdit,
  onDelete,
}: GetActionsColumnOptions<T>): ColumnDef<T> {
  return {
    id: "actions",
    cell: ({ row }) => (
      <DataTableActionsCell
        item={row.original}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

export interface DataTableEntityCellProps {
  name: React.ReactNode;
  initials?: string;
  image?: string;
  imageAlt?: string;
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

export function DataTableEntityCell({
  name,
  initials,
  image,
  imageAlt,
  badge,
  subtitle,
  className,
}: DataTableEntityCellProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 font-medium text-foreground text-sm py-1.5",
        className,
      )}
    >
      {image ? (
        <Avatar size="sm" className="ring-1 ring-border/60">
          <AvatarImage src={getStableImageUrl(image)} alt={imageAlt} />
          <AvatarFallback>
            <InitialsAvatar
              className="size-full rounded-full text-[10px] font-bold"
              initials={initials ?? "?"}
            />
          </AvatarFallback>
        </Avatar>
      ) : (
        initials && <InitialsAvatar initials={initials} size="sm" />
      )}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span>{name}</span>
          {badge}
        </div>
        {subtitle && (
          <span className="text-xs font-normal text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
