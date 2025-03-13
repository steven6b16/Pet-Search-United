import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
    petType: '',
    breed: '',
    gender: '',
    age: '',
    color: '',
    chipNumber: '',
    found_date: '',
    found_location: '',
    fullAddress: '',
    displayLocation: '',
    holding_location: '',
    contact_name: '',
    phonePrefix: '+852',
    phoneNumber: '',
    email: '',
    status: '',
    isPublic: false,
  });
  const [photos, setPhotos] = useState([]);
  const [latLng, setLatLng] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleMapUpdate = (latLngObj) => {
    setFormData(prev => ({
      ...prev,
      found_location: latLngObj ? `${latLngObj.lat},${latLngObj.lng}` : prev.found_location,
    }));
    setLatLng(latLngObj);
  };

  const handleSetLocation = (fullAddress, simplifiedAddress) => {
    setFormData(prev => ({
      ...prev,
      fullAddress: fullAddress || prev.fullAddress,
      displayLocation: simplifiedAddress || prev.displayLocation,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    for (let key in formData) formDataToSend.append(key, formData[key]);
    photos.forEach(photo => formDataToSend.append('photos', photo));

    axios.post('http://localhost:3001/api/report-found', formDataToSend)
      .then(res => alert(`報料成功，ID: ${res.data.foundId}`))
      .catch(err => console.error('提交失敗:', err));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>寵物資料</h2>
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
        <label>晶片號碼：</label>
        <input type="text" name="chipNumber" placeholder="晶片編號" onChange={handleChange} />
      </div>
      <div>
        <label>尋獲地點：</label>
        <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '300px', width: '100%', marginTop: '10px' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker setLatLng={handleMapUpdate} setLocation={handleSetLocation} />
        </MapContainer>
        <p>地點: {formData.displayLocation || '未選擇'}</p>
      </div>
      <div>
        <label>發現時間：</label>
        <input type="date" name="found_date" onChange={handleChange} required />
      </div>
      <div>
        <label>受理情形：</label>
        <input type="text" name="status" placeholder="受理情形" onChange={handleChange} />
      </div>
      <div>
        <label>留置地點：</label>
        <input type="text" name="holding_location" placeholder="留置地點" onChange={handleChange} />
      </div>
<hr></hr>
      <h2>聯絡資料</h2>
      <div>
        <label>聯絡人名稱：</label>
        <input type="text" name="contact_name" placeholder="聯絡人名稱" onChange={handleChange} required />
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
        <input type="email" name="email" placeholder="電郵地址" onChange={handleChange} />
      </div>
      <div>
        <label>公開聯繫資料:</label>
        <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} />
      </div>

      <div>
        <label>上傳照片：</label>
        <input type="file" name="photos" multiple onChange={handlePhotoChange} />
      </div>

      <input type="hidden" name="found_location" value={formData.found_location} />
      <input type="hidden" name="fullAddress" value={formData.fullAddress} />
      <button type="submit">提交</button>
    </form>
  );
}

export default ReportFound;