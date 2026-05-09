const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('错误: 环境变量 JWT_SECRET 未设置，请检查 .env 文件');
  process.exit(1);
}

const SOURCE_LINKS = ['github', 'gitee', 'aliyun', 'baidu', 'tencent', 'local'];

const CATEGORIES = ['微信小程序', '支付宝小程序', '百度小程序', '抖音小程序', 'APP：安卓', 'APP：苹果', 'APP：鸿蒙', '软件：Windows', '软件：Linux', '网站：网页'];

const CATEGORY_EMOJIS = {
  '微信小程序': '📱', '支付宝小程序': '📲', '百度小程序': '🔵', '抖音小程序': '🎵', 'APP：安卓': '📲', 'APP：苹果': '🍎', 'APP：鸿蒙': '🔵', '软件：Windows': '🪟', '软件：Linux': '🐧', '网站：网页': '🌐'
};

const CATEGORY_COLORS = {
  '微信小程序': 'linear-gradient(135deg, #07c160, #06ad56)',
  '支付宝小程序': 'linear-gradient(135deg, #1677FF, #0958d9)',
  '百度小程序': 'linear-gradient(135deg, #DEDEDE, #b0b0b0)',
  '抖音小程序': 'linear-gradient(135deg, #00A9FF, #0088cc)',
  'APP：安卓': 'linear-gradient(135deg, #3ddc84, #2fa866)',
  'APP：苹果': 'linear-gradient(135deg, #1d2129, #4e5969)',
  'APP：鸿蒙': 'linear-gradient(135deg, #D40000, #a30000)',
  '软件：Windows': 'linear-gradient(135deg, #00A4EF, #0078D4)',
  '软件：Linux': 'linear-gradient(135deg, #000000, #333333)',
  '网站：网页': 'linear-gradient(135deg, #e6a23c, #d48806)'
};

module.exports = {
  JWT_SECRET,
  SOURCE_LINKS,
  CATEGORIES,
  CATEGORY_EMOJIS,
  CATEGORY_COLORS
};
