<template>
  <div class="slide-verify-wrapper">
    <div class="slide-verify-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      安全验证 · 将拼图块对齐正确的缺口
    </div>
    <div
      class="slide-verify"
      ref="container"
      @mousedown="onMouseDown"
      @touchstart.prevent="onTouchStart"
    >
      <div class="slide-track">
        <div class="slide-pattern"></div>
        <div class="slide-gap real" :style="gapStyle(realGapPos)">
          <div class="gap-pattern"></div>
        </div>
        <div class="slide-gap fake" :style="gapStyle(fakeGapPos)">
          <div class="gap-pattern"></div>
        </div>
        <div class="slide-progress" :style="progressStyle"></div>
        <div class="slide-text" v-if="!verified && sliderLeft === 0">
          <span class="slide-text-arrow">→</span>
          拖动拼图块对齐正确尺寸的缺口
          <span class="slide-text-arrow">←</span>
        </div>
        <div class="slide-text success-text" v-if="verified">
          ✓ 验证通过
        </div>
        <div class="slide-hint" v-if="hintMsg">{{ hintMsg }}</div>
        <div
          :class="['slide-thumb', { verified, dragging, failed: showFail }]"
          :style="{ left: sliderLeft + 'px' }"
        >
          <div class="thumb-puzzle" :class="{ matched: isMatched }">
            <div class="puzzle-pattern"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['verified'])

const container = ref(null)
const sliderLeft = ref(0)
const verified = ref(false)
const dragging = ref(false)
const showFail = ref(false)
const hintMsg = ref('')

const thumbWidth = 50
const puzzleOffset = 25
const tolerance = 5

const realGapPos = ref(0)
const fakeGapPos = ref(0)
const isMatched = ref(false)

let containerWidth = 0
let maxLeft = 0
let dragStartX = 0
let dragStartLeft = 0
let moveLog = []
let hasMouseListeners = false
let hasTouchListeners = false

const gapStyle = (pos) => ({ left: pos + 'px' })

const progressStyle = computed(() => {
  return { width: (sliderLeft.value + thumbWidth) + 'px' }
})

function initPositions() {
  containerWidth = container.value.offsetWidth
  maxLeft = containerWidth - thumbWidth

  const margins = 55
  const totalRange = maxLeft - margins * 2
  const mid = maxLeft / 2

  const leftStart = margins
  const leftEnd = mid - 35
  const leftRange = leftEnd - leftStart
  if (Math.random() > 0.5) {
    realGapPos.value = leftStart + Math.floor(Math.random() * leftRange)
    fakeGapPos.value = mid + 30 + Math.floor(Math.random() * (maxLeft - mid - 30 - margins))
  } else {
    fakeGapPos.value = leftStart + Math.floor(Math.random() * leftRange)
    realGapPos.value = mid + 30 + Math.floor(Math.random() * (maxLeft - mid - 30 - margins))
  }
  sliderLeft.value = 0
  isMatched.value = false
}

function onMouseDown(e) {
  if (verified.value) return
  startDrag(e.clientX)
  hasMouseListeners = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onTouchStart(e) {
  if (verified.value) return
  startDrag(e.touches[0].clientX)
  hasTouchListeners = true
  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onTouchUp)
}

function startDrag(clientX) {
  dragging.value = true
  showFail.value = false
  hintMsg.value = ''
  isMatched.value = false
  dragStartX = clientX
  dragStartLeft = sliderLeft.value
  moveLog = [{ x: clientX, t: Date.now() }]
}

function onMouseMove(e) { moveDrag(e.clientX) }
function onTouchMove(e) { moveDrag(e.touches[0].clientX) }

function moveDrag(clientX) {
  if (!dragging.value || verified.value) return
  const delta = clientX - dragStartX
  let newLeft = dragStartLeft + delta
  if (newLeft < 0) newLeft = 0
  if (newLeft > maxLeft) newLeft = maxLeft
  sliderLeft.value = newLeft
  isMatched.value = Math.abs((newLeft + puzzleOffset) - realGapPos.value) <= tolerance
  moveLog.push({ x: clientX, t: Date.now() })
}

function onMouseUp() {
  endDrag()
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

function onTouchUp() {
  endDrag()
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchUp)
}

function detectBot() {
  if (moveLog.length < 2) return true
  const duration = moveLog[moveLog.length - 1].t - moveLog[0].t
  if (duration < 50) return true
  return false
}

function endDrag() {
  if (!dragging.value) return
  dragging.value = false

  const aligned = Math.abs((sliderLeft.value + puzzleOffset) - realGapPos.value) <= tolerance
  if (aligned) {
    sliderLeft.value = realGapPos.value - puzzleOffset
    isMatched.value = true
    verified.value = true
    emit('verified')
  } else {
    showFail.value = true
    isMatched.value = false
    const distToFake = Math.abs(sliderLeft.value - fakeGapPos.value)
    if (distToFake < 8) {
      hintMsg.value = '尺寸不对，换一个缺口试试'
    } else {
      hintMsg.value = sliderLeft.value < realGapPos.value ? '往右再挪一点' : '往左再挪一点'
    }
    setTimeout(() => {
      sliderLeft.value = 0
      showFail.value = false
      hintMsg.value = ''
    }, 900)
  }
}

function reset() {
  verified.value = false
  dragging.value = false
  showFail.value = false
  hintMsg.value = ''
  isMatched.value = false
  moveLog = []
  initPositions()
}

onMounted(() => {
  initPositions()
  window.addEventListener('resize', initPositions)
})

onUnmounted(() => {
  if (hasMouseListeners) {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  if (hasTouchListeners) {
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchUp)
  }
  window.removeEventListener('resize', initPositions)
})

defineExpose({ reset })
</script>

<style scoped>
.slide-verify-wrapper {
  margin: 4px 0;
}

.slide-verify-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #86909c;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.slide-verify {
  position: relative;
  width: 100%;
  height: 66px;
  user-select: none;
  -webkit-user-select: none;
}

.slide-track {
  width: 100%;
  height: 48px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 10px 10px 0 0;
  position: relative;
}

.slide-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(135deg, #e8f0fe 25%, transparent 25%),
    linear-gradient(225deg, #e8f0fe 25%, transparent 25%),
    linear-gradient(315deg, #e8f0fe 25%, transparent 25%),
    linear-gradient(45deg, #e8f0fe 25%, transparent 25%);
  background-size: 20px 20px;
  border-radius: 10px 10px 0 0;
}

.slide-gap {
  position: absolute;
  top: 4px;
  height: 40px;
  border-radius: 6px;
  background: #fff;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.12);
  border: 2px solid #d0d3d9;
  overflow: hidden;
}

.slide-gap.real {
  width: 50px;
}

.slide-gap.fake {
  width: 34px;
  border-style: dashed;
  opacity: 0.7;
}

.gap-pattern {
  width: 100%;
  height: 100%;
  background: #e5e6eb;
}

.slide-progress {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: rgba(64, 158, 255, 0.04);
  border-radius: 10px 0 0 0;
  transition: none;
}

.slide-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #c9cdd4;
  letter-spacing: 1px;
  gap: 8px;
  pointer-events: none;
}

.slide-text-arrow {
  animation: arrow-pulse 1.5s ease-in-out infinite;
  font-weight: bold;
}

@keyframes arrow-pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.7; }
}

.success-text {
  color: #00b42a;
  font-weight: 600;
  letter-spacing: 2px;
}

.slide-hint {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #f53f3f;
  background: rgba(245, 63, 63, 0.08);
  padding: 1px 10px;
  border-radius: 4px;
  white-space: nowrap;
}

.slide-thumb {
  position: absolute;
  top: 48px;
  height: 18px;
  background: #f0f2f5;
  border: 1px solid #e5e6eb;
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: grab;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-thumb.dragging {
  cursor: grabbing;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.slide-thumb.verified {
  background: #e8f8e8;
  border-color: #00b42a;
  cursor: default;
}

.slide-thumb.failed {
  background: #ffece8;
  border-color: #f53f3f;
}

.thumb-puzzle {
  position: absolute;
  top: -44px;
  left: 25px;
  width: 50px;
  height: 40px;
  border-radius: 6px;
  border: 2px solid #409eff;
  background: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.25);
  overflow: hidden;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.thumb-puzzle.matched {
  border-color: #00b42a;
  box-shadow: 0 0 18px rgba(0, 180, 42, 0.4);
}

.puzzle-pattern {
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(135deg, #e8f0fe 25%, transparent 25%),
    linear-gradient(225deg, #e8f0fe 25%, transparent 25%),
    linear-gradient(315deg, #e8f0fe 25%, transparent 25%),
    linear-gradient(45deg, #e8f0fe 25%, transparent 25%);
  background-size: 20px 20px;
}
</style>
