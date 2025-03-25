import json
import random

N = 30
data = json.load(open("stimuli.json", "rb"))
conditions = ["improbable"] * int(N/3) + ["impossible"] * int(N/3) + ["inconceivable"] * int(N/3)

random.shuffle(data)
random.shuffle(conditions)

data = data[:N]
for i in range(N):
    data[i]["condition"] = conditions[i]

json.dump(data, open("./test_stimuli_0.json", "w"))