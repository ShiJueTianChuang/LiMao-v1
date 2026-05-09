const { spawn } = require('child_process');

console.log('启动后端服务器...');
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('启动失败:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`后端服务器退出，代码: ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('关闭后端服务器...');
  server.kill('SIGINT');
});
