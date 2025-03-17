import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ReportLost from './ReportLost';
import ReportFound from './ReportFound';
import PetDetail from './PetDetail';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import LostPetList from './LostPetList'; // 新增導入
import FoundPetList from './FoundPetList';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';
import * as reactLeaflet from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  const [lostPets, setLostPets] = useState([]);
  const [foundPets, setFoundPets] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:3001/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => {
          setToken('');
          localStorage.removeItem('token');
        });
    }

    axios.get('http://localhost:3001/api/lost-pets').then(res => setLostPets(res.data)).catch(err => console.error(err));
    axios.get('http://localhost:3001/api/found-pets').then(res => setFoundPets(res.data)).catch(err => console.error(err));
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div>
        <nav className="navbar is-fixed-top has-background-light" role="navigation" aria-label="main navigation">
          <div className="navbar-brand">
            <div className="navbar-item">
              <h1 className="title is-4 has-text-pet-purple">同搜毛棄 Pet Search United</h1>
            </div>
          </div>
          <div className="navbar-menu">
            <div className="navbar-start">
              <Link to="/" className="navbar-item has-text-pet-purple">首頁</Link>
              <Link to="/account" className="navbar-item has-text-pet-purple" onClick={() => !user && setIsLoginOpen(true)}>帳戶</Link>
            </div>
            <div className="navbar-end">
              <div className="navbar-item">
                {user ? (
                  <>
                    <span className="has-text-pet-purple">歡迎, {user.name}</span>
                    <button className="button is-small is-danger ml-2" onClick={handleLogout}>登出</button>
                  </>
                ) : (
                  <>
                    <button className="button is-small is-primary mr-2" onClick={() => setIsLoginOpen(true)}>登入</button>
                    <button className="button is-small is-info" onClick={() => setIsRegisterOpen(true)}>註冊</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <section className="section" style={{ paddingTop: '5rem' }}>
          <div className="container">
            <Routes>
              <Route path="/report-lost" element={<ReportLost />} />
              <Route path="/report-found" element={<ReportFound />} />
              <Route path="/pet/:id" element={<PetDetail />} />
              <Route path="/lost-pet-list" element={<LostPetList />} /> 
              <Route path="/found-pet-list" element={<FoundPetList/> } />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}/>
              <Route path="/account" element={
                user ? (
                  <div className="box">
                    <h2 className="title is-4 has-text-pet-purple">個人資料</h2>
                    <p><strong>姓名:</strong> {user.name}</p>
                    <p><strong>電話:</strong> {user.phoneNumber || '未提供'}</p>
                    <p><strong>電郵:</strong> {user.email || '未提供'}</p>
                  </div>
                ) : (
                  <div className="box">請先登入</div>
                )
              } />
              <Route path="/" element={
                <div>
                  <div className="buttons is-centered mb-6">
                    <Link to="/found-pet-list" className="button is-primary is-medium">同搜報料</Link>
                    <Link to="/lost-pet-list" className="button is-info is-medium">報失列表</Link>
                    <Link to="/report-lost" className="button is-success is-medium" onClick={() => !user && setIsLoginOpen(true)}>主人報失</Link>
                    <Link to="/report-found" className="button is-warning is-medium" onClick={() => !user && setIsLoginOpen(true)}>我要報料</Link>
                  </div>
                  <div className="box mt-6">
                    <h2 className="title is-4 has-text-pet-purple mb-4">寵物地圖</h2>
                    <reactLeaflet.MapContainer center={[22.3193, 114.1694]} zoom={10} style={{ height: '450px', width: '100%', borderRadius: '10px' }}>
                      <reactLeaflet.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                      {lostPets.map(pet => {
                        if (pet.location) {
                          const [lat, lng] = pet.location.split(',').map(coord => parseFloat(coord));
                          if (!isNaN(lat) && !isNaN(lng)) {
                            return (
                              <reactLeaflet.Marker key={pet.lostId} position={[lat, lng]}>
                                <reactLeaflet.Popup>
                                  <b>{pet.name}</b><br />
                                  <a href={`/pet/${pet.lostId}`}>查看詳情</a>
                                </reactLeaflet.Popup>
                              </reactLeaflet.Marker>
                            );
                          }
                        }
                        return null;
                      })}
                    </reactLeaflet.MapContainer>
                  </div>
                  <div className="columns">
                    <div className="column is-two-thirds">
                      <h2 className="title is-4 has-text-pet-purple">走失寵物列表</h2>
                      <div className="columns is-multiline">
                        {lostPets.map(pet => (
                          <div key={pet.lostId} className="column is-half">
                            <div className="card">
                              {pet.frontPhoto && (
                                <div className="card-image">
                                  <figure className="image is-4by3">
                                    <img src={`http://localhost:3001/${pet.frontPhoto.split(',')[0].split('/').pop()}`} alt={pet.name} />
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
                                  <Link to={`/pet/${pet.lostId}`} className="button is-small is-primary">個案詳情</Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="column is-one-third">
                      <h2 className="title is-4 has-text-pet-purple">單品位置</h2>
                      <div className="box">
                        <p>（暫時留空，日後添加內容）</p>
                      </div>
                    </div>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </section>

        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} />
        <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      </div>
    </Router>
  );
}

export default App;