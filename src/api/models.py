from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from src.api.db import Base

class User(Base):
    __tablename__ = "users"

    uid = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)

    # NEW — aligned with your onboarding page
    full_name = Column(String, nullable=True)        # Full legal name
    display_name = Column(String, nullable=True)     # Preferred/short display name
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TaskState(str, enum.Enum):
    TODO = "TODO"
    # user_uid = Column(String, ForeignKey("users.uid"))  # ✅ link to user
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"
    WAIVER = "WAIVER"
    BREACH = "BREACH"

class ObligationInstance(Base):
    __tablename__ = "obligations"
    id = Column(Integer, primary_key=True)
    user_uid = Column(String, ForeignKey("users.uid"))  # ✅ link to user
    description = Column(String)
    regulation = Column(String)
    due_date = Column(DateTime)
    remediation_tasks = relationship("RemediationTask", back_populates="obligation")

class RemediationTask(Base):
    __tablename__ = "remediation_tasks"
    id = Column(Integer, primary_key=True)
    obligation_id = Column(Integer, ForeignKey("obligations.id"))
    user_uid = Column(String, ForeignKey("users.uid"))  # ✅ link to user
    # ADD THIS LINE:
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))  # <--- This links to Supplier

    assigned_to = Column(String)
    sla_due = Column(DateTime)
    state = Column(SQLEnum(TaskState), default=TaskState.TODO)
    checklist_template = Column(JSON)
    breach_flag = Column(Boolean, default=False)
    evidence_artifacts = relationship("EvidenceArtifact", back_populates="task")
    obligation = relationship("ObligationInstance", back_populates="remediation_tasks")

    # UPDATE THIS:
    supplier = relationship("Supplier", backref="remediation_tasks")
    supplier = relationship("Supplier", back_populates="remediation_tasks")


class EvidenceArtifact(Base):
    __tablename__ = "evidence_artifacts"
    id = Column(Integer, primary_key=True)
    user_uid = Column(String, ForeignKey("users.uid"))  # ✅ link to user
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
class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True)
    industry = Column(String)
    region = Column(String)
    user_uid = Column(String, ForeignKey("users.uid"))  
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime)
    last_updated = Column(DateTime)
    remediation_tasks = relationship("RemediationTask", back_populates="supplier")
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
print("Loaded models.py (end)")
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
