from sqlalchemy.orm import Session
from sqlalchemy import text
from src.api.models import Supplier, SupplierTier, SupplierPerformanceLog, RestrictedCountry, supplier_backup_association
from datetime import datetime
from typing import Optional, List

def calculate_tier_score(supplier: Supplier) -> float:
    """
    Calculate composite tier score from individual metrics.
    Weights: Quality 30%, Delivery 25%, Inventory 20%, Financial 15%, Compliance 10%
    """
    weights = {
        'quality': 0.30,
        'delivery': 0.25,
        'inventory': 0.20,
        'financial': 0.15,
        'compliance': 0.10
    }
    
    score = (
        supplier.quality_score * weights['quality'] +
        supplier.delivery_score * weights['delivery'] +
        supplier.inventory_score * weights['inventory'] +
        supplier.financial_health_score * weights['financial'] +
        supplier.compliance_score * weights['compliance']
    )
    
    return round(score, 2)

def assign_tier_level(tier_score: float) -> SupplierTier:
    """Assign tier based on composite score"""
    if tier_score >= 80:
        return SupplierTier.TIER_1
    elif tier_score >= 60:
        return SupplierTier.TIER_2
    elif tier_score >= 40:
        return SupplierTier.TIER_3
    else:
        return SupplierTier.UNRATED

def recalculate_supplier_tier(db: Session, supplier_id: int, reason: str = "Scheduled review"):
    """Recalculate and update supplier tier"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        return None
    
    # Calculate new scores
    new_score = calculate_tier_score(supplier)
    new_tier = assign_tier_level(new_score)
    
    # Log performance snapshot
    log = SupplierPerformanceLog(
        supplier_id=supplier.id,
        quality_score=supplier.quality_score,
        delivery_score=supplier.delivery_score,
        inventory_score=supplier.inventory_score,
        financial_health_score=supplier.financial_health_score,
        compliance_score=supplier.compliance_score,
        tier_score=new_score,
        tier_level=new_tier,
        event_type="tier_recalculation",
        notes=reason
    )
    db.add(log)
    
    # Update supplier
    supplier.tier_score = new_score
    supplier.tier_level = new_tier
    supplier.tier_last_updated = datetime.utcnow()
    supplier.tier_change_reason = reason
    supplier.last_rating_update = datetime.utcnow()
    
    db.commit()
    db.refresh(supplier)
    
    return supplier

def get_backup_suppliers(db: Session, primary_supplier_id: int) -> List[Supplier]:
    """Get all backup suppliers for a primary supplier, ordered by priority"""
    primary = db.query(Supplier).filter(Supplier.id == primary_supplier_id).first()
    if not primary:
        return []
    
    return sorted(primary.backups, key=lambda s: s.tier_score, reverse=True)

def check_restricted_country(db: Session, country_code: str) -> bool:
    """Check if a country is restricted"""
    restriction = db.query(RestrictedCountry).filter(
        RestrictedCountry.country_code == country_code,
        RestrictedCountry.is_active == True
    ).first()
    
    return restriction is not None

def promote_backup_supplier(db: Session, failed_supplier_id: int, task_id: Optional[int] = None):
    """
    When a primary supplier fails, promote the best backup supplier.
    Returns the promoted supplier.
    """
    failed_supplier = db.query(Supplier).filter(Supplier.id == failed_supplier_id).first()
    if not failed_supplier:
        return None
    
    backups = get_backup_suppliers(db, failed_supplier_id)
    
    if not backups:
        return None
    
    # Select best backup
    promoted = None
    for backup in backups:
        if backup.status.value == "ACTIVE" and not backup.is_restricted_country:
            promoted = backup
            break
    
    if not promoted:
        return None
    
    # Reassign task if provided
    if task_id:
        from src.api.models import RemediationTask
        task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
        if task:
            task.supplier_id = promoted.id
            db.commit()
    
    return promoted
