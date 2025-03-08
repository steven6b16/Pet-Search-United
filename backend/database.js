const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./lostpet.db');

db.serialize(() => {
  // 創建表
  db.run(`
    CREATE TABLE IF NOT EXISTS lost_pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      breed TEXT,
      color TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      photo TEXT,
      location TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      species TEXT
    )
  `, [], (err) => {
    if (err) {
      console.error('創建表失敗：', err.message);
    } else {
      console.log('表創建或已存在');
    }
  });

  // 檢查species欄位是否存在
  db.all("PRAGMA table_info(lost_pets)", [], (err, rows) => {
    if (err) {
      console.error('查詢表結構失敗：', err.message);
      return;
    }
    const hasSpecies = rows.some(row => row.name === 'species');
    if (!hasSpecies) {
      db.run("ALTER TABLE lost_pets ADD COLUMN species TEXT", (err) => {
        if (err) {
          console.error('加species欄位失敗：', err.message);
        } else {
          console.log('成功加species欄位');
        }
      });
    } else {
      console.log('species欄位已存在');
    }
  });
});

module.exports = db;