require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { pool, initDatabase, initAiTables } = require('./db');
const { JWT_SECRET } = require('./config');
const authRouter = require('./routes/auth');
const agreementRouter = require('./routes/agreement');
const { router: forumRouter, handleMulterError } = require('./routes/forum');
const aiRouter = require('./routes/ai')
const aiDataRouter = require('./routes/ai-data')
const agentRouter = require('./routes/agent')
const qaRouter = require('./routes/qa')
const webRouter = require('./routes/web');
const notificationRouter = require('./routes/notifications');
const paymentRouter = require('./routes/payment');
const productsRouter = require('./routes/products');

const app = express();
app.set('trust proxy', 1);

const corsOrigin = process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '50mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: '请求过于频繁，请稍后再试' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: '尝试次数过多，请15分钟后再试' }
});

app.use('/api/', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/reset-password', authLimiter);
app.use('/api/send-code', authLimiter);

app.get('/', (req, res) => res.redirect('/admin'));
app.use('/api/forum', forumRouter);
app.use('/api/ai/data', aiDataRouter)
app.use('/api/ai/agent', agentRouter)
app.use('/api/ai/qa', qaRouter)
app.use('/api/ai', aiRouter);
app.use('/api/ai/web', webRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/products', productsRouter);
app.use('/api', authRouter);
app.use('/api', agreementRouter);

app.get('/admin', (req, res) => {
  res.sendFile(require('path').join(__dirname, 'admin.html'));
});

process.on('uncaughtException', (err) => {
  console.error('[致命错误]', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[未处理的Promise拒绝]', reason)
})

app.use(handleMulterError);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => initAiTables())
  .then(() => {
    const server = http.createServer(app);

    const wss = new WebSocket.Server({ server, path: '/ws' });

    const clients = new Map();

    wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const token = url.searchParams.get('token');
      let userId = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
        } catch (e) {
          ws.close(4001, 'Token 无效或已过期');
          return;
        }
      }

      const clientInfo = { ws, userId };
      const clientId = Symbol();
      clients.set(clientId, clientInfo);

      ws.on('close', () => {
        clients.delete(clientId);
      });

      ws.on('error', () => {
        clients.delete(clientId);
      });
    });

    function broadcastToClients(notification) {
      const payload = JSON.stringify({ type: 'notification', data: notification });
      for (const { ws, userId: uid } of clients.values()) {
        if (ws.readyState === WebSocket.OPEN) {
          if (notification.user_id === null || notification.user_id === uid) {
            ws.send(payload);
          }
        }
      }
    }

    notificationRouter.setBroadcastCallback(broadcastToClients);

    server.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });

    const keepAlive = setInterval(() => {
      server.getConnections((err, count) => {});
    }, 30000);
    server.on('close', () => clearInterval(keepAlive));
  })
  .catch((err) => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  });
