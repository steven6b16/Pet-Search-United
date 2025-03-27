from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
from cat_dog_detector import detect_cat_dog
import sqlite3
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from math import radians, sin, cos, sqrt, atan2

# 初始化 Flask 應用
app = Flask(__name__)

# 配置 CORS，允許前端跨域訪問
CORS(app, resources={
    r"/upload": {"origins": "http://localhost:3000"},  # 允許前端（React）訪問貓狗識別端點
    r"/analyze": {"origins": "http://localhost:3001"}  # 允許後端（server.js）訪問 ML 分析端點
})

# 設置上傳圖片嘅保存路徑
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # 確保 uploads 目錄存在

# 貓狗識別端點：處理圖片上傳並檢測是否有貓狗
@app.route('/upload', methods=['POST'])
def upload_image():
    """
    處理圖片上傳並進行貓狗識別。
    請求格式：multipart/form-data，包含 'image' 字段
    回應：
        - 成功：{"has_pet": true, "pet_type": "cat", "message": "Detected cat"}
        - 失敗：{"error": "錯誤信息"}
    """
    # 檢查請求中是否有圖片
    if 'image' not in request.files:
        return jsonify({"error": "無圖片"}), 400
    
    file = request.files['image']
    # 使用 UUID 生成唯一文件名，避免覆蓋
    file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.jpg")
    file.save(file_path)  # 保存圖片到 uploads 目錄
    
    try:
        # 調用貓狗識別模塊，檢測圖片中是否有貓狗
        has_pet, pet_type = detect_cat_dog(file_path)
        return jsonify({
            "has_pet": has_pet,
            "pet_type": pet_type if has_pet else None,
            "message": f"Detected {pet_type}" if has_pet else "No pet detected"
        })
    except Exception as e:
        return jsonify({"error": f"檢測失敗: {str(e)}"}), 500

# 計算兩點間距離（Haversine 公式）
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    使用 Haversine 公式計算兩點間嘅距離（單位：公里）。
    參數：
        lat1, lon1: 第一個地點嘅緯度同經度
        lat2, lon2: 第二個地點嘅緯度同經度
    返回：
        距離（公里）
    """
    R = 6371  # 地球半徑（公里）
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

# 從數據庫提取現有嘅 found_pets 數據
def fetch_found_pets() -> pd.DataFrame:
    """
    從 SQLite 數據庫提取所有 casestatus='active' 且未刪除嘅 found_pets 記錄。
    返回：
        pandas DataFrame，包含 foundId, petType, breed, color, found_date, found_location, found_details
    """
    conn = sqlite3.connect('D:/Project/Pet-Search-United/backend/lost_pets.db')  # 使用絕對路徑
    query = """
        SELECT foundId, petType, breed, color, found_date, found_location, found_details 
        FROM found_pets 
        WHERE casestatus = 'active' AND isDeleted = 0
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

# 計算新個案同現有個案嘅相似度
def calculate_similarity(new_pet: dict, existing_pets: pd.DataFrame) -> list:
    """
    計算新個案同現有 found_pets 記錄嘅相似度。
    相似度分數由三部分組成：
        - 文字相似度（petType, breed, color, found_details）：50%
        - 地理位置相似度（found_location）：30%
        - 時間相似度（found_date）：20%
    參數：
        new_pet: 新個案數據（dict），包含 foundId, petType, breed, color, found_date, found_location, found_details
        existing_pets: 現有個案數據（DataFrame）
    返回：
        相似度分數列表（每個現有個案嘅分數）
    """
    # 準備新個案嘅特徵數據
    new_data = {
        'petType': new_pet['petType'],
        'breed': new_pet['breed'],
        'color': new_pet['color'],
        'found_date': new_pet['found_date'],
        'found_location': new_pet['found_location'],
        'found_details': new_pet.get('found_details', '')  # 確保 found_details 有值，否則用空字符串
    }
    
    # 合併現有個案嘅文字特徵（petType, breed, color, found_details）
    existing_pets['combined'] = (
        existing_pets['petType'].fillna('') + ' ' +
        existing_pets['breed'].fillna('') + ' ' +
        existing_pets['color'].fillna('') + ' ' +
        existing_pets['found_details'].fillna('')
    )
    new_combined = f"{new_data['petType']} {new_data['breed']} {new_data['color']} {new_data['found_details']}"

    # 使用 TF-IDF 向量化計算文字相似度
    vectorizer = TfidfVectorizer()
    all_texts = existing_pets['combined'].tolist() + [new_combined]
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    new_tfidf = tfidf_matrix[-1]
    existing_tfidf = tfidf_matrix[:-1]
    text_similarity = cosine_similarity(new_tfidf, existing_tfidf)[0] * 50  # 文字相似度佔 50%

    # 計算地理位置相似度
    try:
        new_lat, new_lon = map(float, new_data['found_location'].split(','))
    except (ValueError, AttributeError):
        new_lat, new_lon = 0, 0
    
    geo_similarity = []
    for loc in existing_pets['found_location']:
        try:
            lat, lon = map(float, loc.split(','))
            distance = haversine_distance(new_lat, new_lon, lat, lon)
            geo_score = max(0, 1 - distance / 50) * 30  # 距離小於 50km 得滿分，佔 30%
        except (ValueError, AttributeError):
            geo_score = 0
        geo_similarity.append(geo_score)

    # 計算時間相似度
    try:
        new_date = pd.to_datetime(new_data['found_date'])
    except ValueError:
        new_date = pd.Timestamp.now()
    
    time_similarity = []
    for date in existing_pets['found_date']:
        try:
            existing_date = pd.to_datetime(date)
            days_diff = abs((new_date - existing_date).days)
            time_score = max(0, 1 - days_diff / 30) * 20  # 30 天內滿分，佔 20%
        except ValueError:
            time_score = 0
        time_similarity.append(time_score)

    # 總相似度 = 文字 + 地理 + 時間
    total_similarity = text_similarity + geo_similarity + time_similarity
    return total_similarity

# ML 分析端點：分析新個案同現有個案嘅相似度
@app.route('/analyze', methods=['POST'])
def analyze():
    """
    分析新個案同現有 found_pets 記錄嘅相似度，返回相似個案嘅 foundId 列表。
    請求格式：JSON，包含 foundId, petType, breed, color, found_date, found_location, found_details
    回應：
        - 成功：["FOUND001", "FOUND002"]（相似個案嘅 foundId 列表）
        - 無相似個案：[]
        - 失敗：{"error": "錯誤信息"}
    """
    try:
        # 獲取請求中嘅 JSON 數據
        new_pet = request.get_json()
        if not new_pet:
            return jsonify({'error': '請提供新個案數據'}), 400

        # 從數據庫提取現有個案
        existing_pets = fetch_found_pets()
        if existing_pets.empty:
            return jsonify([]), 200

        # 計算相似度
        similarity_scores = calculate_similarity(new_pet, existing_pets)
        
        # 篩選相似度大於 80 分嘅 foundId
        similar_ids = existing_pets['foundId'][similarity_scores > 80].tolist()
        return jsonify(similar_ids), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)