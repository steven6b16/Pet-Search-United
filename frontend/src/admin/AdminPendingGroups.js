import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPendingGroups() {
  const [pendingGroups, setPendingGroups] = useState([]); // 儲存待確認嘅 Group 資料
  const [selectedFoundIds, setSelectedFoundIds] = useState({}); // 儲存每個 Group 選擇嘅 foundId

  useEffect(() => {
    // 獲取待確認嘅 Group 資料
    axios
      .get('http://localhost:3001/api/admin/pending-groups', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setPendingGroups(response.data.pendingGroups);
      })
      .catch((error) => {
        console.error('獲取待確認群組失敗:', error);
      });
  }, []);

  // 處理 checkbox 選擇
  const handleCheckboxChange = (groupId, foundId) => {
    setSelectedFoundIds((prev) => ({
      ...prev,
      [groupId]: prev[groupId]
        ? prev[groupId].includes(foundId)
          ? prev[groupId].filter((id) => id !== foundId)
          : [...prev[groupId], foundId]
        : [foundId],
    }));
  };

  // 處理 Approve 或 Reject 操作
  const handleAction = (groupId, action) => {
    const selected = selectedFoundIds[groupId] || [];
    if (selected.length === 0) {
      alert('請至少選擇一個 foundId');
      return;
    }

    axios
      .post(
        'http://localhost:3001/api/admin/confirm-group',
        {
          groupId,
          selectedFoundIds: selected,
          action,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
      .then((response) => {
        alert(response.data.message);
        // 刷新頁面以更新數據
        window.location.reload();
      })
      .catch((error) => {
        console.error('處理群組失敗:', error);
      });
  };

  return (
    <section className="section custom-section">
      <div className="container">
        <h1 className="title is-3">待確認嘅 Found Pet Groups</h1>
        {pendingGroups.length === 0 ? (
          <p className="has-text-grey">暫無待確認嘅群組</p>
        ) : (
          pendingGroups.map((group) => (
            <div key={group.groupId} className="box">
              <h2 className="subtitle is-4">Group ID: {group.groupId}</h2>
              {group.foundPets.map((pet) => (
                <div key={pet.foundId} className="timeline-item mb-4">
                  <div className="columns is-vcentered">
                    {/* 圖片區域 */}
                    <div className="column is-narrow">
                      <figure className="image" style={{ width: '100px', height: '100px' }}>
                        <img
                          src={
                            pet.photos && pet.photos.split(',')[0]
                              ? `http://localhost:3001/${pet.photos.split(',')[0]}`
                              : '/default-pet-image.jpg' // 預設圖片
                          }
                          alt={`報料 ${pet.foundId} 圖片`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                      </figure>
                    </div>
                    {/* 資料區域 */}
                    <div className="column">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          onChange={() => handleCheckboxChange(group.groupId, pet.foundId)}
                        />
                        <span className="ml-2">選擇此報料</span>
                      </label>
                      <p>
                        <strong>發現時間:</strong> {pet.found_date}
                      </p>
                      <p>
                        <strong>地點:</strong> {pet.found_location}
                      </p>
                      <p>
                        <strong>詳情:</strong> {pet.found_details || '無詳細描述'}
                      </p>
                      <p>
                        <span className="caseid">個案編號: {pet.foundId}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="buttons">
                <button
                  onClick={() => handleAction(group.groupId, 'approve')}
                  className="button is-success"
                >
                  批准
                </button>
                <button
                  onClick={() => handleAction(group.groupId, 'reject')}
                  className="button is-info"
                >
                  拒絕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default AdminPendingGroups;