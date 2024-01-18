import sys
import shutil
import os

if not len(sys.argv) == 3:
    print('Arguments error')
    exit()

dir_mode = 0o777
source_dataset_path = sys.argv[1]
dest_dataset_path = sys.argv[2]

def get_dir_name(dir_number):
    return str(dir_number).zfill(7)

#nextDir_str = str(nextDir).zfill(7) 
new_dir_number = len(os.listdir(dest_dataset_path))

for dir in os.listdir(source_dataset_path):
    if not os.path.isdir(os.path.join(source_dataset_path, dir)):
        continue
    if len(os.listdir(os.path.join(source_dataset_path, dir))) == 1:
        continue

    new_dir_name = get_dir_name(new_dir_number)
    os.mkdir(os.path.join(dest_dataset_path, new_dir_name), dir_mode)
    for file in os.listdir(os.path.join(source_dataset_path, dir)):
        shutil.copy(os.path.join(os.path.join(source_dataset_path, dir, file)), 
                    os.path.join(dest_dataset_path, new_dir_name, file))

    new_dir_number += 1
