require('dotenv').config();
const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.163.com',
    port: parseInt(process.env.MAIL_PORT) || 465,
    secure: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
}

async function sendVerificationCode(toEmail, code) {
  const html = `
    <div style="max-width:480px;margin:0 auto;background:#0a1628;border-radius:12px;overflow:hidden;font-family:'Microsoft YaHei',sans-serif;">
      <div style="background:linear-gradient(135deg,#1a6dd4,#409eff);padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:4px;">LIMAO SYSTEM</h1>
        <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:12px;letter-spacing:2px;">安全验证码</p>
      </div>
      <div style="padding:32px;text-align:center;">
        <p style="color:#a0beee;font-size:14px;margin-bottom:20px;">您正在进行身份验证，验证码为：</p>
        <div style="display:inline-block;background:rgba(64,158,255,0.1);border:1px dashed rgba(64,158,255,0.4);border-radius:8px;padding:14px 40px;margin-bottom:20px;">
          <span style="font-size:32px;font-weight:bold;color:#409eff;letter-spacing:10px;">${code}</span>
        </div>
        <p style="color:rgba(160,190,230,0.5);font-size:12px;">验证码有效期为5分钟，请尽快使用</p>
        <p style="color:rgba(160,190,230,0.3);font-size:11px;margin-top:16px;">如非本人操作，请忽略此邮件</p>
      </div>
      <div style="border-top:1px solid rgba(64,158,255,0.1);padding:16px;text-align:center;">
        <p style="color:rgba(64,158,255,0.3);font-size:11px;margin:0;">© 2026 LIMAO SYSTEM · 安全加密通道</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"LIMAO SYSTEM" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: '【LIMAO SYSTEM】身份验证码',
    html
  };

  const transporter = createTransporter();
  await transporter.sendMail(mailOptions);
  transporter.close();
}

module.exports = { sendVerificationCode };
