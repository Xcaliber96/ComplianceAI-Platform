from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from src.api.db import get_db
from src.api.auth_backend import get_current_user 
from src.api.models import User 
from src.api.models import (
    Supplier, SupplierTier, SupplierStatus, SupplierPerformanceLog,
    RestrictedCountry, supplier_backup_association
)
from src.api.supplier_logic import (
    calculate_tier_score, assign_tier_level, recalculate_supplier_tier,
    get_backup_suppliers, check_restricted_country, promote_backup_supplier
)


router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])



from pydantic import BaseModel, Field


class SupplierCreate(BaseModel):
    name: str
    email: str
    industry: Optional[str] = None
    region: Optional[str] = None
    country: str
    tariff_code: Optional[str] = None


class SupplierRatingUpdate(BaseModel):
    quality_score: Optional[float] = Field(None, ge=0, le=100)
    delivery_score: Optional[float] = Field(None, ge=0, le=100)
    inventory_score: Optional[float] = Field(None, ge=0, le=100)
    financial_health_score: Optional[float] = Field(None, ge=0, le=100)
    compliance_score: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class BackupSupplierAssignment(BaseModel):
    primary_supplier_id: int
    backup_supplier_id: int
    backup_priority: int = Field(1, ge=1, le=10)


class SupplierResponse(BaseModel):
    id: int
    name: str
    email: str
    tier_level: str
    tier_score: float
    status: str
    quality_score: float
    delivery_score: float
    inventory_score: float
    financial_health_score: float
    compliance_score: float
    is_restricted_country: bool
    country: Optional[str]
    
    class Config:
        from_attributes = True


@router.post("/", response_model=SupplierResponse)
def create_supplier(
    supplier: SupplierCreate,
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Create a new supplier with automatic tier assignment"""
    
 
    user_uid = current_user.uid
    
    # Check if country is restricted
    is_restricted = check_restricted_country(db, supplier.country)
    
    # Create supplier
    db_supplier = Supplier(
        name=supplier.name,
        email=supplier.email,
        industry=supplier.industry,
        region=supplier.region,
        country=supplier.country,
        tariff_code=supplier.tariff_code,
        user_uid=user_uid,
        is_restricted_country=is_restricted,
        created_at=datetime.utcnow(),
        last_updated=datetime.utcnow(),
        tier_level=SupplierTier.UNRATED,
        status=SupplierStatus.ACTIVE
    )
    
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    
    return db_supplier


@router.get("/", response_model=List[SupplierResponse])
def list_suppliers(
    current_user: User = Depends(get_current_user), 
    tier: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all suppliers with optional filtering by tier and status"""
    
    user_uid = current_user.uid
    
    query = db.query(Supplier).filter(Supplier.user_uid == user_uid)
    
    if tier:
        query = query.filter(Supplier.tier_level == tier)
    if status:
        query = query.filter(Supplier.status == status)
    
    suppliers = query.order_by(Supplier.tier_score.desc()).offset(skip).limit(limit).all()
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Get detailed supplier information"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_uid == current_user.uid  
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}/rating")
def update_supplier_rating(
    supplier_id: int,
    rating: SupplierRatingUpdate,
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Update supplier performance ratings and recalculate tier"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_uid == current_user.uid  
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Update scores if provided
    if rating.quality_score is not None:
        supplier.quality_score = rating.quality_score
    if rating.delivery_score is not None:
        supplier.delivery_score = rating.delivery_score
    if rating.inventory_score is not None:
        supplier.inventory_score = rating.inventory_score
    if rating.financial_health_score is not None:
        supplier.financial_health_score = rating.financial_health_score
    if rating.compliance_score is not None:
        supplier.compliance_score = rating.compliance_score
    
    # Recalculate tier
    supplier = recalculate_supplier_tier(db, supplier_id, rating.notes or "Manual rating update")
    
    return {
        "status": "success",
        "supplier_id": supplier_id,
        "new_tier": supplier.tier_level.value,
        "new_tier_score": supplier.tier_score
    }


@router.post("/recalculate-tier/{supplier_id}")
def recalculate_tier(
    supplier_id: int,
    reason: str = "Manual tier recalculation",
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Manually trigger tier recalculation for a supplier"""
    
    supplier_check = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_uid == current_user.uid
    ).first()
    
    if not supplier_check:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    supplier = recalculate_supplier_tier(db, supplier_id, reason)
    
    return {
        "status": "success",
        "supplier_id": supplier_id,
        "tier_level": supplier.tier_level.value,
        "tier_score": supplier.tier_score,
        "updated_at": supplier.tier_last_updated
    }


@router.post("/backup-assignment")
def assign_backup_supplier(
    assignment: BackupSupplierAssignment,
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Assign a backup supplier to a primary supplier"""
    
  
    primary = db.query(Supplier).filter(
        Supplier.id == assignment.primary_supplier_id,
        Supplier.user_uid == current_user.uid
    ).first()
    
    backup = db.query(Supplier).filter(
        Supplier.id == assignment.backup_supplier_id,
        Supplier.user_uid == current_user.uid
    ).first()
    
    if not primary or not backup:
        raise HTTPException(status_code=404, detail="Primary or backup supplier not found")
    
    
    existing = db.query(supplier_backup_association).filter(
        supplier_backup_association.c.primary_supplier_id == assignment.primary_supplier_id,
        supplier_backup_association.c.backup_supplier_id == assignment.backup_supplier_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Backup relationship already exists")
    
    
    stmt = supplier_backup_association.insert().values(
        primary_supplier_id=assignment.primary_supplier_id,
        backup_supplier_id=assignment.backup_supplier_id,
        backup_priority=assignment.backup_priority,
        created_at=datetime.utcnow()
    )
    db.execute(stmt)
    db.commit()
    
    return {
        "status": "success",
        "primary_supplier": primary.name,
        "backup_supplier": backup.name,
        "backup_priority": assignment.backup_priority
    }


@router.get("/{supplier_id}/backups")
def get_supplier_backups(
    supplier_id: int,
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Get all backup suppliers for a primary supplier"""
    
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_uid == current_user.uid
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    backups = get_backup_suppliers(db, supplier_id)
    
    return {
        "supplier_id": supplier_id,
        "backup_count": len(backups),
        "backups": [
            {
                "id": b.id,
                "name": b.name,
                "tier_level": b.tier_level.value,
                "tier_score": b.tier_score,
                "status": b.status.value,
                "country": b.country
            }
            for b in backups
        ]
    }


@router.post("/{supplier_id}/promote-backup")
def promote_backup(
    supplier_id: int,
    task_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Promote the best backup supplier when primary fails"""
    
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_uid == current_user.uid
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    promoted = promote_backup_supplier(db, supplier_id, task_id)
    
    if not promoted:
        raise HTTPException(
            status_code=404, 
            detail="No suitable backup supplier found"
        )
    
    return {
        "status": "success",
        "failed_supplier_id": supplier_id,
        "promoted_supplier": {
            "id": promoted.id,
            "name": promoted.name,
            "tier_level": promoted.tier_level.value,
            "tier_score": promoted.tier_score
        },
        "task_reassigned": task_id is not None
    }


@router.get("/{supplier_id}/performance-history")
def get_performance_history(
    supplier_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Get historical performance logs for a supplier"""
  
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_uid == current_user.uid
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    logs = db.query(SupplierPerformanceLog).filter(
        SupplierPerformanceLog.supplier_id == supplier_id
    ).order_by(SupplierPerformanceLog.recorded_at.desc()).limit(limit).all()
    
    return {
        "supplier_id": supplier_id,
        "log_count": len(logs),
        "history": [
            {
                "recorded_at": log.recorded_at,
                "tier_level": log.tier_level.value,
                "tier_score": log.tier_score,
                "quality_score": log.quality_score,
                "delivery_score": log.delivery_score,
                "event_type": log.event_type,
                "notes": log.notes
            }
            for log in logs
        ]
    }


@router.get("/tier-distribution/stats")
def get_tier_distribution(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get distribution of suppliers across tiers"""
    
    suppliers = db.query(Supplier).filter(Supplier.user_uid == current_user.uid).all()
    
    tier_counts = {
        "TIER_1": 0,
        "TIER_2": 0,
        "TIER_3": 0,
        "UNRATED": 0
    }
    
    for s in suppliers:
        tier_counts[s.tier_level.value] += 1
    
    return {
        "total_suppliers": len(suppliers),
        "tier_distribution": tier_counts,
        "average_tier_score": sum(s.tier_score for s in suppliers) / len(suppliers) if suppliers else 0
    }
