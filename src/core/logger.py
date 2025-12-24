
import logging
import os
from datetime import datetime
from pathlib import Path


LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)


LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)


log_filename = LOGS_DIR / f"nomi_api_{datetime.now().strftime('%Y%m%d')}.log"
file_handler = logging.FileHandler(log_filename, encoding='utf-8')
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(formatter)


console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)


error_filename = LOGS_DIR / f"nomi_errors_{datetime.now().strftime('%Y%m%d')}.log"
error_handler = logging.FileHandler(error_filename, encoding='utf-8')
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(formatter)


logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler, error_handler]
)


logger = logging.getLogger("nomi_api")


logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("multipart").setLevel(logging.WARNING)

def log_api_call(user_uid: str, endpoint: str, method: str, status: str = "success"):
    """Log API calls with user context"""
    logger.info(f"API Call | User: {user_uid} | {method} {endpoint} | Status: {status}")

def log_error(user_uid: str, endpoint: str, error: Exception):
    """Log errors with user context"""
    logger.error(f"Error | User: {user_uid} | Endpoint: {endpoint} | Error: {str(error)}", exc_info=True)

def log_security_event(event_type: str, user_uid: str, details: str):
    """Log security-related events"""
    logger.warning(f"Security Event | Type: {event_type} | User: {user_uid} | Details: {details}")

def log_compliance_check(user_uid: str, file_id: str, regulation_count: int, score: float):
    """Log compliance check operations"""
    logger.info(f"Compliance Check | User: {user_uid} | File: {file_id} | Regulations: {regulation_count} | Score: {score}%")
