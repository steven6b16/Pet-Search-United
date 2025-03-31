import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaPaw } from 'react-icons/fa';

function UserLostReports({ user, token }) {
  const [lostReports, setLostReports] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('請先登入以查看報失記錄');
      return;
    }

    axios
      .get('http://localhost:3001/api/user/lost-reports', { 
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setLostReports(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error('獲取報失記錄失敗:', err);
        setError(err.response?.data?.error || '無法獲取報失記錄，請稍後再試');
      });
  }, [token]);

  const handleDelete = async (lostId) => {
    console.log('刪除報失記錄:', lostId);
    if (window.confirm('確定要刪除此報失記錄嗎？')) {
      try {
        await axios.delete(`http://localhost:3001/api/user/lost-reports/${lostId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLostReports(lostReports.filter(report => report.lostId !== lostId));
      } catch (err) {
        setError('刪除失敗: ' + err.response?.data?.error);
      }
    }
  };

  return (
    <div className="form-card">
      <h2 className="subtitle is-4 mb-4 has-text-centered">
        <FaPaw className="mr-2" /> 我的報失記錄
      </h2>
      {error ? (
        <p className="has-text-danger has-text-centered">{error}</p>
      ) : lostReports.length > 0 ? (
        <div className="columns is-multiline is-centered">
          {lostReports.map((pet) => (
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
                    <img src="/icon/cat.png" alt="寵物占位圖" className="pet-image" />
                  </figure>
                )}
                <div className="pet-info">
                  <p className="pet-name">{pet.name}</p>
                  <p className="pet-detail">種類：{pet.petType === 'cat' ? '貓' : '狗'}</p>
                  <p className="pet-detail">走失日期：{pet.lost_date?.split(' ')[0]}</p>
                  <p className="pet-detail">走失地點：{pet.displayLocation || '未知'}</p>
                  <div className="buttons is-centered mt-2">
                    <Link to={`/pet/${pet.lostId}`} className="button custom-button is-small mr-2">
                      查看詳情
                    </Link>
                    
                    <button 
                      onClick={() => handleDelete(pet.lostId)}
                      className="button is-danger is-small"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="has-text-grey has-text-centered">暫無報失記錄</p>
      )}
    </div>
  );
}

export default UserLostReports;