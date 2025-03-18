import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Reportpage.css';
import { detailinputs } from './constants/QuickInput';
import { catBreeds, dogBreeds, petage } from './constants/PetConstants';
import proj4 from 'proj4';

// 使用本地圖標
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

function LocationMarker({ setLatLng, setLocation }) {
  const [position, setPosition] = useState(null);

  // 定義 WGS84 和 HK1980 的投影參數
  proj4.defs('WGS84', '+proj=longlat +datum=WGS84 +no_defs');
  proj4.defs('HK1980', '+proj=tmerc +lat_0=22.31213333333333 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs');

  // WGS84 轉 HK1980
  const convertToHK1980Grid = (lat, lng) => {
    const [x, y] = proj4('WGS84', 'HK1980', [lng, lat]); // 注意：proj4 使用 [經度, 緯度] 順序
    return { x: Math.round(x), y: Math.round(y) };
  };

  const fetchHKLocation = async (x, y) => {
    const apiUrl = `https://geodata.gov.hk/gs/api/v1.0.0/identify?x=${x}&y=${y}&lang=zh`; // 使用代理路徑
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('HK API 查詢錯誤：', error);
      throw error;
    }
  };

  const map = useMapEvents({
    click(e) {
      console.log('地圖點擊：', e.latlng);
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setLatLng({ lat, lng });

      // 轉換為香港1980方格網坐標
      const hkCoords = convertToHK1980Grid(lat, lng);
      console.log('轉換後坐標：', hkCoords);

      // 驗證坐標範圍
      if (hkCoords.x < 800000 || hkCoords.x > 860000 || hkCoords.y < 800000 || hkCoords.y > 850000) {
        console.error('坐標超出香港範圍：', hkCoords);
        return;
      }

      // 使用轉換後的坐標查詢地點
      fetchHKLocation(hkCoords.x, hkCoords.y)
        .then(data => {
          console.log('HK API 結果：', data);
          let fullAddress = '未知地址';
          let simplifiedAddress = '未知簡化地址';

          if (data?.results?.length > 0) {
            const result = data.results[0];
            const addressInfo = result.addressInfo?.[0];
            if (addressInfo) {
              // 組合 caddress 和 cname
              const caddress = addressInfo.caddress || '';
              const cname = addressInfo.cname || '';
              fullAddress = `${caddress}${cname}`; // 例如 "朗屏路1號畫屏樓"
              simplifiedAddress = `${caddress}${cname}`; // 如果沒有 caddress，用 fullAddress
            }
          }

          console.log('提取的地址：', { fullAddress, simplifiedAddress });
          setLocation(fullAddress, simplifiedAddress);
        })
        .catch(err => console.error('地點查詢錯誤：', err));
    },
  });

  return position === null ? null : <Marker position={position} />;
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get(`http://localhost:3001/geocode?lat=${lat}&lon=${lng}`);
    const fullAddress = response.data.display_name || '未知地址';
    const addressParts = fullAddress.split(', ').filter(part => part.trim() !== '中華人民共和國');
    const simplifiedAddress =
      addressParts.length >= 2
        ? `${addressParts[addressParts.length - 4] || ''} ${addressParts[0]}`.trim()
        : fullAddress;
    return { fullAddress: addressParts.join(', '), simplifiedAddress };
  } catch (error) {
    console.error('逆向地理編碼失敗：', error.message);
    return { fullAddress: '未知地址', simplifiedAddress: '未知地點' };
  }
}

function ReportLost() {
  const initialFormData = {
    userId: 0,
    ownername: '',
    phonePrefix: '+852',
    phoneNumber: '',
    email: '',
    name: '',
    breed: '',
    petType: '',
    gender: '',
    age: '',
    color: '',
    lost_date: '',
    location: '',
    details: '',
    chipNumber: '',
    fullAddress: '',
    displayLocation: '',
    region: '',
    isPublic: 0,
    isFound: 0,
    isDeleted: 0,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);
  const [otherPhotos, setOtherPhotos] = useState([]);
  const [latLng, setLatLng] = useState(null);
  const [photoError, setPhotoError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'details' && value.length > 200) return;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFrontPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontPhoto(file);
      setPhotoError('');
      await processPhoto(file);
    }
  };

  const handleSidePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSidePhoto(file);
      setPhotoError('');
      await processPhoto(file);
    }
  };

  const handleOtherPhotosChange = async (e) => {
    const files = [...e.target.files];
    if (files.length > 5) {
      setPhotoError('其他相片最多只能上傳 5 張');
      e.target.value = '';
      return;
    }
    setOtherPhotos(files);
    setPhotoError('');
    if (files.length > 0) await processPhoto(files[0]);
  };

  const processPhoto = async (file) => {
    const photoFormData = new FormData();
    photoFormData.append('image', file);
    try {
      const response = await axios.post('http://127.0.0.1:5001/upload', photoFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { has_pet, message } = response.data;
      if (has_pet) {
        const petType = message.toLowerCase().includes('cat') ? 'cat' : 'dog';
        setFormData(prev => ({ ...prev, petType }));
        console.log('檢測結果：', message);
      } else {
        setFormData(prev => ({ ...prev, petType: '' }));
        console.log('無寵物檢測到：', message);
        setPhotoError('圖片檢測失敗，請選擇其他圖片');
        setFrontPhoto(null);
        setSidePhoto(null);
        setOtherPhotos([]);
      }
    } catch (error) {
      setPhotoError('圖片檢測失敗，請選擇其他圖片');
      setFrontPhoto(null);
      setSidePhoto(null);
      setOtherPhotos([]);
    }
  };

  const handleMapUpdate = (latLngObj) => {
    console.log('更新地圖，latLngObj:', latLngObj);
    const newRegion = latLngObj
      ? latLngObj.lat >= 22.1 && latLngObj.lat <= 22.6 && latLngObj.lng >= 113.8 && latLngObj.lng <= 114.4
        ? 'HK'
        : latLngObj.lat >= 21.9 && latLngObj.lat <= 25.3 && latLngObj.lng >= 120.0 && latLngObj.lng <= 122.0
        ? 'TW'
        : 'UNKNOWN'
      : formData.region;
    console.log('計算地區:', newRegion);
    setFormData(prev => ({
      ...prev,
      location: latLngObj ? `${latLngObj.lat},${latLngObj.lng}` : prev.location,
      region: newRegion,
    }));
    setLatLng(latLngObj);
  };

  const handleSetLocation = (fullAddress, simplifiedAddress) => {
    setFormData(prev => ({
      ...prev,
      fullAddress: fullAddress || prev.fullAddress,
      displayLocation: simplifiedAddress || prev.displayLocation,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('提交前 formData:', formData);
    const formDataToSend = new FormData();
    for (let key in formData) formDataToSend.append(key, formData[key]);
    if (frontPhoto) formDataToSend.append('frontPhoto', frontPhoto);
    if (sidePhoto) formDataToSend.append('sidePhoto', sidePhoto);
    otherPhotos.forEach(photo => formDataToSend.append('otherPhotos', photo));
    axios
      .post('http://localhost:3001/api/report-lost', formDataToSend)
      .then(res => alert(`報失成功，ID: ${res.data.lostId}`))
      .catch(err => console.error('提交失敗:', err));
  };

  const handleQuickInput = (text) => {
    setFormData(prev => {
      const newDetails = prev.details ? `${prev.details}, ${text}` : text;
      return {
        ...prev,
        details: newDetails.length > 200 ? newDetails.slice(0, 200) : newDetails,
      };
    });
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setFrontPhoto(null);
    setSidePhoto(null);
    setOtherPhotos([]);
    setLatLng(null);
    setPhotoError('');
    document.querySelectorAll('input[type="file"]').forEach(input => (input.value = ''));
  };

  // 定義地圖 API 和版權信息
  const basemapAPI = 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png';
  const labelAPI = 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/tc/wgs84/{z}/{x}/{y}.png';
  const attributionInfo = '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">© 地圖資料由地政總署提供</a><div style="width:28px;height:28px;display:inline-flex;background:url(https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg);background-size:28px;"></div>';

  return (
    <section className="section">
      <div className="container">
        <div className="custom-form">
          <form onSubmit={handleSubmit}>
            {/* 主人資料 */}
            <div className="form-card">
              <h2 className="title is-4">主人資料</h2>
              <div className="field">
                <label className="label">你的稱呼</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="ownername"
                    value={formData.ownername}
                    placeholder="如何稱呼你"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">聯絡電話</label>
                <div className="control is-flex">
                  <div className="select">
                    <select name="phonePrefix" value={formData.phonePrefix} onChange={handleChange}>
                      <option value="+852">香港 (+852)</option>
                      <option value="+886">台灣 (+886)</option>
                    </select>
                  </div>
                  <input
                    className="input ml-2"
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    placeholder="電話號碼"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">聯絡電郵</label>
                <div className="control">
                  <input
                    className="input"
                    type="email"
                    name="email"
                    value={formData.email}
                    placeholder="電郵地址"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                  />{' '}
                  公開聯繫資料
                </label>
              </div>
            </div>
            <hr />
            {/* 寵物資料 */}
            <div className="form-card">
              <h2 className="title is-4">寵物資料</h2>
              <div className="field">
                <label className="label">寵物名稱</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="name"
                    value={formData.name}
                    placeholder="寵物名稱"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">寵物種類</label>
                <div className="control">
                  <label className="radio mr-4">
                    <input
                      type="radio"
                      name="petType"
                      value="cat"
                      checked={formData.petType === 'cat'}
                      onChange={handleChange}
                    />{' '}
                    貓
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="petType"
                      value="dog"
                      checked={formData.petType === 'dog'}
                      onChange={handleChange}
                    />{' '}
                    狗
                  </label>
                </div>
              </div>
              <div className="field">
                <label className="label">性別</label>
                <div className="control">
                  <label className="radio mr-4">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                    />{' '}
                    公
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                    />{' '}
                    母
                  </label>
                </div>
              </div>
              <div className="field">
                <label className="label">品種</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      disabled={!formData.petType}
                    >
                      <option value="">選擇品種</option>
                      {(formData.petType === 'cat' ? catBreeds : dogBreeds).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label">年齡</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select name="age" value={formData.age} onChange={handleChange}>
                      <option value="">選擇年齡</option>
                      {petage.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label">顏色</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="color"
                    value={formData.color}
                    placeholder="顏色"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">遺失時間</label>
                <div className="control">
                  <input
                    className="input"
                    type="date"
                    name="lost_date"
                    value={formData.lost_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">遺失地點</label>
                <div className="control">
                  <div className="map-container">
                    <MapContainer center={[22.3193, 114.1694]} zoom={12} style={{ height: '300px', width: '100%' }}>
                      <TileLayer
                        url={basemapAPI}
                        attribution={attributionInfo}
                      />
                      <TileLayer
                        url={labelAPI}
                      />
                      <LocationMarker setLatLng={handleMapUpdate} setLocation={handleSetLocation} />
                    </MapContainer>
                  </div>
                  <p className="help">地點: {formData.displayLocation || '未選擇'}</p>
                </div>
              </div>
              <div className="field">
                <label className="label">其他詳情</label>
                <p className="help is-info">
                  建議描述寵物特徵（如毛色、項圈、體型）、走失情況（如具體時間、地點），以提升匹配機會。
                </p>
                <div className="control">
                  <textarea
                    className="textarea"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    placeholder="請輸入寵物嘅描述或發現情況"
                    maxLength={200}
                  />
                  <p className="help">
                    字數: {formData.details.length}/200
                  </p>
                </div>
                <div className="mt-2">
                  <p className="is-size-7">特徵:</p>
                  <div className="buttons">
                    {detailinputs
                      .filter(item => item.category === '特徵')
                      .map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          className="button is-small is-light"
                          onClick={() => handleQuickInput(item.text)}
                        >
                          {item.text}
                        </button>
                      ))}
                  </div>
                  <p className="is-size-7">情況:</p>
                  <div className="buttons">
                    {detailinputs
                      .filter(item => item.category === '情況')
                      .map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          className="button is-small is-light"
                          onClick={() => handleQuickInput(item.text)}
                        >
                          {item.text}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label">晶片編號</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="chipNumber"
                    value={formData.chipNumber}
                    placeholder="晶片編號"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">寵物正面相（1 張）</label>
                <div className="control">
                  <input
                    className="input"
                    type="file"
                    name="frontPhoto"
                    accept="image/*"
                    onChange={handleFrontPhotoChange}
                  />
                  {frontPhoto && <p className="help">已選擇: {frontPhoto.name}</p>}
                </div>
              </div>
              <div className="field">
                <label className="label">寵物側面相（1 張）</label>
                <div className="control">
                  <input
                    className="input"
                    type="file"
                    name="sidePhoto"
                    accept="image/*"
                    onChange={handleSidePhotoChange}
                  />
                  {sidePhoto && <p className="help">已選擇: {sidePhoto.name}</p>}
                </div>
              </div>
              <div className="field">
                <label className="label">其他相片（最多 5 張）</label>
                <div className="control">
                  <input
                    className="input"
                    type="file"
                    name="otherPhotos"
                    multiple
                    accept="image/*"
                    onChange={handleOtherPhotosChange}
                  />
                  {otherPhotos.length > 0 && <p className="help">已選擇: {otherPhotos.length} 張</p>}
                  {photoError && <p className="help is-danger">{photoError}</p>}
                </div>
              </div>
            </div>

            <input type="hidden" name="region" value={formData.region} />
            <input type="hidden" name="location" value={formData.location} />
            <input type="hidden" name="fullAddress" value={formData.fullAddress} />

            <div className="field">
              <div className="control">
                <button className="custom-button mr-2" type="submit">
                  提交
                </button>
                <button
                  className="custom-button is-danger"
                  type="button"
                  onClick={handleReset}
                >
                  重置
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ReportLost;