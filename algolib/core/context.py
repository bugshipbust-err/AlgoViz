import time
from typing import List
from core.step import Step

class ExecutionContext:
    def __init__(self):
        self.steps: List[Step] = []
        self.start_time = None
        self.end_time = None

    def start_timer(self):
        self.start_time = time.perf_counter()

    def stop_timer(self):
        self.end_time = time.perf_counter()

    def emit(self, step: Step):
        self.steps.append(step)

    @property
    def runtime(self):
        return self.end_time - self.start_time
