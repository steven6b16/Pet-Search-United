import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'bulma/css/bulma.min.css';
import './LostPetList.css';
import { catBreeds, dogBreeds, hongKongDistricts } from './constants/PetConstants';

/*
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
*/

function FoundPetList() {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRangeStart: '',
    dateRangeEnd: '',
    gender: '',
    petType: '',
    breed: '',
    district: '',
    color: '',
  });

  useEffect(() => {
    setLoading(true);
    axios
      .get('http://localhost:3001/api/found-pets')
      .then((res) => {
        setPets(res.data); // 保留原始數據
        const groupedData = groupFoundPets(res.data);
        setFilteredPets(groupedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('獲取發現寵物失敗:', err);
        setLoading(false);
        setFilteredPets([]);
      });
  }, []);

  const applyFilters = () => {
    let result = [...pets];
  
    // 篩選邏輯（略，保持現有）
    if (filters.dateRangeStart || filters.dateRangeEnd) {
      result = result.filter((pet) => {
        const foundDate = new Date(pet.found_date);
        const start = filters.dateRangeStart ? new Date(filters.dateRangeStart) : null;
        const end = filters.dateRangeEnd ? new Date(filters.dateRangeEnd) : null;
        return (!start || foundDate >= start) && (!end || foundDate <= end);
      });
    }

    if (filters.gender) {
      result = result.filter((pet) => pet.gender === filters.gender);
    }

    if (filters.petType) {
      result = result.filter((pet) => pet.petType === filters.petType);
    }

    if (filters.breed) {
      result = result.filter((pet) => pet.breed === filters.breed);
    }

    if (filters.district) {
      result = result.filter((pet) => {
        const displayLocation = pet.displayLocation || '';
        const districtLabel = hongKongDistricts.find((d) => d.value === filters.district)?.label || '';
        return displayLocation.includes(districtLabel);
      });
    }

    if (filters.color) {
      result = result.filter((pet) => pet.color.toLowerCase().includes(filters.color.toLowerCase()));
    }

    setFilteredPets(groupFoundPets(result));
};

  const groupFoundPets = (pets) => {
    const grouped = {};
    const single = [];
  
    pets.forEach((pet) => {
      if (pet.groupId) {
        if (!grouped[pet.groupId]) {
          grouped[pet.groupId] = { pets: [], representative: pet };
        }
        grouped[pet.groupId].pets.push(pet);
        // 更新代表記錄為最新嘅 found_date
        if (new Date(pet.found_date) > new Date(grouped[pet.groupId].representative.found_date)) {
          grouped[pet.groupId].representative = pet;
        }
      } else {
        single.push(pet);
      }
    });
  
    // 將分組記錄轉為含代表性案例嘅數據
    return [
      ...Object.values(grouped).map((group) => ({
        type: 'grouped',
        groupId: group.representative.groupId,
        representative: group.representative,
        count: group.pets.length,
      })),
      ...single.map((pet) => ({ type: 'single', ...pet })),
    ];
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    applyFilters();
  }, [filters, pets]);

  const handleResetFilters = () => {
    setFilters({
      dateRangeStart: '',
      dateRangeEnd: '',
      gender: '',
      petType: '',
      breed: '',
      district: '',
      color: '',
    });
    setFilteredPets(pets);
  };

  // 輔助函數：根據 petType 和 breed value 查找 label
  const getBreedLabel = (petType, breed) => {
    if (petType === 'cat') {
      return catBreeds.find(b => b.value === breed)?.label || '未知';
    } else if (petType === 'dog') {
      return dogBreeds.find(b => b.value === breed)?.label || '未知';
    }
    return '未知';
  };

  // 格式化品種顯示：中文 <br/><small>英文</small>
  const getBreedLabelcn = (petType, breed) => {
    const breedList = petType === 'cat' ? catBreeds : dogBreeds;
    const foundBreed = breedList.find(item => item.value === breed);
    return foundBreed ? foundBreed.label : '未知品種';
  };

  // 定義地圖 API 和版權信息
  const basemapAPI = 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png';
  const labelAPI = 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/tc/wgs84/{z}/{x}/{y}.png';
  const attributionInfo = '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">© 地圖資料由地政總署提供</a><div style="width:28px;height:28px;display:inline-flex;background:url(https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg);background-size:28px;"></div>';

  if (loading) return <div className="has-text-centered">加載中...</div>;

  return (
    <section className="section lost-pet-list">
      <div className="container">
        {/* 導航按鈕組 */}
        <div className="buttons is-centered mb-6">
          <a className="button is-primary is-medium" href="/found-pet-list" data-discover="true">
            同搜報料
          </a>
          <a className="button is-info is-medium" href="/lost-pet-list" data-discover="true">
            報失列表
          </a>
          <a className="button is-success is-medium" href="/report-lost" data-discover="true">
            主人報失
          </a>
          <a className="button is-warning is-medium" href="/report-found" data-discover="true">
            我要報料
          </a>
        </div>
        <h1 className="title has-text-centered">發現寵物列表</h1>
        {/* 篩選區域 */}
        <div className="box">
          <div className="columns is-mobile">
            <div className="column is-3">
              <div className="field">
                <label className="label">性別</label>
                <div className="control buttons choice-btns">
                  <button
                    className={`button is-rounded ${filters.gender === 'male' ? 'is-primary' : 'is-light'}`}
                    onClick={() => setFilters((prev) => ({ ...prev, gender: 'male' }))}
                  >
                    公
                  </button>
                  <button
                    className={`button is-rounded ${filters.gender === 'female' ? 'is-primary' : 'is-light'}`}
                    onClick={() => setFilters((prev) => ({ ...prev, gender: 'female' }))}
                  >
                    母
                  </button>
                </div>
              </div>
            </div>
            <div className="column is-3">
              <div className="field">
                <label className="label">種類</label>
                <div className="control buttons choice-btns">
                  <button
                    className={`button is-rounded ${filters.petType === 'cat' ? 'is-primary' : 'is-light'}`}
                    onClick={() => setFilters((prev) => ({ ...prev, petType: 'cat' }))}
                  >
                    貓
                  </button>
                  <button
                    className={`button is-rounded ${filters.petType === 'dog' ? 'is-primary' : 'is-light'}`}
                    onClick={() => setFilters((prev) => ({ ...prev, petType: 'dog' }))}
                  >
                    狗
                  </button>
                </div>
              </div>
            </div>
            <div className="column is-3">
              <div className="field">
                <label className="label">品種</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      name="breed"
                      value={filters.breed}
                      onChange={handleFilterChange}
                      disabled={!filters.petType}
                    >
                      <option value="">全部</option>
                      {filters.petType === 'cat' &&
                        catBreeds.map((breed) => (
                          <option key={breed.value} value={breed.value}>
                            {breed.label}
                          </option>
                        ))}
                      {filters.petType === 'dog' &&
                        dogBreeds.map((breed) => (
                          <option key={breed.value} value={breed.value}>
                            {breed.label}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="column is-3">
              <div className="field">
                <label className="label">顏色 / 毛色</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="color"
                    value={filters.color}
                    onChange={handleFilterChange}
                    placeholder="輸入顏色"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="columns is-mobile">
            <div className="column is-3">
              <div className="field">
                <label className="label">地區</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select name="district" value={filters.district} onChange={handleFilterChange}>
                      {hongKongDistricts.map((district) => (
                        <option key={district.value} value={district.value}>
                          {district.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="column is-6">
              <div className="field">
                <label className="label">發現時間範圍</label>
                <div className="control">
                  <div className="is-flex is-align-items-center">
                    <input
                      className="input"
                      type="date"
                      name="dateRangeStart"
                      value={filters.dateRangeStart}
                      onChange={handleFilterChange}
                    />
                    <span className="mx-2">至</span>
                    <input
                      className="input"
                      type="date"
                      name="dateRangeEnd"
                      value={filters.dateRangeEnd}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="column is-3 is-flex is-align-items-end">
              <div className="field is-fullwidth">
                <div className="control">
                  <button
                    className="button is-danger is-rounded is-fullwidth"
                    onClick={handleResetFilters}
                  >
                    重置篩選
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaflet 地圖 */}
        <div className="box">
        <MapContainer center={[22.4037,114.1304]} zoom={11} style={{ height: '500px', width: '100%' }}>
            {/* 基底圖層 */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* 標籤圖層（中文） */}
            <TileLayer
              url={labelAPI}
            />
            {filteredPets
              .filter((pet) => pet.found_location)
              .map((pet) => {
                const [lat, lng] = pet.found_location.split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                  return (
                    <Marker key={pet.foundId} position={[lat, lng]}>
                      <Popup>
                        <strong>{pet.reportername || '匿名'}</strong>
                        <br />
                        種類/性別:{' '}
                        {pet.petType === 'cat' ? '貓' : pet.petType === 'dog' ? '狗' : '未知'} /{' '}
                        {pet.gender === 'male' ? '公' : pet.gender === 'female' ? '母' : '未知'}
                        <br />
                        品種: {getBreedLabel(pet.petType, pet.breed)} {/* 顯示 label */}
                        <br />
                        發現日期: {pet.found_date}
                        <br />
                        發現地點: {pet.displayLocation || '未知'}
                        <br />
                        <br />
                        <Link to={`/pet/${pet.foundId}`}>查看詳情</Link>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
          </MapContainer>
        </div>

        {/* Grid 模式顯示 */}
        <div className="columns is-multiline">
        {filteredPets.length > 0 ? (
          filteredPets.map((item) => (
            <div key={item.type === 'grouped' ? item.groupId : item.foundId} className="column is-4">
              <div className={`${item.type === 'grouped' ? 'grouped-card' : ''}`}>
              <div className="card">
                <div className="card-image">
                  <figure className="image is-4by3">
                    {item.type === 'grouped' ? (
                      item.representative.photos ? (
                        <img
                          src={`http://localhost:3001/${item.representative.photos.split(',')[0].replace(/\\/g, '/')}`}
                          alt="代表性照片"
                        />
                      ) : (
                        <div className="no-image has-background-light has-text-centered">無照片</div>
                      )
                    ) : (
                      item.photos ? (
                        <img
                          src={`http://localhost:3001/${item.photos.split(',')[0].replace(/\\/g, '/')}`}
                          alt="發現寵物照片"
                        />
                      ) : (
                        <div className="no-image has-background-light has-text-centered">無照片</div>
                      )
                    )}
                  </figure>
                </div>
                <div className="card-content">
                  {item.type === 'grouped' && (
                    <span className="grouped-tag tag is-info is-light">發現 <b>{item.count}</b> 次</span>
                  )}
                  <p className="title is-5">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: getBreedLabelcn(
                          item.type === 'grouped' ? item.representative.petType : item.petType,
                          item.type === 'grouped' ? item.representative.breed : item.breed
                        ),
                      }}
                    />
                  </p>
                  <div className="content">
                    <p>
                      <strong className="tag is-primary is-light">種類 / 性別:</strong>{' '}
                      {(item.type === 'grouped' ? item.representative.petType : item.petType) === 'cat'
                        ? '貓'
                        : (item.type === 'grouped' ? item.representative.petType : item.petType) === 'dog'
                        ? '狗'
                        : '未知'}{' '}
                      /{' '}
                      {(item.type === 'grouped' ? item.representative.gender : item.gender) === 'male'
                        ? '公'
                        : (item.type === 'grouped' ? item.representative.gender : item.gender) === 'female'
                        ? '母'
                        : '未知'}
                    </p>
                    <p>
                      <strong className="tag is-primary is-light">發現日期:</strong>{' '}
                      {item.type === 'grouped' ? item.representative.found_date : item.found_date}
                    </p>
                    <p>
                      <strong className="tag is-primary is-light">發現地點:</strong>{' '}
                      {item.type === 'grouped' ? item.representative.displayLocation : item.displayLocation || '未知'}
                    </p>
                  </div>
                  <Link
                    to={`/pet/${item.type === 'grouped' ? item.representative.foundId : item.foundId}`}
                    className="button is-primary"
                  >
                    查看詳情
                  </Link>
                </div>
              </div>
              </div>
            </div>
          ))
        ) : (
          <div className="column">
            <p className="has-text-centered">無符合條件的發現寵物</p>
          </div>
        )}
      </div>
      </div>
    </section>
  );
}

export default FoundPetList;