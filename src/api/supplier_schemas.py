from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SupplierTierEnum(str, Enum):
    TIER_1 = "TIER_1"
    TIER_2 = "TIER_2"
    TIER_3 = "TIER_3"
    UNRATED = "UNRATED"

class SupplierStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    UNDER_REVIEW = "UNDER_REVIEW"
    INACTIVE = "INACTIVE"

class SupplierRatingUpdate(BaseModel):
    quality_score: Optional[float] = Field(None, ge=0, le=100)
    delivery_score: Optional[float] = Field(None, ge=0, le=100)
    inventory_score: Optional[float] = Field(None, ge=0, le=100)
    financial_health_score: Optional[float] = Field(None, ge=0, le=100)
    compliance_score: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None

class SupplierCreate(BaseModel):
    name: str
    email: str
    industry: Optional[str] = None
    region: Optional[str] = None
    country: str
    tariff_code: Optional[str] = None

class SupplierResponse(BaseModel):
    id: int
    name: str
    email: str
    tier_level: SupplierTierEnum
    tier_score: float
    status: SupplierStatusEnum
    quality_score: float
    delivery_score: float
    inventory_score: float
    financial_health_score: float
    compliance_score: float
    is_restricted_country: bool
    country: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class BackupSupplierAssignment(BaseModel):
    primary_supplier_id: int
    backup_supplier_id: int
    backup_priority: int = Field(1, ge=1, le=10)

class TierRecalculation(BaseModel):
    supplier_id: int
    reason: Optional[str] = "Scheduled tier review"
