import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ReportLost from './ReportLost';
import ReportFound from './ReportFound';
import PetDetail from './PetDetail';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import LostPetList from './LostPetList';
import FoundPetList from './FoundPetList';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';
import * as reactLeaflet from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { FaPaw, FaSearch, FaUser, FaSignOutAlt, FaFilter, FaPhone, FaHeart, FaShieldAlt, FaLock, FaArrowRight, FaArrowCircleRight  } from 'react-icons/fa';
import { TbArrowWaveRightDown } from "react-icons/tb";

function App() {
  const [lostPets, setLostPets] = useState([]);
  const [foundPets, setFoundPets] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [petTypeFilter, setPetTypeFilter] = useState('');

  useEffect(() => {
    if (token) {
      axios
        .get('http://localhost:3001/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => {
          setToken('');
          localStorage.removeItem('token');
        });
    }

    axios
      .get('http://localhost:3001/api/lost-pets')
      .then(res => setLostPets(res.data))
      .catch(err => console.error(err));
    axios
      .get('http://localhost:3001/api/found-pets')
      .then(res => setFoundPets(res.data))
      .catch(err => console.error(err));
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

  const filteredLostPets = lostPets.filter(pet => {
    const matchesSearch = (
      (pet.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pet.full_address?.toLowerCase() || pet.region?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    const matchesType = petTypeFilter ? pet.petType === petTypeFilter : true;
    return matchesSearch && matchesType;
  });

  return (
    <Router>
      <div>
        {/* Meta 標籤，SEO 優化 */}
        <head>
          <title>同搜毛棄 Pet Search United - 協助您尋回走失寵物</title>
          <meta name="description" content="同搜毛棄 Pet Search United 協助您尋回走失寵物，已幫助超過 1,000 個家庭團聚。立即報失或提供線索，尋回您的寵物！" />
        </head>

        {/* 導航欄 */}
        <nav className="navbar custom-navbar">
          <div className="navbar-brand">
            <Link to="/" className="navbar-item">
              {/* 確保 public/logo.png 存在 */}
              <img src="/logo.png" alt="Pet Search United 標誌" className="navbar-logo" />
              <span className="navbar-title">同搜毛棄 Pet Search United</span>
            </Link>
          </div>
          <div className="navbar-menu">
            <div className="navbar-start">
              <Link to="/" className="navbar-item">首頁</Link>
              <Link to="/lost-pet-list" className="navbar-item">走失寵物列表</Link>
              <Link to="/found-pet-list" className="navbar-item">發現寵物線索</Link>
              <Link to="/account" className="navbar-item" onClick={() => !user && setIsLoginOpen(true)}>
                帳戶
              </Link>
            </div>
            <div className="navbar-end">
              <div className="navbar-item">
                {user ? (
                  <div className="user-profile">
                    {/* 確保 public/user-avatar.png 存在 */}
                    <img src="/user-avatar.png" alt="用戶頭像" className="user-avatar" />
                    <span className="user-name">歡迎，{user.name}</span>
                    <button className="button custom-logout-button" onClick={handleLogout}>
                      <FaSignOutAlt className="mr-2" /> 登出
                    </button>
                  </div>
                ) : (
                  <>
                    <button className="button custom-login-button mr-2" onClick={() => setIsLoginOpen(true)}>
                      登入
                    </button>
                    <button className="button custom-register-button" onClick={() => setIsRegisterOpen(true)}>
                      註冊
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 主內容 */}
        <section className="section custom-section">
          <div className="container">
            <Routes>
              <Route path="/report-lost" element={<ReportLost />} />
              <Route path="/report-found" element={<ReportFound />} />
              <Route path="/pet/:id" element={<PetDetail />} />
              <Route path="/lost-pet-list" element={<LostPetList />} />
              <Route path="/found-pet-list" element={<FoundPetList />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/account" element={
                user ? (
                  <div className="form-card">
                    <h2 className="subtitle is-4 mb-4">
                      <FaUser className="mr-2" /> 個人資料
                    </h2>
                    <p><strong>姓名：</strong> {user.name}</p>
                    <p><strong>電話：</strong> {user.phoneNumber || '未提供'}</p>
                    <p><strong>電郵：</strong> {user.email || '未提供'}</p>
                  </div>
                ) : (
                  <div className="form-card has-text-centered">
                    <p className="is-size-5">請先登入</p>
                    <button className="button custom-login-button mt-3" onClick={() => setIsLoginOpen(true)}>
                      立即登入
                    </button>
                  </div>
                )
              } />
              <Route path="/" element={
                <div>
                  {/* 頭部區域 */}
                  <div className="hero-section has-text-centered mb-6">
                    <div className="paw-animation">
                      <FaPaw className="paw-icon" />
                      <FaPaw className="paw-icon paw-delay-1" />
                      <FaPaw className="paw-icon paw-delay-2" />
                    </div>
                    <h1 className="title is-hero custom-title">
                      尋回您的寵物，從同搜毛棄開始
                    </h1>
                    <p className="subtitle is-4 has-text-white">
                      已協助超過 1,000 個家庭團聚 | 每日更新超過 50 條線索
                    </p>
                    <div className="slogan-container">
                      <p className="slogan-text">
                        每分每秒都是團聚的希望，請立即行動！
                      </p>
                    </div>
                    <div className="certification-badges mt-4">
                      <span className="certification-badge mr-3">
                        <FaPaw className="mr-2" /> 香港寵物協會認證
                      </span>
                      <span className="certification-badge">
                        <FaShieldAlt className="mr-2" /> SSL 安全認證
                      </span>
                    </div>
                    <Link to="/report-lost" className="button custom-button is-large mt-4" onClick={() => !user && setIsLoginOpen(true)}>
                      立即報失
                    </Link>
                  </div>

                  {/* 快速開始引導 */}
                  <div className="quick-start-section form-card mb-6">
                    <h2 className="subtitle is-4 mb-4 has-text-centered">
                      <FaPaw className="mr-2" /> 快速開始：三步尋回您的寵物
                    </h2>
                    <div className="columns is-multiline is-centered">
                      <div className="column is-3 has-text-centered">
                        <div className="quick-step">
                          <FaPaw className="step-icon" />
                          <h3 className="step-title">1. 報失</h3>
                          <p className="step-description">填寫寵物資料，快速提交報失信息</p>
                        </div>
                      </div>
                      <TbArrowWaveRightDown/>
                      <div className="column is-3 has-text-centered">
                        <div className="quick-step">
                          <FaSearch className="step-icon" />
                          <h3 className="step-title">2. 搜尋</h3>
                          <p className="step-description">瀏覽線索，尋找匹配的寵物</p>
                        </div>
                      </div>
                      <TbArrowWaveRightDown/>
                      <div className="column is-3 has-text-centered">
                        <div className="quick-step">
                          <FaHeart className="step-icon" />
                          <h3 className="step-title">3. 團聚</h3>
                          <p className="step-description">聯繫提供線索者，帶寵物回家</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 主要功能按鈕 */}
                  <div className="feature-section mb-6">
                    <h2 className="subtitle is-4 has-text-centered mb-5">
                      <FaPaw className="mr-2" /> 我們的服務
                    </h2>
                    <div className="columns is-multiline is-centered">
                      <div className="column is-3">
                        <Link to="/found-pet-list" className="feature-card">
                          <FaPaw className="feature-icon" />
                          <h3 className="feature-title">同搜線索</h3>
                          <p className="feature-description">查看最新線索，協助寵物尋找主人</p>
                          <FaArrowCircleRight />
                        </Link>
                      </div>
                      <div className="column is-3">
                        <Link to="/lost-pet-list" className="feature-card">
                          <FaSearch className="feature-icon" />
                          <h3 className="feature-title">走失列表</h3>
                          <p className="feature-description">瀏覽走失寵物列表</p>
                          <FaArrowCircleRight />
                        </Link>
                      </div>
                      <div className="column is-3">
                        <Link to="/report-lost" className="feature-card" onClick={() => !user && setIsLoginOpen(true)}>
                          <FaPaw className="feature-icon" />
                          <h3 className="feature-title">主人報失</h3>
                          <p className="feature-description">快速報失您的寵物</p>
                          <FaArrowCircleRight />
                        </Link>
                      </div>
                      <div className="column is-3">
                        <Link to="/report-found" className="feature-card" onClick={() => !user && setIsLoginOpen(true)}>
                          <FaSearch className="feature-icon" />
                          <h3 className="feature-title">提供線索</h3>
                          <p className="feature-description">發現走失寵物？立即提交線索</p>
                          <FaArrowCircleRight />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* 成功案例 */}
                  <div className="success-stories form-card mb-6">
                    <h2 className="subtitle is-4 mb-4 has-text-centered">
                      <FaHeart className="mr-2" /> 成功案例
                    </h2>
                    <div className="columns is-multiline is-centered">
                      <div className="column is-4">
                        <div className="story-card">
                          {/* 確保 public/success-story-1.jpg 存在 */}
                          <img src="/success-story-1.jpg" alt="成功案例 1" className="story-image" />
                          <p className="story-quote">
                            "感謝同搜毛棄，我終於尋回我的小花！"
                          </p>
                          <p className="story-author">— 陳小姐，2025年3月</p>
                        </div>
                      </div>
                      <div className="column is-4">
                        <div className="story-card">
                          {/* 確保 public/success-story-2.jpg 存在 */}
                          <img src="/success-story-2.jpg" alt="成功案例 2" className="story-image" />
                          <p className="story-quote">
                            "很快便找到我的阿寶，十分感激！"
                          </p>
                          <p className="story-author">— 李先生，2025年2月</p>
                        </div>
                      </div>
                      <div className="column is-4">
                        <div className="story-card">
                          {/* 確保 public/success-story-3.jpg 存在 */}
                          <img src="/success-story-3.jpg" alt="成功案例 3" className="story-image" />
                          <p className="story-quote">
                            "專業的平台，助我與毛毛團聚！"
                          </p>
                          <p className="story-author">— 張太太，2025年1月</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 寵物地圖 */}
                  <div className="form-card mb-6">
                    <h2 className="subtitle is-4 mb-4 has-text-centered">
                      <FaPaw className="mr-2" /> 寵物走失地圖
                    </h2>
                    <p className="help is-info mb-4 has-text-centered">
                      點擊地圖上的標記，查看走失寵物的詳情。
                    </p>
                    <div className="map-container">
                      <reactLeaflet.MapContainer center={[22.3193, 114.1694]} zoom={12} style={{ height: '450px', width: '100%' }}>
                        <reactLeaflet.TileLayer
                          url="https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png"
                          attribution='<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">© 地圖資料由地政總署提供</a><div style="width:28px;height:28px;display:inline-flex;background:url(https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg);background-size:28px;"></div>'
                        />
                        <reactLeaflet.TileLayer
                          url="https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/tc/wgs84/{z}/{x}/{y}.png"
                        />
                        {lostPets.map(pet => {
                          if (pet.location) {
                            const [lat, lng] = pet.location.split(',').map(coord => parseFloat(coord));
                            if (!isNaN(lat) && !isNaN(lng)) {
                              return (
                                <reactLeaflet.Marker key={pet.lostId} position={[lat, lng]}>
                                  <reactLeaflet.Popup>
                                    <b>{pet.name}</b><br />
                                    <Link to={`/pet/${pet.lostId}`}>查看詳情</Link>
                                  </reactLeaflet.Popup>
                                </reactLeaflet.Marker>
                              );
                            }
                          }
                          return null;
                        })}
                      </reactLeaflet.MapContainer>
                    </div>
                  </div>

                  {/* 走失寵物列表同最新報料動態 */}
                  <div className="columns is-narrow-gap">
                    <div className="column is-two-thirds">
                      <div className="form-card">
                        <h2 className="subtitle is-4 mb-4 has-text-centered">
                          <FaPaw className="mr-2" /> 走失寵物列表
                        </h2>
                        <div className="search-filter mb-4">
                          <div className="field has-addons is-justify-content-center">
                            <div className="control is-expanded">
                              <input
                                className="input custom-input"
                                type="text"
                                placeholder="搜尋寵物名稱或走失地點..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="搜尋寵物名稱或走失地點"
                              />
                            </div>
                            <div className="control">
                              <div className="select custom-select">
                                <select
                                  value={petTypeFilter}
                                  onChange={(e) => setPetTypeFilter(e.target.value)}
                                  aria-label="過濾寵物種類"
                                >
                                  <option value="">所有種類</option>
                                  <option value="cat">貓</option>
                                  <option value="dog">狗</option>
                                </select>
                              </div>
                            </div>
                            <div className="control">
                              <button className="button custom-button" aria-label="過濾寵物">
                                <FaFilter className="mr-2" /> 過濾
                              </button>
                            </div>
                          </div>
                          <p className="help is-info mt-2 has-text-centered">
                            找到 {filteredLostPets.length} 個結果
                          </p>
                        </div>
                        <div className="columns is-multiline is-centered">
                          {filteredLostPets.length > 0 ? (
                            filteredLostPets.map(pet => (
                              <div key={pet.lostId} className="column is-4">
                                <div className="pet-card">
                                  {pet.frontPhoto ? (
                                    <figure className="image is-4by3">
                                      <img
                                        src={`http://localhost:3001/${pet.frontPhoto.split(',')[0].split('/').pop()}`}
                                        alt={`${pet.name} 的照片`}
                                        className="pet-image"
                                      />
                                    </figure>
                                  ) : (
                                    <figure className="image is-4by3">
                                      {/* 確保 public/placeholder-pet.jpg 存在 */}
                                      <img
                                        src="/placeholder-pet.jpg"
                                        alt="寵物占位圖"
                                        className="pet-image"
                                      />
                                    </figure>
                                  )}
                                  <div className="pet-info">
                                    <p className="pet-name">{pet.name}</p>
                                    <p className="pet-detail">種類：{pet.petType === 'cat' ? '貓' : '狗'}</p>
                                    <p className="pet-detail">走失日期：{pet.lost_date?.split(' ')[0]}</p>
                                    <p className="pet-detail">地區：{pet.region || '未知'}</p>
                                    <div className="buttons is-centered mt-2">
                                      <Link to={`/pet/${pet.lostId}`} className="button custom-button is-small">
                                        查看詳情
                                      </Link>
                                      {pet.isPublic && pet.phoneNumber && (
                                        <a href={`tel:${pet.phoneNumber}`} className="button custom-contact-button is-small">
                                          <FaPhone className="mr-2" /> 聯繫主人
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="column is-12 has-text-centered">
                              <p className="is-size-5 has-text-grey">暫無符合條件的寵物記錄</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="column is-one-third">
                      <div className="form-card">
                        <h2 className="subtitle is-4 mb-4 has-text-centered">
                          <FaPaw className="mr-2" /> 最新報料動態
                        </h2>
                        {foundPets.slice(0, 3).map(pet => (
                          <div key={pet.foundId} className="notification is-light mb-3">
                            <div className="media">
                              <div className="media-left">
                                {pet.frontPhoto ? (
                                  <figure className="image is-48x48">
                                    <img
                                      src={`http://localhost:3001/${pet.photos.split(',')[0].split('/').pop()}`}
                                      alt={`${pet.petType} 的照片`}
                                      className="is-rounded"
                                    />
                                  </figure>
                                ) : (
                                  <figure className="image is-48x48">
                                    <img
                                      src="/placeholder-pet.jpg"
                                      alt="寵物占位圖"
                                      className="is-rounded"
                                    />
                                  </figure>
                                )}
                              </div>
                              <div className="media-content">
                                <p className="is-size-6">
                                  <strong>{pet.petType === 'cat' ? '貓' : '狗'}</strong> 在 {pet.displayLocation || '未知地點'} 被發現
                                </p>
                                <p className="is-size-7 has-text-grey">
                                  發現時間：{pet.found_date?.split(' ')[0]}
                                </p>
                                {pet.isPublic && pet.reportername && pet.phoneNumber && (
                                  <p className="is-size-7 has-text-grey">
                                    報料人：{pet.reportername} | 電話：{pet.phoneNumber}
                                  </p>
                                )}
                                <Link to={`/pet/${pet.foundId}`} className="button custom-button is-small mt-2">
                                  查看詳情
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                        {foundPets.length === 0 ? (
                          <p className="has-text-grey has-text-centered">暫無報料記錄</p>
                        ) : (
                          <Link to="/found-pet-list" className="button custom-button is-small mt-3">
                            查看更多 <FaArrowRight className="ml-2" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 報失指南 */}
                  <div className="form-card mb-6">
                    <h2 className="subtitle is-4 mb-4 has-text-centered">
                      <FaPaw className="mr-2" /> 報失指南
                    </h2>
                    <p className="help is-info mb-4 has-text-centered">
                      以下是一些報失建議，助您更快尋回您的寵物：
                    </p>
                    <ul className="guide-list">
                      <li>準備清晰的寵物照片（正面和側面）。</li>
                      <li>提供詳細特徵，例如毛色、體型、項圈等。</li>
                      <li>填寫走失地點和時間，方便報料人匹配。</li>
                      <li>定期檢查報料列表，留意最新動態。</li>
                    </ul>
                  </div>

                  {/* 常見問題 */}
                  <div className="form-card mb-6">
                    <h2 className="subtitle is-4 mb-4 has-text-centered">
                      <FaPaw className="mr-2" /> 常見問題
                    </h2>
                    <div className="faq-item mb-4">
                      <p className="faq-question">如何報失我的寵物？</p>
                      <p className="faq-answer">
                        點擊「主人報失」，填寫寵物資料及走失詳情即可。我們會將您的報失信息發佈至平台，方便報料人聯繫您。
                      </p>
                    </div>
                    <div className="faq-item mb-4">
                      <p className="faq-question">提供線索需要費用嗎？</p>
                      <p className="faq-answer">
                        不需要！同搜毛棄是一個免費平台，我們致力於協助更多家庭與寵物團聚。
                      </p>
                    </div>
                    <div className="faq-item">
                      <p className="faq-question">我的個人資料安全嗎？</p>
                      <p className="faq-answer">
                        當然！我們使用 SSL 加密技術保護您的資料，您可選擇是否公開聯繫方式。
                      </p>
                    </div>
                  </div>

                  {/* 合作夥伴 */}
                  <div className="partners-section form-card mb-6">
                    <h2 className="subtitle is-4 mb-4 has-text-centered">
                      <FaPaw className="mr-2" /> 合作夥伴
                    </h2>
                    <div className="columns is-multiline is-centered">
                      <div className="column is-3 has-text-centered">
                        {/* 確保 public/partner-1.png 存在 */}
                        <img src="/partner-1.png" alt="香港寵物協會" className="partner-logo" />
                        <p className="partner-name">香港寵物協會</p>
                      </div>
                      <div className="column is-3 has-text-centered">
                        {/* 確保 public/partner-2.png 存在 */}
                        <img src="/partner-2.png" alt="動物保護組織" className="partner-logo" />
                        <p className="partner-name">動物保護組織</p>
                      </div>
                      <div className="column is-3 has-text-centered">
                        {/* 確保 public/partner-3.png 存在 */}
                        <img src="/partner-3.png" alt="香港獸醫協會" className="partner-logo" />
                        <p className="partner-name">香港獸醫協會</p>
                      </div>
                      <div className="column is-3 has-text-centered">
                        {/* 確保 public/partner-4.png 存在 */}
                        <img src="/partner-4.png" alt="寵物救援隊" className="partner-logo" />
                        <p className="partner-name">寵物救援隊</p>
                      </div>
                    </div>
                  </div>

                  {/* 關於我們 */}
                  <div className="about-section form-card mb-6">
                    <h2 className="subtitle is-4 mb-4 has-text-centered">
                      <FaPaw className="mr-2" /> 關於我們
                    </h2>
                    <p className="about-text">
                      我們是一支熱愛動物的團隊，創立同搜毛棄的初衷是希望協助更多家庭與他們的寵物團聚。我們提供免費的報失與報料平台，並與多個動物保護組織合作，確保每隻走失寵物都有機會回家。
                    </p>
                  </div>

                  {/* 頁腳 */}
                  <footer className="custom-footer has-text-centered">
                    <p className="is-size-6">
                      © 2025 同搜毛棄 Pet Search United. 版權所有。
                    </p>
                    <p className="is-size-7">
                      聯繫我們：<a href="mailto:support@petsearchunited.com">support@petsearchunited.com</a> | 電話：+852 1234 5678
                    </p>
                    <p className="is-size-7 mt-2">
                      <FaLock className="mr-2" /> 我們重視您的隱私，所有信息將受到嚴格保護。
                    </p>
                  </footer>
                </div>
              } />
            </Routes>
          </div>
        </section>

        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} />
        <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(true)} />
      </div>
    </Router>
  );
}

export default App;