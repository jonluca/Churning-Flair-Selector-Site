import json

data = open("airports.json").read()

air = json.loads(data)
done = []

for key in air.keys():
    if air[key]['iata']:
        temp = {'city': air[key]['city'], 'iata': air[key]['iata'], 'name': air[key]['name']}
        done.append(temp)

done = sorted(done, key=lambda k: k['iata'])

with open("out.json", "w") as out:
    out.write(json.dumps(done))