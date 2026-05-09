<template>
  <transition name="modal">
    <div v-if="show" class="modal-overlay" @mousedown="onOverlayMouseDown" @click="onOverlayClick">
      <div :class="['modal-card', modalClass]">
        <button class="modal-close" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <slot></slot>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  show: Boolean,
  modalClass: { type: String, default: '' }
})

const emit = defineEmits(['close'])

const overlayMouseDownPos = ref(null)

function onOverlayMouseDown(e) {
  overlayMouseDownPos.value = { x: e.clientX, y: e.clientY }
}

function onOverlayClick(e) {
  if (e.target !== e.currentTarget) return
  if (overlayMouseDownPos.value) {
    const dx = Math.abs(e.clientX - overlayMouseDownPos.value.x)
    const dy = Math.abs(e.clientY - overlayMouseDownPos.value.y)
    if (dx > 3 || dy > 3) return
  }
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 48px;
  z-index: 200;
}

.modal-card {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 14px;
  padding: 32px 28px 24px;
  position: relative;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-card::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #409eff, transparent);
  border-radius: 2px;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  color: #c9cdd4;
  cursor: pointer;
  padding: 4px;
  transition: color 0.3s;
}

.modal-close:hover { color: #4e5969; }

.modal-enter-active { transition: opacity 0.3s ease; }
.modal-enter-active .modal-card { transition: transform 0.3s ease, opacity 0.3s ease; }
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-leave-active .modal-card { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateX(30px); opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateX(30px); opacity: 0; }

@media (max-width: 768px) {
  .modal-overlay { padding: 0; justify-content: center; }
  .modal-card { width: 92%; max-width: 400px; padding: 24px 20px; }
}
</style>
