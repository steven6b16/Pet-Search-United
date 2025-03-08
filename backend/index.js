const express = require('express');
const cors = require('cors');
const multer = require('multer');
const db = require('./database');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storage });

app.post('/api/report-lost', upload.single('photo'), async (req, res) => {
  const { name, breed, color, lat, lng } = req.body;
  const photo = req.file ? req.file.path.replace(/\\/g, '/') : null;

  // 查地址
  let location = '地址未知';
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'PetSearchUnited/1.0 (steven6b16@gmail.com)'
        },
        timeout: 10000 // 加10秒超時
      }
    );
    const address = response.data.address;
    location = address.road || address.suburb || address.city || '未知地址';
  } catch (error) {
    console.log('查地址失敗：', error.message);
  }

  db.run(
    'INSERT INTO lost_pets (name, breed, color, lat, lng, photo, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, breed, color, lat, lng, photo, location],
    (err) => {
      if (err) {
        console.log('存資料失敗啦：', err);
        res.send('報失失敗！');
      } else {
        console.log('存資料成功！地址：', location);
        res.send('報失成功！');
      }
    }
  );
});

app.get('/api/lost-pets', (req, res) => {
  db.all('SELECT * FROM lost_pets', (err, rows) => {
    if (err) {
      console.log('查資料失敗啦：', err);
      res.status(500).send('查詢失敗！');
    } else {
      console.log('查到資料：', rows);
      res.json(rows);
    }
  });
});

app.use('/uploads', express.static('uploads'));

app.listen(5000, () => {
  console.log('服務器跑在 http://localhost:5000');
});