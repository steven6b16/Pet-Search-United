import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import 'bulma/css/bulma.min.css';
import '../App.css';

function AdminPendingMatches() {
  const [pendingMatches, setPendingMatches] = useState([]);
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 獲取待確認和已確認配對
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = localStorage.getItem('token');
        const [pendingResponse, confirmedResponse] = await Promise.all([
          axios.get('http://localhost:3001/api/admin/pending-matches', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3001/api/matches', {
            params: { status: 'confirmed' },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
  
        setPendingMatches(pendingResponse.data.pendingMatches || []);
        // 過濾出 lostIsFound 和 foundIsFound 均為 0 的 confirmed 配對
        const allMatches = confirmedResponse.data.matches || [];
        setConfirmedMatches(allMatches.filter((match) => 
          match.lostIsFound === 0 && match.foundIsFound === 0
        ));
        setLoading(false);
      } catch (err) {
        console.error('獲取配對失敗:', err);
        setError('無法獲取配對數據，請稍後再試');
        setLoading(false);
      }
    };
  
    fetchMatches();
  }, []);

  // 確認配對 (PENDING -> CONFIRMED)
  const handleConfirmMatch = async (matchId) => {
    if (!window.confirm('確定要確認此配對嗎？確認後狀態將變為 "已確認"')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/admin/confirm-match',
        { matchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      // 將配對從 pending 移到 confirmed
      const confirmedMatch = pendingMatches.find((match) => match.matchId === matchId);
      setPendingMatches(pendingMatches.filter((match) => match.matchId !== matchId));
      setConfirmedMatches([...confirmedMatches, { ...confirmedMatch, status: 'confirmed' }]);
    } catch (err) {
      console.error('確認配對失敗:', err);
      alert(err.response?.data?.error || '確認配對失敗，請稍後再試');
    }
  };

  // 確認已尋獲 (CONFIRMED -> isFound = 1)
  const handleConfirmFound = async (matchId) => {
    if (!window.confirm('確定此配對已尋獲嗎？確認後個案將標記為 "已尋獲"')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/admin/confirm-found',
        { matchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      // 移除已尋獲的配對
      setConfirmedMatches(confirmedMatches.filter((match) => match.matchId !== matchId));
    } catch (err) {
      console.error('確認已尋獲失敗:', err);
      alert(err.response?.data?.error || '確認已尋獲失敗，請稍後再試');
    }
  };

  if (loading) return <div className="has-text-centered">加載中...</div>;
  if (error) return <div className="has-text-centered has-text-danger">{error}</div>;

  return (
    <section className="section">
      <div className="container">
        <h1 className="title has-text-centered">管理配對</h1>

        {/* 待確認配對 */}
        <h2 className="subtitle">待確認配對</h2>
        {pendingMatches.length === 0 ? (
          <p className="has-text-centered">目前沒有待確認的配對</p>
        ) : (
          <div className="columns is-multiline">
            {pendingMatches.map((match) => (
              <div key={match.matchId} className="column is-6">
                <div className="box">
                  <h3 className="subtitle">配對 ID: {match.matchId}</h3>
                  <div className="columns">
                    <div className="column">
                      <h4 className="title is-5">遺失寵物</h4>
                      <p><strong>名稱:</strong> {match.lostPetName || '未知'}</p>
                      <p><strong>種類:</strong> {match.lostPetType === 'cat' ? '貓' : match.lostPetType === 'dog' ? '狗' : '未知'}</p>
                      <p><strong>品種:</strong> {match.lostBreed || '未知'}</p>
                      <p><strong>顏色:</strong> {match.lostColor || '未知'}</p>
                      <p><strong>遺失日期:</strong> {match.lostDate || '未知'}</p>
                      <p><strong>地點:</strong> {match.lostLocation || '未知'}</p>
                      <Link to={`/pet/${match.lostId}`} className="button is-info is-small mt-2">
                        查看詳情
                      </Link>
                    </div>
                    <div className="column">
                      <h4 className="title is-5">尋獲寵物</h4>
                      <p><strong>報料人:</strong> {match.foundReporterName || '未知'}</p>
                      <p><strong>種類:</strong> {match.foundPetType === 'cat' ? '貓' : match.foundPetType === 'dog' ? '狗' : '未知'}</p>
                      <p><strong>品種:</strong> {match.foundBreed || '未知'}</p>
                      <p><strong>顏色:</strong> {match.foundColor || '未知'}</p>
                      <p><strong>發現日期:</strong> {match.foundDate || '未知'}</p>
                      <p><strong>地點:</strong> {match.foundLocation || '未知'}</p>
                      <Link to={`/pet/${match.foundId}`} className="button is-info is-small mt-2">
                        查看詳情
                      </Link>
                    </div>
                  </div>
                  <button
                    className="button is-success mt-4"
                    onClick={() => handleConfirmMatch(match.matchId)}
                  >
                    確認配對
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 已確認配對 */}
        <h2 className="subtitle mt-6">已確認配對（待確認尋獲）</h2>
        {confirmedMatches.length === 0 ? (
          <p className="has-text-centered">目前沒有已確認但未尋獲的配對</p>
        ) : (
          <div className="columns is-multiline">
            {confirmedMatches.map((match) => (
              <div key={match.matchId} className="column is-6">
                <div className="box">
                  <h3 className="subtitle">配對 ID: {match.matchId}</h3>
                  <div className="columns">
                    <div className="column">
                      <h4 className="title is-5">遺失寵物</h4>
                      <p><strong>名稱:</strong> {match.lostPetName || '未知'}</p>
                      <p><strong>種類:</strong> {match.lostPetType === 'cat' ? '貓' : match.lostPetType === 'dog' ? '狗' : '未知'}</p>
                      <p><strong>品種:</strong> {match.lostBreed || '未知'}</p>
                      <p><strong>顏色:</strong> {match.lostColor || '未知'}</p>
                      <p><strong>遺失日期:</strong> {match.lostDate || '未知'}</p>
                      <p><strong>地點:</strong> {match.lostLocation || '未知'}</p>
                      <Link to={`/pet/${match.lostId}`} className="button is-info is-small mt-2">
                        查看詳情
                      </Link>
                    </div>
                    <div className="column">
                      <h4 className="title is-5">尋獲寵物</h4>
                      <p><strong>報料人:</strong> {match.foundReporterName || '未知'}</p>
                      <p><strong>種類:</strong> {match.foundPetType === 'cat' ? '貓' : match.foundPetType === 'dog' ? '狗' : '未知'}</p>
                      <p><strong>品種:</strong> {match.foundBreed || '未知'}</p>
                      <p><strong>顏色:</strong> {match.foundColor || '未知'}</p>
                      <p><strong>發現日期:</strong> {match.foundDate || '未知'}</p>
                      <p><strong>地點:</strong> {match.foundLocation || '未知'}</p>
                      <Link to={`/pet/${match.foundId}`} className="button is-info is-small mt-2">
                        查看詳情
                      </Link>
                    </div>
                  </div>
                  <button
                    className="button is-primary mt-4"
                    onClick={() => handleConfirmFound(match.matchId)}
                  >
                    確認已尋獲
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminPendingMatches;