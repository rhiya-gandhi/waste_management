import logging
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .classifier import classifier_instance, WASTE_CLASSES_30
from .schemas import ModelInfoResponse, ClassificationResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wasteroute_api")

app = FastAPI(
    title="WasteRoute AI Image Classification Service",
    description="Inference API using ysfad/openclip-finetune-waste with honest scoring and consent verification.",
    version="1.0.0",
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "wasteroute-ai-service", "version": "1.0.0"}

@app.get("/api/v1/model-info", response_model=ModelInfoResponse)
def get_model_info():
    return ModelInfoResponse(
        model_name=classifier_instance.model_name,
        model_version=classifier_instance.model_version,
        architecture=classifier_instance.architecture,
        license="MIT",
        source_repository="https://huggingface.co/ysfad/openclip-finetune-waste",
        classes_count=len(WASTE_CLASSES_30),
        classes=WASTE_CLASSES_30,
        disclaimer=(
            "Model scores are raw cosine similarities and must not be interpreted as calibrated probabilities. "
            "General vision models cannot verify polymer resin codes, toxic chemical contamination, or specific recycling facility requirements."
        ),
    )

@app.post("/api/v1/classify", response_model=ClassificationResult)
async def classify_waste_image(
    file: UploadFile = File(...),
    consent_given: bool = Form(...),
):
    # 1. Enforce explicit user consent
    if not consent_given:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit user consent is required before processing waste photographs.",
        )

    # 2. Validate MIME type
    valid_content_types = ["image/jpeg", "image/png", "image/webp", "image/bmp"]
    if file.content_type not in valid_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image MIME type: {file.content_type}. Supported: JPEG, PNG, WEBP, BMP.",
        )

    # 3. Read image bytes and validate size
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file contents: {str(e)}",
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if len(contents) > 10 * 1024 * 1024: # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum permitted limit of 10MB.",
        )

    # 4. Perform classification
    try:
        result = classifier_instance.classify(contents)
        return ClassificationResult(**result)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err),
        )
    except Exception as err:
        logger.error(f"Inference error: {str(err)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error during image analysis.",
        )
