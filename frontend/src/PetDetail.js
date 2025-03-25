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
  const [relatedFoundPets, setRelatedFoundPets] = useState([]);
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [linkFoundId, setLinkFoundId] = useState('');
  const [requestLinkFoundId, setRequestLinkFoundId] = useState('');
  const [showRequestLinkForm, setShowRequestLinkForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ found_date: '', found_location: '', found_details: '', holding_location: '', status: '' });
  const [pin, setPin] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [pendingFoundIds, setPendingFoundIds] = useState([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState([]);
  const [pendingGroupId, setPendingGroupId] = useState(null);
  const [error, setError] = useState(null); // 新增錯誤狀態
  const [loading, setLoading] = useState(true); // 新增加載狀態

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('http://localhost:3001/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setUser(res.data))
        .catch((err) => {
          console.error('Get user failed:', err);
          localStorage.removeItem('token');
        });
    }

    const fetchPet = async () => {
      setLoading(true); // 開始加載
      setError(null); // 重置錯誤
      try {
        let petData = null;
        // 先查 lost_pets
        try {
          const lostResponse = await axios.get(`http://localhost:3001/api/lost-pets/${id}`);
          petData = lostResponse.data;
          petData.type = 'lost'; // 標記類型
        } catch (lostErr) {
          console.log(`未找到走失寵物 ${id}，嘗試查詢發現寵物`);
          // 如果 lost_pets 無記錄，查 found_pets
          try {
            const foundResponse = await axios.get(`http://localhost:3001/api/found-pets/${id}`);
            petData = foundResponse.data;
            petData.type = 'found'; // 標記類型
          } catch (foundErr) {
            console.error('Fetch found pet failed:', foundErr);
            throw new Error('無法找到該寵物資料');
          }
        }

        console.log('Pet data:', petData);
        setPet(petData);
        parseCoordinates(petData);

        if (petData.type === 'found' && petData.foundId) {
          // 獲取已確認的相關報料
          if (petData.groupId) {
            const related = await axios.get(`http://localhost:3001/api/found-pets?groupId=${petData.groupId}`);
            const filteredRelated = related.data.filter(
              (p) => p.foundId !== id && p.groupId === petData.groupId
            );
            console.log('Fetched related found pets:', filteredRelated);
            setRelatedFoundPets(filteredRelated);
          } else {
            setRelatedFoundPets([]);
          }

          // 獲取待確認的 pendingFoundIds
          const pendingData = await axios.get(`http://localhost:3001/api/pending-found-ids/${petData.foundId}`);
          console.log('Pending data:', pendingData.data);
          setPendingGroupId(pendingData.data.groupId);
          setPendingFoundIds(pendingData.data.pendingFoundIds || []);
        } else {
          setRelatedFoundPets([]);
          setPendingFoundIds([]);
        }
      } catch (err) {
        console.error('Fetch pet failed:', err);
        setError(err.message || '無法獲取寵物資料');
        setPet(null);
      } finally {
        setLoading(false); // 結束加載
      }
    };
    fetchPet();
  }, [id]);

  const parseCoordinates = (petData) => {
    const location = petData?.location || petData?.found_location;
    if (location) {
      const [lat, lng] = location.split(',').map((coord) => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) setCoordinates([lat, lng]);
    }
  };

  const getSortedPositions = () => {
    const safePet = pet || {};
    const safeRelatedFoundPets = Array.isArray(relatedFoundPets) ? relatedFoundPets : [];
    const allFoundPets = safePet.type === 'found' ? [safePet, ...safeRelatedFoundPets] : safeRelatedFoundPets;
    const validPets = allFoundPets.filter((p) => p?.found_date && p?.found_location);
    if (validPets.length === 0) return [];
    const sortedPets = validPets.sort((a, b) => new Date(a.found_date) - new Date(b.found_date));
    const positions = [];
    const seenPositions = new Set();
    sortedPets.forEach((p) => {
      const [lat, lng] = (p.found_location || '').split(',').map((coord) => parseFloat(coord.trim()));
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const posKey = `${lat},${lng}`;
        if (!seenPositions.has(posKey)) {
          seenPositions.add(posKey);
          positions.push([lat, lng]);
        }
      }
    });
    return positions;
  };

  const allPositions = getSortedPositions();

  const handleLinkFoundPets = async () => {
    if (!linkFoundId) return alert('請輸入要連結的 foundId');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        'http://localhost:3001/api/create-found-group',
        { foundId1: pet.foundId, foundId2: linkFoundId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      setLinkFoundId('');
      const pendingData = await axios.get(`http://localhost:3001/api/pending-found-ids/${pet.foundId}`);
      setPendingGroupId(pendingData.data.groupId);
      setPendingFoundIds(pendingData.data.pendingFoundIds || []);
    } catch (err) {
      alert(err.response?.data?.error || '創建連結失敗');
    }
  };

  const handleUpdateFoundPet = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `http://localhost:3001/api/update-found/${pet.foundId}`,
        { ...updateForm, pin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('報料已更新');
      setShowUpdateForm(false);
      setPin('');
      const updatedPet = await axios.get(`http://localhost:3001/api/found-pets/${pet.foundId}`);
      setPet({ ...updatedPet.data, type: 'found' });
      parseCoordinates(updatedPet.data);
    } catch (err) {
      alert(err.response?.data?.error || '更新失敗');
    }
  };

  const handleCreateMatch = async () => {
    const token = localStorage.getItem('token');
    if (!linkFoundId) return alert('請輸入要匹配的 ID');
    try {
      const data = pet.type === 'lost'
        ? { lostId: pet.lostId, foundId: linkFoundId }
        : { lostId: linkFoundId, foundId: pet.foundId };
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
      const res = await axios.post(
        'http://localhost:3001/api/confirm-pet-match',
        { matchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      setMatches(matches.map((m) => (m.matchId === matchId ? { ...m, status: 'confirmed' } : m)));
      setPet({ ...pet, isFound: true });
    } catch (err) {
      alert(err.response?.data?.error || '確認失敗');
    }
  };

  const handleConfirmLink = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('請先登入');
    if (!pendingGroupId) return alert('當前報料無待確認群組，請先提交連結');
    if (selectedPendingIds.length === 0) return alert('請選擇至少一個要確認的報料');

    try {
      const res = await axios.post(
        'http://localhost:3001/api/confirm-found-group',
        { groupId: pendingGroupId, confirmFoundIds: selectedPendingIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      const related = await axios.get(`http://localhost:3001/api/found-pets?groupId=${pendingGroupId}`);
      setRelatedFoundPets(related.data.filter((p) => p.foundId !== id && p.groupId === pendingGroupId));
      const pendingData = await axios.get(`http://localhost:3001/api/pending-found-ids/${pet.foundId}`);
      setPendingGroupId(pendingData.data.groupId);
      setPendingFoundIds(pendingData.data.pendingFoundIds || []);
      setSelectedPendingIds([]);
      const updatedPet = await axios.get(`http://localhost:3001/api/found-pets/${id}`);
      setPet({ ...updatedPet.data, type: 'found' });
    } catch (err) {
      alert(err.response?.data?.error || '確認失敗');
    }
  };

  const togglePendingIdSelection = (foundId) => {
    setSelectedPendingIds((prev) =>
      prev.includes(foundId) ? prev.filter((id) => id !== foundId) : [...prev, foundId]
    );
  };

  if (loading) return <div className="loading">加載中...</div>;
  if (error) return <div className="has-text-centered">{error}</div>;
  if (!pet) return <div className="has-text-centered">無法找到該寵物資料</div>;

  const images = [];
  if (pet.frontPhoto) images.push({ original: `http://localhost:3001/${pet.frontPhoto.trim()}`, thumbnail: `http://localhost:3001/${pet.frontPhoto.trim()}`, description: '正面相' });
  if (pet.sidePhoto) images.push({ original: `http://localhost:3001/${pet.sidePhoto.trim()}`, thumbnail: `http://localhost:3001/${pet.sidePhoto.trim()}`, description: '側面相' });
  if (pet.otherPhotos) {
    const otherPhotosArray = pet.otherPhotos.split(',').map((photo) => ({
      original: `http://localhost:3001/${photo.trim()}`,
      thumbnail: `http://localhost:3001/${photo.trim()}`,
      description: '其他相片',
    }));
    images.push(...otherPhotosArray);
  }
  if (pet.photos) {
    const photosArray = pet.photos.split(',').map((photo) => ({
      original: `http://localhost:3001/${photo.trim()}`,
      thumbnail: `http://localhost:3001/${photo.trim()}`,
      description: '報料相片',
    }));
    images.push(...photosArray);
  }

  const isLostPet = pet.type === 'lost';

  return (
    <section className="pet-detail-section">
      <div className="container">
        <h1 className="title">{pet.name || '未知名稱'} 詳細信息</h1>
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
              <p><span className="caseid">個案編號: {pet.lostId || pet.foundId}</span></p>
              <div className="info-grid">
                {pet.name && (
                  <p><strong>寵物名稱:</strong> {pet.name || '未知'}</p>
                )}
                {isLostPet && (
                  <>
                    <p><strong>種類:</strong> {pet.petType === 'cat' ? '貓' : pet.petType === 'dog' ? '狗' : pet.petType || '未知'}</p>
                    <p><strong>品種:</strong> {pet.breed || '未知'}</p>
                    <p><strong>性別:</strong> {pet.gender === 'male' ? '男' : pet.gender === 'female' ? '女' : pet.gender || '未知'}</p>
                    <p><strong>年齡:</strong> {pet.age || '未知'}</p>
                    <p><strong>顏色:</strong> {pet.color || '未知'}</p>
                    <p><strong>晶片號碼:</strong> {pet.chipNumber || '無'}</p>
                  </>
                )}
                {pet.lost_date && (
                  <p><strong>遺失日期:</strong> {pet.lost_date}</p>
                )}
                {pet.found_date && (
                  <p><strong>發現日期:</strong> {pet.found_date}</p>
                )}
                <p><strong>地點:</strong> {pet.displayLocation || pet.location || pet.found_location || '未知'}</p>
                <p className="details"><strong>詳情:</strong> {pet.details || pet.found_details || '無'}</p>
              </div>
            </div>

            {pet.isPublic == 1 && (
              <div className="card contact-card">
                <h2 className="subtitle">聯絡資料</h2>
                <div className="info-grid">
                  <p><strong>聯絡人:</strong> {pet.ownername || pet.reportername || '未知'}</p>
                  <p><strong>電話:</strong> {pet.phoneNumber || '無'}</p>
                  <p><strong>電郵:</strong> {pet.email || '無'}</p>
                </div>
                <div className="contact-links">
                  {pet.phoneNumber && (
                    <>
                      <a href={`tel:${pet.phoneNumber}`} className="button is-primary">電話聯絡</a>
                      <a href={`https://wa.me/${pet.phoneNumber}`} target="_blank" rel="noopener noreferrer" className="button is-success">WhatsApp</a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 地圖展示 */}
        {coordinates && (
          <div className="card">
            <h2 className="subtitle">{isLostPet ? '遺失地點' : '發現地點'}</h2>
            <MapContainer center={coordinates} zoom={13} style={{ height: '600px', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={coordinates}>
                <Popup>
                  <b>{pet?.lostId || pet?.foundId || '未知'}</b>
                  <br />
                  {isLostPet ? `遺失日期: ${pet?.lost_date || '未知'}` : `發現日期: ${pet?.found_date || '未知'}`}
                  <br />
                  {pet?.displayLocation || pet?.location || pet?.found_location || '未知'}
                </Popup>
              </Marker>
              {pet.type === 'found' && Array.isArray(relatedFoundPets) &&
                relatedFoundPets.map((p, idx) => {
                  if (!p?.found_location) return null;
                  const pos = (p.found_location || '').split(',').map((coord) => parseFloat(coord.trim()));
                  if (pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1])) {
                    return (
                      <Marker key={p.foundId || idx} position={pos}>
                        <Popup>
                          <b>{p.foundId || '未知'}</b>
                          <br />
                          {p.found_date || '未知'}
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
              {allPositions.length > 1 && <Polyline positions={allPositions} color="black" />}
            </MapContainer>
          </div>
        )}
        {!coordinates && <p className="has-text-centered">此寵物無可用位置信息</p>}

        {/* 發現軌跡時間線 */}
        {pet?.foundId && allPositions.length > 1 ? (
        <div className="card">
          <h2 className="subtitle">發現軌跡</h2>
          <div className="timeline">
            {[...(pet.foundId ? [pet] : []), ...relatedFoundPets]
              .sort((a, b) => new Date(a.found_date) - new Date(b.found_date))
              .map((p) => {
                // 提取第一張圖片（假設 photos 是逗號分隔嘅字串）
                const photoUrl = p.photos && p.photos.split(',')[0] 
                  ? `http://localhost:3001/${p.photos.split(',')[0].trim()}` 
                  : 'https://via.placeholder.com/100?text=無圖片'; // 預設佔位圖

                return (
                  <a href={`/pet/${p.foundId}`} key={p.foundId}>
                    <div className="timeline-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* 圖片顯示 */}
                        <img 
                          src={photoUrl} 
                          alt={`報料 ${p.foundId} 圖片`}
                          style={{ 
                            width: '100px', 
                            height: '100px', 
                            objectFit: 'cover', 
                            borderRadius: '6px', 
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
                          }} 
                        />
                        {/* 文字內容 */}
                        <div>
                          <p><strong>發現時間:</strong> {new Date(p.found_date).toLocaleString()}</p>
                          <p><strong>地點:</strong> {p.displayLocation || p.found_location || '未知'}</p>
                          <p><strong>詳情:</strong> {p.found_details || '無'}</p>
                          <p><span className="caseid">個案編號: {p.foundId}</span></p>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
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
          {/* 確認連結 */}
          {pet?.foundId && (
            <div className="card">
              <h2 className="subtitle">確認連結</h2>
              {pendingFoundIds.length > 0 ? (
                <div>
                  <p>待確認的報料：</p>
                  {pendingFoundIds.map((foundId) => (
                    <div key={foundId} className="field">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPendingIds.includes(foundId)}
                          onChange={() => togglePendingIdSelection(foundId)}
                        />
                        {foundId}
                      </label>
                    </div>
                  ))}
                  <button className="button is-success mt-2" onClick={handleConfirmLink}>
                    確認所選連結
                  </button>
                </div>
              ) : (
                <p>目前無待確認的報料</p>
              )}
            </div>
          )}
        </div>
      ) : (  
        <div className="card">
          <h2 className="subtitle">發現軌跡</h2>
          <p>此寵物無發現軌跡</p>
        </div>
      )}

        {/* 匹配狀態 */}
        <div className="card">
          <h2 className="subtitle">匹配狀態</h2>
          <div className="timeline">
            {matches.map((match) => (
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
        {pet.type === 'found' && user && (
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