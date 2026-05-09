<template>
  <div v-if="node.type === 'folder'" class="tree-item tree-folder">
    <div
      class="tree-item-header"
      @click="handleExpand"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      :class="{ 'drag-over': dragOver }"
    >
      <div class="tree-checkbox" @click.stop="toggleCheck" v-if="showCheckbox">
        <svg v-if="checked" viewBox="0 0 24 24" fill="#409eff" width="14" height="14">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#409eff" stroke-width="1.5" fill="rgba(64,158,255,0.1)"/>
          <polyline points="6.5 12 10 15.5 17.5 8" stroke="#409eff" stroke-width="2" fill="none"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" width="14" height="14">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#b0b0b0" stroke-width="1.5"/>
        </svg>
      </div>
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" class="tree-arrow" :class="{ expanded: isExpanded }">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
      </svg>
      <svg v-if="getFolderType(node) === 'frontend'" viewBox="0 0 24 24" width="14" height="14" class="tree-icon tree-folder-icon" :class="{ 'folder-open': isExpanded }" :fill="isExpanded ? '#7ec8e3' : '#42b883'">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <svg v-else-if="getFolderType(node) === 'backend'" viewBox="0 0 24 24" width="14" height="14" class="tree-icon tree-folder-icon" :class="{ 'folder-open': isExpanded }" :fill="isExpanded ? '#e8a87c' : '#e34c26'">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <svg v-else-if="getFolderType(node) === 'miniprogram'" viewBox="0 0 24 24" width="14" height="14" class="tree-icon tree-folder-icon" :class="{ 'folder-open': isExpanded }" :fill="isExpanded ? '#8dc63f' : '#07c160'">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="14" height="14" class="tree-icon tree-folder-icon" :class="{ 'folder-open': isExpanded }" :fill="isExpanded ? '#dcb67a' : '#d6a052'">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="tree-item-name">{{ node.name }}</span>
      <span class="tree-item-badge" v-if="getFolderType(node) === 'frontend'">前端</span>
      <span class="tree-item-badge backend" v-else-if="getFolderType(node) === 'backend'">后端</span>
      <span class="tree-item-badge miniprogram" v-else-if="getFolderType(node) === 'miniprogram'">小程序</span>
      <span class="tree-item-count" v-if="node.children && node.children.length > 0">({{ countFiles(node) }})</span>
    </div>
    <div class="tree-children" v-show="isExpanded">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :selected="selected"
        :selectedFiles="selectedFiles"
        :showCheckbox="showCheckbox"
        @select="$emit('select', $event)"
        @expand="$emit('expand', $event)"
        @check="$emit('check', $event)"
        @contextmenu="$emit('contextmenu', $event)"
        @drophandler="$emit('drophandler', $event)"
      />
    </div>
  </div>
  <div
    v-else
    class="tree-item tree-file"
    :class="{ selected: selected === node.path, 'drag-over': dragOver }"
    :draggable="true"
    @click="handleSelect"
    @contextmenu.prevent.stop="handleContextMenu"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="tree-checkbox" @click.stop="toggleCheck" v-if="showCheckbox">
      <svg v-if="checked" viewBox="0 0 24 24" fill="#409eff" width="14" height="14">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#409eff" stroke-width="1.5" fill="rgba(64,158,255,0.1)"/>
        <polyline points="6.5 12 10 15.5 17.5 8" stroke="#409eff" stroke-width="2" fill="none"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" width="14" height="14">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#b0b0b0" stroke-width="1.5"/>
      </svg>
    </div>
    <svg v-if="getFileTypeIcon(node.name) === 'miniprogram'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="tree-icon tree-file-icon" :style="{ color: getFileColor(node.name) }">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
    <svg v-else-if="getFileTypeIcon(node.name) === 'frontend'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="tree-icon tree-file-icon" :style="{ color: getFileColor(node.name) }">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
    <svg v-else-if="getFileTypeIcon(node.name) === 'backend'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="tree-icon tree-file-icon" :style="{ color: getFileColor(node.name) }">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
    <svg v-else-if="getFileTypeIcon(node.name) === 'config'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="tree-icon tree-file-icon" :style="{ color: getFileColor(node.name) }">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
    <svg v-else-if="getFileTypeIcon(node.name) === 'data'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="tree-icon tree-file-icon" :style="{ color: getFileColor(node.name) }">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="tree-icon tree-file-icon" :style="{ color: getFileColor(node.name) }">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    <span class="tree-item-name" :title="node.path || node.name">{{ node.name }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  selected: { type: String, default: '' },
  selectedFiles: { type: Set, default: () => new Set() },
  showCheckbox: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'expand', 'check', 'contextmenu', 'drophandler'])

const isExpanded = ref(false)
const dragOver = ref(false)

const checked = computed(() => {
  if (!props.showCheckbox) return false
  return props.selectedFiles instanceof Set && props.selectedFiles.has(props.node.path)
})

function handleExpand() {
  emit('expand', props.node.path)
  isExpanded.value = !isExpanded.value
}

function handleSelect() {
  emit('select', props.node)
}

function toggleCheck() {
  emit('check', { path: props.node.path, type: props.node.type })
}

function handleContextMenu(e) {
  emit('contextmenu', { event: e, node: props.node })
}

function handleDragStart(e) {
  e.dataTransfer.setData('text/plain', props.node.path)
  e.dataTransfer.effectAllowed = 'move'
}

function handleDragEnd() {
  dragOver.value = false
}

function handleDragOver(e) {
  e.dataTransfer.dropEffect = 'move'
  dragOver.value = true
}

function handleDragLeave() {
  dragOver.value = false
}

function handleDrop(e) {
  dragOver.value = false
  const srcPath = e.dataTransfer.getData('text/plain')
  if (srcPath && srcPath !== props.node.path) {
    emit('drophandler', { srcPath, targetPath: props.node.path, targetType: props.node.type })
  }
}

function countFiles(node) {
  if (node.type === 'file') return 1
  let count = 0
  for (const child of (node.children || [])) {
    count += countFiles(child)
  }
  return count
}

function getFolderType(node) {
  const name = (node.name || '').toLowerCase()
  const path = (node.path || '').toLowerCase()

  if (name === 'frontend') {
    const allFiles = getAllChildNames(node)
    if (allFiles.some(f => f.endsWith('.wxml') || f.endsWith('.wxss'))) return 'miniprogram'
    return 'frontend'
  }

  if (name === 'backend') return 'backend'

  if (name === 'pages' || name === 'components' || name === 'utils' || name === 'styles' || name === 'assets' || name === 'public' || name === 'static' || name === 'views' || name === 'router' || name === 'store' || name === 'composables' || name === 'hooks' || name === 'layouts' || name === 'directives' || name === 'filters' || name === 'mixins' || name === 'plugins' || name === 'middleware') {
    const hasWxml = node.children?.some(c => (c.name || '').endsWith('.wxml'))
    const hasVue = node.children?.some(c => (c.name || '').endsWith('.vue'))
    const hasJsx = node.children?.some(c => (c.name || '').endsWith('.jsx') || (c.name || '').endsWith('.tsx'))
    if (hasWxml) return 'miniprogram'
    if (hasVue || hasJsx) return 'frontend'
  }

  if (name === 'src' || name === 'client' || name === 'web' || name === 'app') {
    const allFiles = getAllChildNames(node)
    if (allFiles.some(f => f.endsWith('.wxml') || f.endsWith('.wxss'))) return 'miniprogram'
    if (allFiles.some(f => f.endsWith('.vue') || f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.css') || f.endsWith('.scss'))) return 'frontend'
  }

  if (name === 'server' || name === 'api' || name === 'routes' || name === 'controllers' || name === 'models' || name === 'services' || name === 'migrations' || name === 'seeders' || name === 'config') return 'backend'

  if (path.includes('/server/') || path.includes('/backend/') || path.includes('/api/')) return 'backend'
  if (path.includes('/src/') || path.includes('/client/') || path.includes('/frontend/')) return 'frontend'

  return 'default'
}

function getAllChildNames(node) {
  const names = []
  if (node.children) {
    for (const child of node.children) {
      names.push(child.name || '')
      if (child.children) names.push(...getAllChildNames(child))
    }
  }
  return names
}

function getFileTypeIcon(name) {
  const ext = (name || '').split('.').pop().toLowerCase()

  const miniprogramExts = ['wxml', 'wxss', 'wxs']
  if (miniprogramExts.includes(ext)) return 'miniprogram'

  const frontendExts = ['vue', 'jsx', 'tsx', 'css', 'scss', 'less', 'sass', 'styl', 'html', 'htm', 'svg']
  if (frontendExts.includes(ext)) return 'frontend'

  const backendExts = ['py', 'java', 'go', 'rs', 'rb', 'php', 'cs', 'kt', 'swift', 'dart', 'ex', 'exs', 'erl', 'clj', 'scala']
  if (backendExts.includes(ext)) return 'backend'

  const codeExts = ['js', 'ts']
  if (codeExts.includes(ext)) {
    if (name && (name.includes('.server.') || name.includes('.api.') || name.includes('.route.') || name.includes('.controller.') || name.includes('.model.') || name.includes('.service.') || name.includes('.middleware.') || name.includes('.dao.') || name.includes('.repository.'))) return 'backend'
    return 'frontend'
  }

  const configExts = ['env', 'gitignore', 'dockerfile', 'ini', 'cfg', 'conf', 'properties', 'gradle', 'pom', 'toml', 'eslintrc', 'prettierrc', 'babelrc', 'editorconfig']
  if (configExts.includes(ext) || name === '.env' || name === '.gitignore' || name === 'Dockerfile' || name === '.eslintrc' || name === '.prettierrc' || name === '.babelrc' || name === '.editorconfig') return 'config'

  const dataExts = ['json', 'xml', 'yaml', 'yml', 'sql', 'lock', 'map']
  if (dataExts.includes(ext)) return 'data'

  return 'file'
}

function getFileColor(name) {
  const ext = (name || '').split('.').pop().toLowerCase()
  const colorMap = {
    js: '#f7df1e', ts: '#3178c6', jsx: '#61dafb', tsx: '#3178c6',
    vue: '#42b883', html: '#e34c26', htm: '#e34c26', css: '#264de4',
    scss: '#cd6799', less: '#1d365d', sass: '#cd6799', styl: '#ff6347',
    svg: '#ffb13b',
    wxml: '#07c160', wxss: '#07c160', wxs: '#07c160',
    py: '#3776ab', java: '#b07219', go: '#00add8', rs: '#dea584',
    rb: '#701516', php: '#4f5d95', cs: '#178600', kt: '#a97bff',
    swift: '#f05138', dart: '#0175c2',
    sql: '#e38c00', json: '#292929', xml: '#0060ac',
    yaml: '#cb171e', yml: '#cb171e', md: '#083fa1',
    txt: '#888888', sh: '#89e051', bat: '#c1f12e',
    env: '#ecd53f', gitignore: '#f05032', dockerfile: '#384d54',
    lock: '#888888', map: '#888888'
  }
  return colorMap[ext] || '#8c8c8c'
}
</script>

<style scoped>
.tree-item {
  user-select: none;
}

.tree-item-header {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #8c8c8c;
  transition: background 0.1s;
}

.tree-item-header:hover {
  background: rgba(64, 158, 255, 0.08);
  color: #4a90e2;
}

.tree-item-header.drag-over {
  background: rgba(64, 158, 255, 0.15);
  outline: 2px dashed #409eff;
  outline-offset: -2px;
}

.tree-arrow {
  transition: transform 0.15s;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: #8c8c8c;
}

.tree-arrow.expanded {
  transform: rotate(90deg);
}

.tree-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}

.tree-folder-icon {
  transition: fill 0.15s;
}

.tree-folder-icon.folder-open {
  fill: #dcb67a;
}

.tree-checkbox {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
}

.tree-file {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px 3px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #5c5c5c;
  transition: background 0.1s;
}

.tree-file:hover {
  background: rgba(64, 158, 255, 0.08);
  color: #4a90e2;
}

.tree-file.selected {
  background: rgba(64, 158, 255, 0.12);
  color: #1a6dd4;
  font-weight: 500;
}

.tree-file.drag-over {
  background: rgba(64, 158, 255, 0.15);
  outline: 2px dashed #409eff;
  outline-offset: -2px;
}

.tree-file-icon {
  flex-shrink: 0;
  color: #8c8c8c;
}

.tree-file.selected .tree-file-icon {
  color: #1a6dd4;
}

.tree-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.tree-item-badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(66, 184, 131, 0.15);
  color: #42b883;
  flex-shrink: 0;
  font-weight: 500;
  line-height: 1.2;
}

.tree-item-badge.backend {
  background: rgba(227, 76, 38, 0.15);
  color: #e34c26;
}

.tree-item-badge.miniprogram {
  background: rgba(7, 193, 96, 0.15);
  color: #07c160;
}

.tree-item-count {
  font-size: 11px;
  color: #b0b0b0;
  margin-left: 4px;
  flex-shrink: 0;
}

.tree-children {
  margin-left: 12px;
}
</style>
