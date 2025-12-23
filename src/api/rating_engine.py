from sqlalchemy.orm import Session
from sqlalchemy import func
from src.api.models import (
    Supplier, SupplierOrder, QualityIncident, InventoryEvent,
    SupplierFinancialHealth, OrderStatus, QualityIncidentSeverity
)
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class SupplierRatingEngine:
    """
    Automatically calculates supplier performance scores based on historical data
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_delivery_score(self, supplier_id: int, lookback_days: int = 90) -> float:
        """
        Calculate delivery score based on on-time delivery rate
        Score: 100 * (on-time deliveries / total deliveries)
        """
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
        
        
        orders = self.db.query(SupplierOrder).filter(
            SupplierOrder.supplier_id == supplier_id,
            SupplierOrder.status == OrderStatus.DELIVERED,
            SupplierOrder.order_date >= cutoff_date
        ).all()
        
        if not orders:
            return 0.0  
        
        on_time_count = sum(1 for o in orders if o.is_on_time)
        total_count = len(orders)
        
        
        total_delay_days = sum(o.days_delayed for o in orders if o.days_delayed > 0)
        avg_delay = total_delay_days / total_count if total_count > 0 else 0
        
        
        base_score = (on_time_count / total_count) * 100
        
        # Apply delay penalty (max 20 points)
        delay_penalty = min(avg_delay * 2, 20)
        
        final_score = max(base_score - delay_penalty, 0)
        
        logger.info(f"Delivery score for supplier {supplier_id}: {final_score:.2f} "
                   f"({on_time_count}/{total_count} on-time, avg delay: {avg_delay:.1f} days)")
        
        return round(final_score, 2)
    
    def calculate_quality_score(self, supplier_id: int, lookback_days: int = 90) -> float:
        """
        Calculate quality score based on incident rate and severity
        Score: 100 - (weighted incident penalty)
        """
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
        
        
        total_orders = self.db.query(func.count(SupplierOrder.id)).filter(
            SupplierOrder.supplier_id == supplier_id,
            SupplierOrder.order_date >= cutoff_date
        ).scalar() or 0
        
        if total_orders == 0:
            return 50.0  
        
        
        incidents = self.db.query(QualityIncident).filter(
            QualityIncident.supplier_id == supplier_id,
            QualityIncident.reported_at >= cutoff_date
        ).all()
        
        if not incidents:
            return 100.0  # Perfect score
        
        
        severity_weights = {
            QualityIncidentSeverity.LOW: 2,
            QualityIncidentSeverity.MEDIUM: 5,
            QualityIncidentSeverity.HIGH: 10,
            QualityIncidentSeverity.CRITICAL: 20
        }
        
        total_penalty = sum(severity_weights.get(inc.severity, 5) for inc in incidents)
        
        
        incident_rate = len(incidents) / total_orders
        
        
        final_score = max(100 - total_penalty - (incident_rate * 50), 0)
        
        logger.info(f"Quality score for supplier {supplier_id}: {final_score:.2f} "
                   f"({len(incidents)} incidents over {total_orders} orders)")
        
        return round(final_score, 2)
    
    def calculate_inventory_score(self, supplier_id: int, lookback_days: int = 90) -> float:
        """
        Calculate inventory reliability score based on stock-outs and lead time accuracy
        """
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
        
        # Get inventory events
        events = self.db.query(InventoryEvent).filter(
            InventoryEvent.supplier_id == supplier_id,
            InventoryEvent.event_date >= cutoff_date
        ).all()
        
        # Get delivered orders
        orders = self.db.query(SupplierOrder).filter(
            SupplierOrder.supplier_id == supplier_id,
            SupplierOrder.status == OrderStatus.DELIVERED,
            SupplierOrder.order_date >= cutoff_date
        ).all()
        
        if not orders:
            return 50.0  
        
        
        accurate_orders = sum(1 for o in orders if o.lead_time_accuracy_days is not None 
                            and abs(o.lead_time_accuracy_days) <= 2) # within 2 days
        lead_time_accuracy_rate = (accurate_orders / len(orders)) * 100
        
        
        stockout_penalty = len([e for e in events if "STOCK_OUT" in e.event_type]) * 5
        
        final_score = max(lead_time_accuracy_rate - stockout_penalty, 0)
        
        logger.info(f"Inventory score for supplier {supplier_id}: {final_score:.2f} "
                   f"({accurate_orders}/{len(orders)} accurate deliveries, {len(events)} stockout events)")
        
        return round(final_score, 2)
    
    def calculate_financial_health_score(self, supplier_id: int) -> float:
        """
        Calculate financial health score from latest financial record
        """
        financial_record = self.db.query(SupplierFinancialHealth).filter(
            SupplierFinancialHealth.supplier_id == supplier_id
        ).order_by(SupplierFinancialHealth.last_updated.desc()).first()
        
        if not financial_record:
            return 50.0  
        
        score = 50.0  # Base score
        
        # Credit score contribution
        if financial_record.credit_score:
            
            normalized = ((financial_record.credit_score - 300) / 550) * 100
            score += normalized * 0.5
        
        # Years in business bonus
        if financial_record.years_in_business:
            years_bonus = min(financial_record.years_in_business * 2, 20)
            score += years_bonus
        
        # Bankruptcy risk penalty
        if financial_record.bankruptcy_risk:
            risk_penalties = {"HIGH": -30, "MEDIUM": -15, "LOW": 0}
            score += risk_penalties.get(financial_record.bankruptcy_risk, 0)
        
        # Legal issues penalty
        if financial_record.legal_issues:
            score -= 20
        
        final_score = max(min(score, 100), 0)
        
        logger.info(f"Financial health score for supplier {supplier_id}: {final_score:.2f}")
        
        return round(final_score, 2)
    
    def update_all_supplier_scores(self, supplier_id: int, lookback_days: int = 90) -> Dict[str, float]:
        """
        Recalculate all scores for a supplier and update the database
        """
        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise ValueError(f"Supplier {supplier_id} not found")
        
        
        scores = {
            'delivery_score': self.calculate_delivery_score(supplier_id, lookback_days),
            'quality_score': self.calculate_quality_score(supplier_id, lookback_days),
            'inventory_score': self.calculate_inventory_score(supplier_id, lookback_days),
            'financial_health_score': self.calculate_financial_health_score(supplier_id),
            'compliance_score': supplier.compliance_score  # Keep existing for now
        }
        
        
        supplier.delivery_score = scores['delivery_score']
        supplier.quality_score = scores['quality_score']
        supplier.inventory_score = scores['inventory_score']
        supplier.financial_health_score = scores['financial_health_score']
        
        self.db.commit()
        
        
        from src.api.supplier_logic import recalculate_supplier_tier
        recalculate_supplier_tier(self.db, supplier_id, "Automated score update")
        
        logger.info(f"Updated all scores for supplier {supplier_id}: {scores}")
        
        return scores
