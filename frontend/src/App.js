import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// 手動設定預設圖標
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png', // 確保檔案在public資料夾
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41], // 正常圖標大小
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon; // 設定為預設圖標

function LocationMarker({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function App() {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [position, setPosition] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [lostPets, setLostPets] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/lost-pets')
      .then(response => {
        setLostPets(response.data);
      })
      .catch(error => {
        console.log('拿資料失敗：', error);
      });
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!position) {
      alert('請在地圖上選一個地點！');
      return;
    }
    const formData = new FormData();
    formData.append('name', name);
    formData.append('breed', breed);
    formData.append('color', color);
    formData.append('lat', position[0]);
    formData.append('lng', position[1]);
    formData.append('photo', photo);

    axios.post('http://localhost:5000/api/report-lost', formData)
      .then(response => {
        alert(response.data);
        axios.get('http://localhost:5000/api/lost-pets')
          .then(response => {
            setLostPets(response.data);
            setPosition(null);
          });
      })
      .catch(error => {
        console.log('錯誤：', error);
      });
  };

  return (
    <div className="App">
      <h1>尋寵記</h1>
      <h2>報失寵物</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>寵物名稱：</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：小黑" />
        </div>
        <div>
          <label>品種：</label>
          <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="例如：拉布拉多" />
        </div>
        <div>
          <label>顏色：</label>
          <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="例如：黑色" />
        </div>
        <div>
          <label>走失地點（請在地圖上點選）：</label>
          <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '200px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {position && <Marker position={position}><Popup>您選的地點</Popup></Marker>}
            <LocationMarker setPosition={setPosition} />
          </MapContainer>
        </div>
        <div>
          <label>上傳照片：</label>
          <input type="file" onChange={(e) => setPhoto(e.target.files[0])} />
        </div>
        <button type="submit">提交</button>
      </form>

      <h2>走失寵物列表</h2>
      <div>
        {lostPets.map(pet => (
          <div key={pet.id} className="pet-card">
            <p>名稱：{pet.name}</p>
            <p>品種：{pet.breed}</p>
            <p>顏色：{pet.color}</p>
            <p>地點：經 {pet.lat}, 緯 {pet.lng}</p>
            {pet.photo && <img src={`http://localhost:5000/${pet.photo}`} alt={pet.name} width="100" />}
          </div>
        ))}
      </div>

      <h2>走失地點地圖</h2>
      <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {lostPets
          .filter(pet => pet.lat != null && pet.lng != null)
          .map(pet => (
            <Marker key={pet.id} position={[pet.lat, pet.lng]}>
              <Popup>{pet.name} - 經 {pet.lat}, 緯 {pet.lng}</Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

export default App;