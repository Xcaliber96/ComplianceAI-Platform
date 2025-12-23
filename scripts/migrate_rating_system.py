
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import text
from src.api.db import engine, Base
from src.api.models import (
    SupplierOrder, QualityIncident, InventoryEvent, 
    SupplierFinancialHealth, RatingRecalculationLog
)

def migrate():
    print(" Starting migration for automated rating system...")
    
    
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine, checkfirst=True)
    
    print("\n Migration complete!")
    print("\nNew tables created:")
    print("  - supplier_orders (order tracking)")
    print("  - quality_incidents (defect/issue tracking)")
    print("  - inventory_events (stock-out/availability tracking)")
    print("  - supplier_financial_health (credit/financial data)")
    print("  - rating_recalculation_logs (automated job tracking)")
    print("\n" + "="*60)

if __name__ == "__main__":
    migrate()
