import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL });

export async function getPresignedUrl(fileName, fileType, fileSizeBytes, tags = []) {
  const res = await api.post("/api/upload/presigned-url", {
    fileName,
    fileType,
    fileSizeBytes,
    tags,
  });
  return res.data;
}

export async function uploadToS3(presignedUrl, file, onProgress) {
  await axios.put(presignedUrl, file, {
    headers: { "Content-Type": file.type || "application/octet-stream" },
    onUploadProgress: (e) => {
      if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}

export async function listFiles(tag = null) {
  const params = tag ? { tag } : {};
  const res = await api.get("/api/files", { params });
  return res.data;
}

export async function deleteFile(key) {
  const res = await api.delete(`/api/files/${encodeURIComponent(key)}`);
  return res.data;
}

export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
