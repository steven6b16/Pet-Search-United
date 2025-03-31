import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

function UserFoundReports({ user, token }) {
  const [foundReports, setFoundReports] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('請先登入以查看報料記錄');
      return;
    }

    axios
      .get('http://localhost:3001/api/user/found-reports', { 
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setFoundReports(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error('獲取報料記錄失敗:', err);
        setError(err.response?.data?.error || '無法獲取報料記錄，請稍後再試');
      });
  }, [token]);

  const handleDelete = async (foundId) => {
    if (window.confirm('確定要刪除此報料記錄嗎？')) {
      try {
        await axios.delete(`http://localhost:3001/api/user/found-reports/${foundId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFoundReports(foundReports.filter(report => report.foundId !== foundId));
      } catch (err) {
        setError('刪除失敗: ' + err.response?.data?.error);
      }
    }
  };

  return (
    <div className="form-card">
      <h2 className="subtitle is-4 mb-4 has-text-centered">
        <FaSearch className="mr-2" /> 我的報料記錄
      </h2>
      {error ? (
        <p className="has-text-danger has-text-centered">{error}</p>
      ) : foundReports.length > 0 ? (
        foundReports.map((pet) => (
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
                    <img src="/icon/cat.png" alt="寵物占位圖" className="is-rounded" />
                  </figure>
                )}
              </div>
              <div className="media-content">
                <p className="is-size-6">
                  發現 <strong>{pet.petType === 'cat' ? '貓' : '狗'}</strong> 在{' '}
                  {pet.displayLocation || '未知地點'}
                </p>
                <p className="is-size-7 has-text-grey">
                  發現時間：{pet.found_date?.split(' ')[0]}
                </p>
                <div className="buttons mt-2">
                  <Link to={`/pet/${pet.foundId}`} className="button custom-button is-small mr-2">
                    查看詳情
                  </Link>
                 
                  <button 
                    onClick={() => handleDelete(pet.foundId)}
                    className="button is-danger is-small"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="has-text-grey has-text-centered">暫無報料記錄</p>
      )}
    </div>
  );
}

export default UserFoundReports;