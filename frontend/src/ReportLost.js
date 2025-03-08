import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

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

  return position === null ? null : <Marker position={position} icon={defaultIcon} />;
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'PetSearchUnited/1.0 (steven6b16@gmail.com)',
        },
      }
    );
    const fullAddress = response.data.display_name || '未知地址';
    const addressParts = fullAddress.split(', ').filter(part => part.trim());
    const simplifiedAddress = addressParts.length >= 2
      ? `${addressParts[addressParts.length - 4]} ${addressParts[0]}` // 提取區名同主要地點
      : fullAddress;
    return { fullAddress, simplifiedAddress };
  } catch (error) {
    console.error('逆向地理編碼失敗：', error.message);
    return { fullAddress: '未知地址', simplifiedAddress: '未知地址' };
  }
}

function ReportLost() {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    color: '',
    lat: '',
    lng: '',
    location: '', // 用於顯示簡化地址
    fullLocation: '', // 用於儲存完整地址
    species: '狗',
    gender: '未知',
    age: '',
    contact: '',
    lost_date: '',
    photo: null,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, photo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMapUpdate = (latLng, fullAddress, simplifiedAddress) => {
    setFormData(prev => ({
      ...prev,
      lat: latLng ? latLng.lat : prev.lat,
      lng: latLng ? latLng.lng : prev.lng,
      location: simplifiedAddress || prev.location,
      fullLocation: fullAddress || prev.fullLocation,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'photo' && formData[key]) {
        data.append(key, formData[key]);
      } else {
        data.append(key, formData[key]);
      }
    });
    // 提交時使用完整地址
    data.set('location', formData.fullLocation);

    try {
      const response = await axios.post('http://localhost:5000/api/report-lost', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(response.data.message);
      setError('');
      setFormData({
        name: '',
        breed: '',
        color: '',
        lat: '',
        lng: '',
        location: '',
        fullLocation: '',
        species: '狗',
        gender: '未知',
        age: '',
        contact: '',
        lost_date: '',
        photo: null,
      });
    } catch (err) {
      setError(err.response?.data?.error || '提交失敗！');
      setMessage('');
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>同搜毛棄 - 報失寵物</h1>
        <p>請填寫走失寵物信息</p>
        <a href="/" className="report-button">返回首頁</a>
      </header>
      <div>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div>
            <label>名稱：</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <label>品種：</label>
            <input type="text" name="breed" value={formData.breed} onChange={handleChange} />
          </div>
          <div>
            <label>顏色：</label>
            <input type="text" name="color" value={formData.color} onChange={handleChange} />
          </div>
          <div>
            <label>性別：</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="未知">未知</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label>年齡：</label>
            <input type="text" name="age" value={formData.age} onChange={handleChange} placeholder="例如: 2 或 1-3" />
          </div>
          <div>
            <label>聯繫方式：</label>
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} placeholder="電話或郵箱" />
          </div>
          <div>
            <label>走失日期：</label>
            <input type="date" name="lost_date" value={formData.lost_date} onChange={handleChange} />
          </div>
          <div>
            <label>物種：</label>
            <select name="species" value={formData.species} onChange={handleChange}>
              <option value="狗">狗</option>
              <option value="貓">貓</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label>照片：</label>
            <input type="file" name="photo" accept="image/*" onChange={handleChange} />
          </div>
          <div>
            <label>地點：</label>
            <input type="text" name="location" value={formData.location} readOnly />
            <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '400px', width: '100%', marginTop: '10px' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker setLatLng={handleMapUpdate} setLocation={(fullAddress, simplifiedAddress) => handleMapUpdate(null, fullAddress, simplifiedAddress)} />
            </MapContainer>
          </div>
          <button type="submit">提交報失</button>
        </form>
      </div>
    </div>
  );
}

export default ReportLost;