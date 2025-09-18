from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app) 

# Step 1: Replace Appwrite data with a hardcoded database for now
image_database = [
    {"id": "image1", "embedding": [0.1, 0.2, 0.3]},
    {"id": "image2", "embedding": [0.4, 0.5, 0.6]},
    {"id": "image3", "embedding": [0.7, 0.8, 0.9]},
]

@app.route('/api/similar-images', methods=['POST'])
def similar_images():
    data = request.get_json()
    target_embedding = np.array(data.get('embedding'))  # User's input

    # Calculate cosine similarity between input and database embeddings
    similarities = [
        {
            "id": image["id"],
            "similarity": cosine_similarity([target_embedding], [image["embedding"]])[0][0],
        }
        for image in image_database
    ]

    # Sort results by similarity score
    similarities = sorted(similarities, key=lambda x: x["similarity"], reverse=True)

    # Return top 3 most similar images
    return jsonify({"similar_images": similarities[:3]})

if __name__ == '__main__':
    app.run(debug=True)
