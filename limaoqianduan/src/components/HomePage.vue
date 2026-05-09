<template>
  <div class="home-page">
    <NavBar
      :currentPage="currentPage"
      :isLoggedIn="isLoggedIn"
      :userEmail="userEmail"
      :nickname="editNickname"
      :userAvatar="userAvatar"
      :searchQuery="searchQuery"
      :quickSearchResults="quickSearchResults"
      @navigate="currentPage = $event"
      @openAuth="openAuth"
      @logout="handleLogout"
      @editProfile="showProfileEdit = true"
      @scrollToTop="scrollToTop"
      @scrollToProjects="scrollToProjects"
      @navSearch="handleNavSearch"
      @projectClick="handleProjectClick"
      @update:searchQuery="searchQuery = $event"
      @toggleProductSidebar="showProductSidebar = !showProductSidebar"
    >
      <template #extra-actions>
        <NotificationPanel
          :isLoggedIn="isLoggedIn"
          :token="token"
          @application-notification="handleApplicationNotification"
        />
      </template>
    </NavBar>

    <ProductSidebar
      v-if="showProductSidebar"
      :projects="productList"
      :activeCategory="activeCategory"
      @close="showProductSidebar = false"
      @selectCategory="handleCategoryChange"
      @selectProject="handleBuy"
    />

    <template v-if="currentPage === 'forum'">
      <ForumPage
        :isLoggedIn="isLoggedIn"
        :isAdmin="isAdmin"
        :userId="userId"
        :token="token"
        @openAuth="openAuth"
      />
    </template>

    <AiChatPage
      ref="aiChatRef"
      v-if="currentPage === 'ai'"
      :isLoggedIn="isLoggedIn"
      :token="token"
      :userId="userId"
      :userEmail="userEmail"
      @openAuth="openAuth"
    />

    <template v-if="currentPage === 'home'">
      <HeroSection
        :isLoggedIn="isLoggedIn"
        :stats="heroStats"
        @freeSource="handleFreeSource"
        @scrollToProjects="scrollToProjects"
        @scrollToServices="scrollToServices"
        @navigateToAI="currentPage = 'ai'"
      />

      <ProjectsSection
        :isLoggedIn="isLoggedIn"
        :projects="filteredProjects"
        :activeCategory="activeCategory"
        :loading="projectsLoading"
        @update:activeCategory="handleCategoryChange"
        @projectClick="handleProjectClick"
        @download="handleDirectDownload"
        @buy="handleBuy"
        @openAuth="openAuth"
      />

      <ServicesSection />
    </template>

    <AuthModal
      ref="authModalRef"
      :show="showAuthModal"
      :mode="mode"
      :apiBase="API_BASE"
      @close="closeAuth"
      @success="handleLoginSuccess"
      @toast="showToast"
      @update:mode="mode = $event"
    />

    <SourceModal
      :show="showSourceModal"
      :project="currentProject"
      @close="showSourceModal = false"
      @download="handleDownload"
    />

    <BaseModal :show="showPayModal" modal-class="pay-modal" @close="closePayModal">
      <div class="modal-header">
        <h2>购买商品</h2>
      </div>
      <div v-if="payProject" class="pay-content">
        <div class="pay-product-info">
          <div class="pay-product-name">{{ payProject.name }}</div>
          <div class="pay-product-type">{{ payProject.productType === 'custom' ? '定制开发' : '源码' }}</div>
          <div class="pay-product-price">
            <span class="pay-price-current">¥{{ payProject.price }}</span>
            <span v-if="payProject.originalPrice && payProject.originalPrice > payProject.price" class="pay-price-original">¥{{ payProject.originalPrice }}</span>
          </div>
        </div>

        <div v-if="payStatus === 'idle'" class="pay-methods">
          <p class="pay-method-label">选择支付方式</p>
          <button class="pay-method-btn" @click="startPay('alipay_qr')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7z"/></svg>
            支付宝扫码支付
          </button>
          <button class="pay-method-btn" @click="startPay('alipay_h5')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
            支付宝手机支付
          </button>
        </div>

        <div v-else-if="payStatus === 'loading'" class="pay-status">
          <div class="loading-spinner"></div>
          <p>正在创建订单...</p>
        </div>

        <div v-else-if="payStatus === 'qrcode'" class="pay-qrcode">
          <p class="pay-tip">请使用支付宝扫描二维码支付</p>
          <div class="qr-container">
            <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(payQrCode)" alt="支付二维码" class="qr-image"/>
          </div>
          <p class="pay-amount">支付金额：<strong>¥{{ payAmount }}</strong></p>
          <p class="pay-waiting">等待支付中...</p>
        </div>

        <div v-else-if="payStatus === 'polling'" class="pay-status">
          <div class="loading-spinner"></div>
          <p>请在支付宝中完成支付</p>
          <p class="pay-amount">支付金额：<strong>¥{{ payAmount }}</strong></p>
        </div>

        <div v-else-if="payStatus === 'paid'" class="pay-result success">
          <svg viewBox="0 0 24 24" fill="none" stroke="#00b42a" stroke-width="2" width="48" height="48"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p>支付成功！</p>
          <p class="pay-result-desc">您可以在个人中心查看订单详情</p>
        </div>

        <div v-else-if="payStatus === 'purchased'" class="pay-result success">
          <svg viewBox="0 0 24 24" fill="none" stroke="#00b42a" stroke-width="2" width="48" height="48"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p>您已购买过该商品</p>
        </div>

        <div v-else-if="payStatus === 'error'" class="pay-result error">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f53f3f" stroke-width="2" width="48" height="48"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <p>支付失败</p>
          <p class="pay-result-desc">请稍后重试</p>
        </div>
      </div>
    </BaseModal>

    <ProfileModal
      :show="showProfileEdit"
      :nickname="editNickname"
      :userEmail="userEmail"
      :userAvatar="userAvatar"
      :uploadingAvatar="uploadingAvatar"
      :saving="savingProfile"
      :token="token"
      @close="showProfileEdit = false"
      @save="saveProfile"
      @uploadAvatar="handleAvatarUpload"
      @update:nickname="editNickname = $event"
      @goToPost="handleGoToPost"
    />

    <div v-if="toast.show" :class="['toast', toast.type]">
      <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import NavBar from './NavBar.vue'
import ProductSidebar from './ProductSidebar.vue'
import HeroSection from './HeroSection.vue'
import ProjectsSection from './ProjectsSection.vue'
import ServicesSection from './ServicesSection.vue'
import AuthModal from './AuthModal.vue'
import SourceModal from './SourceModal.vue'
import ProfileModal from './ProfileModal.vue'
import BaseModal from './BaseModal.vue'
import ForumPage from './ForumPage.vue'
import AiChatPage from './AiChatPage.vue'
import NotificationPanel from './NotificationPanel.vue'
import { getImageUrl, CATEGORIES } from '../constants'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const mode = ref('login')
const showAuthModal = ref(false)
const isLoggedIn = ref(false)
const userEmail = ref('')
const editNickname = ref('')
const userAvatar = ref('')
const showSourceModal = ref(false)
const currentProject = ref(null)
const showProductSidebar = ref(false)

const searchQuery = ref('')
const activeCategory = ref('all')
const filteredProjects = ref([])
const showProfileEdit = ref(false)
const uploadingAvatar = ref(false)
const savingProfile = ref(false)
const authModalRef = ref(null)
const aiChatRef = ref(null)

const currentPage = ref('home')
const isAdmin = ref(false)
const userId = ref(null)
const token = ref('')

const projects = ref([])
const projectsLoading = ref(false)
const heroStats = ref({ users: 0, posts: 0, comments: 0 })

const quickSearchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return projects.value.filter(p =>
    p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
  ).slice(0, 5)
})

const toast = ref({ show: false, message: '', type: 'success' })

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToProjects() {
  const el = document.getElementById('projects')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function scrollToServices() {
  const el = document.getElementById('services')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function handleNavSearch() {
  handleSearch()
  scrollToProjects()
}

function handleFreeSource() {
  if (!isLoggedIn.value) {
    openAuth('register')
  } else {
    const el = document.getElementById('projects')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
}

function handleSearch() {
  const q = searchQuery.value.trim().toLowerCase()
  filteredProjects.value = projects.value.filter(p => {
    const matchCategory = activeCategory.value === 'all' || p.category === activeCategory.value
    const matchQuery = !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    return matchCategory && matchQuery
  })
}

function handleCategoryChange(key) {
  activeCategory.value = key
  fetchProjects(key)
}

function getAvailableLinks(links) {
  if (!links) return []
  const result = []
  if (links.source_link_github) result.push(links.source_link_github)
  if (links.source_link_gitee) result.push(links.source_link_gitee)
  if (links.source_link_aliyun) result.push(links.source_link_aliyun)
  if (links.source_link_baidu) result.push(links.source_link_baidu)
  if (links.source_link_tencent) result.push(links.source_link_tencent)
  return result
}

function handleDirectDownload(project) {
  if (project.category === 'AI') return
  if (!isLoggedIn.value) {
    showToast('请先登录后下载源码', 'warning')
    openAuth('login')
    return
  }
  const availableLinks = getAvailableLinks(project?.links)
  if (availableLinks.length === 0) {
    showToast('暂无可用的下载链接', 'error')
    return
  }
  if (availableLinks.length === 1) {
    window.open(availableLinks[0], '_blank')
    return
  }
  currentProject.value = project
  showSourceModal.value = true
}

function handleProjectClick(project) {
  if (project.category === 'AI') {
    currentPage.value = 'ai'
    return
  }
  if (!isLoggedIn.value) {
    showToast('请先登录后下载源码', 'warning')
    openAuth('login')
    return
  }
  const availableLinks = getAvailableLinks(project?.links)
  if (availableLinks.length === 0) {
    showToast('暂无可用的下载链接', 'error')
    return
  }
  if (availableLinks.length === 1) {
    window.open(availableLinks[0], '_blank')
    return
  }
  currentProject.value = project
  showSourceModal.value = true
}

function handleDownload() {
  const links = currentProject.value?.links
  if (!links) {
    showToast('暂无可用的下载链接', 'error')
    return
  }
  const url = links.source_link_github || links.source_link_gitee || links.source_link_aliyun || links.source_link_baidu || links.source_link_tencent
  if (url) {
    window.open(url, '_blank')
  } else {
    showToast('暂无可用的下载链接', 'error')
  }
}

function openSourceModal(project) {
  currentProject.value = project
  showSourceModal.value = true
}

async function handleAvatarUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  uploadingAvatar.value = true
  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const res = await axios.post(`${API_BASE}/forum/user/avatar`, formData, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    if (res.data.success) {
      const updatedUser = res.data.user
      userAvatar.value = getImageUrl(updatedUser.avatar)
      showToast('头像上传成功', 'success')
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  } catch (err) {
    showToast(err.response?.data?.message || '上传失败，请重试', 'error')
  } finally {
    uploadingAvatar.value = false
    event.target.value = ''
  }
}

async function saveProfile() {
  if (!editNickname.value.trim()) {
    showToast('请输入昵称', 'error')
    return
  }

  savingProfile.value = true
  try {
    const res = await axios.put(
      `${API_BASE}/forum/user/profile`,
      { nickname: editNickname.value.trim() },
      { headers: { Authorization: `Bearer ${token.value}` } }
    )
    if (res.data.success) {
      showToast('资料保存成功', 'success')
      const updatedUser = res.data.user
      localStorage.setItem('user', JSON.stringify(updatedUser))
      editNickname.value = updatedUser.nickname || updatedUser.email.split('@')[0]
      showProfileEdit.value = false
    }
  } catch (err) {
    showToast(err.response?.data?.message || '保存失败，请重试', 'error')
  } finally {
    savingProfile.value = false
  }
}

function openAuth(m) {
  mode.value = m
  showAuthModal.value = true
}

function handleGoToPost(postId) {
  showProfileEdit.value = false
  currentPage.value = 'forum'
  setTimeout(() => {
    const event = new CustomEvent('limao-open-post', { detail: { postId } })
    window.dispatchEvent(event)
  }, 300)
}

const showPayModal = ref(false)
const payProject = ref(null)
const payQrCode = ref('')
const payOrderNo = ref('')
const payAmount = ref('')
const payPolling = ref(null)
const payStatus = ref('idle')

function handleBuy(project) {
  if (!isLoggedIn.value) {
    openAuth('login')
    return
  }
  payProject.value = project
  payQrCode.value = ''
  payOrderNo.value = ''
  payAmount.value = ''
  payStatus.value = 'idle'
  showPayModal.value = true
}

async function startPay(payMethod) {
  if (!payProject.value) return
  payStatus.value = 'loading'
  try {
    const res = await axios.post(`${API_BASE}/payment/create`, {
      productId: payProject.value.id,
      payMethod
    }, { headers: { Authorization: `Bearer ${token.value}` } })
    if (res.data.alreadyPurchased) {
      payStatus.value = 'purchased'
      return
    }
    if (!res.data.success) {
      payStatus.value = 'error'
      return
    }
    payOrderNo.value = res.data.orderNo
    payAmount.value = res.data.amount
    if (payMethod === 'alipay_h5' && res.data.payUrl) {
      window.open(res.data.payUrl, '_blank')
      payStatus.value = 'polling'
      startPolling()
    } else if (res.data.qrCode) {
      payQrCode.value = res.data.qrCode
      payStatus.value = 'qrcode'
      startPolling()
    }
  } catch (e) {
    console.error('创建支付失败', e)
    payStatus.value = 'error'
  }
}

function startPolling() {
  stopPolling()
  payPolling.value = setInterval(async () => {
    if (!payOrderNo.value) return
    try {
      const res = await axios.get(`${API_BASE}/payment/status/${payOrderNo.value}`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      if (res.data.success && res.data.order.status === 'paid') {
        payStatus.value = 'paid'
        stopPolling()
      }
    } catch (e) { }
  }, 3000)
}

function stopPolling() {
  if (payPolling.value) {
    clearInterval(payPolling.value)
    payPolling.value = null
  }
}

function closePayModal() {
  stopPolling()
  showPayModal.value = false
  payProject.value = null
}

function closeAuth() {
    showAuthModal.value = false
  if (authModalRef.value) authModalRef.value.resetForm()
}

function handleLoginSuccess(data) {
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  isLoggedIn.value = true
  userEmail.value = data.user.email
  isAdmin.value = data.user.role === 'admin'
  userId.value = data.user.id
  token.value = data.token
  editNickname.value = data.user.nickname || data.user.email.split('@')[0]
  if (data.user.avatar) userAvatar.value = getImageUrl(data.user.avatar)
  closeAuth()
}

async function handleApplicationNotification() {
  if (aiChatRef.value) {
    await aiChatRef.value.forceRefreshAgentStatus()
  }
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('limao_api_') || key.startsWith('limao_chat_') || key.startsWith('limao_last_') || key.startsWith('limao_custom_') || key.startsWith('limao_session_msgs_'))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
  const sessionKeys = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith('limao_session_')) {
      sessionKeys.push(key)
    }
  }
  sessionKeys.forEach(k => sessionStorage.removeItem(k))
  isLoggedIn.value = false
  userEmail.value = ''
  isAdmin.value = false
  userId.value = null
  token.value = ''
  showToast('已退出登录', 'success')
}

let fetchProjectsAbort = null

async function fetchProjects(category = 'all') {
  if (fetchProjectsAbort) fetchProjectsAbort.abort()
  const controller = new AbortController()
  fetchProjectsAbort = controller
  projectsLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/forum/projects`, {
      params: { category, page: 1, pageSize: 20 },
      signal: controller.signal
    })
    if (res.data.success) {
      projects.value = res.data.projects
      handleSearch()
    }
  } catch (err) {
    if (axios.isCancel(err) || err.code === 'ERR_CANCELED') return
    console.error('获取项目列表失败', err)
  } finally {
    if (fetchProjectsAbort === controller) {
      projectsLoading.value = false
      fetchProjectsAbort = null
    }
  }
}

const productList = ref([])
const productListLoading = ref(false)

async function fetchProducts() {
  productListLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/products`, { params: { pageSize: 50 } })
    if (res.data.success) {
      productList.value = (res.data.products || []).map(p => ({
        id: p.id,
        name: p.name,
        desc: p.description || '',
        category: p.category,
        tags: p.tags || [p.category],
        price: p.price ? parseFloat(p.price) : null,
        originalPrice: p.original_price ? parseFloat(p.original_price) : null,
        productType: p.product_type,
        demoUrl: p.demo_url,
        downloadUrl: p.download_url,
        images: p.images || [],
        stars: 0,
        forks: 0,
        links: []
      }))
    }
  } catch (err) {
    console.error('获取产品列表失败', err)
  } finally {
    productListLoading.value = false
  }
}

async function fetchStats() {
  try {
    const res = await axios.get(`${API_BASE}/forum/stats`)
    if (res.data.success) {
      heroStats.value = res.data.stats
    }
  } catch (err) {
    console.error('获取统计数据失败', err)
  }
}

onMounted(() => {
  const savedToken = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  if (savedToken && user) {
    try {
      const payload = JSON.parse(atob(savedToken.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } else {
        isLoggedIn.value = true
        const userData = JSON.parse(user)
        userEmail.value = userData.email
        editNickname.value = userData.nickname || userData.email.split('@')[0]
        isAdmin.value = userData.role === 'admin'
        userId.value = userData.id
        token.value = savedToken
        if (userData.avatar) {
          userAvatar.value = getImageUrl(userData.avatar)
        }
      }
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
  fetchProjects()
  fetchProducts()
  fetchStats()
})
</script>

<style scoped>
.pay-modal { max-width: 440px; }
.pay-content { padding: 0; }
.pay-product-info { text-align: center; padding: 20px; background: linear-gradient(135deg, #fff7e6, #fff1f0); border-radius: 10px; margin-bottom: 20px; }
.pay-product-name { font-size: 18px; font-weight: 700; color: #1d2129; margin-bottom: 4px; }
.pay-product-type { font-size: 12px; color: #86909c; margin-bottom: 8px; }
.pay-product-price { display: flex; align-items: baseline; justify-content: center; gap: 8px; }
.pay-price-current { font-size: 28px; font-weight: 800; color: #f53f3f; }
.pay-price-original { font-size: 14px; color: #c9cdd4; text-decoration: line-through; }
.pay-methods { display: flex; flex-direction: column; gap: 12px; }
.pay-method-label { font-size: 13px; color: #86909c; margin-bottom: 4px; }
.pay-method-btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px; border: 1px solid #e5e6eb; border-radius: 10px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 600; color: #1d2129; transition: all 0.2s; }
.pay-method-btn:hover { border-color: #1677ff; color: #1677ff; background: rgba(22, 119, 255, 0.04); }
.pay-method-btn svg { color: #1677ff; }
.pay-status { text-align: center; padding: 30px 0; color: #86909c; }
.pay-status p { margin-top: 12px; }
.pay-qrcode { text-align: center; }
.pay-tip { font-size: 14px; color: #4e5969; margin-bottom: 16px; }
.qr-container { display: inline-block; padding: 12px; background: #fff; border: 2px solid #e5e6eb; border-radius: 10px; }
.qr-image { width: 200px; height: 200px; }
.pay-amount { margin-top: 16px; font-size: 14px; color: #4e5969; }
.pay-amount strong { color: #f53f3f; font-size: 18px; }
.pay-waiting { margin-top: 8px; font-size: 12px; color: #c9cdd4; }
.loading-spinner { width: 32px; height: 32px; border: 3px solid #e5e6eb; border-top-color: #409eff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.pay-result { text-align: center; padding: 30px 0; }
.pay-result p { margin-top: 12px; font-size: 16px; font-weight: 600; }
.pay-result.success p { color: #00b42a; }
.pay-result.error p { color: #f53f3f; }
.pay-result-desc { font-size: 13px !important; font-weight: 400 !important; color: #86909c !important; margin-top: 4px !important; }

.home-page {
  min-height: 100vh;
  background: #f5f7fa;
  color: #1d2129;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow-x: hidden;
}

.toast {
  position: fixed;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: toast-in 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.toast.success {
  background: #fff;
  border: 1px solid rgba(0, 180, 42, 0.2);
  color: #00b42a;
}

.toast.error {
  background: #fff;
  border: 1px solid rgba(245, 63, 63, 0.2);
  color: #f53f3f;
}

.toast.warning {
  background: #fff;
  border: 1px solid rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.toast-icon { font-weight: bold; font-size: 14px; }

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1d2129;
  letter-spacing: -0.3px;
}
</style>
