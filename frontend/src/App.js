import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ReportLost from './ReportLost';
import ReportFound from './ReportFound';
import PetDetail from './PetDetail';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // 引入 Leaflet CSS
import './App.css'; // 引入 App.css

function App() {
  const [lostPets, setLostPets] = useState([]);
  const [foundPets, setFoundPets] = useState([]);

  useEffect(() => {
    // 獲取走失寵物數據
    axios.get('http://localhost:3001/api/lost-pets')
      .then(res => setLostPets(res.data))
      .catch(err => {
        console.error('獲取走失寵物失敗:', err.message);
        alert('無法連接到後端服務，請檢查後端是否運行');
      });

    // 獲取報料寵物數據
    axios.get('http://localhost:3001/api/found-pets')
      .then(res => setFoundPets(res.data))
      .catch(err => {
        console.error('獲取報料寵物失敗:', err.message);
        alert('無法連接到後端服務，請檢查後端是否運行');
      });
  }, []);

  return (
    <Router>
      <div className="container">
        {/* 導航欄 */}
        <nav className="navbar">
          <div className="logo">LOGO</div>
          <div className="navLinks">
            <Link to="/" className="navLink">首頁</Link>
            <Link to="/account" className="navLink">帳戶</Link>
          </div>
          <div className="userProfile">
            <span>報料者: User Name</span>
            <img src="https://via.placeholder.com/30" alt="User" className="userAvatar" />
          </div>
        </nav>

        <Routes>
          <Route path="/report-lost" element={<ReportLost />} />
          <Route path="/report-found" element={<ReportFound />} />
          <Route path="/pet/:id" element={<PetDetail />} />
          <Route path="/account" element={<div>帳戶頁面（待開發）</div>} />
          <Route path="/" element={
            <div className="mainContent">
              {/* 四個主要按鈕 */}
              <div className="buttonSection">
                <Link to="/report-found" className="mainButton">同搜報料</Link>
                <Link to="/report-lost" className="mainButton">報失列表</Link>
                <Link to="/" className="mainButton">主人報失</Link>
                <Link to="/" className="mainButton">我要報料</Link>
              </div>
              <div className="contentWrapper">
                {/* 左側走失寵物列表 */}
                <div className="leftPanel">
                  <h2 className="sectionTitle">走失寵物列表</h2>
                  <div className="petList">
                    {lostPets.map(pet => (
                      <div key={pet.lostId} className="petCard">
                        {pet.photos && (
                          <img
                            src={`http://localhost:3001/uploads/${pet.photos.split(',')[0].split('/').pop()}`}
                            alt={pet.name}
                            className="petImage"
                          />
                        )}
                        <div className="petInfo">
                          <p className="petName">{pet.name}</p>
                          <Link to={`/pet/${pet.lostId}`} className="reportButton">個案詳情</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右側單品位置（留空） */}
                <div className="rightPanel">
                  <h2 className="sectionTitle">單品位置</h2>
                  <p className="placeholderText">（暫時留空，日後添加內容）</p>
                </div>
              </div>

              {/* 底部地圖 */}
              <div className="mapSection">
                <MapContainer center={[22.3193, 114.1694]} zoom={10} style={{ height: '300px', width: '100%', borderRadius: '10px' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {lostPets.map(pet => {
                    if (pet.location) {
                      const [lat, lng] = pet.location.split(',').map(coord => parseFloat(coord));
                      if (!isNaN(lat) && !isNaN(lng)) {
                        return (
                          <Marker key={pet.lostId} position={[lat, lng]}>
                            <Popup>
                              <b>{pet.name}</b><br />
                              <a href={`/pet/${pet.lostId}`}>查看詳情</a>
                            </Popup>
                          </Marker>
                        );
                      }
                    }
                    return null;
                  })}
                </MapContainer>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;