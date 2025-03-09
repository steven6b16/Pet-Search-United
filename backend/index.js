const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // 添加靜態文件服務

// 數據庫設置
const db = new sqlite3.Database('./lost_pets.db', (err) => {
  if (err) {
    console.error('數據庫連接失敗:', err);
    process.exit(1);
  }
  console.log('數據庫連接成功');
});

db.serialize(() => {
  // 創建 lost_pets 表
  db.run(`
    CREATE TABLE IF NOT EXISTS lost_pets (
      lostId TEXT PRIMARY KEY,
      userId INTEGER,
      name TEXT,
      species TEXT,
      breed TEXT,
      gender TEXT,
      age INTEGER,
      color TEXT,
      lost_date TEXT,
      location TEXT,
      details TEXT,
      chipNumber TEXT,
      photos TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId)
    )
  `);
  // 檢查並添加 isPublic 欄位
  db.all("PRAGMA table_info(lost_pets)", (err, rows) => {
    if (err) console.error('檢查 lost_pets 表結構失敗:', err);
    else {
      const hasIsPublic = rows.some(row => row.name === 'isPublic');
      if (!hasIsPublic) {
        db.run(`ALTER TABLE lost_pets ADD COLUMN isPublic BOOLEAN DEFAULT 0`);
        console.log('為 lost_pets 添加 isPublic 欄位');
      } else {
        console.log('lost_pets 已有 isPublic 欄位，跳過');
      }
    }
  });

  // 創建 found_pets 表
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
  // 檢查並添加 isPublic 欄位
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

  // 創建 users 表
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

// 照片上傳設置
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// 生成 ID
function generateId(type, region) {
  return new Promise((resolve, reject) => {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    db.get(`SELECT COUNT(*) as count FROM ${type}_pets WHERE ${type}Id LIKE ?`, [`${region}-${type}${yearMonth}%`], (err, row) => {
      if (err) {
        console.error('生成 ID 失敗:', err);
        return reject(err);
      }
      const caseNum = (row.count + 1).toString().padStart(2, '0');
      resolve(`${region}-${type}${yearMonth}${caseNum}`);
    });
  });
}

// 報失 API
app.post('/api/report-lost', upload.array('photos', 5), async (req, res) => {
  try {
    const { name, species, breed, gender, age, color, lost_date, location, details, chipNumber, userId, isPublic, region = 'HK' } = req.body;
    const photos = req.files.map(file => file.path).join(',');
    const lostId = await generateId('lost', region);

    const stmt = db.prepare(`
      INSERT INTO lost_pets (lostId, userId, name, species, breed, gender, age, color, lost_date, location, details, chipNumber, photos, isPublic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(lostId, userId, name, species, breed, gender, age, color, lost_date, location, details, chipNumber, photos, isPublic ? 1 : 0, (err) => {
      if (err) {
        console.error('插入數據失敗:', err);
        return res.status(500).send('插入數據失敗');
      }
      res.send({ lostId });
    });
    stmt.finalize();
  } catch (err) {
    console.error('報失 API 錯誤:', err);
    res.status(500).send('服務器錯誤');
  }
});

// 報料 API
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

// 獲取所有走失寵物
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

// 獲取所有報料寵物
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

// 獲取單個走失寵物
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

// 獲取單個報料寵物
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});