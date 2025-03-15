import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './PetDetail.css';

function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [coordinates, setCoordinates] = useState(null);

  // 解析座標從 location 或 found_location（移到組件內部）
  const parseCoordinates = (petData) => {
    const location = petData.location || petData.found_location;
    if (location) {
      const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setCoordinates([lat, lng]);
      } else {
        // 如果 location 是地址而非經緯度，可以調用後端 geocode API
        // 這裡假設 location 是經緯度格式
        setCoordinates(null);
      }
    }
  };

  useEffect(() => {
    axios
      .get(`http://localhost:3001/api/lost-pets/${id}`)
      .then(res => {
        setPet(res.data);
        parseCoordinates(res.data); // 調用解析座標
      })
      .catch(() =>
        axios
          .get(`http://localhost:3001/api/found-pets/${id}`)
          .then(res => {
            setPet(res.data);
            parseCoordinates(res.data); // 調用解析座標
          })
          .catch(() => setPet(null))
      );
  }, [id]);

  if (!pet) return <div className="loading">加載中...</div>;

  // 處理照片（針對 lost_pets 的新字段）
  const images = [];
  if (pet.frontPhoto) {
    images.push({
      original: `http://localhost:3001/${pet.frontPhoto.trim()}`,
      thumbnail: `http://localhost:3001/${pet.frontPhoto.trim()}`,
      description: '正面相',
    });
  }
  if (pet.sidePhoto) {
    images.push({
      original: `http://localhost:3001/${pet.sidePhoto.trim()}`,
      thumbnail: `http://localhost:3001/${pet.sidePhoto.trim()}`,
      description: '側面相',
    });
  }
  if (pet.otherPhotos) {
    const otherPhotosArray = pet.otherPhotos.split(',').map(photo => ({
      original: `http://localhost:3001/${photo.trim()}`,
      thumbnail: `http://localhost:3001/${photo.trim()}`,
      description: '其他相片',
    }));
    images.push(...otherPhotosArray);
  }

  // 判斷是 lost_pets 還是 found_pets
  const isLostPet = !!pet.lostId;

  return (
    <section className="pet-detail-section">
      <div className="container">
        <h1 className="title">{pet.name} 詳細信息</h1>
        <div className="detail-layout">
          {/* 照片展示 - 左側 */}
          <div className="gallery-container">
            {images.length > 0 ? (
              <ImageGallery
                items={images}
                showThumbnails={true}
                showFullscreenButton={true}
                showPlayButton={false}
                additionalClass="custom-gallery"
              />
            ) : (
              <div className="no-photos-card">
                <p className="no-photos">沒有可顯示的照片</p>
              </div>
            )}
          </div>

          {/* 寵物資訊與聯絡資料 - 右側 */}
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
            {console.log(pet.isPublic)}
            {/* 主人資料 */}
            {pet.isPublic == "true" && (
              <div className="card contact-card">
                <h2 className="subtitle">主人的聯絡資料</h2>
                <div className="info-grid">
                  <p><strong>聯絡人:</strong> {pet.ownername}</p>
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
         {/* 地圖顯示 */}
         {coordinates && (
              <div className="card">
                <h2 className="subtitle">走失/發現地點</h2>
                <MapContainer center={coordinates} zoom={13} style={{ height: '300px', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={coordinates}>
                    <Popup>
                      <b>{pet.name}</b><br />
                      {pet.displayLocation || pet.location || pet.found_location}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
      </div>
    </section>
  );
}

export default PetDetail;