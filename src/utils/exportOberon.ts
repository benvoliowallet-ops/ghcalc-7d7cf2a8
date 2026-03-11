import * as XLSX from 'xlsx';
import { migrateStockCode } from '../data/stockItems';

export interface OberonRow {
  code: string;
  quantity: number;
}

// Oberon template embedded as base64 — do NOT edit
const T = [
  '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',
].join('');

function loadTemplate(): Uint8Array {
  const binary = atob(T);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
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
 * Loads the Oberon template, fills columns A (code) and E (quantity)
 * starting from row 2, and downloads the resulting xlsx file.
 */
export async function exportToOberon(rows: OberonRow[], projectName: string): Promise<void> {
  // Try to fetch from public/ first (preferred — preserves full formatting)
  let templateBytes: Uint8Array;
  try {
    const response = await fetch('/oberon_template.xlsx');
    if (response.ok) {
      const ab = await response.arrayBuffer();
      templateBytes = new Uint8Array(ab);
    } else {
      templateBytes = loadTemplate();
    }
  } catch {
    templateBytes = loadTemplate();
  }

  const wb = XLSX.read(templateBytes, { type: 'array', cellStyles: true });

  const ws = wb.Sheets['Data'];
  if (!ws) {
    // Fallback: create a minimal workbook if template not available
    const fallbackWs = XLSX.utils.aoa_to_sheet([['Číslo', '', '', '', 'Množstvo']]);
    rows.forEach((row, i) => {
      XLSX.utils.sheet_add_aoa(fallbackWs, [[row.code, '', '', '', row.quantity]], { origin: { r: i + 1, c: 0 } });
    });
    const fallbackWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(fallbackWb, fallbackWs, 'Data');
    const safeName = projectName.replace(/[^a-zA-Z0-9_\-]/g, '_');
    XLSX.writeFile(fallbackWb, `Oberon_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    return;
  }

  rows.forEach((row, index) => {
    const r = index + 1; // row 0 = header, data from index 1
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = { t: 's', v: row.code };
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = { t: 'n', v: row.quantity };
  });

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H1');
  range.e.r = Math.max(range.e.r, rows.length);
  ws['!ref'] = XLSX.utils.encode_range(range);

  const safeName = projectName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  XLSX.writeFile(wb, `Oberon_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`, { bookType: 'xlsx', cellStyles: true });
}

