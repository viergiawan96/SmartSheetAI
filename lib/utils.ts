import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function isDateValue(value: any): boolean {
  if (value instanceof Date) return true;
  if (typeof value === "number") {
    // Excel stores dates as numbers, check if it's a valid Excel date
    return value > 25569 && value < 47483; // Excel dates between 1970 and 2099
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }
  return false;
}

export function formatDate(value: any): string {
  if (value instanceof Date) {
    return value.toLocaleDateString("id-ID");
  }
  if (typeof value === "number") {
    // Convert Excel date number to JS Date
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toLocaleDateString("id-ID");
  }
  const date = new Date(value);
  return date.toLocaleDateString("id-ID");
}

export function detectColumnType(
  values: any[]
): "date" | "currency" | "number" | "text" {
  const sampleSize = Math.min(values.length, 10);
  let dateCount = 0;
  let numberCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const value = values[i];
    if (value == null) continue;

    if (isDateValue(value)) {
      dateCount++;
    } else if (
      typeof value === "number" ||
      (typeof value === "string" && !isNaN(parseFloat(value)))
    ) {
      numberCount++;
    }
  }

  if (dateCount / sampleSize > 0.5) return "date";
  if (numberCount / sampleSize > 0.5) return "number";
  return "text";
}
