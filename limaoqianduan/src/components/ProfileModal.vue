<template>
  <BaseModal :show="show" modal-class="profile-modal" @close="$emit('close')">
    <div class="modal-header">
      <h2>个人中心</h2>
    </div>
    <div class="profile-content">
      <div class="user-card">
        <div class="avatar-section">
          <div class="avatar-preview">
            <img v-if="userAvatar && !avatarError" :src="userAvatar" class="avatar-image" @error="avatarError = true"/>
            <div v-else class="avatar-placeholder">{{ (nickname || userEmail).charAt(0).toUpperCase() }}</div>
          </div>
          <label class="btn-upload-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>{{ uploadingAvatar ? '上传中...' : '更换' }}</span>
            <input type="file" accept="image/*" @change="$emit('uploadAvatar', $event)" :disabled="uploadingAvatar"/>
          </label>
        </div>
        <div class="user-info">
          <div class="user-name">{{ nickname || userEmail.split('@')[0] }}</div>
          <div class="user-email">{{ userEmail }}</div>
          <div class="user-stats">
            <div class="stat-item" @click="activeTab = 'posts'">
              <span class="stat-num">{{ userStats.posts }}</span>
              <span class="stat-label">订单</span>
            </div>
            <div class="stat-item" @click="activeTab = 'likes'">
              <span class="stat-num">{{ userStats.likes }}</span>
              <span class="stat-label">点赞</span>
            </div>
            <div class="stat-item" @click="activeTab = 'favorites'">
              <span class="stat-num">{{ userStats.favorites }}</span>
              <span class="stat-label">收藏</span>
            </div>
            <div class="stat-item" @click="activeTab = 'comments'">
              <span class="stat-num">{{ userStats.comments }}</span>
              <span class="stat-label">评论</span>
            </div>
          </div>
        </div>
      </div>

      <div class="tabs">
        <div :class="['tab', { active: activeTab === 'profile' }]" @click="activeTab = 'profile'">个人资料</div>
        <div :class="['tab', { active: activeTab === 'posts' }]" @click="activeTab = 'posts'">我的订单</div>
        <div :class="['tab', { active: activeTab === 'likes' }]" @click="activeTab = 'likes'">我的点赞</div>
        <div :class="['tab', { active: activeTab === 'favorites' }]" @click="activeTab = 'favorites'">我的收藏</div>
        <div :class="['tab', { active: activeTab === 'comments' }]" @click="activeTab = 'comments'">我的评论</div>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'profile'" class="profile-form">
          <div class="form-group">
            <label>昵称</label>
            <input :value="nickname" @input="$emit('update:nickname', $event.target.value)" type="text" placeholder="请输入昵称" class="input-field"/>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input :value="userEmail" type="text" disabled class="input-field disabled"/>
            <span class="form-tip">邮箱地址不可修改</span>
          </div>
          <button class="btn-save-profile" :disabled="saving || !nickname?.trim()" @click="$emit('save')">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </div>

        <div v-else-if="activeTab === 'posts'" class="list-content">
          <div v-if="listLoading" class="loading-state">加载中...</div>
          <div v-else-if="ordersList.length === 0" class="empty-state">暂无订单</div>
          <div v-else>
            <div v-for="order in ordersList" :key="order.order_no" class="list-item order-item">
              <div class="item-main">
                <div class="item-title">{{ order.product_name }}</div>
                <div class="item-meta">
                  <span class="order-status" :class="order.status">{{ orderStatusMap[order.status] || order.status }}</span>
                  <span>{{ order.product_type === 'source' ? '源码' : '定制开发' }}</span>
                  <span>{{ formatDate(order.created_at) }}</span>
                </div>
              </div>
              <div class="order-right">
                <div class="order-amount">¥{{ parseFloat(order.amount).toFixed(2) }}</div>
              </div>
            </div>
            <div v-if="ordersList.length < ordersTotal" class="load-more" @click="loadMore('orders')">加载更多</div>
          </div>
        </div>

        <div v-else-if="activeTab === 'likes'" class="list-content">
          <div v-if="listLoading" class="loading-state">加载中...</div>
          <div v-else-if="likesList.length === 0" class="empty-state">暂无点赞</div>
          <div v-else>
            <div v-for="post in likesList" :key="post.id" class="list-item" @click="goToPost(post.id)">
              <div class="item-main">
                <div class="item-title">{{ post.title }}</div>
                <div class="item-meta">
                  <span>{{ post.author_name }}</span>
                  <span>点赞于 {{ formatDate(post.liked_at) }}</span>
                </div>
              </div>
              <div class="item-stats">
                <span class="item-stat">👁 {{ post.view_count || 0 }}</span>
                <span class="item-stat">💬 {{ post.comment_count || 0 }}</span>
              </div>
            </div>
            <div v-if="likesList.length < likesTotal" class="load-more" @click="loadMore('likes')">加载更多</div>
          </div>
        </div>

        <div v-else-if="activeTab === 'favorites'" class="list-content">
          <div v-if="listLoading" class="loading-state">加载中...</div>
          <div v-else-if="favoritesList.length === 0" class="empty-state">暂无收藏</div>
          <div v-else>
            <div v-for="post in favoritesList" :key="post.id" class="list-item" @click="goToPost(post.id)">
              <div class="item-main">
                <div class="item-title">{{ post.title }}</div>
                <div class="item-meta">
                  <span>{{ post.author_name }}</span>
                  <span>收藏于 {{ formatDate(post.favorited_at) }}</span>
                </div>
              </div>
              <div class="item-stats">
                <span class="item-stat">👁 {{ post.view_count || 0 }}</span>
                <span class="item-stat">❤️ {{ post.like_count || 0 }}</span>
                <span class="item-stat">💬 {{ post.comment_count || 0 }}</span>
              </div>
            </div>
            <div v-if="favoritesList.length < favoritesTotal" class="load-more" @click="loadMore('favorites')">加载更多</div>
          </div>
        </div>

        <div v-else-if="activeTab === 'comments'" class="list-content">
          <div v-if="listLoading" class="loading-state">加载中...</div>
          <div v-else-if="commentsList.length === 0" class="empty-state">暂无评论</div>
          <div v-else>
            <div v-for="comment in commentsList" :key="comment.id" class="list-item comment-item" @click="goToPost(comment.post_id)">
              <div class="item-main">
                <div class="item-content">{{ comment.is_deleted ? '[已删除]' : comment.content }}</div>
                <div class="item-meta">
                  <span>评论于「{{ comment.post_title }}」</span>
                  <span>{{ formatDate(comment.created_at) }}</span>
                </div>
              </div>
              <div class="item-stats">
                <span class="item-stat">❤️ {{ comment.like_count || 0 }}</span>
              </div>
            </div>
            <div v-if="commentsList.length < commentsTotal" class="load-more" @click="loadMore('comments')">加载更多</div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  show: Boolean,
  nickname: String,
  userEmail: String,
  userAvatar: String,
  uploadingAvatar: Boolean,
  saving: Boolean,
  token: String
})

const emit = defineEmits(['close', 'save', 'uploadAvatar', 'update:nickname', 'goToPost'])

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const avatarError = ref(false)
const activeTab = ref('profile')
const listLoading = ref(false)

const userStats = ref({ posts: 0, comments: 0, likes: 0, favorites: 0 })

const ordersList = ref([])
const ordersTotal = ref(0)
const ordersPage = ref(1)

const orderStatusMap = { pending: '待支付', paid: '已支付', delivered: '已发货', refunded: '已退款', closed: '已关闭' }

const likesList = ref([])
const likesTotal = ref(0)
const likesPage = ref(1)

const favoritesList = ref([])
const favoritesTotal = ref(0)
const favoritesPage = ref(1)

const commentsList = ref([])
const commentsTotal = ref(0)
const commentsPage = ref(1)

function getHeaders() {
  return { Authorization: `Bearer ${props.token}` }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function goToPost(postId) {
  emit('goToPost', postId)
}

async function fetchUserStats() {
  if (!props.token) return
  try {
    const res = await axios.get(`${API_BASE}/forum/user/info`, { headers: getHeaders() })
    if (res.data.success && res.data.stats) {
      userStats.value = res.data.stats
    }
  } catch (e) {
    console.error('获取用户统计失败', e)
  }
}

async function fetchOrders(page = 1) {
  if (!props.token) return
  listLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/payment/my-orders`, { params: { page, pageSize: 10 }, headers: getHeaders() })
    if (res.data.success) {
      if (page === 1) {
        ordersList.value = res.data.orders
      } else {
        ordersList.value.push(...res.data.orders)
      }
      ordersTotal.value = res.data.total
      ordersPage.value = page
    }
  } catch (e) {
    console.error('获取我的订单失败', e)
  } finally {
    listLoading.value = false
  }
}

async function fetchLikes(page = 1) {
  if (!props.token) return
  listLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/forum/user/liked-posts`, { params: { page, pageSize: 10 }, headers: getHeaders() })
    if (res.data.success) {
      if (page === 1) {
        likesList.value = res.data.posts
      } else {
        likesList.value.push(...res.data.posts)
      }
      likesTotal.value = res.data.total
      likesPage.value = page
    }
  } catch (e) {
    console.error('获取我的点赞失败', e)
  } finally {
    listLoading.value = false
  }
}

async function fetchFavorites(page = 1) {
  if (!props.token) return
  listLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/forum/user/favorite-posts`, { params: { page, pageSize: 10 }, headers: getHeaders() })
    if (res.data.success) {
      if (page === 1) {
        favoritesList.value = res.data.posts
      } else {
        favoritesList.value.push(...res.data.posts)
      }
      favoritesTotal.value = res.data.total
      favoritesPage.value = page
    }
  } catch (e) {
    console.error('获取我的收藏失败', e)
  } finally {
    listLoading.value = false
  }
}

async function fetchComments(page = 1) {
  if (!props.token) return
  listLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/forum/user/comments`, { params: { page, pageSize: 10 }, headers: getHeaders() })
    if (res.data.success) {
      if (page === 1) {
        commentsList.value = res.data.comments
      } else {
        commentsList.value.push(...res.data.comments)
      }
      commentsTotal.value = res.data.total
      commentsPage.value = page
    }
  } catch (e) {
    console.error('获取我的评论失败', e)
  } finally {
    listLoading.value = false
  }
}

function loadMore(type) {
  if (type === 'orders') fetchOrders(ordersPage.value + 1)
  else if (type === 'likes') fetchLikes(likesPage.value + 1)
  else if (type === 'favorites') fetchFavorites(favoritesPage.value + 1)
  else if (type === 'comments') fetchComments(commentsPage.value + 1)
}

watch(() => props.show, (val) => {
  if (val) {
    avatarError.value = false
    activeTab.value = 'profile'
    fetchUserStats()
  }
})

watch(activeTab, (tab) => {
  if (tab === 'posts' && ordersList.value.length === 0) fetchOrders()
  else if (tab === 'likes' && likesList.value.length === 0) fetchLikes()
  else if (tab === 'favorites' && favoritesList.value.length === 0) fetchFavorites()
  else if (tab === 'comments' && commentsList.value.length === 0) fetchComments()
})
</script>

<style scoped>
.profile-modal { max-width: 560px; }
.modal-header { margin-bottom: 16px; }
.modal-header h2 { font-size: 18px; font-weight: 700; color: #1d2129; }

.profile-content { padding: 0; }

.user-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%);
  border-radius: 12px;
  margin-bottom: 16px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #e5e6eb;
}

.avatar-image { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { font-size: 28px; font-weight: 600; color: #409eff; }

.btn-upload-avatar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  color: #4e5969;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upload-avatar:hover:not(:disabled) { border-color: #409eff; color: #409eff; }
.btn-upload-avatar:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-upload-avatar input { display: none; }

.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 16px; font-weight: 700; color: #1d2129; margin-bottom: 2px; }
.user-email { font-size: 12px; color: #86909c; margin-bottom: 12px; }

.user-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.stat-item:hover { background: rgba(64, 158, 255, 0.08); }
.stat-num { font-size: 16px; font-weight: 700; color: #1d2129; }
.stat-label { font-size: 11px; color: #86909c; }

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e6eb;
  margin-bottom: 16px;
  gap: 0;
  overflow-x: auto;
}

.tab {
  padding: 10px 16px;
  font-size: 13px;
  color: #86909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
  font-weight: 500;
}

.tab:hover { color: #409eff; }
.tab.active { color: #409eff; border-bottom-color: #409eff; font-weight: 600; }

.tab-content { min-height: 200px; max-height: 400px; overflow-y: auto; }

.profile-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; color: #4e5969; font-weight: 600; }

.form-group .input-field {
  padding: 10px 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 14px;
  color: #1d2129;
  outline: none;
  transition: border-color 0.3s;
}

.form-group .input-field:focus { border-color: #409eff; box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12); background: #fff; }
.form-group .input-field.disabled { background: #f2f3f5; color: #c9cdd4; cursor: not-allowed; }
.form-tip { font-size: 12px; color: #86909c; }

.btn-save-profile {
  width: 100%;
  padding: 11px;
  background: #409eff;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;
}

.btn-save-profile:hover:not(:disabled) { background: #1a6dd4; box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3); }
.btn-save-profile:disabled { opacity: 0.6; cursor: not-allowed; }

.list-content { }

.loading-state, .empty-state {
  text-align: center;
  padding: 40px 0;
  color: #c9cdd4;
  font-size: 14px;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 12px;
}

.list-item:hover { background: #f7f8fa; }

.item-main { flex: 1; min-width: 0; }
.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.item-content {
  font-size: 13px;
  color: #4e5969;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
  line-height: 1.5;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #c9cdd4;
}

.item-stats {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.item-stat {
  font-size: 11px;
  color: #c9cdd4;
  white-space: nowrap;
}

.load-more {
  text-align: center;
  padding: 12px;
  color: #409eff;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.load-more:hover { color: #1a6dd4; }

.comment-item .item-main { min-width: 0; }

.order-item { align-items: center; }
.order-right { flex-shrink: 0; text-align: right; }
.order-amount { font-size: 16px; font-weight: 700; color: #f53f3f; }
.order-status { font-weight: 600; }
.order-status.pending { color: #ff7d00; }
.order-status.paid { color: #00b42a; }
.order-status.delivered { color: #165dff; }
.order-status.refunded { color: #f53f3f; }
.order-status.closed { color: #86909c; }

@media (max-width: 768px) {
  .profile-modal { max-width: 95%; }
  .user-card { flex-direction: column; text-align: center; }
  .user-stats { justify-content: center; }
  .tabs { gap: 0; }
  .tab { padding: 8px 10px; font-size: 12px; }
  .tab-content { max-height: 350px; }
}
</style>
