import * as XLSX from "xlsx";
import { detectColumnType, formatCurrency, formatDate } from "./utils";

interface ColumnInfo {
  name: string;
  type: "date" | "currency" | "number" | "text";
}

export function processExcelFile(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

  if (rawData.length === 0) return { data: [], columns: [] };

  // Detect column types
  const columns: ColumnInfo[] = Object.keys(rawData[0]).map((key) => {
    const values = rawData.map((row) => row[key]);
    const columnName = key.toLowerCase();

    // Special handling for known column types
    if (columnName.includes("harga")) {
      return { name: key, type: "currency" };
    }
    if (columnName.includes("tanggal")) {
      return { name: key, type: "date" };
    }
    if (
      columnName === "tinggi" ||
      columnName === "berat" ||
      columnName.includes("jumlah")
    ) {
      return { name: key, type: "number" };
    }

    return {
      name: key,
      type: detectColumnType(values),
    };
  });

  // Process data according to column types
  const processedData = rawData.map((row) => {
    const processedRow = {};
    columns.forEach(({ name, type }) => {
      const value = row[name];

      // Skip processing if value is null or undefined
      if (value == null) {
        processedRow[name] = "-";
        return;
      }

      switch (type) {
        case "date":
          processedRow[name] = isNaN(value) ? value : formatDate(value);
          break;
        case "currency":
          // Remove any existing currency formatting
          const numericValue =
            typeof value === "string"
              ? parseFloat(value.replace(/[^\d.-]/g, ""))
              : value;
          processedRow[name] =
            typeof numericValue === "number"
              ? numericValue // Store as number, let UI handle formatting
              : value;
          break;
        case "number":
          // Ensure numbers are stored as numbers without formatting
          processedRow[name] =
            typeof value === "number"
              ? value // Keep as is if already a number
              : typeof value === "string"
              ? parseFloat(value.replace(/[^\d.-]/g, "")) // Parse if string
              : value;
          break;
        default:
          processedRow[name] = value;
      }
    });
    return processedRow;
  });

  return { data: processedData, columns };
}
