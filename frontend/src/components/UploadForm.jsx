import { useState, useRef } from "react";
import { getPresignedUrl, uploadToS3 } from "../api.js";

const ALLOWED_EXTENSIONS = ["txt", "md"];
const MAX_SIZE_MB = 8;
const MAX_TAGS = 3;

export default function UploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef();

  function handleFileChange(e) {
    const selected = e.target.files[0];
    setError("");
    setSuccess("");
    if (!selected) return;

    const ext = selected.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Solo se permiten archivos ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}.`);
      inputRef.current.value = "";
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_SIZE_MB} MB.`);
      inputRef.current.value = "";
      return;
    }
    setFile(selected);
  }

  function addTag(e) {
    e.preventDefault();
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tags.length >= MAX_TAGS) {
      setError("Máximo 3 etiquetas permitidas.");
      return;
    }
    if (!/^[a-z0-9_-]{1,30}$/.test(t)) {
      setError("Etiqueta inválida: solo letras, números, guiones y guiones bajos (máx. 30 caracteres).");
      return;
    }
    if (tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags([...tags, t]);
    setTagInput("");
    setError("");
  }

  function removeTag(tag) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError("Selecciona un archivo primero.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    setProgress(0);

    try {
      const { presignedUrl } = await getPresignedUrl(
        file.name,
        file.type || "text/plain",
        file.size,
        tags
      );
      await uploadToS3(presignedUrl, file, setProgress);
      setSuccess(`"${file.name}" subido correctamente.`);
      setFile(null);
      setTags([]);
      setProgress(0);
      inputRef.current.value = "";
      onUploadSuccess();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "No se pudo completar la subida. Intenta de nuevo.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Subir archivo</h2>

      <form onSubmit={handleUpload} style={styles.form}>
        <label style={styles.label}>Archivo (TXT o MD, máx. 8 MB)</label>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md"
          onChange={handleFileChange}
          style={styles.fileInput}
        />

        {file && (
          <p style={styles.fileInfo}>
            {file.name} — {(file.size / 1024).toFixed(1)} KB
          </p>
        )}

        <label style={styles.label}>
          Etiquetas (hasta 3) — presiona Enter para agregar
        </label>
        <div style={styles.tagRow}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag(e)}
            placeholder="ej: trabajo"
            style={styles.tagInput}
            disabled={tags.length >= MAX_TAGS}
          />
          <button
            onClick={addTag}
            type="button"
            disabled={tags.length >= MAX_TAGS}
            style={styles.btnSecondary}
          >
            Agregar
          </button>
        </div>

        {tags.length > 0 && (
          <div style={styles.tagList}>
            {tags.map((t) => (
              <span key={t} style={styles.tag}>
                {t}
                <button
                  onClick={() => removeTag(t)}
                  type="button"
                  style={styles.tagRemove}
                  aria-label={`Quitar etiqueta ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {uploading && (
          <div style={styles.progressWrapper}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            <span style={styles.progressLabel}>{progress}%</span>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.successMsg}>{success}</p>}

        <button
          type="submit"
          disabled={uploading || !file}
          style={styles.btnPrimary}
        >
          {uploading ? "Subiendo..." : "Subir"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,.12)",
    padding: 24,
    marginBottom: 24,
  },
  title: { fontSize: 18, fontWeight: 600, marginBottom: 16 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  label: { fontWeight: 500, color: "#5f6368", fontSize: 13 },
  fileInput: { padding: "6px 0" },
  fileInfo: { color: "#5f6368", fontSize: 13 },
  tagRow: { display: "flex", gap: 8 },
  tagInput: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    outline: "none",
  },
  tagList: { display: "flex", flexWrap: "wrap", gap: 8 },
  tag: {
    background: "#e8f0fe",
    color: "#1a73e8",
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  tagRemove: {
    background: "none",
    color: "#1a73e8",
    padding: "0 2px",
    fontSize: 16,
    lineHeight: 1,
    borderRadius: "50%",
  },
  progressWrapper: {
    position: "relative",
    height: 20,
    background: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "#1a73e8",
    transition: "width 0.2s ease",
  },
  progressLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 12,
    lineHeight: "20px",
    color: "#fff",
    fontWeight: 600,
  },
  error: { color: "#d93025", fontSize: 13 },
  successMsg: { color: "#137333", fontSize: 13 },
  btnPrimary: {
    background: "#1a73e8",
    color: "#fff",
    padding: "10px 20px",
    fontWeight: 600,
    alignSelf: "flex-start",
  },
  btnSecondary: {
    background: "#e8f0fe",
    color: "#1a73e8",
    fontWeight: 600,
  },
};
