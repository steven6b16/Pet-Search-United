import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
from PIL import Image
import numpy as np

# 載入預訓練模型
model = MobileNetV2(weights='imagenet')

def detect_cat_dog(image_path):
    # 讀取並處理圖片
    img = Image.open(image_path).resize((224, 224))
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    # 預測
    predictions = model.predict(img_array)
    results = decode_predictions(predictions, top=5)[0]

    # 檢查有冇貓狗
    for (_, label, confidence) in results:
        if 'cat' in label.lower() or 'dog' in label.lower():
            return True, f"檢測到貓狗（置信度: {confidence:.2f}）"
    return False, "無貓狗"

# 測試
if __name__ == "__main__":
    result, message = detect_cat_dog("test_image.jpg")
    print(message)