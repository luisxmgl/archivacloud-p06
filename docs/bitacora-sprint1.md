# Bitácora Sprint 1 — Setup + Backend mínimo

**Pareja N°:** P-06  
**Sprint N°:** 1  
**Fecha:** ___________________

---

**Lo que hicimos esta semana:**

Creamos el repositorio en GitHub y lo configuramos con la estructura de carpetas `backend/`, `frontend/` y `docs/`. Creamos el bucket S3 `archivacloud-p06-2026` en `us-east-1` desde la consola de AWS Academy, activando Block Public Access y cifrado SSE-S3 por defecto. Configuramos el usuario IAM con política de mínimo privilegio con solo las cuatro acciones necesarias sobre el bucket. Implementamos y probamos el endpoint `POST /api/upload/presigned-url` en FastAPI, verificando que rechaza archivos que no sean `.txt` o `.md` y que superan los 8 MB, y que genera correctamente la URL firmada para archivos válidos.

---

**Problemas encontrados:**



---

**Cómo los resolvimos:**



---

**Usos de IA esta semana:**



---

**Próximos pasos:**

Implementar los endpoints `GET /api/files` y `DELETE /api/files/{key}`. Configurar el CORS del bucket S3. Iniciar el frontend con React + Vite.

---

**Firmas (ambos integrantes):** &nbsp;&nbsp; __________________________ &nbsp;&nbsp;&nbsp;&nbsp; __________________________

**Firma docente:** &nbsp;&nbsp; __________________________
