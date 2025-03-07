const db = require('./database');

db.all('SELECT * FROM lost_pets', (err, rows) => {
  if (err) {
    console.log('查資料失敗啦：', err);
  } else {
    console.log('所有報失資料：', rows);
  }
});