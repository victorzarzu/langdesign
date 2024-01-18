import os
import sys

if not len(sys.argv) == 2:
    print("The number of arguments is not good.")
    exit()

pairs = 0
for dir in os.listdir(sys.argv[1]):
    files = os.listdir(os.path.join(sys.argv[1], dir))
    if len(files) > 1:
        pairs += (len(files) - 2) / 2

print(pairs)