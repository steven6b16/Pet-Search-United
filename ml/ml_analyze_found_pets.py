import sys
import json
import sqlite3
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from math import radians, sin, cos, sqrt, atan2

# Haversine 公式計算兩點距離（單位：公里）
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # 地球半徑（公里）
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

# 提取數據庫中現有 found_pets
def fetch_found_pets():
    conn = sqlite3.connect('./lost_pets.db')
    query = "SELECT foundId, petType, breed, color, found_date, found_location, found_details FROM found_pets WHERE casestatus = 'active' AND isDeleted = 0"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

# 計算相似度
def calculate_similarity(new_pet, existing_pets):
    # 準備特徵
    new_data = {
        'petType': new_pet['petType'],
        'breed': new_pet['breed'],
        'color': new_pet['color'],
        'found_date': new_pet['found_date'],
        'found_location': new_pet['found_location'],
        'found_details': new_pet['found_details'] or ''
    }
    
    # 合併描述文字
    existing_pets['combined'] = (
        existing_pets['petType'].fillna('') + ' ' +
        existing_pets['breed'].fillna('') + ' ' +
        existing_pets['color'].fillna('') + ' ' +
        existing_pets['found_details'].fillna('')
    )
    new_combined = f"{new_data['petType']} {new_data['breed']} {new_data['color']} {new_data['found_details']}"

    # TF-IDF 向量化
    vectorizer = TfidfVectorizer()
    all_texts = existing_pets['combined'].tolist() + [new_combined]
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    new_tfidf = tfidf_matrix[-1]
    existing_tfidf = tfidf_matrix[:-1]

    # 餘弦相似度（文字部分）
    text_similarity = cosine_similarity(new_tfidf, existing_tfidf)[0] * 50  # 佔 50%

    # 地理位置相似度
    try:
        new_lat, new_lon = map(float, new_data['found_location'].split(','))
    except (ValueError, AttributeError):
        new_lat, new_lon = 0, 0
    
    geo_similarity = []
    for loc in existing_pets['found_location']:
        try:
            lat, lon = map(float, loc.split(','))
            distance = haversine_distance(new_lat, new_lon, lat, lon)
            geo_score = max(0, 1 - distance / 50) * 30  # 距離 < 50km 得滿分，佔 30%
        except (ValueError, AttributeError):
            geo_score = 0
        geo_similarity.append(geo_score)

    # 時間相似度
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

    # 總相似度
    total_similarity = text_similarity + geo_similarity + time_similarity
    return total_similarity

def main():
    # 從命令行獲取新個案數據
    if len(sys.argv) < 2:
        print("請提供新個案數據")
        sys.exit(1)
    
    new_pet = json.loads(sys.argv[1])
    existing_pets = fetch_found_pets()

    if existing_pets.empty:
        print(json.dumps([]))
        sys.exit(0)

    # 計算相似度
    similarity_scores = calculate_similarity(new_pet, existing_pets)
    
    # 篩選得分 > 80 的 foundId
    similar_ids = existing_pets['foundId'][similarity_scores > 80].tolist()
    
    # 輸出結果
    print(json.dumps(similar_ids))
    sys.exit(0)

if __name__ == "__main__":
    main()