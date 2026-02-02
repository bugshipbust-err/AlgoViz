from dataclasses import dataclass
from typing import Any, Dict, Optional

@dataclass
class Step:
    """
    A single visualization step.
    """
    type: str              # e.g. "check", "found", "discard"
    index: Optional[int]   # index being inspected (if any)
    state: Dict[str, Any]  # array snapshot or other state
