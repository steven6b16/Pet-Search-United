import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ReportLost from './ReportLost';
import ReportFound from './ReportFound';
import PetDetail from './PetDetail';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // 引入 Leaflet CSS

function App() {
  const [lostPets, setLostPets] = useState([]);
  const [foundPets, setFoundPets] = useState([]);

  useEffect(() => {
    // 獲取走失寵物數據
    axios
      .get('http://localhost:3001/api/lost-pets')
      .then(res => setLostPets(res.data))
      .catch(err => {
        console.error('獲取走失寵物失敗:', err.message);
        alert('無法連接到後端服務，請檢查後端是否運行');
      });

    // 獲取報料寵物數據
    axios
      .get('http://localhost:3001/api/found-pets')
      .then(res => setFoundPets(res.data))
      .catch(err => {
        console.error('獲取報料寵物失敗:', err.message);
        alert('無法連接到後端服務，請檢查後端是否運行');
      });
  }, []);

  return (
    <Router>
      <div>
        {/* 導航欄 */}
        <nav className="navbar is-fixed-top has-background-light" role="navigation" aria-label="main navigation">
          <div className="navbar-brand">
            <div className="navbar-item">
              <h1 className="title is-4 has-text-pet-purple">同搜毛棄 Pet Search United</h1>
            </div>
          </div>
          <div className="navbar-menu">
            <div className="navbar-start">
              <Link to="/" className="navbar-item has-text-pet-purple">首頁</Link>
              <Link to="/account" className="navbar-item has-text-pet-purple">帳戶</Link>
            </div>
            <div className="navbar-end">
              <div className="navbar-item">
                <span className="has-text-pet-purple">報料者: User Name</span>
                <img
                  src="https://via.placeholder.com/30"
                  alt="User"
                  className="ml-2"
                  style={{ borderRadius: '50%' }}
                />
              </div>
            </div>
          </div>
        </nav>

        {/* 主要內容區域 */}
        <section className="section" style={{ paddingTop: '5rem' }}>
          <div className="container">
            <Routes>
              <Route path="/report-lost" element={<ReportLost />} />
              <Route path="/report-found" element={<ReportFound />} />
              <Route path="/pet/:id" element={<PetDetail />} />
              <Route path="/account" element={<div className="box">帳戶頁面（待開發）</div>} />
              <Route
                path="/"
                element={
                  <div>
                    {/* 四個主要按鈕 */}
                    <div className="buttons is-centered mb-6">
                      <Link to="/" className="button is-primary is-medium">同搜報料</Link>
                      <Link to="/" className="button is-info is-medium">報失列表</Link>
                      <Link to="/report-lost" className="button is-success is-medium">主人報失</Link>
                      <Link to="/report-found" className="button is-warning is-medium">我要報料</Link>
                    </div>

                    {/* 底部地圖 */}
                    <div className="box mt-6">
                      <h2 className="title is-4 has-text-pet-purple mb-4">寵物地圖</h2>
                      <MapContainer
                        center={[22.3193, 114.1694]}
                        zoom={10}
                        style={{ height: '450px', width: '100%', borderRadius: '10px' }}
                      >
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

                    {/* 內容區域 */}
                    <div className="columns">
                      {/* 左側走失寵物列表 */}
                      <div className="column is-two-thirds">
                        <h2 className="title is-4 has-text-pet-purple">走失寵物列表</h2>
                        <div className="columns is-multiline">
                          {lostPets.map(pet => (
                            <div key={pet.lostId} className="column is-half">
                              <div className="card">
                                {pet.photos && (
                                  <div className="card-image">
                                    <figure className="image is-4by3">
                                      <img
                                        src={`http://localhost:3001/${pet.photos.split(',')[0].split('/').pop()}`}
                                        alt={pet.name}
                                      />
                                    </figure>
                                  </div>
                                )}
                                <div className="card-content">
                                  <div className="media">
                                    <div className="media-content">
                                      <p className="title is-5 has-text-pet-purple">{pet.name}</p>
                                    </div>
                                  </div>
                                  <div className="content">
                                    <Link to={`/pet/${pet.lostId}`} className="button is-small is-primary">
                                      個案詳情
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 右側單品位置 */}
                      <div className="column is-one-third">
                        <h2 className="title is-4 has-text-pet-purple">單品位置</h2>
                        <div className="box">
                          <p>（暫時留空，日後添加內容）</p>
                        </div>
                      </div>
                    </div>


                  </div>
                }
              />
            </Routes>
          </div>
        </section>
      </div>
    </Router>
  );
}

export default App;