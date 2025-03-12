from flask import Flask, request, jsonify
import json
import uuid

app = Flask(__name__)

@app.route('/save-json', methods=['POST'])
def save_json():
    try:
        data = request.get_json()  # Get the JSON data from the request
        # generate a unique session ID
        id = str(uuid.uuid4())
        with open(f"data/experiment2/session-{id}.json", "w") as json_file:
            json.dump(data, json_file, indent=4)  # Save to a file
        return jsonify({"message": "JSON file saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False)