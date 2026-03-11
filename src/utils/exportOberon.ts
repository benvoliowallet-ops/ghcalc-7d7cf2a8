import * as XLSX from 'xlsx';
import { migrateStockCode } from '../data/stockItems';

export interface OberonRow {
  code: string;
  quantity: number;
}

/**
 * Aggregates BOM lines by code (summing quantities) for Oberon export.
 * Only lines with qty > 0 are included.
 */
export function prepareBomForOberon(lines: { code: string; qty: number }[]): OberonRow[] {
  const totals = new Map<string, number>();
  lines.forEach((l) => {
    if (l.qty <= 0) return;
    const code = migrateStockCode(l.code);
    totals.set(code, (totals.get(code) ?? 0) + l.qty);
  });
  return Array.from(totals.entries()).map(([code, quantity]) => ({ code, quantity }));
}

/**
 * Loads the Oberon template from public/, fills columns A (code) and E (quantity)
 * starting from row 2, and downloads the resulting xlsx file.
 */
export async function exportToOberon(rows: OberonRow[], projectName: string): Promise<void> {
  const response = await fetch('/oberon_template.xlsx');
  if (!response.ok) throw new Error('Nepodarilo sa načítať šablónu Oberon template.');

  const arrayBuffer = await response.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellStyles: true });

  const ws = wb.Sheets['Data'];
  if (!ws) throw new Error('Záložka "Data" nebola nájdená v šablóne Oberon.');

  rows.forEach((row, index) => {
    const r = index + 1; // row index 0-based; row 0 = header, data starts at index 1
    const addrA = XLSX.utils.encode_cell({ r, c: 0 }); // column A
    const addrE = XLSX.utils.encode_cell({ r, c: 4 }); // column E

    ws[addrA] = { t: 's', v: row.code };
    ws[addrE] = { t: 'n', v: row.quantity };
  });

  // Extend sheet range to cover all written rows
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H1');
  range.e.r = Math.max(range.e.r, rows.length);
  ws['!ref'] = XLSX.utils.encode_range(range);

  const safeName = projectName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Oberon_${safeName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename, { bookType: 'xlsx', cellStyles: true });
}
