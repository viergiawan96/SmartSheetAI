"use client";

import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatTableData(content: string) {
  // Check if content contains table-like data
  const hasTableStructure = content.includes("|") && content.includes("\n");

  if (!hasTableStructure) {
    return (
      <p className="text-sm whitespace-pre-wrap">
        {content}
        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
      </p>
    );
  }

  try {
    // Split content into rows
    const rows = content.split("\n").filter((row) => row.trim());

    // Extract headers
    const headers = rows[0]
      .split("|")
      .map((h) => h.trim())
      .filter(Boolean);

    // Extract data rows
    const dataRows = rows
      .slice(1)
      .filter((row) => row.includes("|"))
      .map((row) =>
        row
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean)
      );

    return (
      <div className="overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, i) => (
                <TableHead key={i} className="whitespace-nowrap">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className="whitespace-nowrap">
                    {cell === "---" ? "" : cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
      </div>
    );
  } catch (error) {
    return (
      <p className="text-sm whitespace-pre-wrap">
        {content}
        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
      </p>
    );
  }
}

export function StreamingMessage({ text }: { text: string }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-start space-x-2 mb-4"
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="max-w-[90%] rounded-lg px-4 py-2 bg-muted">
        {formatTableData(text)}
      </div>
    </motion.div>
  );
}
