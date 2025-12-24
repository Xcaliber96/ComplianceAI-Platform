
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime


ALLOWED_FILE_TYPES = [
    'Policy',
    'Regulation',
    'Evidence',
    'Training material',
    'Contract',
    'Financial record',
    'HR document',
    'Other'
]

ALLOWED_DEPARTMENTS = [
    'HR',
    'Finance',
    'Compliance',
    'Operations',
    'IT',
    'Legal',
    'Other'
]

ALLOWED_USED_FOR = [
    'Internal audit',
    'Supplier audit',
    'Regulatory inspection',
    'Customer audit',
    'Process validation'
]

ALLOWED_RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical']

class FileUploadValidation(BaseModel):
    file_type: str
    department: str
    used_for: str
    
    @validator('file_type')
    def validate_file_type(cls, v):
        if v not in ALLOWED_FILE_TYPES:
            raise ValueError(f'file_type must be one of: {", ".join(ALLOWED_FILE_TYPES)}')
        return v
    
    @validator('department')
    def validate_department(cls, v):
        if v not in ALLOWED_DEPARTMENTS:
            raise ValueError(f'department must be one of: {", ".join(ALLOWED_DEPARTMENTS)}')
        return v
    
    @validator('used_for')
    def validate_used_for(cls, v):
        if v not in ALLOWED_USED_FOR:
            raise ValueError(f'used_for must be one of: {", ".join(ALLOWED_USED_FOR)}')
        return v


class ComplianceCheckValidation(BaseModel):
    file_id: str = Field(..., min_length=1)
    regulation_ids: List[str] = Field(..., min_items=1)
    supplier_id: Optional[str] = None
    
    @validator('file_id')
    def validate_file_id(cls, v):
        if not v.strip():
            raise ValueError('file_id cannot be empty')
        return v
    
    @validator('regulation_ids')
    def validate_regulation_ids(cls, v):
        if not v:
            raise ValueError('At least one regulation must be selected')
        if len(v) > 20:
            raise ValueError('Maximum 20 regulations can be checked at once')
        return v


def validate_file_size(file_size: int, max_size_mb: int = 50) -> bool:
    """Validate file size doesn't exceed maximum"""
    max_bytes = max_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise ValueError(f'File size exceeds maximum of {max_size_mb}MB')
    return True


def validate_file_extension(filename: str, allowed_extensions: List[str] = None) -> bool:
    """Validate file has allowed extension"""
    if allowed_extensions is None:
        allowed_extensions = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.csv']
    
    import os
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        raise ValueError(f'File type {ext} not allowed. Allowed types: {", ".join(allowed_extensions)}')
    return True
