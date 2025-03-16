const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
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
      frontPhoto TEXT,
      sidePhoto TEXT,
      otherPhotos TEXT,
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
      age TEXT,
      color TEXT,
      found_date TEXT,
      found_location TEXT,
      found_details TEXT,
      region TEXT,
      chipNumber TEXT,
      photos TEXT,
      fullAddress TEXT,
      displayLocation TEXT,
      holding_location TEXT,
      status TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      isPublic BOOLEAN DEFAULT 0,
      isFound BOOLEAN DEFAULT 0,
      isDeleted BOOLEAN DEFAULT 0,
      groupId TEXT,
      accessPin TEXT,
      pinExpires TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phoneNumber TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
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

  db.run(`
    CREATE TABLE IF NOT EXISTS found_pet_groups (
      groupId TEXT PRIMARY KEY,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      createdBy INTEGER,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
      confirmedAt TIMESTAMP,
      confirmedBy INTEGER,
      pendingFoundIds TEXT,
      isDeleted INTEGER DEFAULT 0,
      FOREIGN KEY (createdBy) REFERENCES users(userId),
      FOREIGN KEY (confirmedBy) REFERENCES users(userId)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pet_matches (
      matchId TEXT PRIMARY KEY,
      lostId TEXT NOT NULL,
      foundId TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      confirmedAt TIMESTAMP,
      confirmedBy INTEGER,
      FOREIGN KEY (lostId) REFERENCES lost_pets(lostId),
      FOREIGN KEY (foundId) REFERENCES found_pets(foundId),
      FOREIGN KEY (confirmedBy) REFERENCES users(userId),
      UNIQUE(lostId, foundId)
    )
  `);
});

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

const uploadFields = upload.fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'sidePhoto', maxCount: 1 },
  { name: 'otherPhotos', maxCount: 5 },
]);

const generateToken = () => crypto.randomBytes(32).toString('hex');

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

app.post('/api/register', async (req, res) => {
  const { phoneNumber, email, password } = req.body;

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

app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;
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
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    db.run('UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE userId = ?', [resetToken, resetExpires, user.userId], (err) => {
      if (err) {
        return res.status(500).json({ error: '服務器錯誤' });
      }
      console.log(`重置密碼鏈接: http://localhost:3001/api/reset-password?token=${resetToken}`);
      res.json({ message: '已發送重置密碼電郵' });
    });
  });
});

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

app.post('/api/report-lost', uploadFields, async (req, res) => {
  console.log('接收到的 req.body:', req.body);
  console.log('接收到的 req.files:', req.files);
  try {
    const {
      userId, ownername, phonePrefix, phoneNumber, email, name, breed, petType,
      gender, age, color, lost_date, location, details, chipNumber, fullAddress,
      displayLocation, region = 'HK', isPublic, isFound, isDeleted
    } = req.body;

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
      otherPhotos, fullAddress, displayLocation, region, isPublic || 0, isFound || 0, isDeleted || 0,
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

app.post('/api/report-found', upload.array('photos', 5), async (req, res) => {
  try {
    const { userId, reportername, phonePrefix, phoneNumber, email, breed, petType, gender,
      age, color, found_date, found_location, found_details, region, chipNumber, fullAddress,
      displayLocation, holding_location, status, isPublic, isFound, isDeleted } = req.body;
    const photos = req.files.map(file => file.path).join(',');
    const foundId = await generateId('found', region);

    const accessPin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const stmt = db.prepare(`
      INSERT INTO found_pets (foundId, userId, reportername, phonePrefix, phoneNumber, email, breed, petType, gender,
      age, color, found_date, found_location, found_details, region, chipNumber, photos, fullAddress,
      displayLocation, holding_location, status, isPublic, isFound, isDeleted, accessPin, pinExpires)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(foundId, userId || null, reportername, phonePrefix, phoneNumber || null, email || null, breed, petType, gender,
      age, color, found_date, found_location, found_details, region, chipNumber || null, photos, fullAddress || null,
      displayLocation || null, holding_location || null, status || null, isPublic || 0, isFound || 0, isDeleted || 0,
      accessPin, pinExpires, (err) => {
        if (err) {
          console.error('插入數據失敗:', err);
          return res.status(500).send('插入數據失敗');
        }
        if (email) {
          console.log(`發送 email 到 ${email}，PIN: ${accessPin}，報料 ID: ${foundId}`);
        }
        res.send({ foundId, accessPin });
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

app.put('/api/update-found/:foundId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { foundId } = req.params;
  const { pin, phoneNumber, email, found_date, found_location, found_details, holding_location, status } = req.body;

  try {
    let userId = null;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    }

    const foundPet = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM found_pets WHERE foundId = ?', [foundId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!foundPet) return res.status(404).json({ error: '報料記錄不存在' });

    let isAuthorized = false;
    if (userId && foundPet.userId === userId) {
      isAuthorized = true;
    } else if (pin && foundPet.accessPin === pin && new Date(foundPet.pinExpires) > new Date()) {
      isAuthorized = true;
    } else if (!userId && (phoneNumber === foundPet.phoneNumber || email === foundPet.email)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: '無權更新此報料，請提供正確嘅 PIN 或聯絡方式' });
    }

    const stmt = db.prepare(`
      UPDATE found_pets SET
        found_date = ?, found_location = ?, found_details = ?, holding_location = ?, status = ?
      WHERE foundId = ?
    `);
    stmt.run(
      found_date || foundPet.found_date, found_location || foundPet.found_location,
      found_details || foundPet.found_details, holding_location || foundPet.holding_location,
      status || foundPet.status, foundId, (err) => {
        if (err) return res.status(500).json({ error: '更新失敗' });
        res.json({ message: '報料已更新' });
      }
    );
    stmt.finalize();
  } catch (err) {
    res.status(401).json({ error: '無效嘅 token 或驗證失敗' });
  }
});

app.post('/api/create-found-group', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '請先登入' });

  const { foundId1, foundId2 } = req.body;
  if (!foundId1 || !foundId2) return res.status(400).json({ error: '請提供兩個 foundId' });
  if (foundId1 === foundId2) return res.status(400).json({ error: '無法連結相同記錄' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const [found1Exists, found2Exists] = await Promise.all([
      new Promise((resolve, reject) => db.get('SELECT foundId, groupId FROM found_pets WHERE foundId = ? AND isDeleted = "false"', [foundId1], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      })),
      new Promise((resolve, reject) => db.get('SELECT foundId, groupId FROM found_pets WHERE foundId = ? AND isDeleted = "false"', [foundId2], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      })),
    ]);
    if (!found1Exists || !found2Exists) return res.status(404).json({ error: '記錄不存在A' });

    let groupId = found1Exists.groupId || found2Exists.groupId;

    if (!groupId) {
      groupId = `GROUP${Date.now()}`;
      const stmt = db.prepare(`
        INSERT INTO found_pet_groups (groupId, createdBy)
        VALUES (?, ?)
      `);
      stmt.run(groupId, userId, (err) => {
        if (err) return res.status(500).json({ error: '創建群組失敗' });
      });
      stmt.finalize();
    }

    const existingGroup = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM found_pet_groups WHERE groupId = ?', [groupId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    let pendingFoundIds = existingGroup.pendingFoundIds ? existingGroup.pendingFoundIds.split(',').filter(id => id) : [];
    if (found1Exists.groupId !== groupId) pendingFoundIds.push(foundId1);
    if (found2Exists.groupId !== groupId) pendingFoundIds.push(foundId2);
    pendingFoundIds = [...new Set(pendingFoundIds)].join(',');

    db.run('UPDATE found_pet_groups SET pendingFoundIds = ? WHERE groupId = ?', [pendingFoundIds, groupId], (err) => {
      if (err) return res.status(500).json({ error: '更新群組失敗' });
      res.json({ message: '群組已創建/更新，等待確認', groupId, pendingFoundIds });
    });
  } catch (err) {
    res.status(401).json({ error: '無效嘅 token' });
  }
});

app.post('/api/confirm-found-group', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '請先登入' });

  const { groupId, confirmFoundIds } = req.body;
  if (!groupId || !confirmFoundIds || !Array.isArray(confirmFoundIds)) {
    return res.status(400).json({ error: '請提供 groupId 同 confirmFoundIds' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const group = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM found_pet_groups WHERE groupId = ? AND isDeleted = 0', [groupId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!group) return res.status(404).json({ error: '群組不存在' });

    let pendingFoundIds = group.pendingFoundIds ? group.pendingFoundIds.split(',').filter(id => id) : [];
    const validConfirmIds = confirmFoundIds.filter(id => pendingFoundIds.includes(id));
    if (validConfirmIds.length === 0) return res.status(400).json({ error: '無有效嘅待確認 foundId' });

    // 更新 found_pets 表嘅 groupId
    const stmt = db.prepare('UPDATE found_pets SET groupId = ? WHERE foundId = ? AND isDeleted = 0');
    validConfirmIds.forEach(foundId => stmt.run(groupId, foundId));
    stmt.finalize();

    // 更新群組狀態
    pendingFoundIds = pendingFoundIds.filter(id => !validConfirmIds.includes(id)).join(',');
    db.run(`
      UPDATE found_pet_groups 
      SET status = 'confirmed', confirmedAt = CURRENT_TIMESTAMP, confirmedBy = ?, pendingFoundIds = ?
      WHERE groupId = ?
    `, [userId, pendingFoundIds, groupId], (err) => {
      if (err) return res.status(500).json({ error: '確認失敗' });
      res.json({ message: '群組已確認', groupId });
    });
  } catch (err) {
    res.status(401).json({ error: '無效嘅 token' });
  }
});

app.post('/api/create-pet-match', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '請先登入' });

  const { lostId, foundId } = req.body;
  if (!lostId || !foundId) return res.status(400).json({ error: '請提供 lostId 同 foundId' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const [lostExists, foundExists] = await Promise.all([
      new Promise((resolve, reject) => db.get('SELECT lostId FROM lost_pets WHERE lostId = ? AND isDeleted = 0', [lostId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      })),
      new Promise((resolve, reject) => db.get('SELECT foundId FROM found_pets WHERE foundId = ? AND isDeleted = 0', [foundId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      })),
    ]);
    if (!lostExists || !foundExists) return res.status(404).json({ error: '記錄不存在1' });

    const matchId = `${lostId}-${foundId}-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO pet_matches (matchId, lostId, foundId, createdBy)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(matchId, lostId, foundId, userId, (err) => {
      if (err) {
        console.error('創建匹配失敗:', err);
        return res.status(500).json({ error: '創建匹配失敗' });
      }
      res.json({ matchId, message: '匹配已創建，等待確認' });
    });
    stmt.finalize();
  } catch (err) {
    res.status(401).json({ error: '無效嘅 token' });
  }
});

app.get('/api/matches', async (req, res) => {
  const { petId } = req.query;
  if (!petId) {
    return res.status(400).json({ error: '請提供 petId' });
  }

  try {
    // 查詢與 petId 相關嘅匹配
    const matches = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT pm.matchId, pm.status, pm.createdAt, lp.name AS lostPetName, fp.reportername AS foundPetName,
               lp.lostId, fp.foundId
        FROM pet_matches pm
        LEFT JOIN lost_pets lp ON pm.lostId = lp.lostId
        LEFT JOIN found_pets fp ON pm.foundId = fp.foundId
        WHERE pm.lostId = ? OR pm.foundId = ?
        `,
        [petId, petId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({ petId, matches });
  } catch (err) {
    console.error('獲取匹配失敗:', err);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

app.post('/api/confirm-pet-match', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '請先登入' });

  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ error: '請提供 matchId' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const match = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM pet_matches WHERE matchId = ? AND status = "pending"', [matchId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!match) return res.status(404).json({ error: '匹配不存在或已處理' });

    const lostPet = await new Promise((resolve, reject) => {
      db.get('SELECT userId FROM lost_pets WHERE lostId = ?', [match.lostId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (lostPet.userId !== userId) return res.status(403).json({ error: '只有寵物主人可以確認' });

    db.run(
      `
      UPDATE pet_matches SET status = "confirmed", confirmedBy = ?, confirmedAt = CURRENT_TIMESTAMP WHERE matchId = ?
    `,
      [userId, matchId],
      (err) => {
        if (err) return res.status(500).json({ error: '確認失敗' });

        db.run('UPDATE lost_pets SET isFound = 1 WHERE lostId = ?', [match.lostId]);
        db.run('UPDATE found_pets SET isFound = 1 WHERE foundId = ?', [match.foundId], async (err) => {
          if (err) return res.status(500).json({ error: '關閉個案失敗' });

          const foundGroup = await new Promise((resolve, reject) => {
            db.get('SELECT groupId FROM found_pets WHERE foundId = ?', [match.foundId], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });
          if (foundGroup && foundGroup.groupId) {
            db.run('UPDATE found_pets SET isFound = 1 WHERE groupId = ?', [foundGroup.groupId]);
          }

          res.json({ message: '匹配已確認，個案已關閉' });
        });
      }
    );
  } catch (err) {
    res.status(401).json({ error: '無效嘅 token' });
  }
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