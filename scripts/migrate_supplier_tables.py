
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import text
from src.api.db import engine, Base
from src.api.models import (
    Supplier, SupplierPerformanceLog, RestrictedCountry, 
    TariffRate, supplier_backup_association
)

def migrate():
    print(" Starting database migration for multi-tier supplier system...")
    
  
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine, checkfirst=True)
    
    
    with engine.connect() as conn:
        try:
            
            conn.execute(text("SELECT tier_level FROM suppliers LIMIT 1"))
            print(" Columns already exist, skipping ALTER TABLE")
        except Exception:
            print("Adding new columns to suppliers table...")
            
            
            new_columns = [
                "ALTER TABLE suppliers ADD COLUMN country VARCHAR",
                "ALTER TABLE suppliers ADD COLUMN status VARCHAR DEFAULT 'ACTIVE'",
                "ALTER TABLE suppliers ADD COLUMN opencorporates_verified BOOLEAN DEFAULT 0",
                "ALTER TABLE suppliers ADD COLUMN company_number VARCHAR",
                "ALTER TABLE suppliers ADD COLUMN jurisdiction VARCHAR",
                
                
                "ALTER TABLE suppliers ADD COLUMN tier_level VARCHAR DEFAULT 'UNRATED'",
                "ALTER TABLE suppliers ADD COLUMN tier_score FLOAT DEFAULT 0.0",
                "ALTER TABLE suppliers ADD COLUMN tier_last_updated DATETIME",
                "ALTER TABLE suppliers ADD COLUMN tier_change_reason TEXT",
                
             
                "ALTER TABLE suppliers ADD COLUMN quality_score FLOAT DEFAULT 0.0",
                "ALTER TABLE suppliers ADD COLUMN delivery_score FLOAT DEFAULT 0.0",
                "ALTER TABLE suppliers ADD COLUMN inventory_score FLOAT DEFAULT 0.0",
                "ALTER TABLE suppliers ADD COLUMN financial_health_score FLOAT DEFAULT 0.0",
                "ALTER TABLE suppliers ADD COLUMN compliance_score FLOAT DEFAULT 0.0",
                
           
                "ALTER TABLE suppliers ADD COLUMN total_orders INTEGER DEFAULT 0",
                "ALTER TABLE suppliers ADD COLUMN successful_deliveries INTEGER DEFAULT 0",
                "ALTER TABLE suppliers ADD COLUMN last_rating_update DATETIME",
                
               
                "ALTER TABLE suppliers ADD COLUMN is_restricted_country BOOLEAN DEFAULT 0",
                "ALTER TABLE suppliers ADD COLUMN sanction_check_date DATETIME",
                "ALTER TABLE suppliers ADD COLUMN tariff_code VARCHAR",
                "ALTER TABLE suppliers ADD COLUMN estimated_tariff_rate FLOAT DEFAULT 0.0",
                "ALTER TABLE suppliers ADD COLUMN free_trade_agreement VARCHAR",
            ]
            
            for sql in new_columns:
                try:
                    conn.execute(text(sql))
                    print(f"  ✓ {sql.split('ADD COLUMN')[1].split()[0]}")
                except Exception as e:
                    if "duplicate column" in str(e).lower():
                        continue
                    print(f"  ⚠️  Error: {e}")
            
            conn.commit()
    
    print("\n Migration complete!")
    print("\nNew tables created:")
    print("  - supplier_backups (many-to-many backup relationships)")
    print("  - supplier_performance_logs (historical performance tracking)")
    print("  - restricted_countries (sanctioned/embargoed countries)")
    print("  - tariff_rates (international tariff calculator cache)")
    print("\n" + "="*60)

if __name__ == "__main__":
    migrate()
