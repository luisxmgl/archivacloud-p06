import { useState } from "react";
import { listFiles, deleteFile, formatBytes, formatDate } from "../api.js";

export default function FileList({ files, loading, error, activeTag, onTagFilter, onRefresh }) {
  const [deletingKey, setDeletingKey] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(file) {
    if (!window.confirm(`¿Eliminar "${file.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingKey(file.key);
    setDeleteError("");
    try {
      await deleteFile(file.key);
      onRefresh();
    } catch (err) {
      setDeleteError("No se pudo eliminar el archivo. Intenta de nuevo.");
    } finally {
      setDeletingKey(null);
    }
  }

  // Collect all unique tags across files for filter bar
  const allTags = [...new Set(files.flatMap((f) => f.tags))].sort();

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Archivos subidos ({files.length})</h2>
        <button onClick={onRefresh} style={styles.btnRefresh} title="Actualizar lista">
          ↻ Actualizar
        </button>
      </div>

      {allTags.length > 0 && (
        <div style={styles.filterBar}>
          <span style={styles.filterLabel}>Filtrar por etiqueta:</span>
          <button
            onClick={() => onTagFilter(null)}
            style={activeTag === null ? styles.filterBtnActive : styles.filterBtn}
          >
            Todas
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagFilter(tag === activeTag ? null : tag)}
              style={tag === activeTag ? styles.filterBtnActive : styles.filterBtn}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {deleteError && <p style={styles.error}>{deleteError}</p>}

      {loading ? (
        <p style={styles.muted}>Cargando archivos…</p>
      ) : error ? (
        <p style={styles.error}>No se pudo cargar la lista de archivos.</p>
      ) : files.length === 0 ? (
        <p style={styles.muted}>
          {activeTag ? `No hay archivos con la etiqueta "${activeTag}".` : "No hay archivos subidos aún."}
        </p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Tamaño</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Etiquetas</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.key} style={styles.tr}>
                  <td style={styles.td}>
                    <span title={file.name} style={styles.fileName}>{file.name}</span>
                  </td>
                  <td style={{ ...styles.td, color: "#5f6368" }}>{formatBytes(file.size)}</td>
                  <td style={{ ...styles.td, color: "#5f6368", whiteSpace: "nowrap" }}>
                    {formatDate(file.lastModified)}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.tagList}>
                      {file.tags.length > 0
                        ? file.tags.map((t) => (
                            <span
                              key={t}
                              style={styles.tag}
                              onClick={() => onTagFilter(t === activeTag ? null : t)}
                              title={`Filtrar por "${t}"`}
                            >
                              {t}
                            </span>
                          ))
                        : <span style={styles.noTag}>—</span>}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={deletingKey === file.key}
                      style={styles.btnDelete}
                      title="Eliminar archivo"
                    >
                      {deletingKey === file.key ? "…" : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,.12)",
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: 600 },
  btnRefresh: { background: "#f1f3f4", color: "#202124", fontWeight: 500 },
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  filterLabel: { fontSize: 13, color: "#5f6368", fontWeight: 500 },
  filterBtn: {
    background: "#f1f3f4",
    color: "#5f6368",
    padding: "4px 12px",
    fontSize: 12,
    borderRadius: 20,
  },
  filterBtnActive: {
    background: "#1a73e8",
    color: "#fff",
    padding: "4px 12px",
    fontSize: 12,
    borderRadius: 20,
  },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e0e0e0",
    fontSize: 12,
    fontWeight: 600,
    color: "#5f6368",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tr: { borderBottom: "1px solid #f1f3f4" },
  td: { padding: "10px 12px", verticalAlign: "middle" },
  fileName: {
    display: "block",
    maxWidth: 240,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 500,
  },
  tagList: { display: "flex", flexWrap: "wrap", gap: 4 },
  tag: {
    background: "#e8f0fe",
    color: "#1a73e8",
    borderRadius: 20,
    padding: "2px 8px",
    fontSize: 12,
    cursor: "pointer",
    userSelect: "none",
  },
  noTag: { color: "#bdbdbd" },
  btnDelete: {
    background: "#fce8e6",
    color: "#d93025",
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
  },
  error: { color: "#d93025", fontSize: 13, marginBottom: 8 },
  muted: { color: "#5f6368", fontStyle: "italic" },
};
