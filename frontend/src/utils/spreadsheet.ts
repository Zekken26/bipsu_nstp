export const MAX_IMPORT_FILE_BYTES = 1_000_000;
export const MAX_IMPORT_ROWS = 5_000;
export const MAX_IMPORT_COLUMNS = 30;
export const MAX_CELL_LENGTH = 2_000;

export type CsvStudentRow = {
  id: string;
  name: string;
  email: string;
  component: string;
  progress: number;
  assessments: number;
  status: string;
  notes: string;
};

function parseCsvLine(line: string): string[] {
  if ((line.match(/"/g) || []).length % 2 !== 0) throw new Error('The CSV file contains malformed quoted data.');
  return line
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((cell) => cell.trim().replace(/^"|"$/g, '').replace(/""/g, ''));
}

function readCell(row: string[], index: number, field: string): string {
  const value = row[index] ?? '';
  if (value.length > MAX_CELL_LENGTH || value.includes('\0')) throw new Error(`${field} contains invalid data.`);
  return value;
}

export async function parseStudentCsv(file: File): Promise<CsvStudentRow[]> {
  if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error('CSV files must be 1 MB or smaller.');
  if (!/\.csv$/i.test(file.name)) throw new Error('Only CSV files are supported.');
  const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('The CSV file must include a header row and at least one record.');
  if (lines.length - 1 > MAX_IMPORT_ROWS) throw new Error(`CSV files may contain at most ${MAX_IMPORT_ROWS} records.`);

  const headers = parseCsvLine(lines[0]);
  if (headers.length > MAX_IMPORT_COLUMNS) throw new Error(`CSV files may contain at most ${MAX_IMPORT_COLUMNS} columns.`);
  const indexes = Object.fromEntries(headers.map((header, index) => [header.toLowerCase(), index]));
  for (const required of ['name', 'email', 'component', 'progress', 'assessments', 'status']) {
    if (indexes[required] === undefined) throw new Error(`Missing required CSV header: ${required}.`);
  }

  return lines.slice(1).map((line, rowNumber) => {
    const row = parseCsvLine(line);
    if (row.length > MAX_IMPORT_COLUMNS) throw new Error(`Row ${rowNumber + 2} exceeds the column limit.`);
    const name = readCell(row, indexes.name, 'name');
    const email = readCell(row, indexes.email, 'email').toLowerCase();
    const progress = Number(readCell(row, indexes.progress, 'progress'));
    const assessments = Number(readCell(row, indexes.assessments, 'assessments'));
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Row ${rowNumber + 2} has invalid student data.`);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100 || !Number.isFinite(assessments) || assessments < 0) {
      throw new Error(`Row ${rowNumber + 2} has invalid numeric data.`);
    }
    return {
      id: indexes.id === undefined ? '' : readCell(row, indexes.id, 'id'),
      name,
      email,
      component: readCell(row, indexes.component, 'component'),
      progress,
      assessments,
      status: readCell(row, indexes.status, 'status'),
      notes: indexes.notes === undefined ? '' : readCell(row, indexes.notes, 'notes'),
    };
  });
}

export function escapeSpreadsheetFormula(value: unknown): string | number | boolean | null | undefined {
  if (typeof value !== 'string') return value as number | boolean | null | undefined;
  return /^\s*[=+\-@]/.test(value) ? `'${value}` : value;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const escape = (value: unknown) => `"${String(escapeSpreadsheetFormula(value) ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
}
