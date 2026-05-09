<template>
  <section id="projects" class="section projects-section">
    <div class="section-inner">
      <div class="section-header">
        <span class="section-tag">OPEN SOURCE</span>
        <h2 class="section-title">开源项目</h2>
        <p class="section-desc">精选优质开源项目，代码即拿即用，助力快速开发</p>
      </div>

      <div class="search-bar">
        <div class="filter-tabs">
          <div
            v-for="cat in categories"
            :key="cat.key"
            :class="['filter-tab', { active: activeCategory === cat.key }]"
            @click="$emit('update:activeCategory', cat.key)"
          >
            <span v-if="cat.icon" class="tab-icon" v-html="cat.icon"></span>
            {{ cat.label }}
          </div>
        </div>
      </div>

      <div v-if="loading" class="projects-loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-else-if="projects.length" class="project-grid">
        <div v-for="project in projects" :key="project.id || project.name" class="project-card" @click="$emit('projectClick', project)">
          <span v-if="project.productType !== 'source' && project.productType !== 'custom' && project.category !== 'AI'" class="download-btn" @click.stop="$emit('download', project)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span class="download-btn-text">源码</span>
          </span>
          <span v-if="project.price && project.price > 0" class="price-badge" @click.stop="$emit('buy', project)">
            <span class="price-current">¥{{ project.price }}</span>
            <span v-if="project.originalPrice && project.originalPrice > project.price" class="price-original">¥{{ project.originalPrice }}</span>
          </span>
          <span v-if="project.productType === 'source' || project.productType === 'custom'" class="type-badge" :class="project.productType">{{ project.productType === 'source' ? '源码' : '定制' }}</span>
          <div class="project-icon">
            <span class="project-emoji-icon" v-html="CATEGORY_ICONS[project.category] || ''"></span>
          </div>
          <h3 class="project-name">{{ project.name }}</h3>
          <p class="project-desc">{{ project.desc }}</p>
          <div class="project-tags">
            <span v-for="tag in project.tags" :key="tag" class="project-tag">{{ tag }}</span>
          </div>
          <div class="project-bottom">
            <div class="project-meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {{ project.stars }}
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                {{ project.forks }}
              </span>
            </div>
            <button v-if="project.price && project.price > 0" class="buy-btn" @click.stop="$emit('buy', project)">立即购买</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>没有找到匹配的项目</p>
        <span>试试其他关键词或分类</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { CATEGORIES, CATEGORY_ICONS } from '../constants'

defineProps({
  isLoggedIn: Boolean,
  projects: Array,
  activeCategory: String,
  loading: Boolean
})

defineEmits(['update:activeCategory', 'projectClick', 'openAuth', 'download', 'buy'])

const categories = CATEGORIES.map(c => ({
  key: c === '全部' ? 'all' : c,
  label: c,
  icon: CATEGORY_ICONS[c] || ''
}))
</script>

<style scoped>
.section { padding: 80px 24px; }
.section-inner { max-width: 1200px; margin: 0 auto; }
.section-header { text-align: center; margin-bottom: 48px; }

.section-tag {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.15);
  border-radius: 4px;
  font-size: 11px;
  color: #409eff;
  letter-spacing: 3px;
  margin-bottom: 14px;
  font-family: 'Orbitron', sans-serif;
}

.section-title { font-size: 28px; font-weight: 700; color: #1d2129; margin-bottom: 10px; }
.section-desc { font-size: 14px; color: #86909c; }

.search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  gap: 16px;
}

.filter-tabs { display: flex; gap: 4px; }

.filter-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.filter-tab:hover { color: #4e5969; background: #f2f3f5; }
.filter-tab.active { color: #fff; background: #409eff; }
.filter-tab.active .tab-icon { background: rgba(255,255,255,0.2); border-radius: 3px; padding: 1px 2px; }
.tab-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.tab-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

.projects-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  color: #86909c;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e6eb;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 60px 0;
  color: #c9cdd4;
}

.empty-state p { font-size: 15px; color: #86909c; }
.empty-state span { font-size: 12px; color: #c9cdd4; }

.project-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.project-card {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  border-color: #c9cdd4;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.project-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.project-emoji-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-emoji-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.project-name { font-size: 16px; font-weight: 600; color: #1d2129; margin-bottom: 6px; }
.project-desc { font-size: 13px; color: #86909c; line-height: 1.6; margin-bottom: 14px; }
.project-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }

.project-tag {
  padding: 2px 8px;
  background: rgba(64, 158, 255, 0.06);
  border-radius: 4px;
  font-size: 11px;
  color: #409eff;
}

.project-bottom { display: flex; align-items: center; justify-content: space-between; }
.project-meta { display: flex; gap: 14px; }

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #c9cdd4;
}

.meta-item svg { color: #c9cdd4; }

.download-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(0, 180, 42, 0.08);
  border: 1px solid rgba(0, 180, 42, 0.12);
  border-radius: 8px;
  color: #00b42a;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  white-space: nowrap;
  z-index: 2;
}

.download-btn-text {
  max-width: 0;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 12px;
  font-weight: 500;
}

.download-btn:hover {
  width: auto;
  padding: 0 12px;
  gap: 5px;
  background: #00b42a;
  border-color: #00b42a;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 180, 42, 0.25);
}

.download-btn:hover .download-btn-text {
  max-width: 40px;
  opacity: 1;
}

.price-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ff4d4f, #ff7a45);
  border-radius: 6px;
  cursor: pointer;
  z-index: 2;
  transition: transform 0.2s;
}

.price-badge:hover { transform: scale(1.05); }

.price-current {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.price-original {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  text-decoration: line-through;
}

.type-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  z-index: 2;
  letter-spacing: 1px;
}

.type-badge.source {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.type-badge.custom {
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
  border: 1px solid rgba(114, 46, 209, 0.2);
}

.buy-btn {
  padding: 6px 16px;
  background: linear-gradient(135deg, #ff4d4f, #ff7a45);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.buy-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .project-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .project-grid { grid-template-columns: 1fr; gap: 16px; }
  .search-bar { flex-direction: column; align-items: flex-start; padding: 10px 12px; }
  .filter-tabs { flex-wrap: wrap; width: 100%; }
  .filter-tab { padding: 5px 10px; font-size: 12px; }
  .section { padding: 60px 16px; }
  .section-title { font-size: 24px; }
  .project-card { padding: 20px; }
}

@media (max-width: 480px) {
  .project-grid { gap: 12px; }
  .project-icon { width: 40px; height: 40px; font-size: 18px; }
  .project-name { font-size: 15px; }
  .project-desc { font-size: 12px; }
}
</style>
