import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import ReportLost from './ReportLost';
import ReportFound from './ReportFound';
import PetDetail from './PetDetail';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import LostPetList from './LostPetList';
import FoundPetList from './FoundPetList';
import AdminDashboard from './admin/AdminDashboard';
import AdminPendingGroups from './admin/AdminPendingGroups';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import UserLostReports from './user/UserLostReports';
import UserFoundReports from './user/UserFoundReports';
import { catBreeds, dogBreeds } from './constants/PetConstants';
import axios from 'axios';
import * as reactLeaflet from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { FaPaw, FaSearch, FaUser, FaSignOutAlt, FaFilter, FaPhone, FaHeart, FaShieldAlt, FaLock, FaArrowRight, FaArrowCircleRight, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { TbArrowWaveRightDown } from "react-icons/tb";
import { RiChatUploadFill, RiChatSearchFill } from "react-icons/ri";
import { Helmet } from 'react-helmet';

function AppContent() {
  const [lostPets, setLostPets] = useState([]);
  const [foundPets, setFoundPets] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [petTypeFilter, setPetTypeFilter] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phoneNumber: '', email: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      axios
        .get('http://localhost:3001/api/check-is-user', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setUser(res.data);
          setEditForm({ name: res.data.name, phoneNumber: res.data.phoneNumber || '', email: res.data.email || '' });
        })
        .catch(err => {
          console.error('檢查用戶身份失敗:', err);
          setToken('');
          setUser(null);
          localStorage.removeItem('token');
          if (location.pathname.startsWith('/account') || location.pathname === '/report-lost') {
            setIsLoginOpen(true);
          }
        });
    }

    axios
      .get('http://localhost:3001/api/lost-pets')
      .then(res => setLostPets(res.data))
      .catch(err => console.error('獲取走失寵物失敗:', err));

    axios
      .get('http://localhost:3001/api/found-pets')
      .then(res => setFoundPets(res.data))
      .catch(err => console.error('獲取報料記錄失敗:', err));
  }, [token, location.pathname]);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setEditForm({ name: newUser.name, phoneNumber: newUser.phoneNumber || '', email: newUser.email || '' });
    localStorage.setItem('token', newToken);
  
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } else {
      navigate('/');
    }
  };

  const handleLoginModalClose = () => {
    setIsLoginOpen(false);
  };

  const handleProtectedLinkClick = (e, path) => {
    e.preventDefault();
    if (!user || !token) {
      setIsLoginOpen(true);
      localStorage.setItem('redirectAfterLogin', path);
    } else {
      navigate(path);
    }
  };
  
  const handleLogout = () => {
    setToken('');
    setUser(null);
    setLostPets([]);
    setFoundPets([]);
    localStorage.removeItem('token');
    setEditMode(false);
    navigate('/');
  };

  const getBreedLabel = (petType, breed) => {
    const breedList = petType === 'cat' ? catBreeds : dogBreeds;
    const foundBreed = breedList.find(item => item.value === breed);
    return foundBreed ? foundBreed.label : '未知品種';
  };

  const filteredLostPets = lostPets.filter(pet => {
    const matchesSearch = (
      (pet.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pet.fullAddress?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    const matchesType = petTypeFilter ? pet.petType === petTypeFilter : true;
    return matchesSearch && matchesType;
  });

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === 'name' && !value) {
      newErrors.name = '請填寫姓名';
    } else if (name === 'phoneNumber' && value && !/^\d{8}$/.test(value)) {
      newErrors.phoneNumber = '請輸入有效的8位電話號碼';
    } else if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      newErrors.email = '請輸入有效的電郵地址';
    } else {
      delete newErrors[name];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateField('name', editForm.name)) return;
    if (editForm.phoneNumber && !validateField('phoneNumber', editForm.phoneNumber)) return;
    if (editForm.email && !validateField('email', editForm.email)) return;

    try {
      const response = await axios.put(
        'http://localhost:3001/api/update-user-info',
        { name: editForm.name, phoneNumber: editForm.phoneNumber, email: editForm.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data);
      setEditMode(false);
      alert('資料更新成功！');
    } catch (err) {
      console.error('更新失敗:', err);
      alert('更新失敗，請稍後再試！');
    }
  };

  return (
    <div>
      <Helmet>
        <title>同搜毛棄 Pet Search United - 協助您尋回走失寵物</title>
        <meta name="description" content="同搜毛棄 Pet Search United 協助您尋回走失寵物，已幫助超過 1,000 個家庭團聚。立即報失或提供線索，尋回您的寵物！" />
      </Helmet>

      <nav className="navbar custom-navbar">
        <div className="navbar-brand">
          <Link to="/" className="navbar-item">
            <img src="/logo.png" alt="Pet Search United 標誌" className="navbar-logo" />
            <span className="">同搜毛棄 Pet Search United</span>
          </Link>
        </div>
        <div className="navbar-menu">
          <div className="navbar-start">
            <Link to="/" className="navbar-item">首頁</Link>
            <Link to="/lost-pet-list" className="navbar-item">走失寵物列表</Link>
            <Link to="/found-pet-list" className="navbar-item">發現寵物線索</Link>
          </div>
          {user ? (
            <div className="user-profile">
              <img src="/user-avatar.png" alt="用戶頭像" className="user-avatar" />
              <span className="user-name">歡迎，{user.name}</span>
              <Link to="/account" className="navbar-item">
                帳戶
              </Link>
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
      </nav>

      <section className="section custom-section">
        <div className="container">
          <Routes>
            <Route
              path="/report-lost"
              element={
                <ProtectedRoute requireLogin={true} setIsLoginOpen={setIsLoginOpen}>
                  <ReportLost user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route path="/report-found" element={<ReportFound user={user} token={token} />} />
            <Route path="/pet/:id" element={<PetDetail />} />
            <Route path="/lost-pet-list" element={<LostPetList />} />
            <Route path="/found-pet-list" element={<FoundPetList />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true} setIsLoginOpen={setIsLoginOpen}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/pending-groups" element={<AdminPendingGroups />} />
            <Route
              path="/account"
              element={
                user ? (
                  <>
                    <div className="form-card">
                      <h2 className="subtitle is-4 mb-4">
                        <FaUser className="mr-2" /> 個人資料
                      </h2>
                      {editMode ? (
                        <form onSubmit={handleUpdateProfile}>
                          <div className="field">
                            <label className="label">
                              姓名 <span className="has-text-danger">*</span>
                            </label>
                            <div className="control">
                              <input
                                className={`input ${errors.name ? 'is-danger' : ''}`}
                                type="text"
                                name="name"
                                value={editForm.name}
                                onChange={handleEditChange}
                                required
                              />
                            </div>
                            {errors.name && <p className="help is-danger">{errors.name}</p>}
                          </div>
                          <div className="field">
                            <label className="label">電話</label>
                            <div className="control">
                              <input
                                className={`input ${errors.phoneNumber ? 'is-danger' : ''}`}
                                type="tel"
                                name="phoneNumber"
                                value={editForm.phoneNumber}
                                onChange={handleEditChange}
                                placeholder="8位電話號碼"
                              />
                            </div>
                            {errors.phoneNumber && (
                              <p className="help is-danger">{errors.phoneNumber}</p>
                            )}
                          </div>
                          <div className="field">
                            <label className="label">電郵</label>
                            <div className="control">
                              <input
                                className={`input ${errors.email ? 'is-danger' : ''}`}
                                type="email"
                                name="email"
                                value={editForm.email}
                                onChange={handleEditChange}
                                placeholder="電郵地址"
                              />
                            </div>
                            {errors.email && <p className="help is-danger">{errors.email}</p>}
                          </div>
                          <div className="buttons is-right mt-4">
                            <button
                              type="button"
                              className="button is-light"
                              onClick={() => setEditMode(false)}
                            >
                              <FaTimes className="mr-2" /> 取消
                            </button>
                            <button type="submit" className="button custom-button">
                              <FaSave className="mr-2" /> 保存
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p>
                            <strong>姓名：</strong> {user.name}
                          </p>
                          <p>
                            <strong>電話：</strong> {user.phoneNumber || '未提供'}
                          </p>
                          <p>
                            <strong>電郵：</strong> {user.email || '未提供'}
                          </p>
                          <div className="buttons mt-4">
                            {user.role === 'admin' && (
                              <Link to="/admin" className="button is-info mr-4">
                                管理員面板
                              </Link>
                            )}
                            <button
                              className="button custom-button"
                              onClick={() => setEditMode(true)}
                            >
                              <FaEdit className="mr-2" /> 編輯資料
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {!editMode && (
                      <div className="mt-6">
                        <div className="buttons">
                          <Link
                            to="/account/lost-reports"
                            className="button is-primary mr-4"
                            style={{
                              width: '140px',
                              height: '140px',
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              gap: '8px',
                            }}
                          >
                            <FaPaw size={50} />
                            <span style={{ fontSize: '14px', lineHeight: '1.2' }}>
                              報失記錄
                            </span>
                          </Link>
                          <Link
                            to="/account/found-reports"
                            className="button is-primary mr-4"
                            style={{
                              width: '140px',
                              height: '140px',
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              gap: '8px',
                            }}
                          >
                            <FaSearch size={50} />
                            <span style={{ fontSize: '14px', lineHeight: '1.2' }}>
                              報料記錄
                            </span>
                          </Link>
                          <Link
                            to="/report-lost"
                            className="button is-primary mr-4"
                            style={{
                              width: '140px',
                              height: '140px',
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              gap: '8px',
                            }}
                            onClick={(e) => handleProtectedLinkClick(e, '/report-lost')}
                          >
                            <FaPaw size={50} />
                            <span style={{ fontSize: '14px', lineHeight: '1.2' }}>
                              報失寵物
                            </span>
                          </Link>
                          <Link
                            to="/report-found"
                            className="button is-primary"
                            style={{
                              width: '140px',
                              height: '140px',
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              gap: '8px',
                            }}
                            onClick={(e) => handleProtectedLinkClick(e, '/report-found')}
                          >
                            <FaSearch size={50} />
                            <span style={{ fontSize: '14px', lineHeight: '1.2' }}>
                              提供線索
                            </span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="form-card has-text-centered">
                    <p className="is-size-5">請先登入</p>
                    <button
                      className="button custom-login-button mt-3"
                      onClick={() => setIsLoginOpen(true)}
                    >
                      立即登入
                    </button>
                  </div>
                )
              }
            />
            <Route
              path="/account/lost-reports"
              element={
                <ProtectedRoute requireLogin={true} setIsLoginOpen={setIsLoginOpen}>
                  <UserLostReports user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/found-reports"
              element={
                <ProtectedRoute requireLogin={true} setIsLoginOpen={setIsLoginOpen}>
                  <UserFoundReports user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={
              <div>
                <div className="hero-section has-text-centered mb-6">
                  <h1 className="title is-hero custom-title">
                    尋回您的寵物，從同搜毛棄開始
                  </h1>
                  <p className="is-size-4 has-text-centered">
                    已協助超過 1,000 個家庭團聚 | 每日更新超過 50 條線索
                  </p>
                  <div className="slogan-container">
                    <p className="slogan-text has-text-black">
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
                </div>
                <div className="feature-section mb-6">
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
                      <Link to="/report-lost" className="feature-card">
                        <FaPaw className="feature-icon" />
                        <h3 className="feature-title">主人報失</h3>
                        <p className="feature-description">快速報失您的寵物</p>
                        <FaArrowCircleRight />
                      </Link>
                    </div>
                    <div className="column is-3">
                      <Link to="/report-found" className="feature-card">
                        <FaSearch className="feature-icon" />
                        <h3 className="feature-title">提供線索</h3>
                        <p className="feature-description">發現走失寵物？立即提交線索</p>
                        <FaArrowCircleRight />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="form-card mb-6">
                  <h2 className="subtitle is-4 mb-4 has-text-centered">
                    <FaPaw className="mr-2" /> 寵物走失地圖
                  </h2>
                  <p className="help is-info mb-4 has-text-centered">
                    點擊地圖上的標記，查看走失寵物的詳情。
                  </p>
                  <div className="map-container">
                    <reactLeaflet.MapContainer center={[22.3193, 114.1694]} zoom={12} style={{ height: '500px', width: '100%' }}>
                      <reactLeaflet.TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {lostPets.map(pet => {
                        if (pet.location && typeof pet.location === 'string') {
                          const [lat, lng] = pet.location.split(',').map(coord => parseFloat(coord.trim()));
                          if (!isNaN(lat) && !isNaN(lng)) {
                            return (
                              <reactLeaflet.Marker key={pet.lostId} position={[lat, lng]}>
                                <reactLeaflet.Popup>
                                  {pet.frontPhoto ? (
                                    <img
                                      src={`http://localhost:3001/${pet.frontPhoto.split(',')[0].split('/').pop()}`}
                                      alt={`走失寵物 ${pet.name} 的照片`}
                                      className="pet-image"
                                      onError={(e) => (e.target.src = '/icon/cat.png')}
                                    />
                                  ) : (
                                    <img src="/icon/cat.png" alt="寵物占位圖" className="pet-image" />
                                  )}
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
                            <button
                              className="button custom-button"
                              aria-label="過濾寵物"
                            >
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
                                      alt={`走失寵物 ${pet.name} 的照片`}
                                      className="pet-image"
                                      onError={(e) => (e.target.src = '/icon/cat.png')}
                                    />
                                  </figure>
                                ) : (
                                  <figure className="image is-4by3">
                                    <img
                                      src="/icon/cat.png"
                                      alt="寵物占位圖"
                                      className="pet-image"
                                    />
                                  </figure>
                                )}
                                <div className="pet-info">
                                  <p className="pet-name">{pet.name}</p>
                                  <p className="pet-detail">種類：{pet.petType === 'cat' ? '貓' : '狗'}</p>
                                  <p className="pet-detail">走失日期：{pet.lost_date?.split(' ')[0]}</p>
                                  <p className="pet-detail">走失地點：{pet.displayLocation || '未知'}</p>
                                  <div className="buttons is-centered mt-2">
                                    <Link to={`/pet/${pet.lostId}`} className="button custom-button is-small">
                                      查看詳情
                                    </Link>
                                    {pet.isPublic == 1 && pet.phoneNumber && (
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
                      {foundPets.length > 0 ? (
                        foundPets.slice(0, 3).map(pet => (
                          <div key={pet.foundId} className="notification is-light mb-3">
                            <div className="media">
                              <div className="media-left">
                                {pet.photos && pet.photos.split(',')[0] ? (
                                  <figure className="image is-48x48">
                                    <img
                                      src={`http://localhost:3001/${pet.photos.split(',')[0].split('/').pop()}`}
                                      alt={`發現的${pet.petType === 'cat' ? '貓' : '狗'}照片`}
                                      className="is-rounded"
                                      onError={(e) => (e.target.src = '/icon/cat.png')}
                                    />
                                  </figure>
                                ) : (
                                  <figure className="image is-48x48">
                                    <img
                                      src="/icon/cat.png"
                                      alt="寵物占位圖"
                                      className="is-rounded"
                                    />
                                  </figure>
                                )}
                              </div>
                              <div className="media-content">
                                <p className="is-size-6">
                                  發現 <strong>{pet.petType === 'cat' ? '貓' : '狗'} - {getBreedLabel(pet.petType, pet.breed)}</strong> 在 {pet.displayLocation || '未知地點'}
                                </p>
                                <p className="is-size-7 has-text-grey">
                                  發現時間：{pet.found_date?.split(' ')[0]}
                                </p>
                                {pet.isPublic == 1 && pet.reportername && pet.phoneNumber && (
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
                        ))
                      ) : (
                        <p className="has-text-grey has-text-centered">暫無報料記錄</p>
                      )}
                      {foundPets.length > 3 && (
                        <div className="has-text-centered">
                          <Link to="/found-pet-list" className="button custom-button is-small mt-3">
                            查看更多 <FaArrowRight className="ml-2" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                <div className="success-stories form-card mb-6">
                  <h2 className="subtitle is-4 mb-4 has-text-centered">
                    <FaHeart className="mr-2" /> 成功案例
                  </h2>
                  <div className="columns is-multiline is-centered">
                    <div className="column is-4">
                      <div className="story-card">
                        <img src="/success-story-1.jpg" alt="成功案例 1" className="story-image" />
                        <p className="story-quote">
                          "感謝同搜毛棄，我終於尋回我的小花！"
                        </p>
                        <p className="story-author">— 陳小姐，2025年3月</p>
                      </div>
                    </div>
                    <div className="column is-4">
                      <div className="story-card">
                        <img src="/success-story-2.jpg" alt="成功案例 2" className="story-image" />
                        <p className="story-quote">
                          "很快便找到我的阿寶，十分感激！"
                        </p>
                        <p className="story-author">— 李先生，2025年2月</p>
                      </div>
                    </div>
                    <div className="column is-4">
                      <div className="story-card">
                        <img src="/success-story-3.jpg" alt="成功案例 3" className="story-image" />
                        <p className="story-quote">
                          "專業的平台，助我與毛毛團聚！"
                        </p>
                        <p className="story-author">— 張太太，2025年1月</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="partners-section form-card mb-6">
                  <h2 className="subtitle is-4 mb-4 has-text-centered">
                    <FaPaw className="mr-2" /> 合作夥伴
                  </h2>
                  <div className="columns is-multiline is-centered">
                    <div className="column is-3 has-text-centered">
                      <img src="/partner-1.png" alt="香港寵物協會標誌" className="partner-logo" />
                      <p className="partner-name">香港寵物協會</p>
                    </div>
                    <div className="column is-3 has-text-centered">
                      <img src="/partner-2.png" alt="動物保護組織標誌" className="partner-logo" />
                      <p className="partner-name">動物保護組織</p>
                    </div>
                    <div className="column is-3 has-text-centered">
                      <img src="/partner-3.png" alt="香港獸醫協會標誌" className="partner-logo" />
                      <p className="partner-name">香港獸醫協會</p>
                    </div>
                    <div className="column is-3 has-text-centered">
                      <img src="/partner-4.png" alt="寵物救援隊標誌" className="partner-logo" />
                      <p className="partner-name">寵物救援隊</p>
                    </div>
                  </div>
                </div>
                <div className="about-section form-card mb-6">
                  <h2 className="subtitle is-4 mb-4 has-text-centered">
                    <FaPaw className="mr-2" /> 關於我們
                  </h2>
                  <p className="about-text">
                    我們是一支熱愛動物的團隊，創立同搜毛棄的初衷是希望協助更多家庭與他們的寵物團聚。我們提供免費的報失與報料平台，並與多個動物保護組織合作，確保每隻走失寵物都有機會回家。
                  </p>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </section>

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
      <LoginModal isOpen={isLoginOpen} onClose={handleLoginModalClose} onLogin={handleLogin} />
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;