import networkx as nx
from flask import Flask, request, jsonify
import ast

app = Flask(__name__)

@app.route('/receive_data', methods=['POST'])
def receive_data():
    data_from_js = ast.literal_eval(request.json)
# 強連結成分分解
    G = nx.DiGraph()
    G.add_edges_from(data_from_js)
    
    kyoren = [list(component) for component in nx.strongly_connected_components(G)]
    
    print('Data from JavaScript:', data_from_js)  
      
    return jsonify(kyoren)

if __name__ == '__main__':
    app.run(debug=True)