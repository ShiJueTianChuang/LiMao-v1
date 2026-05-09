<template>
  <div ref="editorContainer" class="monaco-editor-container" :style="{ height: height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'php') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const props = defineProps({
  modelValue: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  theme: { type: String, default: 'vs-dark' },
  height: { type: String, default: '100%' },
  readOnly: { type: Boolean, default: false },
  fontSize: { type: Number, default: 14 },
  wordWrap: { type: Boolean, default: true },
  showMinimap: { type: Boolean, default: true },
  originalValue: { type: String, default: '' },
  showDiff: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change', 'save', 'cursorChange', 'askAI'])

const editorContainer = ref(null)
let editor = null
let diffEditor = null

const getMonacoLang = (lang) => {
  const map = {
    javascript: 'javascript', js: 'javascript', jsx: 'javascript',
    typescript: 'typescript', ts: 'typescript', tsx: 'typescript',
    python: 'python', py: 'python',
    java: 'java', html: 'html', css: 'css', scss: 'scss', less: 'less',
    json: 'json', sql: 'sql', yaml: 'yaml', yml: 'yaml',
    markdown: 'markdown', md: 'markdown',
    xml: 'xml', vue: 'html', php: 'php', go: 'go', rust: 'rust',
    c: 'c', cpp: 'cpp', cs: 'csharp', ruby: 'ruby', rb: 'ruby',
    swift: 'swift', kotlin: 'kotlin', kt: 'kotlin',
    shell: 'shell', bash: 'shell', sh: 'shell',
    dockerfile: 'dockerfile', graphql: 'graphql'
  }
  return map[lang] || 'plaintext'
}

onMounted(() => {
  createEditor()
})

onBeforeUnmount(() => {
  dispose()
})

function createEditor() {
  if (!editorContainer.value) return

  if (props.showDiff && props.originalValue !== undefined) {
    createDiffEditor()
    return
  }

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: getMonacoLang(props.language),
    theme: props.theme,
    readOnly: props.readOnly,
    fontSize: props.fontSize,
    wordWrap: props.wordWrap ? 'on' : 'off',
    minimap: { enabled: props.showMinimap },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    padding: { top: 8, bottom: 8 },
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    foldingStrategy: 'indentation',
    links: true,
    colorDecorators: true,
    contextmenu: true,
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    parameterHints: { enabled: true },
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true,
    dragAndDrop: true,
    mouseWheelZoom: true
  })

  editor.onDidChangeModelContent(() => {
    const value = editor.getValue()
    emit('update:modelValue', value)
    emit('change', value)
  })

  editor.onDidChangeCursorPosition((e) => {
    emit('cursorChange', {
      line: e.position.lineNumber,
      column: e.position.column
    })
  })

  editor.addAction({
    id: 'save-file',
    label: 'Save File',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: () => { emit('save') }
  })

  editor.addAction({
    id: 'ask-ai',
    label: 'Ask AI for Help',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
    run: () => { emit('askAI') }
  })
}

function createDiffEditor() {
  diffEditor = monaco.editor.createDiffEditor(editorContainer.value, {
    theme: props.theme,
    fontSize: props.fontSize,
    readOnly: props.readOnly,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderSideBySide: true,
    minimap: { enabled: false }
  })

  const originalModel = monaco.editor.createModel(props.originalValue, getMonacoLang(props.language))
  const modifiedModel = monaco.editor.createModel(props.modelValue, getMonacoLang(props.language))

  diffEditor.setModel({ original: originalModel, modified: modifiedModel })

  diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
    const value = diffEditor.getModifiedEditor().getValue()
    emit('update:modelValue', value)
    emit('change', value)
  })
}

function dispose() {
  if (editor) { editor.dispose(); editor = null }
  if (diffEditor) { diffEditor.dispose(); diffEditor = null }
}

function getValue() {
  if (editor) return editor.getValue()
  if (diffEditor) return diffEditor.getModifiedEditor().getValue()
  return ''
}

function setValue(value) {
  if (editor) {
    const fullRange = editor.getModel()?.getFullModelRange()
    if (fullRange) {
      editor.executeEdits('ai-apply', [{
        range: fullRange,
        text: value
      }])
    } else {
      editor.setValue(value)
    }
  }
}

function getEditor() {
  return editor || diffEditor
}

function focus() {
  if (editor) editor.focus()
  if (diffEditor) diffEditor.getModifiedEditor().focus()
}

function setLanguage(lang) {
  if (editor) {
    const model = editor.getModel()
    if (model) monaco.editor.setModelLanguage(model, getMonacoLang(lang))
  }
}

let aiDecorationIds = []
let aiDecorationsTimer = null

function applyAIEdit(newContent) {
  if (!editor) return
  const currentContent = editor.getValue()
  if (currentContent === newContent) return

  clearAIDecorationsImmediate()

  const model = editor.getModel()
  if (!model) return

  const currentLines = currentContent.split('\n')
  const newLines = newContent.split('\n')

  let changedStartLine = 1
  let changedEndLine = currentLines.length
  let oldChangedLines = currentLines

  if (currentLines.length > 0 && newLines.length > 0) {
    const prefixLen = commonPrefixLength(currentLines, newLines)
    const suffixLen = commonSuffixLength(currentLines.slice(prefixLen), newLines.slice(prefixLen))

    if (prefixLen + suffixLen >= Math.min(currentLines.length, newLines.length) * 0.3) {
      const startLine = prefixLen + 1
      const endLine = currentLines.length - suffixLen
      const replaceLines = newLines.slice(prefixLen, newLines.length - suffixLen)

      if (endLine >= startLine) {
        changedStartLine = startLine
        changedEndLine = endLine
        oldChangedLines = currentLines.slice(prefixLen, currentLines.length - suffixLen)

        const range = new monaco.Range(startLine, 1, endLine, currentLines[endLine - 1].length + 1)
        editor.executeEdits('ai-apply', [{
          range,
          text: replaceLines.join('\n') + (suffixLen === 0 ? '' : '\n')
        }])
        editor.revealLine(startLine)
      }
    } else {
      changedStartLine = 1
      changedEndLine = currentLines.length
      const fullRange = model.getFullModelRange()
      editor.executeEdits('ai-apply', [{
        range: fullRange,
        text: newContent
      }])
      editor.revealLine(1)
    }
  } else {
    const fullRange = model.getFullModelRange()
    editor.executeEdits('ai-apply', [{
      range: fullRange,
      text: newContent
    }])
    editor.revealLine(1)
  }

  applyAIDecorations(changedStartLine, oldChangedLines, newLines)
}

function applyAIDecorations(startLine, oldLines, newContentLines) {
  if (!editor) return

  const decorations = []
  const oldSet = new Set(oldLines.filter(l => l.trim().length > 0))
  const currentContent = editor.getValue().split('\n')

  const changedNewLines = currentContent.slice(startLine - 1, startLine - 1 + Math.max(newContentLines.length - (newContentLines.length - oldLines.length + (startLine - 1 === 0 ? currentContent.length - newContentLines.length : 0)), 0))

  let newStartLine = startLine
  let newEndLine = startLine
  for (let i = 0; i < newContentLines.length; i++) {
    const lineIdx = startLine - 1 + i
    if (lineIdx < startLine - 1 || lineIdx >= currentContent.length) break
    newEndLine = startLine + i
  }

  if (newEndLine < newStartLine) return

  let aiLineCount = 0
  let modLineCount = 0
  for (let i = newStartLine; i <= newEndLine; i++) {
    const line = currentContent[i - 1]
    if (line === undefined) continue

    if (!oldSet.has(line) || line.trim().length === 0) {
      aiLineCount++
    } else if (i <= oldLines.length + startLine - 1) {
      const oldIdx = i - startLine
      if (oldIdx >= 0 && oldIdx < oldLines.length && oldLines[oldIdx] !== line) {
        modLineCount++
      }
    }
  }

  for (let i = newStartLine; i <= newEndLine; i++) {
    const line = currentContent[i - 1]
    if (line === undefined) continue

    const isNewLine = !oldSet.has(line) && line.trim().length > 0
    const oldIdx = i - startLine
    const isModLine = !isNewLine && oldIdx >= 0 && oldIdx < oldLines.length && oldLines[oldIdx] !== line

    if (isNewLine) {
      decorations.push({
        range: new monaco.Range(i, 1, i, 1),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'ai-line-added',
          glyphMarginClassName: 'ai-glyph-added',
          glyphMarginHoverMessage: { value: 'AI 新增行' },
          overviewRuler: { color: 'rgba(35, 168, 98, 0.6)', position: monaco.editor.OverviewRulerLane.Full }
        }
      })
    } else if (isModLine) {
      decorations.push({
        range: new monaco.Range(i, 1, i, 1),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'ai-line-modified',
          glyphMarginClassName: 'ai-glyph-modified',
          glyphMarginHoverMessage: { value: 'AI 修改行' },
          overviewRuler: { color: 'rgba(59, 130, 246, 0.6)', position: monaco.editor.OverviewRulerLane.Full }
        }
      })
    }
  }

  aiDecorationIds = editor.deltaDecorations(aiDecorationIds, decorations)

  if (aiDecorationsTimer) clearTimeout(aiDecorationsTimer)
  aiDecorationsTimer = setTimeout(() => {
    clearAIDecorations()
  }, 30000)

  const disposable = editor.onDidChangeModelContent(() => {
    clearAIDecorationsImmediate()
    disposable.dispose()
  })
  setTimeout(() => disposable.dispose(), 30000)
}

function clearAIDecorationsImmediate() {
  if (aiDecorationIds.length > 0 && editor) {
    aiDecorationIds = editor.deltaDecorations(aiDecorationIds, [])
  }
  if (aiDecorationsTimer) {
    clearTimeout(aiDecorationsTimer)
    aiDecorationsTimer = null
  }
}

function clearAIDecorations() {
  clearAIDecorationsImmediate()
}

function commonPrefixLength(a, b) {
  const minLen = Math.min(a.length, b.length)
  let i = 0
  while (i < minLen && a[i] === b[i]) i++
  return i
}

function commonSuffixLength(a, b) {
  let i = 0
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++
  return i
}

function showDiffView(original, modified) {
  dispose()
  nextTick(() => {
    if (!editorContainer.value) return
    diffEditor = monaco.editor.createDiffEditor(editorContainer.value, {
      theme: props.theme,
      fontSize: props.fontSize,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderSideBySide: true,
      minimap: { enabled: false }
    })
    const originalModel = monaco.editor.createModel(original, getMonacoLang(props.language))
    const modifiedModel = monaco.editor.createModel(modified, getMonacoLang(props.language))
    diffEditor.setModel({ original: originalModel, modified: modifiedModel })

    diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
      const value = diffEditor.getModifiedEditor().getValue()
      emit('update:modelValue', value)
      emit('change', value)
    })
  })
}

function switchToNormal() {
  dispose()
  nextTick(() => {
    createEditor()
  })
}

watch(() => props.modelValue, (newVal) => {
  if (editor && editor.getValue() !== newVal) {
    const model = editor.getModel()
    if (model) {
      const viewState = editor.saveViewState()
      editor.setValue(newVal)
      if (viewState) editor.restoreViewState(viewState)
    }
  }
})

watch(() => props.language, (newLang) => {
  setLanguage(newLang)
})

watch(() => props.theme, (newTheme) => {
  monaco.editor.setTheme(newTheme)
})

watch(() => props.readOnly, (newReadOnly) => {
  if (editor) editor.updateOptions({ readOnly: newReadOnly })
})

watch(() => props.fontSize, (newSize) => {
  if (editor) editor.updateOptions({ fontSize: newSize })
})

watch(() => props.wordWrap, (newWrap) => {
  if (editor) editor.updateOptions({ wordWrap: newWrap ? 'on' : 'off' })
})

watch(() => props.showMinimap, (newMinimap) => {
  if (editor) editor.updateOptions({ minimap: { enabled: newMinimap } })
})

defineExpose({
  getValue,
  setValue,
  getEditor,
  focus,
  setLanguage,
  applyAIEdit,
  showDiffView,
  switchToNormal,
  clearAIDecorations
})
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  min-height: 300px;
  overflow: hidden;
}
</style>

<style>
.ai-line-added {
  background: rgba(35, 168, 98, 0.12);
  border-left: 3px solid rgba(35, 168, 98, 0.7);
}
.ai-line-modified {
  background: rgba(59, 130, 246, 0.12);
  border-left: 3px solid rgba(59, 130, 246, 0.7);
}
.ai-glyph-added {
  background: rgba(35, 168, 98, 0.8);
  width: 4px !important;
  margin-left: 3px;
  border-radius: 2px;
}
.ai-glyph-modified {
  background: rgba(59, 130, 246, 0.8);
  width: 4px !important;
  margin-left: 3px;
  border-radius: 2px;
}
</style>
