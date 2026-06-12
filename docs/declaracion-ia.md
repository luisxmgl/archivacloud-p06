# Anexo A — Declaración detallada de uso de IA

**Pareja:** P-06  
**Integrantes:** 1) ___________________ 2) ___________________  
**Fecha:** ___________________

---

| # | Fecha | Herramienta | Prompt usado (textual) | Cómo se validó la respuesta |
|---|-------|-------------|------------------------|-----------------------------|
| 1 | ___ | Claude (claude.ai) | "Explícame cómo funciona el patrón de presigned URLs en S3 y por qué el archivo no pasa por el backend" | Se leyó la documentación oficial de AWS (docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html) y se comprobó que la explicación era consistente con ella. Se probó el flujo real con un archivo de prueba. |
| 2 | ___ | Claude (claude.ai) | "Tengo este error en FastAPI al configurar CORS: [pegar traceback]. ¿Qué está mal?" | Se identificó el origen del error en la documentación de FastAPI (fastapi.tiangolo.com/tutorial/cors). Se corrigió y se probó desde el navegador verificando las cabeceras de respuesta con las DevTools. |
| 3 | ___ | Claude (claude.ai) | "¿Cómo guardo metadata en un objeto S3 al usar generate_presigned_url con boto3?" | Se verificó contra la documentación de boto3 (boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html). Se probó subiendo un archivo y leyendo la metadata con head_object desde la consola de Python. |
| 4 | ___ | Claude (claude.ai) | "Ayúdame a entender qué hace field_validator en Pydantic v2 y cómo es diferente a v1" | Se revisó la documentación oficial de Pydantic v2 (docs.pydantic.dev/latest/concepts/validators). Se escribió el validador a mano después de entender el concepto, no se copió directamente. |
| 5 | ___ | Claude (claude.ai) | "¿Cuál es la diferencia entre SSE-S3 y SSE-KMS en Amazon S3?" | Se comparó con la documentación de AWS sobre cifrado en S3. Se eligió SSE-S3 por ser suficiente para el caso de uso y estar disponible sin costo adicional en AWS Academy. |
| 6 | ___ | Claude (claude.ai) | "¿Cómo hago que axios muestre el progreso de subida de un archivo?" | Se revisó la documentación de axios (axios-http.com/docs/req_config) para el parámetro onUploadProgress. Se implementó en UploadForm.jsx y se verificó visualmente que la barra de progreso funcionara correctamente. |

---

Declaración firmada: ambos integrantes confirmamos que la información anterior es completa y verdadera. Todo el código entregado fue revisado, entendido y adaptado a los parámetros específicos de la Pareja P-06 por ambos integrantes.

**Firmas:**

__________________________ &nbsp;&nbsp;&nbsp;&nbsp; __________________________
