"use client";

import { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface DataTableProps {
  data: any[];
}

export function DataTable({ data }: DataTableProps) {
  const [stickyColumns, setStickyColumns] = useState<string[]>([]);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [showShadow, setShowShadow] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        setShowShadow(tableRef.current.scrollLeft > 0);
      }
    };

    const currentTable = tableRef.current;
    if (currentTable) {
      currentTable.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentTable) {
        currentTable.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  if (!data.length) return null;
  const columns = Object.keys(data[0]);

  const toggleStickyColumn = (column: string) => {
    setStickyColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const getColumnPosition = (column: string) => {
    return stickyColumns.indexOf(column) + 1;
  };

  const shouldShowCurrency = (columnName: string) => {
    return columnName.toLowerCase().includes("harga");
  };

  const formatCellContent = (content: any, columnName: string) => {
    if (content === null || content === undefined) return "-";
    if (typeof content === "boolean") return content ? "Yes" : "No";
    if (content instanceof Date) return content.toLocaleDateString();
    if (typeof content === "number") {
      if (shouldShowCurrency(columnName)) {
        return `Rp ${content.toLocaleString("id-ID")}`;
      }
      return content.toString();
    }
    return content.toString();
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sticky columns:</span>
        {stickyColumns.map((column) => (
          <Button
            key={column}
            variant="secondary"
            size="sm"
            onClick={() => toggleStickyColumn(column)}
            className="flex items-center gap-1"
          >
            <Lock className="h-3 w-3" />
            {column}
          </Button>
        ))}
      </div>

      <div className="relative rounded-md border">
        <ScrollArea className="h-[500px] rounded-md">
          <div className="relative" style={{ minWidth: "max-content" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => {
                    const isSticky = stickyColumns.includes(column);
                    const position = getColumnPosition(column);

                    return (
                      <TableHead
                        key={column}
                        className={cn(
                          "group relative whitespace-nowrap bg-background transition-colors hover:bg-accent",
                          isSticky && "sticky z-20 bg-background",
                          position === 1 && "left-0",
                          position === 2 && "left-[var(--column-width)]",
                          position === 3 &&
                            "left-[calc(var(--column-width)*2)]",
                          showShadow &&
                            isSticky &&
                            "shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                        )}
                        style={
                          {
                            "--column-width": "200px",
                            minWidth: "200px",
                          } as any
                        }
                        onMouseEnter={() => setHoveredColumn(column)}
                        onMouseLeave={() => setHoveredColumn(null)}
                      >
                        <div className="flex items-center justify-between">
                          {column}
                          <AnimatePresence>
                            {hoveredColumn === column && (
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => toggleStickyColumn(column)}
                                className="ml-2 p-1 rounded hover:bg-accent-foreground/10"
                              >
                                {isSticky ? (
                                  <Unlock className="h-3 w-3" />
                                ) : (
                                  <Lock className="h-3 w-3" />
                                )}
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => {
                      const isSticky = stickyColumns.includes(column);
                      const position = getColumnPosition(column);

                      return (
                        <TableCell
                          key={column}
                          className={cn(
                            "whitespace-nowrap",
                            isSticky && "sticky bg-background",
                            position === 1 && "left-0",
                            position === 2 && "left-[var(--column-width)]",
                            position === 3 &&
                              "left-[calc(var(--column-width)*2)]",
                            showShadow &&
                              isSticky &&
                              "shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                          )}
                          style={
                            {
                              "--column-width": "200px",
                              minWidth: "200px",
                            } as any
                          }
                        >
                          {formatCellContent(row[column], column)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </Card>
  );
}
