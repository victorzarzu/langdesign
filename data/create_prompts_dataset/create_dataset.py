import json
import pandas as pd
import sys
import pyarrow as pa
import pyarrow.parquet as pq
from description_type import DescriptionType, get_description_type

if not len(sys.argv) == 3:
    print("Parameters error: <input_prompts_filename> <output_prompts_filename>")
    exit()

input_filename = sys.argv[1]
output_filename = sys.argv[2]

system_prompt = """<<SYS>>
You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe.  Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.
You have to generate information for interior design descriptions. You should provide a json with 4 fields: input, edit, output. The input is the initial description that you have to generate. The edit one should be a short edit prompt for changing one feature in the description with a short type (add, remove, replace). And the output descriptions are the descriptions resulted from editing the input with the edit prompt.
<</SYS>>"""

data = []

with open(input_filename, "r") as input_file:
    for line in input_file:
        json_line = json.loads(line)
        data.append(["<s>[INST]{system_prompt}{type}[/INST]{prompt}</s>\n".format(system_prompt=system_prompt,
                                                                                    type=get_description_type(
                                                                                        json_line['input']),
                                                                                    prompt=line[:-1])])

df = pd.DataFrame(data, columns=["text"])
df.to_parquet(output_filename)
exit()
# Convert DataFrame to Arrow Table
table = pa.Table.from_pandas(df)

# Save Arrow Table to Parquet file
pq.write_table(table, output_filename)