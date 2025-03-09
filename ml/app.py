from flask import Flask, request, jsonify
import os
from cat_dog_detector import detect_cat_dog

app = Flask(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "無圖片"}), 400
    file = request.files['image']
    file_path = os.path.join(UPLOAD_FOLDER, "uploaded_image.jpg")
    file.save(file_path)
    has_pet, message = detect_cat_dog(file_path)
    return jsonify({"has_pet": has_pet, "message": message})

if __name__ == "__main__":
    app.run(debug=True, port=5001)  # 改成 5001