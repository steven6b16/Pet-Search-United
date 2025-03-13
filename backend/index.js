const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const db = new sqlite3.Database('./lost_pets.db', (err) => {
  if (err) {
    console.error('數據庫連接失敗:', err);
    process.exit(1);
  }
  console.log('數據庫連接成功');
});

db.serialize(() => {
  console.log('CREATE TABLE IF NOT EXISTS lost_pets');
  db.run(`
    CREATE TABLE IF NOT EXISTS lost_pets (
      lostId TEXT PRIMARY KEY,
      userId INTEGER DEFAULT 0,
      ownername TEXT,
      phonePrefix TEXT,
      phoneNumber INTEGER DEFAULT 0,
      email TEXT,
      name TEXT,
      breed TEXT,
      petType TEXT,
      gender TEXT,
      age TEXT,
      color TEXT,
      lost_date TEXT,
      location TEXT,
      details TEXT,
      chipNumber TEXT,
      frontPhoto TEXT,          -- 新增正面相字段
      sidePhoto TEXT,           -- 新增側面相字段
      otherPhotos TEXT,         -- 新增其他相片字段
      fullAddress TEXT,
      displayLocation TEXT,
      region TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      isPublic BOOLEAN DEFAULT 0,
      isFound BOOLEAN DEFAULT 0,
      isDeleted BOOLEAN DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(userId)
    )
  `);

  // 檢查並添加新字段（如果表已存在）
  db.all("PRAGMA table_info(lost_pets)", (err, rows) => {
    if (err) console.error('檢查 lost_pets 表結構失敗:', err);
    else {
      const fieldsToAdd = [
        { name: 'frontPhoto', sql: 'ALTER TABLE lost_pets ADD COLUMN frontPhoto TEXT' },
        { name: 'sidePhoto', sql: 'ALTER TABLE lost_pets ADD COLUMN sidePhoto TEXT' },
        { name: 'otherPhotos', sql: 'ALTER TABLE lost_pets ADD COLUMN otherPhotos TEXT' },
        { name: 'isPublic', sql: 'ALTER TABLE lost_pets ADD COLUMN isPublic BOOLEAN DEFAULT 0' },
      ];
      fieldsToAdd.forEach(field => {
        const exists = rows.some(row => row.name === field.name);
        if (!exists) {
          db.run(field.sql);
          console.log(`為 lost_pets 添加 ${field.name} 欄位`);
        } else {
          console.log(`lost_pets 已有 ${field.name} 欄位，跳過`);
        }
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS found_pets (
      foundId TEXT PRIMARY KEY,
      name TEXT,
      phoneNumber TEXT,
      email TEXT,
      found_date TEXT,
      found_location TEXT,
      found_details TEXT,
      photos TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.all("PRAGMA table_info(found_pets)", (err, rows) => {
    if (err) console.error('檢查 found_pets 表結構失敗:', err);
    else {
      const hasIsPublic = rows.some(row => row.name === 'isPublic');
      if (!hasIsPublic) {
        db.run(`ALTER TABLE found_pets ADD COLUMN isPublic BOOLEAN DEFAULT 0`);
        console.log('為 found_pets 添加 isPublic 欄位');
      } else {
        console.log('found_pets 已有 isPublic 欄位，跳過');
      }
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phoneNumber TEXT,
      email TEXT,
      isPublic BOOLEAN DEFAULT 0
    )
  `);
});

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// 配置 multer 上傳字段（最多 7 張：1 正面 + 1 側面 + 5 其他）
const uploadFields = upload.fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'sidePhoto', maxCount: 1 },
  { name: 'otherPhotos', maxCount: 5 },
]);

function generateId(type, region) {
  return new Promise((resolve, reject) => {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    console.log(`生成 ${type} ID，region: ${region}`);
    db.get(`SELECT COUNT(*) as count FROM ${type}_pets WHERE ${type}Id LIKE ?`, [`${region}-${type}${yearMonth}%`], (err, row) => {
      if (err) {
        console.error('生成 ID 失敗:', err);
        return reject(err);
      }
      const caseNum = (row.count + 1).toString().padStart(2, '0');
      const id = `${region}-${type}${yearMonth}${caseNum}`;
      console.log(`生成的 ${type}Id: ${id}`);
      resolve(id);
    });
  });
}

app.post('/api/report-lost', uploadFields, async (req, res) => {
  console.log('接收到的 req.body:', req.body);
  console.log('接收到的 req.files:', req.files);
  try {
    const {
      userId, ownername, phonePrefix, phoneNumber, email, name, breed, petType,
      gender, age, color, lost_date, location, details, chipNumber, fullAddress,
      displayLocation, region = 'HK', isPublic, isFound, isDeleted
    } = req.body;

    // 處理照片
    const frontPhoto = req.files['frontPhoto'] ? req.files['frontPhoto'][0].path : null;
    const sidePhoto = req.files['sidePhoto'] ? req.files['sidePhoto'][0].path : null;
    const otherPhotos = req.files['otherPhotos'] ? req.files['otherPhotos'].map(file => file.path).join(',') : null;

    const lostId = await generateId('lost', region);

    const stmt = db.prepare(`
      INSERT INTO lost_pets (
        lostId, userId, ownername, phonePrefix, phoneNumber, email, name, breed, petType,
        gender, age, color, lost_date, location, details, chipNumber, frontPhoto, sidePhoto,
        otherPhotos, fullAddress, displayLocation, region, isPublic, isFound, isDeleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      lostId, userId, ownername, phonePrefix, phoneNumber, email, name, breed, petType,
      gender, age, color, lost_date, location, details, chipNumber, frontPhoto, sidePhoto,
      otherPhotos, fullAddress, displayLocation, region, isPublic ? 1 : 0, isFound, isDeleted,
      (err) => {
        if (err) {
          console.error('插入數據失敗:', err);
          return res.status(500).send('插入數據失敗');
        }
        res.send({ lostId });
      }
    );
    stmt.finalize();
  } catch (err) {
    console.error('報失 API 錯誤:', err);
    res.status(500).send('服務器錯誤');
  }
});

// 以下保持不變
app.post('/api/report-found', upload.array('photos', 5), async (req, res) => {
  try {
    const { name, phoneNumber, email, isPublic, found_date, found_location, found_details, region = 'HK' } = req.body;
    const photos = req.files.map(file => file.path).join(',');
    const foundId = await generateId('found', region);

    const stmt = db.prepare(`
      INSERT INTO found_pets (foundId, name, phoneNumber, email, isPublic, found_date, found_location, found_details, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(foundId, name, phoneNumber, email, isPublic ? 1 : 0, found_date, found_location, found_details, photos, (err) => {
      if (err) {
        console.error('插入數據失敗:', err);
        return res.status(500).send('插入數據失敗');
      }
      res.send({ foundId });
    });
    stmt.finalize();
  } catch (err) {
    console.error('報料 API 錯誤:', err);
    res.status(500).send('服務器錯誤');
  }
});

app.get('/api/lost-pets', (req, res) => {
  db.all('SELECT * FROM lost_pets', [], (err, rows) => {
    if (err) {
      console.error('獲取走失寵物失敗:', err);
      return res.status(500).send('獲取數據失敗');
    }
    const pets = rows.map(pet => {
      if (pet.isPublic) {
        db.get('SELECT name, phoneNumber, email FROM users WHERE userId = ?', [pet.userId], (err, user) => {
          if (user) pet.contact = user;
        });
      }
      return pet;
    });
    res.send(pets);
  });
});

app.get('/api/found-pets', (req, res) => {
  db.all('SELECT * FROM found_pets', [], (err, rows) => {
    if (err) {
      console.error('獲取報料寵物失敗:', err);
      return res.status(500).send('獲取數據失敗');
    }
    const pets = rows.map(pet => {
      if (pet.isPublic) pet.contact = { name: pet.name, phoneNumber: pet.phoneNumber, email: pet.email };
      return pet;
    });
    res.send(pets);
  });
});

app.get('/api/lost-pets/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM lost_pets WHERE lostId = ?', [id], (err, row) => {
    if (err) {
      console.error('獲取單個走失寵物失敗:', err);
      return res.status(500).send('獲取數據失敗');
    }
    if (!row) {
      return res.status(404).send('未找到該走失寵物');
    }
    if (row.isPublic) {
      db.get('SELECT name, phoneNumber, email FROM users WHERE userId = ?', [row.userId], (err, user) => {
        if (user) row.contact = user;
        res.send(row);
      });
    } else {
      res.send(row);
    }
  });
});

app.get('/api/found-pets/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM found_pets WHERE foundId = ?', [id], (err, row) => {
    if (err) {
      console.error('獲取單個報料寵物失敗:', err);
      return res.status(500).send('獲取數據失敗');
    }
    if (!row) {
      return res.status(404).send('未找到該報料寵物');
    }
    if (row.isPublic) {
      row.contact = { name: row.name, phoneNumber: row.phoneNumber, email: row.email };
    }
    res.send(row);
  });
});

app.get('/geocode', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: '缺少 lat 或 lon 參數' });
  }
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'PetSearchUnited/1.0 (steven6b16@gmail.com)' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('地理編碼失敗:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'Nominatim 服務器未找到資源，請稍後重試' });
    } else {
      res.status(500).json({ error: '地理編碼服務器錯誤' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});