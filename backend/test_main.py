import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_presigned_url_invalid_extension():
    payload = {
        "fileName": "archivo.pdf",
        "fileType": "application/pdf",
        "fileSizeBytes": 1024,
        "tags": [],
    }
    response = client.post("/api/upload/presigned-url", json=payload)
    assert response.status_code == 422


def test_presigned_url_file_too_large():
    payload = {
        "fileName": "notas.txt",
        "fileType": "text/plain",
        "fileSizeBytes": 9 * 1024 * 1024,  # 9MB > 8MB limit
        "tags": [],
    }
    response = client.post("/api/upload/presigned-url", json=payload)
    assert response.status_code == 422


def test_presigned_url_too_many_tags():
    payload = {
        "fileName": "notas.txt",
        "fileType": "text/plain",
        "fileSizeBytes": 1024,
        "tags": ["tag1", "tag2", "tag3", "tag4"],
    }
    response = client.post("/api/upload/presigned-url", json=payload)
    assert response.status_code == 422


def test_presigned_url_valid_md():
    with patch("main.get_s3_client") as mock_s3:
        mock_client = MagicMock()
        mock_client.generate_presigned_url.return_value = "https://s3.amazonaws.com/fake-url"
        mock_s3.return_value = mock_client

        payload = {
            "fileName": "readme.md",
            "fileType": "text/markdown",
            "fileSizeBytes": 2048,
            "tags": ["trabajo", "notas"],
        }
        response = client.post("/api/upload/presigned-url", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "presignedUrl" in data
        assert data["tags"] == ["trabajo", "notas"]


def test_delete_invalid_key():
    response = client.delete("/api/files/etc/passwd")
    assert response.status_code == 400


def test_list_files():
    with patch("main.get_s3_client") as mock_s3:
        mock_client = MagicMock()
        paginator_mock = MagicMock()
        paginator_mock.paginate.return_value = [
            {"Contents": []}
        ]
        mock_client.get_paginator.return_value = paginator_mock
        mock_s3.return_value = mock_client

        response = client.get("/api/files")
        assert response.status_code == 200
        assert "files" in response.json()
