import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from 'react-leaflet';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBreed, setFilterBreed] = useState('');
  const [filterColor, setFilterColor] = useState('');

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

  const filteredPets = lostPets.filter(pet => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = (
      pet.name.toLowerCase().includes(searchLower) ||
      pet.lat.toString().includes(searchLower) ||
      pet.lng.toString().includes(searchLower)
    );
    const matchBreed = !filterBreed || pet.breed === filterBreed;
    const matchColor = !filterColor || pet.color === filterColor;
    return matchSearch && matchBreed && matchColor;
  });

  return (
    <div className="App">
      <header className="app-header">
        <h1>同搜毛棄 - Pet Search United</h1>
        <p>尋找走失寵物的社區平台</p>
      </header>
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
          <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '200px', width: '100%' }} zoomControl={false}>
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
        <input
          type="text"
          placeholder="搜尋名稱或經緯度..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '10px', padding: '5px', width: '200px' }}
        />
        <div style={{ marginBottom: '10px' }}>
          <label>篩選品種：</label>
          <input
            type="text"
            value={filterBreed}
            onChange={(e) => setFilterBreed(e.target.value)}
            placeholder="例如：拉布拉多"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
          <label style={{ marginLeft: '20px' }}>篩選顏色：</label>
          <input
            type="text"
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            placeholder="例如：黑色"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        {filteredPets.map(pet => (
          <div key={pet.id} className="pet-card">
            <p>名稱：{pet.name}</p>
            <p>品種：{pet.breed}</p>
            <p>顏色：{pet.color}</p>
            <p>地點：{pet.location || `經 ${pet.lat}, 緯 ${pet.lng}`}</p>
            {pet.photo && <img src={`http://localhost:5000/${pet.photo}`} alt={pet.name} width="100" />}
          </div>
        ))}
      </div>

      <h2>走失地點地圖</h2>
      <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '400px', width: '100%' }} zoomControl={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredPets
          .filter(pet => pet.lat != null && pet.lng != null)
          .map(pet => (
            <Marker key={pet.id} position={[pet.lat, pet.lng]}>
              <Popup>
                <div>
                  <strong>名稱：</strong>{pet.name}<br />
                  <strong>品種：</strong>{pet.breed}<br />
                  <strong>顏色：</strong>{pet.color}<br />
                  <strong>地點：</strong>{pet.location || `經 ${pet.lat}, 緯 ${pet.lng}`}<br />
                  {pet.photo && <img src={`http://localhost:5000/${pet.photo}`} alt={pet.name} width="100" />}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

export default App;