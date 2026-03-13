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
 * Downloads the file using Blob URL (avoids any atob/writeFile browser issues).
 */
export function exportToOberon(rows: OberonRow[], projectName: string): void {
  const headerRow = ['\u010c\u00edslo', 'N\u00e1zov', '', '', 'Mno\u017estvo'];
  const dataRows = rows.map((r) => [r.code, r.name, '', '', r.quantity]);

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws['!cols'] = [
    { wch: 28 },
    { wch: 50 },
    { wch: 5 },
    { wch: 5 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Use XLSX.write + Blob to avoid any browser atob/writeFile issues
  const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([new Uint8Array(wbout)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = projectName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  a.download = `Oberon_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
