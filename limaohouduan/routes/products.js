const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware');
const { CATEGORIES } = require('../config');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

const PRODUCT_CATEGORY_GROUPS = [
  { label: '全部', children: ['全部'] },
  { label: '小程序', children: ['微信小程序', '支付宝小程序', '百度小程序', '抖音小程序'] },
  { label: 'APP', children: ['APP：安卓', 'APP：苹果', 'APP：鸿蒙'] },
  { label: '软件', children: ['软件：Windows', '软件：Linux', '软件：macOS'] },
  { label: '网站', children: ['网站：网页'] }
];

const PRODUCT_CATEGORY_ALIASES = {
  '小程序': ['小程序', '微信小程序', '支付宝小程序', '百度小程序', '抖音小程序'],
  '微信小程序': ['微信小程序'],
  '支付宝小程序': ['支付宝小程序'],
  '百度小程序': ['百度小程序'],
  '抖音小程序': ['抖音小程序'],
  'APP': ['APP', '安卓', '苹果', '鸿蒙', 'APP：安卓', 'APP：苹果', 'APP：鸿蒙'],
  'APP：安卓': ['APP：安卓', '安卓'],
  'APP：苹果': ['APP：苹果', '苹果'],
  'APP：鸿蒙': ['APP：鸿蒙', '鸿蒙'],
  '软件': ['软件', '软件：Windows', '软件：Linux', '软件：macOS', 'Windows', 'Linux', 'macOS', 'Mac'],
  '软件：Windows': ['软件：Windows', 'Windows'],
  '软件：Linux': ['软件：Linux', 'Linux'],
  '软件：macOS': ['软件：macOS', 'macOS', 'Mac'],
  '网站': ['网站', '网站：网页', '网址', '网页'],
  '网站：网页': ['网站：网页', '网址', '网页']
};

const PRODUCT_CATEGORY_CANONICAL_MAP = {
  '安卓': 'APP：安卓',
  '苹果': 'APP：苹果',
  '鸿蒙': 'APP：鸿蒙',
  'Windows': '软件：Windows',
  'Linux': '软件：Linux',
  'macOS': '软件：macOS',
  'Mac': '软件：macOS',
  '网址': '网站：网页',
  '网页': '网站：网页'
};

function normalizeProductCategory(category) {
  if (typeof category !== 'string') return category;
  const normalized = category.trim();
  if (!normalized) return '';
  return PRODUCT_CATEGORY_CANONICAL_MAP[normalized] || normalized;
}

function expandProductCategory(category) {
  if (!category || category === 'all') return [];
  if (category.includes(',')) {
    return Array.from(new Set(category.split(',').map(item => normalizeProductCategory(item)).filter(Boolean)));
  }
  const normalized = normalizeProductCategory(category);
  return PRODUCT_CATEGORY_ALIASES[normalized] || [normalized];
}

router.get('/', asyncHandler(async (req, res) => {
  const category = req.query.category || '';
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  let where = 'WHERE is_active = 1';
  const params = [];
  if (category && category !== 'all') {
    const categoryList = expandProductCategory(category);
    if (categoryList.length === 1) {
      where += ' AND category = ?';
      params.push(categoryList[0]);
    } else {
      const placeholders = categoryList.map(() => '?').join(',');
      where += ` AND category IN (${placeholders})`;
      params.push(...categoryList);
    }
  }

  const [products] = await pool.query(
    `SELECT * FROM products ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const [total] = await pool.query(`SELECT COUNT(*) AS count FROM products ${where}`, params);

  res.json({
    success: true,
    products: products.map(p => ({
      ...p,
      images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [],
      tags: p.tags ? (typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags) : []
    })),
    total: total[0].count,
    page,
    pageSize
  });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  res.json({ success: true, categories: PRODUCT_CATEGORY_GROUPS });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: '产品不存在' });
  const p = rows[0];
  res.json({
    success: true,
    product: {
      ...p,
      images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [],
      tags: p.tags ? (typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags) : []
    }
  });
}));

router.post('/', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { name, description, category, product_type, price, original_price, images, demo_url, download_url, tags, sort_order } = req.body;
  if (!name || !price) return res.status(400).json({ success: false, message: '名称和价格必填' });
  const normalizedCategory = normalizeProductCategory(category || '');
  const [result] = await pool.query(
    'INSERT INTO products (name, description, category, product_type, price, original_price, images, demo_url, download_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description || '', normalizedCategory, product_type || 'source', price, original_price || null,
     images ? JSON.stringify(images) : null, demo_url || null, download_url || null,
     tags ? JSON.stringify(tags) : null, sort_order || 0]
  );
  res.json({ success: true, id: result.insertId });
}));

router.put('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { name, description, category, product_type, price, original_price, images, demo_url, download_url, tags, sort_order, is_active } = req.body;
  const normalizedCategory = category === undefined ? undefined : normalizeProductCategory(category);
  await pool.query(
    'UPDATE products SET name=COALESCE(?,name), description=COALESCE(?,description), category=COALESCE(?,category), product_type=COALESCE(?,product_type), price=COALESCE(?,price), original_price=COALESCE(?,original_price), images=COALESCE(?,images), demo_url=COALESCE(?,demo_url), download_url=COALESCE(?,download_url), tags=COALESCE(?,tags), sort_order=COALESCE(?,sort_order), is_active=COALESCE(?,is_active) WHERE id=?',
    [name, description, normalizedCategory, product_type, price, original_price,
     images ? JSON.stringify(images) : undefined, demo_url, download_url,
     tags ? JSON.stringify(tags) : undefined, sort_order, is_active, req.params.id]
  );
  res.json({ success: true });
}));

router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

module.exports = router;
