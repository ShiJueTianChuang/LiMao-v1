<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  isLoggedIn: Boolean,
  token: { type: String, default: '' }
})

const emit = defineEmits(['application-notification'])

const API_BASE = '/api'
const WS_BASE = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

const notifications = ref([])
const unreadCount = ref(0)
const showDropdown = ref(false)
const loading = ref(false)
const ws = ref(null)
const dropdownRef = ref(null)
const showClearConfirm = ref(false)
const deleteTargetId = ref(null)

function getToken() {
  return props.token || localStorage.getItem('limao_token') || localStorage.getItem('token') || ''
}

async function fetchNotifications() {
  const token = getToken()
  if (!token) return
  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    if (json.success) {
      notifications.value = json.data
      unreadCount.value = json.data.filter(n => n.is_read === 0).length
    }
  } catch (e) {
    console.error('获取通知失败:', e)
  }
}

async function fetchUnreadCount() {
  const token = getToken()
  if (!token) return
  try {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    if (json.success) {
      unreadCount.value = json.data.count
    }
  } catch (e) {
    console.error('获取未读数失败:', e)
  }
}

async function markAsRead(notif) {
  if (notif.is_read === 1) return
  const token = getToken()
  if (!token) return
  try {
    await fetch(`${API_BASE}/notifications/${notif.id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    notif.is_read = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (e) {
    console.error('标记已读失败:', e)
  }
}

async function markAllRead() {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    notifications.value.forEach(n => n.is_read = 1)
    unreadCount.value = 0
  } catch (e) {
    console.error('全部已读失败:', e)
  }
}

async function deleteNotification(notif, event) {
  event.stopPropagation()
  deleteTargetId.value = notif.id
}

async function confirmDeleteOne() {
  const id = deleteTargetId.value
  deleteTargetId.value = null
  const token = getToken()
  if (!token || !id) return
  try {
    await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    const notif = notifications.value.find(n => n.id === id)
    if (notif) {
      const idx = notifications.value.indexOf(notif)
      if (idx > -1) {
        notifications.value.splice(idx, 1)
        if (notif.is_read === 0) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }
    }
  } catch (e) {
    console.error('删除通知失败:', e)
  }
}

function cancelDeleteOne() {
  deleteTargetId.value = null
}

async function clearAllNotifications() {
  showClearConfirm.value = true
}

async function confirmClearAll() {
  showClearConfirm.value = false
  const token = getToken()
  if (!token) return
  try {
    await fetch(`${API_BASE}/notifications/all`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    const unreadBefore = notifications.value.filter(n => n.is_read === 0).length
    notifications.value = []
    unreadCount.value = Math.max(0, unreadCount.value - unreadBefore)
  } catch (e) {
    console.error('清空通知失败:', e)
  }
}

function cancelClearAll() {
  showClearConfirm.value = false
}

function connectWebSocket() {
  const token = getToken()
  if (!token) return

  disconnectWebSocket()

  const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`
  const socket = new WebSocket(url)

  socket.onopen = () => {
    console.log('[通知] WebSocket 已连接')
    fetchUnreadCount()
  }

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'notification') {
        notifications.value.unshift(msg.data)
        unreadCount.value++
        if (msg.data.category === 'application') {
          emit('application-notification', msg.data)
        }
      }
    } catch (e) {
      console.error('[通知] 解析消息失败:', e)
    }
  }

  socket.onclose = (e) => {
    console.log('[通知] WebSocket 断开, 5秒后重连')
    ws.value = null
    setTimeout(() => {
      if (props.isLoggedIn) connectWebSocket()
    }, 5000)
  }

  socket.onerror = () => {
    socket.close()
  }

  ws.value = socket
}

function disconnectWebSocket() {
  if (ws.value) {
    ws.value.onclose = null
    ws.value.close()
    ws.value = null
  }
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    if (notifications.value.length === 0) {
      fetchNotifications()
    }
    nextTick(() => {
      document.addEventListener('click', handleOutsideClick)
    })
  } else {
    document.removeEventListener('click', handleOutsideClick)
  }
}

function handleOutsideClick(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showDropdown.value = false
    document.removeEventListener('click', handleOutsideClick)
  }
}

function formatTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return minutes + '分钟前'
  if (hours < 24) return hours + '小时前'
  if (days < 7) return days + '天前'

  const isToday = date.toDateString() === now.toDateString()
  const isThisYear = date.getFullYear() === now.getFullYear()
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

  if (isToday) return '今天 ' + time
  if (isThisYear) {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return month + '月' + day + '日 ' + time
  }
  return date.toLocaleDateString('zh-CN')
}

function typeIcon(type) {
  switch (type) {
    case 'success':
      return `<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`
    case 'warning':
      return `<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
    case 'error':
      return `<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`
    default:
      return `<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`
  }
}

watch(() => props.isLoggedIn, (val) => {
  if (val) {
    connectWebSocket()
    fetchUnreadCount()
  } else {
    disconnectWebSocket()
    notifications.value = []
    unreadCount.value = 0
    showDropdown.value = false
  }
})

watch(() => props.token, (val) => {
  if (val && props.isLoggedIn) {
    connectWebSocket()
    fetchUnreadCount()
  }
})

onMounted(() => {
  if (props.isLoggedIn) {
    connectWebSocket()
    fetchUnreadCount()
  }
})

onUnmounted(() => {
  disconnectWebSocket()
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div v-if="isLoggedIn" class="notification-panel" ref="dropdownRef">
    <button class="notif-bell" @click="toggleDropdown" :title="'通知中心'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22">
        <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.259 24.259 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <transition name="notif-drop">
      <div v-if="showDropdown" class="notif-dropdown">
        <div class="notif-dropdown-header">
          <div class="header-left">
            <div class="header-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18">
                <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.259 24.259 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span>通知中心</span>
            <span v-if="unreadCount > 0" class="header-count">{{ unreadCount }}</span>
          </div>
          <div class="header-right" v-if="unreadCount > 0 || notifications.length > 0">
            <button v-if="notifications.length > 0" class="notif-clear-all" @click="clearAllNotifications" title="清空通知">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button v-if="unreadCount > 0" class="notif-mark-all" @click="markAllRead">全部已读</button>
          </div>
        </div>

        <div v-if="showClearConfirm" class="clear-confirm-overlay">
          <div class="clear-confirm-dialog">
            <div class="clear-confirm-text">确定清空所有通知吗？</div>
            <div class="clear-confirm-actions">
              <button class="clear-btn-cancel" @click="cancelClearAll">取消</button>
              <button class="clear-btn-confirm" @click="confirmClearAll">确定</button>
            </div>
          </div>
        </div>

        <div v-if="notifications.length === 0" class="notif-empty">
          <div class="empty-icon-wrapper">
            <div class="empty-icon-bg"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="40" height="40">
              <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="empty-title">暂无通知</p>
          <span class="empty-hint">有新通知时会在这里显示</span>
        </div>

        <div v-else class="notif-list">
          <div
            v-for="notif in notifications"
            :key="notif.id"
            class="notif-item"
            :class="['type-' + notif.type, { 'is-unread': notif.is_read === 0 }]"
            @click="markAsRead(notif)"
          >
            <div class="notif-icon-wrapper" :class="'icon-' + notif.type">
              <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                <template v-if="notif.type === 'success'">
                  <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm-1 14.5l-4-4 1.415-1.415L9 11.672l5.586-5.587L16 7.5l-7 7z" clip-rule="evenodd"/>
                </template>
                <template v-else-if="notif.type === 'warning'">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </template>
                <template v-else-if="notif.type === 'error'">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </template>
                <template v-else>
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </template>
              </svg>
            </div>
            <div class="notif-body">
              <div class="notif-top">
                <span class="notif-title">{{ notif.title }}</span>
                <span class="notif-time">{{ formatTime(notif.created_at) }}</span>
              </div>
              <p class="notif-text">{{ notif.content }}</p>
            </div>
            <div class="notif-actions">
              <button class="notif-delete-btn" @click="deleteNotification(notif, $event)" title="删除通知">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <div v-if="deleteTargetId === notif.id" class="delete-confirm-overlay" @click.stop>
              <div class="delete-confirm-dialog">
                <div class="delete-confirm-text">确定删除该通知吗？</div>
                <div class="delete-confirm-actions">
                  <button class="clear-btn-cancel" @click="cancelDeleteOne">取消</button>
                  <button class="clear-btn-confirm" @click="confirmDeleteOne">确定</button>
                </div>
              </div>
            </div>
            <span class="notif-unread-indicator" v-if="notif.is_read === 0"></span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.notification-panel {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.notif-bell {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%);
  border: 1px solid rgba(59, 130, 246, 0.12);
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  color: #4b5563;
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-bell:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.06) 100%);
  border-color: rgba(59, 130, 246, 0.25);
  color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -4px rgba(59, 130, 246, 0.3);
}

.notif-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 10px;
  padding: 0 5px;
  font-weight: 700;
  box-shadow: 0 2px 8px -2px rgba(239, 68, 68, 0.5), 0 0 0 2px #fff;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.notif-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: -70px;
  width: 420px;
  max-height: 560px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow: 
    0 25px 80px -20px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset,
    0 10px 40px -15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 300;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.notif-dropdown::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
}

.notif-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.header-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px -4px rgba(59, 130, 246, 0.4);
}

.header-count {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  margin-left: 4px;
}

.notif-mark-all {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 1px solid rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.notif-mark-all:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: transparent;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -4px rgba(59, 130, 246, 0.5);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-clear-all {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
}

.notif-clear-all:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: transparent;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -4px rgba(239, 68, 68, 0.5);
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.empty-icon-bg {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: emptyPulse 3s ease-in-out infinite;
}

@keyframes emptyPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.7; }
}

.empty-icon-wrapper svg {
  position: relative;
  z-index: 1;
  color: #9ca3af;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: #9ca3af;
}



.notif-item {
  padding: 16px 24px 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  position: relative;
  overflow: visible;
}

.notif-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.notif-item:hover .notif-actions {
  opacity: 1;
}

.notif-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.notif-delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}



.notif-item:last-child { border-bottom: none; }
.notif-item:hover { 
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%);
  transform: translateX(2px);
}

.notif-item.is-unread {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%);
}

.notif-item.is-unread:hover {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%);
}

.notif-icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.notif-item:hover .notif-icon-wrapper {
  transform: scale(1.05);
}

.icon-success,
.icon-warning,
.icon-error,
.icon-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%);
  color: #3b82f6;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.notif-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item.is-unread .notif-title {
  font-weight: 700;
  color: #111827;
}

.notif-time {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
}

.notif-item.is-unread .notif-time {
  color: #6b7280;
}

.notif-text {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-item.is-unread .notif-text {
  color: #4b5563;
}

.notif-unread-indicator {
  width: 10px;
  height: 10px;
  min-width: 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 50%;
  margin-top: 6px;
  margin-right: 4px;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15), 0 0 12px rgba(239, 68, 68, 0.4);
  animation: indicatorPulse 1.5s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes indicatorPulse {
  0%, 100% { 
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15), 0 0 12px rgba(239, 68, 68, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.1), 0 0 18px rgba(239, 68, 68, 0.6);
  }
}

.notif-drop-enter-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.notif-drop-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.notif-drop-enter-from { opacity: 0; transform: translateY(-12px) scale(0.95); }
.notif-drop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

@media (max-width: 768px) {
  .notif-dropdown {
    position: fixed;
    top: 60px;
    left: 10px;
    right: 10px;
    width: auto;
    max-height: 60vh;
    right: auto;
  }
}

.notif-list {
  overflow-y: auto;
  flex: 1;
  padding: 4px 0;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.notif-list::-webkit-scrollbar {
  width: 10px;
}

.notif-list::-webkit-scrollbar-track {
  background: rgba(59, 130, 246, 0.05);
  margin: 4px 0;
  border-radius: 5px;
}

.notif-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.notif-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.clear-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 16px;
}

.clear-confirm-dialog {
  background: #fff;
  border-radius: 14px;
  padding: 28px 32px 22px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  text-align: center;
  min-width: 260px;
}

.clear-confirm-text {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 22px;
}

.clear-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.clear-btn-cancel {
  padding: 8px 28px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  transition: all 0.2s;
}

.clear-btn-cancel:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px -4px rgba(59, 130, 246, 0.5);
}

.clear-btn-confirm {
  padding: 8px 28px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  transition: all 0.2s;
}

.clear-btn-confirm:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 12px -4px rgba(239, 68, 68, 0.5);
}

.delete-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

.delete-confirm-dialog {
  background: #fff;
  border-radius: 14px;
  padding: 28px 32px 22px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  text-align: center;
  min-width: 240px;
}

.delete-confirm-text {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 22px;
}

.delete-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
