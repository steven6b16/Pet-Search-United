import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ImageGallery from 'react-image-gallery';

function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3001/api/lost-pets/${id}`)
      .then(res => setPet(res.data))
      .catch(() => axios.get(`http://localhost:3001/api/found-pets/${id}`).then(res => setPet(res.data)));
  }, [id]);

  if (!pet) return <div>加載中...</div>;

  const images = pet.photos.split(',').map(photo => ({
    original: `http://localhost:3001/${photo}`, // 加上基礎 URL
    thumbnail: `http://localhost:3001/${photo}`,
  }));

  return (
    <div>
      <h1>{pet.name} 詳細信息</h1>
      {pet.photos && <ImageGallery items={images} />}
      <p>ID: {pet.lostId || pet.foundId}</p>
      <p>日期: {pet.lost_date || pet.found_date}</p>
      <p>地點: {pet.location || pet.found_location}</p>
      <p>詳情: {pet.details || pet.found_details}</p>
      {pet.isPublic && pet.contact && (
        <div>
          <p>聯絡人: {pet.contact.name}</p>
          <p>電話: {pet.contact.phoneNumber}</p>
          <p>電郵: {pet.contact.email}</p>
          <a href={`tel:${pet.contact.phoneNumber}`}>電話</a> | 
          <a href={`https://wa.me/${pet.contact.phoneNumber}`}>WhatsApp</a>
        </div>
      )}
    </div>
  );
}

export default PetDetail;