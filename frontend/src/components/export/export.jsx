import { useId, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import "./export.css";

// Each export column lists the profile keys it may appear under, in priority order.
// "Notes" is intentionally excluded.
const EXPORT_COLUMNS = [
  { header: "Column", keys: ["column", "column_name", "name"] },
  { header: "Type", keys: ["type", "data_type"] },
  { header: "Null %", keys: ["null_percentage", "null_percent", "null_pct"] },
  { header: "Unique", keys: ["unique", "unique_count", "unique_values"] },
  { header: "Min", keys: ["min", "min_value"] },
  { header: "Max", keys: ["max", "max_value"] },
  { header: "Samples", keys: ["samples", "sample_values"] },
  { header: "Description", keys: ["description"] },
];

const FORMATS = {
  csv: {
    label: "CSV",
    previewTitle: "CSV Preview",
    filename: "data_dictionary.csv",
    build: buildCsvBlob,
  },
  xlsx: {
    label: "Excel (.xlsx)",
    previewTitle: "Excel Preview",
    filename: "data_dictionary.xlsx",
    build: buildXlsxBlob,
  },
  docx: {
    label: "Word (.docx)",
    previewTitle: "Word Preview",
    filename: "data_dictionary.docx",
    build: buildDocxBlob,
  },
  json: {
    label: "JSON",
    previewTitle: "JSON Preview",
    filename: "data_dictionary.json",
    build: buildJsonBlob,
    previewAsJson: true,
  },
};

const DEFAULT_FORMAT = "csv";
const PREVIEW_ROW_LIMIT = 500;
const MIN_COLUMN_WIDTH = 12;
const MAX_COLUMN_WIDTH = 60;

/* ---------- data shaping ---------- */

function findPresentKey(record, candidateKeys) {
  return candidateKeys.find((key) => Object.hasOwn(record, key));
}

// Flattens a cell value into something spreadsheet and text formats can hold.
function normaliseCell(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function buildExportTable(columns) {
  const headers = EXPORT_COLUMNS.map((column) => column.header);

  const rows = columns.map((column) =>
    EXPORT_COLUMNS.map(({ keys }) => {
      const key = findPresentKey(column, keys);
      return key === undefined ? "" : normaliseCell(column[key]);
    })
  );

  // Named records, used for JSON output.
  const records = rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]]))
  );

  return { headers, rows, records };
}

/* ---------- format builders ---------- */

function escapeCsvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// Characters that make a spreadsheet treat a cell as a formula. Tab and carriage
// return are included because some apps strip them and then evaluate what follows.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

// Prefixing with an apostrophe makes Excel and Sheets show the text instead of running it.
// Only strings are changed, so real numbers such as -5 are left alone.
function neutraliseFormula(value) {
  return typeof value === "string" && FORMULA_TRIGGER.test(value)
    ? `'${value}`
    : value;
}

// The BOM makes Excel open UTF-8 CSV files with the correct encoding.
function buildCsvBlob({ headers, rows }) {
  const lines = [headers, ...rows].map((line) =>
    line.map((cell) => escapeCsvCell(neutraliseFormula(cell))).join(",")
  );
  return new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
}

function buildJsonBlob({ records }) {
  return new Blob([JSON.stringify(records, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
}

function buildColumnWidths(headers, rows) {
  return headers.map((header, index) => {
    let width = Math.max(MIN_COLUMN_WIDTH, header.length);
    // A loop avoids the argument-count limits of spreading large arrays into Math.max.
    for (const row of rows) {
      width = Math.max(width, String(row[index]).length);
    }
    return { wch: Math.min(width, MAX_COLUMN_WIDTH) };
  });
}

function buildXlsxBlob({ headers, rows }) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = buildColumnWidths(headers, rows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dictionary");

  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function makeDocxCell(value, { bold = false } = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(value), bold })],
      }),
    ],
  });
}

async function buildDocxBlob({ headers, rows }) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((header) => makeDocxCell(header, { bold: true })),
  });

  const bodyRows = rows.map(
    (row) => new TableRow({ children: row.map((value) => makeDocxCell(value)) })
  );

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Data Dictionary",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `${rows.length} rows, ${headers.length} columns`,
          }),
          new Table({
            rows: [headerRow, ...bodyRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(document);
}

/* ---------- browser download ---------- */

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Delay revocation so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- UI pieces ---------- */

function PreviewTable({ headers, rows }) {
  return (
    <div className="export-table-wrapper">
      <table className="export-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, colIndex) => (
                <td key={colIndex}>{String(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExportPreview({ format, table }) {
  const rowCount = table.rows.length;
  const isTruncated = rowCount > PREVIEW_ROW_LIMIT;

  return (
    <div className="export-preview">
      <h3 className="export-preview-title">{format.previewTitle}</h3>

      <p className="export-preview-meta">
        {rowCount} rows · {table.headers.length} columns
        {isTruncated && ` (showing first ${PREVIEW_ROW_LIMIT})`}
      </p>

      {format.previewAsJson ? (
        <pre className="export-json-preview">
          {JSON.stringify(table.records.slice(0, PREVIEW_ROW_LIMIT), null, 2)}
        </pre>
      ) : (
        <PreviewTable
          headers={table.headers}
          rows={table.rows.slice(0, PREVIEW_ROW_LIMIT)}
        />
      )}
    </div>
  );
}

/* ---------- main component ---------- */

function ExportDictionary({ profileData }) {
  const [formatId, setFormatId] = useState(DEFAULT_FORMAT);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const selectId = useId();

  const table = useMemo(
    () => buildExportTable(profileData?.profile ?? []),
    [profileData]
  );
  const hasRows = table.rows.length > 0;
  const format = FORMATS[formatId];

  const handleFormatChange = (event) => {
    setFormatId(event.target.value);
    setIsPreviewVisible(false);
    setDownloadError("");
  };

  const handlePreview = () => {
    setDownloadError("");
    setIsPreviewVisible(true);
  };

  const handleDownload = async () => {
    if (!hasRows || isBuilding) return;

    setDownloadError("");
    setIsBuilding(true);

    try {
      const blob = await format.build(table);
      triggerDownload(blob, format.filename);
    } catch (error) {
      console.error("Export failed:", error);
      setDownloadError(
        "Could not generate the file. Check the browser console for details."
      );
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="export-section">
      <h2 className="export-title">Export dictionary</h2>
      <p className="export-lead">
        Choose a format to preview and download your data dictionary.
      </p>

      <label htmlFor={selectId} className="export-label">
        Export format
      </label>

      <select
        id={selectId}
        className="export-select"
        value={formatId}
        onChange={handleFormatChange}
        disabled={!hasRows}
      >
        {Object.entries(FORMATS).map(([id, option]) => (
          <option key={id} value={id}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="export-actions">
        <button
          type="button"
          className="export-btn export-btn-outline"
          onClick={handlePreview}
          disabled={!hasRows}
        >
          Preview
        </button>

        <button
          type="button"
          className="export-btn"
          onClick={handleDownload}
          disabled={!hasRows || isBuilding}
        >
          {isBuilding ? "Preparing…" : "Download"}
        </button>
      </div>

      {downloadError && (
        <p role="alert" className="export-error">
          {downloadError}
        </p>
      )}

      {isPreviewVisible && hasRows && (
        <ExportPreview format={format} table={table} />
      )}
    </div>
  );
}

export default ExportDictionary;