import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_test_image(width=100, height=100, color=(100, 150, 200)) -> bytes:
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_model_info():
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "ysfad/openclip-finetune-waste"
    assert data["license"] == "MIT"
    assert data["classes_count"] == 30
    assert "plastic_water_bottles" in data["classes"]
    assert "aluminum_soda_cans" in data["classes"]

def test_reject_without_consent():
    img_bytes = create_test_image()
    response = client.post(
        "/api/v1/classify",
        data={"consent_given": "false"},
        files={"file": ("test.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "consent" in response.json()["detail"].lower()

def test_reject_invalid_mime_type():
    response = client.post(
        "/api/v1/classify",
        data={"consent_given": "true"},
        files={"file": ("test.txt", b"plain text waste", "text/plain")},
    )
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()

def test_classify_valid_image():
    img_bytes = create_test_image(120, 120, color=(20, 180, 50))
    response = client.post(
        "/api/v1/classify",
        data={"consent_given": "true"},
        files={"file": ("waste_bottle.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "ysfad/openclip-finetune-waste"
    assert data["detected_class"] in data["detected_class"]
    assert data["mapped_category"] in ["plastic", "paper_cardboard", "metal", "glass", "organic", "textile", "other"]
    assert 0.0 <= data["raw_confidence_score"] <= 1.0
    assert data["requires_user_confirmation"] is True
    assert "disclaimer" in data
