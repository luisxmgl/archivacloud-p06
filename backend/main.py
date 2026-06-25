import os
import re
import uuid
import logging
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="ArchivaCloud P-06", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "archivacloud-p06-2026")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ALLOWED_EXTENSIONS = {"txt", "md"}
MAX_SIZE_MB = 8
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
UPLOAD_PREFIX = "uploads/"
VALID_TAG_RE = re.compile(r"^[a-zA-Z0-9_\-]{1,30}$")


def get_s3_client():
    return boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    )


# Import the boto3 library to interact with AWS services
# pip install boto3
def upload_dynamodb(data):
    # Create a session using your AWS credentials
    session = boto3.Session(
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
        region_name=os.getenv("AWS_REGION", "us-east-1")
    )
    # Initialize a DynamoDB resource
    dynamodb = session.resource('dynamodb')
    # Reference the DynamoDB table
    table = dynamodb.Table('database_dynamo')

    # Upload the data to the DynamoDB table
    for item in data:
        id_tabla = item['id_tabla']
        nombre = item['nombre_proyecto']
        descripcion = item['descripcion']
        # Put the item into the DynamoDB table
        table.put_item(
            # Define the item to be inserted
            Item={
                'id_tabla': id_tabla,
                'nombre_proyecto': nombre,
                'descripcion': descripcion
            }
        )
    print("Data uploaded successfully to DynamoDB.")


def sanitize_filename(name: str) -> str:
    name = re.sub(r"[^\w\.\-]", "_", name)
    name = re.sub(r"\.{2,}", ".", name)
    return name[:200]


class PresignedUrlRequest(BaseModel):
    fileName: str
    fileType: str
    fileSizeBytes: int
    tags: Optional[list[str]] = []

    @field_validator("fileName")
    @classmethod
    def validate_filename(cls, v: str) -> str:
        ext = v.rsplit(".", 1)[-1].lower() if "." in v else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Tipo de archivo no permitido. Solo: {', '.join(ALLOWED_EXTENSIONS).upper()}")
        return v

    @field_validator("fileSizeBytes")
    @classmethod
    def validate_size(cls, v: int) -> int:
        if v > MAX_SIZE_BYTES:
            raise ValueError(f"El archivo supera el limite de {MAX_SIZE_MB} MB")
        if v <= 0:
            raise ValueError("Tamano de archivo invalido")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list) -> list:
        if len(v) > 3:
            raise ValueError("Se permiten maximo 3 etiquetas")
        for tag in v:
            if not VALID_TAG_RE.match(tag):
                raise ValueError(f"Etiqueta invalida: '{tag}'")
        return [t.lower().strip() for t in v]


@app.get("/healthz")
def health_check():
    return {"status": "ok", "service": "archivacloud-p06"}


@app.post("/api/upload/presigned-url")
def create_presigned_url(body: PresignedUrlRequest):
    safe_name = sanitize_filename(body.fileName)
    ext = safe_name.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")

    key = f"{UPLOAD_PREFIX}{safe_name}"
    tags_value = ",".join(body.tags) if body.tags else ""

    s3 = get_s3_client()
    try:
        presigned_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": body.fileType,
                "ContentLength": body.fileSizeBytes,
                "Metadata": {"tags": tags_value},
            },
            ExpiresIn=300,
        )
    except ClientError as e:
        logger.error("Error generando presigned URL: %s", e)
        raise HTTPException(status_code=500, detail="No se pudo generar la URL de subida")

    # Guardar registro en DynamoDB usando el patron de la profesora
    try:
        data_to_upload = [
            {
                'id_tabla': str(uuid.uuid4()),
                'nombre_proyecto': safe_name,
                'descripcion': f"Archivo subido - tags: {tags_value or 'ninguna'} - fecha: {datetime.utcnow().isoformat()}"
            }
        ]
        upload_dynamodb(data_to_upload)
    except Exception as e:
        logger.error("Error guardando en DynamoDB: %s", e)

    return {
        "presignedUrl": presigned_url,
        "key": key,
        "tags": body.tags,
    }


@app.get("/api/files")
def list_files(tag: Optional[str] = None):
    s3 = get_s3_client()
    try:
        paginator = s3.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix=UPLOAD_PREFIX)

        files = []
        for page in pages:
            for obj in page.get("Contents", []):
                file_key = obj["Key"]
                if file_key == UPLOAD_PREFIX:
                    continue

                try:
                    head = s3.head_object(Bucket=BUCKET_NAME, Key=file_key)
                    raw_tags = head.get("Metadata", {}).get("tags", "")
                    tags = [t for t in raw_tags.split(",") if t]
                except ClientError:
                    tags = []

                if tag and tag.lower() not in tags:
                    continue

                files.append({
                    "key": file_key,
                    "name": file_key.replace(UPLOAD_PREFIX, "", 1),
                    "size": obj["Size"],
                    "lastModified": obj["LastModified"].isoformat(),
                    "tags": tags,
                })

        return {"files": files, "count": len(files)}

    except ClientError as e:
        logger.error("Error listando archivos: %s", e)
        raise HTTPException(status_code=500, detail="No se pudo obtener la lista de archivos")


@app.get("/api/registros")
def list_registros():
    """Lista todos los registros guardados en DynamoDB."""
    try:
        session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
            region_name=os.getenv("AWS_REGION", "us-east-1")
        )
        dynamodb = session.resource('dynamodb')
        table = dynamodb.Table('database_dynamo')
        response = table.scan()
        return {"registros": response.get("Items", []), "count": response.get("Count", 0)}
    except ClientError as e:
        logger.error("Error consultando DynamoDB: %s", e)
        raise HTTPException(status_code=500, detail="No se pudo obtener los registros")


@app.delete("/api/files/{key:path}")
def delete_file(key: str = Path(...)):
    if not key.startswith(UPLOAD_PREFIX):
        raise HTTPException(status_code=400, detail="Ruta de archivo invalida")

    s3 = get_s3_client()
    try:
        s3.delete_object(Bucket=BUCKET_NAME, Key=key)
        logger.info("Archivo eliminado: %s", key)
        return {"message": "Archivo eliminado correctamente", "key": key}
    except ClientError as e:
        logger.error("Error eliminando archivo: %s", e)
        raise HTTPException(status_code=500, detail="No se pudo eliminar el archivo")
