import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';

function ReportFound() {
  const [formData, setFormData] = useState({
    name: '', phoneNumber: '', email: '', isPublic: false, found_date: '', found_location: '', found_details: '', phonePrefix: '+852'
  });
  const [photos, setPhotos] = useState([]);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const mapInstance = L.map('map').setView([22.3193, 114.1694], 10); // 預設香港
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);
    mapInstance.on('click', handleMapClick);
    setMap(mapInstance);

    return () => mapInstance.remove(); // 清理
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    const region = (lat >= 22 && lat <= 23 && lng >= 113 && lng <= 115) ? 'HK' : 'TW'; // 簡單判斷
    setFormData(prev => ({ ...prev, found_location: `${lat},${lng}`, region }));
    if (map) L.marker([lat, lng]).addTo(map);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    for (let key in formData) formDataToSend.append(key, formData[key]);
    photos.forEach(photo => formDataToSend.append('photos', photo));

    axios.post('http://localhost:3001/api/report-found', formDataToSend)
      .then(res => alert(`報料成功，ID: ${res.data.foundId}`))
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
      <div><input type="text" name="name" placeholder="聯絡人名稱" onChange={handleChange} required /></div>
      <div><input type="email" name="email" placeholder="聯絡電郵" onChange={handleChange} /></div>
      <div><input type="date" name="found_date" onChange={handleChange} required /></div>
      <div>
        <label>發現地點：</label>
        <div id="map" style={{ height: '300px', width: '100%' }}></div>
        <p>經緯度: {formData.found_location.split(',')[0] || '未選擇'}, {formData.found_location.split(',')[1] || '未選擇'}</p>
      </div>
      <div><textarea name="found_details" placeholder="發現詳情" onChange={handleChange} maxLength={1000} /></div>
      <div><input type="file" name="photos" multiple onChange={handlePhotoChange} /></div>
      <div><label>公開聯繫方式:</label><input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} /></div>
      <input type="hidden" name="found_location" value={formData.found_location} />
      <button type="submit">提交</button>
    </form>
  );
}

export default ReportFound;