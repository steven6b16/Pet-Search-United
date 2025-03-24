import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // 路由變化時滾動到頁面頂部
  }, [location.pathname]); // 監聽路徑變化

  return null; // 唔需要渲染任何 UI
}

export default ScrollToTop;