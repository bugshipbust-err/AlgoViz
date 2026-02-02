from searching.linear import LinearSearch
from searching.binary import BinarySearch

array = [1, 3, 5, 7, 9, 11]
target = 7

print("=== Linear Search ===")
linear = LinearSearch()
result = linear.execute(array, target)

print(f"Output Index: {result.output}")
print(f"Runtime: {result.runtime} seconds")
for step in result.steps:
    print(step)

print("\n=== Binary Search ===")
binary = BinarySearch()
result = binary.execute(array, target)

print(f"Output Index: {result.output}")
print(f"Runtime: {result.runtime} seconds")
for step in result.steps:
    print(step)
