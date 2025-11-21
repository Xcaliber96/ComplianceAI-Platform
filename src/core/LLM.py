# LLM.py (compat shim)
from src.core.market_insights import generate_market_insight
from src.core.metadata_extractor import extract_document_metadata
from src.core.compliance_narratives import generate_gap_summary

__all__ = ["generate_market_insight", "extract_document_metadata", "generate_gap_summary"]
