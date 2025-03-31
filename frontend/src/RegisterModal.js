import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const RegisterModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('phone'); // 默認電話註冊
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('HK+852'); // 默認區號
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
      const payload = {};
      if (activeTab === 'phone') {
        payload.phoneNumber = `${phonePrefix} ${phoneNumber}`;
        payload.email = null; // 明確設為 null
      } else if (activeTab === 'email') {
        payload.phoneNumber = null; // 明確設為 null
        payload.email = email;
      }
      payload.password = password;

      const res = await axios.post('http://localhost:3001/api/register', payload);
      setMessage(res.data.message);
      setError('');
      //onClose();
    } catch (err) {
      setError(err.response?.data?.error || '註冊失敗');
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal is-active" style={{ zIndex: 1000 }}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">註冊</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          {error && <p className="has-text-danger">{error}</p>}
          {message && <p className="has-text-success">{message}</p>}

          {/* Tabs 切換 */}
          <div className="tabs is-boxed">
            <ul>
              <li className={activeTab === 'phone' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('phone')}>電話註冊</a>
              </li>
              <li className={activeTab === 'email' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('email')}>電郵註冊</a>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 電話註冊部分 */}
            <div className={`field ${activeTab === 'email' ? 'is-hidden' : ''}`}>
              <label className="label">電話</label>
              <div className="field has-addons">
                <div className="control">
                  <div className="select">
                    <select
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      required={activeTab === 'phone'}
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
                    required={activeTab === 'phone'}
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
          <button className="button is-primary register-button" onClick={handleSubmit}>註冊</button>
          <button className="button cancel-button" onClick={onClose}>取消</button>
        </footer>
      </div>
    </div>
  );
};

export default RegisterModal;