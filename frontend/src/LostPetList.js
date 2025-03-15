import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bulma/css/bulma.min.css';
import './LostPetList.css'; // 自定義樣式（用於微調）
import axios from 'axios';
import { catBreeds, dogBreeds} from './constants/PetConstants';

function LostPetList() {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRangeStart: '',
    dateRangeEnd: '',
    gender: [],
    petType: [],
    breed: '',
    region: [],
    color: '',
  });

  useEffect(() => {
    setLoading(true);
    axios
      .get('http://localhost:3001/api/lost-pets')
      .then((res) => {
        setPets(res.data);
        setFilteredPets(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('獲取走失寵物失敗:', err);
        setLoading(false);
        setFilteredPets([]); // 失敗時清空列表
      });
  }, []);

  const applyFilters = () => {
    let result = [...pets];

    if (filters.dateRangeStart || filters.dateRangeEnd) {
      result = result.filter((pet) => {
        const lostDate = new Date(pet.lost_date);
        const start = filters.dateRangeStart ? new Date(filters.dateRangeStart) : null;
        const end = filters.dateRangeEnd ? new Date(filters.dateRangeEnd) : null;
        return (!start || lostDate >= start) && (!end || lostDate <= end);
      });
    }

    if (filters.gender.length > 0) {
      result = result.filter((pet) => filters.gender.includes(pet.gender));
    }

    if (filters.petType.length > 0) {
      result = result.filter((pet) => filters.petType.includes(pet.petType));
    }

    if (filters.breed) {
      result = result.filter((pet) => pet.breed === filters.breed);
    }

    if (filters.region.length > 0) {
      result = result.filter((pet) => filters.region.includes(pet.region));
    }

    if (filters.color) {
      result = result.filter((pet) => pet.color.toLowerCase().includes(filters.color.toLowerCase()));
    }

    setFilteredPets(result);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFilters((prev) => {
        const currentValues = prev[name] || [];
        if (checked) {
          return {
            ...prev,
            [name]: [...currentValues, value],
          };
        } else {
          return {
            ...prev,
            [name]: currentValues.filter((item) => item !== value),
          };
        }
      });
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, pets]);

  const handleResetFilters = () => {
    setFilters({
      dateRangeStart: '',
      dateRangeEnd: '',
      gender: [],
      petType: [],
      breed: '',
      region: [],
      color: '',
    });
    setFilteredPets(pets);
  };

  if (loading) return <div className="has-text-centered">加載中...</div>;

  return (
    <section className="section">
      <div className="container">
        <h1 className="title has-text-centered">走失寵物列表</h1>

        {/* 篩選區域 */}
        <div className="box">
          <h2 className="subtitle has-text-centered">篩選條件</h2>
          {/* 第一行 */}
          <div className="columns is-mobile">
            <div className="column is-3">
              <div className="field">
                <label className="label">地區</label>
                <div className="control buttons">
                  <label className={`button is-rounded ${filters.region.includes('HK') ? 'is-primary' : 'is-light'}`}>
                    <input
                      type="checkbox"
                      name="region"
                      value="HK"
                      checked={filters.region.includes('HK')}
                      onChange={handleFilterChange}
                    />
                    香港
                  </label>
                  <label className={`button is-rounded ${filters.region.includes('TW') ? 'is-primary' : 'is-light'}`}>
                    <input
                      type="checkbox"
                      name="region"
                      value="TW"
                      checked={filters.region.includes('TW')}
                      onChange={handleFilterChange}
                    />
                    台灣
                  </label>
                </div>
              </div>
            </div>
            <div className="column is-3">
              <div className="field">
                <label className="label">性別</label>
                <div className="control buttons">
                  <label className={`button is-rounded ${filters.gender.includes('male') ? 'is-primary' : 'is-light'}`}>
                    <input
                      type="checkbox"
                      name="gender"
                      value="male"
                      checked={filters.gender.includes('male')}
                      onChange={handleFilterChange}
                    />
                    公
                  </label>
                  <label className={`button is-rounded ${filters.gender.includes('female') ? 'is-primary' : 'is-light'}`}>
                    <input
                      type="checkbox"
                      name="gender"
                      value="female"
                      checked={filters.gender.includes('female')}
                      onChange={handleFilterChange}
                    />
                    母
                  </label>
                </div>
              </div>
            </div>
            <div className="column is-3">
              <div className="field">
                <label className="label">種類</label>
                <div className="control buttons">
                  <label className={`button is-rounded ${filters.petType.includes('cat') ? 'is-primary' : 'is-light'}`}>
                    <input
                      type="checkbox"
                      name="petType"
                      value="cat"
                      checked={filters.petType.includes('cat')}
                      onChange={handleFilterChange}
                    />
                    貓
                  </label>
                  <label className={`button is-rounded ${filters.petType.includes('dog') ? 'is-primary' : 'is-light'}`}>
                    <input
                      type="checkbox"
                      name="petType"
                      value="dog"
                      checked={filters.petType.includes('dog')}
                      onChange={handleFilterChange}
                    />
                    狗
                  </label>
                </div>
              </div>
            </div>
            <div className="column is-3">
              <div className="field">
                <label className="label">品種</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select name="breed" value={filters.breed} onChange={handleFilterChange} disabled={!filters.petType.length}>
                      <option value="">全部</option>
                      {filters.petType.includes('cat') &&
                        catBreeds.map((breed) => (
                          <option key={breed.value} value={breed.value}>
                            {breed.label}
                          </option>
                        ))}
                      {filters.petType.includes('dog') &&
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
          </div>
          {/* 第二行 */}
          <div className="columns is-mobile">
            <div className="column is-3">
              <div className="field">
                <label className="label">顏色</label>
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
            <div className="column is-6">
              <div className="field">
                <label className="label">遺失時間範圍</label>
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
                  <button className="button is-danger is-rounded is-fullwidth" onClick={handleResetFilters}>
                    重置篩選
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 寵物列表 */}
        <div className="columns is-multiline">
          {filteredPets.length > 0 ? (
            filteredPets.map((pet) => (
              <div key={pet.lostId} className="column is-4">
                <div className="card">
                  <div className="card-image">
                    <figure className="image is-4by3">
                      {pet.frontPhoto ? (
                        <img
                          src={`http://localhost:3001/${pet.frontPhoto.replace(/\\/g, '/')}`}
                          alt={`${pet.name} 正面照`}
                        />
                      ) : (
                        <div className="no-image has-background-light has-text-centered">無照片</div>
                      )}
                    </figure>
                  </div>
                  <div className="card-content">
                    <p className="title is-5">{pet.name}</p>
                    <div className="content">
                      <p>
                        <strong>ID:</strong> {pet.lostId}
                      </p>
                      <p>
                        <strong>種類:</strong> {pet.petType === 'cat' ? '貓' : 'dog' ? '狗' : '未知'}
                      </p>
                      <p>
                        <strong>品種:</strong> {pet.breed || '未知'}
                      </p>
                      <p>
                        <strong>性別:</strong> {pet.gender === 'male' ? '公' : pet.gender === 'female' ? '母' : '未知'}
                      </p>
                      <p>
                        <strong>年齡:</strong> {pet.age || '未知'}
                      </p>
                      <p>
                        <strong>顏色:</strong> {pet.color || '未知'}
                      </p>
                      <p>
                        <strong>遺失日期:</strong> {pet.lost_date}
                      </p>
                      <p>
                        <strong>地區:</strong> {pet.region || '未知'}
                      </p>
                      <p>
                        <strong>地點:</strong> {pet.displayLocation || '未知'}
                      </p>
                      {pet.isPublic === 'true' && (
                        <>
                          <p>
                            <strong>聯絡人:</strong> {pet.ownername}
                          </p>
                          <p>
                            <strong>電話:</strong> {pet.phonePrefix}
                            {pet.phoneNumber}
                          </p>
                          <p>
                            <strong>電郵:</strong> {pet.email}
                          </p>
                        </>
                      )}
                    </div>
                    <Link to={`/pet/${pet.lostId}`} className="button is-primary">
                      查看詳情
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="column">
              <p className="has-text-centered">無符合條件的走失寵物</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default LostPetList;