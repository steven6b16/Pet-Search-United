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
const { spawn } = require('child_process');

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

// 中間件：驗證 token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '請先登入' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '無效嘅 token' });
  }
};

// 中間件：檢查是否為管理員
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '請先登入' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '需要管理員權限' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '無效嘅 token' });
  }
};

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
      casestatus TEXT DEFAULT 'pending' CHECK (casestatus IN ('pending', 'active', 'rejected')),
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
      role TEXT DEFAULT 'user',
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
      createdBy INTEGER,
      FOREIGN KEY (lostId) REFERENCES lost_pets(lostId),
      FOREIGN KEY (foundId) REFERENCES found_pets(foundId),
      FOREIGN KEY (confirmedBy) REFERENCES users(userId),
      UNIQUE(lostId, foundId)
    )
  `);

  // 檢查並添加 casestatus 欄位（如果表已存在）
  db.all("PRAGMA table_info(found_pets)", (err, rows) => {
    if (err) console.error('檢查 found_pets 表結構失敗:', err);
    else {
      const hasCaseStatus = rows.some(row => row.name === 'casestatus');
      if (!hasCaseStatus) {
        db.run(`ALTER TABLE found_pets ADD COLUMN casestatus TEXT DEFAULT 'pending' CHECK (casestatus IN ('pending', 'active', 'rejected'))`);
        console.log('為 found_pets 添加 casestatus 欄位');
      } else {
        console.log('found_pets 已有 casestatus 欄位，跳過');
      }
    }
  });
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

    // 修改這部分，加入 role
    const token = jwt.sign(
      { userId: user.userId, role: user.role }, // 添加 role
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    db.run('UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP, failedLoginAttempts = 0 WHERE userId = ?', [user.userId]);
    // 順便把 role 加到回應中，方便前端使用
    res.json({ 
      token, 
      user: { 
        userId: user.userId, 
        name: user.name, 
        phoneNumber: user.phoneNumber, 
        email: user.email, 
        role: user.role // 添加 role
      } 
    });
  });
});

app.get('/api/check-is-user', authenticateToken, (req, res) => {
  db.get('SELECT userId, name, phoneNumber, email, role FROM users WHERE userId = ? AND isDeleted = FALSE', [req.user.userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: '用戶不存在' });
    }
    res.json(user);
  });
});

// 新增 PUT /api/me 路由：更新用戶資料
app.put('/api/update-user-info', authenticateToken, async (req, res) => {
  const { name, phoneNumber, email } = req.body;
  const userId = req.user.userId;

  // 驗證輸入
  if (!name) {
    return res.status(400).json({ error: '姓名係必填項' });
  }
  if (phoneNumber && !/^\d{8}$/.test(phoneNumber)) {
    return res.status(400).json({ error: '電話號碼必須係8位數字' });
  }
  if (email && !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: '請輸入有效嘅電郵地址' });
  }

  try {
    // 檢查電話或電郵是否已被其他用戶使用
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT userId FROM users WHERE (phoneNumber = ? OR email = ?) AND userId != ? AND isDeleted = FALSE',
        [phoneNumber || null, email || null, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      return res.status(409).json({ error: '電話號碼或電郵已被其他用戶使用' });
    }

    // 更新用戶資料
    const stmt = db.prepare(`
      UPDATE users 
      SET name = ?, phoneNumber = ?, email = ?, modifiedAt = CURRENT_TIMESTAMP 
      WHERE userId = ? AND isDeleted = FALSE
    `);
    stmt.run(name, phoneNumber || null, email || null, userId, (err) => {
      if (err) {
        console.error('更新用戶資料失敗:', err);
        return res.status(500).json({ error: '更新資料失敗' });
      }
      // 返回更新後嘅資料
      db.get('SELECT userId, name, phoneNumber, email FROM users WHERE userId = ?', [userId], (err, updatedUser) => {
        if (err) {
          return res.status(500).json({ error: '獲取更新後資料失敗' });
        }
        res.json(updatedUser);
      });
    });
    stmt.finalize();
  } catch (err) {
    console.error('更新用戶資料錯誤:', err);
    res.status(500).json({ error: '服務器錯誤' });
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

// 處理報料寵物嘅 API 端點，允許上傳最多 5 張圖片
app.post('/api/report-found', upload.array('photos', 5), async (req, res) => {
  try {
    // 從請求中提取報料數據
    const { userId, reportername, phonePrefix, phoneNumber, email, breed, petType, gender,
      age, color, found_date, found_location, found_details, region, chipNumber, fullAddress,
      displayLocation, holding_location, status, isPublic, isFound, isDeleted } = req.body;
    
    // 將上傳嘅圖片路徑合併為逗號分隔嘅字符串
    const photos = req.files.map(file => file.path).join(',');
    
    // 生成唯一嘅 foundId（例如 HK-found20250301）
    const foundId = await generateId('found', region);

    // 生成 6 位數嘅訪問 PIN 碼，用於非註冊用戶更新報料
    const accessPin = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 設置 PIN 碼過期時間（30 天後）
    const pinExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 插入新報料記錄到 found_pets 表
    await new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO found_pets (foundId, userId, reportername, phonePrefix, phoneNumber, email, breed, petType, gender,
        age, color, found_date, found_location, found_details, region, chipNumber, photos, fullAddress,
        displayLocation, holding_location, status, casestatus, isPublic, isFound, isDeleted, accessPin, pinExpires)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        foundId, userId || null, reportername, phonePrefix, phoneNumber || null, email || null, breed, petType, gender,
        age, color, found_date, found_location, found_details, region, chipNumber || null, photos, fullAddress || null,
        displayLocation || null, holding_location || null, status || null, 'pending', isPublic || 0, isFound || 0, isDeleted || 0,
        accessPin, pinExpires, (err) => {
          if (err) {
            console.error('插入數據失敗:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
      stmt.finalize();
    });

    // 準備 ML 分析所需嘅數據
    const newPetData = { foundId, petType, breed, color, found_date, found_location, found_details };

    // 調用 Python API 進行相似性分析，獲取相似嘅 foundId 列表
    const response = await axios.post('http://localhost:5001/analyze', newPetData);
    const similarFoundIds = response.data;
    console.log('ML 分析結果:', similarFoundIds);

    // 更新 found_pets 表中該記錄嘅 casestatus 為 'active'
    await new Promise((resolve, reject) => {
      db.run('UPDATE found_pets SET casestatus = ? WHERE foundId = ?', ['active', foundId], (err) => {
        if (err) {
          console.error('更新 casestatus 失敗:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // 如果有相似個案（similarFoundIds 不為空），檢查或創建 Group
    if (similarFoundIds.length > 0) {
      // 查詢 found_pet_groups 表，檢查是否有包含 similarFoundIds 嘅現有 Group
      const existingGroup = await new Promise((resolve, reject) => {
        db.get(
          `SELECT groupId, pendingFoundIds 
           FROM found_pet_groups 
           WHERE isDeleted = 0 AND pendingFoundIds LIKE ? 
           ORDER BY createdAt DESC LIMIT 1`,
          [`%${similarFoundIds[0]}%`], // 用第一個相似 ID 作為查詢條件
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      let groupId;
      if (existingGroup) {
        // 如果已有 Group，重用該 groupId 並更新 pendingFoundIds
        groupId = existingGroup.groupId;
        let pendingFoundIds = existingGroup.pendingFoundIds ? existingGroup.pendingFoundIds.split(',') : [];
        if (!pendingFoundIds.includes(foundId)) {
          pendingFoundIds.push(foundId); // 將新 foundId 添加到 pendingFoundIds
        }
        const updatedPendingFoundIds = [...new Set(pendingFoundIds)].join(','); // 去重後轉為逗號分隔字符串

        // 更新 found_pet_groups 表嘅 pendingFoundIds
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE found_pet_groups SET pendingFoundIds = ? WHERE groupId = ?',
            [updatedPendingFoundIds, groupId],
            (err) => {
              if (err) {
                console.error('更新群組失敗:', err);
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
      } else {
        // 如果無現有 Group，創建新 Group
        groupId = `GROUP${Date.now()}`; // 生成唯一 groupId
        await new Promise((resolve, reject) => {
          const stmtGroup = db.prepare(`
            INSERT INTO found_pet_groups (groupId, pendingFoundIds)
            VALUES (?, ?)
          `);
          stmtGroup.run(groupId, `${foundId},${similarFoundIds.join(',')}`, (err) => {
            if (err) {
              console.error('創建群組失敗:', err);
              reject(err);
            } else {
              resolve();
            }
          });
          stmtGroup.finalize();
        });
      }

      // 更新 found_pets 表中該記錄嘅 groupId
      await new Promise((resolve, reject) => {
        db.run('UPDATE found_pets SET groupId = ? WHERE foundId = ?', [groupId, foundId], (err) => {
          if (err) {
            console.error('更新 found_pets groupId 失敗:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    // 如果有提供 email，記錄發送 PIN 嘅日誌（模擬發送 email）
    if (email) {
      console.log(`發送 email 到 ${email}，PIN: ${accessPin}，報料 ID: ${foundId}`);
    }

    // 返回成功回應，包含 foundId 同 accessPin
    res.send({ foundId, accessPin });
  } catch (err) {
    // 捕獲所有錯誤，返回 500 錯誤回應
    console.error('報料 API 錯誤:', err);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

app.get('/api/lost-pets', (req, res) => {
  db.all('SELECT * FROM lost_pets WHERE isDeleted = 0', [], (err, rows) => {
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

// 修改後的 GET /api/found-pets，支持 groupId 過濾
app.get('/api/found-pets', (req, res) => {
  const { groupId } = req.query;
  let query = 'SELECT * FROM found_pets WHERE isDeleted = 0';
  let params = [];

  if (groupId) {
    query += ' AND groupId = ?';
    params.push(groupId);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('獲取報料寵物失敗:', err);
      return res.status(500).send('獲取數據失敗');
    }
    const pets = rows.map(pet => {
      if (pet.isPublic) {
        pet.contact = { name: pet.reportername, phoneNumber: pet.phoneNumber, email: pet.email };
      }
      return pet;
    });
    res.send(pets);
  });
});

app.get('/api/pending-found-ids/:foundId', (req, res) => {
  const { foundId } = req.params;
  db.get(
    `SELECT groupId, pendingFoundIds 
     FROM found_pet_groups 
     WHERE pendingFoundIds LIKE ? AND isDeleted = 0`,
    [`%${foundId}%`],
    (err, row) => {
      if (err) {
        console.error('獲取待確認報料失敗:', err);
        return res.status(500).json({ error: '獲取待確認報料失敗' });
      }
      if (!row) {
        return res.status(200).json({ groupId: null, pendingFoundIds: [] });
      }
      const pendingIds = row.pendingFoundIds ? row.pendingFoundIds.split(',').filter(id => id) : [];
      res.json({ groupId: row.groupId, pendingFoundIds: pendingIds });
    }
  );
});

app.get('/api/found-pet-groups/:groupId', (req, res) => {
  const { groupId } = req.params;
  db.get('SELECT * FROM found_pet_groups WHERE groupId = ? AND isDeleted = 0', [groupId], (err, row) => {
    if (err) {
      console.error('獲取群組數據失敗:', err);
      return res.status(500).json({ error: '獲取群組數據失敗' });
    }
    if (!row) {
      return res.status(404).json({ error: '群組不存在' });
    }
    res.json(row);
  });
});

app.get('/api/lost-pets/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM lost_pets WHERE lostId = ? AND isDeleted = 0', [id], (err, row) => {
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
  db.get('SELECT * FROM found_pets WHERE foundId = ? AND isDeleted = 0', [id], (err, row) => {
    if (err) {
      console.error('獲取單個報料寵物失敗:', err);
      return res.status(500).send('獲取數據失敗');
    }
    if (!row) {
      return res.status(404).send('未找到該報料寵物');
    }
    if (row.isPublic) {
      row.contact = { name: row.reportername, phoneNumber: row.phoneNumber, email: row.email };
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
      new Promise((resolve, reject) => db.get('SELECT foundId, groupId FROM found_pets WHERE foundId = ? AND isDeleted = 0', [foundId1], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      })),
      new Promise((resolve, reject) => db.get('SELECT foundId, groupId FROM found_pets WHERE foundId = ? AND isDeleted = 0', [foundId2], (err, row) => {
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

    const stmt = db.prepare('UPDATE found_pets SET groupId = ? WHERE foundId = ? AND isDeleted = 0');
    validConfirmIds.forEach(foundId => stmt.run(groupId, foundId));
    stmt.finalize();

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

// Admin Dashboard 路由，只有 Admin 可訪問
app.get('/api/admin/dashboard', isAdmin, (req, res) => {
  db.all('SELECT groupId, pendingFoundIds, createdAt FROM found_pet_groups WHERE status = "pending" AND isDeleted = 0', [], (err, rows) => {
    if (err) {
      console.error('獲取待確認群組失敗:', err);
      return res.status(500).json({ error: '獲取數據失敗' });
    }
    res.json({ 
      message: '歡迎來到 Admin Dashboard！', 
      userId: req.user.userId,
      role: req.user.role,
      pendingGroups: rows
    });
  });
});

// Admin 專用路由：獲取所有待確認嘅 found_pet_groups 及其相關 found_pets 資料
app.get('/api/admin/pending-groups', isAdmin, async (req, res) => {
  try {
    const pendingGroups = await new Promise((resolve, reject) => {
      db.all(
        `SELECT groupId, pendingFoundIds 
         FROM found_pet_groups 
         WHERE status = 'pending' AND isDeleted = 0`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const detailedGroups = await Promise.all(pendingGroups.map(async (group) => {
      const foundIds = group.pendingFoundIds ? group.pendingFoundIds.split(',') : [];

      // 查詢每個 foundId 對應嘅 found_pets 記錄，包含 photos 字段
      const foundPets = await new Promise((resolve, reject) => {
        db.all(
          `SELECT foundId, petType, breed, color, found_date, found_location, found_details, photos 
           FROM found_pets 
           WHERE foundId IN (${foundIds.map(() => '?').join(',')}) AND isDeleted = 0`,
          foundIds,
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return {
        groupId: group.groupId,
        pendingFoundIds: foundIds,
        foundPets: foundPets // 包含圖片路徑
      };
    }));

    res.json({ pendingGroups: detailedGroups });
  } catch (err) {
    console.error('獲取待確認群組失敗:', err);
    res.status(500).json({ error: '獲取待確認群組失敗' });
  }
});

// Admin 專用路由：確認或拒絕 found_pet_groups
app.post('/api/admin/confirm-group', isAdmin, async (req, res) => {
  const { groupId, selectedFoundIds, action } = req.body; // action: 'approve' 或 'reject'

  // 驗證請求數據
  if (!groupId || !selectedFoundIds || !Array.isArray(selectedFoundIds) || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: '請提供 groupId, selectedFoundIds 同有效嘅 action（approve 或 reject）' });
  }

  try {
    // 查詢該 Group 嘅當前狀態
    const group = await new Promise((resolve, reject) => {
      db.get(
        `SELECT pendingFoundIds 
         FROM found_pet_groups 
         WHERE groupId = ? AND isDeleted = 0`,
        [groupId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!group) {
      return res.status(404).json({ error: '群組不存在' });
    }

    let pendingFoundIds = group.pendingFoundIds ? group.pendingFoundIds.split(',') : [];
    const validSelectedIds = selectedFoundIds.filter(id => pendingFoundIds.includes(id));

    if (validSelectedIds.length === 0) {
      return res.status(400).json({ error: '無有效嘅待確認 foundId' });
    }

    if (action === 'approve') {
      // 確認選擇嘅 foundId，將佢地加入 Group
      await Promise.all(validSelectedIds.map(foundId => {
        return new Promise((resolve, reject) => {
          db.run(
            'UPDATE found_pets SET groupId = ? WHERE foundId = ? AND isDeleted = 0',
            [groupId, foundId],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }));

      // 移除已確認嘅 foundId 從 pendingFoundIds
      pendingFoundIds = pendingFoundIds.filter(id => !validSelectedIds.includes(id));
      const updatedPendingFoundIds = pendingFoundIds.join(',');

      // 更新 Group 狀態為 confirmed
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE found_pet_groups 
           SET status = 'confirmed', confirmedAt = CURRENT_TIMESTAMP, confirmedBy = ?, pendingFoundIds = ? 
           WHERE groupId = ?`,
          [req.user.userId, updatedPendingFoundIds, groupId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      res.json({ message: '群組已確認', groupId });
    } else {
      // 拒絕選擇嘅 foundId，移除佢地同 Group 嘅關聯
      pendingFoundIds = pendingFoundIds.filter(id => !validSelectedIds.includes(id));
      const updatedPendingFoundIds = pendingFoundIds.join(',');

      // 更新 Group 狀態為 rejected
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE found_pet_groups 
           SET status = 'rejected', confirmedAt = CURRENT_TIMESTAMP, confirmedBy = ?, pendingFoundIds = ? 
           WHERE groupId = ?`,
          [req.user.userId, updatedPendingFoundIds, groupId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      res.json({ message: '群組已拒絕', groupId });
    }
  } catch (err) {
    console.error('處理群組確認失敗:', err);
    res.status(500).json({ error: '處理群組確認失敗' });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});