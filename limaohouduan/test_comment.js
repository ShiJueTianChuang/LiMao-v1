require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDatabase } = require('./db');
const { router: forumRouter } = require('./routes/forum');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/forum', forumRouter);
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]', err);
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message, stack: err.stack });
});

initDatabase().then(() => {
  const server = app.listen(3999, async () => {
    console.log('Test server on port 3999');
    const token = jwt.sign({id:1, email:'test@test.com'}, process.env.JWT_SECRET, {expiresIn:'1h'});
    const http = require('http');
    const data = JSON.stringify({content:'test comment'});
    const options = {
      hostname: 'localhost',
      port: 3999,
      path: '/api/forum/posts/7/comments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        server.close();
        process.exit();
      });
    });
    req.on('error', e => {
      console.error('Request error:', e);
      server.close();
      process.exit(1);
    });
    req.write(data);
    req.end();
  });
}).catch(e => {
  console.error('Init error:', e);
  process.exit(1);
});
