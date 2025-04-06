import json
import random

N = 7
conditions = [("improbable", "improbable"), ("improbable", "impossible"),
              ("impossible", "impossible"), ("impossible", "inconceivable"),
              ("inconceivable", "inconceivable")]

data = json.load(open("stimuli.json", "rb"))
random.shuffle(data)
random.shuffle(conditions)

new_data = []

for cond_tuple_idx in range(len(conditions)):
    for i in range(N):

        data_idx_0 = int((2 * N * cond_tuple_idx) + (2* i))
        data_idx_1 = int((2 * N * cond_tuple_idx) + (2 * i) + 1)
        print(data_idx_0)
        print(data_idx_1)

        data[data_idx_0]["condition"] = conditions[cond_tuple_idx][0]
        data[data_idx_1]["condition"] = conditions[cond_tuple_idx][1]

        new_data.append({
            "stim_0": data[data_idx_0],
            "stim_1": data[data_idx_1]
        })

json.dump(new_data, open("./consistency.json", "w"), indent=4)