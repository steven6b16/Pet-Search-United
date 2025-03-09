import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';

function ReportLost() {
  const [formData, setFormData] = useState({
    name: '', species: '', breed: '', gender: '', age: '', color: '', lost_date: '', location: '', details: '', chipNumber: '',
    phoneNumber: '', email: '', isPublic: false, phonePrefix: '+852'
  });
  const [photos, setPhotos] = useState([]);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const mapInstance = L.map('map').setView([22.3193, 114.1694], 10); // 預設香港
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);
    mapInstance.on('click', handleMapClick);
    setMap(mapInstance);

    // 確保地圖尺寸正確
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 0);

    return () => mapInstance.remove(); // 清理
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    const region = (lat >= 22 && lat <= 23 && lng >= 113 && lng <= 115) ? 'HK' : 'TW';
    setFormData(prev => ({ ...prev, location: `${lat},${lng}`, region }));
    if (map) L.marker([lat, lng]).addTo(map);
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
      <div><input type="text" name="species" placeholder="物種" onChange={handleChange} required /></div>
      <div><input type="text" name="breed" placeholder="品種" onChange={handleChange} /></div>
      <div><input type="text" name="gender" placeholder="性別" onChange={handleChange} required /></div>
      <div><input type="number" name="age" placeholder="年齡" onChange={handleChange} /></div>
      <div><input type="text" name="color" placeholder="顏色" onChange={handleChange} required /></div>
      <div><input type="date" name="lost_date" onChange={handleChange} required /></div>
      <div>
        <label>遺失地點：</label>
        <div id="map" style={{ height: '300px', width: '100%' }}></div>
        <p>經緯度: {formData.location.split(',')[0] || '未選擇'}, {formData.location.split(',')[1] || '未選擇'}</p>
      </div>
      <div><textarea name="details" placeholder="其他詳情 (1000 字符)" onChange={handleChange} maxLength={1000} /></div>
      <div><input type="text" name="chipNumber" placeholder="晶片編號" onChange={handleChange} /></div>
      <div><input type="file" name="photos" multiple onChange={handlePhotoChange} /></div>
      <div><label>公開聯繫方式:</label><input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} /></div>
      <input type="hidden" name="location" value={formData.location} />
      <button type="submit">提交</button>
    </form>
  );
}

export default ReportLost;