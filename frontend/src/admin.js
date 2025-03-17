import React, { useEffect } from 'react';
import axios from 'axios';

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
    </div>
  );
}

export default AdminPage;