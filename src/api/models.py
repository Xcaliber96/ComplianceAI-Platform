from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

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
    description = Column(String)
    regulation = Column(String)
    due_date = Column(DateTime)
    remediation_tasks = relationship("RemediationTask", back_populates="obligation")

class RemediationTask(Base):
    __tablename__ = "remediation_tasks"
    id = Column(Integer, primary_key=True)
    obligation_id = Column(Integer, ForeignKey("obligations.id"))

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
    timestamp = Column(DateTime, default=datetime.utcnow)
    detail = Column(String)
class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True)
    industry = Column(String)
    region = Column(String)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime)
    last_updated = Column(DateTime)
    remediation_tasks = relationship("RemediationTask", back_populates="supplier")
