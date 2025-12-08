import json
with open('graph.json','r',encoding='utf-8') as f:
    d=json.load(f)
with open('graph_pretty.json','w',encoding='utf-8') as f:
    json.dump(d,f,indent=2,ensure_ascii=False)
print('Wrote graph_pretty.json')
