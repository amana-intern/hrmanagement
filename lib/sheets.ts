// Helper export yang rapi untuk dipaste ke Google Sheets (TSV).
// TSV dipilih karena tab = pemisah kolom standar di Google Sheets/Excel.

function escapeCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[\t\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildTSV(rows: unknown[][]): string {
  return rows.map((row) => row.map(escapeCell).join('\t')).join('\n');
}

export function downloadTSV(filename: string, rows: unknown[][]): void {
  const tsv = buildTSV(rows);
  const blob = new Blob(['\uFEFF' + tsv], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyTSV(rows: unknown[][]): Promise<boolean> {
  const tsv = buildTSV(rows);
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = tsv;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
