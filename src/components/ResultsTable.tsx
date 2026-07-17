import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GeocodingRecord } from "@/types";
import { Edit3, Database, Globe, Ban } from "lucide-react";

interface ResultsTableProps {
  records: GeocodingRecord[];
  visible?: boolean;
  onRecordsChange?: (records: GeocodingRecord[]) => void;
}

const estadoBadge: Record<
  GeocodingRecord["estado"],
  { label: string; className: string }
> = {
  encontrado: {
    label: "Encontrado",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  geocodificado: {
    label: "Geocodificado",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  no_encontrado: {
    label: "Sin coordenadas",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

const fuenteInfo: Record<
  GeocodingRecord["estado"],
  { label: string; icon: typeof Database; className: string }
> = {
  encontrado: {
    label: "Base maestra",
    icon: Database,
    className: "text-green-700",
  },
  geocodificado: {
    label: "Autom\u00e1tico (Nominatim)",
    icon: Globe,
    className: "text-orange-600",
  },
  no_encontrado: {
    label: "Sin resultado",
    icon: Ban,
    className: "text-red-500",
  },
};

const filterOptions: Array<{
  value: GeocodingRecord["estado"] | "todos";
  label: string;
}> = [
  { value: "todos", label: "Todos" },
  { value: "encontrado", label: "Encontrados" },
  { value: "geocodificado", label: "Geocodificados" },
  { value: "no_encontrado", label: "Sin coordenadas" },
];

function EditableCoordCell({
  value,
  rowIdx,
  field,
  onEdit,
}: {
  value: number | null;
  rowIdx: number;
  field: "latitud" | "longitud";
  onEdit: (rowIdx: number, field: "latitud" | "longitud", value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value != null ? String(value) : "");
  const didEditRef = useRef(false);

  useEffect(() => {
    setDraft(value != null ? String(value) : "");
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (didEditRef.current) {
      didEditRef.current = false;
      onEdit(rowIdx, field, draft);
    }
  };

  if (editing) {
    return (
      <Input
        type="text"
        value={draft}
        onChange={(e) => {
          didEditRef.current = true;
          setDraft(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            didEditRef.current = false;
            setEditing(false);
          }
        }}
        className="h-7 w-28 text-xs font-mono"
        autoFocus
      />
    );
  }

  return (
    <span
      className={cn(
        "group inline-flex items-center gap-1 cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors",
        value == null && "text-muted-foreground italic"
      )}
      onClick={() => {
        didEditRef.current = false;
        setEditing(true);
      }}
    >
      {value != null ? value.toFixed(6) : "-"}
      <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </span>
  );
}

const columnHelper = createColumnHelper<GeocodingRecord>();

export function ResultsTable({
  records,
  visible = true,
  onRecordsChange,
}: ResultsTableProps) {
  const [filterEstado, setFilterEstado] = useState<GeocodingRecord["estado"] | "todos">("todos");

  const filteredRecords = useMemo(() => {
    if (filterEstado === "todos") return records;
    return records.filter((r) => r.estado === filterEstado);
  }, [records, filterEstado]);

  const filterCounts = useMemo(() => {
    const counts = { todos: records.length, encontrado: 0, geocodificado: 0, no_encontrado: 0 };
    for (const r of records) counts[r.estado]++;
    return counts;
  }, [records]);

  const handleEdit = useCallback(
    (rowIdx: number, field: "latitud" | "longitud", rawValue: string) => {
      const num = rawValue.trim() === "" ? null : parseFloat(rawValue.replace(",", "."));
      const isValid = num != null && Number.isFinite(num);

      const updated = records.map((r, i) => {
        if (i !== rowIdx) return r;
        const newRecord = { ...r, [field]: isValid ? num : null };
        if (field === "latitud" && newRecord.longitud != null && isValid) {
          newRecord.estado = "encontrado";
        } else if (field === "longitud" && newRecord.latitud != null && isValid) {
          newRecord.estado = "encontrado";
        }
        if (newRecord.latitud == null || newRecord.longitud == null) {
          if (isValid) {
            newRecord.estado = "geocodificado";
          } else {
            newRecord.estado = "no_encontrado";
          }
        }
        return newRecord;
      });
      onRecordsChange?.(updated);
    },
    [records, onRecordsChange]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("documento", {
        header: "Documento",
        cell: (info) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("cliente", {
        header: "Cliente",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("ciudad", {
        header: "Ciudad",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("barrio", {
        header: "Barrio",
        meta: { hideOnMobile: true },
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("direccion", {
        header: "Dirección",
        cell: (info) => (
          <span className="max-w-[180px] truncate inline-block" title={info.getValue()}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("latitud", {
        header: "Latitud",
        cell: (info) => (
          <EditableCoordCell
            value={info.getValue()}
            rowIdx={info.row.index}
            field="latitud"
            onEdit={handleEdit}
          />
        ),
      }),
      columnHelper.accessor("longitud", {
        header: "Longitud",
        cell: (info) => (
          <EditableCoordCell
            value={info.getValue()}
            rowIdx={info.row.index}
            field="longitud"
            onEdit={handleEdit}
          />
        ),
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: (info) => {
          const estado = info.getValue();
          const badge = estadoBadge[estado];
          return (
            <Badge variant="outline" className={cn("w-fit text-xs", badge.className)}>
              {badge.label}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("estado", {
        id: "fuente",
        header: "Fuente",
        meta: { hideOnMobile: true },
        cell: (info) => {
          const estado = info.getValue();
          const fuente = fuenteInfo[estado];
          const Icon = fuente.icon;
          const record = info.row.original;
          return (
            <div className={cn("flex items-center gap-1.5 text-xs", fuente.className)}>
              <Icon className="h-3 w-3 shrink-0" />
              <span>{fuente.label}</span>
              {(estado === "encontrado" || estado === "geocodificado") && record.latitud != null && (
                <span className="text-[10px] text-muted-foreground font-mono ml-1">
                  ({record.latitud.toFixed(4)}, {record.longitud!.toFixed(4)})
                </span>
              )}
            </div>
          );
        },
      }),
    ],
    [handleEdit]
  );

  const table = useReactTable({
    data: filteredRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              Resultados de Geocodificacion
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredRecords.length}{filterEstado !== "todos" ? ` de ${records.length}` : ""} registros)
              </span>
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterEstado(opt.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                    filterEstado === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {opt.label}
                  <span className="ml-1 opacity-70">({filterCounts[opt.value]})</span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "whitespace-nowrap",
                          (header.column.columnDef as { meta?: { hideOnMobile?: boolean } }).meta?.hideOnMobile && "hidden md:table-cell"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        row.original.estado === "no_encontrado" && "bg-red-50/30",
                        row.original.estado === "geocodificado" && "bg-orange-50/20"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "whitespace-nowrap",
                            (cell.column.columnDef as { meta?: { hideOnMobile?: boolean } }).meta?.hideOnMobile && "hidden md:table-cell"
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-muted-foreground py-8"
                    >
                      No hay registros para mostrar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
