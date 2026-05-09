<template>
  <div class="ps-overlay" @click.self="$emit('close')">
    <aside class="product-sidebar">
      <div class="ps-header">
        <h3>产品</h3>
        <button class="ps-close" @click="$emit('close')">关闭</button>
      </div>

      <div class="ps-categories">
        <div v-for="(g, gi) in CATEGORY_GROUPS" :key="g.label" class="ps-cat-group">
          <div class="ps-group-label">{{ g.label }}</div>
          <div class="ps-group-items">
            <button
              v-for="(c, idx) in g.children"
              :key="c + idx"
              :class="['ps-cat', { active: c === activeCategoryLabel } ]"
              @click="$emit('selectCategory', c === '全部' ? 'all' : c)">
              <span v-html="CATEGORY_ICONS[c] || ''" class="cat-icon"></span>
              <span class="cat-label">{{ c }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="ps-list">
        <div v-if="filtered.length" class="ps-item" v-for="p in filtered" :key="p.id" @click="$emit('selectProject', p)">
          <div class="pi-name">{{ p.name }}</div>
          <div class="pi-desc">{{ p.desc }}</div>
        </div>
        <div v-else class="ps-empty">暂无产品</div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CATEGORY_GROUPS, CATEGORY_ICONS } from '../constants'

const props = defineProps({
  projects: { type: [Array], default: () => [] },
  activeCategory: { type: String, default: 'all' }
})

const emit = defineEmits(['close', 'selectCategory', 'selectProject'])

const activeCategoryLabel = computed(() => props.activeCategory === 'all' ? '全部' : props.activeCategory)

const BLACKLIST_KEYWORDS = [
  '论坛里的内容剪辑',
  '现代化',
  '聊天',
  'AI互动',
  '博客',
  '论坛',
  '互动',
  '哇卡卡卡',
  '汉化版',
  '安卓应用',
  '一个创意的鸿蒙系统APP',
  '测试',
  '一个（去水印）微信小程序源码',
  '前端＋后端 后端用的Node和MYSQL'
]

const filtered = computed(() => {
  if (!props.projects) return []

  const blacklist = BLACKLIST_KEYWORDS.map(k => (k || '').toLowerCase().trim()).filter(Boolean)
  const isBlacklisted = (p) => {
    const text = ((p.name || '') + ' ' + (p.desc || '')).toLowerCase()
    return blacklist.some(k => text.includes(k))
  }

  // 始终排除 category === 'AI' 的项目，并排除匹配黑名单关键词的项目
  const projects = props.projects.filter(p => !isBlacklisted(p))
  if (props.activeCategory === 'all') return projects.slice(0, 50)
  return projects.filter(p => p.category === props.activeCategory && !isBlacklisted(p)).slice(0, 50)
})

</script>

<style scoped>
.ps-overlay { position: fixed; inset: 0; z-index: 250; }
.ps-overlay::before { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.35); }
.product-sidebar { position: absolute; left: 0; top: 0; bottom: 0; width: 300px; background: #fff; z-index: 260; box-shadow: 4px 0 18px rgba(0,0,0,0.12); display: flex; flex-direction: column; padding: 16px; }
.ps-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ps-header h3 { margin: 0; font-size: 16px; }
.ps-close { background: transparent; border: none; color: #86909c; cursor: pointer; }
.ps-categories { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.ps-cat-group { display: flex; flex-direction: column; gap: 6px; }
.ps-group-label { font-size: 12px; color: #8b98a6; margin-bottom: 4px; }
.ps-group-items { display: flex; gap: 8px; flex-wrap: wrap; }
.ps-cat { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; border: 1px solid #f1f2f4; background: transparent; cursor: pointer; font-size: 13px; color: #59656f; }
.ps-cat.active { background: #f0f8ff; border-color: #dff0ff; color: #409eff; }
.cat-icon { width: 16px; height: 16px; display: inline-block; }
.ps-list { overflow: auto; flex: 1; padding-right: 6px; }
.ps-item { padding: 10px 8px; border-radius: 8px; cursor: pointer; border-bottom: 1px solid #f5f6f7; }
.ps-item:hover { background: #f7fbff; }
.pi-name { font-weight: 600; color: #1d2129; }
.pi-desc { font-size: 12px; color: #86909c; margin-top: 6px; }
.ps-empty { padding: 24px; color: #c9cdd4; text-align: center; }
</style>
