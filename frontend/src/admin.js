import React, { useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // 引入 Link 組件用於導航

function AdminPage() {
  useEffect(() => {
    // 驗證 Admin 權限並獲取數據
    axios
      .get('http://localhost:3001/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        console.log(response.data.message); // "Welcome to the Admin Dashboard!"
      })
      .catch((error) => {
        console.error('Access denied:', error.response.data.error);
      });
  }, []);

  return (
    <div className="container">
      <h1 className="title">Admin Dashboard</h1>
      <p>只有管理員可以看到這個頁面！</p>
      {/* 按鈕導航到 AdminPendingGroups 頁面 */}
      <Link to="/admin/pending-groups">
        <button className="button">查看待確認嘅 Found Pet Groups</button>
      </Link>
    </div>
  );
}

export default AdminPage;