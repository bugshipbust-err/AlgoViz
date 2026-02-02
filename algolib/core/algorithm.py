from abc import ABC, abstractmethod
from core.context import ExecutionContext
from core.result import AlgorithmResult

class Algorithm(ABC):
    def __init__(self):
        self.ctx = ExecutionContext()

    def execute(self, *args, **kwargs) -> AlgorithmResult:
        self.ctx.start_timer()
        output = self.run(*args, **kwargs)
        self.ctx.stop_timer()

        return AlgorithmResult(
            output=output,
            steps=self.ctx.steps,
            runtime=self.ctx.runtime
        )

    @abstractmethod
    def run(self, *args, **kwargs):
        pass
