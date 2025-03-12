import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 使用本地圖標（假設圖標文件在 public 目錄下）
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

function LocationMarker({ setLatLng, setLocation }) {
  const [position, setPosition] = useState(null);

  const map = useMapEvents({
    click(e) {
      console.log('地圖點擊：', e.latlng);
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setLatLng({ lat, lng });
      reverseGeocode(lat, lng).then(({ fullAddress, simplifiedAddress }) => {
        console.log('逆向地理編碼結果：', { fullAddress, simplifiedAddress });
        setLocation(fullAddress, simplifiedAddress);
      }).catch(err => console.error('地理編碼錯誤：', err));
    },
  });

  return position === null ? null : <Marker position={position} />;
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get(`http://localhost:3001/geocode?lat=${lat}&lon=${lng}`);
    const fullAddress = response.data.display_name || '未知地址';
    const addressParts = fullAddress.split(', ').filter(part => part.trim() !== '中華人民共和國');
    const simplifiedAddress = addressParts.length >= 2
      ? `${addressParts[addressParts.length - 4] || ''} ${addressParts[0]}`.trim()
      : fullAddress;
    return { fullAddress: addressParts.join(', '), simplifiedAddress };
  } catch (error) {
    console.error('逆向地理編碼失敗：', error.message);
    return { fullAddress: '未知地址', simplifiedAddress: '未知地點' };
  }
}

function ReportLost() {
  const [formData, setFormData] = useState({
    userId: 0,
    ownername: '',
    phonePrefix: '+852',
    phoneNumber: '',
    email: '',
    name: '',
    breed: '',
    petType: '',
    gender: '',
    age: '',
    color: '',
    lost_date: '',
    location: '',
    details: '',
    chipNumber: '',
    fullAddress: '',
    displayLocation: '',
    region: '',
    isPublic: false,
    isFound: false,
    isDeleted: false,
  });
  const [photos, setPhotos] = useState([]);
  const [latLng, setLatLng] = useState(null);
  const [photoError, setPhotoError] = useState('');


  const catBreeds = [
    { value: 'british_shorthair', label: 'British Shorthair 英國短毛貓' },
    { value: 'domestick_short_hair_dsh', label: 'Domestic Short Hair (DSH) 家貓 / 唐貓' },
    { value: 'cross_breed_cat_20220113', label: 'Cross Breed Cat 混血貓' },
    { value: 'mixed_breed_cat_20220113', label: 'Mixed Breed Cat 混種貓' },
  ];

  const dogBreeds = [
    { value: 'miniature_poodle', label: 'Poodle 貴婦犬' },
    { value: 'japanese_shiba_inu', label: 'Japanese Shiba Inu 柴犬' },
    { value: 'cross_breed_dog_20220113', label: 'Cross Breed Dog 混血犬' },
    { value: 'mixed_breed_dog_20220113', label: 'Mixed Breed Dog / Mongrel 混種犬 / 唐狗' },
  ];

  const petgender = [
    { value: 'male', label: 'Male 男' },
    { value: 'female', label: 'Female 女' },
  ];

  const petage = [
    { value: 'lt3m', label: '13週以下' },
    { value: '13w11m', label: '13週至11個月' },
    { value: '1y', label: '1歲' },
    { value: '2y', label: '2歲' },
    { value: '3y', label: '3歲' },
    { value: '4y', label: '4歲' },
    { value: '5y', label: '5歲' },
    { value: '6y', label: '6歲' },
    { value: '7y', label: '7歲' },
    { value: '8y', label: '8歲' },
    { value: '9y', label: '9歲' },
    { value: '10y', label: '10歲' },
    { value: '11y', label: '11歲' },
    { value: '12y', label: '12歲' },
    { value: '13y', label: '13歲' },
    { value: '14y', label: '14歲' },
    { value: 'me15y', label: '15歲或以上' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhotoChange = async (e) => {
    const files = [...e.target.files];
    setPhotos(files);
    setPhotoError(''); // 每次選擇新文件時清空錯誤訊息

    if (files.length > 0) {
      const formData = new FormData();
      formData.append('image', files[0]);

      try {
        const response = await axios.post('http://127.0.0.1:5001/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const { has_pet, message } = response.data;
        if (has_pet) {
          const petType = message.toLowerCase().includes('cat') ? 'cat' : 'dog';
          setFormData(prev => ({ ...prev, petType }));
          console.log('檢測結果：', message);
        } else {
          setFormData(prev => ({ ...prev, petType: '' }));
          console.log('無寵物檢測到：', message);
          setPhotoError('圖片檢測失敗，請選擇其他圖片'); // 設置錯誤訊息
          setPhotos([]); // 清除已選擇的文件
          setFormData(prev => ({ ...prev, petType: '' }));
          e.target.value = ""; // 重置文件輸入框
        }
      } catch (error) {
        setPhotoError('圖片檢測失敗，請選擇其他圖片'); // 設置錯誤訊息
        setPhotos([]); // 清除已選擇的文件
        setFormData(prev => ({ ...prev, petType: '' }));
        e.target.value = ""; // 重置文件輸入框
      }
    }
  };

  const handleMapUpdate = (latLngObj) => {
    console.log('更新地圖，latLngObj:', latLngObj);
    const newRegion = latLngObj
      ? (latLngObj.lat >= 22.1 && latLngObj.lat <= 22.6 && latLngObj.lng >= 113.8 && latLngObj.lng <= 114.4)
        ? 'HK'
        : (latLngObj.lat >= 21.9 && latLngObj.lat <= 25.3 && latLngObj.lng >= 120.0 && latLngObj.lng <= 122.0)
          ? 'TW'
          : 'UNKNOWN'
      : formData.region;
    console.log('計算地區:', newRegion);
    setFormData(prev => ({
      ...prev,
      location: latLngObj ? `${latLngObj.lat},${latLngObj.lng}` : prev.location,
      region: newRegion
    }));
    setLatLng(latLngObj);
  };

  const handleSetLocation = (fullAddress, simplifiedAddress) => {
    setFormData(prev => ({
      ...prev,
      fullAddress: fullAddress || prev.fullAddress,
      displayLocation: simplifiedAddress || prev.displayLocation
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('提交前 formData:', formData);
    const formDataToSend = new FormData();
    for (let key in formData) formDataToSend.append(key, formData[key]);
    photos.forEach(photo => formDataToSend.append('photos', photo));

    axios.post('http://localhost:3001/api/report-lost', formDataToSend)
      .then(res => alert(`報失成功，ID: ${res.data.lostId}`))
      .catch(err => console.error('提交失敗:', err));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>主人資料</h2>
      <div>
        <label>你的稱呼：</label>
        <input type="tel" name="ownername" placeholder="如何稱呼你" onChange={handleChange} required />
      </div>
      <div>
        <label>聯絡電話：</label>
        <select name="phonePrefix" value={formData.phonePrefix} onChange={handleChange}>
          <option value="+852">香港 (+852)</option>
          <option value="+886">台灣 (+886)</option>
        </select>
        <input type="tel" name="phoneNumber" placeholder="電話號碼" onChange={handleChange} required />
      </div>
      <div>
        <label>聯絡電郵：</label>
        <input type="email" name="email" placeholder="電郵地址" onChange={handleChange} required />
      </div>
      <div><label>公開聯繫資料:</label><input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} /></div>
      <hr/>
      <h2>寵物資料</h2>
      <label>寵物名稱：</label>
      <label>
      <input type="text" name="name" placeholder="寵物名稱" onChange={handleChange} required />
      </label>
      <div>
        <label>寵物種類：</label>
        <label>
          <input type="radio" name="petType" value="cat" checked={formData.petType === 'cat'} onChange={handleChange} /> 貓
        </label>
        <label>
          <input type="radio" name="petType" value="dog" checked={formData.petType === 'dog'} onChange={handleChange} /> 狗
        </label>
      </div>
      <div>
        <label>品種：</label>
        <select name="breed" value={formData.breed} onChange={handleChange} disabled={!formData.petType}>
          <option value="">選擇品種</option>
          {(formData.petType === 'cat' ? catBreeds : dogBreeds).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label>性別：</label>
        <select name="gender" value={formData.gender} onChange={handleChange}>
          <option value="">選擇性別</option>
          {petgender.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label>年齡：</label>
        <select name="age" value={formData.age} onChange={handleChange}>
          <option value="">選擇年齡</option>
          {petage.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label>顏色：</label>
        <input type="text" name="color" placeholder="顏色" onChange={handleChange} required />
      </div>
      <div>
        <label>遺失時間：</label>
        <input type="date" name="lost_date" onChange={handleChange} required />
      </div>
      <div>
        <label>遺失地點：</label>
        <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '300px', width: '100%', marginTop: '10px' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker setLatLng={handleMapUpdate} setLocation={handleSetLocation} />
        </MapContainer>
        <p>地點: {formData.displayLocation || '未選擇'}</p>
      </div>
      <div><textarea name="details" placeholder="其他詳情 (1000 字符)" onChange={handleChange} maxLength={1000} /></div>
      <div><input type="text" name="chipNumber" placeholder="晶片編號" onChange={handleChange} /></div>
      <div>
        <input type="file" name="photos" multiple onChange={handlePhotoChange} />
        {photoError && <p style={{ color: 'red' }}>{photoError}</p>} {/* 顯示錯誤訊息 */}
      </div>
      
      <input type="hidden" name="region" value={formData.region} />
      <input type="hidden" name="location" value={formData.location} />
      <input type="hidden" name="fullAddress" value={formData.fullAddress} />
      <button type="submit">提交</button>
    </form>
  );
}

export default ReportLost;