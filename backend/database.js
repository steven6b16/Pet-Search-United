const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./lostpet.db');

db.serialize(() => {
  // 檢查表是否存在，如果無就創建
  db.run(`
    CREATE TABLE IF NOT EXISTS lost_pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      breed TEXT,
      color TEXT,
      lat REAL,
      lng REAL,
      photo TEXT,
      location TEXT
    )
  `);
});

module.exports = db;