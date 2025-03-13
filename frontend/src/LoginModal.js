import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // 假設你將 CSS 放喺 App.css

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">電話或電郵</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label className="label">密碼</label>
              <div className="control">
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-primary" onClick={handleSubmit}>登入</button>
          <button className="button" onClick={onClose}>取消</button>
        </footer>
      </div>
    </div>
  );
};

export default LoginModal;