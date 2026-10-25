import { useState } from "react";
import "./history.css";

const DEFAULT_REVIEW_STATUS = "pending";
const NAME_KEYS = ["column", "column_name", "name"];
const TYPE_KEYS = ["type", "data_type"];

// Same labels as the dictionary view, so review status reads the same in both places.
const REVIEW_LABELS = {
  confirmed: "Confirmed",
  edited: "Edited",
  rejected: "Rejected",
  flagged: "Flagged",
  pending: "Not reviewed",
};

// Returns the first key's value that is neither null nor undefined.
function firstDefinedValue(record, keys, fallback) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }
  return fallback;
}

// Turns any stored value into text that React can render safely.
function toDisplayText(value, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getProfile(file) {
  return Array.isArray(file.profile) ? file.profile : [];
}

function ColumnsTable({ fileId, profile }) {
  return (
    <div className="history-table-wrapper">
      <table className="history-table">
        <thead>
          <tr>
            <th>Column</th>
            <th>Type</th>
            <th>Description</th>
            <th>Review status</th>
          </tr>
        </thead>
        <tbody>
          {profile.map((column, index) => {
            const status = column.review_status || DEFAULT_REVIEW_STATUS;
            return (
              <tr key={`${fileId}-${index}`}>
                <td>
                  {toDisplayText(
                    firstDefinedValue(column, NAME_KEYS, null),
                    "Unnamed"
                  )}
                </td>
                <td>{toDisplayText(firstDefinedValue(column, TYPE_KEYS, null))}</td>
                <td>{toDisplayText(column.description)}</td>
                <td>
                  <span className={`review-status ${status}`}>
                    {REVIEW_LABELS[status] ?? REVIEW_LABELS[DEFAULT_REVIEW_STATUS]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryEntry({ file, isActive, isExpanded, onToggle, onOpen, onDelete }) {
  const profile = getProfile(file);
  const rowCount = toDisplayText(file.data?.row_count_sampled, "—");
  const columnsId = `history-columns-${file.id}`;

  return (
    <div className="history-file">
      <div className="history-file-header">
        <div>
          <h3>{file.filename || "Untitled file"}</h3>
          <p>{file.data?.domain || "No domain specified"}</p>
          <p>
            {rowCount} rows · {profile.length} columns
          </p>
        </div>

        <div className="history-actions">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-controls={columnsId}
          >
            {isExpanded ? "Hide columns" : "Show columns"}
          </button>

          <button type="button" onClick={onOpen}>
            {isActive ? "Currently open" : "Open"}
          </button>

          <button type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div id={columnsId}>
          <ColumnsTable fileId={file.id} profile={profile} />
        </div>
      )}
    </div>
  );
}

function History({ fileHistory, onSelectFile, onDeleteFile, activeFileId }) {
  // Set of file IDs whose column tables are visible.
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const entries = Array.isArray(fileHistory) ? fileHistory : [];

  const toggleExpanded = (id) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <div className="history-empty">
        <h2 className="panelTitle">File History</h2>
        <p className="emptyState">No files uploaded in this session yet.</p>
      </div>
    );
  }

  return (
    <div className="history-container">
    <h2 className="panelTitle">File History</h2>
      <p>Files uploaded during your current session.</p>

      {entries.map((file) => (
        <HistoryEntry
          key={file.id}
          file={file}
          isActive={file.id === activeFileId}
          isExpanded={expandedIds.has(file.id)}
          onToggle={() => toggleExpanded(file.id)}
          onOpen={() => onSelectFile(file.id)}
          onDelete={() => onDeleteFile(file.id)}
        />
      ))}
    </div>
  );
}

export default History;