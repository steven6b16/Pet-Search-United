import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaPaw } from 'react-icons/fa';

function UserLostReports({ user, token }) {
  const [lostReports, setLostReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('請先登入以查看報失記錄');
      return;
    }

    const fetchData = async () => {
      try {
        const reportsResponse = await axios.get('http://localhost:3001/api/user/lost-reports', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reports = reportsResponse.data || [];
        setLostReports(reports);
        console.log('Lost Reports:', reports);

        const lostIds = reports.map((report) => report.lostId).join(',');
        console.log('Lost IDs for matches:', lostIds);
        if (lostIds) {
          const matchesResponse = await axios.get('http://localhost:3001/api/matches', {
            params: { petId: lostIds },
            headers: { Authorization: `Bearer ${token}` },
          });
          const matchesData = matchesResponse.data.matches || [];
          setMatches(matchesData);
          console.log('Matches data:', matchesData);
        } else {
          setMatches([]);
          console.log('No lostIds, matches set to empty');
        }
        setError(null);
      } catch (err) {
        console.error('獲取數據失敗:', err.response?.data || err);
        setError(err.response?.data?.error || '無法獲取報失記錄或匹配數據，請稍後再試');
      }
    };

    fetchData();
  }, [token]);

  const handleDelete = async (lostId) => {
    console.log('刪除報失記錄:', lostId);
    if (window.confirm('確定要刪除此報失記錄嗎？')) {
      try {
        await axios.delete(`http://localhost:3001/api/user/lost-reports/${lostId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLostReports(lostReports.filter((report) => report.lostId !== lostId));
        setMatches(matches.filter((match) => match.lostId !== lostId));
      } catch (err) {
        setError('刪除失敗: ' + err.response?.data?.error);
      }
    }
  };

  const handleConfirmMatch = async (matchId) => {
    if (!window.confirm('當確認配對，即表示已尋獲你的寵物，個案將不會再公開，是否確認？')) return;

    try {
      const response = await axios.post(
        'http://localhost:3001/api/confirm-pet-match',
        { matchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      const lostIds = lostReports.map((report) => report.lostId).join(',');
      const matchesResponse = await axios.get('http://localhost:3001/api/matches', {
        params: { petId: lostIds },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(matchesResponse.data.matches || []);
    } catch (err) {
      console.error('確認配對失敗:', err);
      alert(err.response?.data?.error || '確認配對失敗，請稍後再試');
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
                  {/* 顯示匹配信息 */}
                  {matches
                    .filter((match) => String(match.lostId) === String(pet.lostId)) // 確保字符串比較
                    .map((match) => (
                      <div key={match.matchId} className="mt-4">
                        <p><strong>匹配 ID:</strong> {match.matchId}</p>
                        <p><strong>狀態:</strong> {match.status === 'pending' ? '待確認' : match.status === 'confirmed' ? '已確認' : '已拒絕'}</p>
                        <p><strong>尋獲 ID:</strong> <Link to={`/pet/${match.foundId}`}>{match.foundId}</Link></p>
                        {match.status === 'pending' && user && user.userId === pet.userId && (
                          <button
                            className="button is-success mt-2"
                            onClick={() => handleConfirmMatch(match.matchId)}
                          >
                            確認配對
                          </button>
                        )}
                      </div>
                    ))}
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