require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

const DB_NAME = process.env.DB_NAME || 'limao_system';

const pool = mysql.createPool({
  ...dbConfig,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  const connection = await mysql.createConnection(dbConfig);

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await connection.query(`USE \`${DB_NAME}\``);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) DEFAULT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      nickname VARCHAR(50) DEFAULT NULL,
      avatar VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login_device VARCHAR(255) DEFAULT NULL,
      last_login_ip VARCHAR(45) DEFAULT NULL,
      last_login_time TIMESTAMP NULL DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS agreements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(20) NOT NULL UNIQUE,
      title VARCHAR(100) NOT NULL,
      content LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    INSERT IGNORE INTO agreements (type, title, content) VALUES
    ('terms', '用户协议', '欢迎使用本平台。请在使用前仔细阅读以下条款...'),
    ('privacy', '隐私政策', '我们重视您的隐私。本隐私政策说明我们如何收集、使用和保护您的个人信息...')
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_agreements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      agreed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_agreements_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      mode VARCHAR(20) NOT NULL,
      model VARCHAR(100),
      tokens INT DEFAULT 0,
      image_count INT DEFAULT 0,
      uses_own_key TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ai_usage_user (user_id),
      INDEX idx_ai_usage_mode (mode),
      INDEX idx_ai_usage_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await connection.query('ALTER TABLE ai_usage_logs ADD COLUMN image_count INT DEFAULT 0')
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e
  }

  try {
    await connection.query('ALTER TABLE ai_usage_logs ADD COLUMN uses_own_key TINYINT(1) DEFAULT 0')
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(6) NOT NULL,
      type ENUM('register', 'login', 'reset') NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) DEFAULT '综合',
      project_category VARCHAR(50) DEFAULT NULL,
      project_name VARCHAR(100) DEFAULT NULL,
      is_featured TINYINT(1) DEFAULT 0,
      author_id INT NOT NULL,
      images TEXT DEFAULT NULL,
      source_link_github VARCHAR(500) DEFAULT NULL,
      source_link_gitee VARCHAR(500) DEFAULT NULL,
      source_link_aliyun VARCHAR(500) DEFAULT NULL,
      source_link_baidu VARCHAR(500) DEFAULT NULL,
      source_link_tencent VARCHAR(500) DEFAULT NULL,
      source_link_local VARCHAR(500) DEFAULT NULL,
      view_count INT DEFAULT 0,
      is_deleted TINYINT(1) DEFAULT 0,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await connection.query('ALTER TABLE posts ADD COLUMN is_deleted TINYINT(1) DEFAULT 0');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }
  try {
    await connection.query('ALTER TABLE comments ADD COLUMN source_link_tencent VARCHAR(500) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  try {
    await connection.query('ALTER TABLE comments ADD COLUMN like_count INT DEFAULT 0');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      comment_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uk_comment_user (comment_id, user_id),
      INDEX idx_comment_likes_comment (comment_id),
      INDEX idx_comment_likes_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS comment_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      comment_id INT NOT NULL,
      user_id INT NOT NULL,
      reason ENUM('harassment', 'spam', 'inappropriate', 'fake', 'copyright', 'other') NOT NULL,
      detail TEXT,
      status ENUM('pending', 'processed', 'dismissed') DEFAULT 'pending',
      reviewed_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_report_comment (comment_id),
      INDEX idx_report_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await connection.query('ALTER TABLE comment_reports ADD COLUMN reviewed_at TIMESTAMP NULL DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  try {
    await connection.query('ALTER TABLE posts ADD COLUMN source_link_local VARCHAR(500) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  try {
    await connection.query('ALTER TABLE posts ADD COLUMN like_count INT DEFAULT 0');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  try {
    await connection.query('ALTER TABLE posts ADD COLUMN price DECIMAL(10,2) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  try {
    await connection.query('ALTER TABLE posts ADD COLUMN original_price DECIMAL(10,2) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  try {
    await connection.query("ALTER TABLE posts ADD COLUMN product_type ENUM('free', 'source', 'custom') DEFAULT 'free'");
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) DEFAULT '',
      product_type ENUM('source', 'custom') NOT NULL DEFAULT 'source',
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2) DEFAULT NULL,
      images TEXT DEFAULT NULL,
      demo_url VARCHAR(500) DEFAULT NULL,
      download_url VARCHAR(500) DEFAULT NULL,
      tags VARCHAR(500) DEFAULT NULL,
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_products_category (category),
      INDEX idx_products_active (is_active),
      INDEX idx_products_sort (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_no VARCHAR(64) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_type ENUM('source', 'custom') NOT NULL DEFAULT 'source',
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('pending', 'paid', 'delivered', 'refunded', 'closed') DEFAULT 'pending',
      pay_method ENUM('alipay_qr', 'alipay_h5') DEFAULT NULL,
      trade_no VARCHAR(128) DEFAULT NULL,
      paid_at TIMESTAMP NULL DEFAULT NULL,
      delivered_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_orders_user (user_id),
      INDEX idx_orders_product (product_id),
      INDEX idx_orders_status (status),
      INDEX idx_orders_order_no (order_no)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS post_favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uk_favorite_post_user (post_id, user_id),
      INDEX idx_favorites_post (post_id),
      INDEX idx_favorites_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uk_post_user (post_id, user_id),
      INDEX idx_post_likes_post (post_id),
      INDEX idx_post_likes_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      images TEXT DEFAULT NULL,
      ip_region VARCHAR(50) DEFAULT NULL,
      is_deleted TINYINT(1) DEFAULT 0,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await connection.query('ALTER TABLE comments ADD COLUMN is_deleted TINYINT(1) DEFAULT 0');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }
  try {
    await connection.query('ALTER TABLE comments ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
  }

  try {
    await connection.query('ALTER TABLE comments ADD COLUMN ip_region VARCHAR(50) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column')) throw e;
  }

  try {
    await connection.query('ALTER TABLE comments ADD COLUMN source_link_github VARCHAR(500) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column')) throw e;
  }
  try {
    await connection.query('ALTER TABLE comments ADD COLUMN source_link_gitee VARCHAR(500) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column')) throw e;
  }
  try {
    await connection.query('ALTER TABLE comments ADD COLUMN source_link_aliyun VARCHAR(500) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column')) throw e;
  }
  try {
    await connection.query('ALTER TABLE comments ADD COLUMN source_link_baidu VARCHAR(500) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column')) throw e;
  }
  try {
    await connection.query('ALTER TABLE comments ADD COLUMN source_link_tencent VARCHAR(500) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column')) throw e;
  }

  try {
    await connection.query('ALTER TABLE posts ADD COLUMN source_link_local VARCHAR(500) DEFAULT NULL');
  } catch (e) {
    if (!e.message.includes('Duplicate column')) throw e;
  }

  const [usersWithoutNickname] = await connection.query(
    'SELECT id FROM users WHERE nickname IS NULL OR nickname = ""'
  );
  for (const user of usersWithoutNickname) {
    const defaultNickname = '用户' + user.id.toString().slice(-4).padStart(4, '0');
    await connection.query('UPDATE users SET nickname = ? WHERE id = ?', [defaultNickname, user.id]);
  }

  await connection.end();
  console.log('数据库初始化完成');
}

async function initAiTables() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(500) NOT NULL DEFAULT '',
        content LONGTEXT,
        language VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_files_user (user_id),
        UNIQUE KEY uk_user_path (user_id, path(255))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    try {
      await conn.query(
        "ALTER TABLE agent_applications MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'revoked') DEFAULT 'pending'"
      )
    } catch (e) {
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        model_id VARCHAR(50) NOT NULL,
        api_key TEXT NOT NULL,
        api_base VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uk_user_model (user_id, model_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_workspaces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        workspace_data JSON,
        expanded_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS agent_invite_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        created_by INT NOT NULL,
        max_uses INT DEFAULT 1,
        used_count INT DEFAULT 0,
        quota_monthly INT DEFAULT 0,
        quota_total INT DEFAULT 0,
        expires_at TIMESTAMP NULL DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        note VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS agent_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        nickname VARCHAR(100) DEFAULT '',
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        invite_code_id INT DEFAULT NULL,
        reviewed_by INT DEFAULT NULL,
        reviewed_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (invite_code_id) REFERENCES agent_invite_codes(id) ON DELETE SET NULL,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS agent_quota_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        invite_code_id INT DEFAULT NULL,
        quota_type ENUM('monthly', 'total') DEFAULT 'monthly',
        used INT DEFAULT 0,
        period_start DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (invite_code_id) REFERENCES agent_invite_codes(id) ON DELETE SET NULL,
        INDEX idx_quota_user_period (user_id, period_start)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS qa_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        nickname VARCHAR(100) DEFAULT '',
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected', 'revoked') DEFAULT 'pending',
        reviewed_by INT DEFAULT NULL,
        reviewed_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS custom_ai_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        nickname VARCHAR(100) DEFAULT '',
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected', 'revoked') DEFAULT 'pending',
        reviewed_by INT DEFAULT NULL,
        reviewed_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        category VARCHAR(50) DEFAULT 'system',
        is_read TINYINT(1) DEFAULT 0,
        read_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notif_user (user_id),
        INDEX idx_notif_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS download_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        platform VARCHAR(50) NOT NULL,
        ip VARCHAR(45) DEFAULT NULL,
        ip_region VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_dl_post (post_id),
        INDEX idx_dl_platform (platform),
        INDEX idx_dl_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('AI数据表初始化完成');
  } catch (e) {
    console.error('AI数据表初始化失败:', e.message);
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDatabase, initAiTables };
