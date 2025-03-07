const express = require('express');
const cors = require('cors');
const multer = require('multer');
const db = require('./database');
const path = require('path');

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

app.post('/api/report-lost', upload.single('photo'), (req, res) => {
  const { name, breed, color, lat, lng } = req.body;
  const photo = req.file ? req.file.path.replace(/\\/g, '/') : null;

  db.run(
    'INSERT INTO lost_pets (name, breed, color, lat, lng, photo) VALUES (?, ?, ?, ?, ?, ?)',
    [name, breed, color, lat, lng, photo],
    (err) => {
      if (err) {
        console.log('存資料失敗啦：', err);
        res.send('報失失敗！');
      } else {
        console.log('存資料成功！');
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