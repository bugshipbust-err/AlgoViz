from core.algorithm import Algorithm
from core.step import Step

class LinearSearch(Algorithm):
    def run(self, array, target):
        for i, value in enumerate(array):
            self.ctx.emit(Step(
                type="check",
                index=i,
                state={"array": array.copy()}
            ))

            if value == target:
                self.ctx.emit(Step(
                    type="found",
                    index=i,
                    state={"array": array.copy()}
                ))
                return i

        return -1
