<template>
  <div class="ps-overlay" @click.self="$emit('close')">
    <aside class="product-sidebar">
      <div class="ps-header">
        <div class="ps-header-main">
          <span class="ps-kicker">PRODUCT EXPLORER</span>
          <h3>产品中心</h3>
          <p>点击分类后直接浏览对应商品，适合展示图片、价格和购买入口。</p>
        </div>
        <button class="ps-close" type="button" @click="$emit('close')">
          <span>关闭</span>
        </button>
      </div>

      <div class="ps-body">
        <section class="ps-categories">
          <div class="ps-categories-head">
            <span class="ps-panel-label">分类导航</span>
            <strong>{{ activeCategoryLabel }}</strong>
          </div>
          <div v-for="(g, gi) in effectiveCategoryGroups" :key="g.label" class="ps-cat-group">
              <div class="ps-group-label">{{ g.label }}</div>
              <div class="ps-group-items">
                <button
                  v-for="(c, idx) in g.children"
                  :key="c + idx"
                  type="button"
                  :class="['ps-cat', { active: c === activeCategoryLabel } ]"
                  @click="$emit('selectCategory', c === '全部' ? 'all' : c)">
                  <span v-html="effectiveCategoryIcons[c] || effectiveCategoryIcons[g.label] || ''" class="cat-icon"></span>
                  <span class="cat-label">{{ c }}</span>
                </button>
              </div>
            </div>
        </section>

        <section class="ps-main">
          <div class="ps-toolbar">
            <div>
              <span class="ps-panel-label">当前分类</span>
              <h4>{{ activeCategoryLabel }}</h4>
            </div>
            <div class="ps-toolbar-meta">
              <span>{{ filtered.length }} 个商品</span>
              <span>点击按钮立即进入购买</span>
            </div>
          </div>

          <div v-if="filtered.length" class="ps-list">
            <div class="ps-item" v-for="p in filtered" :key="p.id" @click="$emit('selectProject', p)">
              <div class="pi-image" v-if="p.images && p.images.length">
                <img :src="p.images[0]" alt="product cover" />
              </div>
              <div class="pi-main">
                <div class="pi-name">{{ p.name }}</div>
                <div class="pi-price">
                  <span class="price-current">¥{{ p.price }}</span>
                  <span v-if="p.originalPrice && p.originalPrice > p.price" class="price-original">¥{{ p.originalPrice }}</span>
                </div>
              </div>
              <div class="pi-desc">{{ p.desc }}</div>
              <div class="pi-tags" v-if="p.tags && p.tags.length">
                <span class="pi-type-badge" :class="p.productType">{{ p.productType === 'source' ? '源码' : '定制' }}</span>
                <span class="pi-tag" v-for="t in p.tags" :key="t">{{ t }}</span>
              </div>
              <div class="pi-footer">
                <div class="pi-footer-meta">
                  <span>{{ p.productType === 'source' ? '立即获取源码' : '立即咨询定制' }}</span>
                </div>
                <button
                  type="button"
                  class="pi-buy-btn"
                  @click.stop="$emit('selectProject', p)"
                >
                  <span>{{ p.productType === 'source' ? '立即购买' : '立即咨询' }}</span>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <path d="M7 4l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="ps-empty">
            <div class="ps-empty-title">当前分类暂无产品</div>
            <p>可以切换其他分类查看，或继续在后台上架对应商品。</p>
          </div>
        </section>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { CATEGORY_GROUPS, CATEGORY_ICONS } from '../constants'

const props = defineProps({
  projects: { type: [Array], default: () => [] },
  activeCategory: { type: String, default: 'all' },
  // 可选：后端下发的分类组结构 [{ label: '', children: ['a','b'] }]
  categoryGroups: { type: [Array], default: null },
  // 可选：图标映射对象
  categoryIcons: { type: Object, default: null }
})

const emit = defineEmits(['close', 'selectCategory', 'selectProject'])

const activeCategoryLabel = computed(() => props.activeCategory === 'all' ? '全部' : props.activeCategory)

// 如果父组件提供了分组则使用它，否则回退到常量中的 CATEGORY_GROUPS
const effectiveCategoryGroups = computed(() => {
  return props.categoryGroups && Array.isArray(props.categoryGroups) && props.categoryGroups.length > 0
    ? props.categoryGroups
    : CATEGORY_GROUPS
})

const effectiveCategoryIcons = computed(() => {
  return props.categoryIcons && typeof props.categoryIcons === 'object'
    ? props.categoryIcons
    : CATEGORY_ICONS
})

const PRODUCT_CATEGORY_ALIASES = {
  小程序: ['小程序', '微信小程序', '支付宝小程序', '百度小程序', '抖音小程序'],
  微信小程序: ['微信小程序'],
  支付宝小程序: ['支付宝小程序'],
  百度小程序: ['百度小程序'],
  抖音小程序: ['抖音小程序'],
  APP: ['APP', '安卓', '苹果', '鸿蒙', 'APP：安卓', 'APP：苹果', 'APP：鸿蒙'],
  'APP：安卓': ['APP：安卓', '安卓'],
  'APP：苹果': ['APP：苹果', '苹果'],
  'APP：鸿蒙': ['APP：鸿蒙', '鸿蒙'],
  软件: ['软件', '软件：Windows', '软件：Linux', '软件：macOS', 'Windows', 'Linux', 'macOS', 'Mac'],
  '软件：Windows': ['软件：Windows', 'Windows'],
  '软件：Linux': ['软件：Linux', 'Linux'],
  '软件：macOS': ['软件：macOS', 'macOS', 'Mac'],
  网站: ['网站', '网站：网页', '网址', '网页'],
  '网站：网页': ['网站：网页', '网址', '网页']
}

function matchesCategory(productCategory, activeCategory) {
  if (!activeCategory || activeCategory === 'all') return true
  const aliases = PRODUCT_CATEGORY_ALIASES[activeCategory] || [activeCategory]
  return aliases.includes(productCategory)
}

const filtered = computed(() => {
  if (!props.projects) return []

  if (props.activeCategory === 'all') return props.projects.slice(0, 50)
  return props.projects.filter(p => matchesCategory(p.category, props.activeCategory)).slice(0, 50)
})

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

</script>

<style scoped>
.ps-overlay { position: fixed; inset: 0; z-index: 12000; backdrop-filter: blur(10px); background: rgba(15, 23, 42, 0.42); isolation: isolate; }
.ps-overlay::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.18)); animation: ps-fade-in 0.28s ease; }
.product-sidebar { position: absolute; inset: 16px; background: linear-gradient(180deg, #ffffff, #ffffff 18%, #f8fbff 100%); z-index: 1; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22); display: flex; flex-direction: column; padding: 22px 22px 20px; border: 1px solid rgba(64, 158, 255, 0.08); border-radius: 28px; animation: ps-slide-in 0.32s cubic-bezier(0.22, 1, 0.36, 1); overflow: hidden; }
.ps-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
.ps-kicker { display: inline-flex; align-items: center; padding: 5px 10px; border-radius: 999px; background: rgba(64, 158, 255, 0.1); color: #409eff; font-size: 11px; font-weight: 700; letter-spacing: 0.6px; }
.ps-header-main h3 { margin: 12px 0 0; font-size: 34px; font-weight: 800; color: #1d2129; letter-spacing: -0.8px; }
.ps-header-main p { margin: 8px 0 0; font-size: 13px; color: #86909c; line-height: 1.6; max-width: 520px; }
.ps-close { background: rgba(64, 158, 255, 0.06); border: 1px solid rgba(64, 158, 255, 0.12); color: #5b6472; cursor: pointer; border-radius: 10px; padding: 7px 12px; transition: all 0.22s ease; }
.ps-close:hover { color: #409eff; background: rgba(64, 158, 255, 0.1); border-color: rgba(64, 158, 255, 0.2); }
.ps-body { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 20px; min-height: 0; flex: 1; }
.ps-categories { display: flex; flex-direction: column; gap: 14px; min-height: 0; overflow-y: auto; padding: 16px; border-radius: 22px; background: rgba(248, 250, 252, 0.88); border: 1px solid #edf2f7; }
.ps-categories-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding-bottom: 6px; border-bottom: 1px solid rgba(148, 163, 184, 0.14); margin-bottom: 2px; }
.ps-categories-head strong { color: #1d2129; font-size: 14px; }
.ps-main { min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.ps-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 14px; padding: 4px 4px 10px; border-bottom: 1px solid rgba(148, 163, 184, 0.14); }
.ps-panel-label { display: block; font-size: 11px; color: #94a3b8; font-weight: 700; letter-spacing: 0.4px; margin-bottom: 6px; }
.ps-toolbar h4 { margin: 0; font-size: 24px; color: #1d2129; letter-spacing: -0.5px; }
.ps-toolbar-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.ps-toolbar-meta span { font-size: 12px; color: #64748b; padding: 6px 10px; border-radius: 999px; background: rgba(248, 250, 252, 0.92); border: 1px solid rgba(226, 232, 240, 0.9); }
.ps-cat-group { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.ps-group-label { font-size: 12px; color: #8b98a6; margin-bottom: 4px; font-weight: 700; letter-spacing: 0.3px; }
.ps-group-items { display: flex; gap: 8px; flex-wrap: wrap; }
.ps-cat { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 12px; border: 1px solid #eef1f4; background: rgba(255, 255, 255, 0.82); cursor: pointer; font-size: 13px; color: #59656f; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease; animation: ps-rise-in 0.35s ease both; }
.ps-cat:hover { transform: translateY(-1px); border-color: rgba(64, 158, 255, 0.18); box-shadow: 0 8px 18px rgba(64, 158, 255, 0.08); }
.ps-cat.active { background: linear-gradient(135deg, rgba(64, 158, 255, 0.14), rgba(64, 158, 255, 0.05)); border-color: rgba(64, 158, 255, 0.26); color: #409eff; box-shadow: 0 10px 22px rgba(64, 158, 255, 0.12); transform: translateY(-1px); }
.cat-icon { width: 16px; height: 16px; display: inline-block; }
.ps-list { overflow: auto; flex: 1; padding-right: 4px; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; align-content: start; }
.ps-item { padding: 14px 14px 12px; border-radius: 18px; cursor: pointer; border: 1px solid #f0f3f7; background: rgba(255,255,255,0.9); transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, background 0.22s ease; animation: ps-card-in 0.38s ease both; }
.ps-item:hover { background: #f7fbff; transform: translateY(-2px); border-color: rgba(64, 158, 255, 0.16); box-shadow: 0 12px 24px rgba(64, 158, 255, 0.1); }
.pi-image { width: 100%; height: 152px; border-radius: 12px; overflow: hidden; margin-bottom: 10px; background: #f8fafc; }
.pi-image img { width: 100%; height: 100%; object-fit: cover; }
.pi-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.pi-name { font-weight: 600; color: #1d2129; font-size: 14px; line-height: 1.4; }
.pi-price { display: flex; align-items: baseline; gap: 4px; }
.price-current { color: #f53f3f; font-weight: 700; font-size: 14px; }
.price-original { color: #c9cdd4; text-decoration: line-through; font-size: 11px; }
.pi-desc { font-size: 12px; color: #86909c; line-height: 1.5; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pi-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.pi-type-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
.pi-type-badge.source { background: #e8f3ff; color: #165dff; }
.pi-type-badge.custom { background: #fff3e8; color: #ff7d00; }
.pi-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #f2f3f5; color: #4e5969; }
.pi-footer { margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pi-footer-meta { min-width: 0; }
.pi-footer-meta span { display: inline-flex; align-items: center; font-size: 11px; color: #94a3b8; }
.pi-buy-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 110px; padding: 9px 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #409eff, #1a6dd4); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(64, 158, 255, 0.22); transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
.pi-buy-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 24px rgba(64, 158, 255, 0.26); filter: brightness(1.03); }
.pi-buy-btn:active { transform: translateY(0) scale(0.98); }
.pi-buy-btn svg { flex-shrink: 0; transition: transform 0.2s ease; }
.pi-buy-btn:hover svg { transform: translateX(2px); }
.ps-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 22px; background: rgba(248, 250, 252, 0.88); border: 1px dashed rgba(148, 163, 184, 0.25); color: #94a3b8; text-align: center; min-height: 260px; }
.ps-empty-title { font-size: 22px; font-weight: 800; color: #cbd5e1; margin-bottom: 8px; }
.ps-empty p { margin: 0; font-size: 13px; color: #94a3b8; }

@keyframes ps-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes ps-slide-in {
  from { opacity: 0; transform: translateX(-18px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes ps-rise-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ps-card-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .product-sidebar { inset: 8px; padding: 16px 14px 14px; border-radius: 20px; }
  .ps-body { grid-template-columns: 1fr; gap: 14px; }
  .ps-header { flex-direction: column; align-items: stretch; }
  .ps-header-main h3 { font-size: 26px; }
  .ps-categories { max-height: 34vh; }
  .ps-toolbar { flex-direction: column; align-items: flex-start; }
  .ps-toolbar-meta { justify-content: flex-start; }
  .ps-list { grid-template-columns: 1fr; }
  .pi-footer { flex-direction: column; align-items: stretch; }
  .pi-buy-btn { width: 100%; }
}
</style>
