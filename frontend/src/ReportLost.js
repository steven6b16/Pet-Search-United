import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Reportpage.css';
import { detailinputs } from './constants/QuickInput';
import { catBreeds, dogBreeds, petage } from './constants/PetConstants';
import proj4 from 'proj4';
import { FaCheckCircle, FaTimesCircle, FaLock, FaPhone, FaPaw } from 'react-icons/fa';

// 使用本地圖標（假設圖標文件在 public 目錄下）
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
    const [x, y] = proj4('WGS84', 'HK1980', [lng, lat]);
    return { x: Math.round(x), y: Math.round(y) };
  };

  // 清理地址中的 HTML 標籤
  const cleanAddress = (address) => {
    if (!address) return '';
    return address.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim();
  };

  // 判斷是否為香港範圍
  const isHongKong = (lat, lng) => {
    return lat >= 22.15 && lat <= 22.55 && lng >= 113.85 && lng <= 114.45;
  };

  const fetchHKLocation = async (x, y, reverseFullAddress, reverseSimplifiedAddress, district) => {
    const apiUrl = `https://geodata.gov.hk/gs/api/v1.0.0/identify?x=${x}&y=${y}&lang=zh`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      let fullAddress = reverseFullAddress || '未知';
      let simplifiedAddress = '未知簡化地址';

      if (data?.results?.length > 0) {
        const result = data.results[0];
        const addressInfo = result.addressInfo?.[0];
        if (addressInfo) {
          const caddress = cleanAddress(addressInfo.caddress || '');
          const cname = cleanAddress(addressInfo.cname || '');
          simplifiedAddress = `${district} ${caddress}${cname}`.trim(); // 加入 district
        }
      }else
      {
        simplifiedAddress = reverseSimplifiedAddress;
      }

      setLocation(fullAddress, simplifiedAddress);
      return data;
    } catch (error) {
      console.error('HK API 查詢錯誤：', error);
      setLocation(reverseFullAddress || '未知地址', district || '查詢失敗');
      throw error;
    }
  };

  // 使用 OpenStreetMap Nominatim API 進行逆向地理編碼
  async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=zh-TW`;
    try {
      const response = await axios.get(url);
      const data = response.data;

      if (!data || data.error) {
        throw new Error(data?.error || '無結果');
      }

      const fullAddress = data.display_name || '未知地址';
      const addressDetails = data.address;

      // 根據地區選擇適當的 district
      let district = '';
      if (isHongKong(lat, lng)) {
        // 香港：優先使用 suburb（如 "尖沙咀"）或 city_district（如 "油尖旺區"）addressDetails.suburb || || addressDetails.city 
        console.log(addressDetails.suburb);
        console.log(addressDetails.city);
        console.log(addressDetails.city_district);
        district = addressDetails.city || '';
      } else {
        // 台灣或其他地區：使用 city 或 county（如 "台北市" 或 "台中市"）
        district = addressDetails.city || addressDetails.county || addressDetails.town || addressDetails.suburb || '';
      }

      // 構建更完整的 simplifiedAddress，包含街道和名稱
      const road = addressDetails.road || '';
      const houseNumber = addressDetails.house_number || '';
      const name = addressDetails.amenity || addressDetails.building || '';
      const simplifiedAddress = `${district} ${road}${houseNumber}${name}`.trim() || '未知地區';

      console.log('提取的地址：', { fullAddress, simplifiedAddress, district });
      return { fullAddress, simplifiedAddress, district };
    } catch (error) {
      console.error('OpenStreetMap 逆向地理編碼失敗：', error.message);
      return { fullAddress: '未知地址', simplifiedAddress: '未知地點', district: '' };
    }
  }

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setLatLng({ lat, lng });

      const hkCoords = convertToHK1980Grid(lat, lng);
      console.log('轉換後坐標：', hkCoords);

      reverseGeocode(lat, lng)
        .then(({ fullAddress: reverseFullAddress, simplifiedAddress: reverseSimplifiedAddress, district }) => {
          if (!isHongKong(lat, lng) || hkCoords.x < 800000 || hkCoords.x > 860000 || hkCoords.y < 800000 || hkCoords.y > 850000) {
            console.log('坐標超出香港範圍或非香港地區：', hkCoords);
            setLocation(reverseFullAddress, reverseSimplifiedAddress); // 使用 Nominatim 結果
          } else {
            fetchHKLocation(hkCoords.x, hkCoords.y, reverseFullAddress, reverseSimplifiedAddress, district)
              .then(data => console.log('HK API 結果：', data))
              .catch(err => console.error('地點查詢錯誤：', err));
          }
        })
        .catch(err => {
          console.error('地理編碼錯誤：', err);
          setLocation('未知地址', '未知地點');
        });
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
    lostDate: '',
    lostTime: '',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
   const [geoError, setGeoError] = useState('');

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      options.push(`${hour.toString().padStart(2, '0')}:00`);
      options.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return options;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'details' && value.length > 200) return;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    validateField(name, type === 'checkbox' ? checked : value);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === 'name' && !value) {
      newErrors.name = '請填寫寵物名稱';
    } else if (name === 'ownername' && !value) {
      newErrors.ownername = '請填寫你的稱呼';
    } else if (name === 'phoneNumber' && !value) {
      newErrors.phoneNumber = '請填寫聯絡電話';
    } else if (name === 'email' && !value) {
      newErrors.email = '請填寫聯絡電郵';
    } else if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      newErrors.email = '請輸入有效的電郵地址';
    } else if (name === 'petType' && !value) {
      newErrors.petType = '請選擇寵物種類';
    } else if (name === 'gender' && !value) {
      newErrors.gender = '請選擇性別';
    } else if (name === 'color' && !value) {
      newErrors.color = '請填寫顏色';
    } else if (name === 'lostDate' && !value) {
      newErrors.lostDate = '請選擇遺失日期';
    } else if (name === 'lostTime' && !value) {
      newErrors.lostTime = '請選擇遺失時間';
    } else if (name === 'location' && !value) {
      newErrors.location = '請選擇遺失地點';
    } else {
      delete newErrors[name];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const fieldsToValidate = [
      'name', 'ownername', 'phoneNumber', 'email', 'petType', 'gender', 'color', 'lostDate', 'lostTime', 'location'
    ];
    let isValid = true;
    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    return isValid;
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
      found_location: latLngObj ? `${latLngObj.lat},${latLngObj.lng}` : prev.found_location,
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
    setGeoError('');
  };

  const handleAutoLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLngObj = { lat: latitude, lng: longitude };
          handleMapUpdate(latLngObj);
          reverseGeocode(latitude, longitude).then(({ fullAddress, simplifiedAddress }) => {
            handleSetLocation(fullAddress, simplifiedAddress);
          });
        },
        (error) => {
          console.error('自動定位失敗：', error);
          alert('無法獲取當前位置，請手動選擇地點。');
        }
      );
    } else {
      alert('你的瀏覽器不支持自動定位，請手動選擇地點。');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('請填寫所有必填字段！');
      return;
    }

    // 提交前確認
    const confirmSubmit = window.confirm(
      `請確認以下信息：\n寵物名稱：${formData.name}\n聯繫電話：${formData.phonePrefix} ${formData.phoneNumber}\n遺失地點：${formData.displayLocation}\n確定提交？`
    );
    if (!confirmSubmit) return;

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    const lostDateTime = `${formData.lostDate} ${formData.lostTime}`;
    for (let key in formData) {
      if (key === 'isPublic') {
        formDataToSend.append(key, formData[key] ? 1 : 0);
      } else if (key === 'lostDate' || key === 'lostTime') {
        // 不單獨傳 lostDate 或 lostTime
      } else {
        formDataToSend.append(key, formData[key]);
      }
    }
    formDataToSend.append('lost_date', lostDateTime);
    if (frontPhoto) formDataToSend.append('frontPhoto', frontPhoto);
    if (sidePhoto) formDataToSend.append('sidePhoto', sidePhoto);
    otherPhotos.forEach(photo => formDataToSend.append('otherPhotos', photo));

    try {
      const res = await axios.post('http://localhost:3001/api/report-lost', formDataToSend);
      alert(`報失成功，ID: ${res.data.lostId}`);
      handleReset();
    } catch (err) {
      console.error('提交失敗:', err);
      alert('提交失敗，請稍後再試！');
    } finally {
      setIsSubmitting(false);
    }
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
    setGeoError('');
    setPhotoError('');
    setErrors({});
    document.querySelectorAll('input[type="file"]').forEach(input => (input.value = ''));
  };

  return (
    <section className="section custom-section">
        <div className="custom-form">
          {/* 表單標題與認證徽章 */}
          <div className="header-section has-text-centered mb-6">
            <img src="/logo.png" alt="Pet Lost Registry Logo" className="logo mb-4" />
            <h1 className="title is-2 custom-title">
              寵物走失緊急報失
            </h1>
            <p className="subtitle is-5 has-text-grey">
              由香港寵物協會認證，您的信息安全有保障
            </p>
            <div className="certification-badge mt-3">
              <FaPaw className="mr-2" /> 官方認證
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 基本資料 */}
            <div className="form-card mb-5">
              <h2 className="subtitle is-4 mb-4">
                <FaPhone className="mr-2" /> 基本資料
              </h2>
              <p className="help is-info mb-4">
                請提供你的聯繫方式，以便我們及時聯繫你。
              </p>
              <div className="columns is-multiline">
                <div className="column is-6">
                  <div className="field">
                    <label className="label">
                      寵物名稱 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control has-icons-right">
                      <input
                        className={`input is-fullwidth custom-input ${errors.name ? 'is-danger' : formData.name ? 'is-success' : ''}`}
                        type="text"
                        name="name"
                        value={formData.name}
                        placeholder="寵物名稱"
                        onChange={handleChange}
                        required
                      />
                      {errors.name ? (
                        <span className="icon is-small is-right">
                          <FaTimesCircle className="has-text-danger" />
                        </span>
                      ) : formData.name ? (
                        <span className="icon is-small is-right">
                          <FaCheckCircle className="has-text-success" />
                        </span>
                      ) : null}
                      {errors.name && <p className="help is-danger">{errors.name}</p>}
                    </div>
                  </div>
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label className="label">
                      你的稱呼 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control has-icons-right">
                      <input
                        className={`input is-fullwidth custom-input ${errors.ownername ? 'is-danger' : formData.ownername ? 'is-success' : ''}`}
                        type="text"
                        name="ownername"
                        value={formData.ownername}
                        placeholder="如何稱呼你"
                        onChange={handleChange}
                        required
                      />
                      {errors.ownername ? (
                        <span className="icon is-small is-right">
                          <FaTimesCircle className="has-text-danger" />
                        </span>
                      ) : formData.ownername ? (
                        <span className="icon is-small is-right">
                          <FaCheckCircle className="has-text-success" />
                        </span>
                      ) : null}
                      {errors.ownername && <p className="help is-danger">{errors.ownername}</p>}
                    </div>
                  </div>
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label className="label">
                      聯絡電話 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control">
                      <div className="columns is-mobile">
                        <div className="column is-narrow">
                          <div className="select is-fullwidth custom-select">
                            <select name="phonePrefix" value={formData.phonePrefix} onChange={handleChange}>
                              <option value="+852">香港 (+852)</option>
                              <option value="+886">台灣 (+886)</option>
                            </select>
                          </div>
                        </div>
                        <div className="column">
                          <div className="control has-icons-right">
                            <input
                              className={`input is-fullwidth custom-input ${errors.phoneNumber ? 'is-danger' : formData.phoneNumber ? 'is-success' : ''}`}
                              type="tel"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              placeholder="電話號碼"
                              onChange={handleChange}
                              required
                            />
                            {errors.phoneNumber ? (
                              <span className="icon is-small is-right">
                                <FaTimesCircle className="has-text-danger" />
                              </span>
                            ) : formData.phoneNumber ? (
                              <span className="icon is-small is-right">
                                <FaCheckCircle className="has-text-success" />
                              </span>
                            ) : null}
                            {errors.phoneNumber && <p className="help is-danger">{errors.phoneNumber}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label className="label">
                      聯絡電郵 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control has-icons-right">
                      <input
                        className={`input is-fullwidth custom-input ${errors.email ? 'is-danger' : formData.email ? 'is-success' : ''}`}
                        type="email"
                        name="email"
                        value={formData.email}
                        placeholder="電郵地址"
                        onChange={handleChange}
                        required
                      />
                      {errors.email ? (
                        <span className="icon is-small is-right">
                          <FaTimesCircle className="has-text-danger" />
                        </span>
                      ) : formData.email && /\S+@\S+\.\S+/.test(formData.email) ? (
                        <span className="icon is-small is-right">
                          <FaCheckCircle className="has-text-success" />
                        </span>
                      ) : null}
                      {errors.email && <p className="help is-danger">{errors.email}</p>}
                    </div>
                  </div>
                </div>
                <div className="column is-12">
                  <div className="field">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        name="isPublic"
                        checked={formData.isPublic}
                        onChange={handleChange}
                      />
                      <span className="ml-2">公開聯繫資料</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 外觀特徵 */}
            <div className="form-card mb-5">
              <h2 className="subtitle is-4 mb-4">
                <FaPaw className="mr-2" /> 外觀特徵
              </h2>
              <p className="help is-info mb-4">
                提供詳細的寵物特徵，幫助我們更快找到你的寵物。
              </p>
              <div className="columns is-multiline">
                <div className="column is-12">
                  <div className="field">
                    <label className="label">
                      寵物種類 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control is-flex">
                      <label className="icon-circle mr-4">
                        <input
                          type="radio"
                          name="petType"
                          value="cat"
                          checked={formData.petType === 'cat'}
                          onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                        <img src="/icon/cat.png" alt="Cat" />
                      </label>
                      <label className="icon-circle">
                        <input
                          type="radio"
                          name="petType"
                          value="dog"
                          checked={formData.petType === 'dog'}
                          onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                        <img src="/icon/dog.png" alt="Dog" />
                      </label>
                    </div>
                    {errors.petType && <p className="help is-danger">{errors.petType}</p>}
                  </div>
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label className="label">
                      性別 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control is-flex">
                      <label className="icon-circle mr-4">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                        <img src="/icon/female.png" alt="Female" />
                      </label>
                      <label className="icon-circle">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                        <img src="/icon/male.png" alt="Male" />
                      </label>
                    </div>
                    {errors.gender && <p className="help is-danger">{errors.gender}</p>}
                  </div>
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label className="label">品種</label>
                    <div className="control">
                      <div className="select is-fullwidth custom-select">
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
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label className="label">年齡</label>
                    <div className="control">
                      <div className="select is-fullwidth custom-select">
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
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label className="label">
                      顏色 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control has-icons-right">
                      <input
                        className={`input is-fullwidth custom-input ${errors.color ? 'is-danger' : formData.color ? 'is-success' : ''}`}
                        type="text"
                        name="color"
                        value={formData.color}
                        placeholder="顏色"
                        onChange={handleChange}
                        required
                      />
                      {errors.color ? (
                        <span className="icon is-small is-right">
                          <FaTimesCircle className="has-text-danger" />
                        </span>
                      ) : formData.color ? (
                        <span className="icon is-small is-right">
                          <FaCheckCircle className="has-text-success" />
                        </span>
                      ) : null}
                      {errors.color && <p className="help is-danger">{errors.color}</p>}
                    </div>
                  </div>
                </div>
                <div className="column is-12">
                  <div className="field">
                    <label className="label">晶片編號</label>
                    <div className="control">
                      <input
                        className="input is-fullwidth custom-input"
                        type="text"
                        name="chipNumber"
                        value={formData.chipNumber}
                        placeholder="晶片編號（可選）"
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 走失詳情 */}
            <div className="form-card mb-5">
              <h2 className="subtitle is-4 mb-4">
                <FaPaw className="mr-2" /> 走失詳情
              </h2>
              <p className="help is-info mb-4">
                提供走失的詳細信息，幫助我們更快找到你的寵物。
              </p>
              <div className="columns is-multiline">
                <div className="column is-6">
                  <div className="field">
                    <label className="label">
                      遺失時間 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control">
                      <div className="columns is-mobile">
                        <div className="column">
                          <input
                            className={`input is-fullwidth custom-input ${errors.lostDate ? 'is-danger' : formData.lostDate ? 'is-success' : ''}`}
                            type="date"
                            name="lostDate"
                            value={formData.lostDate}
                            onChange={handleChange}
                            required
                          />
                          {errors.lostDate && <p className="help is-danger">{errors.lostDate}</p>}
                        </div>
                        <div className="column is-narrow">
                          <div className="select is-fullwidth custom-select">
                            <select
                              name="lostTime"
                              value={formData.lostTime}
                              onChange={handleChange}
                              required
                            >
                              <option value="">選擇時間</option>
                              {generateTimeOptions().map((time) => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                          {errors.lostTime && <p className="help is-danger">{errors.lostTime}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="column is-12">
                  <div className="field">
                    <label className="label">
                      遺失地點 <span className="has-text-danger">*</span>
                    </label>
                    <div className="control">
                      <button
                        type="button"
                        className="button is-light custom-auto-locate mb-3"
                        onClick={handleAutoLocate}
                      >
                        自動定位
                      </button>
                      <div className="map-container">
                        <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '500px', width: '100%' }}>
                           <TileLayer
                             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                             attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                           />
                           <LocationMarker setLatLng={handleMapUpdate} setLocation={handleSetLocation} />
                         </MapContainer>
                      </div>
                      <p className="help mt-2">地點: {formData.displayLocation || '未選擇'}</p>
                      {errors.location && <p className="help is-danger">{errors.location}</p>}
                    </div>
                  </div>
                </div>
                <div className="column is-12">
                  <div className="field">
                    <label className="label">其他詳情</label>
                    <p className="help is-info mb-3">
                      建議描述寵物特徵（如毛色、項圈、體型）、走失情況（如具體時間、地點），以提升匹配機會。
                    </p>
                    <div className="control">
                      <textarea
                        className="textarea is-fullwidth custom-textarea"
                        name="details"
                        value={formData.details}
                        onChange={handleChange}
                        placeholder="請輸入寵物的描述或走失情況"
                        maxLength={200}
                      />
                      <p className="help mt-2">
                        字數: {formData.details.length}/200
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="is-size-6 mb-2 has-text-weight-medium">特徵</p>
                      <div className="buttons">
                        {detailinputs
                          .filter(item => item.category === '特徵')
                          .map((item, index) => (
                            <button
                              key={index}
                              type="button"
                              className="button is-small custom-quick-button mr-2 mb-2"
                              onClick={() => handleQuickInput(item.text)}
                            >
                              {item.text}
                            </button>
                          ))}
                      </div>
                      <p className="is-size-6 mb-2 mt-3 has-text-weight-medium">情況</p>
                      <div className="buttons">
                        {detailinputs
                          .filter(item => item.category === '情況')
                          .map((item, index) => (
                            <button
                              key={index}
                              type="button"
                              className="button is-small custom-quick-button mr-2 mb-2"
                              onClick={() => handleQuickInput(item.text)}
                            >
                              {item.text}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 相片上傳 */}
            <div className="form-card mb-5">
              <h2 className="subtitle is-4 mb-4">
                <FaPaw className="mr-2" /> 上傳相片
              </h2>
              <p className="help is-info mb-4">
                上傳寵物相片，幫助我們更準確地識別你的寵物。
              </p>
              <div className="columns is-multiline">
                <div className="column is-12">
                  <div className="field">
                    <label className="label">寵物正面相（1 張，建議上傳）</label>
                    <div className="control">
                      <div className="file has-name is-fullwidth custom-file-upload">
                        <label className="file-label">
                          <input
                            className="file-input"
                            type="file"
                            name="frontPhoto"
                            accept="image/*"
                            onChange={handleFrontPhotoChange}
                          />
                          <span className="file-cta">
                            <span className="file-label">選擇檔案</span>
                          </span>
                          <span className="file-name">
                            {frontPhoto ? frontPhoto.name : '未選擇檔案'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="column is-12">
                  <div className="field">
                    <label className="label">寵物側面相（1 張，建議上傳）</label>
                    <div className="control">
                      <div className="file has-name is-fullwidth custom-file-upload">
                        <label className="file-label">
                          <input
                            className="file-input"
                            type="file"
                            name="sidePhoto"
                            accept="image/*"
                            onChange={handleSidePhotoChange}
                          />
                          <span className="file-cta">
                            <span className="file-label">選擇檔案</span>
                          </span>
                          <span className="file-name">
                            {sidePhoto ? sidePhoto.name : '未選擇檔案'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="column is-12">
                  <div className="field">
                    <label className="label">其他相片（最多 5 張，可選）</label>
                    <div className="control">
                      <div className="file has-name is-fullwidth custom-file-upload">
                        <label className="file-label">
                          <input
                            className="file-input"
                            type="file"
                            name="otherPhotos"
                            multiple
                            accept="image/*"
                            onChange={handleOtherPhotosChange}
                          />
                          <span className="file-cta">
                            <span className="file-label">選擇檔案</span>
                          </span>
                          <span className="file-name">
                            {otherPhotos.length > 0 ? `${otherPhotos.length} 張已選擇` : '未選擇檔案'}
                          </span>
                        </label>
                      </div>
                      {photoError && <p className="help is-danger mt-2">{photoError}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <input type="hidden" name="region" value={formData.region} />
            <input type="hidden" name="location" value={formData.location} />
            <input type="hidden" name="fullAddress" value={formData.fullAddress} />

            {/* 隱私聲明 */}
            <div className="privacy-notice has-text-centered mb-5">
              <p className="is-size-6">
                <FaLock className="mr-2" /> 我們重視你的隱私，所有信息將受到嚴格保護。
              </p>
            </div>

            {/* 固定底部欄 */}
            <div className="custom-footer">
              <div className="buttons is-centered">
                <button
                  className="button is-light custom-back-button"
                  type="button"
                  onClick={handleReset}
                >
                  重置
                </button>
                <button
                  className="custom-button button is-primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="is-flex is-align-items-center">
                      <span className="loader mr-2"></span> 提交中...
                    </span>
                  ) : (
                    <span className="is-flex is-align-items-center">
                      提交報失 <FaLock className="ml-2" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
    </section>
  );
}

export default ReportLost;