import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './PetDetail.css';

function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [relatedFoundPets, setRelatedFoundPets] = useState([]); // 同一群組嘅報料
  const [matches, setMatches] = useState([]); // 報失同報料嘅匹配
  const [user, setUser] = useState(null);
  const [linkFoundId, setLinkFoundId] = useState(''); // 用於現有「連結其他報料」
  const [requestLinkFoundId, setRequestLinkFoundId] = useState(''); // 用於新「要求連結」
  const [showRequestLinkForm, setShowRequestLinkForm] = useState(false); // 控制輸入框顯示
  const [updateForm, setUpdateForm] = useState({ found_date: '', found_location: '', found_details: '', holding_location: '', status: '' });
  const [pin, setPin] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token:', token); // Debug: 檢查 token
    if (token) {
      axios.get('http://localhost:3001/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setUser(res.data);
          console.log('User:', res.data); // Debug: 檢查 user
        })
        .catch(err => {
          console.error('Get user failed:', err);
          localStorage.removeItem('token');
        });
    }

    const fetchPet = async () => {
      try {
        let petData;
        try {
          petData = await axios.get(`http://localhost:3001/api/lost-pets/${id}`);
        } catch {
          petData = await axios.get(`http://localhost:3001/api/found-pets/${id}`);
        }
        setPet(petData.data);
        console.log('Pet data:', petData.data); // Debug: 檢查 pet 數據
        parseCoordinates(petData.data);

        if (petData.data.foundId && petData.data.groupId) {
          const related = await axios.get(`http://localhost:3001/api/found-pets?groupId=${petData.data.groupId}`);
          setRelatedFoundPets(related.data.filter(p => p.foundId !== id));
        }
      } catch (err) {
        console.error('Fetch pet failed:', err);
        setPet(null);
      }
    };
    fetchPet();
  }, [id]);

  const parseCoordinates = (petData) => {
    const location = petData.location || petData.found_location;
    if (location) {
      const [lat, lng] = location.split(',').map((coord) => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setCoordinates([lat, lng]);
      } else {
        console.error('無效的坐標格式:', location);
      }
    } else {
      console.warn('寵物數據中無位置信息:', petData);
    }
  };

  const allPositions = [];
  if (coordinates) {
    allPositions.push(coordinates); // 添加當前寵物的坐標
  }

  if (relatedFoundPets.length > 0) {
    const relatedPositions = relatedFoundPets
      .map((p) => (p.found_location || '').split(',').map((coord) => parseFloat(coord.trim())))
      .filter((pos) => pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1]));
    allPositions.push(...relatedPositions);
  }
  
  const handleLinkFoundPets = async () => {
    if (!linkFoundId) return alert('請輸入要連結的 foundId');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:3001/api/create-found-group', { foundId1: pet.foundId, foundId2: linkFoundId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      setLinkFoundId('');
    } catch (err) {
      alert(err.response?.data?.error || '創建連結失敗');
    }
  };

  const handleRequestLink = async () => {
    if (!requestLinkFoundId) return alert('請輸入要要求連結的 foundId');
    const token = localStorage.getItem('token');
    if (!token) return alert('請先登入');
    try {
      const res = await axios.post('http://localhost:3001/api/create-found-group', { foundId1: pet.foundId, foundId2: requestLinkFoundId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      setRequestLinkFoundId('');
      setShowRequestLinkForm(false);
    } catch (err) {
      alert(err.response?.data?.error || '要求連結失敗');
    }
  };

  const handleUpdateFoundPet = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:3001/api/update-found/${pet.foundId}`, { ...updateForm, pin }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('報料已更新');
      setShowUpdateForm(false);
      setPin('');
      const updatedPet = await axios.get(`http://localhost:3001/api/found-pets/${pet.foundId}`);
      setPet(updatedPet.data);
    } catch (err) {
      alert(err.response?.data?.error || '更新失敗');
    }
  };

  const handleCreateMatch = async () => {
    const token = localStorage.getItem('token');
    if (!linkFoundId) return alert('請輸入要匹配的 ID');
    try {
      const data = pet.lostId ? { lostId: pet.lostId, foundId: linkFoundId } : { lostId: linkFoundId, foundId: pet.foundId };
      const res = await axios.post('http://localhost:3001/api/create-pet-match', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      setMatches([...matches, { matchId: res.data.matchId, lostId: data.lostId, foundId: data.foundId, status: 'pending' }]);
      setLinkFoundId('');
    } catch (err) {
      alert(err.response?.data?.error || '創建匹配失敗');
    }
  };

  const handleConfirmMatch = async (matchId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:3001/api/confirm-pet-match', { matchId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      setMatches(matches.map(m => m.matchId === matchId ? { ...m, status: 'confirmed' } : m));
      setPet({ ...pet, isFound: true });
    } catch (err) {
      alert(err.response?.data?.error || '確認失敗');
    }
  };

  if (!pet) return <div className="loading">加載中...</div>;

  const images = [];
  if (pet.frontPhoto) images.push({ original: `http://localhost:3001/${pet.frontPhoto.trim()}`, thumbnail: `http://localhost:3001/${pet.frontPhoto.trim()}`, description: '正面相' });
  if (pet.sidePhoto) images.push({ original: `http://localhost:3001/${pet.sidePhoto.trim()}`, thumbnail: `http://localhost:3001/${pet.sidePhoto.trim()}`, description: '側面相' });
  if (pet.otherPhotos) {
    const otherPhotosArray = pet.otherPhotos.split(',').map(photo => ({
      original: `http://localhost:3001/${photo.trim()}`,
      thumbnail: `http://localhost:3001/${photo.trim()}`,
      description: '其他相片',
    }));
    images.push(...otherPhotosArray);
  }
  if (pet.photos) {
    const photosArray = pet.photos.split(',').map(photo => ({
      original: `http://localhost:3001/${photo.trim()}`,
      thumbnail: `http://localhost:3001/${photo.trim()}`,
      description: '報料相片',
    }));
    images.push(...photosArray);
  }

  const isLostPet = !!pet.lostId;

  const allFoundPets = pet.foundId ? [pet, ...relatedFoundPets] : [];
  const positions = allFoundPets
    .map(p => (p.found_location || '').split(',').map(coord => parseFloat(coord.trim())))
    .filter(pos => pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1]));

  return (
    <section className="pet-detail-section">
      <div className="container">
        <h1 className="title">{pet.name} 詳細信息</h1>
        <div className="detail-layout">
          <div className="gallery-container">
            {images.length > 0 ? (
              <ImageGallery items={images} showThumbnails={true} showFullscreenButton={true} showPlayButton={false} additionalClass="custom-gallery" />
            ) : (
              <div className="no-photos-card"><p className="no-photos">沒有可顯示的照片</p></div>
            )}
          </div>

          <div className="info-container">
            <div className="card">
              <h2 className="subtitle">寵物資料</h2>
              <div className="info-grid">
                <p><strong>ID:</strong> {pet.lostId || pet.foundId}</p>
                <p><strong>名稱:</strong> {pet.name}</p>
                {isLostPet && (
                  <>
                    <p><strong>種類:</strong> {pet.petType === 'cat' ? '貓' : pet.petType === 'dog' ? '狗' : pet.petType}</p>
                    <p><strong>品種:</strong> {pet.breed || '未知'}</p>
                    <p><strong>性別:</strong> {pet.gender === 'male' ? '男' : pet.gender === 'female' ? '女' : pet.gender || '未知'}</p>
                    <p><strong>年齡:</strong> {pet.age || '未知'}</p>
                    <p><strong>顏色:</strong> {pet.color || '未知'}</p>
                    <p><strong>晶片號碼:</strong> {pet.chipNumber || '無'}</p>
                  </>
                )}
                <p><strong>日期:</strong> {pet.lost_date || pet.found_date}</p>
                <p><strong>地點:</strong> {pet.displayLocation || pet.location || pet.found_location || '未知'}</p>
                <p className="details"><strong>詳情:</strong> {pet.details || pet.found_details || '無'}</p>
              </div>
            </div>

            {pet.isPublic && (
              <div className="card contact-card">
                <h2 className="subtitle">聯絡資料</h2>
                <div className="info-grid">
                  <p><strong>聯絡人:</strong> {pet.ownername || pet.reportername}</p>
                  <p><strong>電話:</strong> {pet.phoneNumber}</p>
                  <p><strong>電郵:</strong> {pet.email}</p>
                </div>
                <div className="contact-links">
                  <a href={`tel:${pet.phoneNumber}`} className="button is-primary">電話聯絡</a>
                  <a href={`https://wa.me/${pet.phoneNumber}`} target="_blank" rel="noopener noreferrer" className="button is-success">WhatsApp</a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 地圖展示（包含折線） */}
        {coordinates && (
          <div className="card">
           <h2 className="subtitle">{isLostPet ? '遺失地點' : '發現地點'}</h2>
            <MapContainer center={coordinates} zoom={13} style={{ height: '300px', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* 當前寵物位置 */}
              <Marker position={coordinates}>
                <Popup>
                  <b>{pet.lostId || pet.foundId}</b>
                  <br />
                  {isLostPet ? `遺失日期: ${pet.lost_date}` : `發現日期: ${pet.found_date}`}
                  <br />
                  {pet.displayLocation || pet.location || pet.found_location || '未知'}
                </Popup>
              </Marker>
              {/* 相關報料寵物位置 */}
              {pet.foundId &&
                relatedFoundPets.map((p, idx) => {
                  const pos = (p.found_location || '').split(',').map((coord) => parseFloat(coord.trim()));
                  if (pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1])) {
                    return (
                      <Marker key={p.foundId} position={pos}>
                        <Popup>
                          <b>{p.foundId}</b>
                          <br />
                          {p.found_date}
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
              {/* 如果有多個位置，繪製折線 */}
              {allPositions.length > 1 && <Polyline positions={allPositions} color="blue" />}
            </MapContainer>
          </div>
        )}

        {!coordinates && <p className="has-text-centered">此寵物無可用位置信息</p>}

        {/* 新增 "要求連結" 卡片（始終顯示，僅限 pet 存在時渲染輸入框） */}
        <div className="card">
          <h2 className="subtitle">要求連結</h2>
          <button
            className="button is-info"
            onClick={() => setShowRequestLinkForm(true)}
          >
            要求連結
          </button>
          {pet && showRequestLinkForm && (
            <div className="field mt-2">
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="輸入要要求連結的 foundId"
                  value={requestLinkFoundId}
                  onChange={(e) => setRequestLinkFoundId(e.target.value)}
                />
                <button
                  className="button is-primary mt-2"
                  onClick={handleRequestLink}
                >
                  提交要求
                </button>
                <button
                  className="button is-danger mt-2 ml-2"
                  onClick={() => {
                    setRequestLinkFoundId('');
                    setShowRequestLinkForm(false);
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 發現軌跡時間線 */}
        {pet.foundId && allFoundPets.length > 0 && (
          <div className="card">
            <h2 className="subtitle">發現軌跡</h2>
            <div className="timeline">
              {allFoundPets.sort((a, b) => new Date(a.found_date) - new Date(b.found_date)).map(p => (
                <div key={p.foundId} className="timeline-item">
                  <p><strong>報料 ID:</strong> <a href={`/pet/${p.foundId}`}>{p.foundId}</a></p>
                  <p><strong>發現時間:</strong> {new Date(p.found_date).toLocaleString()}</p>
                  <p><strong>地點:</strong> {p.displayLocation || p.found_location}</p>
                  <p><strong>詳情:</strong> {p.found_details || '無'}</p>
                </div>
              ))}
            </div>

            <div className="field">
              <label className="label">連結其他報料</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="輸入要連結的 foundId"
                  value={linkFoundId}
                  onChange={(e) => setLinkFoundId(e.target.value)}
                />
                <button className="button is-primary mt-2" onClick={handleLinkFoundPets}>提交連結</button>
              </div>
            </div>
          </div>
        )}

        {/* 報失同報料匹配 */}
        <div className="card">
          <h2 className="subtitle">匹配狀態</h2>
          <div className="timeline">
            {matches.map(match => (
              <div key={match.matchId} className="timeline-item">
                <p><strong>匹配 ID:</strong> {match.matchId}</p>
                <p><strong>狀態:</strong> {match.status === 'pending' ? '待確認' : match.status === 'confirmed' ? '已確認' : '已拒絕'}</p>
                <p><strong>走失 ID:</strong> <a href={`/pet/${match.lostId}`}>{match.lostId}</a></p>
                <p><strong>報料 ID:</strong> <a href={`/pet/${match.foundId}`}>{match.foundId}</a></p>
                {match.status === 'pending' && user && isLostPet && pet.userId === user.userId && (
                  <button className="button is-success" onClick={() => handleConfirmMatch(match.matchId)}>確認匹配</button>
                )}
              </div>
            ))}
          </div>

          {user && (
            <div className="field">
              <label className="label">匹配報失/報料</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder={`輸入要匹配的 ${isLostPet ? 'foundId' : 'lostId'}`}
                  value={linkFoundId}
                  onChange={(e) => setLinkFoundId(e.target.value)}
                />
                <button className="button is-primary mt-2" onClick={handleCreateMatch}>提交匹配</button>
              </div>
            </div>
          )}
        </div>

        {/* 報料更新 */}
        {pet.foundId && user && (
          <div className="card">
            <h2 className="subtitle">更新報料</h2>
            <button className="button is-info" onClick={() => setShowUpdateForm(!showUpdateForm)}>
              {showUpdateForm ? '取消' : '更新報料'}
            </button>
            {showUpdateForm && (
              <div className="update-form">
                {!user && (
                  <div className="field">
                    <label className="label">PIN 驗證</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="輸入報料時生成的 PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                    />
                  </div>
                )}
                <div className="field">
                  <label className="label">發現日期</label>
                  <input
                    className="input"
                    type="date"
                    value={updateForm.found_date}
                    onChange={(e) => setUpdateForm({ ...updateForm, found_date: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="label">發現地點</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="格式：緯度,經度"
                    value={updateForm.found_location}
                    onChange={(e) => setUpdateForm({ ...updateForm, found_location: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="label">詳情</label>
                  <textarea
                    className="textarea"
                    value={updateForm.found_details}
                    onChange={(e) => setUpdateForm({ ...updateForm, found_details: e.target.value })}
                  />
                </div>
                <button className="button is-primary" onClick={handleUpdateFoundPet}>提交更新</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default PetDetail;