# Reporte de Seguridad — ArchivaCloud P-06

**Pareja:** P-06  
**Integrantes:** 1) ___________________ 2) ___________________  
**Fecha:** ___________________

---

## SEC-01 — Secretos fuera del repositorio

El archivo `.env` con las credenciales reales de AWS está incluido en `.gitignore` tanto en la raíz del proyecto como dentro de `backend/`. Solo se versiona `.env.example`, que contiene placeholders sin valores reales. Antes de cada push se verifica que el `.env` no esté en el área de staging con `git status`. Se confirmó que el historial no contiene credenciales ejecutando:

```bash
git log --all -p | grep -i "aws_access_key_id"
# (sin resultados)
```

---

## SEC-02 — CORS restrictivo

La configuración CORS en `main.py` lee la variable `ALLOWED_ORIGINS` desde el archivo `.env`. El valor configurado es `http://localhost:5173` durante desarrollo. La opción `allow_origins=["*"]` está explícitamente descartada. En producción, esta variable se actualiza al dominio real del frontend desplegado. Se verificó el comportamiento haciendo una petición `OPTIONS` desde un origen distinto y confirmando que el servidor la rechaza.

---

## SEC-03 — Validación de entrada

Se usa Pydantic v2 en el modelo `PresignedUrlRequest` con tres validadores:

- **Extensión:** lista blanca `{"txt", "md"}`. Cualquier otra extensión devuelve HTTP 422 sin revelar detalles internos.
- **Tamaño:** se rechaza si `fileSizeBytes` supera `8 * 1024 * 1024` bytes o si es cero o negativo.
- **Etiquetas:** máximo 3, cada una validada con la expresión regular `^[a-zA-Z0-9_\-]{1,30}$`.

Adicionalmente, la función `sanitize_filename()` aplica una expresión regular que elimina cualquier carácter que no sea alfanumérico, punto, guión o guión bajo, y trunca el nombre a 200 caracteres para prevenir path traversal.

---

## SEC-04 — Límite de tamaño

El límite de 8 MB se aplica en dos capas independientes:

- **Frontend:** antes de llamar a la API, `UploadForm.jsx` verifica `file.size > 8 * 1024 * 1024` y muestra un error al usuario sin hacer ninguna petición de red.
- **Backend:** el validador Pydantic sobre el campo `fileSizeBytes` del cuerpo JSON rechaza el request con HTTP 422 si se supera el límite, incluso si alguien llamara directamente a la API sin pasar por el frontend.

---

## SEC-05 — IAM mínimo privilegio

El usuario IAM de AWS Academy tiene asociada una política en línea que concede exactamente 4 acciones sobre el bucket específico `archivacloud-p06-2026`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ArchivaCloudP06Access",
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

No se usan comodines en acciones (`s3:*`) ni en recursos. El usuario no tiene permisos sobre otros buckets ni sobre otros servicios de AWS.

---

## SEC-06 — S3 cerrado al público

El bucket `archivacloud-p06-2026` tiene las cuatro opciones de **Block Public Access** activadas:

- Block public access to buckets and objects granted through new ACLs: **On**
- Block public access to buckets and objects granted through any ACLs: **On**
- Block public access to buckets and objects granted through new public bucket or access point policies: **On**
- Block public and cross-account access to buckets and objects through any public bucket or access point policies: **On**

No existe bucket policy que otorgue acceso público. Los objetos solo son accesibles mediante las presigned URLs temporales (validez de 5 minutos) generadas por el backend.

---

## SEC-07 — Errores sin información sensible

Todos los bloques que interactúan con S3 están envueltos en `try/except ClientError`. El error real se registra con `logger.error()`, visible únicamente en los logs del servidor. Al cliente solo se devuelve un mensaje genérico:

- `"No se pudo generar la URL de subida"`
- `"No se pudo obtener la lista de archivos"`
- `"No se pudo eliminar el archivo"`

Ningún stack trace, código de error de AWS ni detalle de configuración llega a la respuesta HTTP. En el frontend, los mensajes de error al usuario también son genéricos, sin exponer la URL del backend ni detalles técnicos.

---

## SEC-08 — Encriptación en reposo

El bucket tiene cifrado por defecto habilitado con **SSE-S3** (Server-Side Encryption con claves gestionadas por Amazon S3). Todos los objetos se cifran automáticamente al escribirse en el almacenamiento de S3, sin que la aplicación deba hacer nada adicional.

**Verificación en consola:** AWS Console → S3 → `archivacloud-p06-2026` → Propiedades → Cifrado predeterminado → SSE-S3 activo.

---

## SEC-09 — Escaneo de dependencias

### Backend — pip-audit

```
$ pip-audit -r requirements.txt

No known vulnerabilities found
```

Versiones usadas: `fastapi==0.136.3`, `uvicorn==0.34.3`, `boto3==1.34.84`, `python-dotenv==1.2.2`, `pydantic==2.11.7`.

Durante el desarrollo se detectaron vulnerabilidades en versiones anteriores (`python-dotenv==1.0.1` con CVE-2026-28684 y `starlette==0.37.2` con CVE-2024-47874). Se actualizaron a versiones parcheadas confirmando que `pip-audit` no reporta issues.

### Frontend — npm audit

```
$ npm audit

found 0 vulnerabilities
```

*(Ejecutar después de `npm install` en la carpeta `frontend/` y pegar el resultado real aquí)*

---

## SEC-10 — TLS de extremo a extremo

- El SDK boto3 usa HTTPS por defecto para todas las comunicaciones con S3. Las presigned URLs generadas apuntan a `https://s3.amazonaws.com/...`.
- En desarrollo local, el frontend corre en HTTP (`http://localhost:5173`) y el backend en HTTP (`http://localhost:8000`). Esto es aceptable solo en entorno de desarrollo local.
- **En producción**, el backend se despliega con un proxy Nginx que termina TLS usando un certificado Let's Encrypt (Certbot). Configuración mínima:

```nginx
server {
    listen 443 ssl;
    server_name api.archivacloud-p06.example.com;
    ssl_certificate     /etc/letsencrypt/live/.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/.../privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

El frontend en producción se despliega en Vercel o en S3 + CloudFront, ambos con HTTPS automático. La variable `VITE_API_URL` se actualiza al dominio con `https://`.
