# Bitácora Sprint 2 — Backend completo + Frontend base

**Pareja N°:** P-06  
**Sprint N°:** 2  
**Fecha:** ___________________

---

**Lo que hicimos esta semana:**

Completamos el backend con los endpoints `GET /api/files` (lista los objetos del bucket bajo el prefijo `uploads/`, lee la metadata de etiquetas de cada objeto, y admite filtro por tag como query param) y `DELETE /api/files/{key}` (valida que la key comience con `uploads/` antes de eliminar). Configuramos el CORS del bucket S3 pegando el JSON de `docs/s3-cors.json` en la consola. Creamos el frontend con React 18 + Vite: el componente `UploadForm` con selector de archivo, campo de etiquetas, y barra de progreso real; y el componente `FileList` con tabla de archivos, botón de eliminar con confirmación, y barra de filtros por etiqueta. Verificamos el flujo completo subiendo archivos `.txt` y `.md` con etiquetas y filtrando por ellas.

---

**Problemas encontrados:**



---

**Cómo los resolvimos:**



---

**Usos de IA esta semana:**



---

**Próximos pasos:**

Revisar todos los controles SEC-01 a SEC-10. Ejecutar `pip-audit` y `npm audit`. Preparar el diagrama de arquitectura manuscrito. Completar el reporte de seguridad.

---

**Firmas (ambos integrantes):** &nbsp;&nbsp; __________________________ &nbsp;&nbsp;&nbsp;&nbsp; __________________________

**Firma docente:** &nbsp;&nbsp; __________________________
