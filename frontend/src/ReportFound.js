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
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setLatLng({ lat, lng });
      reverseGeocode(lat, lng).then(({ fullAddress, simplifiedAddress }) => {
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

function ReportFound() {
  const [formData, setFormData] = useState({
    userId: 0,
    reportername: '',
    phonePrefix: '+852',
    phoneNumber: '',
    email: '',
    breed: '',
    petType: '',
    gender: '',
    age: '',
    color: '',
    found_date: '',
    found_location: '',
    found_details: '',
    region: '',
    chipNumber: '',
    fullAddress: '',
    displayLocation: '',
    holding_location: '',
    status: '',
    isPublic: false,
    isFound: false,
    isDeleted: false,
  });
  const [photos, setPhotos] = useState([]);
  const [latLng, setLatLng] = useState(null);
  const [geoError, setGeoError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    const selectedFiles = [...e.target.files];
    if (selectedFiles.length > 5) {
      alert('最多只能上傳 5 張相片！');
      setPhotos(selectedFiles.slice(0, 5));
    } else {
      setPhotos(selectedFiles);
    }
  };

  const handleMapUpdate = (latLngObj) => {
    console.log('更新地圖，latLngObj:', latLngObj);
    const newRegion = latLngObj
      ? latLngObj.lat >= 22.1 && latLngObj.lat <= 22.6 && latLngObj.lng >= 113.8 && latLngObj.lng <= 114.4
        ? 'HK'
        : latLngObj.lat >= 21.9 && latLngObj.lat <= 25.3 && latLngObj.lng >= 120.0 && latLngObj.lng <= 122.0
        ? 'TW'
        : 'UNKNOWN'
      : formData.region;
    console.log('計算地區:', newRegion);
    setFormData(prev => ({
      ...prev,
      location: latLngObj ? `${latLngObj.lat},${latLngObj.lng}` : prev.location,
      region: newRegion,
    }));
    setLatLng(latLngObj);
  };

  const handleSetLocation = (fullAddress, simplifiedAddress) => {
    setFormData(prev => ({
      ...prev,
      fullAddress: fullAddress || prev.fullAddress,
      displayLocation: simplifiedAddress || prev.displayLocation,
    }));
    setGeoError(''); // 清除錯誤提示
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.petType) {
      alert('請選擇寵物種類！');
      return;
    }
    if (!formData.breed) {
      alert('請選擇品種！');
      return;
    }
    if (!formData.found_date) {
      alert('請選擇發現時間！');
      return;
    }

    const formDataToSend = new FormData();
    for (let key in formData) formDataToSend.append(key, formData[key]);
    photos.forEach(photo => formDataToSend.append('photos', photo));

    axios.post('http://localhost:3001/api/report-found', formDataToSend)
      .then(res => alert(`報料成功，ID: ${res.data.foundId}`))
      .catch(err => console.error('提交失敗:', err));
  };

  return (
    <section className="section">
      <div className="container">
        <div className="custom-form">
          <form onSubmit={handleSubmit}>
            {/* 寵物資料 */}
            <div className="form-card">
              <h2 className="title is-4">寵物資料</h2>
              <div className="field">
                <label className="label">寵物種類：</label>
                <div className="control">
                  <label className="radio mr-4">
                    <input type="radio" name="petType" value="cat" checked={formData.petType === 'cat'} onChange={handleChange} /> 貓
                  </label>
                  <label className="radio">
                    <input type="radio" name="petType" value="dog" checked={formData.petType === 'dog'} onChange={handleChange} /> 狗
                  </label>
                </div>
              </div>
              <div className="field">
                <label className="label">品種：</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select name="breed" value={formData.breed} onChange={handleChange} disabled={!formData.petType}>
                      <option value="">選擇品種</option>
                      {(formData.petType === 'cat' ? catBreeds : dogBreeds).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
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
                <label className="label">年齡：</label>
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
                <label className="label">顏色：</label>
                <div className="control">
                  <input className="input" type="text" name="color" placeholder="顏色" value={formData.color} onChange={handleChange} required />
                </div>
              </div>
              <div className="field">
                <label className="label">晶片號碼：</label>
                <div className="control">
                  <input className="input" type="text" name="chipNumber" placeholder="晶片編號" value={formData.chipNumber} onChange={handleChange} />
                </div>
              </div>
              <div className="field">
                <label className="label">尋獲地點：</label>
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
                  {geoError && <p className="help is-danger">{geoError}</p>}
                </div>
              </div>
              <div className="field">
                <label className="label">發現時間：</label>
                <div className="control">
                  <input className="input" type="date" name="found_date" value={formData.found_date} onChange={handleChange} required />
                </div>
              </div>
              <div className="field">
                <label className="label">發現詳情：</label>
                <div className="control">
                  <textarea
                    className="textarea"
                    name="found_details"
                    placeholder="請描述發現寵物嘅詳情（例如地點、情況等）"
                    value={formData.found_details}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">受理情形：</label>
                <div className="control">
                  <input className="input" type="text" name="status" placeholder="受理情形" value={formData.status} onChange={handleChange} />
                </div>
              </div>
              <div className="field">
                <label className="label">留置地點：</label>
                <div className="control">
                  <input className="input" type="text" name="holding_location" placeholder="留置地點" value={formData.holding_location} onChange={handleChange} />
                </div>
              </div>
              <div className="field">
                <label className="label">上傳照片（最多 5 張）：</label>
                <div className="control">
                  <input
                    className="input"
                    type="file"
                    name="photos"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* 聯絡資料 */}
            <div className="form-card">
              <h2 className="title is-4">聯絡資料</h2>
              <div className="field">
                <label className="label">聯絡人名稱：</label>
                <div className="control">
                  <input className="input" type="text" name="reportername" placeholder="聯絡人名稱" value={formData.reportername} onChange={handleChange} required />
                </div>
              </div>
              <div className="field">
                <label className="label">聯絡電話：</label>
                <div className="control is-flex">
                  <div className="select">
                    <select name="phonePrefix" value={formData.phonePrefix} onChange={handleChange}>
                      <option value="+852">香港 (+852)</option>
                      <option value="+886">台灣 (+886)</option>
                    </select>
                  </div>
                  <input className="input ml-2" type="tel" name="phoneNumber" placeholder="電話號碼" value={formData.phoneNumber} onChange={handleChange} required />
                </div>
              </div>
              <div className="field">
                <label className="label">聯絡電郵：</label>
                <div className="control">
                  <input className="input" type="email" name="email" placeholder="電郵地址" value={formData.email} onChange={handleChange} />
                </div>
              </div>
              <div className="field">
                <label className="checkbox">
                  <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} /> 公開聯繫資料
                </label>
              </div>
            </div>
            
            <input type="hidden" name="region" value={formData.region} />
            <input type="hidden" name="found_location" value={formData.found_location} />
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

export default ReportFound;