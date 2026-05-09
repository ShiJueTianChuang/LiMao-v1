<template>
  <section id="home" class="hero">
    <div class="hero-particles">
      <div v-for="p in particles" :key="p.id" class="particle" :style="p.style"></div>
    </div>
    <div class="hero-content">
      <div class="hero-badge">🚀 开源 · 创新 · 极客精神</div>
      <h1 class="hero-title">
        <span class="title-line">开源代码</span>
        <span class="title-highlight">共享平台</span>
      </h1>
      <p class="hero-desc">探索优质开源项目，获取专业软件开发服务。小程序、网站、APP定制开发，一站式技术解决方案。</p>
      <div class="hero-actions">
        <button class="btn-primary" @click="$emit('scrollToProjects')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          浏览项目
        </button>
        <button class="btn-outline" @click="$emit('scrollToServices')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
          开发服务
        </button>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-num">{{ stats.posts }}+</span>
          <span class="stat-label">开源项目</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ stats.comments }}+</span>
          <span class="stat-label">开发案例</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ stats.users }}+</span>
          <span class="stat-label">服务用户</span>
        </div>
      </div>
    </div>
    <div class="hero-visual">
      <div class="ai-feature-card" @click="$emit('navigateToAI')">
        <div class="card-glow"></div>
        <div class="card-accent"></div>
        <div class="card-header">
          <div class="ai-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div class="card-title-group">
            <h3>代码编辑器</h3>
            <span class="card-subtitle">高效编码 · 智能提示 · 代码管理</span>
          </div>
        </div>
        <div class="feature-tags">
          <span class="feature-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            智能编写
          </span>
          <span class="feature-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            一键修复
          </span>
          <span class="feature-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            性能优化
          </span>
          <span class="feature-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            逻辑解读
          </span>
        </div>
        <div class="model-tags">
          <span class="model-tag">Vue</span>
          <span class="model-tag">React</span>
          <span class="model-tag">TypeScript</span>
          <span class="model-tag">Node.js</span>
        </div>
        <div class="card-action">
          <span>打开编辑器</span>
        </div>
      </div>
    </div>
  </section>

  <section class="free-source-banner">
    <div class="banner-inner">
      <div class="banner-left">
        <div class="banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
        <div class="banner-text">
          <h3>免费开源源码</h3>
          <p>注册即可获取全部源码，免费下载，即拿即用</p>
        </div>
      </div>
      <button class="banner-btn" @click="$emit('freeSource')">
        <span v-if="!isLoggedIn">注册免费获取</span>
        <span v-else>进入源码库</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  isLoggedIn: Boolean,
  stats: { type: Object, default: () => ({ users: 0, posts: 0, comments: 0 }) }
})

defineEmits(['freeSource', 'scrollToProjects', 'scrollToServices', 'navigateToAI'])

const particles = ref([])

onMounted(() => {
  particles.value = Array.from({ length: 40 }, (_, i) => {
    const size = Math.random() * 4 + 1
    return {
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${Math.random() * 6}s`,
        animationDuration: `${Math.random() * 4 + 4}s`
      }
    }
  })
})
</script>

<style scoped>
.hero {
  min-height: 92vh;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 72px 24px 60px;
  position: relative;
  gap: 48px;
}

.hero-content {
  flex: 1;
  position: relative;
  z-index: 2;
  padding-top: 8vh;
}

.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 20px;
  font-size: 13px;
  color: #409eff;
  margin-bottom: 24px;
  letter-spacing: 1px;
}

.hero-title {
  font-size: 44px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 18px;
}

.title-line {
  display: block;
  color: #1d2129;
}

.title-highlight {
  display: block;
  background: linear-gradient(135deg, #409eff, #1a6dd4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 15px;
  color: #86909c;
  line-height: 1.8;
  margin-bottom: 32px;
  max-width: 480px;
}

.hero-actions {
  display: flex;
  gap: 14px;
  margin-bottom: 40px;
}

.btn-primary,
.btn-outline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
  letter-spacing: 0.5px;
  font-family: inherit;
}

.btn-primary {
  background: #409eff;
  border: none;
  color: #fff;
}

.btn-primary:hover {
  background: #1a6dd4;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

.btn-outline {
  background: #fff;
  border: 1px solid #e5e6eb;
  color: #4e5969;
}

.btn-outline:hover {
  border-color: #409eff;
  color: #409eff;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-num {
  font-family: 'Orbitron', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #c9cdd4;
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #e5e6eb;
}

.hero-visual {
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  padding-top: 14vh;
}

.ai-feature-card {
  width: 320px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 0 22px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(64, 158, 255, 0.08);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(64, 158, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.ai-feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(64, 158, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.04);
  border-color: rgba(64, 158, 255, 0.35);
}

.card-accent {
  height: 4px;
  background: linear-gradient(90deg, #409eff, #1a6dd4, #409eff);
  background-size: 200% 100%;
  animation: accentShift 4s ease infinite;
  margin: 0 -22px 28px;
}

@keyframes accentShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(64, 158, 255, 0.08), transparent, rgba(64, 158, 255, 0.04), transparent);
  animation: glowRotate 8s linear infinite;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.4s;
}

.ai-feature-card:hover .card-glow {
  opacity: 1;
}

@keyframes glowRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 26px;
}

.ai-icon-large {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #409eff, #1a6dd4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
}

.card-title-group h3 {
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 4px;
}

.card-subtitle {
  font-size: 12px;
  color: #86909c;
}

.feature-tags {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 24px;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 12px;
  background: rgba(64, 158, 255, 0.06);
  border: 1px solid rgba(64, 158, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: #4e5969;
  font-weight: 500;
  transition: all 0.3s;
}

.feature-tag svg {
  color: #409eff;
  flex-shrink: 0;
}

.ai-feature-card:hover .feature-tag {
  background: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
}

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.08);
}

.model-tag {
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.06), rgba(26, 109, 212, 0.08));
  border-radius: 6px;
  font-size: 11px;
  color: #409eff;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.card-action {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 13px;
  background: linear-gradient(135deg, #409eff, #1a6dd4);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.card-action::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.5s;
}

.ai-feature-card:hover .card-action::before {
  left: 100%;
}

.ai-feature-card:hover .card-action {
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

.free-source-banner {
  background: #fff;
  border-top: 1px solid #e5e6eb;
  border-bottom: 1px solid #e5e6eb;
  padding: 0 24px;
}

.banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-icon {
  width: 48px;
  height: 48px;
  background: #409eff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.banner-text h3 { font-size: 16px; font-weight: 700; color: #1d2129; margin-bottom: 2px; }
.banner-text p { font-size: 13px; color: #86909c; }

.banner-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: #409eff;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.banner-btn:hover {
  background: #1a6dd4;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .hero { flex-direction: column; padding-top: 60px; gap: 40px; min-height: auto; }
  .hero-content, .hero-visual { padding-top: 0; }
  .hero-visual { width: 100%; }
  .ai-feature-card { width: 100%; max-width: 380px; }
}

@media (max-width: 768px) {
  .hero { padding-top: 56px; }
  .hero-title { font-size: 28px; }
  .hero-desc { font-size: 14px; max-width: 100%; }
  .hero-actions { flex-direction: column; gap: 10px; width: 100%; }
  .btn-primary, .btn-outline { width: 100%; justify-content: center; }
  .hero-stats { width: 100%; justify-content: space-around; flex-wrap: wrap; gap: 16px; }
  .banner-inner { flex-direction: column; gap: 12px; text-align: center; padding: 16px 12px; }
  .banner-left { flex-direction: column; }
  .ai-feature-card { width: 100%; padding: 24px 20px 16px; }
}

@media (max-width: 480px) {
  .hero { padding: 56px 16px 40px; }
  .hero-title { font-size: 24px; }
  .hero-badge { font-size: 12px; padding: 5px 12px; }
  .hero-desc { font-size: 13px; }
  .stat-num { font-size: 22px; }
  .stat-label { font-size: 11px; }
}
</style>
