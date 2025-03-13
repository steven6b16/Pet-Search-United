import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Reportpage.css';
import { catBreeds, dogBreeds, petage } from './constants/PetConstants';

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
  const [frontPhoto, setFrontPhoto] = useState(null); // 正面相
  const [sidePhoto, setSidePhoto] = useState(null);   // 側面相
  const [otherPhotos, setOtherPhotos] = useState([]); // 其他相片
  const [latLng, setLatLng] = useState(null);
  const [photoError, setPhotoError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFrontPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontPhoto(file);
      setPhotoError('');
      await processPhoto(file);
    }
  };

  const handleSidePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSidePhoto(file);
      setPhotoError('');
      await processPhoto(file);
    }
  };

  const handleOtherPhotosChange = async (e) => {
    const files = [...e.target.files];
    if (files.length > 5) {
      setPhotoError('其他相片最多只能上傳 5 張');
      e.target.value = '';
      return;
    }
    setOtherPhotos(files);
    setPhotoError('');
    if (files.length > 0) {
      await processPhoto(files[0]); // 只處理第一張進行寵物檢測
    }
  };

  const processPhoto = async (file) => {
    const photoFormData = new FormData();
    photoFormData.append('image', file);

    try {
      const response = await axios.post('http://127.0.0.1:5001/upload', photoFormData, {
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
        setPhotoError('圖片檢測失敗，請選擇其他圖片');
        setFrontPhoto(null);
        setSidePhoto(null);
        setOtherPhotos([]);
      }
    } catch (error) {
      setPhotoError('圖片檢測失敗，請選擇其他圖片');
      setFrontPhoto(null);
      setSidePhoto(null);
      setOtherPhotos([]);
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
    if (frontPhoto) formDataToSend.append('frontPhoto', frontPhoto);
    if (sidePhoto) formDataToSend.append('sidePhoto', sidePhoto);
    otherPhotos.forEach(photo => formDataToSend.append('otherPhotos', photo));

    axios.post('http://localhost:3001/api/report-lost', formDataToSend)
      .then(res => alert(`報失成功，ID: ${res.data.lostId}`))
      .catch(err => console.error('提交失敗:', err));
  };

  return (
    <section className="section">
      <div className="container">
        <div className="custom-form">
          <form onSubmit={handleSubmit}>
            {/* 主人資料 */}
            <div className="form-card">
              <h2 className="title is-4">主人資料</h2>
              <div className="field">
                <label className="label">你的稱呼</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="ownername"
                    placeholder="如何稱呼你"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">聯絡電話</label>
                <div className="control is-flex">
                  <div className="select">
                    <select name="phonePrefix" value={formData.phonePrefix} onChange={handleChange}>
                      <option value="+852">香港 (+852)</option>
                      <option value="+886">台灣 (+886)</option>
                    </select>
                  </div>
                  <input
                    className="input ml-2"
                    type="tel"
                    name="phoneNumber"
                    placeholder="電話號碼"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">聯絡電郵</label>
                <div className="control">
                  <input
                    className="input"
                    type="email"
                    name="email"
                    placeholder="電郵地址"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                  /> 公開聯繫資料
                </label>
              </div>
            </div>
<hr></hr>
            {/* 寵物資料 */}
            <div className="form-card">
              <h2 className="title is-4">寵物資料</h2>
              <div className="field">
                <label className="label">寵物名稱</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="name"
                    placeholder="寵物名稱"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">寵物種類</label>
                <div className="control">
                  <label className="radio mr-4">
                    <input
                      type="radio"
                      name="petType"
                      value="cat"
                      checked={formData.petType === 'cat'}
                      onChange={handleChange}
                    /> 貓
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="petType"
                      value="dog"
                      checked={formData.petType === 'dog'}
                      onChange={handleChange}
                    /> 狗
                  </label>
                </div>
              </div>

              <div className="field">
                <label className="label">性別</label>
                <div className="control">
                  <label className="radio mr-4">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                    /> 公
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                    /> 母
                  </label>
                </div>
              </div>

              <div className="field">
                <label className="label">品種</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      disabled={!formData.petType}
                    >
                      <option value="">選擇品種</option>
                      {(formData.petType === 'cat' ? catBreeds : dogBreeds).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="label">年齡</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select name="age" value={formData.age} onChange={handleChange}>
                      <option value="">選擇年齡</option>
                      {petage.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="label">顏色</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="color"
                    placeholder="顏色"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">遺失時間</label>
                <div className="control">
                  <input
                    className="input"
                    type="date"
                    name="lost_date"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">遺失地點</label>
                <div className="control">
                  <div className="map-container">
                    <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '300px', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <LocationMarker setLatLng={handleMapUpdate} setLocation={handleSetLocation} />
                    </MapContainer>
                  </div>
                  <p className="help">地點: {formData.displayLocation || '未選擇'}</p>
                </div>
              </div>

              <div className="field">
                <label className="label">其他詳情</label>
                <div className="control">
                  <textarea
                    className="textarea"
                    name="details"
                    placeholder="其他詳情 (1000 字符)"
                    onChange={handleChange}
                    maxLength={1000}
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">晶片編號</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="chipNumber"
                    placeholder="晶片編號"
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* 新增：正面相 */}
              <div className="field">
                <label className="label">寵物正面相（1 張）</label>
                <div className="control">
                  <input
                    className="input"
                    type="file"
                    name="frontPhoto"
                    accept="image/*"
                    onChange={handleFrontPhotoChange}
                  />
                  {frontPhoto && <p className="help">已選擇: {frontPhoto.name}</p>}
                </div>
              </div>

              {/* 新增：側面相 */}
              <div className="field">
                <label className="label">寵物側面相（1 張）</label>
                <div className="control">
                  <input
                    className="input"
                    type="file"
                    name="sidePhoto"
                    accept="image/*"
                    onChange={handleSidePhotoChange}
                  />
                  {sidePhoto && <p className="help">已選擇: {sidePhoto.name}</p>}
                </div>
              </div>

              {/* 新增：其他相片 */}
              <div className="field">
                <label className="label">其他相片（最多 5 張）</label>
                <div className="control">
                  <input
                    className="input"
                    type="file"
                    name="otherPhotos"
                    multiple
                    accept="image/*"
                    onChange={handleOtherPhotosChange}
                  />
                  {otherPhotos.length > 0 && (
                    <p className="help">已選擇: {otherPhotos.length} 張</p>
                  )}
                  {photoError && <p className="help is-danger">{photoError}</p>}
                </div>
              </div>
            </div>

            <input type="hidden" name="region" value={formData.region} />
            <input type="hidden" name="location" value={formData.location} />
            <input type="hidden" name="fullAddress" value={formData.fullAddress} />

            <div className="field">
              <div className="control">
                <button className="custom-button" type="submit">提交</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ReportLost;