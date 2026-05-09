<template>
  <div class="ai-chat-container" :class="{ 'dark-mode': darkMode }">
    <div v-if="showApplyModal" class="key-modal-overlay" @click.self="rejectApply">
      <div class="key-modal apply-modal">
        <div class="key-modal-header">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="vertical-align:middle;margin-right:8px;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            应用代码更改
          </h3>
          <div class="apply-modal-header-actions">
            <button class="key-btn-sm accept-all-btn" @click="acceptAllChanges" :disabled="pendingChanges.length === 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              全部接受
            </button>
            <button class="key-btn-sm reject-all-btn" @click="rejectAllChanges">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              全部拒绝
            </button>
          </div>
        </div>
        <div class="key-modal-body apply-modal-body">
          <div v-for="(change, idx) in pendingChanges" :key="idx" class="apply-change-item" :class="{ accepted: change._accepted, rejected: change._rejected }">
            <div class="apply-change-header" @click="change._expanded = !change._expanded">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" class="apply-expand-arrow" :class="{ expanded: change._expanded }">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="apply-file-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <div class="apply-change-info">
                <span class="apply-change-name">{{ change.name }}</span>
                <span class="apply-change-path">{{ change.path }}</span>
              </div>
              <span class="apply-change-stats">
                <span class="stat-add" v-if="change._addedLines > 0">+{{ change._addedLines }}</span>
                <span class="stat-remove" v-if="change._removedLines > 0">-{{ change._removedLines }}</span>
                <span class="stat-mod" v-if="change._modLines > 0">~{{ change._modLines }}</span>
              </span>
              <div class="apply-change-actions" @click.stop>
                <button class="apply-accept-btn" @click="acceptSingleChange(change)" v-if="!change._accepted" title="接受此文件">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="apply-reject-btn" @click="rejectSingleChange(change)" v-if="!change._rejected" title="拒绝此文件">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <span v-if="change._accepted" class="apply-status accepted-status">已接受</span>
                <span v-if="change._rejected" class="apply-status rejected-status">已拒绝</span>
              </div>
            </div>
            <div class="apply-change-preview" v-show="change._expanded !== false">
              <div class="apply-diff-old" v-if="change.oldContent">
                <div class="apply-diff-label">原始内容</div>
                <pre>{{ change.oldContent }}</pre>
              </div>
              <div class="apply-diff-new">
                <div class="apply-diff-label">新内容</div>
                <pre>{{ change.newContent }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="key-modal-footer">
          <button class="key-btn cancel" @click="rejectApply">关闭</button>
          <button class="key-btn save" @click="confirmApply" :disabled="pendingChanges.every(c => c._rejected)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle;margin-right:4px;">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            应用已接受的更改
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteSessionConfirm" class="key-modal-overlay" @click.self="showDeleteSessionConfirm = false">
      <div class="key-modal" style="width: 360px;">
        <div class="key-modal-header">
          <h3>删除对话</h3>
          <button class="key-modal-close" @click="showDeleteSessionConfirm = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="key-modal-body" style="padding: 24px;">
          <p class="key-modal-desc" style="margin: 0; text-align: center;">确定要删除此对话吗？删除后无法恢复。</p>
        </div>
        <div class="key-modal-footer">
          <button class="key-btn delete-cancel-btn" @click="showDeleteSessionConfirm = false">取消</button>
          <button class="key-btn delete-confirm-btn" @click="confirmDeleteSession">确认删除</button>
        </div>
      </div>
    </div>

    <div v-if="showClearAllSessionsConfirm" class="key-modal-overlay" @click.self="showClearAllSessionsConfirm = false">
      <div class="key-modal" style="width: 360px;">
        <div class="key-modal-header">
          <h3>清空所有对话</h3>
          <button class="key-modal-close" @click="showClearAllSessionsConfirm = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="key-modal-body" style="padding: 24px;">
          <p class="key-modal-desc" style="margin: 0; text-align: center;">确定要清空所有历史对话吗？此操作不可恢复。</p>
        </div>
        <div class="key-modal-footer">
          <button class="key-btn delete-cancel-btn" @click="showClearAllSessionsConfirm = false">取消</button>
          <button class="key-btn delete-confirm-btn" @click="confirmClearAllSessions">确认清空</button>
        </div>
      </div>
    </div>

    <div v-if="showExplorerDeleteConfirm" class="key-modal-overlay" @click.self="showExplorerDeleteConfirm = false">
      <div class="key-modal" style="width: 360px;">
        <div class="key-modal-header">
          <h3>{{ explorerDeleteType === 'folder' ? '移除文件夹' : explorerDeleteType === 'workspace' ? '忘记工作区' : '清空工作区' }}</h3>
          <button class="key-modal-close" @click="showExplorerDeleteConfirm = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="key-modal-body" style="padding: 24px;">
          <p class="key-modal-desc" style="margin: 0; text-align: center;" v-if="explorerDeleteType === 'folder'">确定要移除文件夹「{{ explorerDeleteTarget }}」吗？移除后文件将删除，无法恢复。</p>
          <p class="key-modal-desc" style="margin: 0; text-align: center;" v-else-if="explorerDeleteType === 'workspace'">确定要忘记工作区「{{ explorerDeleteTarget }}」吗？相关文件将被删除。</p>
          <p class="key-modal-desc" style="margin: 0; text-align: center;" v-else>确定要清空所有文件夹吗？已登录时将同时删除服务器上的文件。</p>
        </div>
        <div class="key-modal-footer">
          <button class="key-btn delete-cancel-btn" @click="showExplorerDeleteConfirm = false">取消</button>
          <button class="key-btn delete-confirm-btn" @click="confirmExplorerDelete">确认删除</button>
        </div>
      </div>
    </div>

    <div v-if="showKeyModal" class="key-modal-overlay" @click.self="showKeyModal = false">
      <div class="key-modal">
        <div class="key-modal-header">
          <h3>配置 {{ modelNames[configModel] }} API Key</h3>
          <button class="key-modal-close" @click="showKeyModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="key-modal-body">
          <p class="key-modal-desc">请输入您的 {{ modelNames[configModel] }} API Key，密钥仅存储在浏览器本地。</p>
          <p v-if="modelPresetConfigs[configModel]?.keyUrl" class="key-modal-guide">在 <a :href="'https://' + modelPresetConfigs[configModel].keyUrl" target="_blank" rel="noopener" class="key-modal-guide-link">{{ modelPresetConfigs[configModel].keyUrl }}</a> 注册并获取 API Key</p>
          <div class="key-input-group">
            <label>API Key</label>
            <div class="key-input-wrapper">
              <input
                v-model="tempApiKey"
                :type="showKeyValue ? 'text' : 'password'"
                placeholder="sk-..."
                class="key-input"
                autocomplete="off"
                @keydown.enter="saveApiKey"
              />
              <button class="key-toggle-visibility" @click="showKeyValue = !showKeyValue">
                <svg v-if="!showKeyValue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="key-input-group">
            <label>API 地址（可选）</label>
            <input
              v-model="tempApiBase"
              placeholder="留空使用默认地址"
              class="key-input"
              @keydown.enter="saveApiKey"
            />
          </div>
          <div v-if="apiKeys[configModel]?.key" class="key-delete-hint">
            <template v-if="!showDeleteKeyConfirm">
              <span>已配置密钥，保存将覆盖原有配置</span>
              <button class="key-delete-btn" @click="showDeleteKeyConfirm = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                删除密钥
              </button>
            </template>
            <template v-else>
              <span class="key-delete-confirm-text">确认删除此 API Key？</span>
              <div class="key-delete-actions">
                <button class="key-btn-delete-cancel" @click="showDeleteKeyConfirm = false">取消</button>
                <button class="key-btn-delete-confirm" @click="confirmDeleteKey">删除</button>
              </div>
            </template>
          </div>
        </div>
        <div class="key-modal-footer">
          <button class="key-btn cancel" @click="showKeyModal = false">取消</button>
          <button class="key-btn save" @click="saveApiKey" :disabled="!tempApiKey.trim()">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModelConfirm" class="key-modal-overlay" @click.self="showDeleteModelConfirm = false">
      <div class="key-modal confirm-modal-sm">
        <div class="key-modal-header">
          <h3>删除模型</h3>
          <button class="key-modal-close" @click="showDeleteModelConfirm = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="key-modal-body">
          <p class="confirm-text-main">确定要删除「{{ modelNames[deleteModelTarget] }}」吗？</p>
          <p class="confirm-text-sub">删除后需重新配置 API Key 才能使用此模型。</p>
        </div>
        <div class="key-modal-footer">
          <button class="key-btn cancel" @click="showDeleteModelConfirm = false">取消</button>
          <button class="key-btn delete-confirm-btn" @click="confirmDeleteModel">删除</button>
        </div>
      </div>
    </div>

    <div v-if="showCustomModelModal" class="key-modal-overlay" @click.self="showCustomModelModal = false">
      <div class="key-modal key-modal-lg">
        <div class="key-modal-header">
          <h3>添加模型</h3>
          <button class="key-modal-close" @click="showCustomModelModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="key-modal-body">
          <p class="key-modal-desc">选择一个模型并填写 API Key 即可接入，密钥仅存储在本地浏览器。</p>

          <div class="model-picker">
            <div class="model-picker-list">
              <div
                v-for="opt in presetModelOptions"
                :key="opt.id"
                class="model-picker-item"
                :class="{ selected: selectedPresetModel === opt.id }"
                @click="selectModelCard(opt.id)"
              >
                <span class="model-picker-icon" v-html="getModelIconHtml(opt, 18)"></span>
                <div class="model-picker-detail">
                  <span class="model-picker-name">{{ opt.name }}</span>
                  <span class="model-picker-meta">
                    <span class="model-picker-provider">{{ opt.provider }}</span>
                    <template v-if="opt.free"><span class="tag tag-free">免费</span></template>
                    <template v-if="opt.isTop"><span class="tag tag-top">推荐</span></template>
                    <template v-if="modelPresetConfigs[opt.id]?.isImageModel"><span class="tag tag-image">图像</span></template>
                    <template v-if="modelPresetConfigs[opt.id]?.isVideoModel"><span class="tag tag-video">视频</span></template>
                  </span>
                </div>
                <svg v-if="selectedPresetModel === opt.id" class="model-picker-check" viewBox="0 0 24 24" fill="none" stroke="#409eff" stroke-width="2.5" width="16" height="16">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="key-input-group" style="margin-top:16px">
            <label>API Key</label>
            <div class="key-input-wrapper">
              <input
                v-model="customModelKey"
                :type="showCustomKeyValue ? 'text' : 'password'"
                :placeholder="selectedPresetModel ? '请输入 API Key' : '请先选择模型'"
                class="key-input"
                autocomplete="off"
              />
              <button class="key-toggle-visibility" @click="showCustomKeyValue = !showCustomKeyValue">
                <svg v-if="!showCustomKeyValue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="model-picker-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>API Key 仅存储在本地浏览器，不会上传到任何服务器</span>
          </div>
        </div>
        <div class="key-modal-footer">
          <button class="key-btn cancel" @click="showCustomModelModal = false">取消</button>
          <button class="key-btn save" @click="addPresetModel" :disabled="!selectedPresetModel || !customModelKey.trim()">添加</button>
        </div>
      </div>
    </div>

    <div v-if="showApplyChoiceModal" class="apply-modal-overlay" @click.self="showApplyChoiceModal = false">
      <div class="apply-modal">
        <button class="apply-modal-close-btn" @click="showApplyChoiceModal = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div class="apply-modal-header">
          <div class="apply-modal-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 class="apply-modal-title">申请使用权限</h2>
          <p class="apply-modal-desc">请选择您需要申请的使用模式，不同模式功能各有不同</p>
        </div>

        <div class="apply-modal-content">
          <div v-if="applyChoiceStep === ''" class="apply-mode-grid">
            <div class="apply-mode-item apply-mode-free" :class="{ 'mode-active': qaApplyStatus === 'approved' }" @click="selectApplyType('qa')">
              <div class="mode-price-badge badge-free">免费</div>
              <div class="mode-item-icon mode-icon-qa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 class="mode-item-title">智能问答</h3>
              <p class="mode-item-subtitle">与大模型对话，获取回答</p>
              <ul class="mode-item-features">
                <li>多种大模型可选</li>
                <li>对话式问答</li>
                <li>代码补全与解释</li>
                <li>无需文件操作权限</li>
              </ul>
              <div class="mode-item-status">
                <span v-if="qaApplyStatus === 'approved'" class="mode-badge badge-green">已开通</span>
                <span v-else-if="qaApplyStatus === 'pending'" class="mode-badge badge-orange">审核中</span>
                <span v-else-if="qaApplyStatus === 'rejected'" class="mode-badge badge-red">已拒绝</span>
                <span v-else class="mode-badge badge-blue">未申请</span>
              </div>
              <button v-if="qaApplyStatus !== 'approved'" class="mode-item-btn" :disabled="qaApplyStatus === 'pending'">
                {{ qaApplyStatus === 'pending' ? '等待审核' : qaApplyStatus === 'rejected' ? '重新申请' : '立即申请' }}
              </button>
              <button v-else class="mode-item-btn mode-btn-green">已开通，可使用</button>
            </div>

            <div class="apply-mode-item apply-mode-free" :class="{ 'mode-active': agentHasAccess }" @click="selectApplyType('agent')">
              <div class="mode-price-badge badge-free">免费</div>
              <div class="mode-item-icon mode-icon-agent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 class="mode-item-title">智能体</h3>
              <p class="mode-item-subtitle">AI自动执行复杂任务</p>
              <ul class="mode-item-features">
                <li>自动读写文件</li>
                <li>代码智能管理</li>
                <li>复杂任务编排</li>
                <li>支持邀请码兑换</li>
              </ul>
              <div class="mode-item-status">
                <span v-if="agentHasAccess" class="mode-badge badge-green">已开通</span>
                <span v-else-if="agentApplyStatus === 'pending'" class="mode-badge badge-orange">审核中</span>
                <span v-else-if="agentApplyStatus === 'rejected'" class="mode-badge badge-red">已拒绝</span>
                <span v-else class="mode-badge badge-blue">未申请</span>
              </div>
              <button v-if="!agentHasAccess" class="mode-item-btn" :disabled="agentApplyStatus === 'pending'">
                {{ agentApplyStatus === 'pending' ? '等待审核' : agentApplyStatus === 'rejected' ? '重新申请' : '立即申请' }}
              </button>
              <button v-else class="mode-item-btn mode-btn-green">已开通，可使用</button>
            </div>

            <div class="apply-mode-item apply-mode-self" :class="{ 'mode-active': customApiAccess }" @click="selectApplyType('custom')">
              <div class="mode-price-badge badge-self">自备 Key</div>
              <div class="mode-item-icon mode-icon-custom">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  <circle cx="12" cy="16" r="1"/>
                </svg>
              </div>
              <h3 class="mode-item-title">自定义 API</h3>
              <p class="mode-item-subtitle">接入自己的 AI 模型</p>
              <ul class="mode-item-features">
                <li>使用自有 API Key</li>
                <li>支持 OpenAI/Gemini 等</li>
                <li>灵活配置模型</li>
                <li>不受平台限制</li>
              </ul>
              <div class="mode-item-status">
                <span v-if="customApiAccess" class="mode-badge badge-green">已开通</span>
                <span v-else-if="customApiStatus === 'pending'" class="mode-badge badge-orange">审核中</span>
                <span v-else-if="customApiStatus === 'rejected'" class="mode-badge badge-red">已拒绝</span>
                <span v-else class="mode-badge badge-blue">未申请</span>
              </div>
              <button v-if="!customApiAccess" class="mode-item-btn" :disabled="customApiStatus === 'pending'">
                {{ customApiStatus === 'pending' ? '等待审核' : customApiStatus === 'rejected' ? '重新申请' : '立即申请' }}
              </button>
              <button v-else class="mode-item-btn mode-btn-green">已开通，可使用</button>
            </div>
          </div>

          <div v-if="applyChoiceStep === 'qa'" class="apply-form-area">
            <button class="apply-back" @click="applyChoiceStep = ''">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
              返回
            </button>
            <div class="apply-form-card">
              <h3 class="apply-card-title">智能问答申请</h3>
              <div v-if="qaApplyStatus === 'pending'" class="apply-status-box status-pending">
                <div class="apply-status-emoji">⏳</div>
                <h4>申请审核中</h4>
                <p>您的申请已提交，请等待管理员审核</p>
              </div>
              <div v-else-if="qaApplyStatus === 'rejected'" class="apply-status-box status-rejected">
                <div class="apply-status-emoji">✗</div>
                <h4>申请被拒绝</h4>
                <p>您的申请未通过审核，可以重新提交申请</p>
                <button class="apply-card-btn" @click="qaApplyStatus = ''">重新申请</button>
              </div>
              <template v-else>
                <div class="apply-input-group">
                  <div class="apply-label-row">
                    <label class="apply-label">申请原因</label>
                    <span class="apply-hint">选填</span>
                  </div>
                  <textarea v-model="agentReason" class="apply-textarea" placeholder="请输入申请原因（可选）" rows="3"></textarea>
                </div>
                <p v-if="qaApplyError" class="apply-error-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {{ qaApplyError }}
                </p>
                <p v-if="qaApplySuccess" class="apply-success-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {{ qaApplySuccess }}
                </p>
                <button class="apply-card-btn" @click="submitQaApply" :disabled="qaApplyLoading">
                  {{ qaApplyLoading ? '提交中...' : '提交申请' }}
                </button>
              </template>
            </div>
          </div>

          <div v-if="applyChoiceStep === 'agent'" class="apply-form-area">
            <button class="apply-back" @click="applyChoiceStep = ''">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
              返回
            </button>
            <div class="apply-form-card">
              <div class="apply-tabs">
                <button class="apply-tab-item" :class="{ 'tab-active': agentTab === 'apply' }" @click="agentTab = 'apply'">申请权限</button>
                <button class="apply-tab-item" :class="{ 'tab-active': agentTab === 'redeem' }" @click="agentTab = 'redeem'">邀请码兑换</button>
              </div>
              <div v-if="agentTab === 'apply'">
                <h3 class="apply-card-title">智能体申请</h3>
                <div class="apply-input-group">
                  <div class="apply-label-row">
                    <label class="apply-label">申请说明</label>
                    <span class="apply-hint">选填</span>
                  </div>
                  <textarea v-model="agentReason" class="apply-textarea" placeholder="简要说明为什么需要使用智能体..." rows="3"></textarea>
                </div>
                <p v-if="agentApplyError" class="apply-error-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {{ agentApplyError }}
                </p>
                <p v-if="agentApplySuccess" class="apply-success-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {{ agentApplySuccess }}
                </p>
                <button class="apply-card-btn" @click="submitAgentApply" :disabled="agentApplying">
                  {{ agentApplying ? '提交中...' : '提交申请' }}
                </button>
              </div>
              <div v-if="agentTab === 'redeem'">
                <h3 class="apply-card-title">邀请码兑换</h3>
                <div class="apply-input-group">
                  <div class="apply-label-row">
                    <label class="apply-label">邀请码</label>
                    <span class="apply-hint" style="color: #f53f3f;">必填</span>
                  </div>
                  <input v-model="agentCode" class="apply-input" placeholder="输入管理员给你的邀请码" style="text-transform: uppercase;" />
                </div>
                <p v-if="agentRedeemError" class="apply-error-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {{ agentRedeemError }}
                </p>
                <button class="apply-card-btn" @click="submitAgentRedeem" :disabled="agentRedeeming || !agentCode.trim()">
                  {{ agentRedeeming ? '兑换中...' : '立即兑换' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="applyChoiceStep === 'custom'" class="apply-form-area">
            <button class="apply-back" @click="applyChoiceStep = ''">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
              返回
            </button>
            <div class="apply-form-card">
              <h3 class="apply-card-title">自定义 API Key 申请</h3>
              <div v-if="customApiStatus === 'pending'" class="apply-status-box status-pending">
                <div class="apply-status-emoji">⏳</div>
                <h4>申请审核中</h4>
                <p>您的申请已提交，请等待管理员审核</p>
              </div>
              <div v-else-if="customApiStatus === 'rejected'" class="apply-status-box status-rejected">
                <div class="apply-status-emoji">✗</div>
                <h4>申请被拒绝</h4>
                <p>您的申请未通过审核，可以重新提交申请</p>
                <button class="apply-card-btn" @click="customApiStatus = ''">重新申请</button>
              </div>
              <template v-else>
                <div class="apply-input-group">
                  <div class="apply-label-row">
                    <label class="apply-label">申请说明</label>
                    <span class="apply-hint">选填</span>
                  </div>
                  <textarea v-model="agentReason" class="apply-textarea" placeholder="简要说明为什么需要使用自定义 API Key..." rows="3"></textarea>
                </div>
                <p v-if="customApiApplyError" class="apply-error-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {{ customApiApplyError }}
                </p>
                <p v-if="customApiApplySuccess" class="apply-success-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {{ customApiApplySuccess }}
                </p>
                <button class="apply-card-btn" @click="submitCustomApiApply" :disabled="customApiApplying">
                   {{ customApiApplying ? '提交中...' : '提交申请' }}
                 </button>
               </template>
             </div>
           </div>
        </div>
      </div>
    </div>

    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <button class="new-chat-btn" @click="startNewChat" :class="{ 'collapsed-only': sidebarCollapsed }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span class="btn-text" v-if="!sidebarCollapsed">新对话</span>
        </button>
        <div class="sidebar-header-right">
          <button class="theme-header-btn" @click="toggleDarkMode" :title="darkMode ? '切换到浅色主题' : '切换到深色主题'">
            <svg v-if="darkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <button class="toggle-sidebar-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" :class="{ 'rotate-180': !sidebarCollapsed }">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>
      </div>

      <Transition name="sidebar-body">
        <div v-if="!sidebarCollapsed" class="sidebar-body">
        <div class="sidebar-section file-explorer-section">
          <div class="section-title vscode-title">
            <span class="vscode-title-text">资源管理器</span>
            <div class="vscode-title-actions">
              <button class="explorer-action-btn" @click="createNewFile" title="新建文件">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </button>
              <button class="explorer-action-btn" @click="createNewFolder" title="新建文件夹">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="11" x2="12" y2="17"/>
                  <line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
              </button>
              <button class="explorer-action-btn" @click="openFolder" title="打开文件夹">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <button class="explorer-action-btn" @click="organizeWorkspace" title="整理文件" v-if="workspaceFolders.length > 0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="11" x2="12" y2="17"/>
                  <line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
              </button>
              <button class="explorer-action-btn" @click="removeAllFolders" title="清空工作区" v-if="workspaceFolders.length > 0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="file-tree" v-if="workspaceFolders.length > 0">
            <div v-for="folder in workspaceFolders" :key="folder.path" class="explorer-folder-card">
              <div class="explorer-card-header" @click="toggleFolder(folder.path)">
                <div class="explorer-card-info">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" class="tree-arrow" :class="{ expanded: expandedFolders.has(folder.path) }">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" width="16" height="16" class="tree-folder-icon" :class="{ 'folder-open': expandedFolders.has(folder.path) }" :fill="expandedFolders.has(folder.path) ? '#dcb67a' : '#d6a052'">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span class="tree-item-name">{{ folder.name }}</span>
                </div>
                <div class="explorer-card-actions">
                  <button class="tree-download-btn" @click.stop="downloadFolderZip(folder)" title="下载文件夹">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                  <button class="tree-remove-btn" @click.stop="removeFolder(folder.path)" title="移除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="tree-folder-children" v-show="expandedFolders.has(folder.path)">
                <file-tree-node
                  v-for="child in folder.children"
                  :key="child.path"
                  :node="child"
                  :selected="selectedFilePath"
                  :selectedFiles="selectedFiles"
                  :showCheckbox="showFileCheckboxes"
                  @select="openFileInTree"
                  @expand="toggleFolder"
                  @check="handleFileTreeCheck"
                  @contextmenu="handleFileTreeContextMenu"
                  @drophandler="handleFileTreeDrop"
                ></file-tree-node>
              </div>
            </div>
          </div>
          <div class="file-tree-empty" v-if="savedWorkspaces.length === 0 && workspaceFolders.length === 0" @click="openFolder">
            <div class="empty-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="40" height="40">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p class="empty-title">开始创建</p>
            <p class="empty-desc">点击上方 📄 新建文件</p>
            <p class="empty-desc">或 📁 打开文件夹</p>
            <p class="empty-desc">AI 生成代码时会自动创建文件</p>
          </div>
          <div v-if="savedWorkspaces.length > 0 && workspaceFolders.length === 0" class="saved-workspaces">
            <div class="saved-workspaces-title">上次打开的工作区</div>
            <div
              v-for="name in savedWorkspaces"
              :key="name"
              class="saved-workspace-card"
              @click="restoreWorkspace(name)"
            >
              <div class="saved-workspace-card-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="saved-workspace-name">{{ name }}</span>
                <span class="saved-workspace-hint">点击重新选择</span>
              </div>
              <button class="saved-workspace-remove" @click.stop="removeSavedWorkspace(name)" title="忘记此工作区">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 对话历史 -->
        <div class="sidebar-section chat-history-section">
          <div class="section-title vscode-title" @click="historyCollapsed = !historyCollapsed" style="cursor:pointer">
            <div class="vscode-title-text" style="display:flex;align-items:center;gap:4px">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" class="tree-arrow" :class="{ expanded: !historyCollapsed }"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
              <span>对话历史</span>
              <span v-if="chatSessions.length > 0" class="history-count">{{ chatSessions.length }}</span>
            </div>
            <div class="vscode-title-actions" v-if="chatSessions.length > 0">
              <button class="explorer-action-btn" @click.stop="clearAllSessions" title="清空所有对话">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="!historyCollapsed" class="chat-history-list" v-show="chatSessions.length > 0">
            <div v-for="group in groupedSessions" :key="group.label" class="history-group">
              <div class="history-group-label">{{ group.label }}</div>
              <div
                v-for="session in group.sessions"
                :key="session.id"
                class="chat-history-card"
                :class="{ active: currentSessionId === session.id }"
                @click="switchToSession(session.id)"
              >
                <div class="card-body">
                  <div v-if="renamingSessionId === session.id" class="card-rename-input-wrap" @click.stop>
                    <input
                      class="card-rename-input"
                      v-model="renamingTitle"
                      @keyup.enter="confirmRenameSession(session.id)"
                      @keyup.escape="cancelRenameSession"
                      @blur="confirmRenameSession(session.id)"
                      ref="renameInputRef"
                      autofocus
                    />
                  </div>
                  <div v-else class="chat-history-title">{{ session.title }}</div>
                  <div class="chat-history-meta">{{ formatSessionTime(session.createdAt) }} · {{ session.count || 0 }}条</div>
                </div>
                <div class="card-header">
                  <button class="card-menu-btn" @click.stop="toggleSessionMenu(session.id)" title="更多操作">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                    </svg>
                  </button>
                  <div v-if="activeMenuSessionId === session.id" class="card-menu-dropdown" @click.stop>
                    <button class="card-menu-item" @click="startRenameSession(session)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      <span>重命名</span>
                    </button>
                    <button class="card-menu-item" @click="exportSession(session.id)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      <span>导出</span>
                    </button>
                    <button class="card-menu-item card-menu-item-danger" @click="askDeleteSession(session.id); activeMenuSessionId = null">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!historyCollapsed && chatSessions.length === 0" class="chat-history-empty">暂无历史对话</div>
        </div>

        <div class="sidebar-section memory-section">
          <div class="section-title vscode-title" @click="showMemoryPanel = !showMemoryPanel" style="cursor:pointer">
            <div class="vscode-title-text" style="display:flex;align-items:center;gap:4px">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" class="tree-arrow" :class="{ expanded: showMemoryPanel }"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
              <span>长久记忆</span>
              <span v-if="memoryCount > 0" class="history-count">{{ memoryCount }}</span>
            </div>
            <div class="vscode-title-actions">
              <button v-if="memoryCount > 0 && showMemoryPanel" class="explorer-action-btn" @click.stop="clearMemoryStore" title="清空所有记忆">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="showMemoryPanel" class="memory-panel-body">
            <div v-if="retrievedMemories.length === 0 && memoryCount === 0" class="memory-empty-sidebar">
              <p>暂无记忆</p>
              <p class="memory-empty-hint">AI 会在对话过程中自动学习</p>
            </div>
            <div v-for="mem in retrievedMemories" :key="mem.id" class="memory-item-sidebar" :title="mem.content">
              <div class="memory-item-topic-sidebar">{{ mem.topic || '未命名' }}</div>
              <div class="memory-item-content-sidebar">{{ mem.content }}</div>
              <div class="memory-item-meta-sidebar">
                <span class="memory-item-score-sidebar" v-if="mem._score">匹配 {{ Math.round(mem._score * 100) }}%</span>
                <span class="memory-item-time-sidebar">{{ new Date(mem.timestamp).toLocaleDateString() }}</span>
                <button @click="deleteMemoryById(mem.id)" class="memory-del-btn-sidebar" title="删除此记忆">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-section custom-models-section">
          <div class="custom-panel-header" @click="qaApplyStatus === 'approved' ? showCustomPanel = !showCustomPanel : switchToQaMode()">
            <div class="custom-panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="custom-panel-icon">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>自定义模型</span>
              <span v-if="qaApplyStatus !== 'approved'" class="mode-apply-hint" style="margin-left:auto">需申请</span>
            </div>
            <svg class="custom-panel-chevron" :class="{ open: showCustomPanel && qaApplyStatus === 'approved' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div v-if="showCustomPanel && qaApplyStatus === 'approved'" class="custom-panel-body">
            <div
              v-for="model in modelsNotAdded"
              :key="'add-' + model.id"
              class="custom-panel-item"
              @click="openKeyConfig(model.id)"
            >
              <div class="custom-panel-item-left">
                <span v-html="getModelIconHtml(model, 18, 'margin-right:10px')"></span>
                <span class="custom-panel-item-name">{{ model.name }}</span>
              </div>
              <span class="custom-panel-item-add">添加</span>
            </div>
            <div v-if="modelsNotAdded.length === 0" class="custom-panel-empty">已添加全部预设模型</div>
          </div>

          <template v-if="userConfiguredModels.length > 0">
            <div class="custom-panel-divider"></div>
            <div class="custom-panel-subtitle">我的模型</div>
            <div
              v-for="model in userConfiguredModels"
              :key="'my-' + model.id"
              class="custom-panel-item active-item"
              :class="{ current: selectedModel === model.id }"
              @click="selectModel(model.id)"
            >
              <div class="custom-panel-item-left">
                <span v-html="getModelIconHtml(model, 18, 'margin-right:10px')"></span>
                <span class="custom-panel-item-name">{{ model.name }}</span>
              </div>
              <button class="custom-panel-item-del" @click.stop="removeCustomModel(model.id)" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </template>
        </div>
        </div>
      </Transition>
    <button v-if="sidebarCollapsed" class="collapsed-theme-btn" @click="toggleDarkMode" :title="darkMode ? '切换到浅色主题' : '切换到深色主题'">
      <svg v-if="darkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
    </aside>

    <main class="chat-main">
      <input
        ref="folderInput"
        type="file"
        webkitdirectory
        mozdirectory
        msdirectory
        odirectory
        directory
        style="display: none"
        @change="handleFolderSelect"
      />

      <div class="main-content-area">
        <div v-if="showEditor" class="editor-panel">
          <transition name="notice-slide">
            <div v-if="editorApplyNotice" class="editor-apply-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {{ editorApplyNotice }}
            </div>
          </transition>
          
          <!-- VS Code style tabs -->
          <div class="editor-tabs-container" :class="{ 'can-scroll-left': canScrollLeft, 'can-scroll-right': canScrollRight }">
            <button class="tab-scroll-btn tab-scroll-left" @click="scrollTabs('left')" v-show="canScrollLeft">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div class="editor-tabs" ref="tabsContainerRef" @wheel.prevent="handleWheelScroll" @mousedown="handleMouseDown" @touchstart="handleTouchStart" @touchmove="handleTouchMove">
              <div
                v-for="tab in editorTabs"
                :key="tab.path"
                class="editor-tab"
                :class="{ active: activeTab === tab.path }"
                @click="switchToTab(tab)"
              >
                <span class="tab-icon">{{ getFileIcon(tab.name) }}</span>
                <span class="tab-name">{{ tab.name }}</span>
                <button
                  class="tab-close"
                  @click.stop="closeTab(tab)"
                  title="关闭"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <button class="tab-scroll-btn tab-scroll-right" @click="scrollTabs('right')" v-show="canScrollRight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div class="editor-header">
            <div class="editor-header-left">
              <svg class="editor-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span class="editor-filename">{{ currentFileName || '未打开文件' }}</span>
            </div>
            <div class="editor-header-actions">
              <button class="editor-action-btn review" @click="smartReview" :disabled="!currentFileName || isLoading" title="智能审查：自动检测 bug 和多余代码并修复">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="11" y1="8" x2="11" y2="14"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>
              <button class="editor-action-btn" @click="toggleWordWrap" :class="{ active: wordWrap }" title="切换换行">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="4 7 4 4 20 4 20 7"/>
                  <line x1="9" y1="20" x2="15" y2="20"/>
                  <line x1="12" y1="4" x2="12" y2="20"/>
                </svg>
              </button>
              <button class="editor-action-btn save" @click="downloadFile" :disabled="!currentFileName" title="保存到服务器并下载 (Ctrl+S)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button class="editor-action-btn" @click="togglePreview" :class="{ active: showPreview }" :disabled="!editorContent" title="预览效果">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button class="editor-action-btn close" @click="closeEditor" title="关闭编辑器">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="editor-body" :class="{ 'word-wrap': wordWrap }">
            <MonacoEditor
              ref="monacoRef"
              v-model="editorContent"
              :language="editorLang"
              :theme="darkMode ? 'vs-dark' : 'vs'"
              :font-size="fontSize"
              :word-wrap="wordWrap"
              :show-minimap="true"
              height="100%"
              @save="downloadFile"
              @cursorChange="onMonacoCursorChange"
            />
            <div v-if="showPreview" class="preview-panel">
              <div class="preview-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right:4px">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <span>预览</span>
                <button class="preview-close-btn" @click="togglePreview">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <iframe :src="previewUrl" class="preview-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
            </div>
          </div>
          <div class="editor-footer">
            <div class="editor-footer-left">
              <span class="footer-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" width="12" height="12"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {{ editorLang || 'Text' }}
              </span>
              <span class="footer-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" width="12" height="12"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                {{ lineCount }} 行 · {{ editorContent.length }} 字符
              </span>
              <span class="footer-item" v-if="cursorPos.line">
                Ln {{ cursorPos.line }}, Col {{ cursorPos.col }}
              </span>
            </div>
            <div class="editor-footer-right">
              <span class="footer-item" v-if="isModified">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                未保存
              </span>
              <span class="footer-item" v-else>
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" width="12" height="12"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                已保存
              </span>
              <span class="footer-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" width="12" height="12"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                {{ fontSize }}px
              </span>
            </div>
          </div>
        </div>

        <div class="chat-panel" :class="{ 'full-width': !showEditor }">
          <div class="chat-topbar">
        <button class="mobile-sidebar-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <button class="expand-sidebar-btn" v-if="sidebarCollapsed" @click="sidebarCollapsed = false" title="展开侧边栏">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <template v-if="allConfiguredModels.length > 0">
          <div class="topbar-model-info" @click.stop="qaApplyStatus === 'approved' ? showModelDropdown = !showModelDropdown : switchToQaMode()">
            <span class="topbar-model-icon" v-html="getModelIconHtml(currentModelInfo, 22, 'color:#409eff')"></span>
            <span class="topbar-title">{{ getModelName() }}</span>
            <span v-if="qaApplyStatus !== 'approved'" class="mode-apply-hint" style="margin-left:8px">需申请</span>
            <svg v-if="qaApplyStatus === 'approved'" class="topbar-chevron" :class="{ open: showModelDropdown }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <div v-if="showModelDropdown && qaApplyStatus === 'approved'" class="topbar-model-dropdown" @click.stop>
              <div
                v-for="model in allConfiguredModels"
                :key="'topbar-' + model.id"
                class="topbar-model-dropdown-item"
                :class="{ active: selectedModel === model.id }"
                @click="selectModel(model.id); showModelDropdown = false"
              >
                <span class="topbar-model-dropdown-icon" v-html="getModelIconHtml(model, 18, '')"></span>
                <span class="topbar-model-dropdown-name">{{ model.name }}</span>
                <span v-if="modelPresetConfigs[model.id]?.isImageModel" class="topbar-model-tag image-tag">图片</span>
                <span v-if="modelPresetConfigs[model.id]?.isVideoModel" class="topbar-model-tag video-tag">视频</span>
                <span v-if="model.isTop" class="topbar-model-top-badge" style="font-size: 14px; line-height: 1;">🧠</span>
                <svg v-if="selectedModel === model.id" class="topbar-model-dropdown-check" viewBox="0 0 24 24" fill="none" stroke="#409eff" stroke-width="2.5" width="16" height="16">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="topbar-model-placeholder">
          <svg viewBox="0 0 1024 1024" fill="currentColor" width="22" height="22" style="color:#409eff"><path d="M578.35790073 232.33166444l0.66509063 1.66409133 0.66509063-1.06450894c40.42859395-58.9619676 98.82464311-76.29799615 171.09479219-49.31314936l2.69584615 0.99900071C814.03745134 208.04175394 845.64790794 255.38965602 851.47086284 315.08404216c1.96342761 20.06462883 0.66509062 41.39302083-2.8286823 60.69247701l-0.86434487 4.59103602 1.66318149-0.3320904a95.66296056 95.66296056 0 0 1 38.86367482-0.20016408l2.66218218 0.5995824c40.72793022 9.31672785 75.66565964 49.57791182 87.84382394 98.49073303 13.50925537 54.13710357-2.29642783 109.47155222-48.34781262 149.06764557-61.2574856 54.83585814-94.63120575 136.65656309-99.75449622 246.56028773a19.49780056 19.49780056 0 0 1-20.43129303 18.56703764 19.49780056 19.49780056 0 0 1-18.63345568-20.33030117c5.55728259-119.65262494 42.95703014-211.29046793 112.93257103-274.01188077 34.87131134-29.94636526 46.31705708-70.14113118 36.26882054-110.46964306-8.88455542-35.7029021-33.60663834-64.25266803-58.66263133-69.9755409-14.90676456-3.46010898-29.71344707-0.56500859-43.6548749 6.65545549a80.88903216 80.88903216 0 0 0-9.58331 5.82295489l-1.66409134 1.23100906-2.16268182 1.66318149-0.39941832 0.26658216-0.23291821 0.2329182-0.36575435 0.2329182-1.56400929 0.66509063-4.65836391 1.89700952-1.06450896 0.20016407-1.29742713 0.16559028-1.59767325 0.10008204-3.19352684-0.16650011-5.85661886-1.82968161-6.38887334-4.99136416-3.72669115-6.92112781-0.79883662-5.72287287 0.2329182-2.99518242 0.33300024-1.46392728 0.16650011-0.66509061 1.86334557-4.29260956 0.49950036-0.99809087 0.2656723-0.39941831 0.40032816-0.53225448 0.16559027-0.16650012 0.20016408-0.33300023c9.48231812-14.97318263 17.73453703-53.57118513 14.44001834-87.1441595-4.49186382-45.91854862-27.38426511-80.22394153-73.20273168-97.95847857-69.11028619-26.68551052-115.79309764-4.22619149-147.73655449 72.40389506-7.41971832 17.73544687-33.44013821 15.20610083-37.26691138-3.6266091-18.96645594-93.79961497-66.41534987-130.66710808-147.93671857-117.32435279-89.5734235 16.96936435-119.45246085 69.20945839-93.9315413 166.70301039 4.72387217 18.00111919-16.2387655 31.67687469-30.97902993 20.197465-42.45752979-33.07438386-87.24424154-35.20431157-138.41982663-5.92303695l-1.63042737 0.93167279-1.46392726 1.130927c-47.8146483 36.60182077-58.3296311 73.00347746-41.72511124 118.55536188l0.79792679 2.1963458 1.3310911 3.3936909 0.69875459 1.69684547 1.43117314 3.39369091 0.76426282 1.66500116 1.53125517 3.42644503 1.63042738 3.3936909 1.73050941 3.46101882 1.79692749 3.46010898 1.92885381 3.56019104 1.99709158 3.59385497 2.16268183 3.66027305 2.26276388 3.76035511 2.39560005 3.85952731 2.52934602 3.95960932 2.66127237 4.05969138 2.79501836 4.22528166 2.96151847 4.32536368 3.12801858 4.52552778 3.26085475 4.65836392 3.460109 4.82486404 5.49086449 7.61988238L154.97903812 567.50003894l13.9414278 18.63345569c11.14731929 14.90676456 20.33030115 33.60663834 27.61718332 56.06686721l1.7305094 5.48995467c4.49186382 14.77392841 8.18580083 31.14462021 11.11365534 49.07932133l1.09817291 6.78738181 0.99809086 6.98754588 0.46583639 3.49377295 0.86434488 7.18770996 0.83250058 7.32054611 0.73241854 7.45338228 0.3320904 3.79310921 0.66600047 7.68630049 0.56591843 7.85189074c0.20016407 2.62942809 0.3320904 5.29161027 0.49859051 7.9865466l0.43308228 8.11847291 0.36575435 8.31863699 0.33300024 8.41871902 0.20016407 8.55155517 0.06550824 4.35811782 0.13283615 8.81813733 0.03366396 8.95097349v4.52461793l-0.03366396 9.18389169-0.06641808 4.65836393-0.13283616 9.38314592-0.13283615 4.75844596-0.2329182 9.64972808-0.33300022 9.74890029a19.49780056 19.49780056 0 0 1-20.26388309 18.73353773 19.49780056 19.49780056 0 0 1-18.83361976-20.13104692l0.33300024-9.41680987 0.13374599-4.65836393 0.20016407-9.18298185 0.16559027-9.05105552 0.06641809-8.85089146v-17.3023646l-0.13283616-8.4178092-0.16650011-8.25221889-0.2329182-8.11938275-0.16650013-3.99236345-0.33300021-7.85280061-0.39941833-7.71996442a793.35304023 793.35304023 0 0 0-0.23291819-3.82586335l-0.49859052-7.45338227-0.53225446-7.32054613-0.66600047-7.18770995-0.66509062-6.98754589a606.25240077 606.25240077 0 0 0-0.33300024-3.49377295l-0.79883663-6.75371784-0.86434486-6.6554555-0.43308227-3.22719078-0.93167279-6.38887334c-6.65454565-43.12262042-17.63536482-75.29899545-32.80871154-96.3280512L125.46575511 593.22112256l-6.58812757-8.91730953-6.15595513-8.41871903-3.85952731-5.32345455-5.45720055-7.71996443-3.39369091-4.89128213-3.26085475-4.75844596-3.09435462-4.65836392-2.96151848-4.45819986-2.79501835-4.35902764-2.6621822-4.25894561-2.49568205-4.19252753-1.23100908-2.02984569-2.32918197-4.05969137-1.130927-1.99618173-2.16359171-3.99327329-1.06450892-1.96251777-1.99618174-3.89410111-1.92976365-3.89228141-1.83059145-3.89319125-1.76326353-3.8595273a241.90192381 241.90192381 0 0 1-0.83159074-1.9634276l-1.66409133-3.89319126a248.09154292 248.09154292 0 0 1-0.76426283-1.96251778l-1.56491914-3.9932733c-24.12341037-63.38741333-8.25221891-119.12128031 56.33344936-167.36810103a19.56512849 19.56512849 0 0 1 1.76326352-1.16459096c50.24391229-29.61427487 98.89015134-35.30439361 144.14269951-16.8037741l1.56491912 0.66600048v-0.33300025C255.96454339 212.83295402 300.08616452 154.0383964 396.1812975 134.67252215l3.36093679-0.66509063c87.24424154-14.30809201 148.03589074 19.79804667 178.8147566 98.29147879z m-37.36699344 239.24065145c47.08222976 7.85189075 82.85245977 31.942547 112.26657059 63.81958577 43.18994833 46.84931156 65.38359504 99.88824222 65.21709493 158.75012778-0.06641807 20.43038317-4.724782 39.79625743-17.96836505 56.56545772-19.43138249 24.68932879-48.34690277 33.37462997-82.08637727 32.04353888-29.38135669-1.19825495-56.00044913-9.4168099-76.69741448-29.94727512-5.62279082-5.55637274-12.54391865-10.21473667-19.29763649-14.80668251a53.07168478 53.07168478 0 0 0-46.75104918-7.51980037c-8.48513709 2.49568208-17.3023646 4.858528-24.88858305 8.71805531-25.48816543 12.91058283-52.77325833 11.9780002-80.25669566 4.32536368-36.73465692-10.31481871-63.68674961-30.44586562-70.54145933-64.65117651-2.8951004-14.37541992-2.8951004-30.31302947 1.26467303-44.08795716 24.12341037-79.72535103 80.09019553-134.66038137 171.2612923-160.28138295a149.20048173 149.20048173 0 0 1 68.47794966-2.92785452z m262.49880713 6.58721774a63.55300361 63.55300361 0 1 1 63.52024949 110.03838049 63.55300361 63.55300361 0 0 1-63.55391343-110.03747065z m-582.29549052-93.2000326a84.68214138 84.68214138 0 1 1 0 169.3651926 84.68214138 84.68214138 0 0 1 0-169.3651926z m385.27945065-68.54436776a84.68214138 84.68214138 0 1 1 161.11388355 52.37384004 84.68214138 84.68214138 0 0 1-161.11388355-52.34017608z m-254.0800881-42.32469363a84.68214138 84.68214138 0 1 1 161.07930974 52.34017607 84.68214138 84.68214138 0 0 1-161.07930974-52.34017607z"/></svg>
          <span class="topbar-placeholder-text">请先在左侧添加并配置模型</span>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer" @click="handleMessagesClick">
        <div v-if="showFiftyWarning" class="fifty-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>当前对话已达 {{ chatRoundCount }} 轮，建议点击「新对话」开启新会话以保持响应质量。</span>
          <button class="fifty-warning-close" @click.stop="fiftyWarningDismissed = true">知道了</button>
        </div>
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">
            <svg viewBox="0 0 1024 1024" fill="currentColor" width="64" height="64"><path d="M578.35790073 232.33166444l0.66509063 1.66409133 0.66509063-1.06450894c40.42859395-58.9619676 98.82464311-76.29799615 171.09479219-49.31314936l2.69584615 0.99900071C814.03745134 208.04175394 845.64790794 255.38965602 851.47086284 315.08404216c1.96342761 20.06462883 0.66509062 41.39302083-2.8286823 60.69247701l-0.86434487 4.59103602 1.66318149-0.3320904a95.66296056 95.66296056 0 0 1 38.86367482-0.20016408l2.66218218 0.5995824c40.72793022 9.31672785 75.66565964 49.57791182 87.84382394 98.49073303 13.50925537 54.13710357-2.29642783 109.47155222-48.34781262 149.06764557-61.2574856 54.83585814-94.63120575 136.65656309-99.75449622 246.56028773a19.49780056 19.49780056 0 0 1-20.43129303 18.56703764 19.49780056 19.49780056 0 0 1-18.63345568-20.33030117c5.55728259-119.65262494 42.95703014-211.29046793 112.93257103-274.01188077 34.87131134-29.94636526 46.31705708-70.14113118 36.26882054-110.46964306-8.88455542-35.7029021-33.60663834-64.25266803-58.66263133-69.9755409-14.90676456-3.46010898-29.71344707-0.56500859-43.6548749 6.65545549a80.88903216 80.88903216 0 0 0-9.58331 5.82295489l-1.66409134 1.23100906-2.16268182 1.66318149-0.39941832 0.26658216-0.23291821 0.2329182-0.36575435 0.2329182-1.56400929 0.66509063-4.65836391 1.89700952-1.06450896 0.20016407-1.29742713 0.16559028-1.59767325 0.10008204-3.19352684-0.16650011-5.85661886-1.82968161-6.38887334-4.99136416-3.72669115-6.92112781-0.79883662-5.72287287 0.2329182-2.99518242 0.33300024-1.46392728 0.16650011-0.66509061 1.86334557-4.29260956 0.49950036-0.99809087 0.2656723-0.39941831 0.40032816-0.53225448 0.16559027-0.16650012 0.20016408-0.33300023c9.48231812-14.97318263 17.73453703-53.57118513 14.44001834-87.1441595-4.49186382-45.91854862-27.38426511-80.22394153-73.20273168-97.95847857-69.11028619-26.68551052-115.79309764-4.22619149-147.73655449 72.40389506-7.41971832 17.73544687-33.44013821 15.20610083-37.26691138-3.6266091-18.96645594-93.79961497-66.41534987-130.66710808-147.93671857-117.32435279-89.5734235 16.96936435-119.45246085 69.20945839-93.9315413 166.70301039 4.72387217 18.00111919-16.2387655 31.67687469-30.97902993 20.197465-42.45752979-33.07438386-87.24424154-35.20431157-138.41982663-5.92303695l-1.63042737 0.93167279-1.46392726 1.130927c-47.8146483 36.60182077-58.3296311 73.00347746-41.72511124 118.55536188l0.79792679 2.1963458 1.3310911 3.3936909 0.69875459 1.69684547 1.43117314 3.39369091 0.76426282 1.66500116 1.53125517 3.42644503 1.63042738 3.3936909 1.73050941 3.46101882 1.79692749 3.46010898 1.92885381 3.56019104 1.99709158 3.59385497 2.16268183 3.66027305 2.26276388 3.76035511 2.39560005 3.85952731 2.52934602 3.95960932 2.66127237 4.05969138 2.79501836 4.22528166 2.96151847 4.32536368 3.12801858 4.52552778 3.26085475 4.65836392 3.460109 4.82486404 5.49086449 7.61988238L154.97903812 567.50003894l13.9414278 18.63345569c11.14731929 14.90676456 20.33030115 33.60663834 27.61718332 56.06686721l1.7305094 5.48995467c4.49186382 14.77392841 8.18580083 31.14462021 11.11365534 49.07932133l1.09817291 6.78738181 0.99809086 6.98754588 0.46583639 3.49377295 0.86434488 7.18770996 0.83250058 7.32054611 0.73241854 7.45338228 0.3320904 3.79310921 0.66600047 7.68630049 0.56591843 7.85189074c0.20016407 2.62942809 0.3320904 5.29161027 0.49859051 7.9865466l0.43308228 8.11847291 0.36575435 8.31863699 0.33300024 8.41871902 0.20016407 8.55155517 0.06550824 4.35811782 0.13283615 8.81813733 0.03366396 8.95097349v4.52461793l-0.03366396 9.18389169-0.06641808 4.65836393-0.13283616 9.38314592-0.13283615 4.75844596-0.2329182 9.64972808-0.33300022 9.74890029a19.49780056 19.49780056 0 0 1-20.26388309 18.73353773 19.49780056 19.49780056 0 0 1-18.83361976-20.13104692l0.33300024-9.41680987 0.13374599-4.65836393 0.20016407-9.18298185 0.16559027-9.05105552 0.06641809-8.85089146v-17.3023646l-0.13283616-8.4178092-0.16650011-8.25221889-0.2329182-8.11938275-0.16650013-3.99236345-0.33300021-7.85280061-0.39941833-7.71996442a793.35304023 793.35304023 0 0 0-0.23291819-3.82586335l-0.49859052-7.45338227-0.53225446-7.32054613-0.66600047-7.18770995-0.66509062-6.98754589a606.25240077 606.25240077 0 0 0-0.33300024-3.49377295l-0.79883663-6.75371784-0.86434486-6.6554555-0.43308227-3.22719078-0.93167279-6.38887334c-6.65454565-43.12262042-17.63536482-75.29899545-32.80871154-96.3280512L125.46575511 593.22112256l-6.58812757-8.91730953-6.15595513-8.41871903-3.85952731-5.32345455-5.45720055-7.71996443-3.39369091-4.89128213-3.26085475-4.75844596-3.09435462-4.65836392-2.96151848-4.45819986-2.79501835-4.35902764-2.6621822-4.25894561-2.49568205-4.19252753-1.23100908-2.02984569-2.32918197-4.05969137-1.130927-1.99618173-2.16359171-3.99327329-1.06450892-1.96251777-1.99618174-3.89410111-1.92976365-3.89228141-1.83059145-3.89319125-1.76326353-3.8595273a241.90192381 241.90192381 0 0 1-0.83159074-1.9634276l-1.66409133-3.89319126a248.09154292 248.09154292 0 0 1-0.76426283-1.96251778l-1.56491914-3.9932733c-24.12341037-63.38741333-8.25221891-119.12128031 56.33344936-167.36810103a19.56512849 19.56512849 0 0 1 1.76326352-1.16459096c50.24391229-29.61427487 98.89015134-35.30439361 144.14269951-16.8037741l1.56491912 0.66600048v-0.33300025C255.96454339 212.83295402 300.08616452 154.0383964 396.1812975 134.67252215l3.36093679-0.66509063c87.24424154-14.30809201 148.03589074 19.79804667 178.8147566 98.29147879z m-37.36699344 239.24065145c47.08222976 7.85189075 82.85245977 31.942547 112.26657059 63.81958577 43.18994833 46.84931156 65.38359504 99.88824222 65.21709493 158.75012778-0.06641807 20.43038317-4.724782 39.79625743-17.96836505 56.56545772-19.43138249 24.68932879-48.34690277 33.37462997-82.08637727 32.04353888-29.38135669-1.19825495-56.00044913-9.4168099-76.69741448-29.94727512-5.62279082-5.55637274-12.54391865-10.21473667-19.29763649-14.80668251a53.07168478 53.07168478 0 0 0-46.75104918-7.51980037c-8.48513709 2.49568208-17.3023646 4.858528-24.88858305 8.71805531-25.48816543 12.91058283-52.77325833 11.9780002-80.25669566 4.32536368-36.73465692-10.31481871-63.68674961-30.44586562-70.54145933-64.65117651-2.8951004-14.37541992-2.8951004-30.31302947 1.26467303-44.08795716 24.12341037-79.72535103 80.09019553-134.66038137 171.2612923-160.28138295a149.20048173 149.20048173 0 0 1 68.47794966-2.92785452z m262.49880713 6.58721774a63.55300361 63.55300361 0 1 1 63.52024949 110.03838049 63.55300361 63.55300361 0 0 1-63.55391343-110.03747065z m-582.29549052-93.2000326a84.68214138 84.68214138 0 1 1 0 169.3651926 84.68214138 84.68214138 0 0 1 0-169.3651926z m385.27945065-68.54436776a84.68214138 84.68214138 0 1 1 161.11388355 52.37384004 84.68214138 84.68214138 0 0 1-161.11388355-52.34017608z m-254.0800881-42.32469363a84.68214138 84.68214138 0 1 1 161.07930974 52.34017607 84.68214138 84.68214138 0 0 1-161.07930974-52.34017607z"/>
            </svg>
          </div>
          <h3>欢迎使用狸猫 AI体验</h3>
          <p class="welcome-desc">体验多种 AI 大模型，支持多轮对话、代码生成与调试</p>
          <div class="welcome-tips">
            <span class="tip" @click="setQuickInput('帮我写一个Vue组件')">帮我写一个Vue组件</span>
            <span class="tip" @click="setQuickInput('这段代码有什么bug')">这段代码有什么bug</span>
            <span class="tip" @click="setQuickInput('如何优化这个函数')">如何优化这个函数</span>
          </div>
        </div>

        <div v-for="(msg, index) in messages" :key="msg.id || msg.time" :class="['message', msg.role]">
          <div class="message-avatar">
            <template v-if="msg.role === 'user'">
              <img v-if="userAvatar && !avatarErrors.has(index)" class="avatar-img" :src="getUserAvatarUrl(userAvatar)" @error="setAvatarError(index)" />
              <div v-else class="avatar-placeholder user-avatar-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </template>
            <template v-else>
              <svg viewBox="0 0 1024 1024" fill="currentColor" width="20" height="20">
                <path d="M578.35790073 232.33166444l0.66509063 1.66409133 0.66509063-1.06450894c40.42859395-58.9619676 98.82464311-76.29799615 171.09479219-49.31314936l2.69584615 0.99900071C814.03745134 208.04175394 845.64790794 255.38965602 851.47086284 315.08404216c1.96342761 20.06462883 0.66509062 41.39302083-2.8286823 60.69247701l-0.86434487 4.59103602 1.66318149-0.3320904a95.66296056 95.66296056 0 0 1 38.86367482-0.20016408l2.66218218 0.5995824c40.72793022 9.31672785 75.66565964 49.57791182 87.84382394 98.49073303 13.50925537 54.13710357-2.29642783 109.47155222-48.34781262 149.06764557-61.2574856 54.83585814-94.63120575 136.65656309-99.75449622 246.56028773a19.49780056 19.49780056 0 0 1-20.43129303 18.56703764 19.49780056 19.49780056 0 0 1-18.63345568-20.33030117c5.55728259-119.65262494 42.95703014-211.29046793 112.93257103-274.01188077 34.87131134-29.94636526 46.31705708-70.14113118 36.26882054-110.46964306-8.88455542-35.7029021-33.60663834-64.25266803-58.66263133-69.9755409-14.90676456-3.46010898-29.71344707-0.56500859-43.6548749 6.65545549a80.88903216 80.88903216 0 0 0-9.58331 5.82295489l-1.66409134 1.23100906-2.16268182 1.66318149-0.39941832 0.26658216-0.23291821 0.2329182-0.36575435 0.2329182-1.56400929 0.66509063-4.65836391 1.89700952-1.06450896 0.20016407-1.29742713 0.16559028-1.59767325 0.10008204-3.19352684-0.16650011-5.85661886-1.82968161-6.38887334-4.99136416-3.72669115-6.92112781-0.79883662-5.72287287 0.2329182-2.99518242 0.33300024-1.46392728 0.16650011-0.66509061 1.86334557-4.29260956 0.49950036-0.99809087 0.2656723-0.39941831 0.40032816-0.53225448 0.16559027-0.16650012 0.20016408-0.33300023c9.48231812-14.97318263 17.73453703-53.57118513 14.44001834-87.1441595-4.49186382-45.91854862-27.38426511-80.22394153-73.20273168-97.95847857-69.11028619-26.68551052-115.79309764-4.22619149-147.73655449 72.40389506-7.41971832 17.73544687-33.44013821 15.20610083-37.26691138-3.6266091-18.96645594-93.79961497-66.41534987-130.66710808-147.93671857-117.32435279-89.5734235 16.96936435-119.45246085 69.20945839-93.9315413 166.70301039 4.72387217 18.00111919-16.2387655 31.67687469-30.97902993 20.197465-42.45752979-33.07438386-87.24424154-35.20431157-138.41982663-5.92303695l-1.63042737 0.93167279-1.46392726 1.130927c-47.8146483 36.60182077-58.3296311 73.00347746-41.72511124 118.55536188l0.79792679 2.1963458 1.3310911 3.3936909 0.69875459 1.69684547 1.43117314 3.39369091 0.76426282 1.66500116 1.53125517 3.42644503 1.63042738 3.3936909 1.73050941 3.46101882 1.79692749 3.46010898 1.92885381 3.56019104 1.99709158 3.59385497 2.16268183 3.66027305 2.26276388 3.76035511 2.39560005 3.85952731 2.52934602 3.95960932 2.66127237 4.05969138 2.79501836 4.22528166 2.96151847 4.32536368 3.12801858 4.52552778 3.26085475 4.65836392 3.460109 4.82486404 5.49086449 7.61988238L154.97903812 567.50003894l13.9414278 18.63345569c11.14731929 14.90676456 20.33030115 33.60663834 27.61718332 56.06686721l1.7305094 5.48995467c4.49186382 14.77392841 8.18580083 31.14462021 11.11365534 49.07932133l1.09817291 6.78738181 0.99809086 6.98754588 0.46583639 3.49377295 0.86434488 7.18770996 0.83250058 7.32054611 0.73241854 7.45338228 0.3320904 3.79310921 0.66600047 7.68630049 0.56591843 7.85189074c0.20016407 2.62942809 0.3320904 5.29161027 0.49859051 7.9865466l0.43308228 8.11847291 0.36575435 8.31863699 0.33300024 8.41871902 0.20016407 8.55155517 0.06550824 4.35811782 0.13283615 8.81813733 0.03366396 8.95097349v4.52461793l-0.03366396 9.18389169-0.06641808 4.65836393-0.13283616 9.38314592-0.13283615 4.75844596-0.2329182 9.64972808-0.33300022 9.74890029a19.49780056 19.49780056 0 0 1-20.26388309 18.73353773 19.49780056 19.49780056 0 0 1-18.83361976-20.13104692l0.33300024-9.41680987 0.13374599-4.65836393 0.20016407-9.18298185 0.16559027-9.05105552 0.06641809-8.85089146v-17.3023646l-0.13283616-8.4178092-0.16650011-8.25221889-0.2329182-8.11938275-0.16650013-3.99236345-0.33300021-7.85280061-0.39941833-7.71996442a793.35304023 793.35304023 0 0 0-0.23291819-3.82586335l-0.49859052-7.45338227-0.53225446-7.32054613-0.66600047-7.18770995-0.66509062-6.98754589a606.25240077 606.25240077 0 0 0-0.33300024-3.49377295l-0.79883663-6.75371784-0.86434486-6.6554555-0.43308227-3.22719078-0.93167279-6.38887334c-6.65454565-43.12262042-17.63536482-75.29899545-32.80871154-96.3280512L125.46575511 593.22112256l-6.58812757-8.91730953-6.15595513-8.41871903-3.85952731-5.32345455-5.45720055-7.71996443-3.39369091-4.89128213-3.26085475-4.75844596-3.09435462-4.65836392-2.96151848-4.45819986-2.79501835-4.35902764-2.6621822-4.25894561-2.49568205-4.19252753-1.23100908-2.02984569-2.32918197-4.05969137-1.130927-1.99618173-2.16359171-3.99327329-1.06450892-1.96251777-1.99618174-3.89410111-1.92976365-3.89228141-1.83059145-3.89319125-1.76326353-3.8595273a241.90192381 241.90192381 0 0 1-0.83159074-1.9634276l-1.66409133-3.89319126a248.09154292 248.09154292 0 0 1-0.76426283-1.96251778l-1.56491914-3.9932733c-24.12341037-63.38741333-8.25221891-119.12128031 56.33344936-167.36810103a19.56512849 19.56512849 0 0 1 1.76326352-1.16459096c50.24391229-29.61427487 98.89015134-35.30439361 144.14269951-16.8037741l1.56491912 0.66600048v-0.33300025C255.96454339 212.83295402 300.08616452 154.0383964 396.1812975 134.67252215l3.36093679-0.66509063c87.24424154-14.30809201 148.03589074 19.79804667 178.8147566 98.29147879z m-37.36699344 239.24065145c47.08222976 7.85189075 82.85245977 31.942547 112.26657059 63.81958577 43.18994833 46.84931156 65.38359504 99.88824222 65.21709493 158.75012778-0.06641807 20.43038317-4.724782 39.79625743-17.96836505 56.56545772-19.43138249 24.68932879-48.34690277 33.37462997-82.08637727 32.04353888-29.38135669-1.19825495-56.00044913-9.4168099-76.69741448-29.94727512-5.62279082-5.55637274-12.54391865-10.21473667-19.29763649-14.80668251a53.07168478 53.07168478 0 0 0-46.75104918-7.51980037c-8.48513709 2.49568208-17.3023646 4.858528-24.88858305 8.71805531-25.48816543 12.91058283-52.77325833 11.9780002-80.25669566 4.32536368-36.73465692-10.31481871-63.68674961-30.44586562-70.54145933-64.65117651-2.8951004-14.37541992-2.8951004-30.31302947 1.26467303-44.08795716 24.12341037-79.72535103 80.09019553-134.66038137 171.2612923-160.28138295a149.20048173 149.20048173 0 0 1 68.47794966-2.92785452z m262.49880713 6.58721774a63.55300361 63.55300361 0 1 1 63.52024949 110.03838049 63.55300361 63.55300361 0 0 1-63.55391343-110.03747065z m-582.29549052-93.2000326a84.68214138 84.68214138 0 1 1 0 169.3651926 84.68214138 84.68214138 0 0 1 0-169.3651926z m385.27945065-68.54436776a84.68214138 84.68214138 0 1 1 161.11388355 52.37384004 84.68214138 84.68214138 0 0 1-161.11388355-52.34017608z m-254.0800881-42.32469363a84.68214138 84.68214138 0 1 1 161.07930974 52.34017607 84.68214138 84.68214138 0 0 1-161.07930974-52.34017607z"/>
              </svg>
            </template>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender-name">{{ msg.role === 'user' ? getUserDisplayName() : (msg.modelName || getModelName()) }}<span v-if="msg.isCustom" class="sender-tag">自定义</span></span>
              <span class="message-time">{{ formatTime(msg.time) }}</span>
            </div>
            <div v-if="msg.role === 'user'" class="message-body user-body">
              <div v-if="msg.images && msg.images.length > 0" class="user-images">
                <img v-for="(img, idx) in msg.images" :key="idx" :src="img" class="user-sent-image" @click="previewImage(img)" />
              </div>
              <span v-if="msg.content">{{ msg.content }}</span>
            </div>
            <div v-else class="message-body markdown-body" :class="{ streaming: msg.streaming }">
              <div v-if="msg.reasoningContent" class="reasoning-section" :class="{ done: msg.reasoningDone, thinking: !msg.reasoningDone && msg.streaming }">
                <div class="reasoning-header" @click="msg._reasoningExpanded = !msg._reasoningExpanded">
                  <template v-if="!msg.reasoningDone && msg.streaming">
                    <span class="thinking-pulse"></span>
                    <span>思考过程</span>
                    <span class="thinking-dots"><i>.</i><i>.</i><i>.</i></span>
                  </template>
                  <template v-else>
                    <svg class="reasoning-arrow" :class="{ expanded: msg._reasoningExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                    <svg class="reasoning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>思考过程</span>
                    <span v-if="msg.reasoningDone" class="reasoning-badge done">已完成</span>
                  </template>
                </div>
                <div v-if="msg._reasoningExpanded" class="reasoning-body">
                  <div v-html="renderMarkdown(msg.reasoningContent, msg.streaming && !msg.reasoningDone)"></div>
                </div>
              </div>
              <div v-html="renderMarkdown(msg.content, msg.streaming)"></div>
              <span v-if="msg.streaming" class="streaming-cursor"></span>
              <div v-if="msg.thinking && msg.streaming && !msg.content && !msg.reasoningContent" class="waiting-tip">
                <div class="waiting-spinner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"/></svg>
                </div>
                <div class="waiting-text">{{ getWaitingTip() }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-commands" v-if="messages.length === 0">
        <button class="quick-cmd-btn" @click="setMode('deploy')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>部署指南</span>
        </button>
        <button class="quick-cmd-btn" @click="setMode('brand')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span>换品牌</span>
        </button>
        <button class="quick-cmd-btn" @click="setMode('api')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          <span>配置API</span>
        </button>
        <button class="quick-cmd-btn" @click="setMode('customize')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span>二次开发</span>
        </button>
        <button class="quick-cmd-btn" @click="setMode('image')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>生成图片</span>
        </button>
        <button class="quick-cmd-btn" @click="setMode('video')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <span>生成视频</span>
        </button>
      </div>

      <div class="chat-input-container" :class="{ 'drag-over': isDragging }" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
        <div class="drag-overlay" v-if="isDragging">
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span>拖放文件夹到此处</span>
        </div>
        <div class="pending-images" v-if="pendingImages.length > 0">
          <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-image-item">
            <img :src="img.dataUrl" :alt="img.name" />
            <button class="pending-image-remove" @click="removePendingImage(idx)" title="移除">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="attached-files" v-if="attachedFolder">
          <div class="attached-folder-chip" :class="{ uploading: uploadStatus }">
            <svg v-if="uploadStatus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="chip-icon spinning"><path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="#dcb67a" width="14" height="14" class="chip-icon"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span class="chip-name">{{ attachedFolder.name }}</span>
            <span class="chip-size" v-if="uploadStatus">{{ uploadStatus }}</span>
            <span class="chip-size" v-else>{{ attachedFolder.fileCount }} 个文件</span>
            <div v-if="uploadStatus" class="chip-progress-bar">
              <div class="chip-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <button v-if="!uploadStatus" class="chip-remove" @click="clearAttachedFolder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="input-wrapper">
          <div class="mode-selector" @click.stop="showModeMenu = !showModeMenu">
            <button class="mode-btn" :class="aiMode" title="选择模式">
              <svg v-if="aiMode === 'qa'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <svg v-else-if="aiMode === 'agent'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              <span>{{ aiMode === 'qa' ? '问答' : aiMode === 'agent' ? '智能体' : '编辑器' }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" class="arrow">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div v-if="showModeMenu" class="mode-menu">
              <div class="mode-option" :class="{ active: aiMode === 'qa' }" @click="switchToQaMode">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>智能问答</span>
                <span v-if="qaApplyStatus !== 'approved'" class="mode-apply-hint">需申请</span>
              </div>
              <div class="mode-option agent" :class="{ active: aiMode === 'agent' }" @click="switchToAgentMode">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>智能体</span>
                <span v-if="agentHasAccess" class="agent-quota-badge">剩{{ agentRemainingQuota }}次</span>
                <span v-else class="mode-apply-hint">需申请</span>
              </div>
            </div>
          </div>
          <textarea
            v-model="inputMessage"
            :placeholder="aiMode === 'agent' ? '输入您的需求...' : '输入您的问题...'"
            @keydown="handleKeyDown"
            @paste="handleImagePaste"
            :disabled="isLoading"
            rows="1"
          ></textarea>
          <label v-if="isVisionModel && !isLoading" class="image-upload-btn" title="上传图片识别">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" multiple @change="handleImageUpload" style="display:none" />
          </label>
          <button
            v-if="isLoading"
            class="stop-btn"
            @click="stopGeneration"
            title="停止生成"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
          <button
            v-else
            class="send-btn"
            @click="sendMessage"
            :disabled="!inputMessage.trim() && !attachedFolder && pendingImages.length === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div class="input-hint">
          <span>当前模型：{{ getModelName() }}{{ modelPresetConfigs[selectedModel]?.isFree ? ' · NVIDIA 免费' : ' · 自定义接入' }}</span>
          <span>支持拖拽上传文件夹 · Markdown 渲染 · 流式输出</span>
        </div>
      </div>
        </div>
      </div>
    </main>
  </div>

      <div v-if="imagePreviewUrl" class="image-preview-overlay" :class="{ 'dark-mode': darkMode }" @click="closeImagePreview">
        <button class="image-preview-close" @click.stop="closeImagePreview" title="关闭 (ESC)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="image-preview-toolbar">
          <button class="image-preview-tool-btn" @click.stop="zoomIn" title="放大">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button class="image-preview-tool-btn" @click.stop="zoomOut" title="缩小">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button class="image-preview-tool-btn" @click.stop="resetZoom" title="重置">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
          <span class="image-preview-zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <button class="image-preview-tool-btn" @click.stop="downloadImage" title="下载">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
        <div class="image-preview-content" @click.stop @wheel="handleWheelZoom">
          <img :src="imagePreviewUrl" :style="{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease' }" @dblclick.prevent="handleDblClickZoom" @click.stop />
        </div>
      </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, reactive, computed, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import JSZip from 'jszip'
import FileTreeNode from './FileTreeNode.vue'
import MonacoEditor from './MonacoEditor.vue'

let _msgId = 0
function msgId() { return 'msg_' + Date.now() + '_' + (++_msgId) }
import { saveFilesBatch, saveFile as idbSaveFile, getFile, getFilesByFolder, getAllFiles, deleteFile as idbDeleteFile, deleteFilesByFolder, clearAllFiles } from '../utils/workspaceDB.js'
import { saveMemory, searchMemories, getRecentMemories, deleteMemory, clearAllMemories, getMemoryCount, autoExtractMemoriesFromConversation } from '../utils/memoryDB.js'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const props = defineProps({
  isLoggedIn: { type: Boolean, default: false },
  token: { type: String, default: '' },
  userId: { type: [Number, String], default: null },
  userEmail: { type: String, default: '' }
})
const emit = defineEmits(['openAuth'])

marked.use({
  breaks: true,
  gfm: true,
  renderer: {
    code({ text, lang }) {
      const language = lang || 'text'
      const escapedCode = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const firstLine = text.split('\n')[0]
      const filenameMatch = firstLine.match(/(?:\/\/|#|\/\*|--|<!--)\s*(?:filename|filepath|file):\s*(.+?)(?:\s*\*\/|-->\s*)?\s*$/i)
      const fileName = filenameMatch ? filenameMatch[1].trim() : ''
      const filePathAttr = fileName ? ` data-filepath="${fileName.replace(/"/g, '&quot;')}"` : ''
      return `<div class="md-code-block"${filePathAttr}><div class="md-code-header"><span class="md-code-lang">${language}</span>${fileName ? `<span class="md-code-filename">${fileName}</span>` : ''}</div><pre><code>${escapedCode}</code></pre></div>`
    }
  }
})

const selectedModel = ref(localStorage.getItem('limao_selected_model') || 'nvidia_glm5')
const inputMessage = ref('')
const aiMode = ref('editor')
const showModeMenu = ref(false)
const showAgentModal = ref(false)
const agentTab = ref('apply')
const agentReason = ref('')
const agentCode = ref('')
const agentApplying = ref(false)
const agentRedeeming = ref(false)
const agentApplyError = ref('')
const agentApplySuccess = ref('')
const agentRedeemError = ref('')
const agentHasAccess = ref(false)
const agentRemainingQuota = ref(0)
const agentQuotaMonthly = ref(0)
const agentQuotaTotal = ref(0)
const agentApplyStatus = ref(localStorage.getItem('limao_agent_apply_status') || '')
const qaApplyStatus = ref(localStorage.getItem('limao_qa_apply_status') || '')
const qaApplyLoading = ref(false)
const qaApplyError = ref('')
const qaApplySuccess = ref('')
const customApiAccess = ref(false)
const customApiStatus = ref(localStorage.getItem('limao_custom_api_apply_status') || '')
const customApiApplying = ref(false)
const customApiApplyError = ref('')
const customApiApplySuccess = ref('')
const showQaApplyForm = ref(false)
const showApplyChoiceModal = ref(false)
const applyChoiceStep = ref('')
const messages = ref([])
const isLoading = ref(false)
const messagesContainer = ref(null)
const runtimeErrors = ref([])
const MAX_RUNTIME_ERRORS = 20

function captureRuntimeError(error, source) {
  const entry = {
    time: new Date().toLocaleTimeString(),
    message: error?.message || String(error),
    stack: error?.stack?.split('\n').slice(0, 5).join('\n') || '',
    source: source || 'unknown',
    filename: error?.filename || '',
    lineno: error?.lineno || '',
    colno: error?.colno || ''
  }
  runtimeErrors.value.unshift(entry)
  if (runtimeErrors.value.length > MAX_RUNTIME_ERRORS) {
    runtimeErrors.value = runtimeErrors.value.slice(0, MAX_RUNTIME_ERRORS)
  }
}

const sidebarCollapsed = ref(false)
const showKeyModal = ref(false)
const configModel = ref('qwen')
const tempApiKey = ref('')
const tempApiBase = ref('')
const showKeyValue = ref(false)
const showDeleteKeyConfirm = ref(false)
const abortController = ref(null)
const showClearConfirm = ref(false)
const showModelDropdown = ref(false)
const showCustomPanel = ref(false)
const historyCollapsed = ref(false)

let streamingRenderTimer = null
let scrollRafId = null
let loadingSafetyTimer = null
let pendingStreamingContent = ''
const currentModelInfo = computed(() => {
  const opt = presetModelOptions.find(o => o.id === selectedModel.value)
  if (opt) return opt
  return { viewBox: '0 0 24 24', svgContent: '' }
})

const isVisionModel = computed(() => {
  return !!modelPresetConfigs[selectedModel.value]?.isVision
})

const pendingImages = ref([])

function handleImageUpload(e) {
  const files = Array.from(e.target.files || [])
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 10 * 1024 * 1024) continue
    const reader = new FileReader()
    reader.onload = (ev) => {
      pendingImages.value.push({ name: file.name, dataUrl: ev.target.result })
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

function removePendingImage(index) {
  pendingImages.value.splice(index, 1)
}

const imagePreviewUrl = ref('')
const zoomLevel = ref(1)

function handlePreviewEsc(e) {
  if (e.key === 'Escape') {
    closeImagePreview()
  }
}

function closeImagePreview() {
  imagePreviewUrl.value = ''
  zoomLevel.value = 1
  document.removeEventListener('keydown', handlePreviewEsc)
}

function previewImage(url) {
  imagePreviewUrl.value = url
  zoomLevel.value = 1
  document.addEventListener('keydown', handlePreviewEsc)
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 5)
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.25)
}

function resetZoom() {
  zoomLevel.value = 1
}

function downloadImage() {
  if (!imagePreviewUrl.value) return
  const a = document.createElement('a')
  a.href = imagePreviewUrl.value
  a.download = `天窗_AI生成_${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function handleWheelZoom(e) {
  const delta = e.deltaY > 0 ? -0.15 : 0.15
  zoomLevel.value = Math.min(Math.max(zoomLevel.value + delta, 0.25), 5)
}

function handleDblClickZoom() {
  if (zoomLevel.value > 1) {
    zoomLevel.value = 1
  } else {
    zoomLevel.value = 2
  }
}

function handleImagePaste(e) {
  if (!isVisionModel.value) return
  const items = Array.from(e.clipboardData?.items || [])
  for (const item of items) {
    if (!item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (!file || file.size > 10 * 1024 * 1024) continue
    const reader = new FileReader()
    reader.onload = (ev) => {
      pendingImages.value.push({ name: file.name || 'pasted-image.png', dataUrl: ev.target.result })
    }
    reader.readAsDataURL(file)
  }
}

const modelsNotAdded = computed(() => {
  const configuredIds = new Set(userConfiguredModels.value.map(m => m.id))
  return presetModelOptions.filter(opt => !configuredIds.has(opt.id) && !modelPresetConfigs[opt.id]?.isFree)
})

function handleClickOutside(e) {
  if (showModelDropdown.value && !e.target.closest('.topbar-model-info')) {
    showModelDropdown.value = false
  }
  if (showModeMenu.value && !e.target.closest('.mode-selector')) {
    showModeMenu.value = false
  }
  if (activeMenuSessionId.value && !e.target.closest('.chat-history-card')) {
    activeMenuSessionId.value = null
  }
}

// ===== 对话会话管理 =====
const chatSessions = ref([])
const currentSessionId = ref(null)
const showDeleteSessionConfirm = ref(false)
const pendingDeleteSessionId = ref(null)
const showClearAllSessionsConfirm = ref(false)
const activeMenuSessionId = ref(null)
const renamingSessionId = ref(null)
const currentSessionTitle = computed(() => {
  const sid = currentSessionId.value
  if (!sid) return ''
  const s = chatSessions.value.find(s => s.id === sid)
  return s?.title || ''
})
const currentConversationTitle = currentSessionTitle
const chatSessionTitle = currentSessionTitle
const showExplorerDeleteConfirm = ref(false)
const explorerDeleteType = ref('')
const explorerDeleteTarget = ref(null)
const renamingTitle = ref('')

const showEditor = ref(true)
const showPreview = ref(false)
const previewUrl = ref('')
const editorContent = ref('')
const originalContent = ref('')
const currentFileName = ref('')
const currentFilePath = ref('')
const currentFileType = ref('')
const folderInput = ref(null)
const isModified = ref(false)
const editorApplyNotice = ref('')
const showApplyModal = ref(false)
const applyTarget = ref(null)
const pendingChanges = ref([])

const tabsContainerRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const dragStartX = ref(0)
const dragScrollLeft = ref(0)

const editorTextarea = ref(null)
const monacoRef = ref(null)
const lineNumbers = ref(null)
const cursorLine = ref(1)
const cursorPos = reactive({ line: 1, col: 1 })
const fontSize = ref(14)
const showLineNumbers = ref(true)
const wordWrap = ref(false)

// Editor tabs
const editorTabs = ref([])
const activeTab = ref('')

// Quick AI input
const showQuickInput = ref(false)
const quickInputValue = ref('')
const quickInputRef = ref(null)
const isGenerating = ref(false)

// Syntax highlighting cache
let highlightedCache = ''
let highlightTimeout = null

const workspaceFolders = ref([])
const expandedFolders = ref(new Set())
const selectedFilePath = ref('')
const fileTreeContent = ref({})
const savedWorkspaces = ref([])
const textExtensions = /\.(js|ts|jsx|tsx|vue|html|htm|css|scss|less|sass|styl|wxml|wxss|wxs|py|java|cpp|c|h|cs|php|rb|go|rs|swift|kt|dart|sql|json|xml|yaml|yml|md|txt|sh|bat|env|gitignore|dockerfile|ini|cfg|conf|properties|gradle|pom|toml|eslintrc|prettierrc|babelrc|editorconfig|lock|map)$/i

const selectedFiles = ref(new Set())
const showFileCheckboxes = ref(false)
const fileClipboard = ref([])
const fileClipboardMode = ref('copy')
const deletedFiles = ref([])
const deleteUndoTimers = ref({})
const namedWorkspaces = ref([])
const activeWorkspaceId = ref('')
const userPreferences = ref({})

function loadUserPreferences() {
  try {
    const stored = localStorage.getItem('limao_user_prefs')
    if (stored) userPreferences.value = JSON.parse(stored)
  } catch {}
}
loadUserPreferences()

function saveUserPreferences() {
  try {
    localStorage.setItem('limao_user_prefs', JSON.stringify(userPreferences.value))
  } catch {}
}

const retrievedMemories = ref([])
const showMemoryPanel = ref(false)
const memoryCount = ref(0)

async function refreshMemoryCount() {
  try { memoryCount.value = await getMemoryCount() } catch { memoryCount.value = 0 }
}
refreshMemoryCount()

function detectProjectType() {
  const allFiles = []
  for (const folder of workspaceFolders.value) {
    collectAllFiles([folder]).forEach(f => allFiles.push(f))
  }
  const fileNames = allFiles.map(f => (f.name || (f.path ? f.path.split('/').pop() : '')).toLowerCase())
  const filePaths = allFiles.map(f => (f.path || '').toLowerCase())

  if (fileNames.includes('project.config.json') || fileNames.includes('project.private.config.json')
    || (fileNames.includes('app.json') && fileNames.some(n => n.endsWith('.wxml')))) {
    return 'miniapp'
  }
  if (fileNames.includes('manifest.json') && fileNames.includes('pages.json')) {
    return 'uniapp'
  }
  if (fileNames.includes('pubspec.yaml') || fileNames.some(n => n.endsWith('.dart'))) {
    return 'flutter'
  }
  if (fileNames.includes('androidmanifest.xml') || filePaths.some(p => p.includes('/android/'))) {
    if (filePaths.some(p => p.includes('/src/main/java/') || p.includes('/src/main/kotlin/'))) {
      return 'android'
    }
  }
  if (fileNames.some(n => n.endsWith('.storyboard') || n.endsWith('.xib') || n.endsWith('.xcworkspace'))
    || filePaths.some(p => p.includes('/ios/') && p.includes('.swift'))) {
    return 'ios'
  }
  if (fileNames.some(n => n.endsWith('.tsx') || n.endsWith('.jsx'))
    && (filePaths.some(p => p.includes('/android/')) || filePaths.some(p => p.includes('/ios/')))) {
    return 'react-native'
  }
  if (fileNames.some(n => n.endsWith('.vue'))) return 'web-vue'
  if (fileNames.some(n => n.endsWith('.jsx') || n.endsWith('.tsx'))) return 'web-react'
  if (fileNames.some(n => n.endsWith('.svelte'))) return 'web-svelte'
  if (fileNames.some(n => n.endsWith('.html'))) return 'web-static'
  if (fileNames.some(n => n.endsWith('.py'))) return 'backend-python'
  if (fileNames.some(n => n.endsWith('.java'))) return 'backend-java'
  if (fileNames.some(n => n.endsWith('.go'))) return 'backend-go'

  return 'unknown'
}

function inferFileNameFromCode(code, ext, index, total) {
  const firstLines = (code || '').slice(0, 500).toLowerCase()
  
  if (ext === 'html' || ext === 'htm') {
    if (firstLines.includes('<html') || firstLines.includes('<!doctype')) return 'index.html'
    return `page${total > 1 ? index + 1 : ''}.${ext}`
  }
  if (ext === 'css' || ext === 'scss' || ext === 'less') {
    if (firstLines.includes(':root') || firstLines.includes('@import')) return `styles.${ext}`
    if (firstLines.includes('@media')) return `responsive.${ext}`
    return `main${total > 1 ? index + 1 : ''}.${ext}`
  }
  if (ext === 'vue') {
    if (firstLines.includes('createapp') || firstLines.includes('use(router)') || firstLines.includes('<router-view')) return 'App.vue'
    if (firstLines.includes('definecomponent') || firstLines.includes('props:')) {
      const nameMatch = code.match(/name\s*:\s*['"](\w+)['"]/)
      if (nameMatch) return `${nameMatch[1]}.${ext}`
    }
    return `Component${total > 1 ? index + 1 : ''}.${ext}`
  }
  if (ext === 'jsx' || ext === 'tsx') {
    if (firstLines.includes('createroot') || firstLines.includes('use(router)') || firstLines.includes('<routes')) return 'App.tsx'
    if (firstLines.includes('usestate') || firstLines.includes('useeffect')) {
      const funcMatch = code.match(/function\s+(\w+)/)
      if (funcMatch) return `${funcMatch[1]}.${ext}`
    }
    return `Component${total > 1 ? index + 1 : ''}.${ext}`
  }
  if (ext === 'js' || ext === 'ts') {
    if (firstLines.includes('express') || firstLines.includes('app.listen') || firstLines.includes('app.use')) return `server.${ext}`
    if (firstLines.includes('export default') && firstLines.includes('router')) return `router.${ext}`
    if (firstLines.includes('export default') && firstLines.includes('store')) return `store.${ext}`
    if (firstLines.includes('export default') && firstLines.includes('createapp')) return `main.${ext}`
    if (firstLines.includes('module.exports') || firstLines.includes('require(')) return `module${total > 1 ? index + 1 : ''}.${ext}`
    if (firstLines.includes('export function') || firstLines.includes('export const')) return `utils.${ext}`
    return `script${total > 1 ? index + 1 : ''}.${ext}`
  }
  if (ext === 'py') {
    if (firstLines.includes('flask') || firstLines.includes('app = flask') || firstLines.includes('fastapi')) return 'app.py'
    if (firstLines.includes('def ') && firstLines.includes('class ')) return 'models.py'
    if (firstLines.includes('def ') && firstLines.includes('route')) return 'routes.py'
    return `main${total > 1 ? index + 1 : ''}.py`
  }
  if (ext === 'json') {
    if (firstLines.includes('"dependencies"') || firstLines.includes('"devdependencies"')) return 'package.json'
    if (firstLines.includes('"scripts"')) return 'package.json'
    if (firstLines.includes('"compileroptions"')) return 'tsconfig.json'
    return `config${total > 1 ? index + 1 : ''}.json`
  }
  if (ext === 'sql') return 'schema.sql'
  if (ext === 'md') return 'README.md'
  if (ext === 'yaml' || ext === 'yml') return 'config.yml'
  
  return `file${total > 1 ? index + 1 : ''}.${ext}`
}

function classifyFileType(filePath) {
  const fullPath = (filePath || '').toLowerCase()
  const ext = fullPath.split('.').pop()
  const fileName = fullPath.split('/').pop()
  const projectType = detectProjectType()

  if (ext === 'java') {
    if (projectType === 'android') return 'frontend'
    if (fullPath.includes('/android/') || fullPath.includes('/app/src/')) return 'frontend'
    return 'backend'
  }

  if (ext === 'kt') {
    if (projectType === 'android') return 'frontend'
    if (fullPath.includes('/android/') || fullPath.includes('/app/src/')) return 'frontend'
    const backendKtPaths = ['/server/', '/api/', '/controller/', '/service/', '/repository/', '/application/', '/ktor/', '/spring/']
    for (const p of backendKtPaths) { if (fullPath.includes(p)) return 'backend' }
    const backendKtNames = ['application.kt', 'server.kt', 'main.kt']
    if (backendKtNames.includes(fileName) && projectType.startsWith('backend')) return 'backend'
    return 'frontend'
  }

  if (ext === 'swift') {
    if (projectType === 'ios') return 'frontend'
    if (fullPath.includes('/ios/')) return 'frontend'
    const backendSwiftPaths = ['/vapor/', '/perfect/', '/kitura/', '/server/', '/api/']
    for (const p of backendSwiftPaths) { if (fullPath.includes(p)) return 'backend' }
    return 'frontend'
  }

  if (ext === 'dart') return 'frontend'

  const backendExts = ['py', 'go', 'rs', 'rb', 'php', 'cs', 'ex', 'exs', 'erl', 'clj', 'scala', 'sql']
  if (backendExts.includes(ext)) return 'backend'

  if (ext === 'js' || ext === 'ts') {
    const backendPatterns = ['.server.', '.api.', '.route.', '.router.', '.controller.', '.model.', '.service.', '.middleware.', '.dao.', '.repository.', '.migrate.', '.seed.', '.schema.', '.db.', '.database.', '.handler.', '.worker.', '.cron.', '.job.', '.task.', '.listener.', '.subscriber.', '.publisher.', '.consumer.', '.producer.', '.grpc.', '.rpc.', '.socket.', '.ws.', '.queue.', '.cache.', '.mail.', '.sms.', '.push.', '.auth.', '.permission.', '.role.', '.policy.']
    for (const p of backendPatterns) { if (fileName.includes(p)) return 'backend' }
    const backendPaths = ['/server/', '/api/', '/routes/', '/controllers/', '/models/', '/services/', '/middleware/', '/migrations/', '/seeders/', '/database/', '/dao/', '/repository/', '/repositories/', '/handlers/', '/workers/', '/cron/', '/jobs/', '/tasks/', '/grpc/', '/rpc/', '/socket/', '/queue/', '/cache/', '/mail/', '/sms/', '/push/', '/auth/', '/permissions/', '/policies/']
    for (const p of backendPaths) { if (fullPath.includes(p)) return 'backend' }
    const backendNames = ['server.js', 'server.ts', 'knexfile.js', 'knexfile.ts', 'prisma.js', 'prisma.ts', 'sequelize.js', 'sequelize.ts', 'typeorm.js', 'typeorm.ts', 'mongoose.js', 'mongoose.ts']
    for (const n of backendNames) { if (fileName === n) return 'backend' }
    const frontendNames = ['app.js', 'app.ts', 'main.js', 'main.ts', 'index.js', 'index.ts', 'router.js', 'router.ts', 'store.js', 'store.ts', 'vite.config.js', 'vite.config.ts', 'webpack.config.js', 'webpack.config.ts', 'next.config.js', 'next.config.ts', 'nuxt.config.js', 'nuxt.config.ts', 'vue.config.js', 'vue.config.ts', 'tailwind.config.js', 'tailwind.config.ts', 'postcss.config.js', 'postcss.config.ts', '.eslintrc.js', '.eslintrc.ts', '.prettierrc.js', '.prettierrc.ts', 'babel.config.js', 'babel.config.ts', 'jest.config.js', 'jest.config.ts', 'vitest.config.js', 'vitest.config.ts', 'setup.js', 'setup.ts']
    for (const n of frontendNames) { if (fileName === n) return 'frontend' }
    const frontendPaths = ['/src/', '/client/', '/pages/', '/components/', '/views/', '/public/', '/static/', '/assets/', '/styles/', '/router/', '/store/', '/composables/', '/hooks/', '/layouts/', '/directives/', '/plugins/', '/mixins/', '/filters/', '/app/', '/nuxt/', '/next/']
    for (const p of frontendPaths) { if (fullPath.includes(p)) return 'frontend' }
    if (projectType === 'miniapp' || projectType === 'uniapp') return 'frontend'
    return 'frontend'
  }

  const frontendExts = ['vue', 'jsx', 'tsx', 'css', 'scss', 'less', 'sass', 'styl', 'html', 'htm', 'svg', 'wxml', 'wxss', 'wxs', 'xaml']
  if (frontendExts.includes(ext)) return 'frontend'

  if (ext === 'json') {
    if (projectType === 'miniapp' || projectType === 'uniapp') {
      const miniappConfigs = ['app.json', 'project.config.json', 'project.private.config.json', 'manifest.json', 'pages.json', 'package.json', 'tsconfig.json', 'appservice.json']
      if (miniappConfigs.includes(fileName)) return 'frontend'
    }
    return 'shared'
  }

  if (['env', 'dockerfile', 'ini', 'cfg', 'conf', 'properties', 'toml', 'gradle', 'pom'].includes(ext)) return 'backend'
  if (['xml', 'yaml', 'yml', 'md', 'txt', 'lock', 'map', 'gitignore', 'eslintrc', 'prettierrc', 'babelrc', 'editorconfig'].includes(ext)) return 'shared'
  return 'frontend'
}

function getTargetSubFolder(filePath) {
  const rootFolder = workspaceFolders.value[0]
  if (!rootFolder) return null
  const fileType = classifyFileType(filePath)
  const subFolderName = fileType === 'backend' ? 'backend' : fileType === 'shared' ? 'shared' : 'frontend'
  let subFolder = rootFolder.children?.find(c => c.type === 'folder' && c.name === subFolderName)
  if (!subFolder) {
    subFolder = {
      name: subFolderName,
      path: `${rootFolder.path}/${subFolderName}`,
      type: 'folder',
      children: [],
      _cachedContent: null
    }
    if (!rootFolder.children) rootFolder.children = []
    rootFolder.children.push(subFolder)
    expandedFolders.value.add(subFolder.path)
  }
  return subFolder
}

function resolveFilePath(rawPath) {
  const rootFolder = workspaceFolders.value[0]
  if (!rootFolder) return rawPath
  const rootPath = rootFolder.path

  if (rawPath.startsWith('workspace/')) {
    const afterRoot = rawPath.startsWith(rootPath + '/') ? rawPath.slice(rootPath.length + 1) : null
    if (afterRoot && (afterRoot.startsWith('frontend/') || afterRoot.startsWith('backend/') || afterRoot.startsWith('shared/'))) return rawPath
    if (afterRoot) {
      const subFolder = classifyFileType(afterRoot)
      return `${rootPath}/${subFolder}/${afterRoot}`
    }
    return rawPath
  }

  const pathLower = rawPath.toLowerCase()
  if (pathLower.startsWith('frontend/') || pathLower.startsWith('backend/') || pathLower.startsWith('shared/')) return `${rootPath}/${rawPath}`

  const existingFile = findFileInTree(workspaceFolders.value, `${rootPath}/frontend/${rawPath}`)
    || findFileInTree(workspaceFolders.value, `${rootPath}/backend/${rawPath}`)
    || findFileInTree(workspaceFolders.value, `${rootPath}/shared/${rawPath}`)
  if (existingFile) return existingFile.path

  const frontendPrefixes = ['src/', 'client/', 'pages/', 'components/', 'views/', 'public/', 'static/', 'assets/', 'styles/', 'router/', 'store/', 'composables/', 'hooks/', 'layouts/', 'directives/', 'plugins/', 'mixins/', 'filters/', 'app/', 'nuxt/', 'next/']
  const backendPrefixes = ['server/', 'api/', 'routes/', 'controllers/', 'models/', 'services/', 'middleware/', 'migrations/', 'seeders/', 'database/', 'dao/', 'repository/', 'repositories/', 'handlers/', 'workers/', 'cron/', 'jobs/', 'tasks/', 'grpc/', 'rpc/', 'socket/', 'queue/', 'cache/', 'mail/', 'sms/', 'push/', 'auth/', 'permissions/', 'policies/']
  const sharedPrefixes = ['utils/', 'helpers/', 'config/', 'types/', 'shared/', 'common/', 'constants/', 'enums/', 'interfaces/', 'types/', 'schemas/']

  for (const prefix of frontendPrefixes) {
    if (pathLower.startsWith(prefix)) return `${rootPath}/frontend/${rawPath}`
  }
  for (const prefix of backendPrefixes) {
    if (pathLower.startsWith(prefix)) return `${rootPath}/backend/${rawPath}`
  }
  for (const prefix of sharedPrefixes) {
    if (pathLower.startsWith(prefix)) return `${rootPath}/shared/${rawPath}`
  }

  const subFolder = classifyFileType(rawPath)
  return `${rootPath}/${subFolder}/${rawPath}`
}

const attachedFolder = ref(null)
const uploadStatus = ref('')
const uploadProgress = ref(0)
const lastMessageTime = ref(null)
const waitingElapsed = ref(0)
let waitingTimer = null
const downloadVersionMap = ref({})
const isDragging = ref(false)

const currentUser = ref(null)
const userNickname = ref('')
const userAvatar = ref('')
const avatarErrors = ref(new Set())

function setAvatarError(index) {
  const s = new Set(avatarErrors.value)
  s.add(index)
  avatarErrors.value = s
}

const showCustomModelModal = ref(false)
const selectedPresetModel = ref('')
const customModelKey = ref('')
const showCustomKeyValue = ref(false)
const customModels = ref([])
const showDeleteModelConfirm = ref(false)
const deleteModelTarget = ref('')

// Syntax highlighting
const syntaxKeywords = reactive({
  javascript: ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'default', 'new', 'this', 'try', 'catch', 'throw', 'typeof', 'instanceof', 'switch', 'case', 'break', 'continue', 'do', 'in', 'of', 'yield', 'delete', 'void', 'null', 'undefined', 'true', 'false', 'NaN', 'Infinity'],
  typescript: ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'default', 'new', 'this', 'try', 'catch', 'throw', 'typeof', 'instanceof', 'switch', 'case', 'break', 'continue', 'do', 'in', 'of', 'yield', 'delete', 'void', 'null', 'undefined', 'true', 'false', 'type', 'interface', 'enum', 'implements', 'extends', 'private', 'public', 'protected', 'readonly', 'readonly'],
  python: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'yield', 'lambda', 'pass', 'break', 'continue', 'and', 'or', 'not', 'is', 'in', 'True', 'False', 'None', 'raise', 'global', 'nonlocal', 'assert', 'del', 'async', 'await'],
  java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this', 'super', 'static', 'final', 'abstract', 'void', 'import', 'package', 'instanceof', 'enum'],
  html: [],
  css: ['important', 'media', 'keyframes', 'font-face', 'supports', 'viewport', 'page', 'charset', 'import', 'namespace'],
  json: [],
  sql: ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'TABLE', 'ALTER', 'INDEX', 'INTO', 'VALUES', 'SET', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'AS', 'IS', 'NULL', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX']
})

// 深色/浅色主题切换
const darkMode = ref(localStorage.getItem('limao_ai_theme') === 'dark')
function toggleDarkMode() {
  darkMode.value = !darkMode.value
  localStorage.setItem('limao_ai_theme', darkMode.value ? 'dark' : 'light')
}

const presetModelOptions = [
  {
    id: 'claude',
    name: 'Claude Opus 4.7',
    provider: 'Anthropic',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#D97757"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#D97757">C</text>',
    isTop: true
  },
  {
    id: 'gpt5pro',
    name: 'GPT-5.2 Pro',
    provider: 'OpenAI',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#10A37F"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#10A37F">GP</text>',
    isTop: true
  },
  {
    id: 'gpt5',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#10A37F"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="#10A37F">G</text>',
    isTop: true
  },
  {
    id: 'gemini',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#4285F4"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#4285F4">Gm</text>',
    isTop: true
  },
  {
    id: 'deepseekv4',
    name: 'DeepSeek V4 Pro',
    provider: 'DeepSeek',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#4D6BFE"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="#4D6BFE">DS</text>',
    isTop: true
  },
  {
    id: 'deepseekr1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#4D6BFE"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#4D6BFE">R1</text>',
    isTop: true
  },
  {
    id: 'qwenmax',
    name: 'Qwen3.6 Max',
    provider: 'Alibaba',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#615CED"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="#615CED">Qw</text>',
    isTop: true
  },
  {
    id: 'qwenplus',
    name: 'Qwen3.6 Plus',
    provider: 'Alibaba',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#615CED"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="8" font-weight="bold" fill="#615CED">Q+</text>',
    isTop: true
  },
  {
    id: 'glm51',
    name: 'GLM-5.1',
    provider: 'ZhipuAI',
    viewBox: '0 0 24 24',
    svgContent: '<rect width="24" height="24" rx="6" fill="#1677FF"/><circle cx="12" cy="12" r="6" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#1677FF">GL</text>',
    isTop: true
  },
  {
    id: 'nvidia_glm5',
    name: 'GLM-5.1',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1068 1024',
    svgContent: '<path d="M0 0m176.172043 0l715.698925 0q176.172043 0 176.172043 176.172043l0 671.655914q0 176.172043-176.172043 176.172043l-715.698925 0q-176.172043 0-176.172043-176.172043l0-671.655914q0-176.172043 176.172043-176.172043Z" fill="#000000"/><path d="M294.680774 759.741935h488.87742V643.468387h-327.68v-5.285161l304.777634-374.365592V148.424946h-449.23871v115.392688h283.63699l0.88086 5.285162-301.254194 370.84215V759.741935z" fill="#FFFFFF"/>',
    free: true,
    isTop: true
  },
  {
    id: 'nvidia_glm4',
    name: 'GLM-4.7',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1068 1024',
    svgContent: '<path d="M0 0m176.172043 0l715.698925 0q176.172043 0 176.172043 176.172043l0 671.655914q0 176.172043-176.172043 176.172043l-715.698925 0q-176.172043 0-176.172043-176.172043l0-671.655914q0-176.172043 176.172043-176.172043Z" fill="#222222"/><path d="M294.680774 759.741935h488.87742V643.468387h-327.68v-5.285161l304.777634-374.365592V148.424946h-449.23871v115.392688h283.63699l0.88086 5.285162-301.254194 370.84215V759.741935z" fill="#FFFFFF"/>',
    free: true
  },
  {
    id: 'nvidia_deepseek_flash',
    name: 'DeepSeek V4 Flash',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1391 1024',
    svgContent: '<path d="M1290.48631826 134.26404549c-12.13759084-6.07017626-17.37788176 5.499889-24.46849939 11.37950922-2.41647143 1.89727529-4.47944763 4.363457-6.54242381 6.63908268-17.73551954 19.34557993-38.45641692 32.05483886-65.55679893 30.53729479-39.59422976-2.27562567-73.40411731 10.43225242-103.27860851 41.34927845-6.35324862-38.12501514-27.45525808-60.8854144-59.58051983-75.49056778-16.83383047-7.58633948-33.80988755-15.17405981-45.59398314-31.67648848-8.20219449-11.75924044-10.43225242-24.84684976-14.55682396-37.74390306-2.60840831-7.77689552-5.21681664-15.74296623-13.98791754-17.07133511-9.55541849-1.51754407-13.27816535 6.63908267-17.02438651 13.46734055-14.93655518 27.8819379-20.74575252 58.60978874-20.15337181 89.71598996 1.28142029 69.99067879 30.25422243 125.75455459 87.77314691 165.39711379 6.54380466 4.55125134 8.22704962 9.10388355 6.16407344 15.74158537-3.91192206 13.65651573-8.60678085 26.93468109-12.70787809 40.59119684-2.60978915 8.72553316-6.52033037 10.62142761-15.69601764 6.82825787-31.55773616-13.46734055-58.82381906-33.38320773-82.93606151-57.47059505-40.8977435-40.40202164-77.88494578-84.97556341-123.99950592-119.87493438a545.31613447 545.31613447 0 0 0-32.8847242-22.95095532c-47.06319777-46.65999226 6.16407344-84.97418257 18.49360113-89.52681476 12.87357899-4.74180739 4.48082847-21.05368003-37.17637745-20.86450484s-79.75874677 14.41597819-128.31601433 33.38320774c-7.11133024 2.84453209-14.58167909 4.93098258-22.21496716 6.63908268-44.09991337-8.53635796-89.85821657-10.43225242-137.68087677-4.93236342-90.02391745 10.24307723-161.93534583 53.67880615-214.80636013 127.84100508-63.49382273 89.14708354-78.45523305 190.43451958-60.1273328 296.08265094 19.20473417 111.33995725 74.89680624 203.52212891 160.44127608 275.59787737 88.72040372 74.73110533 190.88467371 111.33995725 307.44006671 104.32252418 70.79570899-4.1742818 149.60581813-13.84707177 238.51539705-90.66600845 22.42899749 11.38089007 45.97233351 15.93352226 84.9990377 19.34696077 30.08714069 2.84453209 59.03646854-1.51754407 81.44199176-6.25935143 35.11340129-7.58633948 32.67069387-40.78037202 19.98629006-46.84916745-102.92235159-48.93699877-80.32765321-29.02113157-100.85937539-45.14244819 52.30210785-63.16242093 131.11221699-128.79102356 161.93534585-341.41565519 2.44132657-16.88077906 0.37835039-27.50220667 0-41.15872241-0.19055603-8.34580193 1.65838982-11.5714461 11.02463314-12.5187029 25.77201312-3.03508812 50.80941892-10.24307723 73.78384852-23.14013051 66.66975662-37.17637748 93.57958258-98.25234793 99.93421204-171.46729004 0.94863764-11.19033403-0.18917518-22.76039929-11.78409557-28.64001951M709.3939789 793.19438204c-99.72156256-80.0432-148.11312921-106.40759381-168.09941928-105.26978098-18.68277634 1.13781284-15.31628641 22.95095533-11.21518917 37.17637747 4.29165328 14.03624697 9.91029458 23.70903694 17.75761301 36.03856465 5.40737266 8.15662674 9.15359382 20.29559842-5.42808529 29.39948196-32.12664259 20.29559842-87.96232211-6.82825787-90.56934959-8.15524591-65.01136678-39.07365277-119.37783167-90.66600844-157.66854771-161.22421282-36.98582145-67.90422832-58.442707-140.73943922-61.99975296-218.50563266-0.94863764-18.77805435 4.48082847-25.41713702 22.76178014-28.8319564a220.49680515 220.49680515 0 0 1 73.0478604-1.89589444c101.80939388 15.17544065 188.49029571 61.64487685 261.13495055 135.23955021 41.46803076 41.91680402 72.8352109 91.99161563 105.17450296 140.9286144 34.35531967 51.96932523 71.34252197 101.4752304 118.40571975 142.06504638 16.61980014 14.22542217 29.87311037 25.03740581 42.58098844 33.00347652-38.29071602 4.363457-102.18636342 5.3107138-145.88307125-29.96838838m47.82127938-313.91206766c0-8.34580193 6.5451855-14.98488462 14.77085427-14.98488462q2.79758351 0.04832942 5.02626061 0.94863765a14.8661323 14.8661323 0 0 1 9.53194421 14.03624697 14.79432858 14.79432858 0 0 1-14.74737999 14.98488461 14.62862768 14.62862768 0 0 1-14.5816791-14.98488461m148.49286043 77.76619346c-9.50846991 3.98372577-19.03903327 7.39854512-28.21472053 7.77689552-14.17847357 0.75946245-29.68393518-5.12015777-38.07668571-12.32814687-13.08760932-11.19171487-22.43037833-17.45106631-26.34230037-36.98720228-1.68324496-8.34580193-0.75946245-21.24285522 0.73598816-28.64001951 3.36648992-15.93352226-0.37973123-26.17521863-11.38089007-35.46965822-8.96165695-7.58772033-20.36740213-9.67417081-32.8847242-9.67417081-4.6713845 0-8.96165695-2.08506965-12.13897168-3.79316974a12.44689918 12.44689918 0 0 1-5.40599181-17.44968548c1.30351374-2.65535691 7.6581432-9.10526439 9.15221296-10.24307722 16.99815054-9.86334601 36.60609022-6.63770183 54.71996013 0.75946245 16.81035618 7.01743307 29.49475998 19.91586719 47.82266024 38.12501511 18.68277634 22.00231767 22.04926625 28.07249393 32.67069386 44.57354179 8.41760565 12.8970533 16.07574886 26.17521863 21.29256549 41.34789759 3.19940818 9.48499561-0.92516335 17.26051028-11.94979647 22.00231767" fill="#4D6BFE"/>',
    free: true,
    isTop: true
  },
  {
    id: 'nvidia_qwen',
    name: 'Qwen3.5 397B',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M316.843 333.227h-83.627a16.085 16.085 0 0 0-13.91 8.106L172.8 422.571a16.427 16.427 0 0 0 0 16.256l190.72 333.226h92.715l137.728-116.906-277.12-321.92z" fill="#615CED"/><path d="M261.12 593.28l-41.813 73.13a16.384 16.384 0 0 0 0 16.214l46.464 81.28a15.957 15.957 0 0 0 13.909 8.15h176.555L261.077 593.28h0.043z m501.803-162.56l41.813-73.13a16.384 16.384 0 0 0 0-16.257l-46.464-81.28a16.085 16.085 0 0 0-13.952-8.106l-381.099 0.128-46.336 81.066 31.36 178.902 414.72-81.366z" fill="#615CED"/><path d="M567.723 251.947l-41.814-73.131a16.043 16.043 0 0 0-13.909-8.15h-92.928a15.957 15.957 0 0 0-13.952 8.107l-42.24 73.942-46.037 80.469 250.88-81.237zM456.235 772.053l41.813 73.174c2.859 4.992 8.15 8.106 13.91 8.106h92.927c5.76 0 11.094-3.114 13.952-8.106l190.379-333.398-46.336-81.066-169.088-62.038-137.557 403.371z" fill="#615CED"/><path d="M707.115 690.773h83.626c5.76 0 11.094-3.114 13.952-8.106l46.464-81.28a16.256 16.256 0 0 0 0-16.256l-42.24-73.942-45.994-80.469-55.808 260.053z" fill="#615CED"/><path d="M466.603 755.456l-185.387 0.768 45.952-81.195 92.8-0.384L233.003 350.72l92.885-0.17L512.64 674.09l-46.037 81.366z" fill="#FFFFFF"/><path d="M325.845 350.55l92.075-162.475 46.635 80.725-46.08 81.323 371.285-1.494-46.293 81.28-370.816 1.579-46.806-80.939z m417.664 79.402l93.312 161.707-92.586 0.426-46.72-80.938-184.32 325.461-46.592-81.152 184.064-325.12 92.842-0.427z" fill="#FFFFFF"/><path d="M512.64 674.09L650.71 430.38l-278.06 1.152 139.99 242.602z" fill="#605BEC"/><path d="M512.64 674.09L325.888 350.55l9.216-16.214 186.752 323.499-9.216 16.298z" fill="#605BEC"/><path d="M372.608 431.53l370.901-1.578 9.302 16.213-370.816 1.536z" fill="#605BEC"/><path d="M650.71 430.293l-184.065 325.12-18.56 0.086 184.107-325.12 18.517-0.086z" fill="#605BEC"/>',
    free: true
  },
  {
    id: 'nvidia_kimi',
    name: 'Kimi K2',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M932.977778 225.166222v543.004445c0 103.480889-51.768889 155.192889-155.136 155.192889H234.780444c-103.424 0-155.136-51.768889-155.136-155.192889V225.166222c0-103.424 51.768889-155.136 155.136-155.136h543.061334c103.424 0 155.136 51.712 155.136 155.136z" fill="#000000"/><path d="M563.143111 453.290667c47.616 1.137778 86.812444 43.633778 86.812445 96.028444v193.763556a1.706667 1.706667 0 0 1-1.763556 1.763555H564.906667a1.706667 1.706667 0 0 1-1.763556-1.763555l-1.422222-245.020445c0-1.080889-1.877333-1.251556-2.161778-0.227555-11.150222 36.636444-43.918222 46.933333-83.171555 46.933333H333.312a1.706667 1.706667 0 0 0-1.706667 1.706667v196.664889a1.706667 1.706667 0 0 1-1.763555 1.706666H242.005333a1.706667 1.706667 0 0 1-1.706666-1.763555V271.36a1.706667 1.706667 0 0 1 1.706666-1.706667h87.836445a1.706667 1.706667 0 0 1 1.706666 1.706667v180.224c0 0.967111 0.796444 1.820444 1.706667 1.820444H446.008889a1.763556 1.763556 0 0 0 1.592889-1.137777l80.725333-181.646223a1.706667 1.706667 0 0 1 1.592889-0.967111h97.28a1.706667 1.706667 0 0 1 1.592889 2.446223l-55.182222 118.556444c-16.497778 30.151111-28.615111 51.541333-56.035556 60.643556-1.024 0.398222-0.796444 2.048 0.227556 2.048h45.340444z" fill="#FFFFFF"/><path d="M685.738667 259.982222c-9.728 8.248889-16.156444 21.617778-16.156445 41.870222 0 18.944 6.030222 33.678222 15.132445 42.496a64.682667 64.682667 0 0 1-13.198223 16.213334c-0.568889 0.455111-0.113778 1.877333 0.625778 1.820444l53.703111-3.982222a50.744889 50.744889 0 0 0 30.833778-13.084444c10.296889-8.760889 16.270222-23.779556 16.270222-43.463112 0-20.252444-5.916444-33.621333-16.270222-41.870222a54.158222 54.158222 0 0 0-35.84-12.288 53.020444 53.020444 0 0 0-35.100444 12.288z" fill="#007AFF"/>',
    free: true
  },
  {
    id: 'nvidia_minimax',
    name: 'MiniMax M2.7',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M426.8032 481.81248v276.80768c-19.57888 93.71648-149.99552 69.55008-150.56896 1.55648-0.6144-85.4016 0-170.1888 0-255.01696v-98.26304c0-12.288-2.78528-21.99552-14.09024-29.73696-21.99552-15.64672-48.3328 2.78528-48.90624 25.3952-1.2288 30.3104-0.6144 60.0064-1.2288 89.94816 0 23.59296 0 46.57152 0.6144 70.12352-16.26112 103.8336-148.19328 86.58944-151.18336 0.6144V491.3152c0-23.59296 48.3328-29.12256 45.95712 6.144-1.55648 17.44896-0.57344 35.47136-1.18784 52.71552-0.57344 30.88384 48.9472 51.69152 60.6208 1.18784 0.6144-41.61536 0.6144-83.23072 0.6144-125.25568 0-52.67456 15.64672-95.47776 74.1376-99.45088 25.35424-2.17088 42.1888 7.90528 58.40896 25.3952 6.144 6.144 20.80768 25.72288 21.42208 47.104 0 19.6608 0.57344 39.23968 0.57344 59.06432 0 39.23968-0.57344 78.6432-0.57344 117.88288 0 25.3952 0.57344 50.54464 0.57344 75.32544 0 31.49824 0 63.40608-0.57344 94.90432-0.6144 41.00096 51.69152 40.42752 60.04736-0.6144 0-48.3328 0.57344-96.09216 0.57344-144.42496 0-119.11168-0.57344-238.1824-0.57344-357.25312 0-12.288-1.80224-46.57152 5.12-59.06432 36.4544-84.7872 147.2512-47.75936 148.23424 22.40512 2.17088 143.85152 0 289.30048 0.57344 433.52064 0 49.9712-42.5984 39.23968-44.97408 19.6608 0-150.03648 0-300.6464 0.6144-450.43712-2.17088-37.64224-60.6208-32.48128-64.02048-5.5296-1.18784 30.9248-0.57344 62.42304-1.18784 93.30688v183.7056h0.6144l0.4096 0.2048h-0.04096z" fill="#D4367A"/><path d="M598.016 479.60064v203.28448V203.1616c19.0464-94.33088 149.42208-69.75488 149.99552-1.76128 0.6144 84.7872 0 170.1888 0.6144 254.976 0 32.52224 0 65.20832-0.6144 97.6896 0 12.9024 3.35872 21.99552 14.66368 30.3104 21.42208 15.27808 47.75936-2.74432 48.9472-25.72288 1.18784-29.73696 0.57344-59.47392 0.57344-89.98912V398.9504c16.26112-103.8336 147.8656-86.58944 150.60992-0.6144v260.54656c0 23.59296-47.75936 29.16352-45.58848-6.144 1.2288-18.0224 0-224.0512 0.6144-242.11456 1.18784-30.3104-48.9472-51.73248-60.6208-0.6144v124.64128c0 53.32992-15.68768 95.51872-74.71104 100.06528-55.7056 1.2288-78.06976-35.47136-79.872-72.4992V310.35392c0-32.11264 0-63.40608 0.6144-94.90432 0.57344-41.00096-51.73248-41.00096-60.6208 0.6144v563.89632c0 12.288 1.76128 46.57152-4.58752 59.06432-36.4544 84.7872-147.78368 47.75936-148.80768-22.40512v-66.7648c2.78528-44.97408 42.5984-34.28352 44.40064-15.27808v79.2576c2.17088 37.6832 60.6208 33.09568 63.40608 5.57056 1.18784-30.9248 1.18784-61.8496 1.18784-93.34784V479.6416h-0.2048v-0.04096z" fill="#ED6D48"/>',
    free: true
  },
  {
    id: 'nvidia_llama',
    name: 'Llama 3.3',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M294.277333 170.666667h-1.024l-1.322666 111.573333h0.938666c73.173333 0 129.962667 57.898667 253.44 266.496l7.466667 12.672 0.512 0.853333 69.12-104.021333-0.512-0.810667a2080.213333 2080.213333 0 0 0-46.848-73.216 1195.733333 1195.733333 0 0 0-50.133333-69.504C444.293333 210.432 376.026667 170.666667 294.277333 170.666667z" fill="#0082FB"/><path d="M293.232 170.666667c-82.026667 0.426667-154.688 53.674667-207.04 135.253333l-0.426667 0.725333 96.170667 52.522667 0.469333-0.725333c30.634667-46.208 68.693333-75.690667 109.546667-76.16h0.896L294.213333 170.666667h-0.981333z" fill="#0082FB"/><path d="M86.192 305.92l-0.490667 0.725333c-34.474667 53.76-60.16 119.808-73.984 191.018667l-0.213333 0.938667 108.117333 25.6 0.170667-0.938667c11.52-62.592 33.536-120.661333 62.122667-164.053333l0.469333-0.725334-96.213333-52.565333z" fill="#0082FB"/><path d="M119.770667 523.264l-108.074667-25.6-0.213333 0.938667A635.093333 635.093333 0 0 0 0.005333 617.472v0.981333l110.848 9.941334v-0.981334c-0.405333-34.922667 2.602667-69.781333 8.96-104.106666l-0.042666-0.042667z" fill="#0082FB"/><path d="M114.224 662.912a233.002667 233.002667 0 0 1-3.370667-34.688v-0.938667L0.005333 617.301333v1.024a379.306667 379.306667 0 0 0 6.229334 70.485334l108.16-24.96a133.632 133.632 0 0 1-0.170667-0.938667z" fill="#0082FB"/><path d="M139.546667 720.64c-12.117333-13.226667-20.650667-32.256-25.130667-56.661333l-0.170667-0.896-108.16 24.96 0.170667 0.896c8.192 43.093333 24.234667 78.933333 47.189333 106.112l0.597334 0.725333 86.101333-74.453333-0.597333-0.682667z" fill="#0082FB"/><path d="M459.952 411.904c-65.194667 100.266667-104.704 163.2-104.704 163.2-86.826667 136.533333-116.864 167.125333-165.162667 167.125333a65.941333 65.941333 0 0 1-50.602666-21.674666l-86.058667 74.410666 0.597333 0.725334C85.765333 832.768 130.48 853.333333 185.861333 853.333333c83.754667 0 143.957333-39.594667 251.050667-227.413333l75.349333-133.546667a1761.173333 1761.173333 0 0 0-52.309333-80.469333zM576.090667 253.696l-0.682667 0.682667c-17.066667 18.346667-33.536 38.741333-49.493333 60.416a1184.533333 1184.533333 0 0 1 50.133333 69.546666c20.48-31.701333 39.594667-57.386667 58.325333-77.098666l0.682667-0.682667-58.965333-52.864z" fill="#0082FB"/><path d="M892.528 243.754667C847.088 197.674667 792.901333 170.666667 734.938667 170.666667c-61.098667 0-112.512 33.578667-158.848 82.944l-0.682667 0.682666 58.965333 52.906667 0.682667-0.725333c30.506667-31.872 60.074667-47.786667 92.842667-47.786667 35.242667 0 68.266667 16.64 96.853333 45.866667l0.64 0.682666 67.797333-60.8-0.682666-0.682666z" fill="#0082FB"/><path d="M1023.92 602.666667c-2.56-147.925333-54.186667-280.149333-130.730667-358.229334l-0.682666-0.682666-67.754667 60.757333 0.64 0.682667c57.6 59.392 97.152 169.813333 100.736 297.429333v0.981333h97.792v-0.938666z" fill="#0082FB"/><path d="M1023.92 603.733333v-0.981333h-97.792v0.938667c0.170667 5.973333 0.256 12.032 0.256 18.090666 0 34.773333-5.162667 62.890667-15.701333 83.2l-0.469334 0.938667 72.874667 76.032 0.554667-0.853333c26.453333-40.96 40.362667-97.834667 40.362666-166.826667 0-3.541333 0-7.04-0.085333-10.538667z" fill="#0082FB"/><path d="M910.682667 704.853333l-0.469334 0.853334c-9.130667 17.152-22.144 28.586667-39.125333 33.578666l33.194667 105.045334c6.4-2.154667 12.650667-4.757333 18.688-7.765334a151.765333 151.765333 0 0 0 58.282666-51.968l1.877334-2.773333 0.512-0.853333-72.96-76.117334z" fill="#0082FB"/><path d="M849.925333 742.101333c-11.157333 0-20.970667-1.664-30.613333-5.973333l-34.048 107.605333c19.157333 6.528 39.552 9.472 62.293333 9.472 20.992 0 40.234667-3.114667 57.685334-9.173333l-33.28-105.045333c-7.125333 2.133333-14.506667 3.2-22.016 3.114666z" fill="#0082FB"/><path d="M781.765333 705.450667l-0.597333-0.725334-78.336 81.664 0.682667 0.725334c27.178667 29.098667 53.162667 47.146667 82.645333 57.045333l34.005333-107.52c-12.416-5.333333-24.448-15.061333-38.4-31.189333z" fill="#0082FB"/><path d="M781.210667 704.64c-23.466667-27.392-52.565333-73.045333-98.261334-146.773333l-59.562666-99.669334-0.469334-0.853333-69.12 104.021333 0.512 0.853334 42.197334 71.168c40.917333 68.693333 74.24 118.357333 106.368 152.96l0.682666 0.682667 78.250667-81.664a98.005333 98.005333 0 0 1-0.597333-0.725333z" fill="#0082FB"/>',
    free: true,
    isTop: true
  },
  {
    id: 'nvidia_nemotron',
    name: 'Nemotron 49B',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1343 1024',
    svgContent: '<path d="M557.675718 319.970003V265.799081c5.343499-0.479955 11.19895-0.479955 16.574446-0.479955 155.665406-4.639565 257.671843 127.988001 257.671843 127.988001s-109.813705 146.162297-227.914633 146.162298c-15.614536 0-31.229072-2.335781-45.851701-7.007343V367.133581c60.506328 7.03934 72.697185 32.700934 108.789801 90.615505l81.048402-64.921914s-59.066463-74.233041-158.609131-74.23304c-10.750992-0.479955-20.990032 0.447958-31.709027 1.375871m0-191.886011v86.327907l16.510452-0.991907c215.243821-7.455301 355.646658 180.079118 355.646658 180.079117s-161.296878 199.917258-328.929163 199.917258c-14.590632 0-29.149267-1.503859-43.227947-3.967628v53.562979c11.646908 1.503859 24.285723 2.495766 35.932631 2.495766 156.465331 0 269.190763-81.368372 378.524514-177.583352 17.950317 14.846608 92.311346 51.067212 107.82989 66.45777-103.958254 88.791676-346.399525 160.720932-483.442677 160.720932-13.11877 0-25.725588-0.511952-38.3964-1.983814V768.023998H1151.89201V128.083992H557.675718z m0 410.873481v46.235665c-142.9306-26.621504-182.862857-181.838953-182.862857-181.838952s68.793551-79.352561 182.862857-92.439334v50.23529h-0.479955C497.521357 353.662844 450.837734 412.37734 450.837734 412.37734s26.461519 97.974815 106.837984 126.580133m-265.255132-138.515014s88.439709-123.156454 265.255132-135.923258V219.499422C361.246133 234.218042 191.982002 391.003343 191.982002 391.003343s95.927007 261.927444 365.181764 285.605225v-47.35556c-197.421492-23.67778-264.711183-228.778552-264.711183-228.778552z" fill="#76B900"/>',
    free: true
  },
  {
    id: 'nvidia_gemma4',
    name: 'Gemma 2 9B',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M1024 523.392c0-42.112-3.498667-72.832-11.008-104.704H522.453333v190.037333h287.914667c-5.802667 47.189333-37.12 118.314667-106.794667 166.101334l-0.981333 6.357333 155.093333 117.76 10.752 1.024C967.125333 810.666667 1024 679.253333 1024 523.392z" fill="#4285F4"/><path d="M522.453333 1024c141.034667 0 259.434667-45.525333 345.962667-124.032L703.573333 774.826667c-44.117333 30.165333-103.338667 51.2-181.12 51.2a313.941333 313.941333 0 0 1-297.216-212.778667l-6.144 0.512-161.28 122.325333-2.090666 5.76C141.653333 909.098667 318.101333 1024 522.453333 1024z" fill="#34A853"/><path d="M225.237333 613.248A309.482667 309.482667 0 0 1 207.786667 512c0-35.285333 6.4-69.418667 16.810666-101.248l-0.298666-6.826667L61.013333 279.68l-5.333333 2.474667A504.149333 504.149333 0 0 0 0 512c0 82.474667 20.309333 160.426667 55.722667 229.845333l169.514666-128.597333z" fill="#FBBC05"/><path d="M522.453333 197.973333c98.133333 0 164.266667 41.514667 202.026667 76.245334l147.413333-141.098667C781.312 50.645333 663.466667 0 522.453333 0 318.08 0 141.653333 114.901333 55.68 282.154667l168.96 128.597333c42.368-123.477333 159.573333-212.778667 297.770667-212.778667z" fill="#EB4335"/>',
    free: true
  },
  {
    id: 'nvidia_nemotron3',
    name: 'Nemotron 70B',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M385.024 378.88V319.488c5.632-0.512 11.776-0.512 17.408-0.512 163.328-5.12 270.336 140.288 270.336 140.288S557.568 619.52 433.664 619.52c-16.384 0-32.768-2.56-48.128-7.68V430.592c63.488 7.68 76.288 35.84 114.176 99.328l84.992-71.168s-61.952-81.408-166.4-81.408c-11.264-0.512-22.016 0.512-33.28 1.536m0-197.12v89.088l17.408-1.024c226.816-7.68 374.784 185.856 374.784 185.856s-169.984 206.336-346.624 206.336c-15.36 0-30.72-1.536-45.568-4.096v55.296c12.288 1.536 25.6 2.56 37.888 2.56 164.864 0 283.648-83.968 398.848-183.296 18.944 15.36 97.28 52.736 113.664 68.608-109.568 91.648-365.056 165.888-509.44 165.888-13.824 0-27.136-0.512-40.448-2.048v77.312h625.664v-660.48H385.024z m0 429.568v47.104c-152.064-27.136-194.56-185.344-194.56-185.344s73.216-80.896 194.56-94.208v51.2h-0.512C321.024 422.4 271.36 482.304 271.36 482.304s28.16 99.84 113.664 129.024M115.2 466.432s90.112-133.12 270.336-146.944v-48.64C185.344 286.72 12.8 456.192 12.8 456.192s97.792 283.136 372.224 308.736v-51.2c-201.216-25.6-269.824-247.296-269.824-247.296z" fill="#76B900"/>',
    free: true
  },
  {
    id: 'nvidia_deepseek_v4_pro',
    name: 'DeepSeek V4 Pro',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1391 1024',
    svgContent: '<path d="M1290.48631826 134.26404549c-12.13759084-6.07017626-17.37788176 5.499889-24.46849939 11.37950922-2.41647143 1.89727529-4.47944763 4.363457-6.54242381 6.63908268-17.73551954 19.34557993-38.45641692 32.05483886-65.55679893 30.53729479-39.59422976-2.27562567-73.40411731 10.43225242-103.27860851 41.34927845-6.35324862-38.12501514-27.45525808-60.8854144-59.58051983-75.49056778-16.83383047-7.58633948-33.80988755-15.17405981-45.59398314-31.67648848-8.20219449-11.75924044-10.43225242-24.84684976-14.55682396-37.74390306-2.60840831-7.77689552-5.21681664-15.74296623-13.98791754-17.07133511-9.55541849-1.51754407-13.27816535 6.63908267-17.02438651 13.46734055-14.93655518 27.8819379-20.74575252 58.60978874-20.15337181 89.71598996 1.28142029 69.99067879 30.25422243 125.75455459 87.77314691 165.39711379 6.54380466 4.55125134 8.22704962 9.10388355 6.16407344 15.74158537-3.91192206 13.65651573-8.60678085 26.93468109-12.70787809 40.59119684-2.60978915 8.72553316-6.52033037 10.62142761-15.69601764 6.82825787-31.55773616-13.46734055-58.82381906-33.38320773-82.93606151-57.47059505-40.8977435-40.40202164-77.88494578-84.97556341-123.99950592-119.87493438a545.31613447 545.31613447 0 0 0-32.8847242-22.95095532c-47.06319777-46.65999226 6.16407344-84.97418257 18.49360113-89.52681476 12.87357899-4.74180739 4.48082847-21.05368003-37.17637745-20.86450484s-79.75874677 14.41597819-128.31601433 33.38320774c-7.11133024 2.84453209-14.58167909 4.93098258-22.21496716 6.63908268-44.09991337-8.53635796-89.85821657-10.43225242-137.68087677-4.93236342-90.02391745 10.24307723-161.93534583 53.67880615-214.80636013 127.84100508-63.49382273 89.14708354-78.45523305 190.43451958-60.1273328 296.08265094 19.20473417 111.33995725 74.89680624 203.52212891 160.44127608 275.59787737 88.72040372 74.73110533 190.88467371 111.33995725 307.44006671 104.32252418 70.79570899-4.1742818 149.60581813-13.84707177 238.51539705-90.66600845 22.42899749 11.38089007 45.97233351 15.93352226 84.9990377 19.34696077 30.08714069 2.84453209 59.03646854-1.51754407 81.44199176-6.25935143 35.11340129-7.58633948 32.67069387-40.78037202 19.98629006-46.84916745-102.92235159-48.93699877-80.32765321-29.02113157-100.85937539-45.14244819 52.30210785-63.16242093 131.11221699-128.79102356 161.93534585-341.41565519 2.44132657-16.88077906 0.37835039-27.50220667 0-41.15872241-0.19055603-8.34580193 1.65838982-11.5714461 11.02463314-12.5187029 25.77201312-3.03508812 50.80941892-10.24307723 73.78384852-23.14013051 66.66975662-37.17637748 93.57958258-98.25234793 99.93421204-171.46729004 0.94863764-11.19033403-0.18917518-22.76039929-11.78409557-28.64001951M709.3939789 793.19438204c-99.72156256-80.0432-148.11312921-106.40759381-168.09941928-105.26978098-18.68277634 1.13781284-15.31628641 22.95095533-11.21518917 37.17637747 4.29165328 14.03624697 9.91029458 23.70903694 17.75761301 36.03856465 5.40737266 8.15662674 9.15359382 20.29559842-5.42808529 29.39948196-32.12664259 20.29559842-87.96232211-6.82825787-90.56934959-8.15524591-65.01136678-39.07365277-119.37783167-90.66600844-157.66854771-161.22421282-36.98582145-67.90422832-58.442707-140.73943922-61.99975296-218.50563266-0.94863764-18.77805435 4.48082847-25.41713702 22.76178014-28.8319564a220.49680515 220.49680515 0 0 1 73.0478604-1.89589444c101.80939388 15.17544065 188.49029571 61.64487685 261.13495055 135.23955021 41.46803076 41.91680402 72.8352109 91.99161563 105.17450296 140.9286144 34.35531967 51.96932523 71.34252197 101.4752304 118.40571975 142.06504638 16.61980014 14.22542217 29.87311037 25.03740581 42.58098844 33.00347652-38.29071602 4.363457-102.18636342 5.3107138-145.88307125-29.96838838m47.82127938-313.91206766c0-8.34580193 6.5451855-14.98488462 14.77085427-14.98488462q2.79758351 0.04832942 5.02626061 0.94863765a14.8661323 14.8661323 0 0 1 9.53194421 14.03624697 14.79432858 14.79432858 0 0 1-14.74737999 14.98488461 14.62862768 14.62862768 0 0 1-14.5816791-14.98488461m148.49286043 77.76619346c-9.50846991 3.98372577-19.03903327 7.39854512-28.21472053 7.77689552-14.17847357 0.75946245-29.68393518-5.12015777-38.07668571-12.32814687-13.08760932-11.19171487-22.43037833-17.45106631-26.34230037-36.98720228-1.68324496-8.34580193-0.75946245-21.24285522 0.73598816-28.64001951 3.36648992-15.93352226-0.37973123-26.17521863-11.38089007-35.46965822-8.96165695-7.58772033-20.36740213-9.67417081-32.8847242-9.67417081-4.6713845 0-8.96165695-2.08506965-12.13897168-3.79316974a12.44689918 12.44689918 0 0 1-5.40599181-17.44968548c1.30351374-2.65535691 7.6581432-9.10526439 9.15221296-10.24307722 16.99815054-9.86334601 36.60609022-6.63770183 54.71996013 0.75946245 16.81035618 7.01743307 29.49475998 19.91586719 47.82266024 38.12501511 18.68277634 22.00231767 22.04926625 28.07249393 32.67069386 44.57354179 8.41760565 12.8970533 16.07574886 26.17521863 21.29256549 41.34789759 3.19940818 9.48499561-0.92516335 17.26051028-11.94979647 22.00231767" fill="#4D6BFE"/>',
    free: true,
    isTop: true
  },
  {
    id: 'nvidia_mistral_medium',
    name: 'Mistral Medium 3.5',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M512 0A512 512 0 1 1 0 512 512.238933 512.238933 0 0 1 512 0z m298.871467 781.824v-10.24l-46.762667-45.909333a13.9264 13.9264 0 0 1-5.3248-13.448534v-337.271466a13.960533 13.960533 0 0 1 5.3248-13.448534l47.786667-45.909333v-10.24h-165.717334l-118.203733 294.877867-134.4512-294.741334h-174.08v10.24l56.0128 67.4816a23.2448 23.2448 0 0 1 7.850667 19.5584v265.181867a30.72 30.72 0 0 1-8.123734 26.3168l-63.010133 76.458667v10.24h178.722133v-10.24L327.68 694.203733a31.675733 31.675733 0 0 1-8.669867-26.3168v-229.376l157.013334 342.186667h18.2272l134.724266-342.186667v272.759467c0 7.2704 0 8.669867-4.778666 13.448533l-48.469334 47.035734v10.24z" fill="#5B60E3"/>',
    free: true,
    isTop: true
  },
  {
    id: 'nvidia_mistral_small',
    name: 'Mistral Small 4',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M511.12 64.22c-247.42 0-448 200.58-448 448s200.58 448 448 448 448-200.58 448-448-200.58-448-448-448z m0.49 853.3c-225.36 0-408.06-182.69-408.06-408.06S286.24 101.4 511.61 101.4s408.05 182.7 408.05 408.07-182.69 408.05-408.05 408.05z" fill="#5B60E3"/><path d="M511.61 101.41c-225.36 0-408.06 182.69-408.06 408.06s182.69 408.06 408.06 408.06 408.06-182.69 408.06-408.06-182.7-408.06-408.06-408.06z m189.26 613.74h-80.92V496.01L514.09 715.15 404.85 495.33v219.82h-80.92V310.57h80.92l109.24 221.84 105.87-221.84h80.92v404.58z" fill="#5B60E3"/>',
    free: true
  },
  {
    id: 'nvidia_qwen_122b',
    name: 'Qwen3 Next 80B',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1028 1024',
    svgContent: '<path d="M316.843 333.227h-83.627a16.085 16.085 0 0 0-13.91 8.106L172.8 422.571a16.427 16.427 0 0 0 0 16.256l190.72 333.226h92.715l137.728-116.906-277.12-321.92z" fill="#615CED"/><path d="M261.12 593.28l-41.813 73.13a16.384 16.384 0 0 0 0 16.214l46.464 81.28a15.957 15.957 0 0 0 13.909 8.15h176.555L261.077 593.28h0.043z m501.803-162.56l41.813-73.13a16.384 16.384 0 0 0 0-16.257l-46.464-81.28a16.085 16.085 0 0 0-13.952-8.106l-381.099 0.128-46.336 81.066 31.36 178.902 414.72-81.366z" fill="#615CED"/><path d="M567.723 251.947l-41.814-73.131a16.043 16.043 0 0 0-13.909-8.15h-92.928a15.957 15.957 0 0 0-13.952 8.107l-42.24 73.942-46.037 80.469 250.88-81.237zM456.235 772.053l41.813 73.174c2.859 4.992 8.15 8.106 13.91 8.106h92.927c5.76 0 11.094-3.114 13.952-8.106l190.379-333.398-46.336-81.066-169.088-62.038-137.557 403.371z" fill="#615CED"/><path d="M707.115 690.773h83.626c5.76 0 11.094-3.114 13.952-8.106l46.464-81.28a16.256 16.256 0 0 0 0-16.256l-42.24-73.942-45.994-80.469-55.808 260.053z" fill="#615CED"/><path d="M466.603 755.456l-185.387 0.768 45.952-81.195 92.8-0.384L233.003 350.72l92.885-0.17L512.64 674.09l-46.037 81.366z" fill="#FFFFFF"/><path d="M325.845 350.55l92.075-162.475 46.635 80.725-46.08 81.323 371.285-1.494-46.293 81.28-370.816 1.579-46.806-80.939z m417.664 79.402l93.312 161.707-92.586 0.426-46.72-80.938-184.32 325.461-46.592-81.152 184.064-325.12 92.842-0.427z" fill="#FFFFFF"/><path d="M512.64 674.09L650.71 430.38l-278.06 1.152 139.99 242.602z" fill="#605BEC"/><path d="M512.64 674.09L325.888 350.55l9.216-16.214 186.752 323.499-9.216 16.298z" fill="#605BEC"/><path d="M372.608 431.53l370.901-1.578 9.302 16.213-370.816 1.536z" fill="#605BEC"/><path d="M650.71 430.293l-184.065 325.12-18.56 0.086 184.107-325.12 18.517-0.086z" fill="#605BEC"/>',
    free: true,
    isTop: true
  },
  {
    id: 'nvidia_gemma4_31b',
    name: 'Gemma 4 31B',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M1024 523.392c0-42.112-3.498667-72.832-11.008-104.704H522.453333v190.037333h287.914667c-5.802667 47.189333-37.12 118.314667-106.794667 166.101334l-0.981333 6.357333 155.093333 117.76 10.752 1.024C967.125333 810.666667 1024 679.253333 1024 523.392z" fill="#4285F4"/><path d="M522.453333 1024c141.034667 0 259.434667-45.525333 345.962667-124.032L703.573333 774.826667c-44.117333 30.165333-103.338667 51.2-181.12 51.2a313.941333 313.941333 0 0 1-297.216-212.778667l-6.144 0.512-161.28 122.325333-2.090666 5.76C141.653333 909.098667 318.101333 1024 522.453333 1024z" fill="#34A853"/><path d="M225.237333 613.248A309.482667 309.482667 0 0 1 207.786667 512c0-35.285333 6.4-69.418667 16.810666-101.248l-0.298666-6.826667L61.013333 279.68l-5.333333 2.474667A504.149333 504.149333 0 0 0 0 512c0 82.474667 20.309333 160.426667 55.722667 229.845333l169.514666-128.597333z" fill="#FBBC05"/><path d="M522.453333 197.973333c98.133333 0 164.266667 41.514667 202.026667 76.245334l147.413333-141.098667C781.312 50.645333 663.466667 0 522.453333 0 318.08 0 141.653333 114.901333 55.68 282.154667l168.96 128.597333c42.368-123.477333 159.573333-212.778667 297.770667-212.778667z" fill="#EB4335"/>',
    free: true
  },
  {
    id: 'nvidia_nemotron_nano',
    name: 'Nemotron 3 Nano Omni',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M385.024 378.88V319.488c5.632-0.512 11.776-0.512 17.408-0.512 163.328-5.12 270.336 140.288 270.336 140.288S557.568 619.52 433.664 619.52c-16.384 0-32.768-2.56-48.128-7.68V430.592c63.488 7.68 76.288 35.84 114.176 99.328l84.992-71.168s-61.952-81.408-166.4-81.408c-11.264-0.512-22.016 0.512-33.28 1.536m0-197.12v89.088l17.408-1.024c226.816-7.68 374.784 185.856 374.784 185.856s-169.984 206.336-346.624 206.336c-15.36 0-30.72-1.536-45.568-4.096v55.296c12.288 1.536 25.6 2.56 37.888 2.56 164.864 0 283.648-83.968 398.848-183.296 18.944 15.36 97.28 52.736 113.664 68.608-109.568 91.648-365.056 165.888-509.44 165.888-13.824 0-27.136-0.512-40.448-2.048v77.312h625.664v-660.48H385.024z m0 429.568v47.104c-152.064-27.136-194.56-185.344-194.56-185.344s73.216-80.896 194.56-94.208v51.2h-0.512C321.024 422.4 271.36 482.304 271.36 482.304s28.16 99.84 113.664 129.024M115.2 466.432s90.112-133.12 270.336-146.944v-48.64C185.344 286.72 12.8 456.192 12.8 456.192s97.792 283.136 372.224 308.736v-51.2c-201.216-25.6-269.824-247.296-269.824-247.296z" fill="#76B900"/>',
    free: true,
    isTop: true
  },
  {
    id: 'nvidia_gpt_oss_120b',
    name: 'GPT-OSS 120B',
    provider: 'OpenAI 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M565.265178 954.519092c-22.289934 0-48.400999-8.151747-67.952455-14.838727a103.425292 103.425292 0 0 1-26.875292-11.272338c-12.737105-7.769634-15.411897-8.342804-19.806198-24.773669 21.971506-5.158528 81.581157-41.905075 103.871091-55.342721 148.896757-89.159735 119.028246-10.444426 119.028246-364.981743 15.029784 3.566389 82.791182 32.415932 82.791182 57.316972 0 133.102747 20.570425 273.847757-52.604243 354.91943-22.799418 25.47421-91.834527 58.972796-138.388646 58.972796z m-433.061569-299.321966c258.626916 136.860193 184.369594 157.048504 357.721593 52.094759 44.579867-27.193719 90.433445-49.292596 132.593263-77.568969v101.896839c-95.528287 22.226248-272.319304 227.038896-419.050754 100.686815l-25.856323-25.155782c-37.319718-43.943012-45.344094-72.410442-45.344094-151.889977z m375.744596-19.105658c-19.933569-13.310275-79.479535-51.330533-101.896839-57.316972v-133.739602a1158.312326 1158.312326 0 0 0 101.896839-57.316973c43.943012 10.189684 70.690933 47.063603 114.633945 57.316973v127.371049c-17.831947 12.10025-95.846715 58.718054-114.633945 63.749211z m-426.693016-178.31947c0-63.685525-4.26693-90.306074 38.84817-145.776166 23.945757-30.88748 47.509402-39.612396 82.090641-57.953828v261.110652c44.134069 23.372588 83.873836 49.037854 129.345301 74.448379l131.765351 78.396881c-59.545966 15.921381-63.685525 61.32916-109.602788 33.753328-104.699003-62.730242-272.38299-129.345301-272.38299-243.91556z m866.123138 127.37105c0 79.543221-47.573087 161.188063-121.002497 178.31947v-165.582365c0-82.791182 9.743885-84.574377-48.910483-116.608196L565.265178 362.371082c15.79401-23.62733 22.608361-19.105657 48.146256-34.835982 41.714019-25.47421 39.039227-16.112438 117.053995 28.785857 94.190891 54.196382 216.849212 100.559444 216.849212 228.885777z m-541.326961-197.425127v-95.528287c43.751956-23.181531 90.688187-50.94842 133.357489-76.804743 82.154327-49.547338 95.528287-63.303412 185.006449-63.303412 48.464684 0 102.533695 36.746548 125.651541 65.405034 42.223503 52.22213 39.930824 92.662439 39.930824 151.125751-31.078536-16.494551-192.393971-121.002497-222.899337-121.002498s-229.650003 123.422547-261.110652 140.108155z m-50.94842 159.213812c-16.36718-10.95391-63.112355-39.99451-82.791183-44.579867 0-168.320842-33.880699-314.606493 67.952455-390.519639 56.043262-41.714019 113.169178-53.814269 181.376375-30.696423 25.47421 8.661231 35.536523 20.888852 56.36169 26.429493-11.781822 16.048752-80.68956 50.311565-102.278953 63.303412-154.564769 93.235608-120.620384 7.451206-120.620384 376.063024z m-292.953415 121.002498c0 169.148754 115.143429 280.853165 274.293556 273.847756 59.800708-2.674792 26.811606-7.705949 69.417222 25.47421 97.820966 76.741057 228.822091 73.747838 319.637649 1.018969a251.939936 251.939936 0 0 0 52.604244-55.661149c58.20857-85.274918-10.95391-45.598836 81.96327-83.619094 130.236898-53.241099 199.399378-217.358696 128.64476-355.428914-27.448461-53.559526-40.249252-28.849543-28.276373-104.699003 18.723544-118.582447-63.176041-230.032116-157.621674-269.771884-98.90362-41.586648-129.090559 12.737105-178.892639-37.574459A161.888604 161.888604 0 0 0 580.103905 28.913674C474.003821-27.766443 331.284559 1.528898 258.428319 93.681853c-81.326415 102.979494 9.489143 54.705866-92.407697 98.648878C15.149614 257.353652-33.251385 439.175825 41.579107 561.06992c56.807488 92.598753 20.570425 4.967471 20.570424 106.800625z" fill="#10A37F"/>',
    free: true,
    isTop: true
  },
  {
    id: 'nvidia_gpt_oss_20b',
    name: 'GPT-OSS 20B',
    provider: 'OpenAI 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M565.265178 954.519092c-22.289934 0-48.400999-8.151747-67.952455-14.838727a103.425292 103.425292 0 0 1-26.875292-11.272338c-12.737105-7.769634-15.411897-8.342804-19.806198-24.773669 21.971506-5.158528 81.581157-41.905075 103.871091-55.342721 148.896757-89.159735 119.028246-10.444426 119.028246-364.981743 15.029784 3.566389 82.791182 32.415932 82.791182 57.316972 0 133.102747 20.570425 273.847757-52.604243 354.91943-22.799418 25.47421-91.834527 58.972796-138.388646 58.972796z m-433.061569-299.321966c258.626916 136.860193 184.369594 157.048504 357.721593 52.094759 44.579867-27.193719 90.433445-49.292596 132.593263-77.568969v101.896839c-95.528287 22.226248-272.319304 227.038896-419.050754 100.686815l-25.856323-25.155782c-37.319718-43.943012-45.344094-72.410442-45.344094-151.889977z m375.744596-19.105658c-19.933569-13.310275-79.479535-51.330533-101.896839-57.316972v-133.739602a1158.312326 1158.312326 0 0 0 101.896839-57.316973c43.943012 10.189684 70.690933 47.063603 114.633945 57.316973v127.371049c-17.831947 12.10025-95.846715 58.718054-114.633945 63.749211z m-426.693016-178.31947c0-63.685525-4.26693-90.306074 38.84817-145.776166 23.945757-30.88748 47.509402-39.612396 82.090641-57.953828v261.110652c44.134069 23.372588 83.873836 49.037854 129.345301 74.448379l131.765351 78.396881c-59.545966 15.921381-63.685525 61.32916-109.602788 33.753328-104.699003-62.730242-272.38299-129.345301-272.38299-243.91556z m866.123138 127.37105c0 79.543221-47.573087 161.188063-121.002497 178.31947v-165.582365c0-82.791182 9.743885-84.574377-48.910483-116.608196L565.265178 362.371082c15.79401-23.62733 22.608361-19.105657 48.146256-34.835982 41.714019-25.47421 39.039227-16.112438 117.053995 28.785857 94.190891 54.196382 216.849212 100.559444 216.849212 228.885777z m-541.326961-197.425127v-95.528287c43.751956-23.181531 90.688187-50.94842 133.357489-76.804743 82.154327-49.547338 95.528287-63.303412 185.006449-63.303412 48.464684 0 102.533695 36.746548 125.651541 65.405034 42.223503 52.22213 39.930824 92.662439 39.930824 151.125751-31.078536-16.494551-192.393971-121.002497-222.899337-121.002498s-229.650003 123.422547-261.110652 140.108155z m-50.94842 159.213812c-16.36718-10.95391-63.112355-39.99451-82.791183-44.579867 0-168.320842-33.880699-314.606493 67.952455-390.519639 56.043262-41.714019 113.169178-53.814269 181.376375-30.696423 25.47421 8.661231 35.536523 20.888852 56.36169 26.429493-11.781822 16.048752-80.68956 50.311565-102.278953 63.303412-154.564769 93.235608-120.620384 7.451206-120.620384 376.063024z m-292.953415 121.002498c0 169.148754 115.143429 280.853165 274.293556 273.847756 59.800708-2.674792 26.811606-7.705949 69.417222 25.47421 97.820966 76.741057 228.822091 73.747838 319.637649 1.018969a251.939936 251.939936 0 0 0 52.604244-55.661149c58.20857-85.274918-10.95391-45.598836 81.96327-83.619094 130.236898-53.241099 199.399378-217.358696 128.64476-355.428914-27.448461-53.559526-40.249252-28.849543-28.276373-104.699003 18.723544-118.582447-63.176041-230.032116-157.621674-269.771884-98.90362-41.586648-129.090559 12.737105-178.892639-37.574459A161.888604 161.888604 0 0 0 580.103905 28.913674C474.003821-27.766443 331.284559 1.528898 258.428319 93.681853c-81.326415 102.979494 9.489143 54.705866-92.407697 98.648878C15.149614 257.353652-33.251385 439.175825 41.579107 561.06992c56.807488 92.598753 20.570425 4.967471 20.570424 106.800625z" fill="#10A37F"/>',
    free: true,
    isTop: false
  },
  {
    id: 'nvidia_flux_klein',
    name: 'FLUX.2 Klein',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M512 1024C229.248 1024 0 794.752 0 512S229.248 0 512 0s512 229.248 512 512-229.248 512-512 512z m0-128c188.096 0 343.936-135.424 376.96-313.92-125.568 98.048-306.688 90.688-422.208-24.832a191.978667 191.978667 0 0 0-271.552 0c-21.952 22.016-36.736 48.192-45.824 75.904C200.32 785.472 342.528 896 512 896z m0-768C323.904 128 168.064 263.424 135.04 441.92c125.568-98.048 306.688-90.688 422.208 24.832 75.008 75.008 196.544 75.008 271.488 0 22.016-22.016 36.736-48.192 45.888-75.904C823.68 238.592 681.472 128 512 128z" fill="#000000"/>',
    free: true,
    isImageModel: true
  },
  {
    id: 'nvidia_flux_schnell',
    name: 'FLUX.1 Schnell',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M512 1024C229.248 1024 0 794.752 0 512S229.248 0 512 0s512 229.248 512 512-229.248 512-512 512z m0-128c188.096 0 343.936-135.424 376.96-313.92-125.568 98.048-306.688 90.688-422.208-24.832a191.978667 191.978667 0 0 0-271.552 0c-21.952 22.016-36.736 48.192-45.824 75.904C200.32 785.472 342.528 896 512 896z m0-768C323.904 128 168.064 263.424 135.04 441.92c125.568-98.048 306.688-90.688 422.208 24.832 75.008 75.008 196.544 75.008 271.488 0 22.016-22.016 36.736-48.192 45.888-75.904C823.68 238.592 681.472 128 512 128z" fill="#000000"/>',
    free: true,
    isImageModel: true
  },
  {
    id: 'nvidia_flux_dev',
    name: 'FLUX.1 Dev',
    provider: 'NVIDIA 免费',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M512 1024C229.248 1024 0 794.752 0 512S229.248 0 512 0s512 229.248 512 512-229.248 512-512 512z m0-128c188.096 0 343.936-135.424 376.96-313.92-125.568 98.048-306.688 90.688-422.208-24.832a191.978667 191.978667 0 0 0-271.552 0c-21.952 22.016-36.736 48.192-45.824 75.904C200.32 785.472 342.528 896 512 896z m0-768C323.904 128 168.064 263.424 135.04 441.92c125.568-98.048 306.688-90.688 422.208 24.832 75.008 75.008 196.544 75.008 271.488 0 22.016-22.016 36.736-48.192 45.888-75.904C823.68 238.592 681.472 128 512 128z" fill="#000000"/>',
    free: true,
    isImageModel: true
  },
  {
    id: 'wavespeed_wan_t2v',
    name: 'WAN 2.1 T2V 480p',
    provider: 'WaveSpeedAI',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z" fill="#6366F1"/><path d="M512 128c-212 0-384 172-384 384s172 384 384 384 384-172 384-384-172-384-384-384z" fill="#FFFFFF"/><path d="M400 300v424l320-212z" fill="#6366F1"/>',
    free: false,
    isVideoModel: true
  },
  {
    id: 'kling',
    name: 'Kling V2.5 Turbo Pro (国内)',
    provider: '快手',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z" fill="#FF6B00"/><path d="M512 128c-212 0-384 172-384 384s172 384 384 384 384-172 384-384-172-384-384-384z" fill="#FFFFFF"/><path d="M400 300v424l320-212z" fill="#FF6B00"/>',
    free: false,
    isVideoModel: true
  },
  {
    id: 'wavespeed_wan_t2v_fast',
    name: 'WAN 2.1 T2V 480p Ultra Fast',
    provider: 'WaveSpeedAI',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z" fill="#409eff"/><path d="M512 128c-212 0-384 172-384 384s172 384 384 384 384-172 384-384-172-384-384-384z" fill="#FFFFFF"/><path d="M400 300v424l320-212z" fill="#409eff"/><path d="M700 512l120 0" stroke="#409eff" stroke-width="40"/><path d="M760 452l60 60-60 60" stroke="#409eff" stroke-width="30" fill="none"/>',
    free: false,
    isVideoModel: true
  },
  {
    id: 'wavespeed_kling',
    name: 'Kling V2.5 Turbo Pro',
    provider: 'WaveSpeedAI',
    viewBox: '0 0 1024 1024',
    svgContent: '<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z" fill="#F59E0B"/><path d="M512 128c-212 0-384 172-384 384s172 384 384 384 384-172 384-384-172-384-384-384z" fill="#FFFFFF"/><path d="M400 300v424l320-212z" fill="#F59E0B"/>',
    free: false,
    isVideoModel: true
  }
]

const modelPresetConfigs = {
  claude: { name: 'Claude Opus 4.7', base: 'https://api.anthropic.com/v1', modelId: 'claude-opus-4-7', isVision: true, keyUrl: 'console.anthropic.com' },
  gpt5pro: { name: 'GPT-5.2 Pro', base: 'https://api.openai.com/v1', modelId: 'gpt-5.2-pro', isVision: true, keyUrl: 'platform.openai.com' },
  gpt5: { name: 'GPT-5.2', base: 'https://api.openai.com/v1', modelId: 'gpt-5.2', isVision: true, keyUrl: 'platform.openai.com' },
  gemini: { name: 'Gemini 3.1 Pro', base: 'https://generativelanguage.googleapis.com/v1beta/openai', modelId: 'gemini-3.1-pro', isVision: true, keyUrl: 'aistudio.google.com' },
  deepseekv4: { name: 'DeepSeek V4 Pro', base: 'https://api.deepseek.com', modelId: 'deepseek-chat', isChinese: true, keyUrl: 'platform.deepseek.com' },
  deepseekr1: { name: 'DeepSeek R1', base: 'https://api.deepseek.com', modelId: 'deepseek-reasoner', isChinese: true, keyUrl: 'platform.deepseek.com' },
  qwenmax: { name: 'Qwen3.6 Max', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', modelId: 'qwen3.6-max-preview', isChinese: true, keyUrl: 'dashscope.aliyun.com' },
  qwenplus: { name: 'Qwen3.6 Plus', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', modelId: 'qwen3.6-plus', isVision: true, isChinese: true, keyUrl: 'dashscope.aliyun.com' },
  glm51: { name: 'GLM-5.1', base: 'https://open.bigmodel.cn/api/paas/v4', modelId: 'glm-5.1', isChinese: true, keyUrl: 'open.bigmodel.cn' },
  nvidia_glm5: { name: 'GLM-5.1', base: 'https://integrate.api.nvidia.com/v1', modelId: 'z-ai/glm-5.1', isFree: true, isChinese: true },
  nvidia_glm4: { name: 'GLM-4.7', base: 'https://integrate.api.nvidia.com/v1', modelId: 'z-ai/glm4.7', isFree: true, isChinese: true },
  nvidia_deepseek_flash: { name: 'DeepSeek V4 Flash', base: 'https://integrate.api.nvidia.com/v1', modelId: 'deepseek-ai/deepseek-v4-flash', isFree: true, isChinese: true },
  nvidia_qwen: { name: 'Qwen3.5 397B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'qwen/qwen3.5-397b-a17b', isFree: true, isChinese: true },
  nvidia_kimi: { name: 'Kimi K2', base: 'https://integrate.api.nvidia.com/v1', modelId: 'moonshotai/kimi-k2-instruct', isFree: true, isChinese: true },
  nvidia_minimax: { name: 'MiniMax M2.7', base: 'https://integrate.api.nvidia.com/v1', modelId: 'minimaxai/minimax-m2.7', isFree: true, isChinese: true },
  nvidia_llama: { name: 'Llama 3.3 70B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'meta/llama-3.3-70b-instruct', isFree: true },
  nvidia_nemotron: { name: 'Nemotron 49B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'nvidia/llama-3.3-nemotron-super-49b-v1', isFree: true },
  nvidia_gemma4: { name: 'Gemma 2 9B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'google/gemma-2-9b-it', isFree: true },
  nvidia_nemotron3: { name: 'Nemotron 3 Super 120B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'nvidia/nemotron-3-super-120b-a12b', isFree: true, isTop: true },
  nvidia_deepseek_v4_pro: { name: 'DeepSeek V4 Pro', base: 'https://integrate.api.nvidia.com/v1', modelId: 'deepseek-ai/deepseek-v4-pro', isFree: true, isChinese: true },
  nvidia_mistral_medium: { name: 'Mistral Medium 3.5', base: 'https://integrate.api.nvidia.com/v1', modelId: 'mistralai/mistral-medium-3.5-128b', isFree: true },
  nvidia_mistral_small: { name: 'Mistral Small 4', base: 'https://integrate.api.nvidia.com/v1', modelId: 'mistralai/mistral-small-4-119b-2603', isFree: true },
  nvidia_qwen_122b: { name: 'Qwen3 Next 80B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'qwen/qwen3-next-80b-a3b-instruct', isFree: true, isChinese: true },
  nvidia_gemma4_31b: { name: 'Gemma 4 31B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'google/gemma-4-31b-it', isFree: true, isVision: true },
  nvidia_nemotron_nano: { name: 'Nemotron 3 Nano Omni', base: 'https://integrate.api.nvidia.com/v1', modelId: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', isFree: true, isTop: true, isVision: true },
  nvidia_gpt_oss_120b: { name: 'GPT-OSS 120B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'openai/gpt-oss-120b', isFree: true, isTop: true },
  nvidia_gpt_oss_20b: { name: 'GPT-OSS 20B', base: 'https://integrate.api.nvidia.com/v1', modelId: 'openai/gpt-oss-20b', isFree: true },
  nvidia_flux_klein: { name: 'FLUX.2 Klein', base: 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b', modelId: 'black-forest-labs/flux.2-klein-4b', isFree: true, isImageModel: true },
  nvidia_flux_schnell: { name: 'FLUX.1 Schnell', base: 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell', modelId: 'black-forest-labs/flux.1-schnell', isFree: true, isImageModel: true },
  nvidia_flux_dev: { name: 'FLUX.1 Dev', base: 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev', modelId: 'black-forest-labs/flux.1-dev', isFree: true, isImageModel: true },
  wavespeed_wan_t2v: { name: 'WAN 2.1 T2V 480p', base: 'https://api.wavespeed.ai', modelId: 'wavespeed-ai/wan-2.1/t2v-480p', isFree: false, isVideoModel: true, keyUrl: 'wavespeed.ai' },
  wavespeed_wan_t2v_fast: { name: 'WAN 2.1 T2V 480p Ultra Fast', base: 'https://api.wavespeed.ai', modelId: 'wavespeed-ai/wan-2.1/t2v-480p-ultra-fast', isFree: false, isVideoModel: true, keyUrl: 'wavespeed.ai' },
  wavespeed_kling: { name: 'Kling V2.5 Turbo Pro', base: 'https://api.wavespeed.ai', modelId: 'kuaishou/kling-v2.5-turbo-pro', isFree: false, isVideoModel: true, keyUrl: 'wavespeed.ai' },
  kling: { name: 'Kling V2.5 Turbo Pro (国内)', base: 'https://api.klingai.com/v1', modelId: 'kling-v2-5-turbo-pro', isFree: false, isVideoModel: true, keyUrl: 'klingai.com', isChinese: true }
}

const configuredModels = computed(() => {
  return customModels.value.filter(m => {
    return !!modelPresetConfigs[m.id]
  }).map(m => {
    const preset = modelPresetConfigs[m.id]
    const opt = presetModelOptions.find(o => o.id === m.id)
    return {
      id: m.id,
      name: preset.name,
      viewBox: opt?.viewBox || '0 0 24 24',
      svgContent: opt?.svgContent || '',
      isTop: opt?.isTop
    }
  })
})

const freeModels = computed(() => {
  return presetModelOptions
    .filter(opt => opt.free && modelPresetConfigs[opt.id]?.isFree)
    .map(opt => ({
      id: opt.id,
      name: opt.name,
      viewBox: opt.viewBox,
      svgContent: opt.svgContent,
      isFree: true
    }))
})

// 所有已配置的模型（包括通过直接配置 Key 的预设模型 + 自定义模型）
const userConfiguredModels = computed(() => {
  return configuredModels.value.filter(m => hasApiKey(m.id))
})

const otherPresetModels = computed(() => {
  const configuredIds = new Set(configuredModels.value.map(m => m.id))
  return presetModelOptions.filter(opt => !configuredIds.has(opt.id)).map(opt => ({
    id: opt.id,
    name: opt.name,
    viewBox: opt.viewBox,
    svgContent: opt.svgContent,
    hasKey: !!apiKeys[opt.id]
  }))
})

const allConfiguredModels = computed(() => {
  const seen = new Set()
  const result = []

  // 免费模型自动可用（不需要配置 Key）
  for (const opt of presetModelOptions) {
    if (modelPresetConfigs[opt.id]?.isFree) {
      seen.add(opt.id)
      result.push({
        id: opt.id,
        name: opt.name,
        viewBox: opt.viewBox,
        svgContent: opt.svgContent,
        isTop: opt.isTop
      })
    }
  }

  // 用户自定义配置的模型（需要配置 Key）
  for (const opt of presetModelOptions) {
    if (apiKeys[opt.id] && !seen.has(opt.id)) {
      seen.add(opt.id)
      result.push({
        id: opt.id,
        name: opt.name,
        viewBox: opt.viewBox,
        svgContent: opt.svgContent,
        isTop: opt.isTop
      })
    }
  }

  for (const model of configuredModels.value) {
    if (!seen.has(model.id)) {
      seen.add(model.id)
      result.push(model)
    }
  }

  return result
})

function loadCustomModels() {
  try {
    const saved = localStorage.getItem('limao_custom_models')
    if (saved) {
      customModels.value = JSON.parse(saved)
    }
  } catch (e) {}
}

function saveCustomModels() {
  localStorage.setItem('limao_custom_models', JSON.stringify(customModels.value))
}

function selectModelCard(id) {
  selectedPresetModel.value = id
  customModelKey.value = ''
}

function openCustomModel() {
  selectedPresetModel.value = ''
  customModelKey.value = ''
  showCustomKeyValue.value = false
  showCustomModelModal.value = true
}

async function addPresetModel() {
  const preset = modelPresetConfigs[selectedPresetModel.value]
  if (!preset || !customModelKey.value.trim()) return

  const id = selectedPresetModel.value
  const keyData = { key: customModelKey.value.trim(), base: preset.base, customModelId: preset.modelId }

  if (customModels.value.find(m => m.id === id)) {
    apiKeys[id] = keyData
    localStorage.setItem('limao_api_keys', JSON.stringify(apiKeys))
    await serverSaveKey(id, keyData.key, keyData.base)
    showCustomModelModal.value = false
    selectedModel.value = id
    return
  }

  customModels.value.push({ id, key: customModelKey.value.trim() })
  apiKeys[id] = keyData
  localStorage.setItem('limao_api_keys', JSON.stringify(apiKeys))
  saveCustomModels()
  await serverSaveKey(id, keyData.key, keyData.base)
  showCustomModelModal.value = false
  selectedModel.value = id
}

async function serverSaveKey(modelId, apiKey, apiBase) {
  if (!props.isLoggedIn || !props.token) return
  try {
    const res = await fetch(`${API_BASE}/ai/data/keys`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.token}` },
      body: JSON.stringify({ model_id: modelId, api_key: apiKey, api_base: apiBase || '' })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.warn('[API Keys] 服务端保存失败:', data.message || res.status)
    }
  } catch (e) {
    console.warn('[API Keys] 服务端保存失败:', e)
  }
}

async function removeCustomModel(id) {
  deleteModelTarget.value = id
  showDeleteModelConfirm.value = true
}

async function confirmDeleteModel() {
  const id = deleteModelTarget.value
  showDeleteModelConfirm.value = false
  customModels.value = customModels.value.filter(m => m.id !== id)
  delete apiKeys[id]
  delete modelNames[id]
  localStorage.setItem('limao_api_keys', JSON.stringify(apiKeys))
  localStorage.setItem('limao_custom_models', JSON.stringify(customModels.value))
  if (selectedModel.value === id) {
    const configured = configuredModels.value
    if (configured.length > 0) {
      selectedModel.value = configured[configured.length - 1].id
    } else if (freeModels.value.length > 0) {
      selectedModel.value = freeModels.value[0].id
    }
    localStorage.setItem('limao_selected_model', selectedModel.value)
  }
  // 已登录：同步到服务端
  if (props.isLoggedIn && props.token) {
    try {
      await fetch(`${API_BASE}/ai/data/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${props.token}` }
      })
    } catch (e) {
      console.warn('[API Keys] 服务端删除失败:', e)
    }
  }
}

function loadUserData() {
  try {
    const saved = localStorage.getItem('user')
    if (saved) {
      currentUser.value = JSON.parse(saved)
      userNickname.value = currentUser.value?.nickname || currentUser.value?.email?.split('@')[0] || '您'
      userAvatar.value = currentUser.value?.avatar || ''
    }
  } catch (e) {}
}

function getUserDisplayName() {
  return userNickname.value || '您'
}

function getModelIconHtml(model, size = 16, extraStyle = '') {
  return `<svg viewBox="${model.viewBox}" width="${size}" height="${size}" style="flex-shrink:0;${extraStyle}">${model.svgContent}</svg>`
}

function getUserInitial() {
  const name = userNickname.value || 'U'
  return name.charAt(0).toUpperCase()
}

function getUserAvatarUrl(avatar) {
  if (!avatar) return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/api/')) return avatar
  return API_BASE + avatar
}

const modelNames = reactive({
  claude: 'Claude Opus 4.7',
  gpt5pro: 'GPT-5.2 Pro',
  gpt5: 'GPT-5.2',
  gemini: 'Gemini 3.1 Pro',
  deepseekv4: 'DeepSeek V4 Pro',
  deepseekr1: 'DeepSeek R1',
  qwenmax: 'Qwen3.6 Max',
  qwenplus: 'Qwen3.6 Plus',
  glm51: 'GLM-5.1',
  nvidia_glm5: 'GLM-5.1',
  nvidia_glm4: 'GLM-4.7',
  nvidia_deepseek_flash: 'DeepSeek V4 Flash',
  nvidia_qwen: 'Qwen3.5 397B',
  nvidia_kimi: 'Kimi K2',
  nvidia_minimax: 'MiniMax M2.7',
  nvidia_llama: 'Llama 3.3 70B',
  nvidia_nemotron: 'Nemotron 51B',
  nvidia_gemma4: 'Gemma 2 9B',
  nvidia_nemotron3: 'Nemotron 3 Super 120B',
  nvidia_deepseek_v4_pro: 'DeepSeek V4 Pro',
  nvidia_mistral_medium: 'Mistral Medium 3.5',
  nvidia_mistral_small: 'Mistral Small 4',
  nvidia_qwen_122b: 'Qwen3 Next 80B',
  nvidia_gemma4_31b: 'Gemma 4 31B',
  nvidia_nemotron_nano: 'Nemotron 3 Nano Omni',
  nvidia_gpt_oss_120b: 'GPT-OSS 120B',
  nvidia_gpt_oss_20b: 'GPT-OSS 20B',
  nvidia_flux_klein: 'FLUX.2 Klein',
  nvidia_flux_schnell: 'FLUX.1 Schnell',
  nvidia_flux_dev: 'FLUX.1 Dev',
  wavespeed_wan_t2v: 'WAN 2.1 T2V 480p',
  wavespeed_wan_t2v_fast: 'WAN 2.1 T2V 480p Ultra Fast',
  wavespeed_kling: 'Kling V2.5 Turbo Pro',
  kling: 'Kling V2.5 Turbo Pro (国内)'
})

const apiKeys = reactive({})

function hasApiKey(model) {
  return !!apiKeys[model]
}

function openKeyConfig(model) {
  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }
  configModel.value = model
  tempApiKey.value = apiKeys[model]?.key || ''
  tempApiBase.value = apiKeys[model]?.base || ''
  showKeyValue.value = false
  showDeleteKeyConfirm.value = false
  showKeyModal.value = true
}

async function saveApiKey() {
  if (!tempApiKey.value.trim()) return
  const modelId = configModel.value
  const preset = modelPresetConfigs[modelId]
  const keyData = {
    key: tempApiKey.value.trim(),
    base: tempApiBase.value.trim(),
    customModelId: preset?.modelId || ''
  }
  apiKeys[modelId] = keyData
  localStorage.setItem('limao_api_keys', JSON.stringify(apiKeys))

  // 将模型添加到customModels列表（如果尚未添加）
  if (!customModels.value.find(m => m.id === modelId)) {
    customModels.value.push({ id: modelId, key: keyData.key })
    saveCustomModels()
  }

  // 已登录：同步到服务端
  if (props.isLoggedIn && props.token) {
    try {
      await fetch(`${API_BASE}/ai/data/keys`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.token}` },
        body: JSON.stringify({ model_id: modelId, api_key: keyData.key, api_base: keyData.base })
      })
    } catch (e) {
      console.warn('[API Keys] 服务端保存失败:', e)
    }
  }

  showKeyModal.value = false
  if (selectedModel.value === configModel.value || !hasApiKey(selectedModel.value)) {
    selectedModel.value = configModel.value
  }
}

async function loadApiKeys() {
  // 未登录：直接从本地存储加载，不发服务端请求
  if (!props.isLoggedIn || !props.token) {
    try {
      const saved = localStorage.getItem('limao_api_keys')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed === 'object' && parsed !== null) {
          Object.keys(parsed).forEach(k => {
            apiKeys[k] = parsed[k]
          })
        }
      }
    } catch (e) {
      console.warn('[API Keys] 本地加载失败:', e)
    }
    return
  }

  // 已登录：从服务端加载
  try {
    const res = await fetch(`${API_BASE}/ai/data/keys`, {
      headers: { Authorization: `Bearer ${props.token}` }
    })

    // 401 说明 token 已过期，清除登录状态
    if (res.status === 401) {
      console.warn('[API Keys] Token 已过期，清除登录状态')
      localStorage.removeItem('limao_token')
      // 降级到本地存储
      const saved = localStorage.getItem('limao_api_keys')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed === 'object' && parsed !== null) {
          Object.keys(parsed).forEach(k => {
            apiKeys[k] = parsed[k]
          })
        }
      }
      return
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()
    if (json.success && json.data) {
      Object.keys(json.data).forEach(k => {
        apiKeys[k] = json.data[k]
      })
      // 同步到本地存储
      localStorage.setItem('limao_api_keys', JSON.stringify(json.data))
      return
    }
  } catch (e) {
    console.warn('[API Keys] 服务端加载失败，降级到本地:', e)
  }

  // 服务端加载失败：从本地加载
  try {
    const saved = localStorage.getItem('limao_api_keys')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (typeof parsed === 'object' && parsed !== null) {
        Object.keys(parsed).forEach(k => {
          apiKeys[k] = parsed[k]
        })
      }
    }
  } catch (e) {
    console.warn('[API Keys] 本地加载失败:', e)
  }
}

const modePrompts = {
  deploy: '我想部署这个项目，请告诉我需要修改哪些配置文件才能运行起来？包括环境变量、数据库连接、端口设置等。',
  brand: '我想把这个项目改成自己的品牌，请告诉我需要修改哪些文件来更换项目名称、Logo、网站标题和描述？',
  api: '我想配置AI模型的API Key，请告诉我支持哪些模型、如何获取API Key、以及在哪里配置？',
  customize: '我想二次开发这个项目，请告诉我项目的代码结构、核心模块在哪里，以及如何添加新功能？',
  image: '请生成图片：',
  video: '请生成视频：'
}

function selectModel(model) {
  const isFreeModel = modelPresetConfigs[model]?.isFree
  
  if (!isFreeModel && !hasApiKey(model)) {
    openKeyConfig(model)
    return
  }
  
  selectedModel.value = model
  localStorage.setItem('limao_selected_model', model)
}

// ===== 对话会话管理 =====
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function getSessionTitle(messages) {
  // 取第一条用户消息的前 20 个字符作为标题
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (!firstUserMsg) return '新对话'
  const text = firstUserMsg.content.replace(/[\n\r]/g, ' ').trim()
  return text.length > 20 ? text.slice(0, 20) + '...' : text
}

function saveSessionsToStorage() {
  // 只保存标题和概要信息到 localStorage（不保存完整消息内容避免超限）
  const summary = chatSessions.value.map(s => ({
    id: s.id,
    title: s.title,
    count: s.count,
    createdAt: s.createdAt
  }))
  localStorage.setItem('limao_chat_sessions', JSON.stringify(summary))
}

function startNewChat() {
  if (isLoading.value) {
    if (abortController.value) {
      try { abortController.value.abort() } catch {}
      abortController.value = null
    }
    isLoading.value = false
  }
  if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
  pendingStreamingContent = ''
  if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }

  if (messages.value.length > 0) {
    for (const msg of messages.value) {
      if (msg.streaming) msg.streaming = false
    }
    saveCurrentSession()
    saveCurrentConversationMemory()
  }

  currentSessionId.value = null
  messages.value = []
  localStorage.removeItem('limao_last_session')
  fiftyWarningDismissed.value = false
}

function switchToSession(sessionId) {
  if (!sessionId) return

  if (isLoading.value) {
    if (abortController.value) {
      try { abortController.value.abort() } catch {}
      abortController.value = null
    }
    isLoading.value = false
  }
  if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
  pendingStreamingContent = ''
  if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }

  if (messages.value.length > 0 && currentSessionId.value !== sessionId) {
    for (const msg of messages.value) {
      if (msg.streaming) {
        msg.streaming = false
        if (msg.role === 'ai' && !msg.content.endsWith('⏱ 响应已中断')) {
          msg.content += '\n\n⏱ 响应已中断'
        }
      }
    }
    saveCurrentSession()
  }

  currentSessionId.value = sessionId
  fiftyWarningDismissed.value = false
  const session = chatSessions.value.find(s => s.id === sessionId)
  if (!session) {
    currentSessionId.value = null
    return
  }
  try {
    const stored = sessionStorage.getItem('limao_session_' + sessionId)
    if (stored) {
      messages.value = JSON.parse(stored)
    } else {
      const backup = localStorage.getItem('limao_session_msgs_' + sessionId)
      if (backup) {
        messages.value = JSON.parse(backup)
      } else {
        messages.value = []
      }
    }
  } catch {
    messages.value = []
  }
  for (const msg of messages.value) {
    if (msg.streaming) msg.streaming = false
  }
  localStorage.setItem('limao_last_session', sessionId)
  nextTick(() => {
    const chatArea = document.querySelector('.chat-messages')
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight
  })
}

function askDeleteSession(sessionId) {
  pendingDeleteSessionId.value = sessionId
  showDeleteSessionConfirm.value = true
}

function toggleSessionMenu(sessionId) {
  if (activeMenuSessionId.value === sessionId) {
    activeMenuSessionId.value = null
  } else {
    activeMenuSessionId.value = sessionId
  }
}

function startRenameSession(session) {
  renamingSessionId.value = session.id
  renamingTitle.value = session.title
  activeMenuSessionId.value = null
  nextTick(() => {
    const input = document.querySelector('.card-rename-input')
    if (input) {
      input.focus()
      input.select()
    }
  })
}

function confirmRenameSession(sessionId) {
  const newTitle = renamingTitle.value.trim()
  if (newTitle) {
    const session = chatSessions.value.find(s => s.id === sessionId)
    if (session) {
      session.title = newTitle
      saveSessionsToStorage()
    }
  }
  renamingSessionId.value = null
  renamingTitle.value = ''
}

function cancelRenameSession() {
  renamingSessionId.value = null
  renamingTitle.value = ''
}

function exportSession(sessionId) {
  activeMenuSessionId.value = null
  const session = chatSessions.value.find(s => s.id === sessionId)
  if (!session) return
  let msgs = []
  try {
    const saved = localStorage.getItem('limao_session_msgs_' + sessionId)
    if (saved) msgs = JSON.parse(saved)
  } catch (e) { /* ignore */ }
  if (msgs.length === 0) {
    try {
      const saved = sessionStorage.getItem('limao_session_' + sessionId)
      if (saved) msgs = JSON.parse(saved)
    } catch (e) { /* ignore */ }
  }
  const exportData = {
    title: session.title,
    createdAt: session.createdAt,
    messages: msgs.map(m => ({ role: m.role, content: m.content }))
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${session.title || '对话'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function confirmDeleteSession() {
  const id = pendingDeleteSessionId.value
  if (!id) return
  chatSessions.value = chatSessions.value.filter(s => s.id !== id)
  sessionStorage.removeItem('limao_session_' + id)
  localStorage.removeItem('limao_session_msgs_' + id)
  if (currentSessionId.value === id) {
    currentSessionId.value = null
    messages.value = []
    localStorage.removeItem('limao_last_session')
  }
  saveSessionsToStorage()
  showDeleteSessionConfirm.value = false
  pendingDeleteSessionId.value = null
}

function loadSessionsFromStorage() {
  try {
    const saved = localStorage.getItem('limao_chat_sessions')
    if (saved) {
      chatSessions.value = JSON.parse(saved)
    }
  } catch (e) {
    console.warn('[Chat] 加载会话列表失败:', e)
  }
}

function saveCurrentSession() {
  if (messages.value.length === 0) return
  const sid = currentSessionId.value || generateSessionId()
  const existing = chatSessions.value.findIndex(s => s.id === sid)
  const session = {
    id: sid,
    title: getSessionTitle(messages.value),
    count: messages.value.length,
    createdAt: existing >= 0 ? chatSessions.value[existing].createdAt : Date.now()
  }
  if (existing >= 0) {
    chatSessions.value[existing] = session
  } else {
    chatSessions.value.unshift(session)
  }
  try {
    sessionStorage.setItem('limao_session_' + sid, JSON.stringify(messages.value))
    localStorage.setItem('limao_session_msgs_' + sid, JSON.stringify(messages.value))
  } catch (e) {}
  saveSessionsToStorage()
  localStorage.setItem('limao_last_session', sid)
  currentSessionId.value = sid
}

function restoreLastSession() {
  const lastId = localStorage.getItem('limao_last_session')
  if (!lastId) return
  try {
    const stored = sessionStorage.getItem('limao_session_' + lastId)
    if (stored) {
      messages.value = JSON.parse(stored)
      currentSessionId.value = lastId
      const session = chatSessions.value.find(s => s.id === lastId)
      if (!session) {
        const newSession = {
          id: lastId,
          title: getSessionTitle(messages.value),
          count: messages.value.length,
          createdAt: Date.now()
        }
        chatSessions.value.unshift(newSession)
        try {
          sessionStorage.setItem('limao_session_' + lastId, JSON.stringify(messages.value))
          localStorage.setItem('limao_session_msgs_' + lastId, JSON.stringify(messages.value))
        } catch (e) {}
        saveSessionsToStorage()
      }
      return true
    }
    const backup = localStorage.getItem('limao_session_msgs_' + lastId)
    if (backup) {
      messages.value = JSON.parse(backup)
      currentSessionId.value = lastId
      const session = chatSessions.value.find(s => s.id === lastId)
      if (!session) {
        const newSession = {
          id: lastId,
          title: getSessionTitle(messages.value),
          count: messages.value.length,
          createdAt: Date.now()
        }
        chatSessions.value.unshift(newSession)
        saveSessionsToStorage()
      }
      return true
    }
  } catch (e) {
    console.warn('[Chat] 恢复上次会话失败:', e)
  }
  return false
}

function setupAutoSave() {
  const save = () => { saveCurrentSession() }
  window.addEventListener('beforeunload', save)
  const interval = setInterval(save, 15000)
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', save)
    clearInterval(interval)
    saveCurrentSession()
    document.removeEventListener('click', handleClickOutside)
    if (streamingRenderTimer) clearTimeout(streamingRenderTimer)
    if (loadingSafetyTimer) clearTimeout(loadingSafetyTimer)
    if (scrollRafId) cancelAnimationFrame(scrollRafId)
  })
}

// 计算对话轮数（用户+AI 消息对）
const chatRoundCount = computed(() => {
  const userMsgs = messages.value.filter(m => m.role === 'user').length
  return userMsgs
})

const groupedSessions = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const weekAgo = today - 7 * 86400000

  const groups = [
    { label: '今天', sessions: [] },
    { label: '昨天', sessions: [] },
    { label: '最近7天', sessions: [] },
    { label: '更早', sessions: [] }
  ]

  for (const session of chatSessions.value) {
    const ts = session.createdAt || 0
    if (ts >= today) {
      groups[0].sessions.push(session)
    } else if (ts >= yesterday) {
      groups[1].sessions.push(session)
    } else if (ts >= weekAgo) {
      groups[2].sessions.push(session)
    } else {
      groups[3].sessions.push(session)
    }
  }

  return groups.filter(g => g.sessions.length > 0)
})

function formatSessionTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000

  if (ts >= today) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (ts >= yesterday) {
    return '昨天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (ts >= today - 7 * 86400000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[d.getDay()] + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

function clearAllSessions() {
  showClearAllSessionsConfirm.value = true
}

function confirmClearAllSessions() {
  for (const session of chatSessions.value) {
    sessionStorage.removeItem('limao_session_' + session.id)
    localStorage.removeItem('limao_session_msgs_' + session.id)
  }
  chatSessions.value = []
  currentSessionId.value = null
  messages.value = []
  localStorage.removeItem('limao_last_session')
  saveSessionsToStorage()
  showClearAllSessionsConfirm.value = false
}

const fiftyWarningDismissed = ref(false)
// 50 轮提醒
const showFiftyWarning = computed(() => {
  return !fiftyWarningDismissed.value && chatRoundCount.value >= 50 && messages.value.length > 0
})

async function deleteApiKey() {
  const modelId = configModel.value
  if (apiKeys[modelId]) {
    delete apiKeys[modelId]
    localStorage.setItem('limao_api_keys', JSON.stringify(apiKeys))
    customModels.value = customModels.value.filter(m => m.id !== modelId)
    saveCustomModels()
    if (selectedModel.value === modelId) {
      const configured = Object.keys(apiKeys)
      if (configured.length > 0) {
        selectedModel.value = configured[0]
      }
    }
    // 已登录：同步到服务端
    if (props.isLoggedIn && props.token) {
      try {
        await fetch(`${API_BASE}/ai/data/keys/${modelId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${props.token}` }
        })
      } catch (e) {
        console.warn('[API Keys] 服务端删除失败:', e)
      }
    }
  }
}

function confirmDeleteKey() {
  deleteApiKey()
  showDeleteKeyConfirm.value = false
}

function getModelName() {
  return modelNames[selectedModel.value]
}

function getWaitingTip() {
  const elapsed = waitingElapsed.value
  const preset = modelPresetConfigs[selectedModel.value]
  const isFree = preset?.isFree
  
  if (elapsed < 3) return '正在思考'

  if (!isFree) {
    if (elapsed < 8) return '模型正在处理，请稍候'
    if (elapsed < 15) return '模型深度推理中，请耐心等待'
    return '响应超时，请检查 API Key 是否有效，或切换模型重试'
  }

  const isChinese = preset?.isChinese || false

  if (isChinese) {
    if (elapsed < 8) return 'NVIDIA 代理的国产模型响应较慢，请耐心等待'
    if (elapsed < 15) return '建议切换为国外模型，或使用自定义 API 直接接入国产模型'
    return '响应时间较长，可继续等待，或停止后切换模型'
  } else {
    if (elapsed < 8) return '模型响应较慢，请耐心等待'
    if (elapsed < 15) return '网络延迟或模型正在处理，请稍后'
    return '响应时间较长，可继续等待，或停止后重试'
  }
}

function startWaitingTimer() {
  waitingElapsed.value = 0
  if (waitingTimer) clearInterval(waitingTimer)
  waitingTimer = setInterval(() => {
    waitingElapsed.value++
  }, 1000)
}

function stopWaitingTimer() {
  if (waitingTimer) {
    clearInterval(waitingTimer)
    waitingTimer = null
  }
}

function setMode(mode) {
  if (mode === 'image') {
    const isCurrentImageModel = modelPresetConfigs[selectedModel.value]?.isImageModel
    if (!isCurrentImageModel) {
      selectModel('nvidia_flux_klein')
    }
  }
  if (mode === 'video') {
    const isCurrentVideoModel = modelPresetConfigs[selectedModel.value]?.isVideoModel
    if (!isCurrentVideoModel) {
      selectModel('wavespeed_wan_t2v_fast')
    }
  }
  inputMessage.value = modePrompts[mode]
  nextTick(() => {
    sendMessage()
  })
}

function setQuickInput(text) {
  inputMessage.value = text
  nextTick(() => {
    sendMessage()
  })
}

function formatTime(time) {
  if (!time) return ''
  const date = typeof time === 'string' ? new Date(time) : time
  if (!(date instanceof Date) || isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const mdCache = new Map()
const MD_CACHE_MAX = 50

function escapeHtmlAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function addWatermarkToImage(imageSrc, watermarkText) {
  return new Promise((resolve) => {
    if (!imageSrc) return resolve(imageSrc)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = function () {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const fontSize = Math.max(16, Math.round(canvas.width * 0.028))
        const margin = fontSize * 1.5

        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
        const textMetrics = ctx.measureText(watermarkText)
        const textWidth = textMetrics.width

        const x = canvas.width - textWidth - margin
        const y = canvas.height - margin

        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
        ctx.shadowBlur = fontSize * 0.5
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(watermarkText, x, y)
        ctx.restore()

        const dataURL = canvas.toDataURL('image/png', 0.92)
        resolve(dataURL)
      } catch (e) {
        console.warn('水印添加失败，返回原图:', e)
        resolve(imageSrc)
      }
    }
    img.onerror = function () {
      console.warn('图片加载失败，跳过水印')
      resolve(imageSrc)
    }
    img.src = imageSrc
  })
}

function renderMarkdown(content, isStreaming = false) {
  if (!content) return ''
  if (!isStreaming) {
    const cached = mdCache.get(content)
    if (cached) return cached
  }
  let result
  try {
    let processed = content
    processed = processed.replace(/🎬\s*\[视频已生成\]\((https?:\/\/[^\s)]+\.(?:mp4|webm|mov)[^\s)]*)\)/g,
      (match, url) => `<video src="${escapeHtmlAttr(url)}" controls autoplay loop muted playsinline style="max-width:100%;max-height:480px;border-radius:8px;margin:8px 0;display:block"></video>`)
    processed = processed.replace(/🎬\s*\[视频已生成\]\((https?:\/\/[^\s)]+)\)/g,
      (match, url) => `<video src="${escapeHtmlAttr(url)}" controls autoplay loop muted playsinline style="max-width:100%;max-height:480px;border-radius:8px;margin:8px 0;display:block"></video>`)
    result = DOMPurify.sanitize(marked.parse(processed), {
      ADD_TAGS: ['video'],
      ADD_ATTR: ['controls', 'autoplay', 'loop', 'muted', 'playsinline']
    })
  } catch {
    result = DOMPurify.sanitize(content.replace(/\n/g, '<br>'))
  }
  if (!isStreaming) {
    if (mdCache.size >= MD_CACHE_MAX) {
      const firstKey = mdCache.keys().next().value
      mdCache.delete(firstKey)
    }
    mdCache.set(content, result)
  }
  return result
}

// 语言到文件扩展名映射
const langExtensionMap = {
  javascript: 'js', js: 'js', jsx: 'jsx', typescript: 'ts', ts: 'ts', tsx: 'tsx',
  vue: 'vue', html: 'html', htm: 'htm', css: 'css', scss: 'scss', less: 'less',
  python: 'py', py: 'py', java: 'java', cpp: 'cpp', c: 'c', 'c++': 'cpp',
  'c#': 'cs', cs: 'cs', php: 'php', ruby: 'rb', rb: 'rb', go: 'go', rust: 'rs', rs: 'rs',
  swift: 'swift', kt: 'kt', kotlin: 'kt', sql: 'sql',
  json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yml', md: 'md', markdown: 'md',
  txt: 'txt', sh: 'sh', bash: 'sh', shell: 'sh', bat: 'bat', dockerfile: 'dockerfile',
  gradle: 'gradle', toml: 'toml', ini: 'ini', cfg: 'cfg', conf: 'conf',
  env: 'env', gitignore: 'gitignore', docker: 'dockerfile'
}

function findFileInTree(treeNodes, fullPath) {
  for (const node of treeNodes) {
    if (node.path === fullPath) return node
    if (node.children) {
      const found = findFileInTree(node.children, fullPath)
      if (found) return found
    }
  }
  return null
}

async function deleteFileFromWorkspace(filePath) {
  let fullPath = filePath
  if (!fullPath.startsWith('workspace/')) {
    const rootFolder = workspaceFolders.value[0]
    if (rootFolder) {
      fullPath = `${rootFolder.path}/${fullPath}`
    }
  }

  const fileNode = findFileInTree(workspaceFolders.value, fullPath)
  if (!fileNode) return false

  const parentPath = fullPath.split('/').slice(0, -1).join('/')
  const fileName = fullPath.split('/').pop()

  for (const folder of workspaceFolders.value) {
    const idx = folder.children?.findIndex(c => c.path === fullPath)
    if (idx !== undefined && idx !== -1) {
      folder.children.splice(idx, 1)
      break
    }
    const parentNode = findFileInTree([folder], parentPath)
    if (parentNode && parentNode.children) {
      const childIdx = parentNode.children.findIndex(c => c.path === fullPath)
      if (childIdx !== -1) {
        parentNode.children.splice(childIdx, 1)
        break
      }
    }
  }

  if (currentFilePath.value === fullPath) {
    if (editorTabs.value.find(t => t.path === fullPath)) {
      closeTab({ path: fullPath, name: fileName })
    } else {
      closeEditor()
    }
  } else {
    const tabIdx = editorTabs.value.findIndex(t => t.path === fullPath)
    if (tabIdx !== -1) {
      editorTabs.value.splice(tabIdx, 1)
    }
  }

  selectedFilePath.value = ''

  try {
    await idbDeleteFile(fullPath)
  } catch (e) {
    console.warn('[IndexedDB] 删除文件失败:', e)
  }

  if (props.isLoggedIn && props.token && fileNode.fileId) {
    try {
      await fetch(`${API_BASE}/ai/data/files/${fileNode.fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${props.token}` }
      })
    } catch (e) {
      console.warn('[Server] 删除文件失败:', e)
    }
  }

  await saveWorkspaceState()
  return true
}

function findFolderInTree(nodes, folderPath) {
  for (const node of nodes) {
    if (node.type === 'folder' && node.path === folderPath) return node
    if (node.children) {
      const found = findFolderInTree(node.children, folderPath)
      if (found) return found
    }
  }
  return null
}

function collectAllChildFilePaths(folderNode) {
  const paths = []
  function walk(node) {
    if (node.type === 'file') {
      paths.push(node.path)
    } else if (node.children) {
      for (const child of node.children) walk(child)
    }
  }
  walk(folderNode)
  return paths
}

function resolveFolderPath(rawPath) {
  let path = rawPath.replace(/^\.\/?/, '').trim()
  if (!path) return ''
  if (workspaceFolders.value.length === 0) return path

  if (findFolderInTree(workspaceFolders.value, path)) {
    return path
  }

  for (const rootFolder of workspaceFolders.value) {
    if (rootFolder.name === path && rootFolder.type === 'folder') {
      return rootFolder.path
    }

    const directPath = `${rootFolder.path}/${path}`
    if (findFolderInTree(workspaceFolders.value, directPath)) {
      return directPath
    }
  }

  const suffixOrNameMatch = (function findInTree(nodes) {
    for (const node of nodes) {
      if (node.type === 'folder') {
        if (node.path === path || node.path.endsWith('/' + path) || node.name === path) {
          return node.path
        }
      }
      if (node.children) {
        const found = findInTree(node.children)
        if (found) return found
      }
    }
    return null
  })(workspaceFolders.value)
  if (suffixOrNameMatch) {
    return suffixOrNameMatch
  }

  if (path.includes('/')) {
    const targetName = path.split('/').pop()
    const nameMatch = (function findByName(nodes) {
      for (const node of nodes) {
        if (node.type === 'folder' && node.name === targetName) return node.path
        if (node.children) {
          const found = findByName(node.children)
          if (found) return found
        }
      }
      return null
    })(workspaceFolders.value)
    if (nameMatch) {
      return nameMatch
    }
  }

  return path
}

async function deleteFolderFromWorkspace(rawFolderPath) {
  if (!rawFolderPath || !rawFolderPath.trim()) return -1
  const resolvedPath = resolveFolderPath(rawFolderPath)
  if (!resolvedPath) return -1

  let folderNode = findFolderInTree(workspaceFolders.value, resolvedPath)

  if (!folderNode) {
    const targetName = resolvedPath.split('/').pop()
    const found = (function findByName(nodes) {
      for (const node of nodes) {
        if (node.type === 'folder' && node.name === targetName) return node
        if (node.children) {
          const f = findByName(node.children)
          if (f) return f
        }
      }
      return null
    })(workspaceFolders.value)
    if (found) {
      folderNode = found
    }
  }

  if (!folderNode) {
    console.warn(`[DELETE FOLDER] 文件夹不存在，跳过: "${rawFolderPath}"`)
    return -1
  }

  const rootIndex = workspaceFolders.value.findIndex(n => n === folderNode)
  const isRootFolder = rootIndex !== -1

  const childFiles = collectAllChildFilePaths(folderNode)
  const totalCount = childFiles.length

  try {
    await deleteFilesByFolder(folderNode.path)
  } catch (e) {
    console.warn('[IndexedDB] 删除文件夹文件失败:', e)
  }

  if (props.isLoggedIn && props.token) {
    const folderName = folderNode.path.replace(/^workspace\//, '')
    try {
      await fetch(`${API_BASE}/ai/data/files/folder?prefix=${encodeURIComponent(folderName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${props.token}` }
      })
    } catch (e) {
      console.warn('[Server] 删除文件夹失败:', e)
    }
  }

  if (isRootFolder) {
    workspaceFolders.value.splice(rootIndex, 1)
  } else {
    (function removeFromParent(nodes) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i] === folderNode) {
          nodes.splice(i, 1)
          return true
        }
        if (nodes[i].children && removeFromParent(nodes[i].children)) return true
      }
      return false
    })(workspaceFolders.value)
  }

  await saveWorkspaceState()
  editorApplyNotice.value = `🗑️ 已删除文件夹 ${folderNode.name}（${totalCount} 个文件）`
  setTimeout(() => { editorApplyNotice.value = '' }, 3000)
  return totalCount
}

function checkIfNeedsContinuation(content) {
  const codeBlockCount = (content.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) return true

  if (content.includes('`') && (content.match(/`/g) || []).length % 2 !== 0) {
    const inlineBlocks = content.match(/`[^`]+`/g) || []
    const singleTicks = (content.match(/[^`]`[^`]|^`[^`]|[^`]`$/g) || []).length
    if (singleTicks > 0 && singleTicks > inlineBlocks.length) return true
  }

  const fileMarkerRegex = /---\s*(?!DELETE|MOVE|SEARCH|FETCH)(.+?)\s*---\s*$/gm
  const fileMarkers = []
  let m
  while ((m = fileMarkerRegex.exec(content)) !== null) {
    fileMarkers.push(m[1].trim())
  }

  const completedFileRegex = /---\s*(.+?)\s*---\s*\n```[\s\S]*?```/g
  const completedFiles = []
  while ((m = completedFileRegex.exec(content)) !== null) {
    completedFiles.push(m[1].trim())
  }

  if (fileMarkers.length > completedFiles.length) return true

  if (fileMarkers.length === 0 && completedFiles.length === 0 && !codeBlockCount) {
    return false
  }

  const lastChars = content.trim().slice(-3)
  if (lastChars === '...' || lastChars === '…' || lastChars === '。。。') return true

  const lastLine = content.trim().split('\n').pop()
  if (lastLine && /^(import|const|let|var|function|class|export|return|if|else|for|while|try|catch|switch|case|async|await)\s/.test(lastLine.trim())) {
    return true
  }

  if (lastLine && lastLine.trim().endsWith('{')) return true
  if (lastLine && lastLine.trim().endsWith('(')) return true
  if (lastLine && lastLine.trim().endsWith('[')) return true
  if (lastLine && lastLine.trim().endsWith(',')) return true
  if (lastLine && lastLine.trim().endsWith('&&')) return true
  if (lastLine && lastLine.trim().endsWith('||')) return true
  if (lastLine && lastLine.trim().endsWith('=>')) return true
  if (lastLine && lastLine.trim().endsWith(':')) return true
  if (lastLine && lastLine.trim().endsWith('+')) return true
  if (lastLine && lastLine.trim().endsWith('-')) return true

  const openBraces = (content.match(/[{\[(]/g) || []).length
  const closeBraces = (content.match(/[}\])]/g) || []).length
  if (openBraces > closeBraces + 2) return true

  return false
}

let autoContinueCount = 0
const MAX_AUTO_CONTINUE = 10

async function autoContinueGeneration(previousContent) {
  if (isLoading.value) return
  if (autoContinueCount >= MAX_AUTO_CONTINUE) {
    autoContinueCount = 0
    editorApplyNotice.value = '⚠️ 自动续写已达上限，请手动发送"继续"'
    setTimeout(() => { editorApplyNotice.value = '' }, 5000)
    return
  }

  autoContinueCount++
  editorApplyNotice.value = `🔄 检测到输出不完整，自动续写中... (${autoContinueCount}/${MAX_AUTO_CONTINUE})`

  const codeBlockCount = (previousContent.match(/```/g) || []).length
  const hasUnclosedBlock = codeBlockCount % 2 !== 0

  let continueMessage = ''
  const isContinueAgent = aiMode.value === 'agent'
  if (hasUnclosedBlock) {
    const lastBlockStart = previousContent.lastIndexOf('```')
    const afterBlockStart = previousContent.slice(lastBlockStart + 3)
    const langLine = afterBlockStart.split('\n')[0]
    const fileName = previousContent.match(/---\s*(?!DELETE|MOVE|SEARCH|FETCH)(.+?)\s*---\s*$/gm)
    const lastFile = fileName ? fileName[fileName.length - 1].replace(/---\s*/g, '').trim() : ''
    if (isContinueAgent) {
      continueMessage = `继续输出 ${lastFile} 的代码，从中断处继续。只输出剩余代码，不重复已输出部分，不输出解释。用三个反引号关闭代码块。`
    } else {
      continueMessage = `请继续输出 ${lastFile} 的代码，从上次中断的地方继续。直接输出剩余代码，不要重复已输出的部分。用三个反引号关闭代码块。`
    }
  } else {
    const fileMarkerRegex = /---\s*(?!DELETE|MOVE|SEARCH|FETCH)(.+?)\s*---\s*$/gm
    const allMarkers = []
    let m
    while ((m = fileMarkerRegex.exec(previousContent)) !== null) {
      allMarkers.push(m[1].trim())
    }
    const completedFileRegex = /---\s*(.+?)\s*---\s*\n```[\s\S]*?```/g
    const completedFiles = []
    while ((m = completedFileRegex.exec(previousContent)) !== null) {
      completedFiles.push(m[1].trim())
    }
    const pendingFiles = allMarkers.filter(f => !completedFiles.includes(f))

    if (pendingFiles.length > 0) {
      if (isContinueAgent) {
        continueMessage = `继续输出以下文件的代码：${pendingFiles.join('、')}。只输出代码，不重复已输出文件，不输出解释。`
      } else {
        continueMessage = `请继续输出以下文件的代码：${pendingFiles.join('、')}。直接输出代码，不要重复已输出的文件。`
      }
    } else if (allMarkers.length === 0 && completedFiles.length === 0) {
      autoContinueCount = 0
      editorApplyNotice.value = ''
      return
    } else {
      if (isContinueAgent) {
        continueMessage = '继续输出剩余代码文件，从中断处继续。只输出代码，不重复已输出部分，不输出解释。'
      } else {
        continueMessage = '请继续输出剩余的代码文件，从上次中断的地方继续。直接输出代码，不要重复已输出的部分。'
      }
    }
  }

  inputMessage.value = continueMessage
  await nextTick()
  sendMessage()
}

function generateCompletionSummary(content) {
  const fileBlockRegex = /---\s*(.+?)\s*---\s*\n*\s*```(\w*)\n([\s\S]*?)```/g
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const deleteRegex = /---\s*DELETE\s+(?!FOLDER\s)(.+?)\s*---/g
  const deleteFolderRegex = /---\s*DELETE\s+FOLDER\s+(.+?)\s*---/g
  const moveRegex = /---\s*MOVE\s+(.+?)\s*->\s*(.+?)\s*---/g

  const files = []
  let match
  while ((match = fileBlockRegex.exec(content)) !== null) {
    const p = match[1].trim()
    if (!p.toUpperCase().startsWith('DELETE') && !p.toUpperCase().startsWith('MOVE')
        && !p.toUpperCase().startsWith('SEARCH') && !p.toUpperCase().startsWith('FETCH')) {
      files.push({ path: p, lang: match[2] || 'text', lines: match[3].split('\n').length })
    }
  }

  const deletedFiles = []
  while ((match = deleteRegex.exec(content)) !== null) {
    deletedFiles.push(match[1].trim())
  }

  const deletedFolders = []
  while ((match = deleteFolderRegex.exec(content)) !== null) {
    deletedFolders.push(match[1].trim())
  }

  const movedFiles = []
  while ((match = moveRegex.exec(content)) !== null) {
    movedFiles.push({ from: match[1].trim(), to: match[2].trim() })
  }

  const codeBlocks = []
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({ lang: match[1] || 'text', lines: match[2].split('\n').length })
  }

  const openCodeBlocks = (content.match(/```/g) || []).length
  const hasIncompleteBlock = openCodeBlocks % 2 !== 0

  const isAgent = aiMode.value === 'agent'

  if (hasIncompleteBlock) {
    editorApplyNotice.value = '⚠️ 代码输出不完整，部分代码块未关闭，请继续对话让 AI 补全'
    setTimeout(() => { editorApplyNotice.value = '' }, 8000)
    return
  }

  const parts = []
  if (files.length > 0) {
    const fileList = files.map(f => `📄 ${f.path} (${f.lines}行)`).join('  ')
    parts.push(`修改 ${files.length} 个文件: ${fileList}`)
  }
  if (movedFiles.length > 0) {
      const moveList = movedFiles.map(f => `📦 ${f.from}→${f.to}`).join('  ')
      parts.push(`移动 ${movedFiles.length} 个文件: ${moveList}`)
  }
  if (deletedFiles.length > 0) {
    const delList = deletedFiles.map(f => `🗑️ ${f}`).join('  ')
    parts.push(`删除 ${deletedFiles.length} 个文件: ${delList}`)
  }
  if (deletedFolders.length > 0) {
    const folderList = deletedFolders.map(f => `📁 ${f}`).join('  ')
    parts.push(`删除 ${deletedFolders.length} 个文件夹: ${folderList}`)
  }

  if (parts.length > 0) {
    const prefix = isAgent ? '✅ 智能体任务完成 — ' : '✅ AI 完成 — '
    editorApplyNotice.value = prefix + parts.join(' | ')
    autoContinueCount = 0
    setTimeout(() => { editorApplyNotice.value = '' }, 6000)
  } else if (codeBlocks.length > 0) {
    const totalLines = codeBlocks.reduce((sum, b) => sum + b.lines, 0)
    if (isAgent) {
      editorApplyNotice.value = `✅ 智能体任务完成 — 已生成 ${codeBlocks.length} 段代码，共 ${totalLines} 行`
    } else {
      editorApplyNotice.value = `✅ AI 已生成 ${codeBlocks.length} 段代码，共 ${totalLines} 行`
    }
    setTimeout(() => { editorApplyNotice.value = '' }, 5000)
  } else {
    if (isAgent) {
      editorApplyNotice.value = '✅ 智能体任务完成'
    } else {
      editorApplyNotice.value = '✅ AI 回复完成'
    }
    setTimeout(() => { editorApplyNotice.value = '' }, 3000)
  }
}

async function autoApplyCodeFromAI(content) {
  const generatingTab = editorTabs.value.find(t => t.name && t.name.startsWith('generating.'))
  if (generatingTab) {
    editorTabs.value = editorTabs.value.filter(t => t !== generatingTab)
    if (activeTab.value === generatingTab.path) {
      activeTab.value = editorTabs.value.length > 0 ? editorTabs.value[editorTabs.value.length - 1].path : null
    }
  }

  const deleteRegex = /---\s*DELETE\s+(?!FOLDER\s)(.+?)\s*---/g
  const deletedFiles = []
  let delMatch
  while ((delMatch = deleteRegex.exec(content)) !== null) {
    const filePath = delMatch[1].trim()
    deletedFiles.push(filePath)
  }

  if (deletedFiles.length > 0 && aiMode.value === 'agent') {
    for (const rawPath of deletedFiles) {
      // 检查是否已经执行过该指令（避免重复执行）
      if (executedInstructions.has(`DELETE:${rawPath}`)) {
        console.log(`[autoApply] 跳过已执行的DELETE指令: "${rawPath}"`)
        continue
      }
      
      // 智能路径解析：与liveWriteToEditor保持一致
      let resolvedPath = rawPath
      
      for (const rootFolder of workspaceFolders.value) {
        const directPath = `${rootFolder.path}/${rawPath}`
        if (findFileInTree(workspaceFolders.value, directPath)) {
          resolvedPath = directPath
          break
        }
        
        const subDirs = ['frontend', 'backend', 'shared']
        for (const subDir of subDirs) {
          const subPath = `${rootFolder.path}/${subDir}/${rawPath}`
          if (findFileInTree(workspaceFolders.value, subPath)) {
            resolvedPath = subPath
            break
          }
        }
      }

      console.log(`[autoApply] DELETE 路径解析: "${rawPath}" → "${resolvedPath}"`)

      if (!findFileInTree(workspaceFolders.value, resolvedPath)) {
        const fallbackPath = resolveFilePath(rawPath)
        if (findFileInTree(workspaceFolders.value, fallbackPath)) {
          resolvedPath = fallbackPath
          console.log(`[autoApply] DELETE 兜底路径解析成功: "${rawPath}" → "${resolvedPath}"`)
        }
      }

      const deleted = await deleteFileFromWorkspace(resolvedPath)
      if (deleted) {
        editorApplyNotice.value = `🗑️ 已删除 ${rawPath}`
        setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      } else {
        console.warn(`[DELETE] 未找到文件: ${rawPath} → ${resolvedPath}`)
      }
    }
  }

  const deleteFolderRegex = /---\s*DELETE\s+FOLDER\s+(.+?)\s*---/g
  const deletedFolders = []
  let delFolderMatch
  while ((delFolderMatch = deleteFolderRegex.exec(content)) !== null) {
    deletedFolders.push(delFolderMatch[1].trim())
  }

  if (deletedFolders.length > 0 && aiMode.value === 'agent') {
    for (const rawPath of deletedFolders) {
      if (!rawPath) continue
      const resolvedFolderPath = resolveFolderPath(rawPath)
      if (!resolvedFolderPath) continue
      
      console.log(`[autoApply] DELETE FOLDER 路径解析: "${rawPath}" → "${resolvedFolderPath}"`)
      
      if (resolvedFolderPath === 'workspace') {
        console.warn(`[DELETE FOLDER] 不允许删除工作区根目录`)
        continue
      }

      if (executedInstructions.has(`DELETE_FOLDER:${resolvedFolderPath}`)) {
        console.log(`[autoApply] 跳过已执行的DELETE FOLDER指令: "${resolvedFolderPath}"`)
        continue
      }
      
      const count = await deleteFolderFromWorkspace(resolvedFolderPath)
      if (count > 0) {
        editorApplyNotice.value = `🗑️ 已删除文件夹 ${rawPath}（${count} 个文件）`
        setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      } else if (count === 0) {
        editorApplyNotice.value = `🗑️ 已删除空文件夹 ${rawPath}`
        setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      }
    }
  }

  const moveRegex = /---\s*MOVE\s+(.+?)\s*->\s*(.+?)\s*---/g
  const movedFiles = []
  let moveMatch
  while ((moveMatch = moveRegex.exec(content)) !== null) {
    movedFiles.push({ from: moveMatch[1].trim(), to: moveMatch[2].trim() })
  }

  if (movedFiles.length > 0 && aiMode.value === 'agent') {
    await ensureWorkspace()
    for (const { from, to } of movedFiles) {
      const fromPath = resolveFilePath(from)
      const toPath = resolveFilePath(to)
      if (fromPath === toPath) continue

      const sourceFile = findFileInTree(workspaceFolders.value, fromPath)
      if (!sourceFile) {
        console.warn(`[MOVE] 源文件不存在: ${fromPath}`)
        continue
      }

      const content = sourceFile._cachedContent || ''
      const fileName = toPath.split('/').pop()

      const pathParts = toPath.split('/')
      if (pathParts.length > 2) {
        let current = workspaceFolders.value[0]
        for (let i = 2; i < pathParts.length - 1; i++) {
          const subFolderName = pathParts[i]
          let subFolder = current?.children?.find(c => c.type === 'folder' && c.name === subFolderName)
          if (!subFolder) {
            subFolder = {
              name: subFolderName,
              path: pathParts.slice(0, i + 1).join('/'),
              type: 'folder',
              children: [],
              _cachedContent: null
            }
            if (!current.children) current.children = []
            current.children.push(subFolder)
            expandedFolders.value.add(subFolder.path)
          }
          current = subFolder
        }
      }

      const parentPath = toPath.split('/').slice(0, -1).join('/')
      let parent = findFileInTree(workspaceFolders.value, parentPath)
      if (!parent) parent = workspaceFolders.value[0]
      if (parent && parent.children) {
        parent.children.push({
          name: fileName,
          path: toPath,
          type: 'file',
          isText: true,
          _cachedContent: content,
          fromIDB: true
        })
        expandedFolders.value.add(parentPath)
      }

      saveFileToServer(fileName, toPath, content)
      try {
        await idbSaveFile(toPath, content, {
          folderPath: toPath.split('/').slice(0, 2).join('/'),
          name: fileName,
          language: fileName.split('.').pop() || 'text'
        })
      } catch (e) {
        console.warn('[IndexedDB] MOVE保存失败:', e)
      }

      await deleteFileFromWorkspace(fromPath)

      editorApplyNotice.value = `📦 已移动 ${from} → ${to}`
      setTimeout(() => { editorApplyNotice.value = '' }, 3000)
    }
    await saveWorkspaceState()
  }

  const fileBlockRegex = /---\s*(.+?)\s*---\s*\n*\s*```(\w*)\n([\s\S]*?)```/g
  const fileChanges = []
  let match
  while ((match = fileBlockRegex.exec(content)) !== null) {
    let filePath = match[1].trim()
    const upperPath = filePath.toUpperCase()
    if (upperPath === 'DELETE' || upperPath.startsWith('DELETE ') || upperPath.startsWith('DELETE FOLDER') || upperPath.startsWith('MOVE') || upperPath.startsWith('SEARCH') || upperPath.startsWith('FETCH') || upperPath.startsWith('FORUM')) continue
    fileChanges.push({ rawPath: filePath, lang: match[2] || 'text', code: match[3], name: filePath.split('/').pop() })
  }

  if (fileChanges.length > 0) {
    await ensureWorkspace()
    const isAgent = aiMode.value === 'agent'
    const changes = []
    for (const change of fileChanges) {
      let fullPath = resolveFilePath(change.rawPath)
      const pathParts = fullPath.split('/')

      if (isAgent) {
        if (pathParts.length > 2) {
          let current = workspaceFolders.value[0]
          for (let i = 2; i < pathParts.length - 1; i++) {
            const subFolderName = pathParts[i]
            let subFolder = current?.children?.find(c => c.type === 'folder' && c.name === subFolderName)
            if (!subFolder) {
              subFolder = {
                name: subFolderName,
                path: pathParts.slice(0, i + 1).join('/'),
                type: 'folder',
                children: [],
                _cachedContent: null
              }
              if (!current.children) current.children = []
              current.children.push(subFolder)
              expandedFolders.value.add(subFolder.path)
            }
            current = subFolder
          }
        }
      }

      const fileNode = findFileInTree(workspaceFolders.value, fullPath)
      const oldContent = fileNode?._cachedContent || ''

      if (isAgent) {
        if (fileNode) {
          fileNode._cachedContent = change.code
        } else {
          const parentPath = pathParts.slice(0, pathParts.length - 1).join('/')
          let parent = findFileInTree(workspaceFolders.value, parentPath)
          if (!parent) parent = workspaceFolders.value[0]
          if (parent && parent.children) {
            parent.children.push({
              name: change.name,
              path: fullPath,
              type: 'file',
              isText: true,
              _cachedContent: change.code,
              fromIDB: true
            })
          }
          expandedFolders.value.add(parentPath)
        }
        saveFileToServer(change.name, fullPath, change.code)
        try {
          await idbSaveFile(fullPath, change.code, {
            folderPath: fullPath.split('/').slice(0, 2).join('/'),
            name: change.name,
            language: change.lang
          })
        } catch (e) {
          console.warn('[IndexedDB] 智能体持久化失败:', e)
        }
        changes.push({ path: fullPath, name: change.name, oldContent, newContent: change.code, lang: change.lang })
      } else {
        changes.push({ path: fullPath, name: change.name, oldContent, newContent: change.code, lang: change.lang, isNewFile: !fileNode })
      }
    }

    if (changes.length > 0) {
      if (isAgent) {
        editorApplyNotice.value = `智能体已自动应用 ${changes.length} 个文件更改`
        setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      } else {
        changes.forEach(computeDiffStats)
        pendingChanges.value = changes
        showApplyModal.value = true
        editorApplyNotice.value = `AI 生成了 ${changes.length} 个文件更改`
        setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      }
    }
    if (isAgent && showEditor.value && currentFilePath.value) {
      const currentChange = changes.find(c => c.path === currentFilePath.value)
      if (currentChange) {
        if (monacoRef.value) {
          monacoRef.value.applyAIEdit(currentChange.newContent)
        } else {
          editorContent.value = currentChange.newContent
        }
        originalContent.value = currentChange.newContent
        isModified.value = false
      }
    }
    return
  }

  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const blocks = []
  let blockMatch
  while ((blockMatch = codeBlockRegex.exec(content)) !== null) {
    blocks.push({ lang: blockMatch[1] || 'text', code: blockMatch[2] })
  }
  if (blocks.length === 0) return

  const filenameBlockRegex = /```(\w*)\n((?:\/\/|#|\/\*|--|<!--)\s*(?:filename|filepath|file):\s*.+?[\s\S]*?)```/g
  const namedBlocks = []
  let nbMatch
  while ((nbMatch = filenameBlockRegex.exec(content)) !== null) {
    const lang = nbMatch[1] || 'text'
    const raw = nbMatch[2]
    const lines = raw.split('\n')
    const filenameMatch = lines[0]?.match(/(?:\/\/|#|\/\*|--|<!--)\s*(?:filename|filepath|file):\s*(.+?)(?:\s*\*\/|-->\s*)?\s*$/i)
    if (filenameMatch) {
      const filename = filenameMatch[1].trim()
      lines.shift()
      namedBlocks.push({ lang, code: lines.join('\n').trim(), filename })
    }
  }

  if (namedBlocks.length > 0) {
    await ensureWorkspace()
    const isNamedAgent = aiMode.value === 'agent'
    const changes = []
    for (const nb of namedBlocks) {
      let fullPath = resolveFilePath(nb.filename)
      const fileNode = findFileInTree(workspaceFolders.value, fullPath)
      const oldContent = fileNode?._cachedContent || ''
      if (isNamedAgent) {
        if (fileNode) {
          fileNode._cachedContent = nb.code
        } else {
          const pathParts = fullPath.split('/')
          if (pathParts.length > 2) {
            let current = workspaceFolders.value[0]
            for (let i = 2; i < pathParts.length - 1; i++) {
              const subFolderName = pathParts[i]
              let subFolder = current?.children?.find(c => c.type === 'folder' && c.name === subFolderName)
              if (!subFolder) {
                subFolder = { name: subFolderName, path: pathParts.slice(0, i + 1).join('/'), type: 'folder', children: [], _cachedContent: null }
                if (!current.children) current.children = []
                current.children.push(subFolder)
                expandedFolders.value.add(subFolder.path)
              }
              current = subFolder
            }
          }
          const parentPath = fullPath.split('/').slice(0, -1).join('/')
          let parent = findFileInTree(workspaceFolders.value, parentPath)
          if (!parent) parent = workspaceFolders.value[0]
          if (parent && parent.children) {
            parent.children.push({
              name: nb.filename,
              path: fullPath,
              type: 'file',
              isText: true,
              _cachedContent: nb.code,
              fromIDB: true
            })
            expandedFolders.value.add(parentPath)
          }
        }
        saveFileToServer(nb.filename, fullPath, nb.code)
        try {
          await idbSaveFile(fullPath, nb.code, {
            folderPath: fullPath.split('/').slice(0, 2).join('/'),
            name: nb.filename,
            language: nb.lang
          })
        } catch (e) {
          console.warn('[IndexedDB] AI 保存文件失败:', e)
        }
      }
      changes.push({
        path: fullPath,
        name: nb.filename,
        oldContent,
        newContent: nb.code,
        lang: nb.lang,
        isNewFile: !fileNode
      })
    }
    if (changes.length > 0) {
      if (isNamedAgent) {
        editorApplyNotice.value = `智能体已自动应用 ${changes.length} 个文件更改`
        setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      } else {
        changes.forEach(computeDiffStats)
        pendingChanges.value = changes
        showApplyModal.value = true
        editorApplyNotice.value = `AI 生成了 ${changes.length} 个文件更改`
        setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      }
    }
    if (isNamedAgent && showEditor.value && currentFilePath.value) {
      const currentChange = changes.find(c => c.path === currentFilePath.value)
      if (currentChange) {
        if (monacoRef.value) {
          monacoRef.value.applyAIEdit(currentChange.newContent)
        } else {
          editorContent.value = currentChange.newContent
        }
        originalContent.value = currentChange.newContent
        isModified.value = false
      }
    }
    return
  }

  if (!showEditor.value || !currentFilePath.value) {
    if (blocks.length > 0) {
      await ensureWorkspace()
      const isNoEditorAgent = aiMode.value === 'agent'

      const changes = []
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const ext = langExtensionMap[block.lang] || block.lang || 'txt'
        const smartName = inferFileNameFromCode(block.code, ext, i, blocks.length)
        const subFolder = getTargetSubFolder(smartName)
        const folderPath = subFolder ? subFolder.path : workspaceFolders.value[0]?.path || 'workspace/ai-workspace'
        const fullPath = `${folderPath}/${smartName}`

        const existing = findFileInTree(workspaceFolders.value, fullPath)
        const oldContent = existing?._cachedContent || ''

        if (isNoEditorAgent) {
          if (existing) {
            existing._cachedContent = block.code
          } else {
            const parent = subFolder || workspaceFolders.value[0]
            if (parent && parent.children) {
              parent.children.push({
                name: smartName,
                path: fullPath,
                type: 'file',
                isText: true,
                _cachedContent: block.code,
                fromIDB: true
              })
            }
          }
          await saveFileToServer(smartName, fullPath, block.code)
          try {
            await idbSaveFile(fullPath, block.code, {
              folderPath: folderPath,
              name: smartName,
              language: ext
            })
          } catch (e) {
            console.warn('[IndexedDB] AI 自动创建文件失败:', e)
          }
        }

        changes.push({ path: fullPath, name: smartName, oldContent, newContent: block.code, lang: block.lang, isNewFile: !existing })
      }

      if (isNoEditorAgent) {
        expandedFolders.value.add(folderPath)
        await saveWorkspaceState()

        const firstChange = changes[0]
        currentFileName.value = firstChange.name
        currentFilePath.value = firstChange.path
        currentFileType.value = 'text/plain'
        editorContent.value = firstChange.newContent
        originalContent.value = firstChange.newContent
        showEditor.value = true
        isModified.value = false
        selectedFilePath.value = firstChange.path
      }

      if (changes.length > 0) {
        if (isNoEditorAgent) {
          if (changes.length > 1) {
            editorApplyNotice.value = `智能体已在工作区创建 ${changes.length} 个文件`
          } else {
            editorApplyNotice.value = `智能体已在工作区创建 ${changes[0].name}`
          }
          setTimeout(() => { editorApplyNotice.value = '' }, 4000)
        } else {
          changes.forEach(computeDiffStats)
          pendingChanges.value = changes
          showApplyModal.value = true
          editorApplyNotice.value = `AI 生成了 ${changes.length} 个文件更改`
          setTimeout(() => { editorApplyNotice.value = '' }, 3000)
        }
      }
    }
    return
  }

  const ext = currentFilePath.value.split('.').pop()?.toLowerCase() || ''
  const langForExt = Object.entries(langExtensionMap).find(([, v]) => v === ext)
  const currentLang = langForExt ? langForExt[0] : ext

  let bestBlock = null
  if (blocks.length === 1) {
    bestBlock = blocks[0]
  } else {
    const exactMatch = blocks.find(b => b.lang.toLowerCase() === currentLang)
    const extMatch = blocks.find(b => {
      const bExt = langExtensionMap[b.lang.toLowerCase()]
      return bExt === ext
    })
    bestBlock = extMatch || exactMatch || blocks[0]
  }

  if (bestBlock) {
    const oldContent = editorContent.value
    const isEditorAgent = aiMode.value === 'agent'
    if (isEditorAgent) {
      if (monacoRef.value) {
        monacoRef.value.applyAIEdit(bestBlock.code)
      } else {
        editorContent.value = bestBlock.code
      }
      isModified.value = true
      saveFileToServer(currentFileName.value, currentFilePath.value, bestBlock.code)
      originalContent.value = bestBlock.code
      const fileNode = findFileInTree(workspaceFolders.value, currentFilePath.value)
      if (fileNode) fileNode._cachedContent = bestBlock.code
      try {
        await idbSaveFile(currentFilePath.value, bestBlock.code, {
          folderPath: currentFilePath.value.split('/').slice(0, 2).join('/'),
          name: currentFileName.value,
          language: ext
        })
      } catch (e) {
        console.warn('[IndexedDB] AI 保存失败:', e)
      }
      editorApplyNotice.value = `智能体已自动应用 ${currentFileName.value}`
      setTimeout(() => { editorApplyNotice.value = '' }, 3000)
    } else {
      const singleChange = {
        path: currentFilePath.value,
        name: currentFileName.value,
        oldContent,
        newContent: bestBlock.code
      }
      computeDiffStats(singleChange)
      pendingChanges.value = [singleChange]
      showApplyModal.value = true
      editorApplyNotice.value = `AI 生成了 ${currentFileName.value} 的更改`
      setTimeout(() => { editorApplyNotice.value = '' }, 3000)
    }
  }
}

async function applyCodeToEditorWithTarget(code, lang, filepath) {
  const codeContent = code

  if (filepath && filepath.includes('/')) {
    let fullPath = resolveFilePath(filepath)
    const fileNode = findFileInTree(workspaceFolders.value, fullPath)
    const oldContent = fileNode?._cachedContent || ''
    if (aiMode.value === 'agent') {
      if (fileNode) fileNode._cachedContent = codeContent
      saveFileToServer(fullPath.split('/').pop(), fullPath, codeContent)
      if (fullPath) {
        try {
          await idbSaveFile(fullPath, codeContent, {
            folderPath: fullPath.split('/').slice(0, 2).join('/'),
            name: fullPath.split('/').pop(),
            language: lang || 'text'
          })
        } catch (e) {
          console.warn('[IndexedDB] 智能体自动应用失败:', e)
        }
      }
      showEditor.value = true
      currentFileName.value = fullPath.split('/').pop()
      currentFilePath.value = fullPath
      editorContent.value = codeContent
      originalContent.value = codeContent
      isModified.value = false
      selectedFilePath.value = fullPath
      editorApplyNotice.value = `智能体已自动应用 ${fullPath.split('/').pop()}`
      setTimeout(() => { editorApplyNotice.value = '' }, 3000)
    } else {
      const sc = {
        path: fullPath,
        name: fullPath.split('/').pop(),
        oldContent,
        newContent: codeContent,
        lang: lang,
        isNewFile: !fileNode
      }
      computeDiffStats(sc)
      pendingChanges.value = [sc]
      showApplyModal.value = true
    }
    return
  }

  if (filepath && !filepath.includes('/')) {
    for (const folder of workspaceFolders.value) {
      const fileNode = findFileInTree([folder], filepath)
      if (fileNode) {
        const oldContent = fileNode._cachedContent || ''
        if (aiMode.value === 'agent') {
          fileNode._cachedContent = codeContent
          saveFileToServer(filepath, fileNode.path, codeContent)
          try {
            await idbSaveFile(fileNode.path, codeContent, {
              folderPath: fileNode.path.split('/').slice(0, 2).join('/'),
              name: filepath,
              language: lang || 'text'
            })
          } catch (e) {
            console.warn('[IndexedDB] 智能体自动应用失败:', e)
          }
          showEditor.value = true
          currentFileName.value = filepath
          currentFilePath.value = fileNode.path
          editorContent.value = codeContent
          originalContent.value = codeContent
          isModified.value = false
          selectedFilePath.value = fileNode.path
          editorApplyNotice.value = `智能体已自动应用 ${filepath}`
          setTimeout(() => { editorApplyNotice.value = '' }, 3000)
        } else {
          const sc = {
            path: fileNode.path,
            name: filepath,
            oldContent,
            newContent: codeContent,
            lang: lang
          }
          computeDiffStats(sc)
          pendingChanges.value = [sc]
          showApplyModal.value = true
        }
        return
      }
    }
  }

  applyCodeToEditor(codeContent, lang)
}

async function applyCodeToEditor(code, lang) {
  const ext = langExtensionMap[lang] || lang || 'txt'
  const codeContent = code

  if (showEditor.value && currentFileName.value) {
    const choice = confirm(`当前编辑器已打开 "${currentFileName.value}"。\n\n确定要替换编辑器内容为这段代码吗？\n\n点"确定"替换当前内容，点"取消"则不操作。`)
    if (!choice) return
    editorContent.value = codeContent
    originalContent.value = codeContent
    isModified.value = true
    if (aiMode.value === 'agent') {
      await saveFileToServer(currentFileName.value, currentFilePath.value, codeContent)
    }
    return
  }

  await ensureWorkspace()
  const suggestedName = `untitled.${ext}`
  const subFolder = getTargetSubFolder(suggestedName)
  const folderPath = subFolder ? subFolder.path : workspaceFolders.value[0]?.path || 'workspace/ai-workspace'
  const fullPath = `${folderPath}/${suggestedName}`
  currentFileName.value = suggestedName
  currentFilePath.value = fullPath
  currentFileType.value = 'text/plain'
  editorContent.value = codeContent
  originalContent.value = codeContent
  showEditor.value = true
  isModified.value = false
  if (aiMode.value === 'agent') {
    await saveFileToServer(suggestedName, fullPath, codeContent)
  }
}

function handleMessagesClick(e) {
  const img = e.target.closest('img')
  if (img && img.src) {
    e.preventDefault()
    e.stopPropagation()
    previewImage(img.src)
  }
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function getFileTreeSummary() {
  if (workspaceFolders.value.length === 0) return ''
  const lines = []
  function walk(node, indent) {
    lines.push(indent + (node.type === 'folder' ? '📁 ' : '📄 ') + node.name)
    if (node.children) {
      for (const child of node.children) {
        walk(child, indent + '  ')
      }
    }
  }
  for (const root of workspaceFolders.value) {
    walk(root, '')
  }
  return lines.join('\n')
}

function analyzeTechStack(allFiles, fileContentParts) {
  const indicators = []
  const fileNames = allFiles.map(f => f.name || (f.path ? f.path.split('/').pop() : ''))
  const contents = fileContentParts.join('\n')

  if (fileNames.includes('package.json')) {
    const pkgMatch = contents.match(/---\s*[^-]*package\.json\s*---\s*```[\s\S]*?```/)
    if (pkgMatch) {
      const pkgContent = pkgMatch[0]
      const deps = []
      const depPatterns = [
        ['Vue', /"vue"/], ['React', /"react"/], ['Angular', /"@angular\/core"/],
        ['Express', /"express"/], ['Koa', /"koa"/], ['Fastify', /"fastify"/],
        ['Next.js', /"next"/], ['Nuxt', /"nuxt"/], ['Svelte', /"svelte"/],
        ['Vite', /"vite"/], ['Webpack', /"webpack"/], ['TypeScript', /"typescript"/],
        ['Tailwind CSS', /"tailwindcss"/], ['Element Plus', /"element-plus"/],
        ['Ant Design', /"ant-design-vue"/], ['Axios', /"axios"/],
        ['Prisma', /"prisma"/], ['Mongoose', /"mongoose"/],
        ['Sequelize', /"sequelize"/], ['Socket.IO', /"socket\.io"/],
        ['Three.js', /"three"/], ['ECharts', /"echarts"/],
        ['Pinia', /"pinia"/], ['Vuex', /"vuex"/], ['Redux', /"redux"/],
        ['Zustand', /"zustand"/], ['Day.js', /"dayjs"/], ['Lodash', /"lodash"/]
      ]
      for (const [name, pattern] of depPatterns) {
        if (pattern.test(pkgContent)) deps.push(name)
      }
      if (deps.length > 0) indicators.push(`依赖: ${deps.join(', ')}`)
    }
  }

  const extCounts = {}
  for (const f of allFiles) {
    const ext = (f.name || '').split('.').pop() || ''
    if (ext) extCounts[ext] = (extCounts[ext] || 0) + 1
  }
  const extSummary = Object.entries(extCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ext, count]) => `.${ext}(${count})`)
    .join(', ')
  if (extSummary) indicators.push(`文件类型: ${extSummary}`)

  if (fileNames.includes('app.json') || fileNames.includes('project.config.json')) {
    indicators.push('框架: 微信小程序')
  }
  if (fileNames.some(n => n.endsWith('.wxml'))) indicators.push('模板: WXML')
  if (fileNames.some(n => n.endsWith('.wxss'))) indicators.push('样式: WXSS')
  if (fileNames.some(n => n.endsWith('.vue'))) indicators.push('框架: Vue SFC')
  if (fileNames.some(n => n.endsWith('.jsx') || n.endsWith('.tsx'))) indicators.push('框架: React JSX')
  if (fileNames.some(n => n.endsWith('.svelte'))) indicators.push('框架: Svelte')
  if (fileNames.some(n => n.endsWith('.py'))) indicators.push('语言: Python')
  if (fileNames.some(n => n.endsWith('.java'))) indicators.push('语言: Java')
  if (fileNames.some(n => n.endsWith('.go'))) indicators.push('语言: Go')
  if (fileNames.some(n => n.endsWith('.rs'))) indicators.push('语言: Rust')

  if (/import.*from\s+['"]vue['"]/.test(contents)) indicators.push('运行时: Vue 3 Composition API')
  if (/import.*from\s+['"]react['"]/.test(contents)) indicators.push('运行时: React Hooks')
  if (/createApp|app\.mount/.test(contents)) indicators.push('入口: Vue 3 createApp')
  if (/ReactDOM\.createRoot/.test(contents)) indicators.push('入口: React 18 createRoot')

  return indicators.length > 0 ? indicators.join(' | ') : ''
}

function analyzeImportRelations(allFiles, fileContentParts) {
  const relations = []
  const contents = fileContentParts.join('\n')
  const fileBlockRegex = /---\s*(.+?)\s*---\s*\n*\s*```[\s\S]*?```/g
  const importRegex = /(?:import\s+.*?from\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\))/g

  let blockMatch
  while ((blockMatch = fileBlockRegex.exec(contents)) !== null) {
    const filePath = blockMatch[1].trim()
    const blockContent = blockMatch[0]
    const imports = []
    let importMatch
    while ((importMatch = importRegex.exec(blockContent)) !== null) {
      const importPath = importMatch[1] || importMatch[2]
      if (importPath && !importPath.startsWith('.') && !importPath.startsWith('/')) continue
      imports.push(importPath)
    }
    if (imports.length > 0) {
      relations.push(`${filePath} → ${imports.join(', ')}`)
    }
  }

  return relations.length > 0 ? relations.join('\n') : ''
}

function estimateTokens(text) {
  if (!text) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars * 2 + otherChars * 0.5)
}

async function buildContext() {
  const MAX_TOKENS = 90000
  const allMsgs = messages.value.filter(m => (m.role === 'user' || m.role === 'ai') && m.content)

function buildApiMessage(m) {
  const role = m.role === 'ai' ? 'assistant' : 'user'
  if (m.role === 'user' && m.images && m.images.length > 0 && isVisionModel.value) {
    const content = []
    if (m.content) content.push({ type: 'text', text: m.content })
    for (const imgUrl of m.images) {
      content.push({ type: 'image_url', image_url: { url: imgUrl } })
    }
    return { role, content }
  }
  return { role, content: m.content }
}

  const systemParts = []
  const isAgent = aiMode.value === 'agent'

  const currentModelName = currentModelInfo.value?.name || selectedModel.value
  const currentProvider = currentModelInfo.value?.provider || ''
  const isFreeModel = modelPresetConfigs[selectedModel.value]?.isFree
  const platformIntro = isFreeModel ? '，运行在狸猫AI体验平台上' : ''

  if (isAgent) {
    systemParts.push(`【严格静默模式】你是${currentProvider ? currentProvider + '的' : ''}${currentModelName}${platformIntro}——代码智能体模式。你是用户的专属程序员，负责写代码、修Bug、增删改文件。不聊天、不解释、不寒暄。当用户问你是谁时，如实回答你是${currentModelName}。`)

    systemParts.push('')
    systemParts.push('【任务分类-最高优先级】收到指令立即判断类型执行：')
    systemParts.push('')
    systemParts.push('  ▸ 删除/清理：直接输出操作指令，立即结束，不思考不分析。')
    systemParts.push('    删除文件：  --- DELETE 路径 ---')
    systemParts.push('    删除文件夹：--- DELETE FOLDER 路径 ---')
    systemParts.push('    移动文件：  --- MOVE 旧路径 -> 新路径 ---')
    systemParts.push('')
    systemParts.push('  ▸ 写代码/修改/Bug修复/重构/新功能：执行下方工作流，输出 --- 路径 --- + ```代码```。')

    systemParts.push('')
    systemParts.push('【工作流】')
    systemParts.push('  1. 阅读相关文件，理解代码风格、技术栈、依赖关系')
    systemParts.push('  2. 明确需求本质，找出影响范围，选择最优方案')
    systemParts.push('  3. 输出代码：风格100%一致，复用已有组件和工具函数，只改必要部分')
    systemParts.push('')
    systemParts.push('【代码标准】完整可运行、错误处理完善、安全(参数化查询/XSS防护/SQL注入防御)、性能优先。遵守SOLID/DRY/KISS/YAGNI原则。如不确定API用法，用 --- SEARCH 关键词 --- 或 --- FETCH URL --- 查证。')
    systemParts.push('')
    systemParts.push('【完成后自检】(1)关联文件改了吗 (2)导入路径对吗 (3)类型定义匹配吗 (4)有硬编码吗')
  } else {
    systemParts.push(`你是${currentProvider ? currentProvider + '的' : ''}${currentModelName}${platformIntro}。你是一位知识渊博、热情友好的AI伙伴。当用户问你是谁时，如实回答你是${currentModelName}。`)
    systemParts.push('')
    systemParts.push('【⭐ 核心定位：智能问答助手，绝不生成代码】')
    systemParts.push('  你工作在"智能问答"模式，专门负责：')
    systemParts.push('  1. 💬 技术交流与答疑：用专业但易懂的方式回答编程、架构、算法等技术问题')
    systemParts.push('  2. 🧭 平台功能引导：介绍狸猫AI平台的各项功能入口，帮助用户快速上手')
    systemParts.push('  3. 📖 开源代码解读：解释项目中的代码逻辑、设计模式和实现原理')
    systemParts.push('  4. 💡 技术方案讨论：与用户讨论技术选型、架构设计思路')
    systemParts.push('  5. 📢 论坛与社区：介绍论坛功能，讨论帖子和评论'),
    systemParts.push('  6. 🔧 技术顾问：审查用户分享的代码，指出潜在问题和改进建议')
    systemParts.push('')
    systemParts.push('【🚫 严格禁止生成代码】')
    systemParts.push('  绝对禁止输出任何代码块（```），禁止使用 --- 路径 --- 格式。')
    systemParts.push('  不做代码生成，不写新文件，不修改文件，不删除文件。')
    systemParts.push('  如果用户要求写代码/改代码/修Bug/增删文件，礼貌引导用户切换到"智能体"模式：')
    systemParts.push('  "如需代码操作，请切换到右上角的【智能体】模式，我会在那里为您处理代码任务 😊"')
    systemParts.push('')
    systemParts.push('【专业交流风格】')
    systemParts.push('  · 回答简洁清晰，不说废话')
    systemParts.push('  · 技术解释从浅入深，配合生活中的类比帮助理解')
    systemParts.push('  · 当用户分享代码时，分析代码逻辑、指出问题、给出优化思路（但不输出修改后的代码）')
    systemParts.push('  · 遇到不确定的技术点，使用 --- SEARCH 关键词 --- 联网查证后给出准确回答')
    systemParts.push('  · 使用 --- FORUM posts --- / --- FORUM search 关键词 --- 浏览论坛内容')
  }

  if (showEditor.value && currentFilePath.value && editorContent.value) {
    systemParts.push(`当前编辑文件: ${currentFilePath.value}\n\`\`\`\n${editorContent.value}\n\`\`\``)
  }

  if (runtimeErrors.value.length > 0) {
    const recentErrors = runtimeErrors.value.slice(0, 5)
    const errorParts = recentErrors.map(e => {
      let desc = `[${e.time}] ${e.message}`
      if (e.filename) desc += ` (${e.filename}:${e.lineno}:${e.colno})`
      if (e.stack) desc += `\n${e.stack}`
      return desc
    })
    systemParts.push(`【运行时错误(最近${recentErrors.length}条)】以下是当前应用的运行时错误，修复Bug时优先参考：\n${errorParts.join('\n\n')}`)
  }

  const treeSummary = getFileTreeSummary()
  if (treeSummary) {
    systemParts.push(`工作区文件结构:\n${treeSummary}`)
  }

  const lastUserMsg = allMsgs.filter(m => m.role === 'user').pop()
  if (lastUserMsg) {
    await refreshMemoryCount()
    const memoryCtx = await retrieveMemoriesForContext(
      lastUserMsg.content,
      currentSessionTitle.value || ''
    )
    if (memoryCtx) {
      systemParts.push(memoryCtx)
    }
  }

  systemParts.push(buildAIMemoryContext())

  if (isAgent && workspaceFolders.value.length > 0) {
    await ensureWorkspace()
    const allFiles = []
    for (const folder of workspaceFolders.value) {
      collectAllFiles([folder]).forEach(f => allFiles.push(f))
    }

    const serverFileIds = []
    for (const file of allFiles) {
      if (file._cachedContent === undefined || file._cachedContent === null) {
        if (file.fileId && props.isLoggedIn) {
          serverFileIds.push({ id: file.fileId, path: file.path })
        }
      }
    }

    if (serverFileIds.length > 0) {
      try {
        const res = await fetch(`${API_BASE}/ai/data/files/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${props.token}`
          },
          body: JSON.stringify({ ids: serverFileIds.map(f => f.id) })
        })
        const json = await res.json()
        if (json.success && json.data) {
          for (const sf of json.data) {
            const fileNode = allFiles.find(f => f.fileId === sf.id)
            if (fileNode && sf.content) {
              fileNode._cachedContent = sf.content
            }
          }
        }
      } catch (e) {
        console.warn('[buildContext] 批量获取文件内容失败:', e)
      }
    }

    const fileContentParts = []
    let fileContentTokens = 0
    const MAX_FILE_TOKENS = 60000

    for (const file of allFiles) {
      if (!file.isText && file.type === 'file') continue
      let content = ''

      if (file._cachedContent !== undefined && file._cachedContent !== null) {
        content = file._cachedContent
      } else if (file.fromIDB) {
        try {
          const dbFile = await getFile(file.path)
          content = dbFile ? dbFile.content || '' : ''
          if (content) file._cachedContent = content
        } catch {}
      } else if (file.file) {
        try {
          if (file.isText) {
            content = await file.file.text()
            if (content) file._cachedContent = content
          }
        } catch {}
      }

      if (content) {
        const tokens = estimateTokens(content)
        if (fileContentTokens + tokens > MAX_FILE_TOKENS) break
        fileContentParts.push(`--- ${file.path} ---\n\`\`\`\n${content}\n\`\`\``)
        fileContentTokens += tokens
      }
    }

    if (fileContentParts.length > 0) {
      systemParts.push(`【工作区文件内容(${fileContentParts.length}个)】直接阅读修改，不要要求用户粘贴：`)
      systemParts.push(fileContentParts.join('\n\n'))
    }

    const techStack = analyzeTechStack(allFiles, fileContentParts)
    if (techStack) {
      systemParts.push(`【技术栈】${techStack}`)
    }

    const importRelations = analyzeImportRelations(allFiles, fileContentParts)
    if (importRelations) {
      systemParts.push(`【引用关系】\n${importRelations}`)
    }
  }

  const projectType = detectProjectType()
  const projectTypeLabels = {
    'miniapp': '微信小程序', 'uniapp': 'Uni-app跨平台', 'flutter': 'Flutter APP',
    'android': 'Android原生APP', 'ios': 'iOS原生APP', 'react-native': 'React Native APP',
    'web-vue': 'Vue网页', 'web-react': 'React网页', 'web-svelte': 'Svelte网页',
    'web-static': '静态网页', 'backend-python': 'Python后端', 'backend-java': 'Java后端',
    'backend-go': 'Go后端', 'unknown': '全栈'
  }
  const projectLabel = projectTypeLabels[projectType] || '全栈'

  let pathGuide = ''
  if (projectType === 'miniapp' || projectType === 'uniapp') {
    pathGuide = `当前项目: ${projectLabel}。所有小程序文件(.js/.json/.wxml/.wxss/.css)归frontend/，后端API(.py/.java/.go/.php等)归backend/。例: --- frontend/pages/index/index.wxml ---, --- frontend/app.json ---, --- backend/api/user.py ---`
  } else if (projectType === 'flutter') {
    pathGuide = `当前项目: ${projectLabel}。所有Dart/Flutter代码归frontend/，后端API归backend/。例: --- frontend/lib/main.dart ---, --- frontend/lib/pages/home_page.dart ---, --- backend/api/server.py ---`
  } else if (projectType === 'android') {
    pathGuide = `当前项目: ${projectLabel}。所有Android代码(.java/.kt/.xml布局)归frontend/，后端API归backend/。例: --- frontend/app/src/main/java/com/example/MainActivity.java ---, --- frontend/app/src/main/res/layout/activity_main.xml ---, --- backend/api/server.py ---`
  } else if (projectType === 'ios') {
    pathGuide = `当前项目: ${projectLabel}。所有iOS代码(.swift/.storyboard/.xib)归frontend/，后端API归backend/。例: --- frontend/Views/HomeViewController.swift ---, --- frontend/Views/Main.storyboard ---, --- backend/api/server.py ---`
  } else if (projectType === 'react-native') {
    pathGuide = `当前项目: ${projectLabel}。所有RN代码(.tsx/.jsx/.js)归frontend/，后端API归backend/。例: --- frontend/src/App.tsx ---, --- frontend/src/screens/HomeScreen.tsx ---, --- backend/api/server.py ---`
  } else if (projectType.startsWith('backend-')) {
    pathGuide = `当前项目: ${projectLabel}。所有代码归backend/。例: --- backend/main.py ---, --- backend/routes/api.py ---, --- backend/requirements.txt ---`
  } else {
    pathGuide = `当前项目: ${projectLabel}。前端(.vue/.jsx/.tsx/.html/.css/.scss)归frontend/，后端(.py/.java/.go/.rs/.rb/.php/.cs/.sql)归backend/，共享(.json/.yaml/.md)归shared/。路径必须带前缀: --- frontend/src/App.vue ---, --- backend/server.js ---, --- shared/README.md ---。你写完整前缀路径，系统直接使用。`
  }

  if (isAgent) {
    systemParts.push('【文件操作格式】')
    systemParts.push('  创建/修改文件: --- 完整相对路径 --- + ```代码```')
    systemParts.push('    示例: --- frontend/src/App.vue ---')
    systemParts.push('  删除文件: --- DELETE 完整相对路径 ---')
    systemParts.push('    示例: --- DELETE frontend/src/old.js ---')
    systemParts.push('  删除文件夹: --- DELETE FOLDER 文件夹相对路径 ---')
    systemParts.push('    示例: --- DELETE FOLDER frontend/src/components ---')
    systemParts.push('  移动文件: --- MOVE 旧完整相对路径 -> 新完整相对路径 ---')
    systemParts.push('    示例: --- MOVE src/App.vue -> frontend/src/App.vue ---')
    systemParts.push('')
    systemParts.push('【重要提醒】')
    systemParts.push('  ⚠️ "路径"是占位符，必须替换为真实的文件或文件夹名称！')
    systemParts.push('  ⚠️ 绝对禁止输出"--- DELETE 路径 ---"或"--- DELETE FOLDER 路径 ---"！')
    systemParts.push('  ⚠️ 必须输出具体的文件名，如"--- DELETE frontend/src/utils.js ---"')
    systemParts.push('')
    systemParts.push('【整理规则】用户要求整理/清理文件时，直接输出MOVE/DELETE/DELETE FOLDER操作。重复文件用DELETE删除，多余文件夹用DELETE FOLDER删除，错位文件用MOVE移动。')
    systemParts.push('')
    systemParts.push(`【路径规则】${pathGuide}`)
    systemParts.push('')
    systemParts.push('【输出格式-按任务类型区分】')
    systemParts.push('  删除文件：只输出 --- DELETE 带前缀的完整路径 ---，不输出代码块')
    systemParts.push('  删除文件夹：只输出 --- DELETE FOLDER 带前缀的完整路径 ---，不输出代码块')
    systemParts.push('  移动文件：只输出 --- MOVE 旧路径 -> 新路径 ---，不输出代码块')
    systemParts.push('  代码任务：必须 --- 路径 --- + ```代码```。多文件按依赖顺序逐个输出。禁止只写文件名')
    systemParts.push('【强制要求】DELETE/MOVE指令中的路径也要带前缀(frontend/backend/shared)。写代码时路径同上规则。违反规则将导致操作无效。')
  }

  const systemMsg = {
    role: 'system',
    content: systemParts.join('\n\n')
  }

  const systemTokens = estimateTokens(systemMsg.content)
  let usedTokens = systemTokens

  const firstUserMsg = allMsgs.find(m => m.role === 'user')
  const recentMsgs = allMsgs.slice(-50)

  const contextMsgs = []

  if (firstUserMsg && !recentMsgs.includes(firstUserMsg)) {
    const msg = buildApiMessage(firstUserMsg)
    const tokens = estimateTokens(typeof msg.content === 'string' ? msg.content : msg.content.map(c => c.text || c.type || '').join(''))
    if (usedTokens + tokens <= MAX_TOKENS) {
      contextMsgs.push(msg)
      usedTokens += tokens
    }
  }

  for (let i = recentMsgs.length - 1; i >= 0; i--) {
    const m = recentMsgs[i]
    const msg = buildApiMessage(m)
    const tokens = estimateTokens(typeof msg.content === 'string' ? msg.content : msg.content.map(c => c.text || c.type || '').join(''))
    if (usedTokens + tokens > MAX_TOKENS) break
    contextMsgs.unshift(msg)
    usedTokens += tokens
  }

  const filteredMsgs = []
  for (const msg of contextMsgs) {
    if (filteredMsgs.length === 0) {
      if (msg.role === 'user') {
        filteredMsgs.push(msg)
      }
      continue
    }
    const lastRole = filteredMsgs[filteredMsgs.length - 1].role
    if (msg.role === lastRole) {
      filteredMsgs[filteredMsgs.length - 1].content += '\n' + msg.content
    } else {
      filteredMsgs.push(msg)
    }
  }

  contextMsgs.unshift(systemMsg)
  contextMsgs.splice(1, contextMsgs.length - 1, ...filteredMsgs)
  return contextMsgs
}

let liveEditorState = { inCodeBlock: false, filePath: '', codeContent: '', hasWritten: false, codeLang: '', pendingFilePath: '', buffer: '', fileIndex: 0, totalFiles: 0 }

let liveApplyTimer = null
let executedInstructions = new Set()  // 记录已执行的指令，避免重复执行

async function liveWriteToEditor(delta) {
  if (!delta) return
  if (aiMode.value !== 'agent') return
  
  // 调试：记录所有收到的内容
  if (aiMode.value === 'agent') {
    console.log('[liveWrite] 收到delta:', JSON.stringify(delta).slice(0, 200))
  }
  
  liveEditorState.buffer += delta
  const buf = liveEditorState.buffer

  // 调试：显示缓冲区内容
  if (aiMode.value === 'agent' && buf.length > 0) {
    console.log('[liveWrite] 缓冲区:', buf.slice(-300))
  }

  if (!liveEditorState.inCodeBlock) {
    // 简单直接的DELETE FOLDER指令处理
    const deleteFolderMatch = buf.match(/---\s*DELETE\s+FOLDER\s+(.+?)\s*---/)
    if (deleteFolderMatch) {
      const rawPath = deleteFolderMatch[1].trim()
      const matchEndIndex = deleteFolderMatch.index + deleteFolderMatch[0].length
      liveEditorState.buffer = buf.slice(matchEndIndex)
      
      if (aiMode.value === 'agent' && rawPath) {
        const resolvedFolderPath = resolveFolderPath(rawPath)
        if (!resolvedFolderPath) return

        if (resolvedFolderPath === 'workspace') {
          console.warn(`[DELETE FOLDER] 不允许删除工作区根目录`)
          return
        }

        executedInstructions.add(`DELETE_FOLDER:${resolvedFolderPath}`)
        const delCount = await deleteFolderFromWorkspace(resolvedFolderPath)
        if (delCount >= 0) {
          editorApplyNotice.value = delCount > 0
            ? `🗑️ 已删除文件夹 ${rawPath}（${delCount} 个文件）`
            : `🗑️ 已删除空文件夹 ${rawPath}`
          setTimeout(() => { editorApplyNotice.value = '' }, 3000)
        }
      }
      return
    }

    // 简单直接的DELETE指令处理
    const deleteMatch = buf.match(/---\s*DELETE\s+(?!FOLDER\s)(.+?)\s*---/)
    if (deleteMatch) {
      const rawPath = deleteMatch[1].trim()
      const matchEndIndex = deleteMatch.index + deleteMatch[0].length
      liveEditorState.buffer = buf.slice(matchEndIndex)
      
      if (aiMode.value === 'agent' && rawPath) {
        // 智能路径解析：直接在已存在的文件中查找
        let resolvedPath = rawPath
        
        for (const rootFolder of workspaceFolders.value) {
          // 方案1：直接拼接根路径
          const directPath = `${rootFolder.path}/${rawPath}`
          if (findFileInTree(workspaceFolders.value, directPath)) {
            resolvedPath = directPath
            break
          }
          
          // 方案2：尝试常见子目录
          const subDirs = ['frontend', 'backend', 'shared']
          for (const subDir of subDirs) {
            const subPath = `${rootFolder.path}/${subDir}/${rawPath}`
            if (findFileInTree(workspaceFolders.value, subPath)) {
              resolvedPath = subPath
              break
            }
          }
          
          // 方案3：按名称查找文件
          if (resolvedPath === rawPath && rootFolder.children) {
            const findFileByName = (folders, name) => {
              for (const folder of folders) {
                if (folder.type === 'file' && folder.name === name) return folder.path
                if (folder.children) {
                  const found = findFileByName(folder.children, name)
                  if (found) return found
                }
              }
              return null
            }
            const foundPath = findFileByName(rootFolder.children, rawPath.split('/').pop())
            if (foundPath) resolvedPath = foundPath
          }
        }
        
        console.log(`[DELETE] 路径解析: "${rawPath}" → "${resolvedPath}"`)

        if (!findFileInTree(workspaceFolders.value, resolvedPath)) {
          const fallbackPath = resolveFilePath(rawPath)
          if (findFileInTree(workspaceFolders.value, fallbackPath)) {
            resolvedPath = fallbackPath
            console.log(`[DELETE] 兜底路径解析成功: "${rawPath}" → "${resolvedPath}"`)
          }
        }

        const deleted = await deleteFileFromWorkspace(resolvedPath)
        
        // 记录已执行的指令
        executedInstructions.add(`DELETE:${resolvedPath}`)
        
        if (deleted) {
          editorApplyNotice.value = `🗑️ 已删除 ${rawPath}`
        } else {
          console.warn(`[DELETE] 未找到文件: ${rawPath} → ${resolvedPath}`)
        }
        setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      }
      return
    }
    const moveMatch = buf.match(/---\s*MOVE\s+(.+?)\s*->\s*(.+?)\s*---/)
    if (moveMatch) {
      const fromPath = moveMatch[1].trim()
      const toPath = moveMatch[2].trim()
      const matchEndIndex = moveMatch.index + moveMatch[0].length
      liveEditorState.buffer = buf.slice(matchEndIndex)
      
      if (aiMode.value === 'agent') {
        await ensureWorkspace()
        const resolvedFrom = resolveFilePath(fromPath)
        const resolvedTo = resolveFilePath(toPath)
        if (resolvedFrom !== resolvedTo) {
          const sourceFile = findFileInTree(workspaceFolders.value, resolvedFrom)
          if (sourceFile) {
            const fileContent = sourceFile._cachedContent || ''
            const fileName = resolvedTo.split('/').pop()
            const pathParts = resolvedTo.split('/')
            if (pathParts.length > 2) {
              let current = workspaceFolders.value[0]
              for (let i = 2; i < pathParts.length - 1; i++) {
                const subFolderName = pathParts[i]
                let subFolder = current?.children?.find(c => c.type === 'folder' && c.name === subFolderName)
                if (!subFolder) {
                  subFolder = { name: subFolderName, path: pathParts.slice(0, i + 1).join('/'), type: 'folder', children: [], _cachedContent: null }
                  if (!current.children) current.children = []
                  current.children.push(subFolder)
                  expandedFolders.value.add(subFolder.path)
                }
                current = subFolder
              }
            }
            const parentPath = resolvedTo.split('/').slice(0, -1).join('/')
            let parent = findFileInTree(workspaceFolders.value, parentPath)
            if (!parent) parent = workspaceFolders.value[0]
            if (parent && parent.children) {
              parent.children.push({ name: fileName, path: resolvedTo, type: 'file', isText: true, _cachedContent: fileContent, fromIDB: true })
              expandedFolders.value.add(parentPath)
            }
            await saveFileToServer(fileName, resolvedTo, fileContent)
            try { await idbSaveFile(resolvedTo, fileContent, { folderPath: resolvedTo.split('/').slice(0, 2).join('/'), name: fileName, language: fileName.split('.').pop() || 'text' }) } catch {}
            await deleteFileFromWorkspace(resolvedFrom)
            editorApplyNotice.value = `📦 已移动 ${fromPath} → ${toPath}`
            setTimeout(() => { editorApplyNotice.value = '' }, 3000)
          }
        }
      }
      return
    }
    const searchMatch = buf.match(/---\s*SEARCH\s+(.+?)\s*---/)
    if (searchMatch) {
      const query = searchMatch[1].trim()
      const matchEndIndex = searchMatch.index + searchMatch[0].length
      liveEditorState.buffer = buf.slice(matchEndIndex)
      editorApplyNotice.value = `🔍 正在搜索: ${query}`
      try {
        const res = await fetch(`${API_BASE}/ai/web/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, count: 5 })
        })
        const data = await res.json()
        if (data.success && data.results.length > 0) {
          const searchMsg = `🔍 搜索"${query}"结果:\n` + data.results.map((r, i) =>
            `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`
          ).join('\n\n')
          messages.value.push({ id: msgId(), role: 'ai', content: searchMsg, time: new Date().toLocaleTimeString() })
          editorApplyNotice.value = `🔍 搜索完成，找到 ${data.results.length} 条结果`
        } else {
          editorApplyNotice.value = `🔍 搜索"${query}"无结果`
        }
      } catch (e) {
        editorApplyNotice.value = `🔍 搜索失败: ${e.message}`
      }
      setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      scrollToBottom()
      return
    }
    const fetchMatch = buf.match(/---\s*FETCH\s+(.+?)\s*---/)
    if (fetchMatch) {
      const url = fetchMatch[1].trim()
      const matchEndIndex = fetchMatch.index + fetchMatch[0].length
      liveEditorState.buffer = buf.slice(matchEndIndex)
      editorApplyNotice.value = `🌐 正在读取: ${url}`
      try {
        const res = await fetch(`${API_BASE}/ai/web/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        const data = await res.json()
        if (data.success) {
          const fetchMsg = `🌐 读取 ${data.title || url}:\n${data.content}`
          messages.value.push({ id: msgId(), role: 'ai', content: fetchMsg, time: new Date().toLocaleTimeString() })
          editorApplyNotice.value = `🌐 已读取: ${data.title || url}`
        } else {
          editorApplyNotice.value = `🌐 读取失败: ${data.message}`
        }
      } catch (e) {
        editorApplyNotice.value = `🌐 读取失败: ${e.message}`
      }
      setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      scrollToBottom()
      return
    }
    const forumMatch = buf.match(/---\s*FORUM\s+(.+?)\s*---/)
    if (forumMatch) {
      const action = forumMatch[1].trim()
      const matchEndIndex = forumMatch.index + forumMatch[0].length
      liveEditorState.buffer = buf.slice(matchEndIndex)
      editorApplyNotice.value = `📋 正在查看论坛...`
      try {
        if (action.toLowerCase() === 'posts' || action.toLowerCase() === 'list') {
          const res = await fetch(`${API_BASE}/forum/posts?pageSize=10`, {
            headers: props.token ? { Authorization: `Bearer ${props.token}` } : {}
          })
          const data = await res.json()
          if (data.success && data.posts.length > 0) {
            const forumMsg = `📋 论坛最新帖子(${data.total}条):\n` + data.posts.map((p, i) =>
              `${i + 1}. [${p.category}] ${p.title}\n   作者: ${p.author_name} | 浏览: ${p.view_count} | 评论: ${p.comment_count}\n   ${p.content.slice(0, 100)}${p.content.length > 100 ? '...' : ''}`
            ).join('\n\n')
            messages.value.push({ id: msgId(), role: 'ai', content: forumMsg, time: new Date().toLocaleTimeString() })
            editorApplyNotice.value = `📋 已获取 ${data.posts.length} 条帖子`
          } else {
            editorApplyNotice.value = `📋 论坛暂无帖子`
          }
        } else if (action.toLowerCase().startsWith('post ') || action.match(/^\d+$/)) {
          const postId = action.match(/\d+/)?.[0] || action.split(' ').pop()
          const res = await fetch(`${API_BASE}/forum/posts/${postId}`, {
            headers: props.token ? { Authorization: `Bearer ${props.token}` } : {}
          })
          const data = await res.json()
          if (data.success) {
            const p = data.post
            const forumMsg = `📋 帖子详情:\n标题: ${p.title}\n分类: ${p.category}\n作者: ${p.author_name}\n浏览: ${p.view_count}\n\n${p.content}`
            messages.value.push({ id: msgId(), role: 'ai', content: forumMsg, time: new Date().toLocaleTimeString() })
            editorApplyNotice.value = `📋 已获取帖子: ${p.title}`
          } else {
            editorApplyNotice.value = `📋 帖子不存在`
          }
        } else if (action.toLowerCase().startsWith('search ')) {
          const keyword = action.slice(7).trim()
          const res = await fetch(`${API_BASE}/forum/posts?search=${encodeURIComponent(keyword)}&pageSize=10`, {
            headers: props.token ? { Authorization: `Bearer ${props.token}` } : {}
          })
          const data = await res.json()
          if (data.success && data.posts.length > 0) {
            const forumMsg = `📋 搜索"${keyword}"结果(${data.posts.length}条):\n` + data.posts.map((p, i) =>
              `${i + 1}. [${p.category}] ${p.title}\n   ${p.content.slice(0, 80)}...`
            ).join('\n\n')
            messages.value.push({ id: msgId(), role: 'ai', content: forumMsg, time: new Date().toLocaleTimeString() })
            editorApplyNotice.value = `📋 搜索到 ${data.posts.length} 条帖子`
          } else {
            editorApplyNotice.value = `📋 未搜索到相关帖子`
          }
        }
      } catch (e) {
        editorApplyNotice.value = `📋 论坛访问失败: ${e.message}`
      }
      setTimeout(() => { editorApplyNotice.value = '' }, 3000)
      scrollToBottom()
      return
    }
    const fileMarkerMatch = buf.match(/---\s*(.+?)\s*---\s*$/)
    if (fileMarkerMatch) {
      const rawMarker = fileMarkerMatch[1].trim()
      const markerPath = rawMarker.toUpperCase()
      if (markerPath !== 'DELETE' && !markerPath.startsWith('DELETE ') && !markerPath.startsWith('DELETE FOLDER') && !markerPath.startsWith('MOVE') && !markerPath.startsWith('SEARCH') && !markerPath.startsWith('FETCH') && !markerPath.startsWith('FORUM')) {
        
        // 检查冲突：如果当前有高优先级指令正在执行，阻止文件创建
        if (instructionLock) {
          console.warn('[指令冲突] 检测到文件创建指令，但当前有高优先级指令正在执行')
          liveEditorState.pendingFilePath = ''
          return
        }
        
        liveEditorState.totalFiles++
        liveEditorState.pendingFilePath = rawMarker
      } else {
        liveEditorState.pendingFilePath = ''
      }
    }
    const codeStartIdx = buf.lastIndexOf('```')
    if (codeStartIdx !== -1) {
      const afterMarker = buf.slice(codeStartIdx + 3)
      const langMatch = afterMarker.match(/^(\w*)\n?/)
      liveEditorState.codeLang = langMatch ? langMatch[1] : ''
      liveEditorState.inCodeBlock = true
      liveEditorState.codeContent = ''
      liveEditorState.hasWritten = false
      const codeStart = afterMarker.indexOf('\n')
      if (codeStart !== -1) {
        const firstCode = afterMarker.slice(codeStart + 1)
        if (firstCode) {
          liveEditorState.codeContent = firstCode
        }
      }
      liveEditorState.buffer = ''

      if (liveEditorState.pendingFilePath) {
        let fullPath = resolveFilePath(liveEditorState.pendingFilePath)
        liveEditorState.filePath = fullPath

        if (aiMode.value === 'agent') {
          await ensureWorkspace()
          const pathParts = fullPath.split('/')
          if (pathParts.length > 2) {
            let current = workspaceFolders.value[0]
            for (let i = 2; i < pathParts.length - 1; i++) {
              const subFolderName = pathParts[i]
              let subFolder = current?.children?.find(c => c.type === 'folder' && c.name === subFolderName)
              if (!subFolder) {
                subFolder = {
                  name: subFolderName,
                  path: pathParts.slice(0, i + 1).join('/'),
                  type: 'folder',
                  children: [],
                  _cachedContent: null
                }
                if (!current.children) current.children = []
                current.children.push(subFolder)
                expandedFolders.value.add(subFolder.path)
              }
              current = subFolder
            }
          }

          const fileName = fullPath.split('/').pop()
          const fileNode = findFileInTree(workspaceFolders.value, fullPath)
          if (!fileNode) {
            const parentPath = pathParts.slice(0, pathParts.length - 1).join('/')
            let parent = findFileInTree(workspaceFolders.value, parentPath)
            if (!parent) parent = workspaceFolders.value[0]
            if (parent && parent.children) {
              parent.children.push({
                name: fileName,
                path: fullPath,
                type: 'file',
                isText: true,
                _cachedContent: '',
                fromIDB: true
              })
              expandedFolders.value.add(parentPath)
            }
          }

          showEditor.value = true
          currentFileName.value = fileName
          currentFilePath.value = fullPath
          currentFileType.value = fileName.split('.').pop() || 'text'
          isModified.value = true
          selectedFilePath.value = fullPath

          const existingTab = editorTabs.value.find(t => t.path === fullPath)
          if (!existingTab) {
            editorTabs.value.push({
              path: fullPath,
              name: fileName,
              content: '',
              language: currentFileType.value,
              modified: true
            })
          }
          activeTab.value = fullPath

          liveEditorState.fileIndex++
          const progress = liveEditorState.totalFiles > 0 ? ` (${liveEditorState.fileIndex}/${liveEditorState.totalFiles})` : ''
          editorApplyNotice.value = `📝 正在生成 ${fileName}${progress}...`
        }
      } else if (showEditor.value && currentFilePath.value) {
        liveEditorState.filePath = currentFilePath.value
      } else if (aiMode.value === 'agent') {
        await ensureWorkspace()
        const ext = langExtensionMap[liveEditorState.codeLang] || liveEditorState.codeLang || 'txt'
        const fileName = `generating.${ext}`
        const subFolder = getTargetSubFolder(fileName)
        const folderPath = subFolder ? subFolder.path : workspaceFolders.value[0]?.path || 'workspace/ai-workspace'
        const fullPath = `${folderPath}/${fileName}`

        liveEditorState.filePath = fullPath

        showEditor.value = true
        currentFileName.value = fileName
        currentFilePath.value = fullPath
        currentFileType.value = ext
        isModified.value = true
        selectedFilePath.value = fullPath

        const existingTab = editorTabs.value.find(t => t.path === fullPath)
        if (!existingTab) {
          editorTabs.value.push({
            path: fullPath,
            name: fileName,
            content: '',
            language: ext,
            modified: true
          })
        }
        activeTab.value = fullPath

        liveEditorState.fileIndex++
        const progress2 = liveEditorState.totalFiles > 0 ? ` (${liveEditorState.fileIndex}/${liveEditorState.totalFiles})` : ''
        editorApplyNotice.value = `📝 正在生成代码${progress2}...`
      }

      if (liveEditorState.codeContent && aiMode.value === 'agent') {
        const content = liveEditorState.codeContent.replace(/```$/,'')
        if (monacoRef.value) {
          monacoRef.value.applyAIEdit(content)
        } else {
          editorContent.value = content
        }
      }
    }
  } else {
    if (delta.includes('```')) {
      const beforeClose = delta.split('```')[0]
      liveEditorState.codeContent += beforeClose

      const finalContent = liveEditorState.codeContent
      if (aiMode.value === 'agent') {
        if (monacoRef.value) {
          monacoRef.value.applyAIEdit(finalContent)
        } else {
          editorContent.value = finalContent
        }
      }

      const filePath = liveEditorState.filePath
      const fileName = filePath.split('/').pop()
      if (filePath && aiMode.value === 'agent') {
        const fileNode = findFileInTree(workspaceFolders.value, filePath)
        if (fileNode) {
          fileNode._cachedContent = finalContent
        }
        saveFileToServer(fileName, filePath, finalContent)
        try {
          await idbSaveFile(filePath, finalContent, {
            folderPath: filePath.split('/').slice(0, 2).join('/'),
            name: fileName,
            language: fileName.split('.').pop() || 'text'
          })
        } catch (e) {
          console.warn('[IndexedDB] 实时保存失败:', e)
        }
      }

      if (aiMode.value === 'agent') {
        originalContent.value = finalContent
        isModified.value = false

        const finishedTab = editorTabs.value.find(t => t.path === filePath)
        if (finishedTab) {
          finishedTab.content = finalContent
          finishedTab.modified = false
        }
      }

      liveEditorState.inCodeBlock = false
      liveEditorState.filePath = ''
      liveEditorState.codeContent = ''
      liveEditorState.pendingFilePath = ''
      liveEditorState.codeLang = ''
      liveEditorState.buffer = ''

      editorApplyNotice.value = `AI 已生成 ${fileName}`
      setTimeout(() => { editorApplyNotice.value = '' }, 3000)

      return
    }

    liveEditorState.codeContent += delta

    if (liveApplyTimer) clearTimeout(liveApplyTimer)
    if (aiMode.value === 'agent') {
      liveApplyTimer = setTimeout(() => {
        const content = liveEditorState.codeContent
        if (content && liveEditorState.inCodeBlock) {
          if (monacoRef.value) {
            monacoRef.value.applyAIEdit(content)
          } else {
            editorContent.value = content
          }
        }
      }, 50)
    }
  }
}

async function sendMessage() {
  if ((!inputMessage.value.trim() && !attachedFolder.value) || isLoading.value) return

  // 检查智能问答/智能体申请状态
  // editor 模式也使用免费模型，需要检查 QA 申请状态
  if ((aiMode.value === 'qa' || aiMode.value === 'editor') && qaApplyStatus.value !== 'approved') {
    switchToQaMode()
    return
  }
  if (aiMode.value === 'agent' && !agentHasAccess.value) {
    switchToAgentMode()
    return
  }

  // 清空已执行指令记录（每次新对话）
  executedInstructions.clear()
  
  autoContinueCount = 0

  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }

  const userMsgCount = messages.value.filter(m => m.role === 'user').length
  if (userMsgCount >= 50) {
    messages.value.push({
      id: msgId(),
      role: 'ai',
      content: '⚠️ 当前对话已超过50轮，上下文过长可能影响回复质量。\n\n请点击左上角「新对话」按钮开始新的对话。',
      time: new Date(),
      streaming: false,
      modelName: '系统提示'
    })
    nextTick(() => {
      const chatArea = document.querySelector('.chat-messages')
      if (chatArea) chatArea.scrollTop = chatArea.scrollHeight
    })
    return
  }

  const isFreeModel = modelPresetConfigs[selectedModel.value]?.isFree
  
  if (!isFreeModel && !hasApiKey(selectedModel.value)) {
    openKeyConfig(selectedModel.value)
    return
  }

  if (aiMode.value === 'agent') {
    await fetchAgentStatus()
    if (!agentHasAccess.value) {
      aiMode.value = 'chat'
      messages.value.push({
        id: msgId(),
        role: 'ai',
        content: '⚠️ 您的智能体使用权限已被撤销，已自动切换回普通模式。',
        time: new Date(),
        streaming: false,
        modelName: '系统提示'
      })
      nextTick(() => {
        const chatArea = document.querySelector('.chat-messages')
        if (chatArea) chatArea.scrollTop = chatArea.scrollHeight
      })
      return
    }
  }

  liveEditorState = { inCodeBlock: false, filePath: '', codeContent: '', hasWritten: false, codeLang: '', pendingFilePath: '', buffer: '', fileIndex: 0, totalFiles: 0 }

  let messageContent = inputMessage.value.trim()

  if (attachedFolder.value) {
    const fileContents = []
    const fileTreeLines = []
    for (const file of attachedFolder.value.files) {
      const relPath = file.webkitRelativePath || file.name
      fileTreeLines.push(`  ${relPath}`)
      if (textExtensions.test(file.name)) {
        try {
          const content = await file.text()
          fileContents.push(`--- ${relPath} ---\n\`\`\`\n${content}\n\`\`\``)
        } catch {
          fileContents.push(`--- ${relPath} ---\n[文件读取失败]`)
        }
      }
    }
    const treeSection = `项目文件结构:\n${fileTreeLines.join('\n')}`
    const fileSection = fileContents.join('\n\n')
    if (messageContent) {
      messageContent = `${messageContent}\n\n${treeSection}\n\n${fileSection}`
    } else {
      messageContent = `${treeSection}\n\n${fileSection}`
    }
    attachedFolder.value = null
  }

  messages.value.push({
    id: msgId(),
    role: 'user',
    content: messageContent,
    images: pendingImages.value.length > 0 ? pendingImages.value.map(i => i.dataUrl) : [],
    time: new Date()
  })
  const sentImages = [...pendingImages.value]
  pendingImages.value = []
  inputMessage.value = ''
  isLoading.value = true
  lastMessageTime.value = Date.now()
  if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }

  if (loadingSafetyTimer) clearTimeout(loadingSafetyTimer)
  loadingSafetyTimer = setTimeout(() => {
    if (isLoading.value) {
      if (abortController.value) {
        try { abortController.value.abort() } catch {}
        abortController.value = null
      }
      isLoading.value = false
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.streaming) {
        lastMsg.streaming = false
        lastMsg.content += '\n\n⏱ 响应超时，已自动重置'
      }
      saveCurrentSession()
    }
  }, 600000)

  const aiMessage = reactive({
    id: msgId(),
    role: 'ai',
    content: '',
    reasoningContent: '',
    reasoningDone: false,
    time: new Date(),
    streaming: true,
    thinking: true,
    modelName: getModelName(),
    modelId: selectedModel.value,
    isCustom: !modelPresetConfigs[selectedModel.value]?.isFree,
    _reasoningExpanded: true
  })
  messages.value.push(aiMessage)
  startWaitingTimer()

  await nextTick()
  scrollToBottom()

  const contextMessages = await buildContext()
  const controller = new AbortController()
  abortController.value = controller

  const fetchTimeout = setTimeout(() => controller.abort(), 300000)

  try {
    const keyConfig = apiKeys[selectedModel.value]
    const isFreeModel = modelPresetConfigs[selectedModel.value]?.isFree
    const isImageModel = modelPresetConfigs[selectedModel.value]?.isImageModel
    const isVideoModel = modelPresetConfigs[selectedModel.value]?.isVideoModel

    const chatMaxTokens = !isFreeModel ? 16384 : (aiMode.value === 'agent' ? 16384 : 4096)

    if (isVideoModel) {
      aiMessage.thinking = false
      aiMessage.content = '🎬 正在生成视频，请稍候（通常需要1-3分钟）...'

      const videoApiKey = keyConfig?.key || ''

      const response = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
        body: JSON.stringify({
          model: selectedModel.value,
          prompt: messageContent,
          apiKey: videoApiKey,
          duration: 5
        }),
        signal: controller.signal
      })

      clearTimeout(fetchTimeout)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        aiMessage.content = `❌ 视频生成失败: ${errData.message || `请求失败 (${response.status})`}`
        aiMessage.streaming = false
        isLoading.value = false
        abortController.value = null
        if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }
        await nextTick()
        scrollToBottom()
        saveCurrentSession()
        return
      }

      const result = await response.json()
      if (result.success && result.video) {
        aiMessage.content = `🎬 [视频已生成](${result.video})`
        aiMessage.video = result.video
        aiMessage.streaming = false
      } else {
        aiMessage.content = `❌ 视频生成失败: ${result.message || '未知错误'}`
        aiMessage.streaming = false
      }

      if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
      saveCurrentSession()
    } else if (isImageModel) {
      aiMessage.thinking = false
      aiMessage.content = '🎨 正在生成图片...'

      const imgMessages = contextMessages.length > 0 ? contextMessages : [
        { role: 'user', content: messageContent }
      ]

      const response = await fetch('/api/ai/image/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
        body: JSON.stringify({
          messages: imgMessages,
          imageModel: selectedModel.value,
          apiKey: keyConfig?.key || ''
        }),
        signal: controller.signal
      })

      clearTimeout(fetchTimeout)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        aiMessage.content = `❌ 图片生成失败: ${errData.message || `请求失败 (${response.status})`}`
        aiMessage.streaming = false
        isLoading.value = false
        abortController.value = null
        if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }
        await nextTick()
        scrollToBottom()
        saveCurrentSession()
        return
      }

      const result = await response.json()
      if (result.success && result.image) {
        let imageSrc = result.image
        const currentModelConfig = modelPresetConfigs[selectedModel.value]
        if (currentModelConfig?.isFree) {
          imageSrc = await addWatermarkToImage(result.image, '天窗 AI 生成')
        }
        aiMessage.content = `![生成的图片](${imageSrc})`
        aiMessage.image = imageSrc
        aiMessage.streaming = false
      } else {
        aiMessage.content = `❌ 图片生成失败: ${result.message || '未知错误'}`
        aiMessage.streaming = false
      }

      if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
      saveCurrentSession()
    } else {
    console.log('[sendMessage] 发送请求:', {
      model: selectedModel.value,
      hasKey: !!(keyConfig?.key),
      keyPreview: keyConfig?.key?.substring(0, 10) + '...',
      apiBase: keyConfig?.base || '(default)',
      maxTokens: chatMaxTokens
    })
    const token = localStorage.getItem('token')
    const reqHeaders = { 'Content-Type': 'application/json' }
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        model: selectedModel.value,
        messages: contextMessages,
        apiKey: keyConfig?.key || '',
        apiBase: keyConfig?.base || '',
        maxTokens: chatMaxTokens,
        mode: aiMode.value
      }),
      signal: controller.signal
    })

    clearTimeout(fetchTimeout)

    if (!response.ok) {
      const errText = await response.text()
      let errMsg = `请求失败 (${response.status})`
      try {
        const errJson = JSON.parse(errText)
        errMsg = errJson.message || errJson.error?.message || errMsg
      } catch {}
      aiMessage.content = `❌ ${errMsg}`
      aiMessage.streaming = false
      isLoading.value = false
      abortController.value = null
      if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }
      await nextTick()
      scrollToBottom()
      saveCurrentSession()
      return
    }

    if (!response.body) {
      aiMessage.content = '❌ 服务器没有返回响应数据，请检查后端服务是否正常运行。'
      aiMessage.streaming = false
      isLoading.value = false
      abortController.value = null
      if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }
      await nextTick()
      scrollToBottom()
      saveCurrentSession()
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            aiMessage.content += `\n\n❌ ${parsed.error}`
            aiMessage.streaming = false
            aiMessage.thinking = false
            isLoading.value = false
            abortController.value = null
            stopWaitingTimer()
            if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }
            if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
            saveCurrentSession()
            await nextTick()
            scrollToBottom()
            return
          }
          if (parsed.config || parsed.reasoning_content || parsed.content) {
            if (parsed.reasoning_content) {
              if (aiMessage.thinking) {
                aiMessage.thinking = false
                stopWaitingTimer()
              }
              aiMessage.reasoningContent += parsed.reasoning_content
              if (aiMode.value === 'agent') {
                liveWriteToEditor(parsed.reasoning_content)
              }
              requestScrollToBottom()
            }
            if (parsed.content) {
              if (aiMessage.thinking) {
                aiMessage.thinking = false
                aiMessage.content = ''
                stopWaitingTimer()
              }
              if (aiMessage.reasoningContent && !aiMessage.reasoningDone) {
                aiMessage.reasoningDone = true
                aiMessage._reasoningExpanded = false
              }
              aiMessage.content += parsed.content
              requestScrollToBottom()
              if (aiMode.value === 'agent') {
                liveWriteToEditor(parsed.content)
              }
              if (loadingSafetyTimer) {
                clearTimeout(loadingSafetyTimer)
                loadingSafetyTimer = setTimeout(() => {
                  if (isLoading.value) {
                    if (abortController.value) {
                      try { abortController.value.abort() } catch {}
                      abortController.value = null
                    }
                    isLoading.value = false
                    const lastMsg = messages.value[messages.value.length - 1]
                    if (lastMsg && lastMsg.streaming) {
                      lastMsg.streaming = false
                      lastMsg.content += '\n\n⏱ 响应超时，已自动重置'
                    }
                    saveCurrentSession()
                  }
                }, 600000)
              }
            }
          }
        } catch {}
      }
    }

    aiMessage.streaming = false
    aiMessage.thinking = false
    aiMessage.reasoningDone = true
    aiMessage._reasoningExpanded = false
    stopWaitingTimer()
    if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
    if (aiMode.value === 'agent') {
      autoApplyCodeFromAI(aiMessage.content)
    }
    generateCompletionSummary(aiMessage.content)
    await saveWorkspaceState()
    saveCurrentSession()
    if (aiMode.value === 'agent') fetchAgentStatus()

    const needsContinue = checkIfNeedsContinuation(aiMessage.content)
    if (needsContinue) {
      setTimeout(() => {
        autoContinueGeneration(aiMessage.content)
      }, 1500)
    }
    }
  } catch (err) {
    clearTimeout(fetchTimeout)
    if (err.name === 'AbortError') {
      if (!aiMessage.content.includes('\u23F9')) {
        aiMessage.content += '\n\n\u23F9 已停止生成'
      }
      aiMessage.streaming = false
    } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      aiMessage.content = '❌ 无法连接到后端服务器，请确保后端服务已启动（在 limaohouduan 目录运行 npm start）'
      aiMessage.streaming = false
    } else if (err.message?.includes('fetch')) {
      aiMessage.content = '❌ 后端 fetch 请求失败，请确保 Node.js 版本 >= 18 或已安装 node-fetch 依赖'
      aiMessage.streaming = false
    } else {
      aiMessage.content = ` 请求失败: ${err.message}\n\n请检查网络连接、API 地址和密钥是否正确。`
      aiMessage.streaming = false
    }
    if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
    saveCurrentSession()
  } finally {
    saveCurrentConversationMemory()
    isLoading.value = false
    abortController.value = null
    if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }
    if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
    await nextTick()
    scrollToBottom()
  }
}

function stopGeneration() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  if (streamingRenderTimer) { clearTimeout(streamingRenderTimer); streamingRenderTimer = null }
  if (loadingSafetyTimer) { clearTimeout(loadingSafetyTimer); loadingSafetyTimer = null }

  isLoading.value = false

  const lastMsg = messages.value[messages.value.length - 1]
  if (lastMsg && lastMsg.streaming) {
    lastMsg.streaming = false
    lastMsg.thinking = false
    lastMsg.reasoningDone = true
    if (!lastMsg.content.includes('\u23F9')) {
      lastMsg.content += '\n\n\u23F9 已停止生成'
    }
  }

  saveCurrentSession()
}

async function smartReview() {
  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }

  const isFreeModel = modelPresetConfigs[selectedModel.value]?.isFree
  if (!isFreeModel && !hasApiKey(selectedModel.value)) {
    openKeyConfig(selectedModel.value)
    return
  }

  await ensureWorkspace()

  const allFiles = []
  for (const folder of workspaceFolders.value) {
    collectAllFiles([folder]).forEach(f => allFiles.push(f))
  }

  if (allFiles.length === 0 && !editorContent.value) {
    return
  }

  const reviewParts = []
  reviewParts.push('🔍 请对工作区代码进行全面审查，自动检测并修复所有问题：')
  reviewParts.push('1. **Bug 检测**：逻辑错误、空指针、未处理的异常、类型错误')
  reviewParts.push('2. **多余代码**：未使用的变量/函数/导入、重复代码、死代码')
  reviewParts.push('3. **代码质量**：性能问题、安全隐患、不规范的写法')
  reviewParts.push('4. **文件清理**：完全多余的文件应使用 --- DELETE 文件路径 --- 删除，多余的文件夹用 --- DELETE FOLDER 路径 --- 删除')
  reviewParts.push('')
  reviewParts.push('审查规则：')
  reviewParts.push('- 你已经在系统消息中看到了所有文件的完整内容，直接基于这些内容进行审查')
  reviewParts.push('- 如果代码没有问题，回复"✅ 代码审查通过，未发现问题"')
  reviewParts.push('- 如果发现问题，直接输出修复后的完整文件，使用 --- 文件路径 --- 格式')
  reviewParts.push('- 多余的文件使用 --- DELETE 文件路径 --- 删除，多余文件夹使用 --- DELETE FOLDER 路径 --- 删除')
  reviewParts.push('- 不要只描述问题，必须直接输出修复后的代码')
  reviewParts.push('- 如果只是小改动，也输出完整文件内容')

  const reviewMessage = reviewParts.join('\n')

  const previousMode = aiMode.value
  inputMessage.value = reviewMessage
  aiMode.value = 'agent'
  await nextTick()
  sendMessage()
  nextTick(() => {
    aiMode.value = previousMode
  })
}

function scrollToBottom() {
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
    scrollRafId = null
  })
}

function requestScrollToBottom() {
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
    scrollRafId = null
  })
}

const lineCount = computed(() => {
  return editorContent.value ? editorContent.value.split('\n').length : 1
})

const editorLang = computed(() => {
  const name = currentFileName.value || ''
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map = { js: 'javascript', ts: 'typescript', py: 'python', java: 'java', html: 'html', css: 'css', json: 'json', sql: 'sql', jsx: 'javascript', tsx: 'typescript', vue: 'html', xml: 'html', md: 'markdown', yaml: 'yaml', yml: 'yaml', sh: 'bash', rb: 'ruby', go: 'go', rs: 'rust', c: 'c', cpp: 'cpp', h: 'c', php: 'php', swift: 'swift', kt: 'kotlin', cs: 'csharp' }
  return map[ext] || 'text'
})

const highlightedCode = computed(() => {
  const code = editorContent.value
  const lang = editorLang.value
  if (!code || lang === 'text') return escapeHtml(code)
  const keywords = syntaxKeywords[lang] || []
  if (keywords.length === 0) return escapeHtml(code)

  const lines = code.split('\n')
  return lines.map(line => {
    let result = escapeHtml(line)
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
    result = result.replace(kwRegex, '<span class="keyword">$1</span>')
    const strRegex = /(["'`])(?:(?!\1|\\).|\\.)*\1/g
    result = result.replace(strRegex, '<span class="string">$&</span>')
    const numRegex = /\b(\d+\.?\d*)\b/g
    result = result.replace(numRegex, '<span class="number">$1</span>')
    const commentRegex = /(\/\/.*$)/gm
    result = result.replace(commentRegex, '<span class="comment">$1</span>')
    return result
  }).join('\n')
})

function escapeHtml(text) {
  if (!text) return ''
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function syncScroll() {
  const textarea = editorTextarea.value
  const lineNums = lineNumbers.value
  if (textarea && lineNums) {
    lineNums.scrollTop = textarea.scrollTop
  }
}

function onMonacoCursorChange(pos) {
  cursorPos.line = pos.line
  cursorPos.col = pos.column
  cursorLine.value = pos.line
  isModified.value = true
}

function onEditorInput() {
  isModified.value = true
  updateCursorPosition()
}

function updateCursorPosition() {
  const textarea = editorTextarea.value
  if (!textarea) return
  const val = textarea.value
  const pos = textarea.selectionStart
  const before = val.substring(0, pos)
  const lines = before.split('\n')
  cursorPos.line = lines.length
  cursorPos.col = lines[lines.length - 1].length + 1
  cursorLine.value = cursorPos.line
}

function handleEditorKeydown(e) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = editorTextarea.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    editorContent.value = editorContent.value.substring(0, start) + '  ' + editorContent.value.substring(end)
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2
      updateCursorPosition()
    })
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    downloadFile()
  }
}

function toggleWordWrap() {
  wordWrap.value = !wordWrap.value
}

function toggleLineNumbers() {
  showLineNumbers.value = !showLineNumbers.value
}

function handleDragOver(e) {
  isDragging.value = true
}

function handleDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false
  }
  if (e.relatedTarget === null) {
    isDragging.value = false
  }
}

async function handleDrop(e) {
  isDragging.value = false
  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }
  const files = Array.from(e.dataTransfer.files)
  if (!files.length) return

  const folderName = files[0].webkitRelativePath?.split('/')[0]
  if (!folderName) {
    if (files.length === 1 && files[0].size > 10 * 1024 * 1024) {
      alert(`文件 ${files[0].name} 超过10MB，无法上传`)
      return
    }
    const totalSize = files.reduce((s, f) => s + f.size, 0)
    if (totalSize > 50 * 1024 * 1024) {
      alert('总文件大小超过50MB')
      return
    }
    attachedFolder.value = { name: '拖放文件', files, fileCount: files.length }
    return
  }

  const textFiles = files.filter(f => textExtensions.test(f.name))
  const totalSize = textFiles.reduce((s, f) => s + f.size, 0)
  if (totalSize > 50 * 1024 * 1024) {
    alert('总文本文件大小超过50MB，请减少文件数量')
    return
  }

  const folderPath = 'workspace/' + folderName
  const folderNode = buildFileTree(files, folderPath)

  uploadStatus.value = '正在读取文件...'
  uploadProgress.value = 10

  const idbFiles = []
  for (const file of textFiles) {
    const relPath = file.webkitRelativePath
    const filePath = folderPath + '/' + relPath.split('/').slice(1).join('/')
    try {
      const content = await file.text()
      idbFiles.push({ path: filePath, content, folderPath, name: file.name, language: file.name.split('.').pop() || 'text', size: file.size })
    } catch (e) {}
  }

  uploadStatus.value = '正在保存到本地...'
  uploadProgress.value = 30

  if (idbFiles.length > 0) {
    try { await saveFilesBatch(idbFiles) } catch (e) { console.warn('[IndexedDB] 保存失败:', e) }
  }

  for (let i = 0; i < workspaceFolders.value.length; i++) {
    if (workspaceFolders.value[i].name === folderName) {
      workspaceFolders.value[i] = folderNode
      expandedFolders.value.add(folderPath)
      attachedFolder.value = { name: folderName, files: textFiles, fileCount: textFiles.length, treePath: folderPath }
      saveWorkspaceState()
      uploadFolderFilesToServer(idbFiles, folderPath)
      return
    }
  }

  workspaceFolders.value.push(folderNode)
  expandedFolders.value.add(folderPath)
  attachedFolder.value = { name: folderName, files: textFiles, fileCount: textFiles.length, treePath: folderPath }
  saveWorkspaceState()
  uploadFolderFilesToServer(idbFiles, folderPath)
}

async function uploadFolderFilesToServer(idbFiles, folderPath) {
  if (idbFiles.length === 0) return
  const serverFiles = idbFiles.map(f => ({
    name: f.name,
    path: f.path,
    content: f.content,
    language: f.language || 'text'
  }))
  uploadStatus.value = '准备上传...'
  uploadProgress.value = 0
  const batchSize = 10
  const totalBatches = Math.ceil(serverFiles.length / batchSize)
  for (let i = 0; i < totalBatches; i++) {
    const batch = serverFiles.slice(i * batchSize, (i + 1) * batchSize)
    uploadStatus.value = `上传中 ${Math.min((i + 1) * batchSize, serverFiles.length)}/${serverFiles.length}`
    uploadProgress.value = Math.round(((i + 1) / totalBatches) * 100)
    try {
      await fetch(`${API_BASE}/ai/data/files/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.token}` },
        body: JSON.stringify({ files: batch })
      })
    } catch (e) {
      console.warn('[AI Files] 批量上传失败:', e)
    }
  }
  uploadStatus.value = '上传完成 ✓'
  uploadProgress.value = 100
  setTimeout(() => {
    uploadStatus.value = ''
    uploadProgress.value = 0
  }, 2000)
}

function clearAttachedFolder() {
  if (attachedFolder.value?.treePath) {
    workspaceFolders.value = workspaceFolders.value.filter(f => f.path !== attachedFolder.value.treePath)
    expandedFolders.value.delete(attachedFolder.value.treePath)
    saveWorkspaceState()
  }
  attachedFolder.value = null
}

function getFileColor(name) {
  const ext = name.split('.').pop().toLowerCase()
  const colorMap = {
    js: '#f7df1e', ts: '#3178c6', jsx: '#61dafb', tsx: '#3178c6',
    vue: '#42b883', html: '#e34c26', htm: '#e34c26', css: '#264de4',
    scss: '#cd6799', less: '#1d365d', py: '#3776ab', java: '#b07219',
    cpp: '#f34b7d', c: '#555555', h: '#555555', cs: '#178600',
    php: '#4f5d95', rb: '#701516', go: '#00add8', rs: '#dea584',
    swift: '#f05138', kt: '#a97bff', sql: '#e38c00', json: '#292929',
    xml: '#0060ac', yaml: '#cb171e', yml: '#cb171e', md: '#083fa1',
    txt: '#888888', sh: '#89e051', bat: '#c1f12e', env: '#ecd53f',
    gitignore: '#f05032', dockerfile: '#384d54'
  }
  return colorMap[ext] || '#8c8c8c'
}

async function ensureWorkspace() {
  if (workspaceFolders.value.length === 0) {
    const defaultFolder = {
      name: 'AI 工作区',
      path: 'workspace/ai-workspace',
      type: 'folder',
      children: [
        {
          name: 'frontend',
          path: 'workspace/ai-workspace/frontend',
          type: 'folder',
          children: [],
          _cachedContent: null
        },
        {
          name: 'backend',
          path: 'workspace/ai-workspace/backend',
          type: 'folder',
          children: [],
          _cachedContent: null
        },
        {
          name: 'shared',
          path: 'workspace/ai-workspace/shared',
          type: 'folder',
          children: [],
          _cachedContent: null
        }
      ],
      _cachedContent: null
    }
    workspaceFolders.value.push(defaultFolder)
    expandedFolders.value.add(defaultFolder.path)
    expandedFolders.value.add('workspace/ai-workspace/frontend')
    expandedFolders.value.add('workspace/ai-workspace/backend')
    expandedFolders.value.add('workspace/ai-workspace/shared')
    await saveWorkspaceState()
  } else {
    const rootFolder = workspaceFolders.value[0]
    if (rootFolder && rootFolder.children) {
      const hasFrontend = rootFolder.children.some(c => c.type === 'folder' && c.name === 'frontend')
      const hasBackend = rootFolder.children.some(c => c.type === 'folder' && c.name === 'backend')
      const hasShared = rootFolder.children.some(c => c.type === 'folder' && c.name === 'shared')
      if (!hasFrontend) {
        rootFolder.children.unshift({
          name: 'frontend',
          path: `${rootFolder.path}/frontend`,
          type: 'folder',
          children: [],
          _cachedContent: null
        })
        expandedFolders.value.add(`${rootFolder.path}/frontend`)
      }
      if (!hasBackend) {
        rootFolder.children.splice(rootFolder.children.findIndex(c => c.type === 'folder' && c.name === 'frontend') + 1, 0, {
          name: 'backend',
          path: `${rootFolder.path}/backend`,
          type: 'folder',
          children: [],
          _cachedContent: null
        })
        expandedFolders.value.add(`${rootFolder.path}/backend`)
      }
      if (!hasShared) {
        rootFolder.children.splice(rootFolder.children.findIndex(c => c.type === 'folder' && c.name === 'backend') + 1, 0, {
          name: 'shared',
          path: `${rootFolder.path}/shared`,
          type: 'folder',
          children: [],
          _cachedContent: null
        })
        expandedFolders.value.add(`${rootFolder.path}/shared`)
      }
    }
  }
}

async function createNewFile() {
  await ensureWorkspace()

  const fileName = prompt('请输入文件名（含扩展名，如 index.html）：')
  if (!fileName || !fileName.trim()) return

  const trimmedName = fileName.trim()
  if (trimmedName.includes('/') || trimmedName.includes('\\')) {
    alert('文件名不能包含 / 或 \\')
    return
  }

  const subFolder = getTargetSubFolder(trimmedName)
  const folderPath = subFolder ? subFolder.path : workspaceFolders.value[0]?.path || 'workspace/ai-workspace'
  const fullPath = `${folderPath}/${trimmedName}`
  const existing = findFileInTree(workspaceFolders.value, fullPath)
  if (existing) {
    alert(`文件「${trimmedName}」已存在，将直接打开`)
    openFileInTree(existing)
    return
  }

  const ext = trimmedName.split('.').pop()?.toLowerCase() || 'txt'
  const fileNode = {
    name: trimmedName,
    path: fullPath,
    type: 'file',
    isText: true,
    _cachedContent: '',
    fromIDB: true
  }

  const parent = subFolder || workspaceFolders.value[0]
  if (parent && parent.children) {
    parent.children.push(fileNode)
  }
  expandedFolders.value.add(folderPath)

  await saveFileToServer(trimmedName, fullPath, '')
  try {
    await idbSaveFile(fullPath, '', {
      folderPath: folderPath,
      name: trimmedName,
      language: ext
    })
  } catch (e) {
    console.warn('[IndexedDB] 新建文件保存失败:', e)
  }

  await saveWorkspaceState()

  currentFileName.value = trimmedName
  currentFilePath.value = fullPath
  currentFileType.value = 'text/plain'
  editorContent.value = ''
  originalContent.value = ''
  showEditor.value = true
  isModified.value = false
  selectedFilePath.value = fullPath

  nextTick(() => {
    if (monacoRef.value) monacoRef.value.focus()
  })
}

async function createNewFolder() {
  await ensureWorkspace()

  const folderName = prompt('请输入文件夹名称：')
  if (!folderName || !folderName.trim()) return

  const trimmedName = folderName.trim()
  if (trimmedName.includes('/') || trimmedName.includes('\\')) {
    alert('文件夹名不能包含 / 或 \\')
    return
  }

  const rootFolder = workspaceFolders.value[0]
  const subFolderName = classifyFileType(trimmedName + '.js') === 'backend' ? 'backend' : 'frontend'
  let parentFolder = rootFolder?.children?.find(c => c.type === 'folder' && c.name === subFolderName)
  if (!parentFolder) parentFolder = rootFolder
  const parentPath = parentFolder?.path || 'workspace/ai-workspace'
  const fullPath = `${parentPath}/${trimmedName}`

  const exists = parentFolder?.children?.some(
    c => c.type === 'folder' && c.name === trimmedName
  )
  if (exists) {
    alert(`文件夹「${trimmedName}」已存在`)
    return
  }

  const newFolder = {
    name: trimmedName,
    path: fullPath,
    type: 'folder',
    children: [],
    _cachedContent: null
  }

  if (parentFolder?.children) {
    parentFolder.children.push(newFolder)
  }
  expandedFolders.value.add(fullPath)
  expandedFolders.value.add(parentPath)

  await saveWorkspaceState()
}

function openFolder() {
  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }
  if (folderInput.value) {
    folderInput.value.click()
  }
}

function buildFileTree(files, rootPath) {
  const rootName = rootPath.includes('/') ? rootPath.split('/').pop() : rootPath
  const root = { name: rootName, path: rootPath, children: [], type: 'folder' }
  const fileMap = {}

  for (const file of files) {
    const relPath = file.webkitRelativePath
    const parts = relPath.split('/')
    let current = root
    let currentPath = rootPath

    for (let i = 1; i < parts.length - 1; i++) {
      const subFolder = parts[i]
      currentPath = currentPath + '/' + subFolder
      let folder = fileMap[currentPath]
      if (!folder) {
        folder = { name: subFolder, path: currentPath, children: [], type: 'folder' }
        fileMap[currentPath] = folder
        current.children.push(folder)
      }
      current = folder
    }

    const fileName = parts[parts.length - 1]
    const filePath = currentPath + '/' + fileName
    const fileNode = {
      name: fileName,
      path: filePath,
      type: 'file',
      file: file,
      isText: textExtensions.test(fileName)
    }
    current.children.push(fileNode)
  }

  return root
}

function markFilesFromIDB(node) {
  if (node.type === 'file') {
    node.fromIDB = true
    node.file = null
  }
  if (node.children) {
    for (const child of node.children) {
      markFilesFromIDB(child)
    }
  }
}

// ===== 工作区持久化 =====
async function saveWorkspaceState() {
  const names = workspaceFolders.value.map(f => f.name)
  savedWorkspaces.value = names
  localStorage.setItem('limao_workspaces', JSON.stringify(names))
  const expanded = Array.from(expandedFolders.value)
  localStorage.setItem('limao_expanded', JSON.stringify(expanded))

  // 已登录：同步到服务端
  if (props.isLoggedIn && props.token) {
    try {
      await fetch(`${API_BASE}/ai/data/workspace`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.token}` },
        body: JSON.stringify({ folders: names, expanded })
      })
    } catch (e) {
      console.warn('[Workspace] 服务端保存失败:', e)
    }
  }
}

// 从服务端文件列表重建文件树（不含 File 对象，走 fileId 延迟加载）
function buildServerFileTree(serverFiles, folderName) {
  const rootPath = 'workspace/' + folderName
  const root = { name: folderName, path: rootPath, children: [], type: 'folder' }
  const folderMap = {}
  const textExtRe = textExtensions

  for (const sf of serverFiles) {
    // sf.path = 'workspace/my-project/src/index.js'
    // 去掉 "workspace/my-project/" 得到 'src/index.js'
    const prefix = rootPath + '/'
    const subPath = sf.path.startsWith(prefix) ? sf.path.slice(prefix.length) : ''
    if (!subPath) continue
    const parts = subPath.split('/')
    const fileName = parts.pop()
    let currentPath = rootPath
    let current = root

    for (const folderPart of parts) {
      if (!folderPart) continue
      currentPath = currentPath + '/' + folderPart
      if (!folderMap[currentPath]) {
        const folderNode = { name: folderPart, path: currentPath, children: [], type: 'folder' }
        folderMap[currentPath] = folderNode
        current.children.push(folderNode)
      }
      current = folderMap[currentPath]
    }

    current.children.push({
      name: fileName,
      path: sf.path,
      type: 'file',
      isText: textExtRe.test(fileName),
      fileId: sf.id,
      file: null
    })
  }

  return root
}

// 从本地存储加载工作区（不依赖登录状态）
async function loadWorkspaceFromLocal() {
  try {
    const names = localStorage.getItem('limao_workspaces')
    if (names) {
      savedWorkspaces.value = JSON.parse(names)
    }
    const expanded = localStorage.getItem('limao_expanded')
    if (expanded) {
      const arr = JSON.parse(expanded)
      expandedFolders.value = new Set(arr)
    }

    // 从 IndexedDB 恢复文件树
    const allFiles = await getAllFiles()
    if (allFiles.length > 0) {
      const folderSet = new Set()
      for (const f of allFiles) {
        const match = f.path.match(/^workspace\/([^/]+)/)
        if (match) folderSet.add(match[1])
      }
      if (folderSet.size > 0) {
        const newTrees = []
        for (const folderName of folderSet) {
          const folderFiles = allFiles.filter(f => f.path.startsWith(`workspace/${folderName}/`))
          if (folderFiles.length > 0) {
            const tree = buildIDBFileTree(folderFiles, folderName)
            newTrees.push(tree)
          }
        }
        if (newTrees.length > 0) {
          workspaceFolders.value = newTrees
          savedWorkspaces.value = Array.from(folderSet)
          localStorage.setItem('limao_workspaces', JSON.stringify(savedWorkspaces.value))
        }
      }
    }
  } catch (e) {
    console.warn('[Workspace] 本地加载失败:', e)
  }
}

async function loadWorkspaceState() {
  // 未登录：直接从本地存储加载，不发服务端请求
  if (!props.isLoggedIn || !props.token) {
    await loadWorkspaceFromLocal()
    return
  }

  // 已登录：从服务端加载
  try {
    // 并行加载工作区元数据和文件列表
    const [wsRes, filesRes] = await Promise.all([
      fetch(`${API_BASE}/ai/data/workspace`, { headers: { Authorization: `Bearer ${props.token}` } }),
      fetch(`${API_BASE}/ai/data/files`, { headers: { Authorization: `Bearer ${props.token}` } })
    ])

    // 401 说明 token 已过期，清除并降级到本地
    if (wsRes.status === 401 || filesRes.status === 401) {
      console.warn('[Workspace] Token 已过期，降级到本地加载')
      localStorage.removeItem('limao_token')
      await loadWorkspaceFromLocal()
      return
    }

    const wsJson = await wsRes.json()
    const filesJson = await filesRes.json()

    if (wsJson.success && wsJson.data) {
      if (wsJson.data.expanded?.length) {
        expandedFolders.value = new Set(wsJson.data.expanded)
        localStorage.setItem('limao_expanded', JSON.stringify(wsJson.data.expanded))
      }
    }

    // 如果服务端有文件，直接从文件路径重建文件树
    if (filesJson.success && filesJson.data?.length > 0) {
      const folderSet = new Set()
      for (const f of filesJson.data) {
        const match = f.path.match(/^workspace\/([^/]+)/)
        if (match) folderSet.add(match[1])
      }

      if (folderSet.size > 0) {
        const newTrees = []
        const allExpanded = new Set()
        for (const folderName of folderSet) {
          const folderFiles = filesJson.data.filter(f =>
            f.path.startsWith(`workspace/${folderName}/`) || f.path === `workspace/${folderName}`
          )
          if (folderFiles.length > 0) {
            const tree = buildServerFileTree(folderFiles, folderName)
            newTrees.push(tree)
            allExpanded.add('workspace/' + folderName)
          }
        }
        if (newTrees.length > 0) {
          workspaceFolders.value = newTrees
          if (allExpanded.size > 0) {
            expandedFolders.value = allExpanded
          }
          savedWorkspaces.value = Array.from(folderSet)
          localStorage.setItem('limao_workspaces', JSON.stringify(savedWorkspaces.value))
          await syncWorkspaceState()
          return
        }
      }
    }
  } catch (e) {
    console.warn('[Workspace] 服务端加载失败，降级到本地:', e)
  }

  // 服务端加载失败：从本地加载
  await loadWorkspaceFromLocal()
}

function buildIDBFileTree(idbFiles, folderName) {
  const rootPath = 'workspace/' + folderName
  const root = { name: folderName, path: rootPath, children: [], type: 'folder' }
  const folderMap = {}

  for (const f of idbFiles) {
    const prefix = rootPath + '/'
    const subPath = f.path.startsWith(prefix) ? f.path.slice(prefix.length) : ''
    if (!subPath) continue
    const parts = subPath.split('/')
    const fileName = parts.pop()
    let currentPath = rootPath
    let current = root

    for (const folderPart of parts) {
      if (!folderPart) continue
      currentPath = currentPath + '/' + folderPart
      if (!folderMap[currentPath]) {
        const folderNode = { name: folderPart, path: currentPath, children: [], type: 'folder' }
        folderMap[currentPath] = folderNode
        current.children.push(folderNode)
      }
      current = folderMap[currentPath]
    }

    current.children.push({
      name: fileName,
      path: f.path,
      type: 'file',
      isText: true,
      file: null,
      fromIDB: true
    })
  }

  return root
}

async function restoreWorkspace(folderName) {
  const folderPath = 'workspace/' + folderName
  const existing = workspaceFolders.value.find(f => f.name === folderName)
  if (existing) return

  const token = localStorage.getItem('limao_token')
  let restored = false

  if (token) {
    try {
      const res = await fetch('/api/ai/data/files', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          const folderFiles = data.data.filter(f => f.path && f.path.startsWith(folderPath + '/'))
          if (folderFiles.length > 0) {
            const tree = buildServerFileTree(folderFiles, folderName)
            workspaceFolders.value.push(tree)
            expandedFolders.value.add(folderName)
            restored = true
          }
        }
      }
    } catch {}
  }

  if (!restored) {
    try {
      const allFiles = await getAllFiles()
      const folderFiles = allFiles.filter(f => f.path && f.path.startsWith(folderPath + '/'))
      if (folderFiles.length > 0) {
        const tree = buildIDBFileTree(folderFiles, folderName)
        workspaceFolders.value.push(tree)
        expandedFolders.value.add(folderName)
        restored = true
      }
    } catch {}
  }

  if (!restored) {
    if (folderInput.value) folderInput.value.click()
  }
}

async function handleFolderSelect(event) {
  const files = Array.from(event.target.files)
  if (!files.length) return
  if (!props.isLoggedIn) {
    event.target.value = ''
    emit('openAuth')
    return
  }

  const folderName = files[0].webkitRelativePath.split('/')[0]
  const folderPath = 'workspace/' + folderName

  const textFiles = files.filter(f => textExtensions.test(f.name))
  const totalSize = textFiles.reduce((s, f) => s + f.size, 0)
  if (totalSize > 50 * 1024 * 1024) {
    alert('总文本文件大小超过50MB，请减少文件数量')
    event.target.value = ''
    return
  }

  uploadStatus.value = '正在读取文件...'
  uploadProgress.value = 10

  const folderNode = buildFileTree(files, folderPath)

  const idbFiles = []
  for (const file of textFiles) {
    const relPath = file.webkitRelativePath
    const filePath = folderPath + '/' + relPath.split('/').slice(1).join('/')
    try {
      const content = await file.text()
      idbFiles.push({
        path: filePath,
        content,
        folderPath,
        name: file.name,
        language: file.name.split('.').pop() || 'text',
        size: file.size
      })
    } catch (e) {
      console.warn(`[读取失败] ${file.name}:`, e)
    }
  }

  uploadStatus.value = '正在保存到本地...'
  uploadProgress.value = 30

  if (idbFiles.length > 0) {
    try {
      await saveFilesBatch(idbFiles)
    } catch (e) {
      console.warn('[IndexedDB] 保存失败:', e)
    }
  }

  for (let i = 0; i < workspaceFolders.value.length; i++) {
    if (workspaceFolders.value[i].name === folderName) {
      workspaceFolders.value[i] = folderNode
      expandedFolders.value.add(folderPath)
      attachedFolder.value = { name: folderName, files: textFiles, fileCount: textFiles.length, treePath: folderPath }
      saveWorkspaceState()
      event.target.value = ''
      await uploadFolderFilesToServer(idbFiles, folderPath)
      markFilesFromIDB(folderNode)
      return
    }
  }

  workspaceFolders.value.push(folderNode)
  expandedFolders.value.add(folderPath)
  attachedFolder.value = { name: folderName, files: textFiles, fileCount: textFiles.length, treePath: folderPath }
  saveWorkspaceState()
  event.target.value = ''
  await uploadFolderFilesToServer(idbFiles, folderPath)
  markFilesFromIDB(folderNode)
}

function toggleFolder(path) {
  if (expandedFolders.value.has(path)) {
    expandedFolders.value.delete(path)
  } else {
    expandedFolders.value.add(path)
  }
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const icons = {
    js: 'JS', ts: 'TS', tsx: 'TS', jsx: 'JS', vue: 'V', html: 'H', css: 'C', scss: 'S',
    py: 'P', java: 'J', go: 'G', rs: 'R', rb: 'RB', php: 'P',
    json: '{}', xml: '<>', md: 'M', yml: 'Y', yaml: 'Y',
    txt: 'T', sh: '$', bat: 'B', env: 'E'
  }
  return icons[ext] || 'F'
}

function togglePreview() {
  if (showPreview.value) {
    showPreview.value = false
    previewUrl.value = ''
    return
  }
  const content = editorContent.value
  if (!content) return

  const fileName = currentFileName.value.toLowerCase()
  const isHtml = fileName.endsWith('.html') || fileName.endsWith('.htm')
  const isVue = fileName.endsWith('.vue')
  const isCss = fileName.endsWith('.css') || fileName.endsWith('.scss') || fileName.endsWith('.less')

  if (isHtml) {
    let html = content
    const workspaceCss = collectWorkspaceFiles(['.css', '.scss', '.less'])
    const workspaceJs = collectWorkspaceFiles(['.js'])
    
    if (workspaceCss.length > 0 || workspaceJs.length > 0) {
      const cssLinks = workspaceCss.map(f => `<style>/* ${f.name} */\n${f.content}</style>`).join('\n')
      const jsScripts = workspaceJs.map(f => `<script>${f.content}<\/script>`).join('\n')
      
      if (!html.includes('<head>')) {
        html = `<!DOCTYPE html><html><head><meta charset="utf-8">${cssLinks}</head><body>${html.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<html[^>]*>/i, '').replace(/<\/html>/i, '')}${jsScripts}</body></html>`
      } else {
        html = html.replace('</head>', `${cssLinks}</head>`)
        html = html.replace('</body>', `${jsScripts}</body>`)
      }
    }
    
    const blob = new Blob([html], { type: 'text/html' })
    previewUrl.value = URL.createObjectURL(blob)
    showPreview.value = true
  } else if (isVue) {
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
    const template = templateMatch ? templateMatch[1].trim() : '<div>预览不可用：未找到template</div>'
    const style = styleMatch ? styleMatch[1].trim() : ''
    
    let reactiveData = {}
    let methods = {}
    if (scriptMatch) {
      const scriptContent = scriptMatch[1]
      const dataMatch = scriptContent.match(/(?:data\s*\(\s*\)\s*\{[\s\S]*?return\s*)(\{[\s\S]*?\})/)
      if (dataMatch) {
        try {
          reactiveData = new Function('return ' + dataMatch[1])()
        } catch (e) { /* ignore */ }
      }
      const methodsMatch = scriptContent.match(/methods\s*:\s*\{([\s\S]*?)\}/)
      if (methodsMatch) {
        try {
          methods = new Function('return {' + methodsMatch[1] + '}')()
        } catch (e) { /* ignore */ }
      }
    }
    
    let processedTemplate = template
    processedTemplate = processedTemplate.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
      try {
        const value = expr.trim().split('.').reduce((obj, key) => obj?.[key], reactiveData)
        return value !== undefined ? value : match
      } catch { return match }
    })
    processedTemplate = processedTemplate.replace(/\bv-if="([^"]+)"/g, '')
    processedTemplate = processedTemplate.replace(/\bv-show="([^"]+)"/g, 'style="display:block"')
    processedTemplate = processedTemplate.replace(/\bv-for="[^"]*in\s+(\w+)"[^>]*>/g, (match, arrName) => {
      const arr = reactiveData[arrName]
      if (Array.isArray(arr)) {
        return `>`
      }
      return '>'
    })
    processedTemplate = processedTemplate.replace(/@click="([^"]+)"/g, 'onclick="$1"')
    processedTemplate = processedTemplate.replace(/\bv-model="([^"]+)"/g, '')
    processedTemplate = processedTemplate.replace(/:class="([^"]+)"/g, '')
    processedTemplate = processedTemplate.replace(/:style="([^"]+)"/g, '')
    processedTemplate = processedTemplate.replace(/:src="([^"]+)"/g, '')
    processedTemplate = processedTemplate.replace(/<router-link[^>]*>([^<]*)<\/router-link>/g, '<span style="color:#409eff;text-decoration:underline;cursor:pointer">$1</span>')
    processedTemplate = processedTemplate.replace(/<RouterView[^>]*\/?>/g, '<div style="padding:8px;color:#86909c;border:1px dashed #ddd;border-radius:4px">[路由视图]</div>')

    const workspaceCss = collectWorkspaceFiles(['.css', '.scss', '.less'])
    const extraCss = workspaceCss.map(f => f.content).join('\n')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}${style}\n${extraCss}</style></head><body>${processedTemplate}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    previewUrl.value = URL.createObjectURL(blob)
    showPreview.value = true
  } else if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
    const templateMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}/)
    const template = templateMatch ? templateMatch[1].trim() : '<div>预览不可用</div>'
    const styleMatch = content.match(/(?:const|let|var)\s+\w*\s*=\s*(?:styled|css|makeStyles)[\s\S]*?[`'"]([\s\S]*?)[`'"]/)
    const style = styleMatch ? styleMatch[1].trim() : ''
    
    let processed = template
    processed = processed.replace(/className=/g, 'class=')
    processed = processed.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    processed = processed.replace(/\{[^}]*\?\s*([^:}]*)\s*:\s*([^}]*)\}/g, '$1')
    processed = processed.replace(/\{`([^`]*)`\}/g, '$1')
    processed = processed.replace(/\{"([^"]*)"\}/g, '$1')
    processed = processed.replace(/onClick=\{[^}]*\}/g, '')
    processed = processed.replace(/onChange=\{[^}]*\}/g, '')
    
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}${style}</style></head><body>${processed}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    previewUrl.value = URL.createObjectURL(blob)
    showPreview.value = true
  } else if (isCss) {
    const selectors = (content.match(/[\w.#\[\]:,>+~\s-]+\s*\{/g) || []).map(s => s.replace(/\s*\{/, '').trim())
    let sampleHtml = ''
    
    const hasButton = selectors.some(s => s.includes('button') || s.includes('btn'))
    const hasInput = selectors.some(s => s.includes('input') || s.includes('form'))
    const hasCard = selectors.some(s => s.includes('card'))
    const hasNav = selectors.some(s => s.includes('nav') || s.includes('header'))
    const hasTable = selectors.some(s => s.includes('table'))
    const hasList = selectors.some(s => s.includes('list') || s.includes('li'))
    
    if (hasNav) sampleHtml += '<nav><div class="nav-brand">Logo</div><div class="nav-links"><a href="#">首页</a><a href="#">关于</a></div></nav>\n'
    if (hasCard) sampleHtml += '<div class="card"><div class="card-header">卡片标题</div><div class="card-body">卡片内容</div></div>\n'
    if (hasTable) sampleHtml += '<table><thead><tr><th>名称</th><th>值</th></tr></thead><tbody><tr><td>项目1</td><td>100</td></tr></tbody></table>\n'
    sampleHtml += '<div class="container">\n'
    sampleHtml += '  <h1>样式预览</h1>\n'
    sampleHtml += '  <p>这是一段示例文字，用于展示排版效果。</p>\n'
    if (hasButton) sampleHtml += '  <button>默认按钮</button> <button class="primary">主要按钮</button>\n'
    if (hasInput) sampleHtml += '  <input type="text" placeholder="输入框" />\n'
    if (hasList) sampleHtml += '  <ul><li>列表项 1</li><li>列表项 2</li><li>列表项 3</li></ul>\n'
    sampleHtml += '</div>'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${content}</style></head><body>${sampleHtml}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    previewUrl.value = URL.createObjectURL(blob)
    showPreview.value = true
  } else {
    const isDark = darkMode.value
    const bg = isDark ? '#121212' : '#fafafa'
    const color = isDark ? '#d4d4d4' : '#333'
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;background:${bg};color:${color};font-family:monospace;padding:16px;white-space:pre-wrap;}</style></head><body>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    previewUrl.value = URL.createObjectURL(blob)
    showPreview.value = true
  }
}

function refreshPreview() {
  if (!showPreview.value || !editorContent.value) return
  if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = '' }
  showPreview.value = false
  togglePreview()
}

function collectWorkspaceFiles(extensions) {
  const files = []
  function walk(nodes) {
    for (const node of nodes) {
      if (node.type === 'file' && extensions.some(ext => (node.name || '').toLowerCase().endsWith(ext))) {
        if (node._cachedContent) {
          files.push({ name: node.name, path: node.path, content: node._cachedContent })
        }
      } else if (node.type === 'folder' && node.children) {
        walk(node.children)
      }
    }
  }
  for (const folder of workspaceFolders.value) {
    if (folder.children) walk(folder.children)
  }
  return files
}

async function openFileInTree(fileNode) {
  if (fileNode.type !== 'file') return
  
  // Check if file already in tabs
  const existingTab = editorTabs.value.find(tab => tab.path === fileNode.path)
  
  // Save current tab if modified
  if (isModified.value && currentFilePath.value) {
    const currentTab = editorTabs.value.find(tab => tab.path === currentFilePath.value)
    if (currentTab) {
      currentTab.content = editorContent.value
      currentTab.modified = true
    }
  }

  if (existingTab) {
    switchToTab(existingTab)
    return
  }

  let content = ''
  if (fileNode._cachedContent !== undefined) {
    content = fileNode._cachedContent
  } else if (fileNode.fromIDB) {
    try {
      const fileData = await getFile(fileNode.path)
      if (fileData) {
        content = fileData.content || ''
        fileNode._cachedContent = content
      } else {
        alert('IndexedDB 文件读取失败：未找到文件')
        return
      }
    } catch {
      alert('IndexedDB 文件读取失败')
      return
    }
  } else if (fileNode.fileId && props.isLoggedIn) {
    if (!fileNode.isText) {
      content = `[二进制文件 - ${fileNode.name}]`
    } else {
      try {
        const res = await fetch(`${API_BASE}/ai/data/files/${fileNode.fileId}`, {
          headers: { Authorization: `Bearer ${props.token}` }
        })
        const json = await res.json()
        if (json.success && json.data) {
          content = json.data.content || ''
          fileNode._cachedContent = content
        }
      } catch {
        alert('服务端文件读取失败')
        return
      }
    }
  } else if (fileNode.file) {
    if (fileNode.isText) {
      try {
        content = await fileNode.file.text()
      } catch {
        alert('文件读取失败')
        return
      }
    } else {
      content = `[二进制文件 - ${fileNode.name}]\n大小: ${(fileNode.file.size / 1024).toFixed(2)} KB`
    }
  }

  // Create new tab
  const newTab = {
    path: fileNode.path,
    name: fileNode.name,
    content: content,
    originalContent: content,
    modified: false,
    language: fileNode.name.split('.').pop() || 'text'
  }
  
  editorTabs.value.push(newTab)
  switchToTab(newTab)
  selectedFilePath.value = fileNode.path
  showEditor.value = true
}

function switchToTab(tab) {
  // Save current tab state first
  if (isModified.value && currentFilePath.value) {
    const currentTab = editorTabs.value.find(t => t.path === currentFilePath.value)
    if (currentTab) {
      currentTab.content = editorContent.value
      currentTab.modified = true
    }
  }

  activeTab.value = tab.path
  currentFilePath.value = tab.path
  currentFileName.value = tab.name
  editorContent.value = tab.content
  originalContent.value = tab.originalContent
  isModified.value = tab.modified
  selectedFilePath.value = tab.path

  nextTick(() => {
    updateScrollButtons()
  })
}

function closeTab(tab) {
  const tabIndex = editorTabs.value.findIndex(t => t.path === tab.path)
  if (tabIndex === -1) return

  editorTabs.value.splice(tabIndex, 1)

  if (activeTab.value === tab.path) {
    if (editorTabs.value.length > 0) {
      const newActiveIndex = Math.min(tabIndex, editorTabs.value.length - 1)
      switchToTab(editorTabs.value[newActiveIndex])
    } else {
      activeTab.value = ''
      currentFilePath.value = ''
      currentFileName.value = ''
      editorContent.value = ''
      originalContent.value = ''
      isModified.value = false
      showEditor.value = false
    }
  }
}

async function removeFolder(path) {
  const folderName = path.replace(/^workspace\//, '')
  explorerDeleteType.value = 'folder'
  explorerDeleteTarget.value = path
  showExplorerDeleteConfirm.value = true
}

async function removeSavedWorkspace(name) {
  explorerDeleteType.value = 'workspace'
  explorerDeleteTarget.value = name
  showExplorerDeleteConfirm.value = true
}

async function syncWorkspaceState() {
  if (!props.isLoggedIn || !props.token) return
  try {
    await fetch(`${API_BASE}/ai/data/workspace`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.token}` },
      body: JSON.stringify({ folders: savedWorkspaces.value, expanded: Array.from(expandedFolders.value) })
    })
  } catch (e) {
    console.warn('[Workspace] 同步失败:', e)
  }
}

async function removeAllFolders() {
  explorerDeleteType.value = 'all'
  explorerDeleteTarget.value = null
  showExplorerDeleteConfirm.value = true
}

async function confirmExplorerDelete() {
  const type = explorerDeleteType.value
  const target = explorerDeleteTarget.value
  showExplorerDeleteConfirm.value = false

  if (type === 'folder') {
    const path = target
    workspaceFolders.value = workspaceFolders.value.filter(f => f.path !== path)
    expandedFolders.value.delete(path)
    if (selectedFilePath.value.startsWith(path + '/')) {
      closeEditor()
    }
    saveWorkspaceState()
    try {
      await deleteFilesByFolder(path)
    } catch (e) {
      console.warn('[IndexedDB] 删除文件夹失败:', e)
    }
    if (props.isLoggedIn && props.token) {
      const folderName = path.replace(/^workspace\//, '')
      try {
        await fetch(`${API_BASE}/ai/data/files/folder?prefix=${encodeURIComponent(folderName)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${props.token}` }
        })
      } catch (e) {
        console.warn('[文件] 服务端删除失败:', e)
      }
    }
  } else if (type === 'workspace') {
    const name = target
    savedWorkspaces.value = savedWorkspaces.value.filter(n => n !== name)
    localStorage.setItem('limao_workspaces', JSON.stringify(savedWorkspaces.value))
    workspaceFolders.value = workspaceFolders.value.filter(f => f.name !== name)
    const folderPath = 'workspace/' + name
    expandedFolders.value.delete(folderPath)
    localStorage.setItem('limao_expanded', JSON.stringify(Array.from(expandedFolders.value)))
    if (currentFilePath.value?.startsWith(folderPath)) {
      closeEditor()
    }
    syncWorkspaceState()
    try {
      await deleteFilesByFolder(folderPath)
    } catch (e) {
      console.warn('[IndexedDB] 清理本地文件失败:', e)
    }
    if (props.isLoggedIn && props.token) {
      try {
        await fetch(`${API_BASE}/ai/data/files/folder?prefix=${encodeURIComponent(name)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${props.token}` }
        })
      } catch (e) {
        console.warn('[Workspace] 删除服务器文件失败:', e)
      }
    }
  } else if (type === 'all') {
    workspaceFolders.value = []
    expandedFolders.value.clear()
    savedWorkspaces.value = []
    localStorage.removeItem('limao_workspaces')
    localStorage.removeItem('limao_expanded')
    closeEditor()
    syncWorkspaceState()
    if (props.isLoggedIn && props.token) {
      try {
        const res = await fetch(`${API_BASE}/ai/data/files`, {
          headers: { Authorization: `Bearer ${props.token}` }
        })
        const json = await res.json()
        if (json.success && json.data) {
          for (const file of json.data) {
            await fetch(`${API_BASE}/ai/data/files/${file.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${props.token}` }
            })
          }
        }
      } catch (e) {
        console.warn('[文件] 批量删除失败:', e)
      }
    }
  }

  explorerDeleteType.value = ''
  explorerDeleteTarget.value = null
}

async function organizeWorkspace() {
  if (workspaceFolders.value.length === 0) return
  const root = workspaceFolders.value[0]
  if (!root || !root.children) return

  let movedCount = 0
  const filesToMove = []

  function collectFiles(nodes, parentPath) {
    for (const node of nodes) {
      if (node.type === 'file') {
        const fileName = node.name.toLowerCase()
        const currentPath = node.path
        const category = classifyFileType(fileName)
        
        const isInFrontend = currentPath.includes('/frontend/')
        const isInBackend = currentPath.includes('/backend/')
        const isInShared = currentPath.includes('/shared/')

        let needsMove = false
        let targetCategory = category

        if (isInFrontend && category !== 'frontend') needsMove = true
        if (isInBackend && category !== 'backend') needsMove = true
        if (isInShared && category !== 'shared') needsMove = true
        if (!isInFrontend && !isInBackend && !isInShared) needsMove = true

        if (needsMove) {
          filesToMove.push({ node, currentPath, targetCategory, fileName })
        }
      } else if (node.type === 'folder' && node.children) {
        collectFiles(node.children, node.path)
      }
    }
  }

  collectFiles(root.children, root.path)

  if (filesToMove.length === 0) {
    editorApplyNotice.value = '✅ 文件结构已经整洁，无需整理'
    setTimeout(() => { editorApplyNotice.value = '' }, 3000)
    return
  }

  for (const { node, currentPath, targetCategory, fileName } of filesToMove) {
    const targetFolder = root.children.find(c => c.type === 'folder' && c.name === targetCategory)
    if (!targetFolder) continue
    if (targetFolder.path === currentPath.split('/').slice(0, -1).join('/')) continue

    const newPath = `${targetFolder.path}/${fileName}`
    const existingTarget = findFileInTree(workspaceFolders.value, newPath)
    if (existingTarget) continue

    const content = node._cachedContent || ''
    
    if (targetFolder.children) {
      targetFolder.children.push({
        name: fileName,
        path: newPath,
        type: 'file',
        isText: true,
        _cachedContent: content,
        fromIDB: true
      })
    }

    saveFileToServer(fileName, newPath, content)
    try {
      await idbSaveFile(newPath, content, {
        folderPath: targetFolder.path,
        name: fileName,
        language: fileName.split('.').pop() || 'text'
      })
    } catch (e) {
      console.warn('[整理] IndexedDB保存失败:', e)
    }

    await deleteFileFromWorkspace(currentPath)
    movedCount++
  }

  if (movedCount > 0) {
    expandedFolders.value.add(root.path)
    await saveWorkspaceState()
    editorApplyNotice.value = `📁 已整理 ${movedCount} 个文件到正确分类`
  } else {
    editorApplyNotice.value = '✅ 文件结构已经整洁，无需整理'
  }
  setTimeout(() => { editorApplyNotice.value = '' }, 3000)
}

async function saveFileToServer(name, path, content) {
  if (!props.isLoggedIn || !props.token) return
  try {
    const ext = name.split('.').pop() || 'text'
    await fetch(`${API_BASE}/ai/data/files`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.token}` },
      body: JSON.stringify({ name, path: path || name, content, language: ext })
    })
  } catch (e) {
    console.warn('[AI Files] 服务端保存失败:', e)
  }
}

async function downloadFile() {
  if (!currentFileName.value) return

  editorApplyNotice.value = '正在保存...'
  await saveFileToServer(currentFileName.value, currentFilePath.value, editorContent.value)

  if (currentFilePath.value) {
    try {
      await idbSaveFile(currentFilePath.value, editorContent.value, {
        folderPath: currentFilePath.value.split('/').slice(0, 2).join('/'),
        name: currentFileName.value,
        language: currentFileName.value.split('.').pop() || 'text'
      })
    } catch (e) {
      console.warn('[IndexedDB] 保存编辑文件失败:', e)
    }
    const fileNode = findFileInTree(workspaceFolders.value, currentFilePath.value)
    if (fileNode) {
      fileNode._cachedContent = editorContent.value
      fileNode.fromIDB = true
    }
  }

  editorApplyNotice.value = '已保存'
  setTimeout(() => { editorApplyNotice.value = '' }, 2000)

  originalContent.value = editorContent.value
  isModified.value = false

  const blob = new Blob([editorContent.value], { type: currentFileType.value || 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url

  const filePath = currentFilePath.value || currentFileName.value
  const lastDot = filePath.lastIndexOf('.')
  const baseName = lastDot > 0 ? filePath.substring(0, lastDot) : filePath
  const ext = lastDot > 0 ? filePath.substring(lastDot) : ''

  const versionKey = currentFilePath.value || currentFileName.value
  const currentVersion = downloadVersionMap.value[versionKey] || 0
  const newVersion = currentVersion + 1
  downloadVersionMap.value[versionKey] = newVersion

  a.download = `${baseName}(${newVersion})${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  editorApplyNotice.value = `已下载 ${baseName}(${newVersion})${ext} — 第 ${newVersion} 次下载`
  setTimeout(() => { editorApplyNotice.value = '' }, 3000)

  originalContent.value = editorContent.value
  isModified.value = false
}

async function confirmApply() {
  const acceptedChanges = pendingChanges.value.filter(c => c._accepted)
  const hasNewFiles = acceptedChanges.some(c => c.isNewFile)
  if (hasNewFiles) await ensureWorkspace()
  for (const change of acceptedChanges) {
    let fileNode = findFileInTree(workspaceFolders.value, change.path)
    if (!fileNode && change.isNewFile) {
      const pathParts = change.path.split('/')
      if (pathParts.length > 2) {
        let current = workspaceFolders.value[0]
        for (let i = 2; i < pathParts.length - 1; i++) {
          const subFolderName = pathParts[i]
          let subFolder = current?.children?.find(c => c.type === 'folder' && c.name === subFolderName)
          if (!subFolder) {
            subFolder = { name: subFolderName, path: pathParts.slice(0, i + 1).join('/'), type: 'folder', children: [], _cachedContent: null }
            if (!current.children) current.children = []
            current.children.push(subFolder)
            expandedFolders.value.add(subFolder.path)
          }
          current = subFolder
        }
      }
      const parentPath = change.path.split('/').slice(0, -1).join('/')
      let parent = findFileInTree(workspaceFolders.value, parentPath)
      if (!parent) parent = workspaceFolders.value[0]
      if (parent && parent.children) {
        parent.children.push({
          name: change.name,
          path: change.path,
          type: 'file',
          isText: true,
          _cachedContent: change.newContent,
          fromIDB: true
        })
        expandedFolders.value.add(parentPath)
      }
    } else if (fileNode) {
      fileNode._cachedContent = change.newContent
      fileNode.fromIDB = true
    }
    saveFileToServer(change.name, change.path, change.newContent)
    if (change.path) {
      try {
        await idbSaveFile(change.path, change.newContent, {
          folderPath: change.path.split('/').slice(0, 2).join('/'),
          name: change.name,
          language: change.lang || 'text'
        })
      } catch (e) {
        console.warn('[IndexedDB] AI 确认应用保存失败:', e)
      }
    }
  }
  if (showEditor.value && acceptedChanges.length > 0) {
    const firstChange = acceptedChanges.find(c => c.path === currentFilePath.value)
    if (firstChange) {
      editorContent.value = firstChange.newContent
      originalContent.value = firstChange.newContent
      isModified.value = false
      if (monacoRef.value) monacoRef.value.clearAIDecorations()
    }
  }
  const names = acceptedChanges.map(c => c.name)
  if (names.length > 0) {
    editorApplyNotice.value = `已应用 ${names.join(', ')}`
    setTimeout(() => { editorApplyNotice.value = '' }, 3000)
  }
  await saveWorkspaceState()
  showApplyModal.value = false
  pendingChanges.value = []
}

async function rejectApply() {
  if (showEditor.value && currentFilePath.value && originalContent.value) {
    editorContent.value = originalContent.value
    if (monacoRef.value) monacoRef.value.clearAIDecorations()
  }
  showApplyModal.value = false
  pendingChanges.value = []
}

function acceptSingleChange(change) {
  change._accepted = true
  change._rejected = false
}

function rejectSingleChange(change) {
  change._rejected = true
  change._accepted = false
}

function acceptAllChanges() {
  pendingChanges.value.forEach(c => {
    c._accepted = true
    c._rejected = false
  })
}

function rejectAllChanges() {
  pendingChanges.value.forEach(c => {
    c._rejected = true
    c._accepted = false
  })
}

function computeDiffStats(change) {
  const oldLines = (change.oldContent || '').split('\n').filter(l => l.trim().length > 0)
  const newLines = (change.newContent || '').split('\n').filter(l => l.trim().length > 0)
  const oldSet = new Set(oldLines)
  const newSet = new Set(newLines)

  let addedLines = 0
  let removedLines = 0
  let modLines = 0

  for (const line of newLines) {
    if (!oldSet.has(line)) addedLines++
  }
  for (const line of oldLines) {
    if (!newSet.has(line)) removedLines++
  }

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const ol = oldLines[i] || ''
    const nl = newLines[i] || ''
    if (ol && nl && ol !== nl && oldSet.has(nl) && newSet.has(ol)) {
      modLines++
    }
  }

  change._addedLines = addedLines
  change._removedLines = removedLines
  change._modLines = modLines
  change._accepted = false
  change._rejected = false
  change._expanded = true
}

function collectAllFiles(nodes) {
  const files = []
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      files.push(...collectAllFiles(node.children))
    } else if (node.path) {
      files.push(node)
    }
  }
  return files
}

async function downloadFolderZip(folder) {
  const folderName = folder.name
  const folderPath = folder.path

  editorApplyNotice.value = `正在收集 ${folderName} 的文件...`

  const allNodes = collectAllFiles([folder])
  const fileEntries = []

  for (const node of allNodes) {
    let content = ''
    if (node.content !== undefined) {
      content = node.content
    } else {
      try {
        const dbFile = await getFile(node.path)
        content = dbFile ? dbFile.content : ''
      } catch {}
      if (!content && props.isLoggedIn && props.token) {
        try {
          const res = await fetch(`${API_BASE}/ai/data/files?path=${encodeURIComponent(node.path)}`, {
            headers: { Authorization: `Bearer ${props.token}` }
          })
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.data) content = data.data.content || ''
          }
        } catch {}
      }
    }
    const relativePath = node.path.replace(folderPath + '/', '')
    fileEntries.push({ path: relativePath, content })
  }

  if (fileEntries.length === 0) {
    editorApplyNotice.value = '文件夹中没有可下载的文件'
    setTimeout(() => { editorApplyNotice.value = '' }, 2000)
    return
  }

  editorApplyNotice.value = `正在打包 ${fileEntries.length} 个文件...`

  const zip = new JSZip()
  for (const entry of fileEntries) {
    zip.file(entry.path, entry.content)
  }

  editorApplyNotice.value = '正在生成 ZIP 文件...'

  const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    editorApplyNotice.value = `正在压缩... ${Math.round(metadata.percent)}%`
  })

  const versionKey = 'folder_' + folderPath
  const currentVersion = downloadVersionMap.value[versionKey] || 0
  const newVersion = currentVersion + 1
  downloadVersionMap.value[versionKey] = newVersion

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${folderName}(${newVersion}).zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  editorApplyNotice.value = `已下载 ${folderName}(${newVersion}).zip — 包含 ${fileEntries.length} 个文件 — 第 ${newVersion} 次下载`
  setTimeout(() => { editorApplyNotice.value = '' }, 4000)
}

async function downloadSelectedFiles() {
  if (selectedFiles.value.size === 0) return
  showFileCheckboxes.value = true
  const entries = []
  for (const filePath of selectedFiles.value) {
    let content = ''
    const node = findFileInTree(workspaceFolders.value, filePath)
    if (node && node._cachedContent !== undefined) content = node._cachedContent
    else {
      try { const dbFile = await getFile(filePath); content = dbFile ? dbFile.content : '' } catch {}
    }
    entries.push({ path: filePath.replace(/^workspace\//, ''), content })
  }
  if (entries.length === 1) {
    const blob = new Blob([entries[0].content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = entries[0].path.split('/').pop()
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } else {
    editorApplyNotice.value = `正在打包 ${entries.length} 个文件...`
    const zip = new JSZip()
    for (const e of entries) zip.file(e.path, e.content)
    const blob = await zip.generateAsync({ type: 'blob' }, (m) => {
      editorApplyNotice.value = `正在压缩... ${Math.round(m.percent)}%`
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `files_${Date.now().toString(36)}.zip`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  editorApplyNotice.value = `已下载 ${entries.length} 个文件`
  setTimeout(() => { editorApplyNotice.value = '' }, 3000)
}

function clearFileSelection() {
  selectedFiles.value = new Set()
  showFileCheckboxes.value = false
}

async function downloadWorkspaceZip() {
  if (workspaceFolders.value.length === 0) return
  const allFiles = workspaceFolders.value.flatMap(f => collectAllFiles([f]))
  if (allFiles.length === 0) return
  editorApplyNotice.value = `正在收集 ${allFiles.length} 个文件...`
  const entries = []
  for (const node of allFiles) {
    let content = node._cachedContent || ''
    if (!content) { try { const dbFile = await getFile(node.path); if (dbFile) content = dbFile.content } catch {} }
    entries.push({ path: node.path.replace(/^workspace\//, ''), content })
  }
  const zip = new JSZip()
  for (const e of entries) zip.file(e.path, e.content)
  const blob = await zip.generateAsync({ type: 'blob' }, (m) => {
    editorApplyNotice.value = `正在压缩... ${Math.round(m.percent)}%`
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = (workspaceFolders.value[0]?.name || 'workspace') + '_' + Date.now().toString(36) + '.zip'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
  editorApplyNotice.value = `已导出 ZIP — ${entries.length} 个文件`
  setTimeout(() => { editorApplyNotice.value = '' }, 4000)
}

function handleFileTreeCheck({ path, type }) {
  const s = new Set(selectedFiles.value)
  if (type === 'file') { if (s.has(path)) s.delete(path); else s.add(path) }
  else {
    const allPaths = []
    for (const folder of workspaceFolders.value) {
      const node = findFileInTree([folder], path)
      if (node) { for (const child of collectAllFiles([node])) allPaths.push(child.path); break }
    }
    const allChecked = allPaths.every(p => s.has(p))
    for (const p of allPaths) { if (allChecked) s.delete(p); else s.add(p) }
  }
  selectedFiles.value = s
  showFileCheckboxes.value = selectedFiles.value.size > 0
}

function handleFileTreeContextMenu({ event, node }) {
  if (node.type !== 'file') return
  fileClipboard.value = [node]
  fileClipboardMode.value = 'copy'
  showContextMenu(event.clientX, event.clientY, node)
}

let contextMenuEl = null
function showContextMenu(x, y, node) {
  if (contextMenuEl) contextMenuEl.remove()
  const menu = document.createElement('div')
  menu.className = 'custom-context-menu'
  menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:9999;background:#fff;border:1px solid #e5e6eb;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);min-width:160px;padding:4px`
  const items = [
    { label: '复制', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>', action: () => { fileClipboardMode.value = 'copy' } },
    { label: '剪切', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/></svg>', action: () => { fileClipboardMode.value = 'cut' } },
    { label: '重命名', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>', action: () => { if (node) renameFile(node.name, node.path) } },
    { label: '删除', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
      action: async () => { if (node) { saveDeletedForUndo(node.path); await deleteFileFromWorkspace(node.path) } } }
  ]
  for (const item of items) {
    const div = document.createElement('div')
    div.className = 'context-menu-item'
    div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;border-radius:4px;font-size:13px;color:#333'
    div.innerHTML = item.icon + '<span>' + item.label + '</span>'
    div.addEventListener('mouseenter', () => div.style.background = '#f2f3f5')
    div.addEventListener('mouseleave', () => div.style.background = 'transparent')
    div.addEventListener('click', () => { item.action(); menu.remove(); contextMenuEl = null })
    menu.appendChild(div)
  }
  document.body.appendChild(menu)
  contextMenuEl = menu
  setTimeout(() => document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target)) { menu.remove(); contextMenuEl = null; document.removeEventListener('click', closeMenu) }
  }), 0)
}

function handleFileTreeDrop({ srcPath, targetPath, targetType }) {
  if (srcPath === targetPath) return
  fileClipboard.value = [{ path: srcPath, name: srcPath.split('/').pop() }]
  fileClipboardMode.value = 'cut'
  const targetFolder = targetType === 'folder' ? targetPath : targetPath.split('/').slice(0, -1).join('/')
  pasteFilesToFolder(targetFolder)
}

async function pasteFilesToFolder(targetFolderPath) {
  if (fileClipboard.value.length === 0) return
  const folderNode = findFileInTree(workspaceFolders.value, targetFolderPath)
  if (!folderNode || folderNode.type !== 'folder') return
  for (const src of fileClipboard.value) {
    const srcNode = findFileInTree(workspaceFolders.value, src.path)
    if (!srcNode) continue
    if (fileClipboardMode.value === 'cut') await moveFileNode(src.path, targetFolderPath)
    else {
      const newName = src.name.replace(/^(.+?)(\.[^.]+)?$/, '$1_copy$2')
      let content = srcNode._cachedContent || ''
      if (!content) { try { const dbFile = await getFile(src.path); if (dbFile) content = dbFile.content } catch {} }
      await createNewFileInFolder(targetFolderPath, newName, content)
    }
  }
  if (fileClipboardMode.value === 'cut') { fileClipboard.value = []; fileClipboardMode.value = 'copy' }
  saveWorkspaceState()
}

async function moveFileNode(srcPath, targetFolderPath) {
  const srcNode = findFileInTree(workspaceFolders.value, srcPath)
  if (!srcNode) return
  const newPath = targetFolderPath + '/' + srcNode.name
  if (findFileInTree(workspaceFolders.value, newPath)) return
  let content = srcNode._cachedContent || ''
  if (!content) { try { const dbFile = await getFile(srcPath); if (dbFile) content = dbFile.content } catch {} }
  const srcParentPath = srcPath.split('/').slice(0, -1).join('/')
  for (const folder of workspaceFolders.value) {
    const parent = findFileInTree([folder], srcParentPath)
    if (parent && parent.children) {
      const idx = parent.children.findIndex(c => c.path === srcPath)
      if (idx !== -1) { parent.children.splice(idx, 1); break }
    }
  }
  try { await deleteFile(srcPath) } catch {}
  await idbSaveFile(newPath, content, { folderPath: newPath.split('/').slice(0, 2).join('/'), name: srcNode.name, language: srcNode.name.split('.').pop() || 'text' })
  const targetNode = findFileInTree(workspaceFolders.value, targetFolderPath)
  if (targetNode && targetNode.children) {
    targetNode.children.push({ name: srcNode.name, path: newPath, type: 'file', isText: true, _cachedContent: content, fromIDB: true })
  }
  if (currentFilePath.value === srcPath) currentFilePath.value = newPath
  const tabIdx = editorTabs.value.findIndex(t => t.path === srcPath)
  if (tabIdx !== -1) { editorTabs.value[tabIdx].path = newPath; activeTab.value = newPath }
}

function saveDeletedForUndo(filePath) {
  const node = findFileInTree(workspaceFolders.value, filePath)
  if (!node) return
  let content = node._cachedContent || ''
  deletedFiles.value.push({ path: filePath, name: node.name, content, timestamp: Date.now() })
  if (deletedFiles.value.length > 20) deletedFiles.value.shift()
}

async function undoLastDelete() {
  if (deletedFiles.value.length === 0) return
  const latest = deletedFiles.value.pop()
  const parentPath = latest.path.split('/').slice(0, -1).join('/')
  const parentNode = findFileInTree(workspaceFolders.value, parentPath)
  if (parentNode && parentNode.children) {
    parentNode.children.push({ name: latest.name, path: latest.path, type: 'file', isText: true, _cachedContent: latest.content, fromIDB: true })
  }
  await idbSaveFile(latest.path, latest.content, { folderPath: latest.path.split('/').slice(0, 2).join('/'), name: latest.name, language: latest.name.split('.').pop() || 'text' })
  editorApplyNotice.value = `已撤销删除: ${latest.name}`
  setTimeout(() => { editorApplyNotice.value = '' }, 3000)
  saveWorkspaceState()
}

function saveAIMemory(key, value) {
  if (!userPreferences.value.aiMemory) userPreferences.value.aiMemory = {}
  userPreferences.value.aiMemory[key] = { value, timestamp: Date.now() }
  saveUserPreferences()
}

function buildAIMemoryContext() {
  if (!userPreferences.value.aiMemory) return ''
  const entries = Object.entries(userPreferences.value.aiMemory)
  if (entries.length === 0) return ''
  return '\n\n## 用户偏好与历史记忆 ##\n' + entries
    .sort((a, b) => b[1].timestamp - a[1].timestamp).slice(0, 15)
    .map(([k, v]) => `- ${k}: ${v.value}`).join('\n') + '\n'
}

async function retrieveMemoriesForContext(userInput, currentTopic) {
  try {
    const query = userInput + ' ' + (currentTopic || '')
    const results = await searchMemories(query, 8)
    retrievedMemories.value = results
    if (results.length > 0) {
      return '\n\n## 相关历史记忆 (从过往对话中检索) ##\n' +
        results.map((m, i) => `[记忆${i + 1}] ${m.content || m.topic} (相似度:${Math.round(m._score * 100)}%)`).join('\n') + '\n'
    }
  } catch {}
  retrievedMemories.value = []
  return ''
}

async function saveCurrentConversationMemory() {
  try {
    const topic = currentSessionTitle.value || currentConversationTitle.value || chatSessionTitle.value || ''
    console.log('[Memory] 正在提取记忆, 消息数:', messages.value.length, '话题:', topic)
    await autoExtractMemoriesFromConversation(messages.value, topic)
    console.log('[Memory] 记忆提取完成')
    await refreshMemoryCount()
    console.log('[Memory] 记忆数:', memoryCount.value)
  } catch (e) {
    console.error('[Memory] 保存记忆失败:', e)
  }
}

async function deleteMemoryById(id) {
  try {
    await deleteMemory(id)
    await refreshMemoryCount()
  } catch {}
}

async function clearMemoryStore() {
  if (!confirm('确定清空所有 AI 长期记忆吗？此操作不可撤销。')) return
  try {
    await clearAllMemories()
    retrievedMemories.value = []
    await refreshMemoryCount()
    editorApplyNotice.value = '所有长期记忆已清除'
    setTimeout(() => { editorApplyNotice.value = '' }, 3000)
  } catch {}
}

async function fetchAgentStatus() {
  if (!props.isLoggedIn || !props.token) return
  try {
    const res = await fetch(`${API_BASE}/ai/agent/status`, {
      headers: { 'Authorization': `Bearer ${props.token}` }
    })
    const data = await res.json()
    if (data.success) {
      agentHasAccess.value = data.data.hasAccess
      agentApplyStatus.value = data.data.lastStatus || ''
      localStorage.setItem('limao_agent_apply_status', data.data.lastStatus || '')
      if (data.data.hasAccess) {
        agentQuotaMonthly.value = data.data.quota.monthly.limit
        agentQuotaTotal.value = data.data.quota.total.limit
        const monthlyRemaining = data.data.quota.monthly.limit > 0 ? data.data.quota.monthly.limit - data.data.quota.monthly.used : Infinity
        const totalRemaining = data.data.quota.total.limit > 0 ? data.data.quota.total.limit - data.data.quota.total.used : Infinity
        agentRemainingQuota.value = Math.min(monthlyRemaining, totalRemaining)
      }
    }
  } catch {}
}

async function fetchQaApplyStatus() {
  if (!props.isLoggedIn || !props.token) return
  try {
    const res = await fetch(`${API_BASE}/ai/qa/status`, {
      headers: { 'Authorization': `Bearer ${props.token}` }
    })
    const data = await res.json()
    if (data.success) {
      qaApplyStatus.value = data.data.status
      localStorage.setItem('limao_qa_apply_status', data.data.status)
    }
  } catch {}
}

async function submitQaApply() {
  qaApplyLoading.value = true
  qaApplyError.value = ''
  qaApplySuccess.value = ''
  try {
    const res = await fetch(`${API_BASE}/ai/qa/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.token}` },
      body: JSON.stringify({ reason: agentReason.value || '申请使用AI问答功能' })
    })
    const data = await res.json()
    if (data.success) {
      qaApplyStatus.value = 'pending'
      localStorage.setItem('limao_qa_apply_status', 'pending')
      qaApplySuccess.value = data.message || '申请已提交，请等待管理员审核'
    } else {
      qaApplyError.value = data.message
    }
  } catch {
    qaApplyError.value = '网络请求失败'
  } finally {
    qaApplyLoading.value = false
  }
}

async function switchToQaMode() {
  showModeMenu.value = false
  if (!props.isLoggedIn) {
    editorApplyNotice.value = '请先登录后再使用智能问答'
    setTimeout(() => { editorApplyNotice.value = '' }, 3000)
    return
  }
  await Promise.all([fetchQaApplyStatus(), fetchAgentStatus()])
  if (qaApplyStatus.value === 'approved') {
    aiMode.value = 'qa'
  } else {
    showApplyChoiceModal.value = true
    applyChoiceStep.value = ''
    qaApplyError.value = ''
    qaApplySuccess.value = ''
    agentApplyError.value = ''
    agentApplySuccess.value = ''
    agentReason.value = ''
  }
}

async function switchToAgentMode() {
  showModeMenu.value = false
  if (!props.isLoggedIn) {
    editorApplyNotice.value = '请先登录后再使用智能体'
    setTimeout(() => { editorApplyNotice.value = '' }, 3000)
    return
  }
  await Promise.all([fetchAgentStatus(), fetchQaApplyStatus()])
  if (agentHasAccess.value) {
    aiMode.value = 'agent'
  } else {
    showApplyChoiceModal.value = true
    applyChoiceStep.value = ''
    agentApplyError.value = ''
    agentApplySuccess.value = ''
    agentRedeemError.value = ''
  }
}

function selectApplyType(type) {
  if (type === 'qa' && qaApplyStatus.value === 'approved') {
    aiMode.value = 'qa'
    showApplyChoiceModal.value = false
    return
  }
  if (type === 'agent' && agentHasAccess.value) {
    aiMode.value = 'agent'
    showApplyChoiceModal.value = false
    return
  }
  if (type === 'custom' && customApiAccess.value) {
    aiMode.value = 'editor'
    showApplyChoiceModal.value = false
    return
  }
  applyChoiceStep.value = type
}

async function submitCustomApiApply() {
  if (!props.isLoggedIn || !props.token) return
  customApiApplying.value = true
  customApiApplyError.value = ''
  customApiApplySuccess.value = ''
  try {
    const res = await fetch(`${API_BASE}/ai/custom-apply/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.token}`
      },
      body: JSON.stringify({ reason: agentReason.value })
    })
    const data = await res.json()
    if (data.success) {
      customApiApplySuccess.value = data.message || '申请已提交，请等待管理员审核'
      customApiStatus.value = 'pending'
      localStorage.setItem('limao_custom_api_apply_status', 'pending')
    } else {
      customApiApplyError.value = data.message || '申请失败，请稍后重试'
    }
  } catch (e) {
    customApiApplyError.value = '网络错误，请稍后重试'
  } finally {
    customApiApplying.value = false
  }
}

async function submitAgentApply() {
  agentApplying.value = true
  agentApplyError.value = ''
  agentApplySuccess.value = ''
  try {
    const res = await fetch(`${API_BASE}/ai/agent/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.token}` },
      body: JSON.stringify({ reason: agentReason.value })
    })
    const data = await res.json()
    if (data.success) {
      agentApplySuccess.value = data.message
      agentReason.value = ''
    } else {
      agentApplyError.value = data.message
    }
  } catch {
    agentApplyError.value = '网络请求失败'
  } finally {
    agentApplying.value = false
  }
}

async function submitAgentRedeem() {
  if (!agentCode.value.trim()) return
  agentRedeeming.value = true
  agentRedeemError.value = ''
  try {
    const res = await fetch(`${API_BASE}/ai/agent/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.token}` },
      body: JSON.stringify({ code: agentCode.value.trim() })
    })
    const data = await res.json()
    if (data.success) {
      await fetchAgentStatus()
      showAgentModal.value = false
      aiMode.value = 'agent'
      editorApplyNotice.value = `已开通智能体，月配额${data.data.quotaMonthly || '无限制'}次，总配额${data.data.quotaTotal || '无限制'}次`
      setTimeout(() => { editorApplyNotice.value = '' }, 5000)
    } else {
      agentRedeemError.value = data.message
    }
  } catch {
    agentRedeemError.value = '网络请求失败'
  } finally {
    agentRedeeming.value = false
  }
}

watch(aiMode, async (val) => {
  if (val === 'agent') await fetchAgentStatus()
})

onMounted(() => { fetchAgentStatus() })

async function closeEditor() {
  if (isModified.value) {
    if (props.isLoggedIn) {
      const save = confirm('文件已修改，是否保存到服务器后再关闭？\n点击"确定"保存并关闭，点击"取消"直接关闭')
      if (save) {
        await saveFileToServer(currentFileName.value, currentFilePath.value, editorContent.value)
      }
    }
  }
  showEditor.value = false
  editorContent.value = ''
  originalContent.value = ''
  currentFileName.value = ''
  currentFilePath.value = ''
  currentFileType.value = ''
  isModified.value = false
}

function updateScrollButtons() {
  const el = tabsContainerRef.value
  if (!el) {
    return
  }
  const hasOverflow = el.scrollWidth > el.clientWidth + 2
  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 1
}

function scrollTabs(direction) {
  const el = tabsContainerRef.value
  if (!el) return
  const scrollAmount = 200
  const newScrollLeft = direction === 'left' 
    ? el.scrollLeft - scrollAmount 
    : el.scrollLeft + scrollAmount
  el.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
  setTimeout(updateScrollButtons, 300)
}

function handleWheelScroll(e) {
  const el = tabsContainerRef.value
  if (!el) return
  el.scrollLeft += e.deltaY > 0 ? 100 : -100
  setTimeout(updateScrollButtons, 50)
}

function handleMouseDown(e) {
  if (e.target.closest('.tab-close')) return
  if (e.target.closest('.tab-scroll-btn')) return
  
  const el = tabsContainerRef.value
  if (!el) return
  
  const isTabsOverflow = el.scrollWidth > el.clientWidth + 1
  
  if (!isTabsOverflow) return
  
  e.preventDefault()
  isDragging.value = true
  dragStartX.value = e.pageX - el.offsetLeft
  dragScrollLeft.value = el.scrollLeft
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(e) {
  if (!isDragging.value) return
  const el = tabsContainerRef.value
  if (!el) return
  const x = e.pageX - el.offsetLeft
  const walk = (x - dragStartX.value) * 1.5
  el.scrollLeft = dragScrollLeft.value - walk
}

function handleMouseUp() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  setTimeout(updateScrollButtons, 50)
}

let touchStartX = 0
let touchScrollLeft = 0

function handleTouchStart(e) {
  const el = tabsContainerRef.value
  if (!el) return
  touchStartX = e.touches[0].pageX - el.offsetLeft
  touchScrollLeft = el.scrollLeft
}

function handleTouchMove(e) {
  const el = tabsContainerRef.value
  if (!el) return
  const x = e.touches[0].pageX - el.offsetLeft
  const walk = (x - touchStartX) * 1.5
  el.scrollLeft = touchScrollLeft - walk
  setTimeout(updateScrollButtons, 50)
}

function askAIForHelp() {
  const question = prompt('请输入您想让AI做什么：', '帮我优化以下代码')
  if (!question) return
  
  let fullPrompt = question
  if (editorContent.value.trim()) {
    fullPrompt = `${question}\n\n现有代码：\n\`\`\`\n${editorContent.value}\n\`\`\``
  }
  
  quickInputValue.value = fullPrompt
  showQuickInput.value = true
  nextTick(() => {
    if (quickInputRef.value) {
      quickInputRef.value.focus()
    }
  })
}

function toggleQuickInput() {
  showQuickInput.value = !showQuickInput.value
  if (showQuickInput.value) {
    nextTick(() => {
      if (quickInputRef.value) {
        quickInputRef.value.focus()
      }
    })
  }
}

function generateCode(prompt) {
  quickInputValue.value = prompt
  showQuickInput.value = true
  nextTick(() => {
    if (quickInputRef.value) {
      quickInputRef.value.focus()
    }
  })
}

async function submitQuickAI(options = {}) {
  if (!quickInputValue.value.trim() || isGenerating.value) return
  
  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }

  isGenerating.value = true
  showQuickInput.value = false

  const { targetFileName, targetFilePath, targetFolder } = options

  try {
    const systemParts = []
    const reviewModelName = currentModelInfo.value?.name || selectedModel.value
    const reviewProvider = currentModelInfo.value?.provider || ''
    const reviewIsFree = modelPresetConfigs[selectedModel.value]?.isFree
    const reviewPlatform = reviewIsFree ? '，运行在狸猫AI体验平台上' : ''
    systemParts.push(`你是${reviewProvider ? reviewProvider + '的' : ''}${reviewModelName}${reviewPlatform}。`)
    systemParts.push('用户在代码编辑器中向你请求生成代码。')
    
    if (targetFileName) {
      systemParts.push(`正在生成的文件: ${targetFileName}`)
    } else if (currentFileName.value) {
      systemParts.push(`正在编辑的文件: ${currentFileName.value}`)
    }
    
    systemParts.push('请直接返回完整的代码，不要使用 --- 文件路径 --- 格式，直接输出代码块。')
    systemParts.push('输出格式：\n```language\n代码内容\n```')

    const systemMsg = {
      role: 'system',
      content: systemParts.join('\n')
    }

    const messagesToSend = [
      systemMsg,
      {
        role: 'user',
        content: quickInputValue.value
      }
    ]

    const controller = new AbortController()
    abortController.value = controller

    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.token}`
      },
      body: JSON.stringify({
        model: selectedModel.value,
        messages: messagesToSend,
        stream: true
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error('请求失败')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let currentOutput = ''
    let inCodeBlock = false
    let codeStartFound = false

    // 先清空编辑器，准备接收
    if (targetFileName && targetFilePath) {
      editorContent.value = ''
      showEditor.value = true
      currentFileName.value = targetFileName
      currentFilePath.value = targetFilePath
      currentFileType.value = targetFileName.split('.').pop() || 'text'
      editorLang.value = getMonacoLanguage(currentFileType.value)
      isModified.value = false
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            fullResponse += delta
            
            if (delta) {
              if (!codeStartFound) {
                if (delta.includes('```')) {
                  codeStartFound = true
                  inCodeBlock = true
                }
              } else if (inCodeBlock) {
                const contentToAdd = delta.replace(/```/g, '')
                if (contentToAdd) {
                  currentOutput += contentToAdd
                  if (monacoRef.value) {
                    monacoRef.value.applyAIEdit(currentOutput.trim())
                  } else {
                    editorContent.value = currentOutput.trim()
                  }
                  isModified.value = true
                }
              }
            }
          } catch (e) {
            continue
          }
        }
      }
    }

    let finalCode = currentOutput
    if (!codeStartFound) {
      const codeMatch = fullResponse.match(/```([\s\S]*?)```/)
      if (codeMatch) {
        finalCode = codeMatch[1]
        const langMatch = finalCode.match(/^[a-zA-Z0-9]+\n/)
        if (langMatch) {
          finalCode = finalCode.slice(langMatch[0].length)
        }
        if (monacoRef.value) {
          monacoRef.value.applyAIEdit(finalCode.trim())
        } else {
          editorContent.value = finalCode.trim()
        }
        isModified.value = true
      }
    }

    const finalContent = finalCode.trim()

    // 保存
    const saveFileName = targetFileName || currentFileName.value
    const saveFilePath = targetFilePath || currentFilePath.value

    if (saveFileName && saveFilePath) {
      saveFileToServer(saveFileName, saveFilePath, finalContent)
      try {
        await idbSaveFile(saveFilePath, finalContent, {
          folderPath: targetFolder || saveFilePath.split('/').slice(0, 2).join('/'),
          name: saveFileName,
          language: saveFileName.split('.').pop() || 'text'
        })
        
        // 更新标签
        const existingTab = editorTabs.value.find(t => t.path === saveFilePath)
        if (existingTab) {
          existingTab.content = finalContent
        } else {
          editorTabs.value.push({
            path: saveFilePath,
            name: saveFileName,
            content: finalContent,
            language: getMonacoLanguage(saveFileName.split('.').pop() || 'text'),
            modified: true
          })
        }
        activeTab.value = saveFilePath
      } catch (e) {
        console.warn('[IndexedDB] 保存失败:', e)
      }
    }

    editorApplyNotice.value = '代码已生成到编辑器'
    setTimeout(() => { editorApplyNotice.value = '' }, 2500)

  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('生成失败:', e)
      alert('生成失败: ' + (e.message || '未知错误'))
    }
  } finally {
    isGenerating.value = false
    quickInputValue.value = ''
  }
}

// Watch editor content changes to update tab state
watch([editorContent, isModified], () => {
  if (currentFilePath.value) {
    const currentTab = editorTabs.value.find(tab => tab.path === currentFilePath.value)
    if (currentTab) {
      currentTab.content = editorContent.value
      currentTab.modified = isModified.value
    }
  }
})

watch(() => editorTabs.value.length, () => {
  nextTick(() => {
    updateScrollButtons()
  })
}, { immediate: true, deep: true })

function setupResizeObserver() {
  const el = tabsContainerRef.value
  if (!el) return
  
  const resizeObserver = new ResizeObserver(() => {
    updateScrollButtons()
  })
  
  resizeObserver.observe(el)
  
  el.addEventListener('scroll', updateScrollButtons)
}

watch(() => activeTab.value, () => {
  nextTick(updateScrollButtons)
})

watch(darkMode, () => {
  refreshPreview()
})

function handleScrollUpdate() {
  updateScrollButtons()
}

onMounted(() => {
  window.__limaoErrorHandler = (event) => {
    captureRuntimeError(event.error || event, 'window.error')
  }
  window.__limaoUnhandledRejection = (event) => {
    captureRuntimeError(event.reason || new Error('Unhandled Promise Rejection'), 'unhandledrejection')
  }
  window.addEventListener('error', window.__limaoErrorHandler)
  window.addEventListener('unhandledrejection', window.__limaoUnhandledRejection)

  loadApiKeys()
  loadCustomModels()
  loadUserData()
  loadSessionsFromStorage()
  restoreLastSession()
  loadWorkspaceState()
  setupAutoSave()
  scrollToBottom()
  document.addEventListener('click', handleClickOutside)
  nextTick(() => {
    updateScrollButtons()
    setupResizeObserver()
  })
})

onBeforeUnmount(() => {
  if (window.__limaoErrorHandler) {
    window.removeEventListener('error', window.__limaoErrorHandler)
    window.removeEventListener('unhandledrejection', window.__limaoUnhandledRejection)
    delete window.__limaoErrorHandler
    delete window.__limaoUnhandledRejection
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  const el = tabsContainerRef.value
  if (el) {
    el.removeEventListener('scroll', updateScrollButtons)
  }
})

async function forceRefreshAgentStatus() {
  await fetchAgentStatus()
  if (!agentHasAccess.value && aiMode.value === 'agent') {
    aiMode.value = 'chat'
  }
}

defineExpose({ forceRefreshAgentStatus })
</script>

<style scoped>
.ai-chat-container {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: #f5f7fa;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e5e6eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 56px;
}

.sidebar.collapsed:hover {
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.08);
}

.sidebar-body-enter-active,
.sidebar-body-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.sidebar-body-enter-from,
.sidebar-body-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #f2f3f5;
  flex-shrink: 0;
}

.sidebar.collapsed .sidebar-header {
  flex-direction: column;
  gap: 4px;
}

.sidebar.collapsed .sidebar-header-right {
  display: none;
}

.new-chat-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background: #fff;
  color: #4e5969;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  position: relative;
  z-index: 1;
}

.sidebar.collapsed .new-chat-btn {
  width: 100%;
  height: 32px;
  padding: 0;
  border-radius: 6px;
}

.new-chat-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f0f7ff;
}

.sidebar.collapsed .new-chat-btn:hover {
  background: #409eff;
  color: #fff;
}

.toggle-sidebar-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.sidebar.collapsed .toggle-sidebar-btn {
  width: 32px;
  height: 32px;
}

.toggle-sidebar-btn:hover {
  background: #f2f3f5;
  color: #4e5969;
}

.toggle-sidebar-btn svg {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rotate-180 {
  transform: rotate(180deg);
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-section {
  margin-bottom: 0;
  border-radius: 12px;
  padding: 4px 0;
  transition: all 0.2s ease;
}

.sidebar-section:hover {
  background: rgba(0, 0, 0, 0.015);
}

.file-explorer-section,
.chat-history-section,
.custom-models-section {
  border-radius: 12px;
  padding: 6px 0;
}

.custom-models-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  max-height: 300px;
  overflow: hidden;
}

.custom-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  flex-shrink: 0;
}

.custom-panel-header:hover {
  background: #f7f8fa;
}

.custom-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}

.custom-panel-icon {
  color: #409eff;
  flex-shrink: 0;
}

.custom-panel-chevron {
  flex-shrink: 0;
  color: #86909c;
  transition: transform 0.2s;
}

.custom-panel-chevron.open {
  transform: rotate(180deg);
}

.custom-panel-body {
  padding: 0 10px 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.custom-panel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.custom-panel-item:hover {
  background: #f2f3f5;
}

.custom-panel-item.current {
  color: #409eff;
  font-weight: 500;
}

.custom-panel-item-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.custom-panel-item-name {
  font-size: 13px;
  color: #4e5969;
}

.custom-panel-item-add {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
  padding: 3px 10px;
  border: 1px solid #409eff;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.15s;
}

.free-badge {
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
  padding: 2px 8px;
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 4px;
  flex-shrink: 0;
}

.dark-mode .free-badge {
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(52, 211, 153, 0.3);
}

.custom-panel-item-add:hover {
  background: #409eff;
  color: #fff;
}

.custom-panel-item-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.15s;
}

.custom-panel-item-del:hover {
  color: #f53f3f;
  background: rgba(245, 63, 63, 0.08);
}

.custom-panel-empty {
  padding: 16px 10px;
  text-align: center;
  font-size: 12px;
  color: #86909c;
}

.custom-panel-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.04);
  margin: 0 14px;
  flex-shrink: 0;
}

.custom-panel-subtitle {
  padding: 10px 14px 4px;
  font-size: 12px;
  font-weight: 500;
  color: #86909c;
  flex-shrink: 0;
}

.model-picker {
  margin-top: 12px;
}

.model-picker-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 320px;
  overflow-y: auto;
}

.model-picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.model-picker-item:hover {
  background: #f7f8fa;
}

.model-picker-item.selected {
  background: #e6f4ff;
  border-color: #409eff;
}

.model-picker-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: #f2f3f5;
  border-radius: 4px;
}

.model-picker-icon :deep(svg) {
  display: block;
}

.model-picker-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  gap: 2px;
}

.model-picker-name {
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
  line-height: 1.3;
}

.model-picker-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.model-picker-provider {
  font-size: 11px;
  color: #86909c;
}

.tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  line-height: 1.6;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.tag-free {
  background: #e8f8ee;
  color: #00b42a;
}

.tag-top {
  background: #fff7e6;
  color: #ff7d00;
}

.tag-image {
  background: #e6f7ff;
  color: #0958d9;
}

.tag-video {
  background: #f9f0ff;
  color: #722ed1;
}

.model-picker-check {
  flex-shrink: 0;
  opacity: 1;
}

.model-picker-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-top: 12px;
  background: #f7f8fa;
  border-radius: 6px;
  font-size: 12px;
  color: #86909c;
}

.key-modal-lg {
  max-width: 480px;
}

.confirm-modal-sm {
  max-width: 380px;
}

.confirm-text-main {
  font-size: 14px;
  color: #1d2129;
  margin: 0 0 8px;
}

.confirm-text-sub {
  font-size: 12px;
  color: #86909c;
  margin: 0;
}

.model-remove-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
}

.model-remove-btn:hover {
  background: #fff1f0;
  color: #f5222d;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #f2f3f5;
  margin-top: auto;
}

.sidebar-footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: transparent;
  color: #86909c;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.sidebar-footer-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f0f7ff;
}

.sidebar-header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.theme-header-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.theme-header-btn:hover {
  background: #f2f3f5;
  color: #3b82f6;
}

.collapsed-theme-btn {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.collapsed-theme-btn:hover {
  background: #f2f3f5;
  color: #3b82f6;
}

.sidebar-section {
  margin-bottom: 16px;
}

.file-explorer-section .section-title {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vscode-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px 6px;
}

.vscode-title-text {
  font-size: 11px;
  color: #86909c;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.vscode-title-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.file-explorer-section:hover .vscode-title-actions {
  opacity: 1;
}

.file-explorer-actions {
  display: flex;
  gap: 2px;
  padding: 4px 8px;
}

.explorer-action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: #86909c;
  transition: all 0.2s ease;
}

.explorer-action-btn:hover {
  background: rgba(245, 34, 45, 0.1);
  color: #f5222d;
}

.file-tree {
  padding: 4px 8px;
  max-height: 400px;
  overflow-y: auto;
}

.file-tree::-webkit-scrollbar {
  width: 3px;
}

.file-tree::-webkit-scrollbar-track {
  background: transparent;
}

.file-tree::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.file-tree-empty {
  padding: 24px 8px;
  text-align: center;
  color: #b0b0b0;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
  margin: 4px;
}

.file-tree-empty:hover {
  background: rgba(64, 158, 255, 0.06);
}

.empty-icon-wrapper {
  margin-bottom: 8px;
  color: #d9d9d9;
  transition: color 0.2s;
}

.file-tree-empty:hover .empty-icon-wrapper {
  color: #409eff;
}

.file-tree-empty .empty-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 500;
  color: #5c5c5c;
}

.file-tree-empty .empty-desc {
  margin: 0;
  font-size: 11px;
  color: #86909c;
}

/* ===== 已保存的工作区 ===== */
.saved-workspaces {
  padding: 12px 8px;
}

.saved-workspaces-title {
  font-size: 11px;
  color: #86909c;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.saved-workspace-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  margin: 3px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #4e5969;
  background: #ffffff;
  border: 1px solid #f0f0f0;
}

.saved-workspace-card:hover {
  background: #fafafa;
  border-color: #e5e5e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  color: #409eff;
}

.saved-workspace-card-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.saved-workspace-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.saved-workspace-hint {
  font-size: 11px;
  color: #86909c;
  flex-shrink: 0;
}

.saved-workspace-card:hover .saved-workspace-hint {
  color: #409eff;
}

.saved-workspace-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #b0b0b0;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  opacity: 0.5;
}

.saved-workspace-card:hover .saved-workspace-remove {
  opacity: 1;
  color: #86909c;
}

.saved-workspace-remove:hover {
  background: #fff1f0;
  color: #f5222d;
}

/* ===== 文件夹卡片 ===== */
.explorer-folder-card {
  margin: 3px 4px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #f0f0f0;
  overflow: visible;
  transition: all 0.2s;
}

.explorer-folder-card:hover {
  background: #fafafa;
  border-color: #e5e5e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.explorer-card-header {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 13px;
  color: #5c5c5c;
  font-weight: 500;
  gap: 4px;
}

.explorer-card-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.explorer-card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.tree-arrow {
  transition: transform 0.2s;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: #8c8c8c;
}

.tree-arrow.expanded {
  transform: rotate(90deg);
}

.tree-folder-icon {
  color: #d6a052;
  flex-shrink: 0;
}

.tree-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.tree-remove-btn,
.tree-download-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #b0b0b0;
  transition: all 0.2s ease;
  flex-shrink: 0;
  opacity: 0.5;
}

.explorer-folder-card:hover .tree-remove-btn,
.explorer-folder-card:hover .tree-download-btn {
  opacity: 1;
  color: #86909c;
}

.tree-remove-btn:hover {
  background: rgba(245, 34, 45, 0.1);
  color: #f5222d;
}

.tree-download-btn:hover {
  background: rgba(22, 119, 255, 0.1);
  color: #1677ff;
}

.tree-folder-children {
  margin-left: 14px;
  padding: 0 4px 4px;
  border-left: 1px solid #e8e8e8;
}

.sidebar-section {
  margin-bottom: 16px;
}

.section-title {
  padding: 10px 8px 6px;
  font-size: 11px;
  color: #86909c;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 8px;
}

.model-list::-webkit-scrollbar {
  width: 4px;
}

.model-list::-webkit-scrollbar-track {
  background: transparent;
}

.model-list::-webkit-scrollbar-thumb {
  background: #e5e6eb;
  border-radius: 2px;
}

.model-list::-webkit-scrollbar-thumb:hover {
  background: #c9cdd4;
}

.model-group-label {
  padding: 12px 8px 4px;
  font-size: 11px;
  color: #86909c;
  font-weight: 500;
}

.model-group-divider {
  height: 1px;
  background: #e5e6eb;
  margin: 6px 8px 2px;
}

.model-empty-hint {
  padding: 20px 8px;
  text-align: center;
  font-size: 12px;
  color: #86909c;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.model-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #409eff;
  transform: scaleY(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.model-item.active::before {
  transform: scaleY(1);
}

.model-item:not(.disabled):hover {
  background: #f0f7ff;
}

.model-item.active {
  background: #e6f4ff;
}

.model-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.model-item-icon {
  display: inline-flex;
  align-items: center;
}

.model-item-icon :deep(svg) {
  display: block;
}

.model-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.model-item-name {
  font-size: 13px;
  color: #4e5969;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-item.active .model-item-name {
  color: #409eff;
  font-weight: 600;
}

.model-item-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}

.model-item-badge.recommend {
  background: #e6f4ff;
  color: #409eff;
}

.model-item-badge.coming-soon {
  background: #fff7e6;
  color: #f7ba2a;
}

.model-item-badge.need-key {
  background: #fff1f0;
  color: #f5222d;
}

.custom-model-hint {
  padding: 0 10px 4px;
  font-size: 11px;
  color: #86909c;
}

.model-item-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.key-config-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
}

.key-config-btn:hover {
  background: #e6f4ff;
  color: #409eff;
}

.model-item.active .key-config-btn {
  color: #409eff;
}

.key-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.key-modal {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.key-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.key-modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.key-modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
}

.key-modal-close:hover {
  background: #f2f3f5;
  color: #4e5969;
}

.key-modal-body {
  padding: 20px 24px;
}

.key-modal-desc {
  font-size: 13px;
  color: #86909c;
  margin: 0 0 16px;
  line-height: 1.6;
}

.key-modal-guide {
  font-size: 12px;
  color: #86909c;
  margin: -12px 0 16px;
}

.key-modal-guide-link {
  color: #409eff;
  text-decoration: none;
}

.key-modal-guide-link:hover {
  text-decoration: underline;
}

.key-input-group {
  margin-bottom: 16px;
}

.key-input-group:last-child {
  margin-bottom: 0;
}

.key-input-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #4e5969;
  margin-bottom: 6px;
}

.key-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.key-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 13px;
  color: #1d2129;
  background: #fff;
  transition: all 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.key-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.key-input-wrapper .key-input {
  padding-right: 40px;
}

.key-toggle-visibility {
  position: absolute;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
}

.key-toggle-visibility:hover {
  color: #4e5969;
  background: #f2f3f5;
}

.key-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #f2f3f5;
}

.key-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  border: none;
}

.key-btn.cancel {
  background: #f2f3f5;
  color: #4e5969;
}

.key-btn.cancel:hover {
  background: #e5e6eb;
}

.key-btn.save {
  background: #409eff;
  color: #fff;
}

.key-btn.save:hover {
  background: #1a6dd4;
}

.key-btn.delete-cancel-btn {
  background: #409eff;
  color: #fff;
}

.key-btn.delete-cancel-btn:hover {
  background: #1a6dd4;
}

.key-btn.delete-confirm-btn {
  background: #f5222d;
  color: #fff;
}

.key-btn.delete-confirm-btn:hover {
  background: #cf1322;
}

.key-delete-confirm-text {
  font-size: 13px;
  color: #4e5969;
}

.key-delete-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.key-btn-delete-cancel {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: #409eff;
  color: #fff;
  font-family: inherit;
  transition: all 0.2s;
}

.key-btn-delete-cancel:hover {
  background: #1a6dd4;
}

.key-btn-delete-confirm {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: #f5222d;
  color: #fff;
  font-family: inherit;
  transition: all 0.2s;
}

.key-btn-delete-confirm:hover {
  background: #cf1322;
}

.apply-modal {
  max-width: 600px;
  width: 90%;
}

.apply-modal-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px 24px;
}

.apply-change-item {
  margin-bottom: 16px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  overflow: hidden;
}

.apply-change-item:last-child {
  margin-bottom: 0;
}

.apply-change-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e6eb;
  cursor: pointer;
  user-select: none;
}
.apply-change-header:hover {
  background: #f2f3f5;
}

.apply-expand-arrow {
  transition: transform 0.2s;
  flex-shrink: 0;
  color: #86909c;
}
.apply-expand-arrow.expanded {
  transform: rotate(90deg);
}

.apply-file-icon {
  flex-shrink: 0;
  color: #409eff;
}

.apply-change-info {
  flex: 1;
  min-width: 0;
}

.apply-change-name {
  font-weight: 600;
  font-size: 13px;
  color: #1d2129;
  display: block;
}

.apply-change-path {
  font-size: 11px;
  color: #86909c;
  font-family: 'Consolas', 'Fira Code', monospace;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apply-change-stats {
  display: flex;
  gap: 6px;
  font-size: 11px;
  font-family: 'Consolas', 'Fira Code', monospace;
  font-weight: 600;
  flex-shrink: 0;
}
.stat-add { color: #22c55e; }
.stat-remove { color: #f5222d; }
.stat-mod { color: #3b82f6; }

.apply-change-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.apply-accept-btn,
.apply-reject-btn {
  width: 26px;
  height: 26px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.apply-accept-btn:hover {
  background: #f0fff0;
  border-color: #22c55e;
  color: #22c55e;
}
.apply-reject-btn:hover {
  background: #fff0f0;
  border-color: #f5222d;
  color: #f5222d;
}

.apply-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.accepted-status {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}
.rejected-status {
  color: #f5222d;
  background: rgba(245, 34, 45, 0.1);
}

.apply-change-item.accepted {
  border-color: #22c55e;
  opacity: 0.7;
}
.apply-change-item.rejected {
  border-color: #f5222d;
  opacity: 0.5;
}
.apply-change-item.rejected .apply-change-preview {
  display: none;
}

.apply-modal-header-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.key-btn-sm {
  padding: 4px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}
.key-btn-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.accept-all-btn:hover {
  background: #f0fff0;
  border-color: #22c55e;
  color: #22c55e;
}
.reject-all-btn:hover {
  background: #fff0f0;
  border-color: #f5222d;
  color: #f5222d;
}

.apply-change-preview {
  padding: 12px 14px;
  max-height: 300px;
  overflow-y: auto;
}

.apply-diff-old,
.apply-diff-new {
  margin-bottom: 10px;
}

.apply-diff-old:last-child,
.apply-diff-new:last-child {
  margin-bottom: 0;
}

.apply-diff-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 6px;
  color: #86909c;
  letter-spacing: 0.5px;
}

.apply-diff-old .apply-diff-label {
  color: #f5222d;
}

.apply-diff-new .apply-diff-label {
  color: #22c55e;
}

.apply-change-preview pre {
  margin: 0;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-family: 'Consolas', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #4e5969;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.apply-diff-new pre {
  background: #f0fff0;
  color: #1a7a1a;
}

.apply-diff-old pre {
  background: #fff5f5;
  color: #a01010;
}

.model-check {
  color: #409eff;
  flex-shrink: 0;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-btn .btn-text {
  flex: 1;
  text-align: left;
}

.action-btn.file-btn {
}

.action-btn.file-btn:hover {
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #4e5969;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  text-align: left;
  width: 100%;
}

.action-btn:hover {
  background: #f0f7ff;
  color: #409eff;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-content-area {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.editor-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e5e6eb;
  overflow: hidden;
  position: relative;
  min-width: 0;
}

.editor-tabs-container {
  background: #f3f3f3;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  position: relative;
  min-height: 35px;
  width: 100%;
}

.tab-scroll-btn {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30px;
  background: #f3f3f3;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #4e5969;
  transition: all 0.15s;
}

.tab-scroll-btn:hover {
  background: #e0e0e0;
  color: #1a1a1a;
}

.tab-scroll-left {
  left: 0;
  border-right: 1px solid #dcdde0;
  box-shadow: 3px 0 6px rgba(0,0,0,0.05);
}

.tab-scroll-right {
  right: 0;
  border-left: 1px solid #dcdde0;
  box-shadow: -3px 0 6px rgba(0,0,0,0.05);
}

.editor-tabs-container.can-scroll-left .editor-tabs {
  padding-left: 30px;
}

.editor-tabs-container.can-scroll-right .editor-tabs {
  padding-right: 30px;
}

.editor-tabs {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  user-select: none;
  flex: 1;
  min-width: 0;
}

.editor-tabs::-webkit-scrollbar {
  height: 4px;
}

.editor-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.editor-tabs::-webkit-scrollbar-thumb {
  background: #c9cdd4;
  border-radius: 2px;
}

.editor-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  background: #e8e8e8;
  border-right: 1px solid #dcdde0;
  white-space: nowrap;
  transition: all 0.15s;
  min-width: 0;
  max-width: 200px;
  height: 35px;
  position: relative;
  flex-shrink: 0;
}

.editor-tab:hover {
  background: #d8d8d8;
}

.editor-tab.active {
  background: #409eff;
  border-radius: 4px 4px 0 0;
}

.tab-icon {
  font-size: 11px;
  font-weight: 600;
  color: #4e5969;
  flex-shrink: 0;
}

.editor-tab.active .tab-icon {
  color: #ffffff;
}

.tab-name {
  font-size: 13px;
  color: #4e5969;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.editor-tab.active .tab-name {
  color: #ffffff;
}

.tab-modified {
  font-size: 14px;
  color: #4e5969;
  flex-shrink: 0;
  line-height: 1;
}

.editor-tab.active .tab-modified {
  color: #ffffff;
}

.tab-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.1s;
  flex-shrink: 0;
  padding: 0;
}

.editor-tab.active .tab-close {
  color: #ffffff;
}

.tab-close:hover {
  background: rgba(0,0,0,0.1);
  color: #1d2129;
}

.editor-tab.active .tab-close:hover {
  background: rgba(0,0,0,0.2);
}

.chat-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.chat-panel.full-width {
  width: 100%;
}

.chat-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  flex-shrink: 0;
}

.mobile-sidebar-btn {
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-sidebar-btn:hover {
  background: #f2f3f5;
  color: #4e5969;
}

.expand-sidebar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: #fff;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.expand-sidebar-btn:hover {
  background: #f0f7ff;
  border-color: #409eff;
  color: #409eff;
}

.expand-sidebar-btn svg {
  transition: transform 0.2s;
}

.expand-sidebar-btn:hover svg {
  transform: translateX(-2px);
}

.topbar-model-info {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  cursor: pointer;
  padding: 4px 12px 4px 8px;
  border-radius: 8px;
  background: #f7f8fa;
  transition: background 0.2s;
  position: relative;
  user-select: none;
}

.topbar-model-info:hover {
  background: #e8f3ff;
}

.topbar-model-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.topbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  white-space: nowrap;
}

.topbar-chevron {
  flex-shrink: 0;
  color: #86909c;
  transition: transform 0.2s;
}

.topbar-chevron.open {
  transform: rotate(180deg);
}

.topbar-model-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  min-width: 220px;
  max-height: 400px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 200;
  padding: 6px;
  animation: dropdownFadeIn 0.15s ease;
}

@keyframes dropdownFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.topbar-model-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.topbar-model-dropdown-item:hover {
  background: #f2f3f5;
}

.topbar-model-dropdown-item.active {
  background: #e8f3ff;
}

.topbar-model-dropdown-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.topbar-model-dropdown-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.topbar-model-dropdown-check {
  flex-shrink: 0;
  margin-left: auto;
}

.topbar-model-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  line-height: 1.4;
}

.topbar-model-tag.image-tag {
  background: rgba(232, 67, 147, 0.1);
  color: #E84393;
}

.topbar-model-tag.video-tag {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
}

.topbar-model-top-badge {
  flex-shrink: 0;
  filter: hue-rotate(180deg) saturate(1.5);
}

.dark-mode .topbar-model-top-badge {
  filter: hue-rotate(180deg) saturate(1.5) brightness(0.9);
  opacity: 0.7;
}

.topbar-model-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 8px;
  background: #f7f8fa;
}

.topbar-placeholder-text {
  font-size: 13px;
  color: #86909c;
}

/* ===== 对话历史 ===== */
.chat-history-section {
  border-top: 1px solid #f2f3f5;
  padding-top: 0;
  flex: 1;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.chat-history-section .vscode-title {
  padding: 6px 8px;
}

.history-count {
  font-size: 10px;
  background: rgba(134, 144, 156, 0.12);
  color: #86909c;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.chat-history-list {
  overflow-y: auto;
  flex: 1;
  padding: 0 4px;
}

.history-group {
  margin-bottom: 4px;
}

.history-group-label {
  font-size: 11px;
  color: #86909c;
  font-weight: 600;
  padding: 6px 8px 2px;
  user-select: none;
  letter-spacing: 0.3px;
}

.chat-history-card {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  margin: 2px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #4e5969;
  position: relative;
  background: #ffffff;
  border: 1px solid #f0f0f0;
}

.chat-history-card:hover {
  background: #fafafa;
  border-color: #e5e5e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chat-history-card.active {
  background: #f0f7ff;
  border-color: #d6e8ff;
  color: #1d2129;
}

.card-header {
  display: flex;
  align-items: center;
  position: relative;
  flex-shrink: 0;
}

.card-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #b0b0b0;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  opacity: 0.5;
  padding: 0;
}

.chat-history-card:hover .card-menu-btn {
  opacity: 1;
  color: #86909c;
}

.card-menu-btn:hover {
  background: #f2f3f5;
  color: #4e5969;
}

.card-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 1000;
  min-width: 130px;
}

.card-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: #4e5969;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.card-menu-item:hover {
  background: #f5f5f5;
  color: #1d2129;
}

.card-menu-item-danger:hover {
  background: #fff1f0;
  color: #f5222d;
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.chat-history-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 500;
}

.chat-history-card.active .chat-history-title {
  color: #409eff;
}

.chat-history-meta {
  font-size: 10px;
  color: #86909c;
  white-space: nowrap;
}

.chat-history-card.active .chat-history-meta {
  color: rgba(64, 158, 255, 0.6);
}

.card-rename-input-wrap {
  width: 100%;
}

.card-rename-input {
  width: 100%;
  border: 1px solid #409eff;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  line-height: 1.4;
  outline: none;
  background: #fff;
  color: #1d2129;
}

.chat-history-empty {
  padding: 12px 8px;
  font-size: 12px;
  color: #86909c;
  text-align: center;
}

/* ===== 50 轮提醒 ===== */
.fifty-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: #fff7e6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  font-size: 13px;
  color: #ad6800;
}

.fifty-warning-close {
  margin-left: auto;
  padding: 2px 10px;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  background: transparent;
  color: #ad6800;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  transition: all 0.15s;
}

.fifty-warning-close:hover {
  background: #ad6800;
  border-color: #ad6800;
  color: #fff;
}

/* ===== 消息区域 ===== */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
}

.welcome-message {
  text-align: center;
  padding: 80px 20px 60px;
}

.welcome-icon {
  color: #409eff;
  margin-bottom: 24px;
}

.welcome-message h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.welcome-message p {
  color: #86909c;
  margin-bottom: 32px;
}

.welcome-message .welcome-desc {
  font-size: 14px;
  color: #86909c;
  line-height: 1.6;
}

.welcome-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.tip {
  padding: 8px 20px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 20px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.2s;
}

.tip:hover {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #409eff;
  color: #fff;
  overflow: hidden;
}

.message.ai .message-avatar {
  background: #f0f7ff;
  color: #409eff;
  overflow: hidden;
}

.message.ai .message-content {
  max-width: 90%;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #409eff;
  border-radius: 50%;
}

.user-avatar-icon {
  background: linear-gradient(135deg, #409eff, #53a8ff);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.message-content {
  max-width: 70%;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  transition: box-shadow 0.25s ease;
}

.message.user .message-content {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sender-name {
  font-size: 13px;
  font-weight: 600;
}

.message.user .sender-name {
  color: rgba(255, 255, 255, 0.8);
}

.message.ai .sender-name {
  color: #409eff;
}

.sender-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #86909c;
  background: #f2f3f5;
  border-radius: 4px;
  vertical-align: middle;
}

.message-time {
  font-size: 11px;
  color: #86909c;
}

.message-body {
  font-size: 14px;
  line-height: 1.8;
  color: #4e5969;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  overflow: hidden;
}

.user-body {
  white-space: pre-wrap;
}

.message.user .message-body {
  color: #fff;
}

.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: #409eff;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.reasoning-section {
  margin-top: 10px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.3s;
}
.reasoning-section.thinking {
  border-color: #b8d4f0;
}
.reasoning-section.done {
  border-color: #d4e8d4;
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f8f9fb;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  user-select: none;
  transition: background 0.3s, color 0.3s;
}
.reasoning-section.thinking .reasoning-header {
  background: #f0f6fc;
  color: #409eff;
  cursor: default;
}
.reasoning-section.done .reasoning-header {
  background: #f6faf6;
  color: #4a7c4a;
}

.reasoning-arrow {
  flex-shrink: 0;
  transition: transform 0.25s ease;
}
.reasoning-arrow.expanded { transform: rotate(90deg); }

.reasoning-icon { flex-shrink: 0; }

.reasoning-badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}
.reasoning-badge.done { background: #d4e8d4; color: #3a6b3a; }

.thinking-pulse {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  animation: thinkingPulse 1.4s ease-in-out infinite;
}

@keyframes thinkingPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.thinking-dots {
  margin-left: auto;
}

.thinking-dots i {
  display: inline-block;
  font-style: normal;
  font-weight: 700;
  color: #409eff;
  animation: dotBounce 1.4s ease-in-out infinite;
}
.thinking-dots i:nth-child(1) { animation-delay: 0s; }
.thinking-dots i:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots i:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}

.reasoning-body {
  padding: 10px 14px;
  font-size: 12px;
  color: #555;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  border-top: 1px solid #f0f0f0;
  transition: max-height 0.3s ease, padding 0.3s ease;
}
.reasoning-body p { margin: 4px 0; }
.reasoning-body pre { background: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 11px; }
.reasoning-body code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 11px; }

.waiting-tip {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.waiting-spinner {
  animation: spin 1s linear infinite;
  flex-shrink: 0;
  color: #409eff;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dark-mode .waiting-tip {
  background: rgba(64, 158, 255, 0.08);
  border-color: rgba(64, 158, 255, 0.15);
  color: #9099a0;
}

.dark-mode .waiting-text {
  color: #c0c4cc;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 16px 0 8px;
  color: #1d2129;
  font-weight: 600;
}

.markdown-body :deep(h1) { font-size: 20px; }
.markdown-body :deep(h2) { font-size: 18px; }
.markdown-body :deep(h3) { font-size: 16px; }
.markdown-body :deep(h4) { font-size: 15px; }

.markdown-body :deep(p) {
  margin: 8px 0;
  line-height: 1.8;
  overflow-wrap: break-word;
  word-break: break-word;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
  overflow-wrap: break-word;
  word-break: break-word;
}

.markdown-body :deep(li) {
  margin: 4px 0;
  line-height: 1.7;
  overflow-wrap: break-word;
  word-break: break-word;
}

.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 10px 16px;
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
  border-radius: 0 8px 8px 0;
  color: #4e5969;
}

.markdown-body :deep(img) {
  max-width: 100%;
  max-height: 384px;
  border-radius: 8px;
  margin: 8px 0;
  cursor: zoom-in;
  transition: transform 0.2s;
  display: block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-body :deep(img:hover) {
  transform: scale(1.02);
}

.markdown-body :deep(video) {
  max-width: 100%;
  max-height: 480px;
  border-radius: 8px;
  margin: 8px 0;
  display: block;
}

.markdown-body :deep(code) {
  background: #f2f3f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Fira Code', monospace;
  font-size: 13px;
  color: #c7254e;
  overflow-wrap: break-word;
  word-break: break-all;
}

.markdown-body :deep(pre) {
  margin: 0;
  padding: 0;
  background: transparent;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #c9d1d9;
  font-size: 13px;
}

.md-code-block {
  margin: 12px 0;
  border-radius: 10px;
  overflow: hidden;
  background: #1d2129;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
  max-width: 100%;
  transition: box-shadow 0.25s ease;
}

.md-code-block:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08);
}

.md-code-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(64, 158, 255, 0.02) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.md-code-lang {
  font-size: 11px;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
}

.md-code-filename {
  font-size: 11px;
  color: rgba(34, 197, 94, 0.7);
  font-family: 'Consolas', 'Fira Code', monospace;
  padding: 2px 8px;
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.1);
  border-radius: 4px;
  letter-spacing: 0.3px;
}

.md-code-block pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  background: #1d2129;
  border-radius: 0 0 10px 10px;
  font-family: 'Consolas', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #c9d1d9;
  max-width: 100%;
  box-sizing: border-box;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
  table-layout: fixed;
  overflow-wrap: break-word;
  word-break: break-word;
  display: block;
  overflow-x: auto;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e5e6eb;
  padding: 10px 14px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: linear-gradient(135deg, #f7f8fa 0%, #f2f3f5 100%);
  font-weight: 600;
  color: #1d2129;
}

.markdown-body :deep(td) {
  color: #4e5969;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #e5e6eb;
  margin: 16px 0;
}

.markdown-body :deep(a) {
  color: #409eff;
  text-decoration: none;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
  transition: all 0.2s ease;
}

.markdown-body :deep(a:hover) {
  color: #337ecc;
  border-bottom-color: #337ecc;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #1d2129;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.chat-input-container {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e5e6eb;
  position: relative;
  transition: all 0.2s;
}

.pending-images {
  display: flex;
  gap: 8px;
  padding-bottom: 10px;
  overflow-x: auto;
}

.pending-image-item {
  position: relative;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e6eb;
}

.pending-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pending-image-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s;
}

.pending-image-remove:hover {
  background: rgba(245, 63, 63, 0.8);
}

.image-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  color: #86909c;
  transition: all 0.2s;
  flex-shrink: 0;
}

.image-upload-btn:hover {
  background: #f2f3f5;
  color: #409eff;
}

.user-images {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.user-sent-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e5e6eb;
  transition: opacity 0.15s;
}

.user-sent-image:hover {
  opacity: 0.85;
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: auto;
  pointer-events: auto;
}

.dark-mode .image-preview-overlay {
  background: rgba(0, 0, 0, 0.92);
}

.image-preview-overlay:not(.dark-mode) .image-preview-toolbar {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.image-preview-overlay:not(.dark-mode) .image-preview-tool-btn {
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.12);
  color: #333;
}

.image-preview-overlay:not(.dark-mode) .image-preview-tool-btn:hover {
  background: rgba(0, 0, 0, 0.15);
}

.image-preview-overlay:not(.dark-mode) .image-preview-zoom-level {
  color: #333;
  background: rgba(0, 0, 0, 0.06);
}

.image-preview-overlay:not(.dark-mode) .image-preview-close {
  border-color: rgba(0, 0, 0, 0.2);
}

.image-preview-toolbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  z-index: 99999;
  pointer-events: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.image-preview-tool-btn {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.15s;
  position: relative;
}

.image-preview-tool-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.image-preview-tool-btn:active {
  transform: scale(0.95);
}

.image-preview-zoom-level {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  min-width: 48px;
  text-align: center;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  user-select: none;
  position: relative;
}

.image-preview-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  box-sizing: border-box;
}

.image-preview-content img {
  display: block;
  max-width: 90vw;
  max-height: calc(100vh - 120px);
  width: auto;
  height: auto;
  object-fit: contain;
  transition: transform 0.2s ease;
  transform-origin: center center;
  pointer-events: auto;
}

.image-preview-close {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #f53f3f;
  border: 3px solid rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 99999;
  pointer-events: auto;
  transition: all 0.15s;
  box-shadow: 0 4px 24px rgba(245, 63, 63, 0.6);
}

.image-preview-close:hover {
  background: #dc3545;
  transform: scale(1.2);
  box-shadow: 0 6px 30px rgba(245, 63, 63, 0.8);
}

.chat-input-container.drag-over {
  border-color: #409eff;
  background: #f0f7ff;
}

.drag-overlay {
  position: absolute;
  inset: 0;
  background: rgba(64, 158, 255, 0.08);
  border: 2px dashed #409eff;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
  animation: dragPulse 1.5s ease-in-out infinite;
}

@keyframes dragPulse {
  0%, 100% { background: rgba(64, 158, 255, 0.06); }
  50% { background: rgba(64, 158, 255, 0.12); }
}

.attached-files {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.attached-folder-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f0f7ff;
  border: 1px solid #d6e8ff;
  border-radius: 6px;
  font-size: 12px;
  color: #4e5969;
  max-width: 200px;
  position: relative;
  animation: chipIn 0.2s ease;
}

@keyframes chipIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.chip-icon {
  flex-shrink: 0;
}

.chip-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.chip-size {
  color: #86909c;
  font-size: 10px;
  flex-shrink: 0;
}

.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  border-radius: 50%;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.chip-remove:hover {
  background: rgba(245, 34, 45, 0.1);
  color: #f5222d;
}

.attached-folder-chip.uploading {
  background: #fff8e1;
  border-color: #ffe082;
  min-width: 180px;
}

.chip-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #f0f0f0;
  border-radius: 0 0 6px 6px;
  overflow: hidden;
}

.chip-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #1a6dd4);
  border-radius: 0 0 6px 6px;
  transition: width 0.3s ease;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.quick-commands {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 24px 4px;
  background: #fff;
}

.quick-cmd-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #e5e6eb;
  border-radius: 20px;
  background: #fafbfc;
  color: #4e5969;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.quick-cmd-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f0f7ff;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.mode-selector {
  position: relative;
  flex-shrink: 0;
  z-index: 50;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 44px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background: #fff;
  color: #4e5969;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

.mode-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f0f7ff;
}

.mode-btn .arrow {
  transition: transform 0.2s;
}

.mode-btn:hover .arrow {
  transform: rotate(180deg);
}

.mode-btn.qa {
  border-color: #409eff;
  color: #409eff;
  background: #f0f7ff;
}

.mode-btn.agent {
  border-color: #409eff;
  color: #409eff;
  background: #f0f7ff;
}

.mode-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 140px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s;
  color: #4e5969;
  font-size: 13px;
}

.mode-option:hover {
  background: #f5f7fa;
}

.mode-option.active {
  background: #e6f7ff;
  color: #409eff;
}

.mode-option.editor:hover {
  background: #f0f7f0;
}

.mode-option.editor.active {
  background: #f0f7f0;
  color: #52c41a;
}

.mode-option.agent:hover {
  background: #f0f7ff;
}

.mode-option.agent.active {
  background: #f0f7ff;
  color: #409eff;
}

.mode-apply-hint {
  margin-left: auto;
  font-size: 11px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.agent-apply-status {
  text-align: center;
  padding: 20px;
}

.agent-apply-status svg {
  color: #999;
  margin-bottom: 16px;
}

.agent-apply-status h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}

.agent-apply-status p {
  margin: 0 0 20px;
  color: #666;
  font-size: 14px;
}

.agent-premium-success {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #52c41a;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f6ffed;
  border-radius: 6px;
}

.agent-premium-success svg {
  color: #52c41a;
}

.agent-premium-input textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.agent-premium-input textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 156, 255, 0.1);
}

.memory-panel-body {
  overflow-y: auto;
  max-height: 200px;
}

.memory-empty-sidebar {
  text-align: center;
  padding: 16px 12px;
  color: #999;
  font-size: 12px;
}
.memory-empty-sidebar p { margin: 0; }
.memory-empty-hint { font-size: 11px; color: #bbb; margin-top: 4px !important; }

.memory-item-sidebar {
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
  cursor: default;
  transition: background 0.1s;
}
.memory-item-sidebar:hover { background: #f5f5f5; }
.memory-item-sidebar:last-child { border-bottom: none; }

.memory-item-topic-sidebar {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.memory-item-content-sidebar {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.memory-item-meta-sidebar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.memory-item-score-sidebar {
  font-size: 10px;
  color: #2563eb;
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 3px;
}

.memory-item-time-sidebar {
  font-size: 10px;
  color: #bbb;
  flex: 1;
}

.memory-del-btn-sidebar {
  padding: 2px;
  border: none;
  background: none;
  color: #ccc;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}
.memory-item-sidebar:hover .memory-del-btn-sidebar { opacity: 1; }
.memory-del-btn-sidebar:hover { color: #f5222d; }

.attach-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.attach-btn:hover {
  background: #f0f7ff;
  color: #409eff;
}

.attach-btn.active {
  color: #409eff;
  background: #f0f7ff;
}

.input-wrapper textarea {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  font-family: inherit;
  transition: all 0.3s;
  max-height: 120px;
}

.input-wrapper textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.input-wrapper textarea:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
}

.send-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #1a6dd4;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.send-btn:disabled {
  background: #c9cdd4;
  cursor: not-allowed;
}

.stop-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #f5222d;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.stop-btn:hover {
  background: #cf1322;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 34, 45, 0.3);
}

.input-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #86909c;
}

.editor-apply-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border-bottom: 1px solid #c8e6c9;
  color: #2e7d32;
  font-size: 13px;
  font-weight: 500;
}

.notice-slide-enter-active { transition: all 0.3s ease; }
.notice-slide-leave-active { transition: all 0.3s ease; }
.notice-slide-enter-from { opacity: 0; transform: translateY(-10px); }
.notice-slide-leave-to { opacity: 0; transform: translateY(-10px); }

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: linear-gradient(135deg, #f8f9fc 0%, #f0f2f7 100%);
  border-bottom: 1px solid #e2e5eb;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-filename {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.editor-modified-badge {
  font-size: 11px;
  color: #409eff;
  font-weight: 600;
  background: rgba(64, 158, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.editor-lang-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.editor-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid #e2e5eb;
  border-radius: 6px;
  background: #fff;
  color: #4e5969;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-weight: 500;
}

.editor-action-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
  background: rgba(64, 158, 255, 0.06);
  box-shadow: 0 1px 3px rgba(64, 158, 255, 0.15);
}

.editor-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-action-btn.active {
  border-color: #409eff;
  color: #409eff;
  background: rgba(64, 158, 255, 0.08);
}

.editor-action-btn.save {
  background: linear-gradient(135deg, #409eff 0%, #69b1ff 100%);
  border-color: #409eff;
  color: #fff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.3);
}

.editor-action-btn.save:hover:not(:disabled) {
  background: linear-gradient(135deg, #69b1ff 0%, #93d1ff 100%);
  border-color: #69b1ff;
  color: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.editor-action-btn.review {
  background: linear-gradient(135deg, #409eff 0%, #69b1ff 100%);
  border-color: #409eff;
  color: #fff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.3);
}

.editor-action-btn.review:hover:not(:disabled) {
  background: linear-gradient(135deg, #69b1ff 0%, #93d1ff 100%);
  border-color: #69b1ff;
  color: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.editor-action-btn.close {
  color: #86909c;
  border-color: #e2e5eb;
}

.editor-action-btn.close:hover {
  color: #f5222d;
  border-color: #f5222d;
  background: rgba(245, 34, 45, 0.06);
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.preview-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 2px solid #e5e6eb;
  background: #fff;
  z-index: 10;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #f5f7fa;
  color: #333;
  font-size: 12px;
  border-bottom: 1px solid #e5e6eb;
}

.preview-close-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 3px;
}

.preview-close-btn:hover {
  background: #e5e6eb;
  color: #333;
}

.preview-iframe {
  flex: 1;
  border: none;
  width: 100%;
  background: #fff;
}

.editor-body .monaco-editor-container {
  flex: 1;
  min-height: 0;
}



.floating-ai-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #409eff 0%, #1677ff 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64,158,255,0.3);
  transition: all 0.2s;
  z-index: 10;
}

.floating-ai-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64,158,255,0.4);
}

.floating-ai-btn:active {
  transform: translateY(0);
}

.quick-ai-input-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.quick-ai-input-container {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.quick-input-header {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 16px;
}

.quick-input-textarea {
  width: 100%;
  min-height: 100px;
  max-height: 200px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  color: #1d2129;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.quick-input-textarea:focus {
  border-color: #409eff;
}

.quick-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.hint {
  font-size: 12px;
  color: #888;
}

.quick-submit-btn {
  padding: 10px 24px;
  background: #409eff;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-submit-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.quick-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-footer {
  user-select: none;
  overflow: hidden;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  background: #409eff;
  border-top: none;
  font-size: 12px;
  color: #ffffff;
}

.editor-footer-left,
.editor-footer-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffffff;
  font-weight: 400;
}

.editor-hint {
  color: #86909c;
}

.editor-header-icon {
  color: #4e5969;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 200;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
  }

  .sidebar.collapsed {
    width: 0;
    border: none;
  }

  .mobile-sidebar-btn {
    display: flex;
  }

  .message-content {
    max-width: 85%;
  }

  .input-wrapper textarea {
    min-height: 40px;
  }

  .editor-container {
    margin: 16px 12px;
  }

  .main-content-area {
    flex-direction: column;
  }

  .editor-panel {
    width: 100%;
    height: 50%;
    border-right: none;
    border-bottom: 1px solid #e5e6eb;
  }

  .chat-panel {
    width: 100%;
    height: 50%;
  }

  .chat-panel.full-width {
    height: 100%;
  }

  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .editor-header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .editor-action-btn {
    flex: 1;
    justify-content: center;
    min-width: 80px;
  }

  .editor-body {
    min-height: 300px;
    max-height: 500px;
  }

  .editor-footer {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .model-picker-grid {
    grid-template-columns: 1fr;
  }

  .key-modal-lg {
    max-width: 95vw;
    margin: 16px;
  }

  .attached-files {
    gap: 4px;
  }

  .attached-folder-chip {
    max-width: 150px;
  }

  .chat-input-container {
    padding: 12px 16px;
  }

  .vscode-title-actions {
    opacity: 1;
  }
}

/* ====== 深色主题 ====== */
.ai-chat-container.dark-mode {
  background: #0a0a0a;
  transition: background 0.35s ease, color 0.35s ease;
}

.dark-mode .sidebar {
  background: linear-gradient(180deg, #141414 0%, #0f0f0f 100%);
  border-right-color: rgba(255, 255, 255, 0.04);
  transition: background 0.35s ease, border-color 0.35s ease;
}

.dark-mode .sidebar-header {
  border-bottom-color: rgba(255, 255, 255, 0.04);
}

.dark-mode .theme-header-btn {
  color: #5a5a5a;
  transition: all 0.25s ease;
}

.dark-mode .theme-header-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #60a5fa;
}

.dark-mode .new-chat-btn {
  background: transparent;
  color: #a0a0a0;
  transition: all 0.25s ease;
}

.dark-mode .new-chat-btn:hover {
  color: #60a5fa;
  background: rgba(255, 255, 255, 0.05);
}

.dark-mode .toggle-sidebar-btn {
  color: #5a5a5a;
  transition: all 0.25s ease;
}

.dark-mode .toggle-sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #b0b0b0;
}

.dark-mode .sidebar-body {
  scrollbar-color: #2a2a2a transparent;
}

.dark-mode .section-title {
  color: #5a5a5a;
  border-left-color: #60a5fa;
}

.dark-mode .vscode-title-text {
  color: #5a5a5a;
  border-left-color: #60a5fa;
}

.dark-mode .explorer-action-btn {
  color: #5a5a5a;
  transition: all 0.2s ease;
}

.dark-mode .explorer-action-btn:hover {
  background: rgba(255, 77, 79, 0.1);
  color: #ff6b6b;
}

.dark-mode .file-tree-empty {
  color: #5a5a5a;
}

.dark-mode .file-tree-empty:hover {
  background: rgba(255, 255, 255, 0.03);
}

.dark-mode .empty-title {
  color: #a0a0a0;
}

.dark-mode .empty-desc {
  color: #5a5a5a;
}

.dark-mode .saved-workspaces-title {
  color: #5a5a5a;
}

.dark-mode .saved-workspace-card {
  color: #a0a0a0;
  background: #2a2a2a;
  border-color: #333333;
  transition: all 0.2s ease;
}

.dark-mode .saved-workspace-card:hover {
  background: #303030;
  border-color: #3a3a3a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  color: #60a5fa;
}

.dark-mode .saved-workspace-hint {
  color: #5a5a5a;
}

.dark-mode .saved-workspace-card:hover .saved-workspace-hint {
  color: #60a5fa;
}

.dark-mode .saved-workspace-remove {
  color: #5a5a5a;
}

.dark-mode .saved-workspace-card:hover .saved-workspace-remove {
  opacity: 1;
  color: #8a8a8a;
}

.dark-mode .saved-workspace-remove:hover {
  background: rgba(255, 77, 79, 0.12);
  color: #ff6b6b;
}

.dark-mode .explorer-folder-card {
  background: #2a2a2a;
  border-color: #333333;
}

.dark-mode .explorer-folder-card:hover {
  background: #303030;
  border-color: #3a3a3a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.dark-mode .explorer-card-header {
  color: #a0a0a0;
}

.dark-mode .tree-item-name {
  color: #d4d4d4;
}

.dark-mode .tree-remove-btn {
  color: #5a5a5a;
}

.dark-mode .explorer-folder-card:hover .tree-remove-btn {
  color: #8a8a8a;
}

.dark-mode .tree-remove-btn:hover {
  color: #ff6b6b;
  background: rgba(255, 77, 79, 0.1);
}

.dark-mode .tree-download-btn {
  color: #5a5a5a;
}

.dark-mode .explorer-folder-card:hover .tree-download-btn {
  color: #8a8a8a;
}

.dark-mode .tree-download-btn:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}

.dark-mode .model-item {
  color: #a0a0a0;
  transition: all 0.2s ease;
}

.dark-mode .model-item:hover {
  background: rgba(255, 255, 255, 0.03);
  color: #d4d4d4;
}

.dark-mode .model-item.active {
  background: rgba(64, 158, 255, 0.1);
  color: #60a5fa;
}

.dark-mode .model-item-name {
  color: inherit;
}

.dark-mode .model-item-badge.need-key {
  background: rgba(250, 173, 20, 0.12);
  color: #ffc53d;
}

.dark-mode .custom-panel-header {
  color: #e0e0e0;
}

.dark-mode .custom-panel-header:hover {
  background: rgba(255, 255, 255, 0.04);
}

.dark-mode .custom-panel-title {
  color: #e0e0e0;
}

.dark-mode .custom-panel-chevron {
  color: #5a5a5a;
}

.dark-mode .custom-panel-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.dark-mode .custom-panel-item.current {
  background: rgba(96, 165, 250, 0.08);
  border-left-color: #60a5fa;
}

.dark-mode .custom-panel-item-name {
  color: #c0c0c0;
}

.dark-mode .custom-panel-item-add {
  color: #60a5fa;
  border-color: #60a5fa;
}

.dark-mode .custom-panel-item-del {
  color: #5a5a5a;
}

.dark-mode .custom-panel-item-del:hover {
  color: #ff6b6b;
  background: rgba(255, 77, 79, 0.1);
}

.dark-mode .custom-panel-empty {
  color: #5a5a5a;
}

.dark-mode .custom-panel-divider {
  background: #2a2a2a;
}

.dark-mode .custom-panel-subtitle {
  color: #5a5a5a;
}

.dark-mode .model-check {
  color: #60a5fa;
}

.dark-mode .key-config-btn {
  color: #5a5a5a;
}

.dark-mode .key-config-btn:hover {
  background: rgba(96, 165, 250, 0.06);
  color: #60a5fa;
}

.dark-mode .model-remove-btn {
  color: #5a5a5a;
}

.dark-mode .model-remove-btn:hover {
  background: rgba(255, 77, 79, 0.12);
  color: #ff6b6b;
}

.dark-mode .collapsed-theme-btn {
  color: #5a5a5a;
}

.dark-mode .collapsed-theme-btn:hover {
  background: rgba(96, 165, 250, 0.08);
  color: #60a5fa;
}

.dark-mode .chat-main {
  background: #0a0a0a;
  transition: background 0.35s ease;
}

.dark-mode .main-content-area {
  background: #0a0a0a;
}

.dark-mode .editor-panel {
  background: #1a1a1a;
  border-right-color: #222222;
  transition: background 0.35s ease;
}

.dark-mode .editor-tabs-container {
  background: #222222;
  border-bottom-color: #222222;
}

.dark-mode .tab-scroll-btn {
  background: #222222;
  color: #b0b0b0;
}

.dark-mode .tab-scroll-btn:hover {
  background: #333333;
  color: #ffffff;
}

.dark-mode .tab-scroll-left {
  border-right-color: #222222;
  box-shadow: 3px 0 8px rgba(0,0,0,0.4);
}

.dark-mode .tab-scroll-right {
  border-left-color: #222222;
  box-shadow: -3px 0 8px rgba(0,0,0,0.4);
}

.dark-mode .editor-tab {
  background: #2a2a2a;
  border-right-color: #222222;
  margin: 2px 0 0 2px;
  transition: background 0.2s ease;
}

.dark-mode .editor-tab:hover {
  background: #333333;
}

.dark-mode .editor-tab.active {
  background: #007acc;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.25);
}

.dark-mode .tab-icon {
  color: #b0b0b0;
}

.dark-mode .editor-tab.active .tab-icon {
  color: #ffffff;
}

.dark-mode .tab-name {
  color: #8a8a8a;
}

.dark-mode .editor-tab.active .tab-name {
  color: #ffffff;
}

.dark-mode .tab-modified {
  color: #b0b0b0;
}

.dark-mode .editor-tab.active .tab-modified {
  color: #ffffff;
}

.dark-mode .tab-close {
  color: #7a7a7a;
}

.dark-mode .editor-tab.active .tab-close {
  color: #ffffff;
}

.dark-mode .tab-close:hover {
  background: rgba(255,255,255,0.1);
  color: #ffffff;
}

.dark-mode .editor-tab.active .tab-close:hover {
  background: rgba(0,0,0,0.2);
}

.dark-mode .editor-header {
  background: #2a2a2a;
  border-bottom-color: #222222;
}

.dark-mode .editor-filename {
  color: #d4d4d4;
}

.dark-mode .editor-modified-badge {
  color: #b0b0b0;
}

.dark-mode .editor-lang-badge {
  color: #b0b0b0;
}

.dark-mode .editor-header-icon {
  color: #b0b0b0;
}

.dark-mode .editor-action-btn {
  background: transparent;
  border-color: transparent;
  color: #b0b0b0;
  transition: all 0.2s ease;
}

.dark-mode .editor-action-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.08);
  color: #ffffff;
  border-color: transparent;
}

.dark-mode .editor-action-btn.active {
  background: rgba(255,255,255,0.08);
  color: #ffffff;
}

.dark-mode .editor-action-btn.save {
  background: rgba(255,255,255,0.08);
  color: #0e639c;
}

.dark-mode .editor-action-btn.save:hover:not(:disabled) {
  background: rgba(255,255,255,0.12);
  color: #1177bb;
}

.dark-mode .editor-action-btn.review {
  background: rgba(64, 158, 255, 0.25);
  color: #69b1ff;
}

.dark-mode .editor-action-btn.review:hover:not(:disabled) {
  background: rgba(64, 158, 255, 0.4);
  color: #93d1ff;
}

.dark-mode .editor-footer {
  background: #007acc;
}

.dark-mode .quick-ai-input-container {
  background: #2a2a2a;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  border: 1px solid #333333;
}

.dark-mode .quick-input-header {
  color: #ffffff;
}

.dark-mode .quick-input-textarea {
  background: #1a1a1a;
  border-color: #3a3a3a;
  color: #ffffff;
}

.dark-mode .quick-input-textarea:focus {
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.dark-mode .quick-submit-btn {
  background: #007acc;
}

.dark-mode .quick-submit-btn:hover:not(:disabled) {
  background: #0088dd;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
}

.dark-mode .floating-ai-btn {
  background: linear-gradient(135deg, #007acc 0%, #005a99 100%);
  box-shadow: 0 4px 16px rgba(0,122,204,0.35);
  transition: box-shadow 0.3s ease;
}

.dark-mode .floating-ai-btn:hover {
  box-shadow: 0 6px 20px rgba(0,122,204,0.5);
}

.dark-mode .chat-panel {
  background: #0a0a0a;
}

.dark-mode .chat-topbar {
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(12px);
  border-bottom-color: #1e1e1e;
}

.dark-mode .topbar-title {
  color: #e0e0e0;
}

.dark-mode .topbar-model-placeholder {
  background: rgba(255, 255, 255, 0.03);
}

.dark-mode .topbar-placeholder-text {
  color: #5a5a5a;
}

.dark-mode .mobile-sidebar-btn {
  color: #5a5a5a;
}

.dark-mode .mobile-sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #d4d4d4;
}

.dark-mode .expand-sidebar-btn {
  color: #5a5a5a;
}

.dark-mode .expand-sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #d4d4d4;
}

.dark-mode .chat-history-section {
  border-top-color: #1e1e1e;
}

.dark-mode .history-count {
  background: rgba(255, 255, 255, 0.06);
  color: #5a5a5a;
}

.dark-mode .history-group-label {
  color: #5a5a5a;
}

.dark-mode .chat-history-card {
  color: #a0a0a0;
  background: #2a2a2a;
  border-color: #333333;
  transition: all 0.2s ease;
}

.dark-mode .chat-history-card:hover {
  background: #303030;
  border-color: #3a3a3a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  color: #e0e0e0;
}

.dark-mode .chat-history-card.active {
  background: rgba(96, 165, 250, 0.08);
  border-color: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.dark-mode .chat-history-card.active .chat-history-title {
  color: #60a5fa;
}

.dark-mode .card-menu-btn {
  color: #5a5a5a;
}

.dark-mode .chat-history-card:hover .card-menu-btn {
  color: #8a8a8a;
}

.dark-mode .card-menu-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #d0d0d0;
}

.dark-mode .card-menu-dropdown {
  background: #2d2d2d;
  border-color: #3a3a3a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.dark-mode .card-menu-item {
  color: #a0a0a0;
}

.dark-mode .card-menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e0e0e0;
}

.dark-mode .card-menu-item-danger:hover {
  background: rgba(255, 77, 79, 0.12);
  color: #ff6b6b;
}

.dark-mode .chat-history-meta {
  color: #5a5a5a;
}

.dark-mode .chat-history-card.active .chat-history-meta {
  color: rgba(96, 165, 250, 0.5);
}

.dark-mode .card-rename-input {
  background: #1a1a1a;
  border-color: #60a5fa;
  color: #e0e0e0;
}

.dark-mode .chat-history-empty {
  color: #4a4a4a;
}

.dark-mode .fifty-warning {
  background: rgba(250, 173, 20, 0.08);
  border-color: rgba(250, 173, 20, 0.2);
  color: #ffc53d;
}

.dark-mode .fifty-warning-close {
  border-color: rgba(250, 173, 20, 0.2);
  color: #ffc53d;
}

.dark-mode .fifty-warning-close:hover {
  background: #ffc53d;
  border-color: #ffc53d;
  color: #000;
}

.dark-mode .chat-messages {
  background: #0a0a0a;
}

.dark-mode .welcome-message h3 {
  color: #e0e0e0;
  font-weight: 700;
  letter-spacing: 1px;
}

.dark-mode .welcome-message p {
  color: #5a5a5a;
}

.dark-mode .welcome-icon {
  color: #3b82f6;
  filter: drop-shadow(0 4px 16px rgba(59, 130, 246, 0.3));
  animation: darkWelcomePulse 3s ease-in-out infinite;
}

@keyframes darkWelcomePulse {
  0%, 100% { filter: drop-shadow(0 4px 16px rgba(59, 130, 246, 0.3)); }
  50% { filter: drop-shadow(0 4px 24px rgba(59, 130, 246, 0.5)); }
}

.dark-mode .tip {
  border-color: #2a2a2a;
  background: rgba(255, 255, 255, 0.02);
  color: #7a7a7a;
  transition: all 0.25s ease;
}

.dark-mode .tip:hover {
  border-color: #3b82f6;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.08);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.dark-mode .message {
  background: transparent;
  animation: darkFadeIn 0.35s ease;
}

@keyframes darkFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.dark-mode .message.user .message-content {
  background: linear-gradient(135deg, #1a2540 0%, #1e2d4a 100%);
  border-color: rgba(64, 158, 255, 0.15);
  color: #e8e8e8;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.dark-mode .message.ai .message-content {
  background: #111111;
  border-color: #1e1e1e;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.dark-mode .sender-name {
  color: #e0e0e0;
}

.dark-mode .sender-tag {
  color: #8b949e;
  background: #21262d;
}

.dark-mode .message-time {
  color: #4a4a4a;
}

.dark-mode .user-body {
  color: #e8e8e8;
}

.dark-mode .message-avatar .avatar-placeholder {
  background: #1e1e3a;
  color: #60a5fa;
}

.dark-mode .message-avatar .user-avatar-icon {
  background: linear-gradient(135deg, #2a4a7f, #3a6abf);
  color: #fff;
  box-shadow: 0 2px 10px rgba(64, 158, 255, 0.25);
}

.dark-mode .markdown-body :deep(p) {
  color: #d4d4d4;
}

.dark-mode .markdown-body :deep(h1),
.dark-mode .markdown-body :deep(h2),
.dark-mode .markdown-body :deep(h3),
.dark-mode .markdown-body :deep(h4) {
  color: #e8e8e8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dark-mode .markdown-body :deep(li) {
  color: #d4d4d4;
}

.dark-mode .markdown-body :deep(strong) {
  color: #f0f0f0;
}

.dark-mode .markdown-body :deep(em) {
  color: #c0c0c0;
}

.dark-mode .markdown-body :deep(a) {
  color: #60a5fa;
}

.dark-mode .markdown-body :deep(a:hover) {
  color: #93c5fd;
}

.dark-mode .markdown-body :deep(blockquote) {
  border-left-color: rgba(96, 165, 250, 0.3);
  color: #a0a0a0;
  background: rgba(96, 165, 250, 0.04);
  padding: 8px 16px;
  border-radius: 0 6px 6px 0;
}

.dark-mode .markdown-body :deep(th) {
  background: #1a1a1a;
  color: #e8e8e8;
  font-weight: 700;
}

.dark-mode .markdown-body :deep(td) {
  border-color: #2a2a2a;
  color: #d4d4d4;
  overflow-wrap: break-word;
  word-break: break-word;
}

.dark-mode .markdown-body :deep(hr) {
  border-top-color: #1e1e1e;
}

.dark-mode .streaming-cursor {
  background: #60a5fa;
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
}

.dark-mode .reasoning-section {
  border-color: #2a2a2a;
}
.dark-mode .reasoning-section.thinking {
  border-color: #1a3a5c;
}
.dark-mode .reasoning-section.done {
  border-color: #2a3a2a;
}
.dark-mode .reasoning-header {
  background: #161616;
  color: #888;
}
.dark-mode .reasoning-section.thinking .reasoning-header {
  background: #0d1a2a;
  color: #6cb6ff;
}
.dark-mode .reasoning-section.done .reasoning-header {
  background: #1a221a;
  color: #7ab87a;
}
.dark-mode .thinking-pulse {
  background: #6cb6ff;
}
.dark-mode .thinking-dots i {
  color: #6cb6ff;
}
.dark-mode .reasoning-badge.done { background: #1a2e1a; color: #7ab87a; }
.dark-mode .reasoning-body {
  color: #999;
  border-top-color: #2a2a2a;
}
.dark-mode .reasoning-body pre { background: #111; }
.dark-mode .reasoning-body code { background: #222; }

.dark-mode .md-code-block {
  background: #080808;
  border-color: #1e1e1e;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  overflow: hidden;
}

.dark-mode .md-code-header {
  background: #0e0e0e;
  border-bottom-color: #1e1e1e;
}

.dark-mode .md-code-lang {
  color: #5a5a5a;
}

.dark-mode .md-code-filename {
  color: rgba(74, 222, 128, 0.8);
  background: rgba(34, 197, 94, 0.06);
  border-color: rgba(34, 197, 94, 0.12);
}

.dark-mode .markdown-body :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  color: #fb7185;
  border-radius: 3px;
  padding: 1px 5px;
  overflow-wrap: break-word;
  word-break: break-all;
}

.dark-mode .markdown-body :deep(pre code) {
  background: transparent;
  color: #d4d4d4;
  padding: 0;
}

.dark-mode .md-code-block pre {
  background: #080808;
}

.dark-mode .md-code-block pre code {
  color: #d4d4d4;
}

.dark-mode .quick-commands {
  background: #0a0a0a;
}

.dark-mode .quick-cmd-btn {
  border-color: #2a2a2a;
  background: rgba(255, 255, 255, 0.02);
  color: #7a7a7a;
  transition: all 0.25s ease;
}

.dark-mode .quick-cmd-btn:hover {
  border-color: #3b82f6;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.08);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.dark-mode .chat-input-container {
  background: #0a0a0a;
  border-top-color: #1e1e1e;
  transition: background 0.35s ease;
}

.dark-mode .chat-input-container.drag-over {
  border-color: #60a5fa;
  background: rgba(59, 130, 246, 0.06);
}

.dark-mode .attach-btn {
  color: #5a5a5a;
  transition: all 0.2s ease;
}

.dark-mode .attach-btn:hover {
  background: rgba(64, 158, 255, 0.08);
  color: #60a5fa;
}

.dark-mode .input-wrapper textarea {
  background: #111111;
  border-color: #2a2a2a;
  color: #e0e0e0;
  transition: all 0.25s ease;
}

.dark-mode .input-wrapper textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 4px 16px rgba(0, 0, 0, 0.2);
}

.dark-mode .input-wrapper textarea:disabled {
  background: #080808;
  color: #4a4a4a;
}

.dark-mode .input-wrapper textarea::placeholder {
  color: #4a4a4a;
}

.dark-mode .send-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  transition: all 0.25s ease;
}

.dark-mode .send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.dark-mode .send-btn:disabled {
  background: #2a2a2a;
  box-shadow: none;
}

.dark-mode .stop-btn {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
  transition: all 0.25s ease;
}

.dark-mode .stop-btn:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4);
  transform: translateY(-1px);
}

.dark-mode .input-hint {
  color: #4a4a4a;
}

.dark-mode .attached-folder-chip {
  background: rgba(255, 255, 255, 0.03);
  border-color: #2a2a2a;
  color: #a0a0a0;
}

.dark-mode .attached-folder-chip.uploading {
  background: rgba(250, 173, 20, 0.06);
  border-color: rgba(250, 173, 20, 0.2);
}

.dark-mode .chip-progress-bar {
  background: #1e1e1e;
}

.dark-mode .chip-progress-fill {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.3);
}

.dark-mode .chip-size {
  color: #5a5a5a;
}

.dark-mode .chip-remove {
  color: #4a4a4a;
}

.dark-mode .chip-remove:hover {
  background: rgba(255, 77, 79, 0.1);
  color: #ff6b6b;
}

.dark-mode .editor-apply-notice {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.08) 100%);
  border-bottom-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.dark-mode .editor-header {
  background: #0e0e0e;
  border-bottom-color: #2a2a2a;
}

.dark-mode .editor-filename {
  color: #e0e0e0;
}

.dark-mode .editor-action-btn {
  border-color: #333333;
  background: transparent;
  color: #7a7a7a;
  transition: all 0.2s ease;
}

.dark-mode .editor-action-btn:hover:not(:disabled) {
  border-color: #60a5fa;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
}

.dark-mode .editor-action-btn.save {
  background: linear-gradient(135deg, #1677ff, #0958d9);
  border-color: #1677ff;
  color: #fff;
  box-shadow: 0 2px 6px rgba(22, 119, 255, 0.25);
}

.dark-mode .editor-action-btn.save:hover:not(:disabled) {
  background: linear-gradient(135deg, #4096ff, #1677ff);
  border-color: #4096ff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.35);
}

.dark-mode .editor-action-btn.review {
  background: linear-gradient(135deg, #409eff, #2b7de9);
  border-color: #409eff;
  color: #fff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.25);
}

.dark-mode .editor-action-btn.review:hover:not(:disabled) {
  background: linear-gradient(135deg, #69b1ff, #409eff);
  border-color: #69b1ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);
}

.dark-mode .editor-action-btn.close {
  color: #7a7a7a;
  border-color: #333333;
}

.dark-mode .editor-action-btn.close:hover {
  color: #ff6b6b;
  border-color: #ff6b6b;
  background: rgba(255, 77, 79, 0.08);
}

.dark-mode .editor-footer {
  background: #0e0e0e;
  border-top-color: #2a2a2a;
  color: #5a5a5a;
}

.dark-mode .editor-hint {
  color: #2a2a2a;
}

.dark-mode .drag-overlay {
  background: rgba(59, 130, 246, 0.08);
  border-color: #60a5fa;
  color: #60a5fa;
}

.dark-mode .model-picker-card {
  border-color: #2a2a2a;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.25s ease;
}

.dark-mode .model-picker-card:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.06);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.08);
}

.dark-mode .model-picker-card.selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15), 0 0 16px rgba(59, 130, 246, 0.1);
}

.dark-mode .model-picker-name {
  color: #e0e0e0;
}

.dark-mode .model-picker-provider {
  color: #5a5a5a;
}

.dark-mode .model-picker-hint {
  background: rgba(255, 255, 255, 0.02);
  color: #5a5a5a;
}

.dark-mode .key-modal-overlay {
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.dark-mode .key-modal,
.dark-mode .key-modal-lg,
.dark-mode .confirm-modal-sm {
  background: #141414;
  border: 1px solid #2a2a2a;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
  border-radius: 12px;
}

.dark-mode .key-modal-header {
  border-bottom-color: #1e1e1e;
}

.dark-mode .key-modal-header h3 {
  color: #e0e0e0;
}

.dark-mode .key-modal-close {
  color: #5a5a5a;
  transition: all 0.2s ease;
}

.dark-mode .key-modal-close:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
}

.dark-mode .key-modal-desc {
  color: #a0a0a0;
}

.dark-mode .key-modal-guide {
  color: #8b949e;
}

.dark-mode .key-modal-guide-link {
  color: #6cb6ff;
}

.dark-mode .key-modal-guide-link:hover {
  color: #79b8ff;
}

.dark-mode .confirm-text-main {
  color: #e0e0e0;
}

.dark-mode .confirm-text-sub {
  color: #8b949e;
}

.dark-mode .key-input-group label {
  color: #a0a0a0;
}

.dark-mode .key-input {
  background: #0a0a0a;
  border-color: #2a2a2a;
  color: #e0e0e0;
  transition: all 0.25s ease;
}

.dark-mode .key-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark-mode .key-input::placeholder {
  color: #4a4a4a;
}

.dark-mode .key-toggle-visibility {
  color: #5a5a5a;
}

.dark-mode .key-toggle-visibility:hover {
  color: #a0a0a0;
}

.dark-mode .key-delete-hint {
  color: #5a5a5a;
}

.dark-mode .key-delete-btn {
  color: #ff6b6b;
}

.dark-mode .key-delete-btn:hover {
  background: rgba(255, 77, 79, 0.12);
}

.dark-mode .key-delete-confirm-text {
  color: #a0a0a0;
}

.dark-mode .key-btn-delete-cancel {
  background: #409eff;
  color: #fff;
}

.dark-mode .key-btn-delete-cancel:hover {
  background: #1a6dd4;
}

.dark-mode .key-modal-footer {
  border-top-color: #1e1e1e;
}

.dark-mode .key-btn.cancel {
  border-color: #2a2a2a;
  color: #7a7a7a;
  background: transparent;
  transition: all 0.2s ease;
}

.dark-mode .key-btn.cancel:hover {
  border-color: #5a5a5a;
  color: #b0b0b0;
  background: rgba(255, 255, 255, 0.03);
}

.dark-mode .key-btn.save {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #3b82f6;
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  transition: all 0.25s ease;
}

.dark-mode .key-btn.save:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
  transform: translateY(-1px);
}

.dark-mode .key-btn.save:disabled {
  background: #2a2a2a;
  border-color: #2a2a2a;
  color: #5a5a5a;
  box-shadow: none;
  transform: none;
}

.dark-mode .key-btn.delete-cancel-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #3b82f6;
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.dark-mode .key-btn.delete-cancel-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

.dark-mode .key-btn.delete-confirm-btn {
  background: #f5222d;
  border-color: #f5222d;
  color: #fff;
  box-shadow: 0 2px 8px rgba(245, 34, 45, 0.25);
}

.dark-mode .key-btn.delete-confirm-btn:hover {
  background: #cf1322;
  box-shadow: 0 4px 12px rgba(245, 34, 45, 0.35);
}

.dark-mode .apply-change-item {
  border-color: #2a2a2a;
}

.dark-mode .apply-change-header {
  background: #1a1a1a;
  border-color: #2a2a2a;
}

.dark-mode .apply-change-name {
  color: #e0e0e0;
}

.dark-mode .apply-change-preview {
  padding: 12px 14px;
}

.dark-mode .apply-change-preview pre {
  background: #1a1a1a;
  color: #d4d4d4;
}

.dark-mode .apply-diff-new pre {
  background: rgba(34, 197, 94, 0.08);
  color: #86efac;
}

.dark-mode .apply-diff-old pre {
  background: rgba(255, 77, 79, 0.08);
  color: #fca5a5;
}

.dark-mode .apply-diff-label {
  color: #5a5a5a;
}

.dark-mode .apply-change-header:hover {
  background: #1f1f1f;
}

.dark-mode .apply-accept-btn,
.dark-mode .apply-reject-btn {
  background: #1e1e1e;
  border-color: #333;
}

.dark-mode .apply-change-item.accepted {
  border-color: rgba(34, 197, 94, 0.4);
}
.dark-mode .apply-change-item.rejected {
  border-color: rgba(245, 34, 45, 0.4);
}

.dark-mode .key-btn-sm {
  background: #1e1e1e;
  border-color: #333;
  color: #d4d4d4;
}

.dark-mode .apply-diff-old .apply-diff-label {
  color: #f87171;
}

.dark-mode .apply-diff-new .apply-diff-label {
  color: #4ade80;
}

.dark-mode .sidebar.collapsed:hover {
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.6);
}

.dark-mode .sidebar.collapsed .new-chat-btn:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

@media (max-width: 768px) {
  .dark-mode .sidebar {
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.7);
  }

  .dark-mode .editor-panel {
    border-bottom-color: #222222;
  }
}

.dark-mode .model-group-label {
  color: #5a5a5a;
}

.dark-mode .model-empty-hint {
  color: #4a4a4a;
}

.dark-mode ::-webkit-scrollbar-track {
  background: transparent;
}

.dark-mode ::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 4px;
}

.dark-mode ::-webkit-scrollbar-thumb:hover {
  background: #3a3a3a;
}

.dark-mode ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.dark-mode .topbar-model-info {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(96, 165, 250, 0.15);
  transition: all 0.25s ease;
}

.dark-mode .topbar-model-info:hover {
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.3);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.1);
}

.dark-mode .topbar-model-icon {
  filter: drop-shadow(0 0 4px rgba(64, 158, 255, 0.3));
}

.dark-mode .topbar-chevron {
  color: #7a7a7a;
}

.dark-mode .topbar-model-dropdown {
  background: #141414;
  border: 1px solid rgba(96, 165, 250, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(96, 165, 250, 0.08);
  border-radius: 10px;
}

.dark-mode .topbar-model-dropdown-item {
  color: #a0a0a0;
  transition: all 0.2s ease;
}

.dark-mode .topbar-model-dropdown-item:hover {
  background: rgba(96, 165, 250, 0.08);
  color: #e0e0e0;
}

.dark-mode .topbar-model-dropdown-item.active {
  background: rgba(64, 158, 255, 0.1);
  color: #60a5fa;
}

.dark-mode .topbar-model-dropdown-icon {
  filter: brightness(0.9);
}

.dark-mode .topbar-model-dropdown-name {
  color: inherit;
}

.dark-mode .topbar-model-tag {
  background: rgba(255, 255, 255, 0.06);
  color: #7a7a7a;
}

.dark-mode .topbar-model-tag.image-tag {
  background: rgba(168, 85, 247, 0.1);
  color: #c084fc;
}

.dark-mode .topbar-model-tag.video-tag {
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
}

.dark-mode .topbar-model-top-badge {
  filter: drop-shadow(0 0 6px rgba(255, 200, 0, 0.4));
}

.dark-mode .waiting-tip {
  color: #5a5a5a;
}

.dark-mode .waiting-spinner svg {
  color: #60a5fa;
  animation: darkSpin 1.5s linear infinite;
}

@keyframes darkSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dark-mode .message-action-btn {
  color: #4a4a4a;
  transition: all 0.2s ease;
}

.dark-mode .message-action-btn:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
}

.dark-mode .model-picker-item {
  background: rgba(255, 255, 255, 0.02);
  border-color: #2a2a2a;
  transition: all 0.2s ease;
}

.dark-mode .model-picker-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.dark-mode .model-picker-item.selected {
  background: rgba(96, 165, 250, 0.08);
  border-color: rgba(96, 165, 250, 0.2);
}

.dark-mode .model-picker-name {
  color: #e0e0e0;
}

.dark-mode .model-picker-provider {
  color: #5a5a5a;
}

.dark-mode .tag-free {
  background: transparent;
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.2);
}

.dark-mode .tag-top {
  background: transparent;
  color: #ffc53d;
  border-color: rgba(255, 197, 61, 0.2);
}

.dark-mode .tag-image {
  background: transparent;
  color: #c084fc;
  border-color: rgba(192, 132, 252, 0.2);
}

.dark-mode .tag-video {
  background: transparent;
  color: #f472b6;
  border-color: rgba(244, 114, 182, 0.2);
}

.dark-mode .preview-panel {
  border-left-color: #2a2a2a;
  background: #0a0a0a;
}

.agent-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e6eb;
  margin: 16px 0 12px;
}
.agent-tab {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 13px;
  color: #86909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  font-family: inherit;
}
.agent-tab.active {
  color: #409eff;
  border-bottom-color: #409eff;
  font-weight: 500;
}
.agent-tab:hover { color: #409eff; }

.agent-form { margin-top: 8px; }
.agent-form-hint { font-size: 12px; color: #86909c; margin-bottom: 8px; }
.agent-textarea, .agent-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  background: #fff;
  font-family: inherit;
  box-sizing: border-box;
  resize: vertical;
  outline: none;
}
.agent-textarea:focus, .agent-input:focus { border-color: #409eff; }
.agent-error { color: #f5222d; font-size: 12px; margin-top: 6px; }
.agent-success { color: #22c55e; font-size: 12px; margin-top: 6px; }

.agent-quota-badge {
  font-size: 10px;
  color: #2563eb;
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: auto;
}

.agent-premium-modal {
  width: 460px;
  max-width: 92vw;
  border-radius: 16px;
  overflow: hidden;
}

.apply-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.apply-modal {
  position: relative;
  width: 900px;
  max-width: 95vw;
  max-height: 90vh;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.apply-modal-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.apply-modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #4e5969;
}

.apply-modal-header {
  position: relative;
  padding: 28px 28px 20px;
  text-align: center;
  background: linear-gradient(135deg, #f0f6ff 0%, #e8f2ff 100%);
  border-bottom: 1px solid rgba(64, 158, 255, 0.08);
}

.apply-modal-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #409eff, #2563eb);
  color: #fff;
  box-shadow: 0 6px 18px rgba(64, 158, 255, 0.25);
  margin-bottom: 12px;
}

.apply-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 6px;
}

.apply-modal-desc {
  font-size: 13px;
  color: #86909c;
  margin: 0;
}

.apply-modal-content {
  padding: 20px 24px 24px;
  overflow-y: auto;
  flex: 1;
}

.apply-mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.apply-mode-item {
  border: 1.5px solid #e5e6eb;
  border-radius: 12px;
  padding: 18px 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.apply-mode-item.apply-mode-free {
  background: linear-gradient(180deg, #f6ffed 0%, #fff 40%);
}

.apply-mode-item.apply-mode-self {
  background: linear-gradient(180deg, #fff7e6 0%, #fff 40%);
}

.mode-price-badge {
  position: absolute;
  top: -8px;
  right: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.badge-free {
  background: linear-gradient(135deg, #00b42a, #00a020);
  color: #fff;
}

.badge-self {
  background: linear-gradient(135deg, #ff7d00, #d96800);
  color: #fff;
}

.apply-mode-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.apply-mode-item.mode-active {
  border-color: #00b42a;
  background: linear-gradient(180deg, #f0fff4 0%, #fff 100%);
}

.mode-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  color: #fff;
}

.mode-icon-qa {
  background: linear-gradient(135deg, #409eff, #2563eb);
  box-shadow: 0 3px 10px rgba(64, 158, 255, 0.2);
}

.mode-icon-agent {
  background: linear-gradient(135deg, #722ed1, #5218a8);
  box-shadow: 0 3px 10px rgba(114, 46, 209, 0.2);
}

.mode-icon-custom {
  background: linear-gradient(135deg, #ff7d00, #d96800);
  box-shadow: 0 3px 10px rgba(255, 125, 0, 0.2);
}

.mode-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 4px;
}

.mode-item-subtitle {
  font-size: 11px;
  color: #86909c;
  margin: 0 0 10px;
}

.mode-item-features {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  text-align: left;
  width: 100%;
}

.mode-item-features li {
  font-size: 11px;
  color: #4e5969;
  padding: 2px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mode-item-features li::before {
  content: '✓';
  color: #00b42a;
  font-weight: 700;
  font-size: 10px;
}

.mode-item-status {
  margin-bottom: 8px;
}

.mode-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.badge-green { background: #e8ffea; color: #00b42a; }
.badge-orange { background: #fff3e8; color: #ff7d00; }
.badge-red { background: #ffece8; color: #f53f3f; }
.badge-blue { background: #e8f3ff; color: #165dff; }

.mode-item-btn {
  width: 100%;
  padding: 7px 14px;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #409eff, #2563eb);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.mode-item-btn:hover { background: linear-gradient(135deg, #3085e8, #1d4ed8); }
.mode-item-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mode-btn-green {
  background: linear-gradient(135deg, #00b42a, #00a020);
}
.mode-btn-green:hover { background: linear-gradient(135deg, #00a020, #008c18); }

.apply-form-area {
  animation: formFadeIn 0.3s ease;
}

@keyframes formFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.apply-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: #fff;
  color: #86909c;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  margin-bottom: 14px;
}

.apply-back:hover { background: #f5f7fa; color: #409eff; border-color: #409eff; }

.apply-form-card {
  background: #fafbfc;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  padding: 18px 16px;
}

.apply-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 14px;
}

.apply-status-box {
  text-align: center;
  padding: 16px;
  border-radius: 10px;
}

.status-pending {
  background: #fff3e8;
  border: 1px solid #ffe7ba;
}

.status-rejected {
  background: #ffece8;
  border: 1px solid #ffc2b3;
}

.apply-status-emoji {
  font-size: 36px;
  margin-bottom: 8px;
}

.apply-status-box h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 4px;
}

.apply-status-box p {
  font-size: 12px;
  color: #86909c;
  margin: 0 0 12px;
}

.apply-input-group {
  margin-bottom: 12px;
}

.apply-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.apply-label {
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
}

.apply-hint {
  font-size: 11px;
  color: #c9cdd4;
}

.apply-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  background: #fff;
  color: #1d2129;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.apply-textarea:focus { border-color: #409eff; }

.apply-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  background: #fff;
  color: #1d2129;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.apply-input:focus { border-color: #409eff; }

.apply-error-msg {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #f53f3f;
  margin: 0 0 10px;
}

.apply-success-msg {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #00b42a;
  margin: 0 0 10px;
}

.apply-card-btn {
  width: 100%;
  padding: 9px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #409eff, #2563eb);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.apply-card-btn:hover { background: linear-gradient(135deg, #3085e8, #1d4ed8); }
.apply-card-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.apply-tabs {
  display: flex;
  gap: 6px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 14px;
}

.apply-tab-item {
  flex: 1;
  padding: 7px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.apply-tab-item.tab-active {
  background: #fff;
  color: #409eff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.apply-tab-item:hover:not(.tab-active) { color: #409eff; }

.apply-modal-content::-webkit-scrollbar { width: 5px; }
.apply-modal-content::-webkit-scrollbar-thumb { background: #e5e6eb; border-radius: 3px; }
.apply-modal-content::-webkit-scrollbar-track { background: transparent; }

.agent-premium-header {
  position: relative;
  padding: 32px 32px 24px;
  text-align: center;
  background: linear-gradient(135deg, #f0f6ff 0%, #e8f2ff 50%, #f5f8ff 100%);
  border-bottom: 1px solid rgba(64, 158, 255, 0.08);
}

.agent-premium-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #409eff, #2563eb);
  color: #fff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.25);
  margin-bottom: 16px;
  animation: agentIconFloat 3s ease-in-out infinite;
}

@keyframes agentIconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.agent-premium-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}

.agent-premium-subtitle {
  font-size: 13px;
  color: #86909c;
  margin: 0;
  line-height: 1.5;
  max-width: 320px;
  margin: 0 auto;
}

.agent-premium-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
}

.agent-premium-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #4e5969;
}

.agent-premium-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 16px 32px;
  background: #fff;
  border-bottom: 1px solid #f2f3f5;
}

.agent-feature-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4e5969;
}

.agent-feature-item svg {
  color: #409eff;
  flex-shrink: 0;
}

.agent-premium-body {
  padding: 20px 24px 24px;
  background: #fff;
}

.agent-premium-tabs {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 10px;
  margin-bottom: 20px;
}

.agent-premium-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #86909c;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.agent-premium-tab svg {
  transition: all 0.25s;
}

.agent-premium-tab.active {
  background: #fff;
  color: #409eff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(64, 158, 255, 0.08);
}

.agent-premium-tab:hover:not(.active) {
  color: #409eff;
  background: rgba(255, 255, 255, 0.6);
}

.agent-premium-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-premium-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.agent-premium-label {
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
}

.agent-premium-optional {
  font-size: 11px;
  color: #c9cdd4;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.agent-premium-required {
  font-size: 11px;
  color: #f5222d;
  background: rgba(245, 34, 45, 0.06);
  padding: 2px 8px;
  border-radius: 4px;
}

.agent-premium-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e5e6eb;
  border-radius: 10px;
  font-size: 13px;
  color: #1d2129;
  background: #fafbfc;
  font-family: inherit;
  box-sizing: border-box;
  resize: vertical;
  outline: none;
  transition: all 0.25s ease;
  line-height: 1.6;
}

.agent-premium-textarea:focus {
  border-color: #409eff;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.08);
}

.agent-premium-textarea::placeholder {
  color: #c9cdd4;
}

.agent-premium-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.agent-premium-input-icon {
  position: absolute;
  left: 14px;
  color: #c9cdd4;
  pointer-events: none;
}

.agent-premium-input {
  width: 100%;
  padding: 12px 14px 12px 40px;
  border: 1.5px solid #e5e6eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  color: #1d2129;
  background: #fafbfc;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  box-sizing: border-box;
  outline: none;
  transition: all 0.25s ease;
}

.agent-premium-input:focus {
  border-color: #409eff;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.08);
}

.agent-premium-input::placeholder {
  color: #c9cdd4;
  letter-spacing: 0;
  font-weight: 400;
  font-family: inherit;
}

.agent-premium-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f5222d;
  font-size: 12px;
  margin: 0;
  padding: 8px 12px;
  background: rgba(245, 34, 45, 0.04);
  border-radius: 8px;
}

.agent-premium-success {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #22c55e;
  font-size: 12px;
  margin: 0;
  padding: 8px 12px;
  background: rgba(34, 197, 94, 0.04);
  border-radius: 8px;
}

.agent-premium-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #409eff, #2563eb);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.25);
  position: relative;
  overflow: hidden;
}

.agent-premium-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.agent-premium-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.35);
}

.agent-premium-btn:hover:not(:disabled)::after {
  opacity: 1;
}

.agent-premium-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.agent-premium-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.agent-btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: agentSpin 0.6s linear infinite;
}

@keyframes agentSpin { to { transform: rotate(360deg); } }

.dark-mode .agent-premium-modal {
  border: 1px solid #2a2a2a;
}

.dark-mode .agent-premium-header {
  background: linear-gradient(135deg, #14161a 0%, #181c22 50%, #15171b 100%);
  border-bottom-color: rgba(64, 158, 255, 0.1);
}

.dark-mode .agent-premium-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.dark-mode .agent-premium-title {
  color: #e0e0e0;
}

.dark-mode .agent-premium-subtitle {
  color: #888;
}

.dark-mode .agent-premium-close {
  background: rgba(255, 255, 255, 0.04);
  color: #666;
}

.dark-mode .agent-premium-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #a0a0a0;
}

.dark-mode .agent-premium-features {
  background: #0d0d0d;
  border-bottom-color: #1e1e1e;
}

.dark-mode .agent-feature-item {
  color: #a0a0a0;
}

.dark-mode .agent-feature-item svg {
  color: #3b82f6;
}

.dark-mode .agent-premium-body {
  background: #0d0d0d;
}

.dark-mode .agent-premium-tabs {
  background: #181818;
}

.dark-mode .agent-premium-tab {
  color: #777;
}

.dark-mode .agent-premium-tab.active {
  background: #1a1a1a;
  color: #60a5fa;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(59, 130, 246, 0.1);
}

.dark-mode .agent-premium-tab:hover:not(.active) {
  color: #60a5fa;
  background: rgba(255, 255, 255, 0.03);
}

.dark-mode .agent-premium-label {
  color: #e0e0e0;
}

.dark-mode .agent-premium-optional {
  color: #666;
  background: #181818;
}

.dark-mode .agent-premium-required {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.08);
}

.dark-mode .agent-premium-textarea {
  background: #141414;
  border-color: #2a2a2a;
  color: #d4d4d4;
}

.dark-mode .agent-premium-textarea:focus {
  border-color: #3b82f6;
  background: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.dark-mode .agent-premium-textarea::placeholder {
  color: #555;
}

.dark-mode .agent-premium-input-icon {
  color: #555;
}

.dark-mode .agent-premium-input {
  background: #141414;
  border-color: #2a2a2a;
  color: #d4d4d4;
}

.dark-mode .agent-premium-input:focus {
  border-color: #3b82f6;
  background: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.dark-mode .agent-premium-input::placeholder {
  color: #555;
}

.dark-mode .agent-premium-error {
  background: rgba(255, 107, 107, 0.06);
}

.dark-mode .agent-premium-success {
  background: rgba(34, 197, 94, 0.06);
}

.dark-mode .agent-premium-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

.dark-mode .agent-premium-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.dark-mode .agent-premium-btn:active:not(:disabled) {
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.dark-mode .agent-tabs { border-bottom-color: #2a2a2a; }
.dark-mode .agent-tab { color: #888; }
.dark-mode .agent-tab.active { color: #60a5fa; border-bottom-color: #60a5fa; }
.dark-mode .agent-tab:hover { color: #60a5fa; }
.dark-mode .agent-textarea, .dark-mode .agent-input {
  background: #1a1a1a;
  border-color: #2a2a2a;
  color: #d4d4d4;
}
.dark-mode .agent-textarea:focus, .dark-mode .agent-input:focus { border-color: #409eff; }
.dark-mode .agent-quota-badge { background: #1e293b; color: #60a5fa; }

.dark-mode .preview-header {
  background: #141414;
  color: #a0a0a0;
  border-bottom-color: #2a2a2a;
}

.dark-mode .preview-close-btn {
  color: #666;
}
.dark-mode .preview-close-btn:hover {
  background: #2a2a2a;
  color: #ccc;
}

.dark-mode .preview-iframe {
  background: #fff;
}

.dark-mode .user-sent-image {
  border: 1px solid #2a2a2a;
  border-radius: 8px;
}

.dark-mode .avatar-img {
  border: 2px solid rgba(64, 158, 255, 0.2);
}

.dark-mode .message-copy-btn {
  color: #4a4a4a;
}

.dark-mode .message-copy-btn:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
}

.dark-mode .message-regenerate-btn {
  color: #4a4a4a;
}

.dark-mode .message-regenerate-btn:hover {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.08);
}

.dark-mode .memory-item-sidebar { border-bottom-color: #2a2a2a; }
.dark-mode .memory-item-sidebar:hover { background: #222; }
.dark-mode .memory-item-topic-sidebar { color: #d4d4d4; }
.dark-mode .memory-item-content-sidebar { color: #888; }
.dark-mode .memory-item-score-sidebar { background: #1e293b; color: #60a5fa; }
.dark-mode .memory-item-time-sidebar { color: #555; }
.dark-mode .memory-empty-sidebar { color: #555; }
.dark-mode .memory-empty-hint { color: #444; }
</style>
