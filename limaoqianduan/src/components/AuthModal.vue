<template>
  <BaseModal :show="show" @close="$emit('close')">
    <div class="modal-header">
          <h2 v-if="mode === 'login'">欢迎回来</h2>
          <h2 v-else-if="mode === 'register'">创建账号</h2>
          <h2 v-else>重置密码</h2>
          <p v-if="mode === 'login'">登录您的账号以继续</p>
          <p v-else-if="mode === 'register'">注册一个新账号</p>
          <p v-else>通过邮箱验证码重置密码</p>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="input-group">
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <input v-model="email" type="email" placeholder="请输入邮箱地址" class="input-field"/>
          </div>

          <div v-if="mode === 'login'" class="input-group">
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" class="input-field"/>
            <button type="button" class="toggle-pwd" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>

          <div v-if="mode === 'login'" class="login-method-switch">
            <span class="method-text">{{ loginByCode ? '使用密码登录' : '使用验证码登录' }}</span>
            <span class="method-link" @click="loginByCode = !loginByCode; code = ''">切换</span>
          </div>

          <div v-if="mode === 'login' && loginByCode" class="input-group code-group">
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <input v-model="code" type="text" placeholder="请输入验证码" class="input-field" maxlength="6"/>
            <button type="button" class="send-code-btn" :disabled="countdown > 0 || sendingCode" @click="sendCode">
              <span v-if="sendingCode" class="btn-loading"></span>
              <span v-else-if="countdown > 0">{{ countdown }}s</span>
              <span v-else>获取验证码</span>
            </button>
          </div>

          <div v-if="mode === 'register'" class="input-group">
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <input v-model="password" type="password" placeholder="请设置密码（至少6位）" class="input-field"/>
          </div>

          <div v-if="mode === 'register'" class="input-group">
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <input v-model="confirmPassword" type="password" placeholder="请确认密码" class="input-field"/>
          </div>

          <div v-if="mode === 'register'" class="input-group code-group">
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <input v-model="code" type="text" placeholder="请输入验证码" class="input-field" maxlength="6"/>
            <button type="button" class="send-code-btn" :disabled="countdown > 0 || sendingCode" @click="sendCode">
              <span v-if="sendingCode" class="btn-loading"></span>
              <span v-else-if="countdown > 0">{{ countdown }}s</span>
              <span v-else>获取验证码</span>
            </button>
          </div>

          <div v-if="mode === 'reset'" class="input-group">
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <input v-model="newPassword" type="password" placeholder="请输入新密码（至少6位）" class="input-field"/>
          </div>

          <div v-if="mode === 'reset'" class="input-group code-group">
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <input v-model="code" type="text" placeholder="请输入验证码" class="input-field" maxlength="6"/>
            <button type="button" class="send-code-btn" :disabled="countdown > 0 || sendingCode" @click="sendCode">
              <span v-if="sendingCode" class="btn-loading"></span>
              <span v-else-if="countdown > 0">{{ countdown }}s</span>
              <span v-else>获取验证码</span>
            </button>
          </div>

          <SlideVerify v-if="mode === 'register' || (mode === 'login' && loginByCode)" ref="slideVerifyRef" @verified="onSlideVerified"/>

          <div v-if="mode === 'register'" class="agreement-checkbox">
            <label class="agreement-label">
              <input type="checkbox" v-model="agreed" />
              <span class="agreement-text">我已阅读并同意</span>
            </label>
            <div class="agreement-links">
              <button type="button" class="agreement-link" @click.stop="openAgreement('terms')">《用户协议》</button>
              <span class="agreement-and">和</span>
              <button type="button" class="agreement-link" @click.stop="openAgreement('privacy')">《隐私政策》</button>
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="submitting || (mode === 'register' && !agreed)">
            <span v-if="submitting" class="btn-loading"></span>
            <span v-else-if="mode === 'login'">登 录</span>
            <span v-else-if="mode === 'register'">注 册</span>
            <span v-else>重置密码</span>
          </button>

          <div class="form-footer">
            <template v-if="mode === 'login'">
              <span class="form-link" @click="switchMode('reset')">忘记密码？</span>
              <span class="form-divider">|</span>
              <span class="form-text">还没有账号？</span>
              <span class="form-link" @click="switchMode('register')">立即注册</span>
            </template>
            <template v-else-if="mode === 'register'">
              <span class="form-text">已有账号？</span>
              <span class="form-link" @click="switchMode('login')">立即登录</span>
            </template>
            <template v-else>
              <span class="form-text">想起密码了？</span>
              <span class="form-link" @click="switchMode('login')">返回登录</span>
            </template>
          </div>
        </form>
  </BaseModal>

  <Teleport to="body">
    <transition name="agreement-fade">
    <div v-if="showAgreementModal" class="agreement-modal-overlay" @click.self="showAgreementModal = false">
      <div class="agreement-modal">
        <div class="agreement-modal-header">
          <h3>{{ agreementTitle }}</h3>
          <button class="agreement-modal-close" @click="showAgreementModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="agreement-modal-body">
          <div style="white-space: pre-wrap; line-height: 1.8; font-size: 14px;">{{ agreementContent }}</div>
        </div>
      </div>
    </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import BaseModal from './BaseModal.vue'
import SlideVerify from './SlideVerify.vue'

const props = defineProps({
  show: Boolean,
  mode: String,
  apiBase: String
})

const emit = defineEmits(['close', 'success', 'toast'])

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const newPassword = ref('')
const code = ref('')
const countdown = ref(0)
const sendingCode = ref(false)
const submitting = ref(false)
const slideVerified = ref(false)
const slideVerifyRef = ref(null)
const loginByCode = ref(false)
const showPassword = ref(false)
const agreed = ref(false)
const showAgreementModal = ref(false)
const agreementTitle = ref('')
const agreementContent = ref('')

function switchMode(m) {
  password.value = ''
  confirmPassword.value = ''
  newPassword.value = ''
  code.value = ''
  slideVerified.value = false
  loginByCode.value = false
  showPassword.value = false
  agreed.value = false
  if (slideVerifyRef.value) slideVerifyRef.value.reset()
  emit('update:mode', m)
}

function onSlideVerified() {
  slideVerified.value = true
}

const agreementData = ref([])

async function openAgreement(type) {
  try {
    if (agreementData.value.length === 0) {
      const res = await axios.get(`${props.apiBase}/agreements`)
      if (res.data.success) agreementData.value = res.data.data
    }
    const item = agreementData.value.find(a => a.type === type)
    if (item) {
      agreementTitle.value = item.title
      agreementContent.value = item.content
      showAgreementModal.value = true
    }
  } catch (e) {
    emit('toast', '加载协议失败', 'error')
  }
}

async function sendCode() {
  if (!email.value.trim()) { emit('toast', '请输入邮箱地址', 'error'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { emit('toast', '邮箱格式不正确', 'error'); return }
  sendingCode.value = true
  try {
    const res = await axios.post(`${props.apiBase}/send-code`, { email: email.value.trim() })
    if (res.data.success) {
      emit('toast', '验证码已发送至邮箱', 'success')
      countdown.value = 60
      const timer = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(timer) }, 1000)
    } else { emit('toast', res.data.message || '发送失败', 'error') }
  } catch (err) { emit('toast', err.response?.data?.message || '发送失败', 'error') }
  finally { sendingCode.value = false }
}

async function handleSubmit() {
  if (!email.value.trim()) { emit('toast', '请输入邮箱地址', 'error'); return }

  if (props.mode === 'login') {
    if (loginByCode.value) {
      if (!code.value.trim()) { emit('toast', '请输入验证码', 'error'); return }
      if (!slideVerified.value) { emit('toast', '请先完成滑动验证', 'error'); return }
    } else {
      if (!password.value) { emit('toast', '请输入密码', 'error'); return }
    }
  }

  if (props.mode === 'register') {
    if (!password.value) { emit('toast', '请输入密码', 'error'); return }
    if (password.value.length < 6) { emit('toast', '密码长度不能少于6位', 'error'); return }
    if (password.value.length > 128) { emit('toast', '密码长度不能超过128位', 'error'); return }
    if (password.value !== confirmPassword.value) { emit('toast', '两次密码不一致', 'error'); return }
    if (!code.value.trim()) { emit('toast', '请输入验证码', 'error'); return }
    if (!slideVerified.value) { emit('toast', '请先完成滑动验证', 'error'); return }
    if (!agreed.value) { emit('toast', '请先阅读并同意用户协议和隐私政策', 'error'); return }
  }

  if (props.mode === 'reset') {
    if (!newPassword.value) { emit('toast', '请输入新密码', 'error'); return }
    if (newPassword.value.length < 6) { emit('toast', '密码长度不能少于6位', 'error'); return }
    if (newPassword.value.length > 128) { emit('toast', '密码长度不能超过128位', 'error'); return }
    if (!code.value.trim()) { emit('toast', '请输入验证码', 'error'); return }
  }

  submitting.value = true
  try {
    let url = '', data = {}
    const fullEmail = email.value.trim()
    if (props.mode === 'login') {
      url = `${props.apiBase}/login`
      data = loginByCode.value
        ? { email: fullEmail, code: code.value.trim() }
        : { email: fullEmail, password: password.value }
    } else if (props.mode === 'register') {
      url = `${props.apiBase}/register`
      data = { email: fullEmail, password: password.value, code: code.value.trim(), agreed: true }
    } else {
      url = `${props.apiBase}/reset-password`
      data = { email: fullEmail, newPassword: newPassword.value, code: code.value.trim() }
    }

    const res = await axios.post(url, data)
    if (res.data.success) {
      emit('toast', props.mode === 'login' ? '登录成功' : props.mode === 'register' ? '注册成功' : '密码修改成功', 'success')
      if (props.mode === 'login') {
        emit('success', res.data)
      } else {
        switchMode('login')
      }
    } else { emit('toast', res.data.message || '操作失败', 'error') }
  } catch (err) { emit('toast', err.response?.data?.message || '操作失败', 'error') }
  finally {
    submitting.value = false
    if (slideVerifyRef.value) slideVerifyRef.value.reset()
    slideVerified.value = false
  }
}

function resetForm() {
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  newPassword.value = ''
  code.value = ''
  slideVerified.value = false
  loginByCode.value = false
  showPassword.value = false
  agreed.value = false
}

defineExpose({ resetForm })
</script>

<style scoped>
.modal-card { width: 380px; }
.modal-header { margin-bottom: 20px; }
.modal-header h2 { font-size: 18px; font-weight: 700; color: #1d2129; margin-bottom: 4px; }
.modal-header p { font-size: 13px; color: #86909c; }

.auth-form { display: flex; flex-direction: column; gap: 12px; }

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  transition: all 0.3s;
  overflow: hidden;
}

.input-group:focus-within {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
  background: #fff;
}

.input-icon { width: 38px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.input-icon svg { width: 15px; height: 15px; color: #c9cdd4; }

.input-field {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #1d2129;
  font-size: 13px;
  padding: 11px 0;
}

.input-field::placeholder { color: #c9cdd4; }

.toggle-pwd {
  background: none;
  border: none;
  color: #c9cdd4;
  cursor: pointer;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  transition: color 0.3s;
}

.toggle-pwd:hover { color: #86909c; }

.login-method-switch { display: flex; align-items: center; justify-content: flex-end; gap: 6px; font-size: 12px; }
.method-text { color: #c9cdd4; }
.method-link { color: #409eff; cursor: pointer; transition: color 0.2s; }
.method-link:hover { color: #1a6dd4; }

.code-group { padding-right: 0; }

.send-code-btn {
  flex-shrink: 0;
  padding: 7px 12px;
  background: rgba(64, 158, 255, 0.08);
  border: none;
  border-left: 1px solid #e5e6eb;
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
  min-width: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.send-code-btn:hover:not(:disabled) { background: rgba(64, 158, 255, 0.12); }
.send-code-btn:disabled { color: #c9cdd4; cursor: not-allowed; }

.submit-btn {
  width: 100%;
  padding: 11px;
  background: #409eff;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: #1a6dd4;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
}

.form-text { color: #c9cdd4; }
.form-divider { color: #e5e6eb; margin: 0 4px; }
.form-link { color: #409eff; cursor: pointer; transition: color 0.2s; }
.form-link:hover { color: #1a6dd4; }

.agreement-checkbox {
  padding: 6px 0;
}

.agreement-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 4px;
}

.agreement-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #409eff;
  flex-shrink: 0;
}

.agreement-text {
  font-size: 13px;
  color: #4e5969;
  line-height: 1.8;
}

.agreement-links {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 24px;
}

.agreement-and {
  font-size: 13px;
  color: #4e5969;
}

.agreement-link {
  color: #409eff;
  cursor: pointer;
  background: none;
  border: none;
  border-bottom: 1px dashed #409eff;
  font-size: 13px;
  padding: 4px 8px;
  line-height: 1.6;
  white-space: nowrap;
  outline: none;
  border-radius: 4px;
}

.agreement-link:hover {
  color: #1a6dd4;
  background: rgba(64, 158, 255, 0.06);
}

.agreement-fade-enter-active,
.agreement-fade-leave-active {
  transition: opacity 0.25s ease;
}

.agreement-fade-enter-active .agreement-modal,
.agreement-fade-leave-active .agreement-modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.agreement-fade-enter-from,
.agreement-fade-leave-to {
  opacity: 0;
}

.agreement-fade-enter-from .agreement-modal,
.agreement-fade-leave-to .agreement-modal {
  transform: scale(0.95);
  opacity: 0;
}

.agreement-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.agreement-modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.agreement-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e6eb;
}

.agreement-modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.agreement-modal-close {
  background: none;
  border: none;
  color: #86909c;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.agreement-modal-close:hover {
  background: #f5f7fa;
  color: #1d2129;
}

.agreement-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.btn-loading {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .modal-card { width: 92%; max-width: 400px; padding: 24px 20px; }
}
</style>
