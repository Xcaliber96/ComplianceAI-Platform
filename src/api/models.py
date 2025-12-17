from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Enum as SQLEnum, Float, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from src.api.db import Base


class User(Base):
    __tablename__ = "users"
    uid = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FileExtraction(Base):
    __tablename__ = "file_extractions"
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, index=True)
    user_uid = Column(String, index=True)
    extraction = Column(JSON)
    file_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TaskState(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"
    WAIVER = "WAIVER"
    BREACH = "BREACH"

class ObligationInstance(Base):
    __tablename__ = "obligations"
    id = Column(Integer, primary_key=True)
    user_uid = Column(String, ForeignKey("users.uid"))
    description = Column(String)
    regulation = Column(String)
    due_date = Column(DateTime)
    remediation_tasks = relationship("RemediationTask", back_populates="obligation")

class RemediationTask(Base):
    __tablename__ = "remediation_tasks"
    id = Column(Integer, primary_key=True)
    obligation_id = Column(Integer, ForeignKey("obligations.id"))
    user_uid = Column(String, ForeignKey("users.uid"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    assigned_to = Column(String)
    sla_due = Column(DateTime)
    state = Column(SQLEnum(TaskState), default=TaskState.TODO)
    checklist_template = Column(JSON)
    breach_flag = Column(Boolean, default=False)
    evidence_artifacts = relationship("EvidenceArtifact", back_populates="task")
    obligation = relationship("ObligationInstance", back_populates="remediation_tasks")
    supplier = relationship("Supplier", back_populates="remediation_tasks")

class EvidenceArtifact(Base):
    __tablename__ = "evidence_artifacts"
    id = Column(Integer, primary_key=True)
    user_uid = Column(String, ForeignKey("users.uid"))
    task_id = Column(Integer, ForeignKey("remediation_tasks.id"))
    chromadb_id = Column(String)
    valid = Column(Boolean, default=False)
    validation_errors = Column(JSON)
    approved_by = Column(String, nullable=True)
    approved_on = Column(DateTime, nullable=True)
    attestation_hash = Column(String, nullable=True)
    task = relationship("RemediationTask", back_populates="evidence_artifacts")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    entity_type = Column(String)
    entity_id = Column(Integer)
    action = Column(String)
    user = Column(String)
    user_uid = Column(String, ForeignKey("users.uid"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    detail = Column(String)

class DemoRequest(Base):
    __tablename__ = "demo_requests"
    id = Column(Integer, primary_key=True, autoincrement=True)
    firstName = Column(String)
    lastName = Column(String)
    email = Column(String)
    jobTitle = Column(String)
    companyName = Column(String)
    country = Column(String)
    phone = Column(String)
    solutionInterest = Column(String)
    consent = Column(Boolean)
    submittedAt = Column(DateTime, default=datetime.utcnow)

class FileHubFile(Base):
    __tablename__ = "filehub_files"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_uid = Column(String, ForeignKey("users.uid"), nullable=False, index=True)
    file_id = Column(String, unique=True, index=True)
    original_name = Column(String)
    stored_name = Column(String)
    size = Column(Integer)
    file_type = Column(String)
    used_for = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")

class WorkspaceRegulation(Base):
    __tablename__ = "workspace_regulations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    regulation_id = Column(String, index=True)
    user_uid = Column(String, ForeignKey("users.uid"), index=True)
    workspace_status = Column(String, default="added")
    created_at = Column(DateTime, default=datetime.utcnow)
    name = Column(String, nullable=True)
    code = Column(String, nullable=True)
    region = Column(String, nullable=True)
    category = Column(String, nullable=True)
    risk = Column(String, nullable=True)
    description = Column(String, nullable=True)
    recommended = Column(Boolean, default=False)
    source = Column(String, nullable=True)
    full_text = Column(Text, nullable=True)



class SupplierTier(str, enum.Enum):
    TIER_1 = "TIER_1"
    TIER_2 = "TIER_2"
    TIER_3 = "TIER_3"
    UNRATED = "UNRATED"

class SupplierStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    UNDER_REVIEW = "UNDER_REVIEW"
    INACTIVE = "INACTIVE"

supplier_backup_association = Table(
    'supplier_backups',
    Base.metadata,
    Column('primary_supplier_id', Integer, ForeignKey('suppliers.id'), primary_key=True),
    Column('backup_supplier_id', Integer, ForeignKey('suppliers.id'), primary_key=True),
    Column('backup_priority', Integer, default=1),
    Column('created_at', DateTime, default=datetime.utcnow)
)

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True)
    industry = Column(String)
    region = Column(String)
    country = Column(String, index=True)
    user_uid = Column(String, ForeignKey("users.uid"))
    
    is_verified = Column(Boolean, default=False)
    status = Column(SQLEnum(SupplierStatus), default=SupplierStatus.ACTIVE)
    opencorporates_verified = Column(Boolean, default=False)
    company_number = Column(String, nullable=True)
    jurisdiction = Column(String, nullable=True)
    
    tier_level = Column(SQLEnum(SupplierTier), default=SupplierTier.UNRATED, index=True)
    tier_score = Column(Float, default=0.0)
    tier_last_updated = Column(DateTime, nullable=True)
    tier_change_reason = Column(Text, nullable=True)
    
    quality_score = Column(Float, default=0.0)
    delivery_score = Column(Float, default=0.0)
    inventory_score = Column(Float, default=0.0)
    financial_health_score = Column(Float, default=0.0)
    compliance_score = Column(Float, default=0.0)
    
    total_orders = Column(Integer, default=0)
    successful_deliveries = Column(Integer, default=0)
    last_rating_update = Column(DateTime, nullable=True)
    
    is_restricted_country = Column(Boolean, default=False)
    sanction_check_date = Column(DateTime, nullable=True)
    tariff_code = Column(String, nullable=True)
    estimated_tariff_rate = Column(Float, default=0.0)
    free_trade_agreement = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    remediation_tasks = relationship("RemediationTask", back_populates="supplier")
    
    backup_for = relationship(
        "Supplier",
        secondary=supplier_backup_association,
        primaryjoin=id == supplier_backup_association.c.backup_supplier_id,
        secondaryjoin=id == supplier_backup_association.c.primary_supplier_id,
        backref="backups"
    )

class SupplierPerformanceLog(Base):
    __tablename__ = "supplier_performance_logs"
    
    id = Column(Integer, primary_key=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    quality_score = Column(Float)
    delivery_score = Column(Float)
    inventory_score = Column(Float)
    financial_health_score = Column(Float)
    compliance_score = Column(Float)
    tier_score = Column(Float)
    tier_level = Column(SQLEnum(SupplierTier))
    
    event_type = Column(String)
    notes = Column(Text, nullable=True)
    
    supplier = relationship("Supplier", backref="performance_history")

class RestrictedCountry(Base):
    __tablename__ = "restricted_countries"
    
    id = Column(Integer, primary_key=True)
    country_code = Column(String(3), unique=True, index=True)
    country_name = Column(String)
    restriction_type = Column(String)
    severity = Column(String)
    reason = Column(Text)
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    source = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TariffRate(Base):
    __tablename__ = "tariff_rates"
    
    id = Column(Integer, primary_key=True)
    hs_code = Column(String, index=True)
    origin_country = Column(String, index=True)
    destination_country = Column(String, index=True)
    tariff_rate = Column(Float)
    fta_applicable = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    source = Column(String)

print("Loaded models.py (end)")
