import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessage(response.data.message);
      } catch (err) {
        setError(err.response?.data?.error || '無法加載 Dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="container">加載中...</div>;
  if (error) return <div className="container has-text-danger">錯誤：{error}</div>;

  return (
    <div className="container">
      <h1 className="title">Admin Dashboard</h1>
      <p>{message}</p>
      <button className="button is-primary" onClick={() => localStorage.removeItem('token') && window.location.reload()}>
        登出
      </button>
    </div>
  );
}

export default AdminDashboard;