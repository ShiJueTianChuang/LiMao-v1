const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('../middleware');
const { createNotification } = require('./notifications');

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeLikePattern(str) {
  return str.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
const { default: IP2Region } = require('ip2region');
const { pool } = require('../db');
const {
  SOURCE_LINKS, CATEGORIES, CATEGORY_EMOJIS, CATEGORY_COLORS, JWT_SECRET
} = require('../config');

const router = express.Router();

const ipSearcher = new IP2Region();

function getIpRegion(ip) {
  try {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) return '本地';
    const geo = ipSearcher.ipv4.search(ip);
    if (!geo) return '';
    const parts = [geo.province, geo.city].filter(p => p && p !== '0');
    const region = parts.join('·').replace(/省|市/g, '');
    return region || '';
  } catch {
    return '';
  }
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.connection?.remoteAddress || '127.0.0.1');
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  return ip;
}

const UPLOAD_DIRS = {
  comments: path.join(__dirname, 'uploads', 'comments'),
  posts: path.join(__dirname, 'uploads', 'posts'),
  avatars: path.join(__dirname, 'uploads', 'avatars'),
  local: path.join(__dirname, 'uploads', 'local')
};

Object.values(UPLOAD_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const IMAGE_FILTER = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
  cb(ok ? null : new Error('只支持图片文件（jpg, jpeg, png, gif, webp）'), ok);
};

function createStorage(prefix, dirKey) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIRS[dirKey]),
    filename: (req, file, cb) => {
      cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
  });
}

const uploadAvatar = multer({
  storage: createStorage('avatar', 'avatars'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: IMAGE_FILTER
});

const uploadComment = multer({
  storage: createStorage('comment', 'comments'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: IMAGE_FILTER
});

const uploadPost = multer({
  storage: createStorage('post', 'posts'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: IMAGE_FILTER
});

const LOCAL_FILE_FILTER = (req, file, cb) => {
  const allowed = /zip|rar|7z|tar|gz|xz|bz2|tgz|apk|ipa|exe|msi|dmg|pkg|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv|json|xml|yaml|yml|md|py|js|ts|java|c|cpp|h|hpp|cs|go|rs|swift|kt|dart|vue|jsx|tsx|html|css|scss|less|sql|sh|bat|ps1|pkg|deb|rpm/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  cb(allowed.test(ext) ? null : new Error('不支持的文件类型'), allowed.test(ext));
};

const uploadLocal = multer({
  storage: createStorage('local', 'local'),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: LOCAL_FILE_FILTER
});

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function parseImages(images) {
  return (images && typeof images === 'string' && images.trim()) ? JSON.parse(images) : [];
}

function getAuthorName(row) {
  if (row.author_nickname) return row.author_nickname;
  return '用户' + (row.author_id || '').toString().slice(-4).padStart(4, '0');
}

function mapSourceLinks(row) {
  const links = {};
  SOURCE_LINKS.forEach(key => {
    links[`source_link_${key}`] = row[`source_link_${key}`] || null;
  });
  return links;
}

function extractSourceLinksFromBody(body) {
  const links = {};
  SOURCE_LINKS.forEach(key => {
    links[`source_link_${key}`] = body[`source_link_${key}`] || null;
  });
  return links;
}

function sourceLinkSelectFields(prefix = 'p') {
  return SOURCE_LINKS.map(key => `${prefix}.source_link_${key}`).join(', ');
}

function sourceLinkPlaceholders() {
  return SOURCE_LINKS.map(() => '?').join(', ');
}

router.get('/config', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    config: { CATEGORIES, SOURCE_LINKS, CATEGORY_EMOJIS, CATEGORY_COLORS }
  });
}));

router.get('/posts', asyncHandler(async (req, res) => {
  const { category, search, page = 1, pageSize = 10, showDeleted } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const whereClauses = [];
  const params = [];

  if (!showDeleted || showDeleted !== 'true') {
    whereClauses.push('p.is_deleted = 0');
  }

  if (category && category !== '全部') {
    whereClauses.push('p.category = ?');
    params.push(category);
  }
  if (search && search.trim()) {
    const escapedSearch = escapeLikePattern(search.trim())
    const searchPattern = `%${escapedSearch}%`;
    whereClauses.push('(p.title LIKE ? OR p.content LIKE ? OR p.project_name LIKE ? OR u.nickname LIKE ? OR u.email LIKE ?)');
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const [posts] = await pool.query(
    `SELECT p.id, p.title, p.content, p.category, p.project_name, p.is_featured, p.author_id, p.created_at, p.updated_at, p.view_count, p.like_count, p.images, p.is_deleted, p.deleted_at,
      ${sourceLinkSelectFields()},
      u.email AS author_email, u.nickname AS author_nickname, u.avatar AS author_avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = 0) AS comment_count
     FROM posts p JOIN users u ON p.author_id = u.id
     ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), offset]
  );

  const [total] = await pool.query(`SELECT COUNT(*) AS count FROM posts p JOIN users u ON p.author_id = u.id ${where}`, params);

  res.json({
    success: true,
    posts: posts.map(p => ({
      ...p,
      author_name: getAuthorName(p),
      author_avatar: p.author_avatar || null,
      images: parseImages(p.images),
      is_deleted: p.is_deleted === 1,
      ...mapSourceLinks(p)
    })),
    total: total[0].count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}));

router.get('/posts/:id', asyncHandler(async (req, res) => {
  const [posts] = await pool.query(
    `SELECT p.id, p.title, p.content, p.category, p.project_name, p.is_featured, p.author_id, p.images, p.view_count, p.like_count, p.created_at, p.updated_at, p.is_deleted, p.deleted_at,
      ${sourceLinkSelectFields()},
      u.email AS author_email, u.nickname AS author_nickname, u.avatar AS author_avatar
     FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?`,
    [req.params.id]
  );
  if (posts.length === 0) return res.status(404).json({ success: false, message: '帖子不存在' });

  const post = posts[0];
  
  let hasLiked = false;
  let currentUserId = null;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
      currentUserId = decoded.id;
      const [likeRows] = await pool.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [req.params.id, decoded.id]);
      hasLiked = likeRows.length > 0;
    }
  } catch (e) {
    // 忽略
  }

  const [comments] = await pool.query(
    `SELECT c.*, u.email AS user_email, u.nickname AS user_nickname, u.avatar AS user_avatar
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ? ORDER BY c.created_at ASC`,
    [req.params.id]
  );

  let commentLikes = {};
  if (currentUserId && comments.length > 0) {
    const commentIds = comments.map(c => c.id);
    const placeholders = commentIds.map(() => '?').join(',');
    const [likeRows] = await pool.query(
      `SELECT comment_id FROM comment_likes WHERE comment_id IN (${placeholders}) AND user_id = ?`,
      [...commentIds, currentUserId]
    );
    likeRows.forEach(r => { commentLikes[r.comment_id] = true; });
  }

  const [commentLikeCounts] = await pool.query(
    `SELECT cl.comment_id, COUNT(*) as count FROM comment_likes cl JOIN comments c ON cl.comment_id = c.id WHERE c.post_id = ? GROUP BY cl.comment_id`,
    [req.params.id]
  );
  const commentLikeCountMap = {};
  commentLikeCounts.forEach(r => { commentLikeCountMap[r.comment_id] = r.count; });
  let isAdmin = false;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
      const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [decoded.id]);
      isAdmin = users.length > 0 && users[0].role === 'admin';
    }
  } catch (e) {
  }
  if (post.is_deleted === 1 && !isAdmin) {
    return res.json({
      success: true,
      post: {
        id: post.id,
        title: '[已删除]',
        content: '',
        category: post.category,
        project_name: null,
        is_featured: false,
        author_id: post.author_id,
        images: [],
        is_deleted: true,
        deleted_at: post.deleted_at,
        author_name: getAuthorName(post),
        author_avatar: post.author_avatar || null,
        comments: []
      }
    });
  }

  if (post.is_deleted !== 1) {
    await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
  }

  res.json({
    success: true,
    post: {
      ...post,
      author_name: getAuthorName(post),
      author_avatar: post.author_avatar || null,
      images: parseImages(post.images),
      like_count: post.like_count || 0,
      has_liked: hasLiked,
      is_deleted: post.is_deleted === 1,
      comments: comments.map(c => {
        if (c.is_deleted) {
          return {
            id: c.id,
            post_id: c.post_id,
            user_id: c.user_id,
            user_name: c.user_nickname || ('用户' + c.user_id.toString().slice(-4).padStart(4, '0')),
            user_avatar: c.user_avatar || null,
            content: '',
            images: [],
            ip_region: '',
            is_deleted: true,
            deleted_at: c.deleted_at,
            created_at: c.created_at,
            like_count: commentLikeCountMap[c.id] || 0,
            has_liked: !!commentLikes[c.id]
          };
        }
        return {
          ...c,
          content: c.content,
          user_name: c.user_nickname || ('用户' + c.user_id.toString().slice(-4).padStart(4, '0')),
          user_avatar: c.user_avatar || null,
          images: parseImages(c.images),
          ip_region: c.ip_region || '',
          is_deleted: false,
          like_count: commentLikeCountMap[c.id] || 0,
          has_liked: !!commentLikes[c.id],
          ...mapSourceLinks(c)
        };
      })
    }
  });
}));

router.post('/posts', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { title, content, category, project_name, images, is_featured } = req.body;
  if (!title || !content) return res.status(400).json({ success: false, message: '标题和内容不能为空' });
  if (title.length > 255) return res.status(400).json({ success: false, message: '标题不能超过255个字符' });
  if (content.length > 50000) return res.status(400).json({ success: false, message: '内容不能超过50000个字符' });

  const sourceLinks = extractSourceLinksFromBody(req.body);
  const sourceLinkValues = SOURCE_LINKS.map(key => sourceLinks[`source_link_${key}`]);

  const [result] = await pool.query(
    `INSERT INTO posts (title, content, category, project_name, is_featured, author_id, images, ${SOURCE_LINKS.map(k => 'source_link_' + k).join(', ')})
     VALUES (?, ?, ?, ?, ?, ?, ?, ${sourceLinkPlaceholders()})`,
    [title, content, category || '小程序', project_name || null, is_featured ? 1 : 0, req.user.id, images ? JSON.stringify(images) : null, ...sourceLinkValues]
  );
  res.json({ success: true, message: '发布成功', postId: result.insertId });
}));

router.post('/posts/upload', authMiddleware, adminMiddleware, uploadPost.array('images', 9), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: '请上传文件' });
  res.json({ success: true, urls: req.files.map(f => `/api/forum/uploads/posts/${f.filename}`) });
}));

router.put('/admin/posts/:id/feature', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { is_featured } = req.body;
  if (is_featured === undefined) return res.status(400).json({ success: false, message: '请指定精选状态' });
  await pool.query('UPDATE posts SET is_featured = ? WHERE id = ?', [is_featured ? 1 : 0, req.params.id]);
  res.json({ success: true, message: is_featured ? '已设为精选项目' : '已取消精选' });
}));

router.put('/posts/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { title, content, category, project_name, images, is_featured } = req.body;
  const sourceLinks = extractSourceLinksFromBody(req.body);
  const sourceLinkValues = SOURCE_LINKS.map(key => sourceLinks[`source_link_${key}`]);

  await pool.query(
    `UPDATE posts SET title = ?, content = ?, category = ?, project_name = ?, is_featured = ?, images = ?,
      ${SOURCE_LINKS.map(k => 'source_link_' + k + ' = ?').join(', ')}
     WHERE id = ?`,
    [title, content, category || '小程序', project_name || null, is_featured !== undefined ? (is_featured ? 1 : 0) : null, images ? JSON.stringify(images) : null, ...sourceLinkValues, req.params.id]
  );
  res.json({ success: true, message: '更新成功' });
}));

function deleteUploadedFiles(images) {
  if (!Array.isArray(images)) return;
  images.forEach(url => {
    if (typeof url !== 'string' || !url.startsWith('/api/forum/uploads/')) return;
    const relativePath = url.replace('/api/forum/', '');
    const filePath = path.join(__dirname, relativePath);
    const resolved = path.resolve(filePath);
    const uploadsDir = path.resolve(path.join(__dirname, 'uploads'));
    if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) return;
    fs.unlink(resolved, () => {});
  });
}

router.delete('/posts/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [posts] = await pool.query('SELECT is_deleted FROM posts WHERE id = ?', [req.params.id]);
  if (posts.length === 0) return res.status(404).json({ success: false, message: '帖子不存在' });
  if (posts[0].is_deleted === 1) return res.status(400).json({ success: false, message: '帖子已删除' });
  await pool.query('UPDATE posts SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: '删除成功' });
}));

router.post('/posts/:id/like', authMiddleware, asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const [posts] = await pool.query('SELECT id FROM posts WHERE id = ?', [postId]);
  if (posts.length === 0) return res.status(404).json({ success: false, message: '帖子不存在' });

  const [existingLikes] = await pool.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);

  if (existingLikes.length > 0) {
    await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    await pool.query('UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = ?', [postId]);
    const [updatedPost] = await pool.query('SELECT like_count FROM posts WHERE id = ?', [postId]);
    res.json({ success: true, liked: false, like_count: updatedPost[0]?.like_count || 0 });
  } else {
    await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
    await pool.query('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [postId]);
    const [updatedPost] = await pool.query('SELECT like_count FROM posts WHERE id = ?', [postId]);
    res.json({ success: true, liked: true, like_count: updatedPost[0]?.like_count || 0 });
  }
}));

router.get('/posts/likes/batch', authMiddleware, asyncHandler(async (req, res) => {
  const { post_ids } = req.query;
  if (!post_ids) return res.json({ success: true, likes: {} });

  let postIdList = [];
  try {
    postIdList = JSON.parse(post_ids);
  } catch {
    postIdList = post_ids.split(',').map(Number);
  }

  if (!postIdList.length) return res.json({ success: true, likes: {} });

  const placeholders = postIdList.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT post_id FROM post_likes WHERE post_id IN (${placeholders}) AND user_id = ?`,
    [...postIdList, req.user.id]
  );

  const likes = {};
  rows.forEach(r => { likes[r.post_id] = true; });
  res.json({ success: true, likes });
}));

router.post('/comments/:id/like', authMiddleware, asyncHandler(async (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;

  const [comments] = await pool.query('SELECT id FROM comments WHERE id = ?', [commentId]);
  if (comments.length === 0) return res.status(404).json({ success: false, message: '评论不存在' });

  const [existingLikes] = await pool.query('SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId]);

  if (existingLikes.length > 0) {
    await pool.query('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId]);
    await pool.query('UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = ?', [commentId]);
    const [updatedComment] = await pool.query('SELECT like_count FROM comments WHERE id = ?', [commentId]);
    res.json({ success: true, liked: false, like_count: updatedComment[0]?.like_count || 0 });
  } else {
    await pool.query('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, userId]);
    await pool.query('UPDATE comments SET like_count = like_count + 1 WHERE id = ?', [commentId]);
    const [updatedComment] = await pool.query('SELECT like_count FROM comments WHERE id = ?', [commentId]);
    res.json({ success: true, liked: true, like_count: updatedComment[0]?.like_count || 0 });
  }
}));

router.post('/comments/:id/report', authMiddleware, asyncHandler(async (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;
  const { reason, detail } = req.body;

  const validReasons = ['harassment', 'spam', 'inappropriate', 'fake', 'copyright', 'other'];
  if (!validReasons.includes(reason)) return res.status(400).json({ success: false, message: '无效的举报原因' });

  const [comments] = await pool.query('SELECT id, user_id FROM comments WHERE id = ?', [commentId]);
  if (comments.length === 0) return res.status(404).json({ success: false, message: '评论不存在' });

  const [existingReports] = await pool.query(
    'SELECT id FROM comment_reports WHERE comment_id = ? AND user_id = ? AND status = ?',
    [commentId, userId, 'pending']
  );
  if (existingReports.length > 0) return res.status(400).json({ success: false, message: '你已举报过此评论' });

  await pool.query(
    'INSERT INTO comment_reports (comment_id, user_id, reason, detail) VALUES (?, ?, ?, ?)',
    [commentId, userId, reason, detail || '']
  );

  res.json({ success: true, message: '举报已提交，我们将尽快处理' });
}));

router.put('/admin/posts/:id/restore', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [posts] = await pool.query('SELECT is_deleted FROM posts WHERE id = ?', [req.params.id]);
  if (posts.length === 0) return res.status(404).json({ success: false, message: '帖子不存在' });
  if (posts[0].is_deleted !== 1) return res.status(400).json({ success: false, message: '帖子未被删除' });
  await pool.query('UPDATE posts SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: '帖子已恢复' });
}));

router.delete('/admin/posts/:id/permanent', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [posts] = await pool.query('SELECT images FROM posts WHERE id = ?', [req.params.id]);
  if (posts.length === 0) return res.status(404).json({ success: false, message: '帖子不存在' });
  const images = parseImages(posts[0].images);
  deleteUploadedFiles(images);
  await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: '帖子已永久删除' });
}));

// 确保 comments 表有 source_link 列（服务器启动时执行一次）
async function ensureCommentColumns() {
  try {
    for (const key of SOURCE_LINKS) {
      const colName = `source_link_${key}`;
      try {
        await pool.query(`ALTER TABLE comments ADD COLUMN ${colName} VARCHAR(500) DEFAULT NULL`);
        console.log(`[数据库] 添加列 ${colName}`);
      } catch (e) {
        if (!e.message.includes('Duplicate column') && !e.message.includes('1060')) throw e;
      }
    }
  } catch (e) {
    console.error('[数据库] 确保评论表列失败:', e.message);
  }
}

// 启动时执行一次
ensureCommentColumns();

router.post('/posts/:id/comments', authMiddleware, asyncHandler(async (req, res) => {
  const { content, images } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ success: false, message: '评论内容不能为空' });
  if (content.length > 5000) return res.status(400).json({ success: false, message: '评论内容不能超过5000个字符' });
  const [posts] = await pool.query('SELECT id FROM posts WHERE id = ?', [req.params.id]);
  if (posts.length === 0) return res.status(404).json({ success: false, message: '帖子不存在' });
  const clientIp = getClientIp(req);
  const ipRegion = getIpRegion(clientIp);
  const sourceLinks = extractSourceLinksFromBody(req.body);
  const sourceLinkValues = SOURCE_LINKS.map(key => sourceLinks[`source_link_${key}`]);
  const [result] = await pool.query(
    `INSERT INTO comments (post_id, user_id, content, images, ip_region, ${SOURCE_LINKS.map(k => 'source_link_' + k).join(', ')})
     VALUES (?, ?, ?, ?, ?, ${sourceLinkPlaceholders()})`,
    [req.params.id, req.user.id, content.trim(), images ? JSON.stringify(images) : null, ipRegion, ...sourceLinkValues]
  );

  const [postInfo] = await pool.query('SELECT title, author_id FROM posts WHERE id = ?', [req.params.id]);
  if (postInfo.length > 0 && postInfo[0].author_id !== req.user.id) {
    await createNotification({
      user_id: postInfo[0].author_id,
      title: '帖子收到新评论',
      content: `用户"${req.user.nickname || req.user.email}"评论了你的帖子"${postInfo[0].title}"`,
      type: 'info',
      category: 'forum'
    });
  }

  res.json({ success: true, message: '评论成功', commentId: result.insertId });
}));

router.post('/comments/upload', authMiddleware, uploadComment.array('images', 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: '请上传文件' });
  res.json({ success: true, urls: req.files.map(f => `/api/forum/uploads/comments/${f.filename}`) });
}));

router.delete('/comments/:id', authMiddleware, asyncHandler(async (req, res) => {
  const [comments] = await pool.query('SELECT user_id, images, is_deleted FROM comments WHERE id = ?', [req.params.id]);
  if (comments.length === 0) return res.status(404).json({ success: false, message: '评论不存在' });
  if (comments[0].is_deleted) return res.status(400).json({ success: false, message: '评论已删除' });
  if (comments[0].user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: '无权删除此评论' });
  await pool.query('UPDATE comments SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: '删除成功' });
}));

router.put('/admin/comments/:id/restore', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [comments] = await pool.query('SELECT is_deleted FROM comments WHERE id = ?', [req.params.id]);
  if (comments.length === 0) return res.status(404).json({ success: false, message: '评论不存在' });
  if (!comments[0].is_deleted) return res.status(400).json({ success: false, message: '评论未被删除' });
  await pool.query('UPDATE comments SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: '评论已恢复' });
}));

router.delete('/admin/comments/:id/permanent', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [comments] = await pool.query('SELECT images FROM comments WHERE id = ?', [req.params.id]);
  if (comments.length === 0) return res.status(404).json({ success: false, message: '评论不存在' });
  deleteUploadedFiles(parseImages(comments[0].images));
  await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: '评论已永久删除' });
}));

router.post('/posts/:id/favorite', authMiddleware, asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const [posts] = await pool.query('SELECT id FROM posts WHERE id = ?', [postId]);
  if (posts.length === 0) return res.status(404).json({ success: false, message: '帖子不存在' });

  const [existing] = await pool.query('SELECT id FROM post_favorites WHERE post_id = ? AND user_id = ?', [postId, userId]);

  if (existing.length > 0) {
    await pool.query('DELETE FROM post_favorites WHERE post_id = ? AND user_id = ?', [postId, userId]);
    res.json({ success: true, favorited: false });
  } else {
    await pool.query('INSERT INTO post_favorites (post_id, user_id) VALUES (?, ?)', [postId, userId]);
    res.json({ success: true, favorited: true });
  }
}));

router.get('/posts/favorites/batch', authMiddleware, asyncHandler(async (req, res) => {
  const { post_ids } = req.query;
  if (!post_ids) return res.json({ success: true, favorites: {} });

  let postIdList = [];
  try {
    postIdList = JSON.parse(post_ids);
  } catch {
    postIdList = post_ids.split(',').map(Number);
  }

  if (!postIdList.length) return res.json({ success: true, favorites: {} });

  const placeholders = postIdList.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT post_id FROM post_favorites WHERE post_id IN (${placeholders}) AND user_id = ?`,
    [...postIdList, req.user.id]
  );

  const favorites = {};
  rows.forEach(r => { favorites[r.post_id] = true; });
  res.json({ success: true, favorites });
}));

router.get('/user/posts', authMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const [posts] = await pool.query(
    `SELECT p.id, p.title, p.content, p.category, p.project_name, p.created_at, p.view_count, p.like_count, p.images, p.is_deleted,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = 0) AS comment_count
     FROM posts p WHERE p.author_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, pageSize, offset]
  );
  const [total] = await pool.query('SELECT COUNT(*) AS count FROM posts WHERE author_id = ?', [req.user.id]);

  res.json({
    success: true,
    posts: posts.map(p => ({
      ...p,
      images: parseImages(p.images),
      is_deleted: p.is_deleted === 1
    })),
    total: total[0].count,
    page,
    pageSize
  });
}));

router.get('/user/liked-posts', authMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const [posts] = await pool.query(
    `SELECT p.id, p.title, p.content, p.category, p.project_name, p.created_at, p.view_count, p.like_count, p.images,
      u.nickname AS author_nickname, u.avatar AS author_avatar,
      pl.created_at AS liked_at,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = 0) AS comment_count
     FROM post_likes pl JOIN posts p ON pl.post_id = p.id JOIN users u ON p.author_id = u.id
     WHERE pl.user_id = ? AND p.is_deleted = 0
     ORDER BY pl.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, pageSize, offset]
  );
  const [total] = await pool.query(
    'SELECT COUNT(*) AS count FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE pl.user_id = ? AND p.is_deleted = 0',
    [req.user.id]
  );

  res.json({
    success: true,
    posts: posts.map(p => ({
      ...p,
      author_name: getAuthorName(p),
      author_avatar: p.author_avatar || null,
      images: parseImages(p.images),
      liked_at: p.liked_at
    })),
    total: total[0].count,
    page,
    pageSize
  });
}));

router.get('/user/favorite-posts', authMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const [posts] = await pool.query(
    `SELECT p.id, p.title, p.content, p.category, p.project_name, p.created_at, p.view_count, p.like_count, p.images,
      u.nickname AS author_nickname, u.avatar AS author_avatar,
      pf.created_at AS favorited_at,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = 0) AS comment_count
     FROM post_favorites pf JOIN posts p ON pf.post_id = p.id JOIN users u ON p.author_id = u.id
     WHERE pf.user_id = ? AND p.is_deleted = 0
     ORDER BY pf.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, pageSize, offset]
  );
  const [total] = await pool.query(
    'SELECT COUNT(*) AS count FROM post_favorites pf JOIN posts p ON pf.post_id = p.id WHERE pf.user_id = ? AND p.is_deleted = 0',
    [req.user.id]
  );

  res.json({
    success: true,
    posts: posts.map(p => ({
      ...p,
      author_name: getAuthorName(p),
      author_avatar: p.author_avatar || null,
      images: parseImages(p.images),
      favorited_at: p.favorited_at
    })),
    total: total[0].count,
    page,
    pageSize
  });
}));

router.get('/user/comments', authMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const [comments] = await pool.query(
    `SELECT c.id, c.content, c.images, c.created_at, c.like_count, c.is_deleted,
      p.id AS post_id, p.title AS post_title
     FROM comments c JOIN posts p ON c.post_id = p.id
     WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, pageSize, offset]
  );
  const [total] = await pool.query('SELECT COUNT(*) AS count FROM comments WHERE user_id = ?', [req.user.id]);

  res.json({
    success: true,
    comments: comments.map(c => ({
      ...c,
      images: parseImages(c.images),
      is_deleted: c.is_deleted === 1
    })),
    total: total[0].count,
    page,
    pageSize
  });
}));

router.get('/user/info', authMiddleware, asyncHandler(async (req, res) => {
  const [users] = await pool.query('SELECT id, email, role, nickname, avatar FROM users WHERE id = ?', [req.user.id]);
  if (users.length === 0) return res.status(404).json({ success: false, message: '用户不存在' });

  const [postCount] = await pool.query('SELECT COUNT(*) AS count FROM posts WHERE author_id = ? AND is_deleted = 0', [req.user.id]);
  const [commentCount] = await pool.query('SELECT COUNT(*) AS count FROM comments WHERE user_id = ? AND is_deleted = 0', [req.user.id]);
  const [likeCount] = await pool.query('SELECT COUNT(*) AS count FROM post_likes WHERE user_id = ?', [req.user.id]);
  const [favoriteCount] = await pool.query('SELECT COUNT(*) AS count FROM post_favorites WHERE user_id = ?', [req.user.id]);

  res.json({
    success: true,
    user: users[0],
    stats: {
      posts: postCount[0].count,
      comments: commentCount[0].count,
      likes: likeCount[0].count,
      favorites: favoriteCount[0].count
    }
  });
}));

router.put('/user/profile', authMiddleware, asyncHandler(async (req, res) => {
  const { nickname } = req.body;
  if (nickname !== undefined) {
    if (!nickname || !nickname.trim()) return res.status(400).json({ success: false, message: '昵称不能为空' });
    await pool.query('UPDATE users SET nickname = ? WHERE id = ?', [nickname.trim(), req.user.id]);
  }
  const [users] = await pool.query('SELECT id, email, role, nickname, avatar FROM users WHERE id = ?', [req.user.id]);
  res.json({ success: true, message: '资料更新成功', user: users[0] });
}));

router.post('/user/avatar', authMiddleware, uploadAvatar.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: '请上传文件' });
  const avatarUrl = `/api/forum/uploads/avatars/${req.file.filename}`;
  await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
  const [users] = await pool.query('SELECT id, email, role, nickname, avatar FROM users WHERE id = ?', [req.user.id]);
  res.json({ success: true, url: avatarUrl, user: users[0], message: '头像上传成功' });
}));

router.get('/admin/users', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  const [users] = await pool.query('SELECT id, email, role, nickname, avatar, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', [pageSize, offset]);
  const [total] = await pool.query('SELECT COUNT(*) AS count FROM users');
  res.json({ success: true, users, total: total[0].count, page, pageSize });
}));

router.put('/admin/users/:id/role', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, message: '无效的角色' });
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ success: true, message: '角色更新成功' });
}));

router.delete('/admin/users/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ success: false, message: '不能删除自己' });
  const userId = req.params.id;
  await pool.query('DELETE FROM comments WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM user_api_keys WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM user_files WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM user_workspaces WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM users WHERE id = ?', [userId]);
  res.json({ success: true, message: '用户已删除' });
}));

router.get('/admin/comments', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  const showDeleted = req.query.showDeleted === 'true';
  const [comments] = await pool.query(
    `SELECT c.id, c.content, c.images, c.ip_region, c.is_deleted, c.deleted_at, c.created_at,
      ${SOURCE_LINKS.map(k => 'c.source_link_' + k).join(', ')},
      u.email AS user_email, u.nickname AS user_nickname, u.avatar AS user_avatar,
      p.title AS post_title, p.id AS post_id
     FROM comments c JOIN users u ON c.user_id = u.id JOIN posts p ON c.post_id = p.id
     ${showDeleted ? '' : 'WHERE c.is_deleted = 0'}
     ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );
  const [total] = await pool.query(
    showDeleted ? 'SELECT COUNT(*) AS count FROM comments' : 'SELECT COUNT(*) AS count FROM comments WHERE is_deleted = 0'
  );
  res.json({
    success: true,
    comments: comments.map(c => ({
      ...c,
      images: parseImages(c.images),
      is_deleted: c.is_deleted || false,
      deleted_at: c.deleted_at || null,
      ...mapSourceLinks(c)
    })),
    total: total[0].count, page, pageSize
  });
}));

router.get('/admin/comment-reports', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  const status = req.query.status || 'pending';

  const whereClauses = [];
  const params = [];

  if (status !== 'all') {
    whereClauses.push('r.status = ?');
    params.push(status);
  }

  const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const [reports] = await pool.query(
    `SELECT r.id, r.comment_id, r.user_id, r.reason, r.detail, r.status, r.created_at, r.reviewed_at,
            c.content AS comment_content, c.is_deleted AS comment_is_deleted,
            cu.email AS reporter_email, cu.nickname AS reporter_nickname,
            cu2.email AS comment_author_email, cu2.nickname AS comment_author_nickname,
            p.title AS post_title, p.id AS post_id
     FROM comment_reports r
     JOIN comments c ON r.comment_id = c.id
     JOIN users cu ON r.user_id = cu.id
     JOIN users cu2 ON c.user_id = cu2.id
     JOIN posts p ON c.post_id = p.id
     ${where}
     ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [total] = await pool.query(
    `SELECT COUNT(*) AS count FROM comment_reports r ${where}`,
    params
  );

  const reasonLabels = {
    harassment: '骚扰辱骂',
    spam: '垃圾广告',
    inappropriate: '不当内容',
    fake: '虚假信息',
    copyright: '侵犯版权',
    other: '其他'
  };

  const statusLabels = {
    pending: '待处理',
    processed: '已处理',
    dismissed: '已忽略'
  };

  res.json({
    success: true,
    reports: reports.map(r => ({
      ...r,
      reason_label: reasonLabels[r.reason] || r.reason,
      status_label: statusLabels[r.status] || r.status,
      comment_is_deleted: r.comment_is_deleted === 1
    })),
    total: total[0].count,
    page,
    pageSize
  });
}));

router.put('/admin/comment-reports/:id/process', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const { action, note } = req.body;

  const validActions = ['delete_comment', 'dismiss', 'processed'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ success: false, message: '无效的处理操作' });
  }

  const [reports] = await pool.query('SELECT * FROM comment_reports WHERE id = ?', [reportId]);
  if (reports.length === 0) {
    return res.status(404).json({ success: false, message: '举报记录不存在' });
  }

  const report = reports[0];
  if (report.status !== 'pending') {
    return res.status(400).json({ success: false, message: '该举报已处理' });
  }

  await pool.query(
    'UPDATE comment_reports SET status = ?, reviewed_at = NOW() WHERE id = ?',
    [action === 'dismiss' ? 'dismissed' : 'processed', reportId]
  );

  if (action === 'delete_comment' && !report.comment_is_deleted) {
    await pool.query('UPDATE comments SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [report.comment_id]);
  }

  res.json({ success: true, message: '处理成功' });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const [userCount] = await pool.query('SELECT COUNT(*) AS count FROM users');
  const [postCount] = await pool.query('SELECT COUNT(*) AS count FROM posts WHERE is_deleted = 0');
  const [commentCount] = await pool.query('SELECT COUNT(*) AS count FROM comments WHERE is_deleted = 0');
  res.json({ success: true, stats: { users: userCount[0].count, posts: postCount[0].count, comments: commentCount[0].count } });
}));

router.get('/admin/stats', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [userCount] = await pool.query('SELECT COUNT(*) AS count FROM users');
  const [postCount] = await pool.query('SELECT COUNT(*) AS count FROM posts');
  const [commentCount] = await pool.query('SELECT COUNT(*) AS count FROM comments WHERE is_deleted = 0');
  res.json({ success: true, stats: { users: userCount[0].count, posts: postCount[0].count, comments: commentCount[0].count } });
}));

router.post('/admin/set-product', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { postId, productType, price, originalPrice } = req.body;
  if (!postId) return res.status(400).json({ success: false, message: '缺少帖子ID' });
  await pool.query(
    'UPDATE posts SET product_type = ?, price = ?, original_price = ? WHERE id = ?',
    [productType || 'free', price || null, originalPrice || null, postId]
  );
  res.json({ success: true });
}));

router.get('/admin/orders', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [orders] = await pool.query(
    `SELECT o.*, u.email AS user_email, u.nickname AS user_nickname
     FROM orders o LEFT JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC LIMIT 200`
  );
  res.json({ success: true, orders });
}));

router.post('/admin/deliver-order', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { orderNo } = req.body;
  if (!orderNo) return res.status(400).json({ success: false, message: '缺少订单号' });
  const [result] = await pool.query(
    "UPDATE orders SET status = 'delivered', delivered_at = NOW() WHERE order_no = ? AND status = 'paid'",
    [orderNo]
  );
  if (result.affectedRows === 0) return res.json({ success: false, message: '订单不存在或状态不可发货' });
  res.json({ success: true });
}));

router.get('/projects', asyncHandler(async (req, res) => {
  const { category, page = 1, pageSize = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const params = [];
  let whereClause = 'p.is_featured = 1 AND p.is_deleted = 0';

  if (category && category !== 'all') {
    whereClause += ' AND p.category = ?';
    params.push(category);
  }

  const [projects] = await pool.query(
    `SELECT p.id, p.title, p.content, p.category, p.project_name,
            ${sourceLinkSelectFields()},
            p.created_at, p.view_count, p.images,
            u.email AS author_email, u.nickname AS author_nickname,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = 0) AS comment_count
     FROM posts p JOIN users u ON p.author_id = u.id
     WHERE ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), offset]
  );

  const [total] = await pool.query(
    `SELECT COUNT(*) AS count FROM posts p WHERE ${whereClause}`, params
  );

  res.json({
    success: true,
    projects: projects.map(p => ({
      id: p.id,
      name: p.project_name || p.title,
      desc: p.content ? p.content.substring(0, 100).replace(/[#*`]/g, '') : '',
      emoji: CATEGORY_EMOJIS[p.category] || '📦',
      color: CATEGORY_COLORS[p.category] || 'linear-gradient(135deg, #409eff, #1a6dd4)',
      tags: [p.category],
      category: p.category,
      stars: Math.floor(p.view_count / 10) || 0,
      forks: p.comment_count || 0,
      links: mapSourceLinks(p),
      author: getAuthorName(p)
    })),
    total: total[0].count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}));

router.get('/projects/:id', asyncHandler(async (req, res) => {
  const [posts] = await pool.query(
    `SELECT p.id, p.title, p.content, p.category, p.project_name, p.is_featured, p.images, p.view_count, p.created_at,
      ${sourceLinkSelectFields()},
      u.email AS author_email, u.nickname AS author_nickname
     FROM posts p JOIN users u ON p.author_id = u.id
     WHERE p.id = ? AND p.is_featured = 1`,
    [req.params.id]
  );
  if (posts.length === 0) return res.status(404).json({ success: false, message: '项目不存在' });

  const p = posts[0];
  res.json({
    success: true,
    project: {
      id: p.id,
      name: p.project_name || p.title,
      desc: p.content ? p.content.replace(/[#*`]/g, '') : '',
      emoji: CATEGORY_EMOJIS[p.category] || '📦',
      category: p.category,
      author: getAuthorName(p),
      created_at: p.created_at,
      links: mapSourceLinks(p)
    }
  });
}));

router.post('/downloads/record', asyncHandler(async (req, res) => {
  const { post_id, platform } = req.body;
  if (!post_id || !platform) return res.status(400).json({ success: false, message: '参数不完整' });
  if (!SOURCE_LINKS.includes(platform)) return res.status(400).json({ success: false, message: '无效的平台' });

  const clientIp = getClientIp(req);
  const ipRegion = getIpRegion(clientIp);
  let userId = null;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
      userId = decoded.id;
    }
  } catch (e) {
    /* 未登录也可记录 */
  }

  await pool.query(
    'INSERT INTO download_logs (post_id, user_id, platform, ip, ip_region) VALUES (?, ?, ?, ?, ?)',
    [post_id, userId, platform, clientIp, ipRegion]
  );

  res.json({ success: true, message: '下载记录已保存' });
}));

router.get('/downloads/stats', asyncHandler(async (req, res) => {
  const { post_id, post_ids } = req.query;
  let postIdList = [];

  if (post_ids) {
    try {
      postIdList = JSON.parse(post_ids);
    } catch {
      postIdList = post_ids.split(',').map(Number);
    }
  } else if (post_id) {
    postIdList = [parseInt(post_id)];
  }

  if (!postIdList.length) {
    return res.json({ success: true, stats: {} });
  }

  const placeholders = postIdList.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT post_id, platform, COUNT(*) AS count
     FROM download_logs
     WHERE post_id IN (${placeholders})
     GROUP BY post_id, platform`,
    postIdList
  );

  const stats = {};
  postIdList.forEach(pid => {
    stats[pid] = { total: 0, byPlatform: {} };
  });
  rows.forEach(row => {
    if (!stats[row.post_id]) stats[row.post_id] = { total: 0, byPlatform: {} };
    stats[row.post_id].total += row.count;
    stats[row.post_id].byPlatform[row.platform] = row.count;
  });

  res.json({ success: true, stats });
}));

router.get('/downloads/logs', asyncHandler(async (req, res) => {
  const { post_id, page = 1, pageSize = 20 } = req.query;
  if (!post_id) return res.status(400).json({ success: false, message: '缺少 post_id' });
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const [logs] = await pool.query(
    `SELECT dl.id, dl.platform, dl.ip_region, dl.created_at,
            u.nickname, u.email
     FROM download_logs dl
     LEFT JOIN users u ON dl.user_id = u.id
     WHERE dl.post_id = ?
     ORDER BY dl.created_at DESC LIMIT ? OFFSET ?`,
    [parseInt(post_id), parseInt(pageSize), offset]
  );
  const [total] = await pool.query(
    'SELECT COUNT(*) AS count FROM download_logs WHERE post_id = ?',
    [parseInt(post_id)]
  );

  res.json({
    success: true,
    logs: logs.map(l => ({
      ...l,
      user_name: l.nickname || (l.email ? l.email.split('@')[0] : '匿名用户')
    })),
    total: total[0].count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}));

router.use('/uploads/comments', express.static(UPLOAD_DIRS.comments));
router.use('/uploads/posts', express.static(UPLOAD_DIRS.posts));
router.use('/uploads/avatars', express.static(UPLOAD_DIRS.avatars));
router.use('/uploads/local', express.static(UPLOAD_DIRS.local));

router.post('/local/upload', authMiddleware, adminMiddleware, uploadLocal.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: '请上传文件' });
  const url = `/api/forum/uploads/local/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.originalname });
}));

router.get('/local/download/:filename', asyncHandler(async (req, res) => {
  const filePath = path.join(UPLOAD_DIRS.local, req.params.filename);
  const resolved = path.resolve(filePath);
  const localDir = path.resolve(UPLOAD_DIRS.local);
  if (!resolved.startsWith(localDir + path.sep) && resolved !== localDir) {
    return res.status(403).json({ success: false, message: '禁止访问' });
  }
  if (!fs.existsSync(resolved)) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }
  res.download(resolved);
}));

router.post('/local/upload-folder', authMiddleware, adminMiddleware, uploadLocal.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: '请上传压缩包' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.zip') {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ success: false, message: '只支持 .zip 压缩包' });
  }
  const folderName = path.basename(req.file.originalname, '.zip') || 'project';
  const extractDir = path.join(UPLOAD_DIRS.local, folderName);
  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
  fs.mkdirSync(extractDir, { recursive: true });
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(extractDir, true);
    const zipDest = path.join(extractDir, folderName + '.zip');
    fs.copyFileSync(req.file.path, zipDest);
    fs.unlink(req.file.path, () => {});
    const url = `/api/forum/uploads/local/${folderName}/${folderName}.zip`;
    res.json({ success: true, url, foldername: folderName });
  } catch (err) {
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: '解压失败: ' + err.message });
  }
}));

router.delete('/local/delete', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath) return res.status(400).json({ success: false, message: '请指定路径' });
  if (targetPath.includes('..')) return res.status(400).json({ success: false, message: '非法路径' });

  const absPath = path.resolve(path.join(UPLOAD_DIRS.local, targetPath));
  const localDir = path.resolve(UPLOAD_DIRS.local);
  if (!absPath.startsWith(localDir + path.sep) && absPath !== localDir) {
    return res.status(403).json({ success: false, message: '禁止访问' });
  }
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ success: false, message: '文件/文件夹不存在' });
  }

  const stat = fs.statSync(absPath);
  if (stat.isDirectory()) {
    fs.rmSync(absPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(absPath);
  }
  res.json({ success: true, message: '删除成功' });
}));

router.get('/admin/files', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const dir = req.query.dir || '';
  if (dir.includes('..')) return res.status(400).json({ success: false, message: '非法路径' });
  const targetDir = dir ? path.join(UPLOAD_DIRS.local, dir) : UPLOAD_DIRS.local;
  const absDir = path.resolve(targetDir);
  const localDir = path.resolve(UPLOAD_DIRS.local);
  if (!absDir.startsWith(localDir + path.sep) && absDir !== localDir) {
    return res.status(403).json({ success: false, message: '禁止访问' });
  }
  if (!fs.existsSync(absDir)) return res.json({ success: true, files: [], dir });

  const items = fs.readdirSync(absDir).map(name => {
    const stat = fs.statSync(path.join(absDir, name));
    return {
      name,
      isDir: stat.isDirectory(),
      size: stat.size,
      mtime: stat.mtime,
      ext: stat.isDirectory() ? '' : path.extname(name).toLowerCase()
    };
  }).sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  res.json({ success: true, files: items, dir });
}));

router.get('/admin/file-manager', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>📁 文件管理器</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f0f2f5; color: #1d2129; min-height: 100vh; }
.header { background: #fff; padding: 16px 24px; border-bottom: 1px solid #e4e7ed; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
.header h1 { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.token-area { display: flex; gap: 8px; align-items: center; }
.token-area input { padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 6px; font-size: 13px; width: 320px; outline: none; }
.token-area input:focus { border-color: #409eff; }
.token-area button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
.btn-save { background: linear-gradient(135deg,#409eff,#337ecc); color: #fff; }
.btn-save:hover { box-shadow: 0 4px 12px rgba(64,158,255,0.4); }
.breadcrumb { padding: 12px 24px; font-size: 13px; color: #909399; background: #fff; border-bottom: 1px solid #f0f0f0; }
.breadcrumb a { color: #409eff; cursor: pointer; text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.toolbar { display: flex; gap: 12px; padding: 16px 24px; background: #fff; border-bottom: 1px solid #f0f0f0; flex-wrap: wrap; align-items: center; }
.upload-label { display: flex; align-items: center; gap: 6px; padding: 9px 18px; background: #409eff; color: #fff; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }
.upload-label:hover { background: #337ecc; }
.upload-label input { display: none; }
.btn-refresh { padding: 9px 18px; background: #fff; border: 1px solid #e4e7ed; border-radius: 8px; cursor: pointer; font-size: 13px; color: #606266; }
.btn-refresh:hover { border-color: #409eff; color: #409eff; }
.status { font-size: 12px; margin-left: auto; padding: 6px 12px; border-radius: 6px; }
.status.ok { background: #e8f8e8; color: #67c23a; }
.status.err { background: #fde2e2; color: #f56c6c; }
.file-table { width: 100%; border-collapse: collapse; background: #fff; margin: 0; }
.file-table th { text-align: left; padding: 12px 24px; font-size: 12px; color: #909399; border-bottom: 2px solid #e4e7ed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.file-table td { padding: 12px 24px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
.file-table tr:hover td { background: #f5f7fa; }
.file-name { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #1d2129; font-weight: 500; }
.file-name:hover { color: #409eff; }
.file-name.dir-name { color: #409eff; }
.file-icon { font-size: 20px; }
.file-size { color: #909399; white-space: nowrap; }
.file-date { color: #909399; white-space: nowrap; }
.file-actions { display: flex; gap: 8px; }
.btn-sm { padding: 4px 12px; border: 1px solid #e4e7ed; border-radius: 4px; cursor: pointer; font-size: 12px; background: #fff; color: #606266; transition: all 0.2s; }
.btn-sm:hover { border-color: #409eff; color: #409eff; }
.btn-sm.danger:hover { border-color: #f56c6c; color: #f56c6c; }
.empty { text-align: center; padding: 60px 24px; color: #c0c4cc; font-size: 14px; }
.upload-hint { color: #61C454; font-size: 12px; }
@media (max-width: 768px) { .toolbar { flex-direction: column; } .token-area input { width: 180px; } .status { margin-left: 0; } }
</style>
</head>
<body>
<div class="header">
  <h1>📁 后端文件管理器</h1>
  <div class="token-area">
    <input type="password" id="tokenInput" placeholder="输入管理员 Token (Bearer xxx)" />
    <button class="btn-save" onclick="saveToken()">设置 Token</button>
  </div>
</div>
<div class="breadcrumb" id="breadcrumb"></div>
<div class="toolbar">
  <label class="upload-label">📤 上传文件<input type="file" id="fileInput" onchange="uploadFile()"/></label>
  <label class="upload-label">📦 上传文件夹(.zip)<input type="file" accept=".zip" id="zipInput" onchange="uploadFolder()"/></label>
  <button class="btn-refresh" onclick="loadFiles()">🔄 刷新</button>
  <span class="upload-hint" id="uploadHint"></span>
  <span class="status ok" id="status">就绪</span>
</div>
<div id="fileList"></div>

<script>
const BASE = '/api/forum/local';
const ADMIN_BASE = '/api/forum/admin';
let currentDir = '';

function getToken() { return localStorage.getItem('admin_token') || ''; }
function setStatus(msg, ok) {
  const s = document.getElementById('status');
  s.textContent = msg; s.className = 'status ' + (ok ? 'ok' : 'err');
  if (ok && msg === '就绪') return;
  setTimeout(() => setStatus('就绪', true), 3000);
}

async function api(url, opts = {}) {
  const token = getToken();
  if (!token) { alert('请先设置 Token'); throw new Error('no token'); }
  opts.headers = { ...opts.headers, Authorization: \`Bearer \${token}\` };
  const res = await fetch(url, opts);
  if (res.status === 401) { alert('Token 无效或过期，请重新登录获取'); throw new Error('unauthorized'); }
  return res;
}

async function loadFiles(dir) {
  currentDir = dir || '';
  try {
    const res = await api(\`\${ADMIN_BASE}/files?dir=\${encodeURIComponent(currentDir)}\`);
    const data = await res.json();
    if (!data.success) { setStatus(data.message, false); return; }

    document.getElementById('breadcrumb').innerHTML = buildBreadcrumb(currentDir);
    if (!data.files.length) {
      document.getElementById('fileList').innerHTML = '<div class="empty">📭 目录为空</div>';
      return;
    }
    let html = '<table class="file-table"><thead><tr><th>名称</th><th>大小</th><th>修改时间</th><th>操作</th></tr></thead><tbody>';
    data.files.forEach(f => {
      const icon = f.isDir ? '📁' : (f.ext === '.zip' ? '📦' : (f.ext === '.png'||f.ext==='.jpg' ? '🖼' : '📄'));
      const size = f.isDir ? '-' : formatSize(f.size);
      const date = formatDate(f.mtime);
      const subDir = currentDir ? currentDir + '/' + f.name : f.name;
      html += \`<tr>
        <td><span class="file-name \${f.isDir?'dir-name':''}" onclick="\${f.isDir?'loadFiles(\\\\''+subDir+'\\\\')':'downloadFile(\\\\''+subDir+'\\\\')'}">\${icon} \${escHtml(f.name)}</span></td>
        <td class="file-size">\${size}</td>
        <td class="file-date">\${date}</td>
        <td class="file-actions">
          \${f.isDir?'<button class="btn-sm" onclick="loadFiles(\\\\''+subDir+'\\\\')">进入</button>':''}
          <a class="btn-sm" href="\${BASE}/uploads/local/\${subDir}" download>下载</a>
          <button class="btn-sm danger" onclick="deleteItem('\\\\''+subDir+'\\\\')">删除</button>
        </td>
      </tr>\`;
    });
    html += '</tbody></table>';
    document.getElementById('fileList').innerHTML = html;
    setStatus('加载完成', true);
  } catch(e) {
    if (e.message !== 'no token') setStatus('加载失败: ' + e.message, false);
  }
}

function buildBreadcrumb(dir) {
  if (!dir) return '<span>🏠 根目录</span>';
  const parts = dir.split('/');
  let html = '<a onclick="loadFiles(\\\\'\\\\')">🏠 根目录</a>';
  let acc = '';
  parts.forEach((p, i) => {
    acc += (i ? '/' : '') + p;
    html += ' / <a onclick="loadFiles(\\\\'' + acc + '\\\\')">' + escHtml(p) + '</a>';
  });
  return html;
}

async function uploadFile() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) return;
  document.getElementById('uploadHint').textContent = '上传中...';
  try {
    const fd = new FormData(); fd.append('file', file);
    const res = await api(BASE + '/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) { setStatus('上传成功: ' + file.name, true); loadFiles(currentDir); }
    else setStatus(data.message, false);
  } catch(e) { setStatus('上传失败', false); }
  document.getElementById('uploadHint').textContent = '';
  document.getElementById('fileInput').value = '';
}

async function uploadFolder() {
  const file = document.getElementById('zipInput').files[0];
  if (!file) return;
  document.getElementById('uploadHint').textContent = '解压中...';
  try {
    const fd = new FormData(); fd.append('file', file);
    const res = await api(BASE + '/upload-folder', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) { setStatus('解压成功: ' + (data.foldername || file.name), true); loadFiles(currentDir); }
    else setStatus(data.message, false);
  } catch(e) { setStatus('上传失败', false); }
  document.getElementById('uploadHint').textContent = '';
  document.getElementById('zipInput').value = '';
}

function downloadFile(subDir) { window.open(BASE + '/download/' + subDir, '_blank'); }

async function deleteItem(subDir) {
  if (!confirm('确定删除 "' + subDir + '" 吗？')) return;
  try {
    const res = await api(BASE + '/delete', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({path: subDir}) });
    const data = await res.json();
    if (data.success) { setStatus('已删除', true); loadFiles(currentDir); }
    else setStatus(data.message, false);
  } catch(e) { setStatus('删除失败', false); }
}

function saveToken() {
  const val = document.getElementById('tokenInput').value.trim();
  if (!val) return alert('请输入 Token');
  localStorage.setItem('admin_token', val);
  setStatus('Token 已保存', true);
  loadFiles();
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

function formatDate(d) {
  const dt = new Date(d);
  return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')+' '+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0');
}

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

const saved = localStorage.getItem('admin_token');
if (saved) { document.getElementById('tokenInput').value = saved; loadFiles(); }
</script>
</body>
</html>`);
});

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: '文件大小超出限制',
      LIMIT_FILE_COUNT: '文件数量超出限制',
      LIMIT_UNEXPECTED_FILE: '上传字段名不正确'
    };
    return res.status(400).json({ success: false, message: messages[err.code] || '上传失败: ' + err.message });
  }
  if (err.message && err.message.includes('只支持图片文件')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
}

module.exports = { router, handleMulterError };
