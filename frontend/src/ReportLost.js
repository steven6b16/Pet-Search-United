import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'; // 導入 useMapEvents
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
    const addressParts = fullAddress.split(', ').filter(part => part.trim());
    const simplifiedAddress = addressParts.length >= 2
      ? `${addressParts[addressParts.length - 4] || ''} ${addressParts[0]}`.trim()
      : fullAddress;
    return { fullAddress, simplifiedAddress };
  } catch (error) {
    console.error('逆向地理編碼失敗：', error.message);
    return { fullAddress: '未知地址', simplifiedAddress: '未知地點' };
  }
}

function ReportLost() {
  const [formData, setFormData] = useState({
    name: '',
    petType: '',
    breed: '',
    gender: '',
    age: '',
    color: '',
    lost_date: '',
    location: '',
    details: '',
    chipNumber: '',
    phoneNumber: '',
    email: '',
    isPublic: false,
    phonePrefix: '+852',
    fullAddress: '',
    displayLocation: '',
    region: ''
  });
  const [photos, setPhotos] = useState([]);
  const [latLng, setLatLng] = useState(null);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleMapUpdate = (latLngObj, fullAddress, simplifiedAddress) => {
    setFormData(prev => ({
      ...prev,
      location: latLngObj ? `${latLngObj.lat},${latLngObj.lng}` : prev.location,
      region: latLngObj && (latLngObj.lat >= 22 && latLngObj.lat <= 23 && latLngObj.lng >= 113 && latLngObj.lng <= 115) ? 'HK' : 'TW',
      fullAddress: fullAddress || prev.fullAddress,
      displayLocation: simplifiedAddress || prev.displayLocation
    }));
    setLatLng(latLngObj);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    for (let key in formData) formDataToSend.append(key, formData[key]);
    photos.forEach(photo => formDataToSend.append('photos', photo));

    axios.post('http://localhost:3001/api/report-lost', formDataToSend)
      .then(res => alert(`報失成功，ID: ${res.data.lostId}`))
      .catch(err => console.error(err));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>聯絡電話：</label>
        <select name="phonePrefix" value={formData.phonePrefix} onChange={handleChange}>
          <option value="+852">香港 (+852)</option>
          <option value="+886">台灣 (+886)</option>
        </select>
        <input type="tel" name="phoneNumber" placeholder="電話號碼" onChange={handleChange} required />
      </div>
      <div><input type="text" name="name" placeholder="寵物名稱" onChange={handleChange} required /></div>
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
      <div><input type="text" name="gender" placeholder="性別" onChange={handleChange} required /></div>
      <div><input type="number" name="age" placeholder="年齡" onChange={handleChange} /></div>
      <div><input type="text" name="color" placeholder="顏色" onChange={handleChange} required /></div>
      <div><input type="date" name="lost_date" onChange={handleChange} required /></div>
      <div>
        <label>遺失地點：</label>
        <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '300px', width: '100%', marginTop: '10px' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker setLatLng={handleMapUpdate} setLocation={(fullAddress, simplifiedAddress) => handleMapUpdate(null, fullAddress, simplifiedAddress)} />
        </MapContainer>
        <p>地點: {formData.displayLocation || '未選擇'}</p>
      </div>
      <div><textarea name="details" placeholder="其他詳情 (1000 字符)" onChange={handleChange} maxLength={1000} /></div>
      <div><input type="text" name="chipNumber" placeholder="晶片編號" onChange={handleChange} /></div>
      <div><input type="file" name="photos" multiple onChange={handlePhotoChange} /></div>
      <div><label>公開聯繫方式:</label><input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} /></div>
      <input type="hidden" name="location" value={formData.location} />
      <input type="hidden" name="fullAddress" value={formData.fullAddress} />
      <button type="submit">提交</button>
    </form>
  );
}

export default ReportLost;