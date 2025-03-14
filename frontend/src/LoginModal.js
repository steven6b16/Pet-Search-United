import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [activeTab, setActiveTab] = useState('phone'); // 默認電話登入
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('HK+852'); // 默認區號
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證
    if (activeTab === 'phone') {
      if (!phonePrefix) {
        setError('請選擇區號');
        return;
      }
      if (!phoneNumber) {
        setError('請輸入電話號碼');
        return;
      }
    }
    if (activeTab === 'email' && !email) {
      setError('請輸入電郵');
      return;
    }
    if (!password) {
      setError('請輸入密碼');
      return;
    }

    try {
      const identifier = activeTab === 'phone' ? `${phonePrefix} ${phoneNumber}` : email;
      const res = await axios.post('http://localhost:3001/api/login', { identifier, password });
      onLogin(res.data.token, res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || '登入失敗');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal is-active" style={{ zIndex: 1000 }}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">登入</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          {error && <p className="has-text-danger">{error}</p>}
          {/* Tabs 切換 */}
          <div className="tabs is-boxed">
            <ul>
              <li className={activeTab === 'phone' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('phone')}>電話登入</a>
              </li>
              <li className={activeTab === 'email' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('email')}>電郵登入</a>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 電話登入部分 */}
            <div className={`field ${activeTab === 'email' ? 'is-hidden' : ''}`}>
              <label className="label">電話</label>
              <div className="field has-addons">
                <div className="control">
                  <div className="select">
                    <select
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      required
                    >
                      <option value="HK+852">HK +852</option>
                      <option value="TW+886">TW +886</option>
                    </select>
                  </div>
                </div>
                <div className="control is-expanded">
                  <input
                    className="input"
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="912345678"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 電郵欄位 */}
            <div className={`field ${activeTab === 'phone' ? 'is-hidden' : ''}`}>
              <label className="label">電郵</label>
              <div className="control">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="請輸入電郵"
                  required={activeTab === 'email'}
                />
              </div>
            </div>

            {/* 密碼欄位 */}
            <div className="field">
              <label className="label">密碼</label>
              <div className="control">
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  required
                />
              </div>
            </div>
          </form>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-primary register-button" onClick={handleSubmit}>登入</button>
          <button className="button cancel-button" onClick={onClose}>取消</button>
        </footer>
      </div>
    </div>
  );
};

export default LoginModal;