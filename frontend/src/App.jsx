import { useState, useEffect, useCallback } from "react";
import { listFiles } from "./api.js";
import UploadForm from "./components/UploadForm.jsx";
import FileList from "./components/FileList.jsx";

export default function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [activeTag, setActiveTag] = useState(null);

  const fetchFiles = useCallback(async (tag = activeTag) => {
    setLoading(true);
    setListError(false);
    try {
      const data = await listFiles(tag);
      setFiles(data.files);
    } catch {
      setListError(true);
    } finally {
      setLoading(false);
    }
  }, [activeTag]);

  useEffect(() => {
    fetchFiles(activeTag);
  }, [activeTag]);

  function handleTagFilter(tag) {
    setActiveTag(tag);
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.logo}>☁ ArchivaCloud</h1>
          <span style={styles.badge}>P-06 · TXT/MD · 8 MB</span>
        </div>
      </header>

      <main style={styles.main}>
        <UploadForm onUploadSuccess={() => fetchFiles(activeTag)} />
        <FileList
          files={files}
          loading={loading}
          error={listError}
          activeTag={activeTag}
          onTagFilter={handleTagFilter}
          onRefresh={() => fetchFiles(activeTag)}
        />
      </main>

      <footer style={styles.footer}>
        ArchivaCloud SpA — Pareja 06 — Evaluación de Desarrollo
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f5f5f5",
  },
  header: {
    background: "#1a73e8",
    color: "#fff",
    padding: "0 24px",
    height: 56,
    display: "flex",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,.2)",
  },
  headerInner: {
    maxWidth: 900,
    width: "100%",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" },
  badge: {
    background: "rgba(255,255,255,.2)",
    borderRadius: 20,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 500,
  },
  main: {
    flex: 1,
    maxWidth: 900,
    width: "100%",
    margin: "0 auto",
    padding: "32px 24px",
  },
  footer: {
    textAlign: "center",
    padding: 16,
    fontSize: 12,
    color: "#9aa0a6",
    borderTop: "1px solid #e0e0e0",
  },
};
