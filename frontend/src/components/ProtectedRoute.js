import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ProtectedRoute({ children, requireLogin = false, requireAdmin = false, setIsLoginOpen }) {
  const token = localStorage.getItem('token');

  if (!token) {
    if (requireLogin) {
      setIsLoginOpen(true);
      return null;
    }
    return children;
  }

  try {
    const decoded = jwtDecode(token);
    if (requireAdmin && decoded.role !== 'admin') {
      return <Navigate to="/" />;
    }
    return children;
  } catch (err) {
    console.error('Token 解碼失敗:', err);
    setIsLoginOpen(true);
    return null;
  }
}

export default ProtectedRoute;