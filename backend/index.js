const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 新增 JWT
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto'); // 用於生成隨機 token
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

// JWT 秘鑰（實際應用中應放喺 .env 文件）
const JWT_SECRET = 'your-secret-key-please-change-this';

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

  db.run(`
    CREATE TABLE IF NOT EXISTS found_pets (
      foundId TEXT PRIMARY KEY,
      userId INTEGER DEFAULT 0,
      reportername TEXT,
      phonePrefix TEXT,
      phoneNumber TEXT,
      email TEXT,
      breed TEXT,
      petType TEXT,
      gender TEXT,
      age TEXT, -- 改為 TEXT
      color TEXT,
      found_date TEXT,
      found_location TEXT,
      found_details TEXT,
      region TEXT, -- 新增
      chipNumber TEXT,
      photos TEXT,
      fullAddress TEXT, -- 新增
      displayLocation TEXT, -- 新增
      holding_location TEXT, -- 新增
      status TEXT, -- 新增
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      isPublic BOOLEAN DEFAULT 0,
      isFound BOOLEAN DEFAULT 0,
      isDeleted BOOLEAN DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(userId)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phoneNumber TEXT UNIQUE,              -- 確保唯一
      email TEXT UNIQUE,                    -- 確保唯一
      password TEXT NOT NULL,               -- 加密儲存
      status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
      isVerified BOOLEAN DEFAULT FALSE,
      verificationToken TEXT,
      verificationExpires TIMESTAMP,
      lastLoginAt TIMESTAMP,
      failedLoginAttempts INTEGER DEFAULT 0,
      resetPasswordToken TEXT,
      resetPasswordExpires TIMESTAMP,
      createdBy TEXT,
      modifiedBy TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      modifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      isDeleted BOOLEAN DEFAULT FALSE,
      deletedAt TIMESTAMP
    )
  `);
});

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

// 生成隨機 token（用於驗證同重置密碼）
const generateToken = () => crypto.randomBytes(32).toString('hex');

// 註冊 API
app.post('/api/register', async (req, res) => {
  const { phoneNumber, email, password } = req.body;

  // 驗證邏輯
  if (phoneNumber && email) {
    return res.status(400).json({ error: '請只提供電話或電郵其中一個' });
  }
  if (!phoneNumber && !email) {
    return res.status(400).json({ error: '請提供電話或電郵' });
  }
  if (!password) {
    return res.status(400).json({ error: '請提供密碼' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const stmt = db.prepare(`
      INSERT INTO users (phoneNumber, email, password, verificationToken, verificationExpires)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(phoneNumber || null, email || null, hashedPassword, verificationToken, verificationExpires, (err) => {
      if (err) {
        console.error('註冊失敗:', err);
        return res.status(500).json({ error: '註冊失敗，可能電話或電郵已存在' });
      }
      console.log(`驗證鏈接: http://localhost:3001/api/verify?token=${verificationToken}`);
      res.status(201).json({ message: '註冊成功，請檢查電郵進行驗證' });
    });
    stmt.finalize();
  } catch (err) {
    console.error('註冊錯誤:', err);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 驗證電郵 API
app.get('/api/verify', (req, res) => {
  const { token } = req.query;
  db.get('SELECT * FROM users WHERE verificationToken = ? AND verificationExpires > ?', [token, new Date()], (err, row) => {
    if (err || !row) {
      return res.status(400).json({ error: '驗證鏈接無效或已過期' });
    }
    db.run('UPDATE users SET isVerified = TRUE, status = "active", verificationToken = NULL, verificationExpires = NULL WHERE userId = ?', [row.userId], (err) => {
      if (err) {
        return res.status(500).json({ error: '驗證失敗' });
      }
      res.json({ message: '電郵驗證成功，請登入' });
    });
  });
});

// 登入 API
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body; // identifier 可以是 phoneNumber 或 email
  if (!identifier || !password) {
    return res.status(400).json({ error: '請輸入電話/電郵同密碼' });
  }

  db.get('SELECT * FROM users WHERE (phoneNumber = ? OR email = ?) AND isDeleted = FALSE', [identifier, identifier], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: '用戶不存在' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: '請先驗證電郵' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: '帳戶未啟用' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      db.run('UPDATE users SET failedLoginAttempts = failedLoginAttempts + 1 WHERE userId = ?', [user.userId]);
      return res.status(401).json({ error: '密碼錯誤' });
    }

    const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });
    db.run('UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP, failedLoginAttempts = 0 WHERE userId = ?', [user.userId]);
    res.json({ token, user: { userId: user.userId, name: user.name, phoneNumber: user.phoneNumber, email: user.email } });
  });
});

// 獲取當前用戶資料 API（需認證）
app.get('/api/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '請先登入' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.get('SELECT userId, name, phoneNumber, email FROM users WHERE userId = ? AND isDeleted = FALSE', [decoded.userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: '用戶不存在' });
      }
      res.json(user);
    });
  } catch (err) {
    res.status(401).json({ error: '無效嘅 token' });
  }
});

// 忘記密碼 API
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: '請輸入電郵' });
  }

  db.get('SELECT * FROM users WHERE email = ? AND isDeleted = FALSE', [email], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: '電郵不存在' });
    }

    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 小時過期
    db.run('UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE userId = ?', [resetToken, resetExpires, user.userId], (err) => {
      if (err) {
        return res.status(500).json({ error: '服務器錯誤' });
      }
      // 模擬電郵發送
      console.log(`重置密碼鏈接: http://localhost:3001/api/reset-password?token=${resetToken}`);
      res.json({ message: '已發送重置密碼電郵' });
    });
  });
});

// 重置密碼 API
app.post('/api/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: '請提供 token 同新密碼' });
  }

  db.get('SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > ?', [token, new Date()], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: '重置鏈接無效或已過期' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE userId = ?', [hashedPassword, user.userId], (err) => {
      if (err) {
        return res.status(500).json({ error: '重置密碼失敗' });
      }
      res.json({ message: '密碼重置成功，請重新登入' });
    });
  });
});

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
    console.log(`生成 ${lostId} ID`);

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
      otherPhotos, fullAddress, displayLocation, region, isPublic , isFound, isDeleted,
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
    const { userId, reportername, phonePrefix, phoneNumber, email, breed, petType, gender,
      age, color, found_date, found_location, found_details, region, chipNumber, fullAddress,
      displayLocation, holding_location, status, isPublic, isFound, isDeleted } = req.body;
    const photos = req.files.map(file => file.path).join(',');
    const foundId = await generateId('found', region);

    const stmt = db.prepare(`
      INSERT INTO found_pets (foundId, userId, reportername, phonePrefix, phoneNumber, email, breed, petType, gender,
      age, color, found_date, found_location, found_details, region, chipNumber, photos, fullAddress,
      displayLocation, holding_location, status, isPublic, isFound, isDeleted )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(foundId, userId, reportername, phonePrefix, phoneNumber, email, breed, petType, gender,
      age, color, found_date, found_location, found_details, region, chipNumber, photos, fullAddress,
      displayLocation, holding_location, status, isPublic, isFound, isDeleted , (err) => {
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