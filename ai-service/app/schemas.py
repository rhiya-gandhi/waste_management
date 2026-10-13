from pydantic import BaseModel
from typing import Optional, List

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    architecture: str
    license: str
    source_repository: str
    classes_count: int
    classes: List[str]
    disclaimer: str

class ClassificationResult(BaseModel):
    model_name: str
    model_version: str
    detected_class: str
    mapped_category: str
    raw_confidence_score: float
    is_mixed: bool
    contamination_assessment: str
    consent_acknowledged: bool
    requires_user_confirmation: bool
    disclaimer: str
