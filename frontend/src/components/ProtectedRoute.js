import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ProtectedRoute({ children, requireLogin = false, requireAdmin = false, setIsLoginOpen }) {
  const token = localStorage.getItem('token');
  const location = useLocation(); // 獲取當前路徑

  // 定義一個函數來處理未登入或無效 token 嘅情況
  const handleUnauthorized = () => {
    // 喺顯示 LoginModal 之前，記錄目標路徑
    localStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    setIsLoginOpen(true);
    return <Navigate to="/" replace />; // 跳轉回首頁
  };

  // 如果無 token 且需要登入
  if (!token && requireLogin) {
    return handleUnauthorized();
  }

  // 如果有 token，驗證其有效性
  if (token) {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // 當前時間（秒）

      // 檢查 token 是否過期
      if (decoded.exp < currentTime) {
        // token 過期，清除本地存儲
        localStorage.removeItem('token');
        return handleUnauthorized();
      }

      // 檢查是否需要管理員權限
      if (requireAdmin && decoded.role !== 'admin') {
        return <Navigate to="/" replace />;
      }

      // token 有效，允許訪問
      return children;
    } catch (err) {
      console.error('Token 解碼失敗:', err);
      // 清除無效 token
      localStorage.removeItem('token');
      return handleUnauthorized();
    }
  }

  // 如果唔需要登入，直接渲染子組件
  return children;
}

export default ProtectedRoute;