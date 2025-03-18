import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // 修改為命名導入

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" />; // 如果沒有 token，重定向到首頁
  }

  try {
    const decoded = jwtDecode(token); // 使用 jwtDecode 函數
    if (decoded.role !== 'admin') {
      return <Navigate to="/" />; // 如果不是 admin，重定向到首頁
    }
    return children; // 是 admin，返回子組件（AdminDashboard）
  } catch (err) {
    console.error('Token 解碼失敗:', err);
    return <Navigate to="/" />; // token 無效，重定向到首頁
  }
}

export default ProtectedRoute;