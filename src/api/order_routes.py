from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from src.api.db import get_db
from src.api.models import (
    SupplierOrder, QualityIncident, InventoryEvent, 
    SupplierFinancialHealth, OrderStatus, QualityIncidentType,
    QualityIncidentSeverity, Supplier, RatingRecalculationLog
)
from src.api.rating_engine import SupplierRatingEngine

router = APIRouter(prefix="/api/orders", tags=["orders"])


class OrderCreate(BaseModel):
    supplier_id: int
    order_number: str
    expected_delivery_date: str  
    item_count: int
    total_value: float
    currency: str = "USD"
    stock_availability_on_order: bool = True

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    actual_delivery_date: Optional[str] = None
    quality_check_passed: Optional[bool] = None
    defect_count: Optional[int] = None
    lead_time_accuracy_days: Optional[int] = None

class QualityIncidentCreate(BaseModel):
    supplier_id: int
    order_id: Optional[int] = None
    incident_type: str
    severity: str
    description: str
    financial_impact: float = 0.0
    items_affected: int = 0

class InventoryEventCreate(BaseModel):
    supplier_id: int
    event_type: str  
    item_description: str
    quantity_affected: int
    expected_availability_date: Optional[str] = None
    days_unavailable: int = 0

class FinancialHealthUpdate(BaseModel):
    supplier_id: int
    credit_score: Optional[int] = None
    credit_rating: Optional[str] = None
    payment_behavior: Optional[str] = None
    annual_revenue: Optional[float] = None
    employee_count: Optional[int] = None
    years_in_business: Optional[int] = None
    bankruptcy_risk: Optional[str] = None
    legal_issues: bool = False
    data_source: str = "MANUAL"



def trigger_score_update(supplier_id: int):
    """
    Background task to recalculate supplier scores.
    Creates its own DB session to avoid session lifecycle issues.
    """
    from src.api.db import SessionLocal
    import traceback
    
    db = SessionLocal()
    try:
        engine = SupplierRatingEngine(db)
        scores = engine.update_all_supplier_scores(supplier_id)
        print(f" [Background] Updated scores for supplier {supplier_id}:")
        print(f"   Delivery: {scores['delivery_score']}")
        print(f"   Quality: {scores['quality_score']}")
        print(f"   Inventory: {scores['inventory_score']}")
        print(f"   Financial: {scores['financial_health_score']}")
    except Exception as e:
        print(f" [Background] Failed to update scores for supplier {supplier_id}: {e}")
        traceback.print_exc()
    finally:
        db.close()



@router.post("/")
def create_order(order: OrderCreate, user_uid: str = Query(...), db: Session = Depends(get_db)):
    """Create a new supplier order"""
    
    supplier = db.query(Supplier).filter(Supplier.id == order.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    existing = db.query(SupplierOrder).filter(
        SupplierOrder.order_number == order.order_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Order number already exists")
    
    try:
        expected_date = datetime.fromisoformat(order.expected_delivery_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO 8601")
    
    db_order = SupplierOrder(
        supplier_id=order.supplier_id,
        user_uid=user_uid,
        order_number=order.order_number,
        order_date=datetime.utcnow(),
        expected_delivery_date=expected_date,
        item_count=order.item_count,
        total_value=order.total_value,
        currency=order.currency,
        stock_availability_on_order=order.stock_availability_on_order,
        status=OrderStatus.PENDING
    )
    
    db.add(db_order)
    supplier.total_orders += 1
    
    db.commit()
    db.refresh(db_order)
    
    return {
        "status": "success",
        "order_id": db_order.id,
        "order_number": db_order.order_number,
        "supplier_id": db_order.supplier_id,
        "expected_delivery": db_order.expected_delivery_date.isoformat()
    }

@router.put("/{order_id}")
def update_order(
    order_id: int,
    update: OrderUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Update order status and trigger score recalculation on delivery"""
    
    order = db.query(SupplierOrder).filter(SupplierOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if update.status:
        order.status = OrderStatus[update.status]
    

    if update.actual_delivery_date:
        try:
           
            actual_date = datetime.fromisoformat(update.actual_delivery_date.replace('Z', '').replace('+00:00', ''))
            order.actual_delivery_date = actual_date
            
            if order.expected_delivery_date:
                delay = (actual_date - order.expected_delivery_date).days
                order.is_on_time = delay <= 0
                order.days_delayed = max(delay, 0)

                
                if order.is_on_time and order.status == OrderStatus.DELIVERED:
                    supplier = db.query(Supplier).filter(Supplier.id == order.supplier_id).first()
                    if supplier:
                        supplier.successful_deliveries += 1
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    if update.quality_check_passed is not None:
        order.quality_check_passed = update.quality_check_passed
    
    if update.defect_count is not None:
        order.defect_count = update.defect_count
    
    if update.lead_time_accuracy_days is not None:
        order.lead_time_accuracy_days = update.lead_time_accuracy_days
    
    db.commit()
    db.refresh(order)
    
    # Trigger score recalculation if delivered
    if order.status == OrderStatus.DELIVERED:
        background_tasks.add_task(trigger_score_update, order.supplier_id)
    
    return {
        "status": "success",
        "order_id": order.id,
        "order_status": order.status.value,
        "is_on_time": order.is_on_time,
        "days_delayed": order.days_delayed,
        "score_update_triggered": order.status == OrderStatus.DELIVERED
    }

@router.get("/supplier/{supplier_id}")
def get_supplier_orders(
    supplier_id: int,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all orders for a supplier"""
    query = db.query(SupplierOrder).filter(SupplierOrder.supplier_id == supplier_id)
    
    if status:
        query = query.filter(SupplierOrder.status == OrderStatus[status])
    
    orders = query.order_by(SupplierOrder.order_date.desc()).limit(limit).all()
    
    return {
        "supplier_id": supplier_id,
        "order_count": len(orders),
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status.value,
                "order_date": o.order_date.isoformat(),
                "expected_delivery": o.expected_delivery_date.isoformat(),
                "actual_delivery": o.actual_delivery_date.isoformat() if o.actual_delivery_date else None,
                "is_on_time": o.is_on_time,
                "days_delayed": o.days_delayed,
                "item_count": o.item_count,
                "total_value": o.total_value
            }
            for o in orders
        ]
    }



@router.post("/quality-incidents")
def create_quality_incident(
    incident: QualityIncidentCreate,
    background_tasks: BackgroundTasks,
    user_uid: str = Query(...),
    db: Session = Depends(get_db)
):
    """Report a quality incident"""
    
    supplier = db.query(Supplier).filter(Supplier.id == incident.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db_incident = QualityIncident(
        supplier_id=incident.supplier_id,
        order_id=incident.order_id,
        user_uid=user_uid,
        incident_type=QualityIncidentType[incident.incident_type],
        severity=QualityIncidentSeverity[incident.severity],
        description=incident.description,
        financial_impact=incident.financial_impact,
        items_affected=incident.items_affected,
        reported_at=datetime.utcnow()
    )
    
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    
    background_tasks.add_task(trigger_score_update, incident.supplier_id)
    
    return {
        "status": "success",
        "incident_id": db_incident.id,
        "supplier_id": db_incident.supplier_id,
        "severity": db_incident.severity.value,
        "score_update_triggered": True
    }

@router.get("/quality-incidents/supplier/{supplier_id}")
def get_supplier_incidents(
    supplier_id: int,
    resolved: Optional[bool] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get quality incidents for a supplier"""
    query = db.query(QualityIncident).filter(QualityIncident.supplier_id == supplier_id)
    
    if resolved is not None:
        query = query.filter(QualityIncident.resolved == resolved)
    
    incidents = query.order_by(QualityIncident.reported_at.desc()).limit(limit).all()
    
    return {
        "supplier_id": supplier_id,
        "incident_count": len(incidents),
        "incidents": [
            {
                "id": i.id,
                "incident_type": i.incident_type.value,
                "severity": i.severity.value,
                "description": i.description,
                "reported_at": i.reported_at.isoformat(),
                "resolved": i.resolved,
                "financial_impact": i.financial_impact,
                "items_affected": i.items_affected
            }
            for i in incidents
        ]
    }

@router.put("/quality-incidents/{incident_id}/resolve")
def resolve_quality_incident(
    incident_id: int,
    resolution_notes: str,
    db: Session = Depends(get_db)
):
    """Mark a quality incident as resolved"""
    incident = db.query(QualityIncident).filter(QualityIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.resolved = True
    incident.resolution_date = datetime.utcnow()
    incident.resolution_notes = resolution_notes
    
    db.commit()
    
    return {"status": "success", "incident_id": incident_id, "resolved": True}


@router.post("/inventory-events")
def create_inventory_event(
    event: InventoryEventCreate,
    background_tasks: BackgroundTasks,
    user_uid: str = Query(...),
    db: Session = Depends(get_db)
):
    """Report an inventory availability event"""
    
    supplier = db.query(Supplier).filter(Supplier.id == event.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    expected_date = None
    if event.expected_availability_date:
        try:
            expected_date = datetime.fromisoformat(event.expected_availability_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    db_event = InventoryEvent(
        supplier_id=event.supplier_id,
        user_uid=user_uid,
        event_type=event.event_type,
        item_description=event.item_description,
        quantity_affected=event.quantity_affected,
        expected_availability_date=expected_date,
        days_unavailable=event.days_unavailable,
        event_date=datetime.utcnow()
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    background_tasks.add_task(trigger_score_update, event.supplier_id)
    
    return {
        "status": "success",
        "event_id": db_event.id,
        "supplier_id": db_event.supplier_id,
        "score_update_triggered": True
    }



@router.post("/financial-health")
def update_financial_health(
    health: FinancialHealthUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Update supplier financial health record"""
    
    supplier = db.query(Supplier).filter(Supplier.id == health.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db_health = SupplierFinancialHealth(
        supplier_id=health.supplier_id,
        credit_score=health.credit_score,
        credit_rating=health.credit_rating,
        payment_behavior=health.payment_behavior,
        annual_revenue=health.annual_revenue,
        employee_count=health.employee_count,
        years_in_business=health.years_in_business,
        bankruptcy_risk=health.bankruptcy_risk,
        legal_issues=health.legal_issues,
        data_source=health.data_source,
        last_updated=datetime.utcnow()
    )
    
    db.add(db_health)
    db.commit()
    db.refresh(db_health)
    
    background_tasks.add_task(trigger_score_update, health.supplier_id)
    
    return {
        "status": "success",
        "supplier_id": db_health.supplier_id,
        "score_update_triggered": True
    }



@router.post("/recalculate-scores/{supplier_id}")
def manual_score_recalculation(supplier_id: int, db: Session = Depends(get_db)):
    """Manually trigger score recalculation for a supplier"""
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    engine = SupplierRatingEngine(db)
    scores = engine.update_all_supplier_scores(supplier_id)
    
    return {
        "status": "success",
        "supplier_id": supplier_id,
        "updated_scores": scores
    }

@router.post("/recalculate-all-scores")
def recalculate_all_supplier_scores(
    background_tasks: BackgroundTasks,
    user_uid: str = Query(...),
    db: Session = Depends(get_db)
):
    """Recalculate scores for all suppliers (background job)"""
    
    def bulk_recalculation():
        from src.api.db import SessionLocal
        import traceback
        
        db_local = SessionLocal()
        start_time = datetime.utcnow()
        
        log = RatingRecalculationLog(
            job_type="MANUAL",
            trigger_event="Manual bulk recalculation",
            started_at=start_time,
            status="IN_PROGRESS"
        )
        db_local.add(log)
        db_local.commit()
        
        try:
            suppliers = db_local.query(Supplier).filter(Supplier.user_uid == user_uid).all()
            engine = SupplierRatingEngine(db_local)
            
            tier_changes = 0
            for supplier in suppliers:
                old_tier = supplier.tier_level
                engine.update_all_supplier_scores(supplier.id)
                db_local.refresh(supplier)
                if supplier.tier_level != old_tier:
                    tier_changes += 1
            
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            
            log.suppliers_processed = len(suppliers)
            log.suppliers_tier_changed = tier_changes
            log.execution_time_seconds = execution_time
            log.completed_at = end_time
            log.status = "COMPLETED"
            db_local.commit()
            
            print(f"Bulk recalculation complete: {len(suppliers)} suppliers, {tier_changes} tier changes")
            
        except Exception as e:
            log.status = "FAILED"
            log.error_message = str(e)
            db_local.commit()
            print(f" Bulk recalculation failed: {e}")
            traceback.print_exc()
        finally:
            db_local.close()
    
    background_tasks.add_task(bulk_recalculation)
    
    return {
        "status": "started",
        "message": "Bulk score recalculation started in background"
    }
