from flask import Flask, request, jsonify
from flask_cors import CORS  # 導入 CORS
import os
import uuid  # 導入 uuid 模組
from cat_dog_detector import detect_cat_dog

app = Flask(__name__)
CORS(app, resources={r"/upload": {"origins": "http://localhost:3000"}})  # 允許 localhost:3000 訪問 /upload
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "無圖片"}), 400
    file = request.files['image']
    file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.jpg")  # 使用唯一文件名避免覆蓋
    file.save(file_path)
    
    # 假設 detect_cat_dog 返回 (has_pet, pet_type)，例如 (True, "cat")
    try:
        has_pet, pet_type = detect_cat_dog(file_path)
        return jsonify({
            "has_pet": has_pet,
            "pet_type": pet_type if has_pet else None,
            "message": f"Detected {pet_type}" if has_pet else "No pet detected"
        })
    except Exception as e:
        return jsonify({"error": f"檢測失敗: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)