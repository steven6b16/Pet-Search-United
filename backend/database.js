const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./lostpet.db', (err) => {
  if (err) {
    console.log('開數據庫失敗啦：', err);
  } else {
    console.log('數據庫開好了！');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS lost_pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    breed TEXT,
    color TEXT,
    lat REAL,
    lng REAL,
    photo TEXT
  )
`, (err) => {
  if (err) {
    console.log('建表格失敗啦：', err);
  } else {
    console.log('表格建好了！');
  }
});

module.exports = db;