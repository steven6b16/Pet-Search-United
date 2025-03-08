const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// 靜態文件服務，用於訪問上傳嘅照片
app.use('/uploads', express.static('uploads'));

const db = new sqlite3.Database('lostpet.db', (err) => {
  if (err) {
    console.error('數據庫連接失敗：', err.message);
    process.exit(1);
  } else {
    console.log('數據庫連接成功');
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS lost_pets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          breed TEXT,
          color TEXT,
          lat REAL,
          lng REAL,
          photo TEXT,
          location TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          species TEXT,
          gender TEXT,
          age TEXT,
          contact TEXT,
          lost_date TEXT
        )
      `);
    });
  }
});

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storage });

app.get('/api/lost-pets', (req, res) => {
  db.all('SELECT * FROM lost_pets', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: '查詢失敗！' });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/report-lost', upload.single('photo'), (req, res) => {
  const { name, breed, color, lat, lng, location, species, gender, age, contact, lost_date } = req.body;
  const photo = req.file ? req.file.path.replace(/\\/g, '/') : null;

  if (!name || !lat || !lng) {
    return res.status(400).json({ error: '名稱、緯度和經度為必填！' });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ error: '經緯度格式錯誤！' });
  }

  if (contact && !/^(\d{8,}|\S+@\S+\.\S+)$/.test(contact)) {
    return res.status(400).json({ error: '聯繫方式應為有效電話或郵箱！' });
  }

  if (lost_date && isNaN(Date.parse(lost_date))) {
    return res.status(400).json({ error: '走失日期格式錯誤！' });
  }

  db.run(
    'INSERT INTO lost_pets (name, breed, color, lat, lng, photo, location, species, gender, age, contact, lost_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name || null, breed || null, color || null, latNum, lngNum, photo, location || '未知地址', species || null, gender || null, age || null, contact || null, lost_date || null],
    (err) => {
      if (err) {
        console.error('存資料失敗：', err.message);
        res.status(500).json({ error: '報失失敗！' });
      } else {
        console.log('存資料成功！');
        res.json({ message: '報失成功！' });
      }
    }
  );
});

app.listen(5000, () => {
  console.log('服務器運行在 http://localhost:5000');
});