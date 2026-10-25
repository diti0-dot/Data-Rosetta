import { useEffect, useState } from "react";
import { Check, Flag, Pencil, X } from "lucide-react";
import BouncingDotsLoader from "../common/BouncingDotsLoader.jsx";
import ExportDictionary from "../export/export.jsx";
import History from "../history/History.jsx";
import "./upload.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
const UPLOAD_ENDPOINT = `${API_BASE_URL}/uploadfile`;
const GENERIC_ERROR = "Something went wrong. Please try again.";

const STORAGE_KEYS = {
  fileHistory: "fileHistory",
  activeFileId: "activeFileId",
};

const SECTIONS = {
  DICTIONARY: "dictionary",
  EXPORT: "export",
  HISTORY: "history",
  LEARN_MORE: "learn-more",
};

const NAV_ITEMS = [
  { id: SECTIONS.DICTIONARY, label: "Dictionary" },
  { id: SECTIONS.EXPORT, label: "Export" },
  { id: SECTIONS.HISTORY, label: "History" },
  { id: SECTIONS.LEARN_MORE, label: "Learn More" },
];

const REVIEW_LABELS = {
  confirmed: "Confirmed",
  edited: "Edited",
  rejected: "Rejected",
  flagged: "Flagged",
  pending: "Not reviewed",
};

const DEFAULT_REVIEW_STATUS = "pending";

/* ---------- storage helpers ---------- */

// sessionStorage can be unavailable or hold corrupt JSON; never let that crash the UI.
function readStoredJson(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch (err) {
    const isQuota =
      err &&
      (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        err.code === 22 ||
        err.code === 1014);

    console.warn(
      isQuota ? "Storage is full; history was not saved." : "Could not save to storage.",
      err
    );
    return false;
  }
}

/* ---------- pure helpers ---------- */

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `file-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function normaliseProfile(profile) {
  return profile.map((column) => ({
    ...column,
    review_status: column.review_status || DEFAULT_REVIEW_STATUS,
  }));
}

function countWithStatus(columns, status) {
  return columns.filter((column) => column.review_status === status).length;
}

// FastAPI returns `detail` as a string or as an array of validation objects.
function extractErrorMessage(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg).filter(Boolean);
    if (messages.length) return messages.join(", ");
  }
  return GENERIC_ERROR;
}

async function uploadDataFile(file) {
  const formData = new FormData();
  formData.append("file_upload", file);

  let response;
  try {
    response = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: formData });
  } catch {
    throw new Error("Could not reach the server");
  }

  // The body may not be JSON (e.g. a proxy error page), so parse defensively.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data?.detail));
  }
  if (!data || !Array.isArray(data.profile)) {
    throw new Error("Unexpected response from the server");
  }
  return data;
}

/* ---------- small UI pieces ---------- */

function IconButton({ title, onClick, children }) {
  return (
    <button type="button" className="reviewAction" title={title} onClick={onClick}>
      {children}
    </button>
  );
}

function DescriptionEditor({ draft, onDraftChange, onSave, onCancel }) {
  return (
    <div className="descriptionEditor">
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Enter a description..."
        rows={3}
      />
      <div className="reviewActions">
        <IconButton title="Save description" onClick={onSave}>
          <Check />
        </IconButton>
        <IconButton title="Cancel editing" onClick={onCancel}>
          <X />
        </IconButton>
      </div>
    </div>
  );
}

function DescriptionView({ description, onConfirm, onEdit, onReject, onFlag }) {
  return (
    <div className="descriptionCell">
      <span>{description || "Undefined"}</span>
      <div className="reviewActions">
        <IconButton title="Confirm description" onClick={onConfirm}>
          <Check />
        </IconButton>
        <IconButton title="Edit description" onClick={onEdit}>
          <Pencil />
        </IconButton>
        <IconButton title="Reject description" onClick={onReject}>
          <X />
        </IconButton>
        <IconButton title="Flag for review" onClick={onFlag}>
          <Flag />
        </IconButton>
      </div>
    </div>
  );
}

/* ---------- dictionary table ---------- */

// Rendered with key={activeFileId} by the parent, so local edit state resets per file.
function DictionaryTable({ columns, onUpdateColumn }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState("");

  const beginEdit = (index, description) => {
    setEditingIndex(index);
    setDraft(description ?? "");
  };

  const endEdit = () => {
    setEditingIndex(null);
    setDraft("");
  };

  const saveEdit = (index) => {
    onUpdateColumn(index, { description: draft.trim(), review_status: "edited" });
    endEdit();
  };

  return (
    <div className="tableScroll">
      <table className="dictTable">
        <thead>
          <tr>
            <th>Column</th>
            <th>Type</th>
            <th>Null %</th>
            <th>Unique</th>
            <th>Min</th>
            <th>Max</th>
            <th>Samples</th>
            <th>Description</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column, index) => {
            const status = column.review_status || DEFAULT_REVIEW_STATUS;
            return (
              <tr key={`${column.name}-${index}`}>
                <td className="colName">{column.name}</td>
                <td>
                  <span className="typeBadge">{column.inferred_type}</span>
                </td>
                <td>{column.null_percent}%</td>
                <td>{column.unique_count}</td>
                <td>{column.min ?? "-"}</td>
                <td>{column.max ?? "-"}</td>
                <td className="samples">
                  {(column.sample_values ?? []).slice(0, 3).map((sample, i) => (
                    <span key={i} className="chip">
                      {String(sample)}
                    </span>
                  ))}
                </td>
                <td className="desc">
                  {editingIndex === index ? (
                    <DescriptionEditor
                      draft={draft}
                      onDraftChange={setDraft}
                      onSave={() => saveEdit(index)}
                      onCancel={endEdit}
                    />
                  ) : (
                    <DescriptionView
                      description={column.description}
                      onConfirm={() => onUpdateColumn(index, { review_status: "confirmed" })}
                      onEdit={() => beginEdit(index, column.description)}
                      onReject={() =>
                        onUpdateColumn(index, { description: "", review_status: "rejected" })
                      }
                      onFlag={() => onUpdateColumn(index, { review_status: "flagged" })}
                    />
                  )}
                </td>
                <td className="notesCell">
                  <span className={`reviewStatus ${status}`}>
                    {REVIEW_LABELS[status] ?? REVIEW_LABELS[DEFAULT_REVIEW_STATUS]}
                  </span>
                  <textarea
                    value={column.notes || ""}
                    onChange={(event) => onUpdateColumn(index, { notes: event.target.value })}
                    placeholder="Add a note (optional)"
                    rows={2}
                    aria-label={`Notes for ${column.name}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DictionaryPanel({
  profileData,
  columns,
  confirmedCount,
  flaggedCount,
  activeFileId,
  onUpdateColumn,
}) {
  if (!profileData?.file_name?.trim()) {
    return (
      <div className="splitView">
        <section className="panel leftPanel">
          <div className="panelHeader">
            <h2 className="panelTitle">Data Dictionary</h2>
          </div>
          <p className="emptyState">Upload data to generate a data dictionary.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="splitView">
      <section className="panel leftPanel">
        <div className="panelHeader">
          <h2 className="panelTitle">Data Dictionary</h2>
          <div className="datasetMeta">
            <span>{profileData.file_name}</span>
            <span>{profileData.column_count} columns</span>
            <span>{profileData.row_count_sampled} rows sampled</span>
            <span>Confirmed: {confirmedCount}</span>
            <span>Flagged: {flaggedCount}</span>
          </div>
        </div>
        <DictionaryTable key={activeFileId} columns={columns} onUpdateColumn={onUpdateColumn} />
      </section>
    </div>
  );
}

/* ---------- domain context panel ---------- */

function LearnMorePanel({ profileData }) {
  if (!profileData?.file_name?.trim()) {
    return (
      <div className="splitView">
        <section className="panel leftPanel">
          <div className="panelHeader">
            <h2 className="panelTitle">Domain Context</h2>
          </div>
          <p className="emptyState">Upload file to generate domain context.</p>
        </section>
      </div>
    );
  }

  const experts = profileData.experts ?? [];
  const resources = profileData.resources ?? [];

  return (
    <div>
      <h2>Domain Context</h2>
      <div className="splitView">
        <section className="panel leftPanel">
          {profileData.ai_failed && (
            <div className="aiWarning">
              {profileData.ai_error || "AI enrichment is temporarily unavailable."}
            </div>
          )}

          <div className="contextSection">
            <p className="domainTag">{profileData.domain ?? "Unknown"}</p>
            {profileData.domain_review && <p className="review">{profileData.domain_review}</p>}
          </div>

          <h3>Experts</h3>
          <ul className="expertList">
            {experts.map((expert, i) => (
              <li key={i}>
                <strong>{expert.name}</strong>
                {expert.role && <span className="role"> · {expert.role}</span>}
                {expert.expertise && <p>{expert.expertise}</p>}
              </li>
            ))}
          </ul>

          <div className="contextSection">
            <h3>Resources</h3>
            {resources.length ? (
              <ul className="resourceList">
                {resources.map((resource, i) => (
                  <li key={i}>
                    <div className="resourceHeader">
                      <strong>{resource.title}</strong>
                      {resource.type && <span className="chip small">{resource.type}</span>}
                    </div>
                    {resource.summary && <p className="resourceSummary">{resource.summary}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No resources suggested.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- main component ---------- */

function AddFileForm() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] = useState(SECTIONS.DICTIONARY);
  const [isUploading, setIsUploading] = useState(false);

  const [fileHistory, setFileHistory] = useState(() =>
    readStoredJson(STORAGE_KEYS.fileHistory, [])
  );
  const [activeFileId, setActiveFileId] = useState(() =>
    readStoredJson(STORAGE_KEYS.activeFileId, null)
  );

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.fileHistory, fileHistory);
  }, [fileHistory]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.activeFileId, activeFileId);
  }, [activeFileId]);

  // Single source of truth: the active profile is derived from history.
  const activeEntry = fileHistory.find((entry) => entry.id === activeFileId) ?? null;
  const profileData = activeEntry?.data ?? null;
  const panelProfile = profileData ?? {};
  const columns = profileData?.profile ?? [];
  const confirmedCount = countWithStatus(columns, "confirmed");
  const flaggedCount = countWithStatus(columns, "flagged");

  const updateColumn = (index, updates) => {
    if (!activeFileId) return;

    const applyUpdate = (column, i) => (i === index ? { ...column, ...updates } : column);

    setFileHistory((previous) =>
      previous.map((entry) => {
        if (entry.id !== activeFileId) return entry;
        const profile = (entry.data?.profile ?? []).map(applyUpdate);
        return {
          ...entry,
          profile,
          data: { ...entry.data, profile },
        };
      })
    );
  };

  const handleFileInputChange = (event) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate before touching the current view, so an empty submit doesn't wipe it.
    if (!selectedFile) {
      setErrorMessage("Please choose a file first");
      return;
    }

    setErrorMessage("");
    setActiveFileId(null);
    setIsUploading(true);

    try {
      const data = await uploadDataFile(selectedFile);
      const profile = normaliseProfile(data.profile);
      const enrichedData = { ...data, profile };

      const newEntry = {
        id: createId(),
        filename: data.file_name,
        uploadedAt: new Date().toISOString(),
        data: enrichedData,
        profile,
      };

      setFileHistory((previous) => [...previous, newEntry]);
      setActiveFileId(newEntry.id);
    } catch (error) {
      setErrorMessage(error.message || GENERIC_ERROR);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectHistoryFile = (id) => {
    if (!fileHistory.some((entry) => entry.id === id)) return;
    setActiveFileId(id);
    setActiveSection(SECTIONS.DICTIONARY);
  };

  const handleDeleteHistoryFile = (id) => {
    setFileHistory((previous) => previous.filter((entry) => entry.id !== id));
    if (activeFileId === id) setActiveFileId(null);
  };

  return (
    <div className="uploadContainer">
      <div className="uploadControls">
        <div className="uploadCard">
          <form onSubmit={handleSubmit} className="uploadForm">
            <input
              type="file"
              id="dataFileInput"
              aria-label="Choose a data file"
              onChange={handleFileInputChange}
              className="fileInput"
            />
            <p className="fileHint">CSV, TSV, Excel, JSON, or Parquet format</p>
            <button type="submit" className="uploadBtn" disabled={isUploading}>
              Upload
            </button>
          </form>

          {errorMessage && (
            <p className="errorMsg" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      <nav className="navbar_buttons">
        <div className="navbar-inner_buttons">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {isUploading && (
        <div className="loadingOverlay">
          <BouncingDotsLoader />
        </div>
      )}

      {activeSection === SECTIONS.DICTIONARY && (
        <DictionaryPanel
          profileData={panelProfile}
          columns={columns}
          confirmedCount={confirmedCount}
          flaggedCount={flaggedCount}
          activeFileId={activeFileId}
          onUpdateColumn={updateColumn}
        />
      )}

      {activeSection === SECTIONS.EXPORT && <ExportDictionary profileData={profileData} />}

      {activeSection === SECTIONS.HISTORY && (
        <History
          fileHistory={fileHistory}
          onSelectFile={handleSelectHistoryFile}
          onDeleteFile={handleDeleteHistoryFile}
          activeFileId={activeFileId}
        />
      )}

      {activeSection === SECTIONS.LEARN_MORE && <LearnMorePanel profileData={panelProfile} />}
    </div>
  );
}

export default AddFileForm;