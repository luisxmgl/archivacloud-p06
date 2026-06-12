# ArchivaCloud P-06 — Portal de Carga de Archivos a Amazon S3

**Pareja:** P-06  
**Integrantes:** 1) ___________________ 2) ___________________  
**Asignatura:** ___________________  
**Docente:** ___________________

---

## Parámetros únicos (Anexo B)

| Campo | Valor |
|-------|-------|
| Tipos de archivo permitidos | TXT, MD |
| Tamaño máximo | 8 MB |
| Nombre del bucket | `archivacloud-p06-2026` |
| Región AWS | `us-east-1` |
| Feature extra | Permitir agregar tags al subir (1 a 3 etiquetas) y filtrar la lista por tag |

---

## Descripción del proyecto

Portal web que permite a clientes de ArchivaCloud SpA subir, listar y eliminar archivos `.txt` y `.md` en Amazon S3, usando el patrón de presigned URLs para que los archivos nunca pasen por el backend. Incluye la feature extra de etiquetado y filtrado por etiquetas.

---

## Arquitectura

```
Browser (React + Vite)
        |
        | (1) POST /api/upload/presigned-url
        v
FastAPI Backend (Python)
        |
        | (2) boto3 genera presigned URL
        v
Amazon S3 (archivacloud-p06-2026, us-east-1)
        ^
        |
        | (3) PUT directo (navegador → S3)
Browser
```

El archivo se sube directamente desde el navegador a S3 mediante una presigned URL. El backend nunca recibe el contenido del archivo, solo genera la URL firmada y valida los metadatos.

---

## Estructura del repositorio

```
archivacloud-p06/
├── backend/
│   ├── main.py              # FastAPI: endpoints presigned URL, list, delete
│   ├── requirements.txt     # Dependencias Python
│   ├── .env.example         # Variables de entorno (sin valores reales)
│   ├── .gitignore
│   └── test_main.py         # Tests unitarios con pytest
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Componente raíz
│   │   ├── api.js           # Funciones de acceso a la API
│   │   ├── index.css        # Estilos globales
│   │   ├── main.jsx         # Punto de entrada React
│   │   └── components/
│   │       ├── UploadForm.jsx   # Formulario de subida con tags
│   │       └── FileList.jsx     # Lista con filtro por tag
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── arquitectura.jpg         # Diagrama manuscrito (requerido)
│   ├── reporte-seguridad.md     # SEC-01 a SEC-10
│   └── declaracion-ia.md        # Anexo A completado
└── README.md
```

---

## Política IAM (mínimo privilegio)

La política IAM usada concede solo las 4 acciones necesarias sobre el bucket específico:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::archivacloud-p06-2026",
        "arn:aws:s3:::archivacloud-p06-2026/*"
      ]
    }
  ]
}
```

Sin comodines (`*`) en acciones ni recursos. Solo el bucket propio.

---

## Configuración CORS del bucket S3

El CORS del bucket permite solicitudes solo desde el frontend local (o el dominio desplegado):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": []
  }
]
```

En producción, reemplazar `http://localhost:5173` por el dominio real del frontend.

---

## Instalación y comandos

### Requisitos previos

- Python 3.10+
- Node.js 18+
- Credenciales AWS (AWS Academy Learner Lab)

### Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales AWS reales
pip install -r requirements.txt
uvicorn main:app --reload
```

El backend queda en `http://localhost:8000`. Documentación automática en `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:8000  (ya está configurado)
npm install
npm run dev
```

El frontend queda en `http://localhost:5173`.

### Tests

```bash
cd backend
pip install pytest httpx
pytest test_main.py -v
```

### Análisis de vulnerabilidades (SEC-09)

```bash
# Backend
pip install pip-audit
pip-audit -r requirements.txt

# Frontend
cd frontend
npm audit
```

Los resultados deben incluirse en `docs/reporte-seguridad.md`.

---

## Feature extra: Tags y filtrado

Al subir un archivo se pueden agregar entre 1 y 3 etiquetas (letras, números, guiones, guión bajo; máx. 30 caracteres cada una). Las etiquetas se almacenan como metadata S3 del objeto. En la lista, aparece una barra de filtros que permite ver solo los archivos de una etiqueta concreta. Al hacer clic en la etiqueta de un archivo en la tabla también se activa el filtro.

---

## Controles de seguridad (resumen)

| ID | Control | Estado |
|----|---------|--------|
| SEC-01 | Secretos fuera del repo (.env en .gitignore) | ✅ |
| SEC-02 | CORS restrictivo (no `*`) | ✅ |
| SEC-03 | Validación de entrada (Pydantic + lista blanca) | ✅ |
| SEC-04 | Límite de tamaño 8 MB en backend y frontend | ✅ |
| SEC-05 | IAM mínimo privilegio (4 acciones, sin comodines) | ✅ |
| SEC-06 | S3 Block Public Access activo | ✅ |
| SEC-07 | Errores sin stack trace expuesto | ✅ |
| SEC-08 | SSE-S3 en reposo | ✅ |
| SEC-09 | pip-audit + npm audit | ✅ |
| SEC-10 | TLS en producción documentado | ✅ |

Ver `docs/reporte-seguridad.md` para el detalle de cada control.
