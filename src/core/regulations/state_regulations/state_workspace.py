# src/core/regulations/state_regulations/state_workspace.py

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from src.api.models import WorkspaceRegulation  # adjust import if path differs
from .michigan_storage import search_local_michigan, load_michigan_rule


def get_michigan_for_user(
    db: Session,
    user_uid: str,
    query: str,
) -> List[Dict[str, Any]]:
    """
    1. Search local Michigan cache (index + JSON files)
    2. Merge workspace_status for the given user
    3. Return list of regulation dicts for the frontend
    """
    regs = search_local_michigan(query)
    if not regs:
        return []

    ids = [r["id"] for r in regs]

    # Fetch workspace rows for these IDs
    ws_rows = (
        db.query(WorkspaceRegulation)
        .filter(
            WorkspaceRegulation.user_uid == user_uid,
            WorkspaceRegulation.regulation_id.in_(ids),
        )
        .all()
    )

    status_by_id = {w.regulation_id: w.workspace_status for w in ws_rows}

    for r in regs:
        rid = r["id"]
        if rid in status_by_id:
            r["workspace_status"] = status_by_id[rid]

    return regs


def toggle_michigan_for_user(
    db: Session,
    user_uid: str,
    regulation_id: str,
) -> WorkspaceRegulation:
    """
    Toggle a Michigan rule in the user's workspace.

    - If exists: flip between "added" and "removed"
    - If not exists: create with "added" and fill metadata from local JSON
    """
    # 1. Check existing workspace entry
    item = (
        db.query(WorkspaceRegulation)
        .filter(
            WorkspaceRegulation.user_uid == user_uid,
            WorkspaceRegulation.regulation_id == regulation_id,
        )
        .first()
    )

    if item:
        item.workspace_status = "removed" if item.workspace_status == "added" else "added"
        db.commit()
        db.refresh(item)
        return item

    # 2. No existing row → create new one from local cache
    raw_rule = load_michigan_rule(regulation_id)
    if not raw_rule:
        # Minimal fallback row
        item = WorkspaceRegulation(
            regulation_id=regulation_id,
            user_uid=user_uid,
            workspace_status="added",
            name=f"Michigan Rule {regulation_id}",
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    # Map fields from stored JSON into model
    name = raw_rule.get("title") or raw_rule.get("name") or "Unnamed Regulation"
    description = raw_rule.get("text") or raw_rule.get("description") or ""

    item = WorkspaceRegulation(
        regulation_id=regulation_id,
        user_uid=user_uid,
        workspace_status="added",
        name=name,
        code=raw_rule.get("code"),
        region="Michigan",
        category="State",
        risk="Medium",
        description=description,
        recommended=False,
        source=raw_rule.get("source") or "Michigan Administrative Code",
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_workspace_regulations(db: Session, user_uid: str) -> List[WorkspaceRegulation]:
    """
    Simple helper: list ALL workspace regs for a user.
    """
    return (
        db.query(WorkspaceRegulation)
        .filter(WorkspaceRegulation.user_uid == user_uid)
        .all()
    )
