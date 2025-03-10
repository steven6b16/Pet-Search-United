import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function ReportLost() {
  const [formData, setFormData] = useState({
    name: '', petType: '', breed: '', gender: '', age: '', color: '', lost_date: '', location: '', details: '', chipNumber: '',
    phoneNumber: '', email: '', isPublic: false, phonePrefix: '+852', fullAddress: '', displayLocation: ''
  });
  const [photos, setPhotos] = useState([]);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

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

  useEffect(() => {
    const mapInstance = L.map('map').setView([22.3193, 114.1694], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);
    mapInstance.on('click', handleMapClick);
    setMap(mapInstance);

    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 0);

    return () => mapInstance.remove();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    const region = (lat >= 22 && lat <= 23 && lng >= 113 && lng <= 115) ? 'HK' : 'TW';
    // 使用 Nominatim API 獲取完整地址
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const address = response.data.display_name || "未知地址";
      const addressParts = address.split(',').map(part => part.trim());
      const districtIndex = addressParts.findIndex(part => part.match(/區$/));
      const displayLocation = districtIndex > -1 ? `${addressParts[districtIndex]} ${addressParts[districtIndex - 4] || ''}`.trim() : address; // 顯示區 + 上一個地標

      setFormData(prev => ({ ...prev, location: `${lat},${lng}`, region, fullAddress: address, displayLocation }));
    } catch (error) {
      setFormData(prev => ({ ...prev, location: `${lat},${lng}`, region, fullAddress: "未知地址", displayLocation: "未知地點" }));
    }
    if (map) {
      if (marker) map.removeLayer(marker); // 移除舊 PIN
      const customIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41]
      });
      const newMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      setMarker(newMarker); // 儲存新 PIN
    }
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
          <input
            type="radio"
            name="petType"
            value="cat"
            checked={formData.petType === 'cat'}
            onChange={handleChange}
          />
          貓
        </label>
        <label>
          <input
            type="radio"
            name="petType"
            value="dog"
            checked={formData.petType === 'dog'}
            onChange={handleChange}
          />
          狗
        </label>
      </div>
      <div>
        <label>品種：</label>
        <select
          name="breed"
          value={formData.breed}
          onChange={handleChange}
          disabled={!formData.petType}
        >
          <option value="">選擇品種</option>
          {(formData.petType === 'cat' ? catBreeds : dogBreeds).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div><input type="text" name="gender" placeholder="性別" onChange={handleChange} required /></div>
      <div><input type="number" name="age" placeholder="年齡" onChange={handleChange} /></div>
      <div><input type="text" name="color" placeholder="顏色" onChange={handleChange} required /></div>
      <div><input type="date" name="lost_date" onChange={handleChange} required /></div>
      <div>
        <label>遺失地點：</label>
        <div id="map" style={{ height: '300px', width: '100%' }}></div>
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