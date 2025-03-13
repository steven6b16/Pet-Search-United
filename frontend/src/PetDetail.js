import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ImageGallery from 'react-image-gallery';
import './PetDetail.css';

function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3001/api/lost-pets/${id}`)
      .then(res => setPet(res.data))
      .catch(() => axios.get(`http://localhost:3001/api/found-pets/${id}`)
        .then(res => setPet(res.data))
        .catch(() => setPet(null))); // 處理兩種 API 都失敗的情況
  }, [id]);

  if (!pet) return <div>加載中...</div>;

  // 處理照片
  const images = pet.photos?.split(',').map(photo => ({
    original: `http://localhost:3001/${photo.trim()}`, // 確保去掉多餘空格
    thumbnail: `http://localhost:3001/${photo.trim()}`,
  })) || [];

  // 判斷是 lost_pets 還是 found_pets
  const isLostPet = !!pet.lostId;

  return (
    <div>
      <h1>{pet.name} 詳細信息</h1>
      {images.length > 0 && <ImageGallery items={images} />}
      
      {/* 寵物資訊 */}
      <h2>寵物資料</h2>
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
      <p><strong>詳情:</strong> {pet.details || pet.found_details || '無'}</p>

      {/* 主人資料 */}
      {pet.isPublic && (
        <div>
          <h2>主人的聯絡資料</h2>
          <p><strong>聯絡人:</strong> {pet.ownername}</p>
          <p><strong>電話:</strong> {pet.phoneNumber}</p>
          <p><strong>電郵:</strong> {pet.email}</p>
          <a href={`tel:${pet.phoneNumber}`}>電話聯絡</a> | 
          <a href={`https://wa.me/${pet.phoneNumber}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
      )}
    </div>
  );
}

export default PetDetail;