import { cn } from "@/lib/cn";
import type { TableProps } from "@/lib/types";

export function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-light">
            {columns.map((col, index) => (
              <th
                key={index}
                className={cn(
                  "px-6 py-3 text-left text-caption font-semibold text-text-secondary bg-bg-tertiary",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={rowKey ? String(row[rowKey]) : idx}
              className="border-b border-border-light hover:bg-bg-tertiary transition-colors"
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? "pointer" : "default" }}
            >
              {columns.map((col, index) => (
                <td key={index} className={cn("px-6 py-4 text-body text-text-primary", col.className)}>
                  {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
