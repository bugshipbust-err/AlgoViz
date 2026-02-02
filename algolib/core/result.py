from dataclasses import dataclass
from typing import Any, List
from core.step import Step

@dataclass
class AlgorithmResult:
    output: Any
    steps: List[Step]
    runtime: float
