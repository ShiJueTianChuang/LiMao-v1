const bcrypt = require('bcrypt');
require('dotenv').config();
const mysql = require('mysql2/promise');

async function createAdmin() {
  const email = 'ldf971027';
  const password = 'ldfwoai.20132014';

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'limao'
  };

  const conn = await mysql.createConnection(dbConfig);

  const hashedPassword = await bcrypt.hash(password, 10);

  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    await conn.query('UPDATE users SET password = ?, role = ?, nickname = ? WHERE email = ?', [hashedPassword, 'admin', '管理员', email]);
    console.log('管理员账号已更新:');
    console.log('  账号: ' + email);
    console.log('  密码: ' + password);
  } else {
    await conn.query('INSERT INTO users (email, password, role, nickname) VALUES (?, ?, ?, ?)', [email, hashedPassword, 'admin', '管理员']);
    console.log('管理员账号已创建:');
    console.log('  账号: ' + email);
    console.log('  密码: ' + password);
  }

  await conn.end();
}

createAdmin().catch(console.error);
