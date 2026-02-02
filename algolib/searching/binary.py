from core.algorithm import Algorithm
from core.step import Step

class BinarySearch(Algorithm):
    def run(self, array, target):
        low, high = 0, len(array) - 1

        while low <= high:
            mid = (low + high) // 2

            self.ctx.emit(Step(
                type="check",
                index=mid,
                state={
                    "array": array.copy(),
                    "low": low,
                    "high": high,
                    "mid": mid
                }
            ))

            if array[mid] == target:
                self.ctx.emit(Step(
                    type="found",
                    index=mid,
                    state={"array": array.copy()}
                ))
                return mid

            elif array[mid] < target:
                low = mid + 1
            else:
                high = mid - 1

        return -1
