import * as XLSX from 'xlsx';
import { migrateStockCode } from '../data/stockItems';

export interface OberonRow {
  code: string;
  name: string;
  quantity: number;
}

/**
 * Aggregates BOM lines by code (summing quantities) for Oberon export.
 * Columns: A = code, B = name SK, E = quantity.
 * Only lines with qty > 0 are included.
 */
export function prepareBomForOberon(
  lines: { code: string; name: string; qty: number }[]
): OberonRow[] {
  const totals = new Map<string, { name: string; quantity: number }>();
  lines.forEach((l) => {
    if (l.qty <= 0) return;
    const code = migrateStockCode(l.code);
    const existing = totals.get(code);
    if (existing) {
      existing.quantity += l.qty;
    } else {
      totals.set(code, { name: l.name, quantity: l.qty });
    }
  });
  return Array.from(totals.entries()).map(([code, { name, quantity }]) => ({
    code,
    name,
    quantity,
  }));
}

/**
 * Generates an xlsx file with:
 *   A = stock code
 *   B = Slovak name
 *   C, D = empty (reserved by Oberon)
 *   E = quantity
 * Downloads the file immediately.
 */
export function exportToOberon(rows: OberonRow[], projectName: string): void {
  const headerRow = ['Číslo', 'Názov', '', '', 'Množstvo'];
  const dataRows = rows.map((r) => [r.code, r.name, '', '', r.quantity]);

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws['!cols'] = [
    { wch: 28 }, // A – code
    { wch: 50 }, // B – name SK
    { wch: 5 },  // C – empty
    { wch: 5 },  // D – empty
    { wch: 12 }, // E – quantity
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const safeName = projectName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  XLSX.writeFile(
    wb,
    `Oberon_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
