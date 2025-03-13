import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // 假設你將 CSS 放喺 App.css

const RegisterModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3001/api/register', { name, phoneNumber, email, password });
      setMessage(res.data.message);
      setError('');
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
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">姓名</label>
              <div className="control">
                <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label className="label">電話（可選）</label>
              <div className="control">
                <input className="input" type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label">電郵（可選）</label>
              <div className="control">
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label">密碼</label>
              <div className="control">
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
          </form>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-primary" onClick={handleSubmit}>註冊</button>
          <button className="button" onClick={onClose}>取消</button>
        </footer>
      </div>
    </div>
  );
};

export default RegisterModal;