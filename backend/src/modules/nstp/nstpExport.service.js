import { listAuditEntries } from '../../audit/auditLog.js';
import { applyFacilitatorMunicipalityScope } from '../../utils/facilitatorScope.js';
import { listCollection } from './nstp.service.js';

export const EXPORTABLE_COLLECTIONS = ['accounts', 'modules', 'assessments', 'students', 'grades', 'notices', 'supportTickets', 'auditLogs'];

const institution = 'Biliran Province State University';
const systemName = 'NSTP Management System';

const componentFrom = (value = {}) => (
  value.component?.name ||
  value.component?.type ||
  value.component ||
  value.nstpComponent ||
  ''
);

const studentNameFrom = (value = {}) => (
  value.name ||
  value.studentName ||
  value.user?.name ||
  value.student?.user?.name ||
  value.student?.name ||
  ''
);

const studentIdFrom = (value = {}) => (
  value.studentId ||
  value.studentNumber ||
  value.student?.studentNumber ||
  value.student?.studentId ||
  value.id ||
  ''
);

const roleFrom = (value = {}) => String(value.role || value.actor?.role || '').toLowerCase();

const municipalityFrom = (value = {}) => (
  value.municipality ||
  value.groupMunicipality ||
  value.student?.municipality ||
  value.student?.section?.municipality ||
  value.section?.municipality ||
  ''
);

const facilitatorFrom = (value = {}) => (
  value.facilitatorName ||
  value.facilitatorId ||
  value.ownerName ||
  value.actorName ||
  value.actor?.id ||
  ''
);

const statusFrom = (value = {}) => (
  value.status ||
  value.remarks ||
  value.releaseStatus ||
  (value.released === true ? 'Released' : value.released === false ? 'Held' : '') ||
  ''
);

const dateFrom = (value = {}) => (
  value.date ||
  value.createdAt ||
  value.updatedAt ||
  value.submittedAt ||
  value.gradedAt ||
  ''
);

function textIncludes(source, expected) {
  return String(source || '').toLowerCase().includes(String(expected || '').toLowerCase());
}

function matchesDateRange(row, { date, from, to }) {
  const rowDate = String(dateFrom(row) || '').slice(0, 10);
  if (date && rowDate !== date) return false;
  if (from && rowDate < from) return false;
  if (to && rowDate > to) return false;
  return true;
}

function matchesFilters(row, filters = {}) {
  if (filters.component && !textIncludes(componentFrom(row), filters.component)) return false;
  if (filters.municipality && !textIncludes(municipalityFrom(row), filters.municipality)) return false;
  if (filters.facilitator && !textIncludes(facilitatorFrom(row), filters.facilitator)) return false;
  if (filters.facilitatorId && !textIncludes(facilitatorFrom(row), filters.facilitatorId)) return false;
  if (filters.studentId && !textIncludes(studentIdFrom(row), filters.studentId)) return false;
  if (filters.status && !textIncludes(statusFrom(row), filters.status)) return false;
  if (!matchesDateRange(row, filters)) return false;
  if (filters.search) {
    const haystack = JSON.stringify(row).toLowerCase();
    if (!haystack.includes(String(filters.search).toLowerCase())) return false;
  }
  return true;
}

function rowBelongsToStudent(row, user = {}) {
  const possibleIds = [
    row.userId,
    row.user?.id,
    row.studentId,
    row.studentNumber,
    row.student?.id,
    row.student?.userId,
    row.student?.user?.id,
    row.student?.studentId,
    row.student?.studentNumber,
  ].filter(Boolean).map(String);
  return possibleIds.includes(String(user.id));
}

function flattenRecord(record, prefix = '', output = {}) {
  Object.entries(record || {}).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      output[nextKey] = '';
    } else if (value instanceof Date) {
      output[nextKey] = value.toISOString();
    } else if (Array.isArray(value)) {
      output[nextKey] = value.map((item) => typeof item === 'object' ? JSON.stringify(item) : String(item)).join('; ');
    } else if (typeof value === 'object') {
      flattenRecord(value, nextKey, output);
    } else {
      output[nextKey] = value;
    }
  });
  return output;
}

function safeCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).replace(/\r?\n/g, ' ');
}

function csvEscape(value) {
  return `"${safeCell(value).replace(/"/g, '""')}"`;
}

function htmlEscape(value) {
  return safeCell(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}

function filenamePart(value) {
  return String(value || 'All')
    .replace(/[^\w\s.-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'All';
}

export function buildExportFilename(dataType, scope, format) {
  const extension = format === 'excel' || format === 'xlsx' ? 'xls' : format === 'print' ? 'html' : format;
  return `NSTP_${filenamePart(dataType)}_${filenamePart(scope || 'All')}_${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export function extractExportFilters(query = {}) {
  return {
    component: query.component,
    municipality: query.municipality,
    facilitator: query.facilitator,
    facilitatorId: query.facilitatorId,
    studentId: query.studentId,
    status: query.status,
    search: query.search,
    date: query.date,
    from: query.from,
    to: query.to,
  };
}

export function exportScopeFromQuery(query = {}, fallback = 'All') {
  return [
    query.scope,
    query.component,
    query.municipality,
    query.facilitator,
    query.studentId,
    query.status,
  ].filter(Boolean).join('_') || fallback;
}

export async function getScopedCollectionRows(collection, req) {
  if (collection === 'auditLogs') {
    return req.user?.role === 'admin' ? listAuditEntries({ limit: 500 }) : [];
  }

  const rows = await listCollection(collection);
  if (req.user?.role === 'admin') return rows;

  if (req.user?.role === 'student') {
    if (collection === 'grades') return rows.filter((row) => rowBelongsToStudent(row, req.user));
    if (collection === 'assessments') return rows.filter((row) => row.status === undefined || String(row.status).toLowerCase() === 'published');
    if (collection === 'modules' || collection === 'notices') return rows;
    return [];
  }

  if (req.user?.role === 'facilitator') {
    if (collection === 'students' || collection === 'grades') return applyFacilitatorMunicipalityScope(rows, req);
    if (collection === 'accounts') return rows.filter((row) => row.id === req.user.id || row.email === req.user.email);
    return rows;
  }

  return [];
}

export async function buildExportDataset(collection, req, filters = {}) {
  if (collection === 'all') {
    const collections = req.user?.role === 'admin'
      ? EXPORTABLE_COLLECTIONS
      : EXPORTABLE_COLLECTIONS.filter((name) => !['accounts', 'students', 'supportTickets', 'auditLogs'].includes(name));
    const sheets = [];
    for (const name of collections) {
      const rows = (await getScopedCollectionRows(name, req)).filter((row) => matchesFilters(row, filters));
      sheets.push({ collection: name, rows, flatRows: rows.map((row) => flattenRecord(row)) });
    }
    return { collection, sheets, rowCount: sheets.reduce((total, sheet) => total + sheet.rows.length, 0) };
  }

  const rows = (await getScopedCollectionRows(collection, req)).filter((row) => matchesFilters(row, filters));
  return { collection, sheets: [{ collection, rows, flatRows: rows.map((row) => flattenRecord(row)) }], rowCount: rows.length };
}

function allHeaders(sheets) {
  const headers = new Set();
  sheets.forEach((sheet) => sheet.flatRows.forEach((row) => Object.keys(row).forEach((key) => headers.add(key))));
  return [...headers];
}

export function renderJsonExport(dataset, metadata) {
  return JSON.stringify({
    institution,
    systemName,
    ...metadata,
    generatedAt: new Date().toISOString(),
    rowCount: dataset.rowCount,
    data: dataset.sheets.length === 1
      ? dataset.sheets[0].rows
      : Object.fromEntries(dataset.sheets.map((sheet) => [sheet.collection, sheet.rows])),
  }, null, 2);
}

export function renderCsvExport(dataset) {
  if (dataset.sheets.length === 1) {
    const [sheet] = dataset.sheets;
    const headers = allHeaders([sheet]);
    return `\ufeff${[headers.map(csvEscape).join(','), ...sheet.flatRows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n')}`;
  }

  const rows = [];
  dataset.sheets.forEach((sheet) => {
    const headers = allHeaders([sheet]);
    rows.push(csvEscape(`Collection: ${sheet.collection}`));
    rows.push(headers.map(csvEscape).join(','));
    rows.push(...sheet.flatRows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')));
    rows.push('');
  });
  return `\ufeff${rows.join('\n')}`;
}

export function renderExcelXmlExport(dataset, metadata) {
  const worksheetXml = dataset.sheets.map((sheet) => {
    const headers = allHeaders([sheet]);
    const headerRow = `<Row>${headers.map((header) => `<Cell><Data ss:Type="String">${htmlEscape(header)}</Data></Cell>`).join('')}</Row>`;
    const bodyRows = sheet.flatRows.map((row) => `<Row>${headers.map((header) => `<Cell><Data ss:Type="String">${htmlEscape(row[header])}</Data></Cell>`).join('')}</Row>`).join('');
    return `<Worksheet ss:Name="${htmlEscape(sheet.collection).slice(0, 31)}"><Table>${headerRow}${bodyRows}</Table></Worksheet>`;
  }).join('');

  const summaryRows = [
    ['Institution', institution],
    ['System', systemName],
    ['Report', metadata.title],
    ['Scope', metadata.scope],
    ['Generated By', metadata.generatedBy],
    ['Generated At', new Date().toISOString()],
    ['Rows', dataset.rowCount],
  ].map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${htmlEscape(cell)}</Data></Cell>`).join('')}</Row>`).join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Summary"><Table>${summaryRows}</Table></Worksheet>
  ${worksheetXml}
</Workbook>`;
}

export function renderHtmlExport(dataset, metadata) {
  const tables = dataset.sheets.map((sheet) => {
    const headers = allHeaders([sheet]);
    return `<h2>${htmlEscape(sheet.collection)}</h2><table><thead><tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join('')}</tr></thead><tbody>${sheet.flatRows.map((row) => `<tr>${headers.map((header) => `<td>${htmlEscape(row[header])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${htmlEscape(metadata.title)}</title><style>
    @page { margin: 18mm; }
    body { color: #172033; font-family: Arial, sans-serif; font-size: 12px; }
    header { border-bottom: 2px solid #1d4ed8; margin-bottom: 16px; padding-bottom: 12px; }
    h1 { font-size: 20px; margin: 8px 0; }
    h2 { font-size: 15px; margin-top: 22px; }
    table { border-collapse: collapse; margin-bottom: 18px; width: 100%; }
    th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
    th { background: #eaf1ff; color: #173b8f; text-transform: uppercase; }
    .meta { color: #475569; display: grid; gap: 4px; }
    .signature { display: flex; gap: 46px; margin-top: 48px; }
    .signature div { border-top: 1px solid #334155; min-width: 190px; padding-top: 6px; text-align: center; }
    @media print { button { display: none; } }
  </style></head><body><button onclick="window.print()">Print Report</button><header><p>${institution}</p><p>${systemName}</p><h1>${htmlEscape(metadata.title)}</h1><div class="meta"><span>Generated: ${new Date().toLocaleString()}</span><span>Generated by: ${htmlEscape(metadata.generatedBy)}</span><span>Scope: ${htmlEscape(metadata.scope)}</span><span>Rows: ${dataset.rowCount}</span></div></header>${tables}<section class="signature"><div>Prepared by</div><div>Reviewed by</div><div>NSTP Director</div></section></body></html>`;
}
