<template>
  <div class="forum-page">
    <div v-if="!currentPost" class="forum-list-view">
      <div class="forum-banner">
        <div class="banner-bg"></div>
        <div class="banner-content">
          <div class="banner-left">
            <h1 class="banner-title">社区论坛</h1>
            <p class="banner-desc">技术交流?· 经验分享 · 问题讨论</p>
          </div>
          <div class="banner-stats">
            <div class="stat-item">
              <span class="stat-num">{{ stats.users }}</span>
              <span class="stat-label">用户</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">{{ stats.posts }}</span>
              <span class="stat-label">帖子</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">{{ stats.comments }}</span>
              <span class="stat-label">评论</span>
            </div>
          </div>
        </div>
      </div>

      <div class="forum-body">
        <div class="forum-main">
          <div class="main-toolbar">
            <div class="forum-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索帖子、项目、作者..."
                class="search-input"
                @input="handleSearch"
              />
            </div>
            <div class="forum-filters">
              <div
                v-for="cat in categories"
                :key="cat"
                :class="['filter-chip', { active: activeCategory === cat }]"
                @click="activeCategory = cat; loadPosts()"
              >
                <span v-if="cat !== '全部'" class="chip-icon" v-html="CATEGORY_ICONS[cat]"></span>
                <span>{{ cat }}</span>
              </div>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>

          <div v-else-if="posts.length" class="post-list">
            <div v-for="post in posts" :key="post.id" class="post-card" @click="openPost(post)">
              <div class="post-avatar-col">
                <img v-if="post.author_avatar" :src="post.author_avatar" class="post-author-avatar" @error="post.author_avatar = ''"/>
                <span v-else class="post-author-initial">{{ (post.author_name || 'U').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="post-content-col">
                <div class="post-title-row">
                  <span :class="['post-category', getCategoryClass(post.category)]"><span class="cat-icon" v-html="CATEGORY_ICONS[post.category] || ''"></span> {{ post.category }}</span>
                  <h3 class="post-title">{{ post.title }}</h3>
                </div>
                <p v-if="post.project_name" class="post-project-name">📦 {{ post.project_name }}</p>
                <p class="post-excerpt">{{ post.content.slice(0, 120) }}{{ post.content.length > 120 ? '...' : '' }}</p>
                <div class="post-meta">
                  <span class="meta-author">{{ post.author_name }}</span>
                  <span class="meta-divider">·</span>
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {{ post.view_count }}
                  </span>
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {{ post.comment_count }}
                  </span>
                  <button class="meta-item like-btn" :class="{ liked: likedPosts[post.id] }" @click.stop="toggleLike(post.id)">
                    <svg viewBox="0 0 24 24" :fill="likedPosts[post.id] ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    {{ post.like_count || 0 }}
                  </button>
                  <button class="meta-item fav-btn" :class="{ favorited: favoritedPosts[post.id] }" @click.stop="toggleFavorite(post.id)">
                    <svg viewBox="0 0 24 24" :fill="favoritedPosts[post.id] ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  </button>
                  <span class="meta-time">{{ formatTime(post.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">📝</div>
            <p>暂无帖子</p>
            <span>管理员还未发布内容，敬请期待</span>
          </div>

          <div v-if="total > pageSize" class="pagination">
            <button class="page-btn" :disabled="page <= 1" @click="page--; loadPosts()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <template v-for="p in displayPages" :key="p">
              <span v-if="p === '...'" class="page-ellipsis">...</span>
              <button v-else :class="['page-num', { active: page === p }]" @click="page = p; loadPosts()">{{ p }}</button>
            </template>
            <button class="page-btn" :disabled="page * pageSize >= total" @click="page++; loadPosts()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <aside class="forum-sidebar">
          <div class="sidebar-card stats-card">
            <h4 class="sidebar-title">社区统计</h4>
            <div class="stats-grid">
              <div class="stats-grid-item">
                <span class="stats-grid-num">{{ stats.users }}</span>
                <span class="stats-grid-label">注册用户</span>
              </div>
              <div class="stats-grid-item">
                <span class="stats-grid-num">{{ stats.posts }}</span>
                <span class="stats-grid-label">帖子总数</span>
              </div>
              <div class="stats-grid-item">
                <span class="stats-grid-num">{{ stats.comments }}</span>
                <span class="stats-grid-label">评论总数</span>
              </div>
            </div>
          </div>

          <div class="sidebar-card category-card">
            <h4 class="sidebar-title">分类导航</h4>
            <div class="category-list">
              <div
                v-for="cat in categories.filter(c => c !== '全部')"
                :key="cat"
                :class="['category-item', { active: activeCategory === cat }]"
                @click="activeCategory = cat; loadPosts()"
              >
                <span class="category-icon" v-html="CATEGORY_ICONS[cat]"></span>
                <span class="category-name">{{ cat }}</span>
                <span class="category-arrow">›</span>
              </div>
            </div>
          </div>

          <div class="sidebar-card hot-card">
            <h4 class="sidebar-title">🔥 热门帖子</h4>
            <div v-if="hotPosts.length" class="hot-list">
              <div
                v-for="(post, idx) in hotPosts"
                :key="post.id"
                class="hot-item"
                @click="openPost(post)"
              >
                <span :class="['hot-rank', { top: idx < 3 }]">{{ idx + 1 }}</span>
                <span class="hot-title">{{ post.title }}</span>
              </div>
            </div>
            <div v-else class="hot-empty">暂无热门帖子</div>
          </div>
        </aside>
      </div>
    </div>

    <transition name="detail-slide">
      <div v-if="currentPost" class="detail-page">
        <div class="detail-topbar">
          <div class="topbar-inner">
            <button class="topbar-back" @click="currentPost = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>
              <span>返回列表</span>
            </button>
            <div class="topbar-actions">
              <span class="topbar-category" :class="getCategoryClass(currentPost.category)">
                <span class="cat-icon" v-html="CATEGORY_ICONS[currentPost.category] || ''"></span> {{ currentPost.category }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-scroll">
          <div class="detail-container">
            <article class="detail-article">
              <header class="article-header">
                <h1 class="article-title">{{ currentPost.title }}</h1>
                <div class="article-author-row">
                  <div class="author-info">
                    <img v-if="currentPost.author_avatar" :src="currentPost.author_avatar" class="author-avatar-lg"/>
                    <span v-else class="author-avatar-initial-lg">{{ (currentPost.author_name || 'U').charAt(0).toUpperCase() }}</span>
                    <div class="author-detail">
                      <span class="author-name-lg">{{ currentPost.author_name }}</span>
                      <div class="author-meta">
                        <span class="author-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {{ formatTime(currentPost.created_at) }}
                        </span>
                        <span class="author-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          {{ currentPost.view_count }} 阅读
                        </span>
                        <span class="author-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {{ currentPost.comments?.length || 0 }} 评论
                        </span>
                        <button class="author-meta-item like-btn" :class="{ liked: currentPost.has_liked }" @click.stop="toggleLike(currentPost.id)">
                          <svg viewBox="0 0 24 24" :fill="currentPost.has_liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                          {{ currentPost.like_count || 0 }} 点赞
                        </button>
                        <button class="author-meta-item fav-btn" :class="{ favorited: currentPost.has_favorited || favoritedPosts[currentPost.id] }" @click.stop="toggleFavorite(currentPost.id)">
                          <svg viewBox="0 0 24 24" :fill="(currentPost.has_favorited || favoritedPosts[currentPost.id]) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                          {{ (currentPost.has_favorited || favoritedPosts[currentPost.id]) ? '已收藏' : '收藏' }}
                        </button>
                        <button v-if="isAdmin" class="admin-edit-btn" @click="editCurrentPost">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          编辑
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <div class="article-content" v-html="renderContent(currentPost.content)"></div>

              <div v-if="currentPost.images?.length" class="article-images">
                <div class="images-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span>附件图片（{{ currentPost.images.length }}张）</span>
                </div>
                <div class="images-grid">
                  <div
                    v-for="(img, idx) in currentPost.images"
                    :key="idx"
                    class="article-img-wrap"
                    @click="viewImage(img)"
                  >
                    <img :src="img" class="article-image" @error="handleImageError($event)"/>
                    <div class="img-overlay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="currentPost.project_name || hasDownloadLinks(currentPost)" class="article-resource-section">
                <div class="resource-header">
                <div class="resource-header-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span class="resource-title">源码下载</span>
                  <span v-if="currentPost.project_name" class="resource-badge">{{ currentPost.project_name }}</span>
                  <span v-if="downloadStats[currentPost.id]?.total" class="resource-dl-count">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    总下载 {{ downloadStats[currentPost.id]?.total || 0 }}
                  </span>
                </div>
                  <span v-if="!isLoggedIn" class="download-login-hint" @click="$emit('openAuth', 'login')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    登录下载
                  </span>
                </div>
                <div v-if="hasDownloadLinks(currentPost)" class="download-grid">
                  <a v-if="currentPost.source_link_github" :href="isLoggedIn ? currentPost.source_link_github : undefined" target="_blank" class="dl-card dl-github" @click.prevent="handleDownloadClick(currentPost.source_link_github, $event)">
                    <div class="dl-card-left">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </div>
                    <div class="dl-card-body">
                      <span class="dl-card-name">GitHub</span>
                      <span class="dl-card-tip">在线预览源码</span>
                    </div>
                    <span class="dl-card-btn">前往</span>
                  </a>
                  <a v-if="currentPost.source_link_gitee" :href="isLoggedIn ? currentPost.source_link_gitee : undefined" target="_blank" class="dl-card dl-gitee" @click.prevent="handleDownloadClick(currentPost.source_link_gitee, $event)">
                    <div class="dl-card-left">
                      <svg viewBox="0 0 1024 1024" width="26" height="26"><path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z" fill="#C71D23"/></svg>
                    </div>
                    <div class="dl-card-body">
                      <span class="dl-card-name">Gitee</span>
                      <span class="dl-card-tip">在线预览源码</span>
                    </div>
                    <span class="dl-card-btn">前往</span>
                  </a>
                  <a v-if="currentPost.source_link_aliyun" :href="isLoggedIn ? currentPost.source_link_aliyun : undefined" target="_blank" class="dl-card dl-aliyun" @click.prevent="handleDownloadClick(currentPost.source_link_aliyun, $event)">
                    <div class="dl-card-left">
                      <svg viewBox="0 0 1025 1024" width="26" height="26"><path d="M250.654292 0h504.87239c37.895128 2.37587 77.096984 1.663109 113.566589 14.017633C933.716937 35.875638 986.580046 88.738747 1009.74478 152.768445c8.077958 20.432483 10.453828 42.409281 13.067285 64.029699 2.851044 112.616241 1.663109 225.351276 1.900696 337.967517-0.950348 83.511833 1.781903 167.142459-1.425522 250.654293-3.326218 90.639443-66.405568 175.101624-152.293271 203.968445-44.07239 15.205568-91.233411 12.235731-136.96891 14.611601H255.406032c-36.350812-2.138283-73.889559-3.682599-108.339675-17.106265C88.382367 986.223666 40.033411 938.468677 18.531787 880.141067 3.207425 839.87007 3.207425 795.916473 0.593968 753.625986V275.125754c2.257077-47.279814 2.732251-96.816705 22.333178-141.126682C45.141531 80.898376 90.401856 38.845476 143.977726 18.412993 177.833875 4.989327 214.541067 1.900696 250.654292 0z m237.230627 150.392575c-90.758237 2.613457-179.615777 44.547564-238.656149 113.685383-85.531323 97.173086-103.587935 242.932715-57.614849 362.082599 43.953596 122.119722 155.144316 216.798144 282.372158 241.744779 122.951276 26.134571 257.069142-13.304872 346.52065-101.330858 44.785151-44.07239 79.116473-98.954988 97.648259-159.064501 2.257077-6.177262-0.712761-12.948492-5.702088-16.749884-17.225058-8.434339-36.707193-10.216241-54.645011-16.512297-12.116937-4.39536-29.104408-3.326218-36.113225-16.27471-1.544316-11.998144 3.326218-23.521114 4.157772-35.400464 8.790719-69.375406-4.038979-142.07703-38.964269-203.018098-57.139675-106.79536-177.952668-175.101624-299.003248-169.161949z" fill="#6D80FB"/></svg>
                    </div>
                    <div class="dl-card-body">
                      <span class="dl-card-name">阿里云盘</span>
                      <span class="dl-card-tip">高速下载</span>
                    </div>
                    <span class="dl-card-btn">下载</span>
                  </a>
                  <a v-if="currentPost.source_link_baidu" :href="isLoggedIn ? currentPost.source_link_baidu : undefined" target="_blank" class="dl-card dl-baidu" @click.prevent="handleDownloadClick(currentPost.source_link_baidu, $event)">
                    <div class="dl-card-left">
                      <svg viewBox="0 0 1024 1024" width="26" height="26"><path d="M271.38 429.637a245.5 245.5 0 0 1-3.395-40.777c0-134.68 109.18-243.86 243.86-243.86s243.86 109.18 243.86 243.86a245.5 245.5 0 0 1-3.394 40.776C875.967 430.312 976 530.763 976 654.578c0 124.235-100.712 224.947-224.946 224.947-62.743 0-119.486-25.688-160.287-67.12l0.003-0.004c-21.44-21.822-21.322-56.893 0.354-78.57 21.796-21.795 57.133-21.795 78.928 0 0.693 0.694 1.365 1.4 2.014 2.12 20.427 19.87 48.317 32.108 79.065 32.108 62.631 0 113.404-50.772 113.404-113.403 0-62.631-50.773-113.403-113.404-113.403-28.739 0-54.981 10.69-74.967 28.311l-0.096-0.096-1.886 1.886c-2.2 2.033-4.32 4.152-6.353 6.353l-4.306 4.305 0.076 0.077-229.876 229.876-0.03-0.03c-40.833 41.708-97.767 67.59-160.747 67.59C148.712 879.525 48 778.813 48 654.578c0-123.711 99.866-224.098 223.38-224.94z m1.644 338.422c62.63 0 113.403-50.772 113.403-113.403 0-62.631-50.772-113.403-113.403-113.403-62.631 0-113.404 50.772-113.404 113.403 0 62.63 50.773 113.403 113.404 113.403zM511.845 521.1c73.034 0 132.24-59.206 132.24-132.24 0-73.033-59.206-132.239-132.24-132.239s-132.24 59.206-132.24 132.24c0 73.033 59.206 132.239 132.24 132.239z" fill="#06A7FF"/></svg>
                    </div>
                    <div class="dl-card-body">
                      <span class="dl-card-name">百度网盘</span>
                      <span class="dl-card-tip">备用下载</span>
                    </div>
                    <span class="dl-card-btn">下载</span>
                  </a>
                  <a v-if="currentPost.source_link_tencent" :href="isLoggedIn ? currentPost.source_link_tencent : undefined" target="_blank" class="dl-card dl-tencent" @click.prevent="handleDownloadClick(currentPost.source_link_tencent, $event)">
                    <div class="dl-card-left">
                      <svg viewBox="0 0 1024 1024" width="26" height="26"><path d="M887.36 749.312c-18.176 18.048-50.752 38.528-104.128 40.32-24.704 0.896-53.504 0.96-66.688 0.96H429.696l205.696-199.808c9.472-9.216 30.72-29.568 49.152-46.08 40.32-36.288 76.544-43.584 102.208-43.328 40.192 0.384 76.8 16.768 102.848 43.264 55.936 57.152 54.592 148.48-2.24 204.672m68.736-269.696A236.16 236.16 0 0 0 787.2 408.32c-57.472 0-106.88 19.776-150.08 54.912-18.816 15.36-38.528 33.664-63.36 57.728-12.288 12.032-369.792 358.912-369.792 358.912 18.752 2.624 44.48 3.456 67.456 3.584 21.568 0.128 432.32 0.128 449.472 0.128 34.624 0 57.152-0.064 81.28-1.856 55.552-4.032 107.968-24.384 150.336-65.984a237.504 237.504 0 0 0 3.648-336.192z" fill="#00A3FF"/></svg>
                    </div>
                    <div class="dl-card-body">
                      <span class="dl-card-name">腾讯微云</span>
                      <span class="dl-card-tip">备用下载</span>
                    </div>
                    <span class="dl-card-btn">下载</span>
                  </a>
                  <a v-if="currentPost.source_link_local" :href="isLoggedIn ? currentPost.source_link_local : undefined" class="dl-card dl-local" @click.prevent="handleDownloadClick(currentPost.source_link_local, $event)">
                    <div class="dl-card-left">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <div class="dl-card-body">
                      <span class="dl-card-name">本站下载</span>
                      <span class="dl-card-tip">服务器直连下载</span>
                    </div>
                    <span class="dl-card-btn">下载</span>
                  </a>
                </div>
              </div>

              <div class="article-divider">
                <span>评论区</span>
              </div>

              <div class="article-comment-section">
                <div v-if="isLoggedIn" class="comment-form">
                  <div class="comment-form-header">
                    <div class="comment-form-avatar">
                      <span class="comment-form-initial">✎</span>
                    </div>
                    <span class="comment-form-label">发表评论</span>
                  </div>
                  <textarea v-model="commentText" placeholder="写下你的评论，参与讨论..." rows="4"></textarea>
                  <div v-if="commentImages.length" class="image-preview-list">
                    <div v-for="(img, idx) in commentImages" :key="idx" class="preview-item">
                      <img :src="getImageUrl(img)" class="preview-image"/>
                      <button class="remove-image" @click="removeImage(idx)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                  <div v-if="showCommentLinks" class="comment-link-section">
                    <div v-for="sl in sourceLinkOptions" :key="sl.key" class="comment-link-row">
                      <label class="comment-link-label">{{ sl.label }}</label>
                      <input
                        v-model="commentSourceLinks[sl.key]"
                        type="url"
                        :placeholder="sl.placeholder"
                        class="comment-link-input"
                      />
                    </div>
                  </div>
                  <div class="comment-form-footer">
                    <div class="comment-form-footer-left">
                      <label class="btn-upload" :class="{ uploading }">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span>{{ uploading ? '上传中...' : '添加图片' }}</span>
                        <input type="file" accept="image/*" multiple @change="handleImageUpload" :disabled="uploading"/>
                      </label>
                      <button class="btn-link-toggle" :class="{ active: showCommentLinks }" @click="showCommentLinks = !showCommentLinks">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        <span>源码链接</span>
                      </button>
                    </div>
                    <button class="btn-comment" :disabled="!commentText.trim() || submittingComment" @click="submitComment">
                      {{ submittingComment ? '提交中...' : '发表评论' }}
                    </button>
                  </div>
                </div>
                <div v-else class="login-prompt">
                  <div class="login-prompt-inner">
                    <span>登录后即可参与评论讨论</span>
                    <button class="btn-go-login" @click="$emit('openAuth', 'login')">去登录</button>
                  </div>
                </div>

                <div class="comment-list">
                  <div v-for="(comment, cidx) in currentPost.comments" :key="comment.id" class="comment-item" :class="{ 'comment-deleted': comment.is_deleted }">
                    <div class="comment-floor">#{{ cidx + 1 }}</div>
                    <div class="comment-avatar">
                      <img v-if="comment.user_avatar" :src="comment.user_avatar" class="avatar-img"/>
                      <span v-else>{{ (comment.user_name || 'U').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="comment-body">
                      <template v-if="comment.is_deleted">
                        <div class="comment-header">
                          <span class="comment-author">{{ comment.user_name }}</span>
                          <span class="comment-deleted-tag">已删除</span>
                          <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                        </div>
                        <p class="comment-text comment-text-deleted">该评论已被作者删除</p>
                      </template>
                      <template v-else>
                      <div class="comment-header">
                        <span class="comment-author">{{ comment.user_name }}</span>
                        <span v-if="comment.user_name === currentPost.author_name" class="comment-author-tag">作者</span>
                        <span v-if="comment.ip_region" class="comment-ip">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {{ comment.ip_region }}
                        </span>
                        <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                        <template v-if="isCommentOwner(comment) && !comment.is_deleted">
                          <button
                            v-if="pendingDeleteCommentId !== comment.id"
                            class="comment-delete"
                            @click="pendingDeleteCommentId = comment.id"
                          >删除</button>
                          <span v-else class="comment-delete-confirm">
                            <span class="confirm-text">确认删除？</span>
                            <button class="confirm-btn confirm-yes" @click="deleteComment(comment.id)">删除</button>
                            <button class="confirm-btn confirm-no" @click="pendingDeleteCommentId = null">取消</button>
                          </span>
                        </template>
                      </div>
                      <p class="comment-text">{{ comment.content }}</p>
                      <div v-if="comment.images?.length" class="comment-images">
                        <img
                          v-for="(img, idx) in comment.images"
                          :key="idx"
                          :src="img"
                          class="comment-image"
                          @click="viewImage(img)"
                        />
                      </div>
                      <div v-if="hasCommentSourceLinks(comment)" class="comment-source-links">
                        <a v-if="comment.source_link_github" :href="comment.source_link_github" target="_blank" class="comment-source-link link-github">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          GitHub
                        </a>
                        <a v-if="comment.source_link_gitee" :href="comment.source_link_gitee" target="_blank" class="comment-source-link link-gitee">🔗 Gitee</a>
                        <a v-if="comment.source_link_aliyun" :href="comment.source_link_aliyun" target="_blank" class="comment-source-link link-aliyun">☁️ 阿里云盘</a>
                        <a v-if="comment.source_link_baidu" :href="comment.source_link_baidu" target="_blank" class="comment-source-link link-baidu">☁️ 百度网盘</a>
                        <a v-if="comment.source_link_tencent" :href="comment.source_link_tencent" target="_blank" class="comment-source-link link-tencent">☁️ 腾讯微云</a>
                        <a v-if="comment.source_link_local" :href="comment.source_link_local" target="_blank" class="comment-source-link link-local">💾本站下载</a>
                      </div>
                      <div class="comment-actions">
                        <button class="comment-like-btn" :class="{ liked: comment.has_liked }" @click.stop="toggleCommentLike(comment.id)">
                          <svg viewBox="0 0 24 24" :fill="comment.has_liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                          {{ comment.like_count || 0 }}
                        </button>
                        <div class="comment-report-wrap">
                          <button class="comment-report-icon-btn" @click.stop="openReportDialog(comment)" title="举报此评论">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                          </button>
                          <div class="comment-report-tooltip">举报</div>
                        </div>
                      </div>
                      </template>
                    </div>
                  </div>
                  <div v-if="!currentPost.comments?.length" class="no-comments">
                    <div class="no-comments-icon">💬</div>
                    <p>暂无评论</p>
                    <span>来抢沙发，发表你的看法吧</span>
                  </div>
                </div>
              </div>
            </article>

            <aside class="detail-sidebar">
              <div class="sidebar-card author-card">
                <div class="author-card-top">
                  <img v-if="currentPost.author_avatar" :src="currentPost.author_avatar" class="author-card-avatar"/>
                  <span v-else class="author-card-initial">{{ (currentPost.author_name || 'U').charAt(0).toUpperCase() }}</span>
                  <div>
                    <div class="author-card-name">{{ currentPost.author_name }}</div>
                    <div class="author-card-label">帖子作者</div>
                  </div>
                </div>
              </div>

              <div class="sidebar-card article-info-card">
                <h4 class="sidebar-title">帖子信息</h4>
                <div class="info-list">
                  <div class="info-row">
                    <span class="info-label">分类</span>
                    <span :class="['info-value', 'cat-text', getCategoryClass(currentPost.category)]">{{ currentPost.category }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">发布时间</span>
                    <span class="info-value">{{ formatTime(currentPost.created_at) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">阅读数</span>
                    <span class="info-value">{{ currentPost.view_count }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">评论数</span>
                    <span class="info-value">{{ currentPost.comments?.length || 0 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">点赞数</span>
                    <span class="info-value">{{ currentPost.like_count || 0 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">下载数</span>
                    <span class="info-value">{{ downloadStats[currentPost.id]?.total || 0 }}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="showReportDialog" class="report-dialog-overlay" @click.self="showReportDialog = false">
      <div class="report-dialog">
        <div class="report-dialog-header">
          <h3>举报评论</h3>
          <button class="report-dialog-close" @click="showReportDialog = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="report-dialog-body">
          <p class="report-dialog-tip">请选择举报原因：</p>
          <div class="report-reasons">
            <label v-for="reason in reportReasons" :key="reason.value" class="report-reason-item">
              <input type="radio" :value="reason.value" v-model="selectedReportReason"/>
              <span class="report-reason-text">{{ reason.label }}</span>
            </label>
          </div>
          <div class="report-reason-custom">
            <label class="report-reason-label">其他原因（选填）</label>
            <textarea v-model="reportCustomReason" class="report-custom-input" placeholder="请详细描述问题..." rows="3"></textarea>
          </div>
          <p v-if="reportError" class="report-error-msg">{{ reportError }}</p>
          <p v-if="reportSuccess" class="report-success-msg">{{ reportSuccess }}</p>
        </div>
        <div class="report-dialog-footer">
          <button class="report-dialog-cancel" @click="showReportDialog = false">取消</button>
          <button class="report-dialog-submit" @click="submitReport" :disabled="reportSubmitting || !selectedReportReason">
            {{ reportSubmitting ? '提交中...' : '提交举报' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import axios from 'axios'
import { getImageUrl, formatTime, renderContent, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS, SOURCE_LINKS } from '../constants'

const API_BASE = (import.meta.env.VITE_API_BASE || '/api') + '/forum'

const props = defineProps({
  isLoggedIn: Boolean,
  isAdmin: Boolean,
  userId: Number,
  token: String
})
const emit = defineEmits(['openAuth', 'download', 'edit'])

const posts = ref([])
const currentPost = ref(null)
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)
const activeCategory = ref('全部')
const searchQuery = ref('')
const commentText = ref('')
const submittingComment = ref(false)
const pendingDeleteCommentId = ref(null)
const commentImages = ref([])
const uploading = ref(false)
const stats = ref({ users: 0, posts: 0, comments: 0 })
const downloadStats = ref({})
const showCommentLinks = ref(false)
const likedPosts = ref({})
const favoritedPosts = ref({})
const commentSourceLinks = reactive({
  github: '',
  gitee: '',
  aliyun: '',
  baidu: '',
  tencent: ''
})
const sourceLinkOptions = SOURCE_LINKS
const showReportDialog = ref(false)
const selectedReportReason = ref('')
const reportCustomReason = ref('')
const reportSubmitting = ref(false)
const reportError = ref('')
const reportSuccess = ref('')
const reportingCommentId = ref(null)
const reportReasons = [
  { value: 'harassment', label: '🚫 骚扰辱骂' },
  { value: 'spam', label: '📢 垃圾广告' },
  { value: 'inappropriate', label: '⚠️ 不当内容' },
  { value: 'fake', label: '❌ 虚假信息' },
  { value: 'copyright', label: '©️ 侵犯版权' },
  { value: 'other', label: '📝 其他' }
]

const categories = computed(() => CATEGORIES)

function getCategoryClass(category) {
  const map = {
    '小程序': 'cat-miniapp',
    '安卓': 'cat-android',
    '鸿蒙': 'cat-harmony',
    '苹果': 'cat-apple',
    '网址': 'cat-web',
    'AI': 'cat-ai'
  }
  return map[category] || 'cat-default'
}

const hotPosts = computed(() => {
  return [...posts.value].sort((a, b) => b.view_count - a.view_count).slice(0, 5)
})

const totalPages = computed(() => Math.ceil(total.value / pageSize))

const displayPages = computed(() => {
  const t = totalPages.value
  const p = page.value
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (p > 3) pages.push('...')
  for (let i = Math.max(2, p - 1); i <= Math.min(t - 1, p + 1); i++) pages.push(i)
  if (p < t - 2) pages.push('...')
  pages.push(t)
  return pages
})

let searchTimer = null
function handleSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadPosts()
  }, 300)
}

function getHeaders() {
  return props.token ? { Authorization: `Bearer ${props.token}` } : {}
}

async function loadPosts() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (activeCategory.value !== '全部') params.category = activeCategory.value
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    const res = await axios.get(`${API_BASE}/posts`, { params })
    if (res.data.success) {
      posts.value = res.data.posts.map(post => ({
        ...post,
        author_avatar: getImageUrl(post.author_avatar)
      }))
      total.value = res.data.total
      loadLikedPosts()
      loadFavoritedPosts()
    }
  } catch (err) {
    console.error('加载帖子失败', err)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await axios.get(`${API_BASE}/stats`)
    if (res.data.success) stats.value = res.data.stats
  } catch (err) {
    console.error('加载统计失败', err)
  }
}

async function loadLikedPosts() {
  if (!props.token || posts.value.length === 0) return
  try {
    const postIds = posts.value.map(p => p.id)
    const res = await axios.get(`${API_BASE}/posts/likes/batch`, {
      headers: getHeaders(),
      params: { post_ids: JSON.stringify(postIds) }
    })
    if (res.data.success) {
      likedPosts.value = { ...likedPosts.value, ...res.data.likes }
    }
  } catch (err) {
    console.error('加载点赞状态失败', err)
  }
}

async function loadFavoritedPosts() {
  if (!props.token || posts.value.length === 0) return
  try {
    const postIds = posts.value.map(p => p.id)
    const res = await axios.get(`${API_BASE}/posts/favorites/batch`, {
      headers: getHeaders(),
      params: { post_ids: JSON.stringify(postIds) }
    })
    if (res.data.success) {
      favoritedPosts.value = { ...favoritedPosts.value, ...res.data.favorites }
    }
  } catch (err) {
    console.error('加载收藏状态失败', err)
  }
}

async function toggleFavorite(postId, event) {
  event?.stopPropagation()
  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }
  try {
    const res = await axios.post(`${API_BASE}/posts/${postId}/favorite`, {}, { headers: getHeaders() })
    if (res.data.success) {
      favoritedPosts.value[postId] = res.data.favorited
      if (currentPost.value && currentPost.value.id === postId) {
        currentPost.value.has_favorited = res.data.favorited
      }
    }
  } catch (err) {
    console.error('收藏操作失败', err)
  }
}

async function toggleLike(postId, event) {
  event?.stopPropagation()
  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }
  try {
    const res = await axios.post(`${API_BASE}/posts/${postId}/like`, {}, { headers: getHeaders() })
    if (res.data.success) {
      likedPosts.value[postId] = res.data.liked
      const post = posts.value.find(p => p.id === postId)
      if (post) post.like_count = res.data.like_count
      if (currentPost.value && currentPost.value.id === postId) {
        currentPost.value.like_count = res.data.like_count
        currentPost.value.has_liked = res.data.liked
      }
    }
  } catch (err) {
    console.error('点赞操作失败', err)
  }
}

async function toggleCommentLike(commentId) {
  if (!props.isLoggedIn) {
    emit('openAuth')
    return
  }
  try {
    const res = await axios.post(`${API_BASE}/comments/${commentId}/like`, {}, { headers: getHeaders() })
    if (res.data.success) {
      const comment = currentPost.value.comments.find(c => c.id === commentId)
      if (comment) {
        comment.has_liked = res.data.liked
        comment.like_count = res.data.like_count
      }
    }
  } catch (err) {
    console.error('评论点赞失败', err)
  }
}

function openReportDialog(comment) {
  if (!props.isLoggedIn) {
    emit('openAuth', 'login')
    return
  }
  reportingCommentId.value = comment.id
  showReportDialog.value = true
  selectedReportReason.value = ''
  reportCustomReason.value = ''
  reportError.value = ''
  reportSuccess.value = ''
}

async function submitReport() {
  if (!selectedReportReason.value) {
    reportError.value = '请选择举报原因'
    return
  }
  if (!reportingCommentId.value) return

  reportSubmitting.value = true
  reportError.value = ''
  reportSuccess.value = ''

  try {
    const res = await axios.post(
      `${API_BASE}/comments/${reportingCommentId.value}/report`,
      { reason: selectedReportReason.value, detail: reportCustomReason.value },
      { headers: getHeaders() }
    )
    if (res.data.success) {
      reportSuccess.value = res.data.message || '举报已提交，我们将尽快处理'
      setTimeout(() => {
        showReportDialog.value = false
      }, 1500)
    } else {
      reportError.value = res.data.message || '举报提交失败'
    }
  } catch (err) {
    reportError.value = err.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    reportSubmitting.value = false
  }
}

async function openPost(post) {
  try {
    const res = await axios.get(`${API_BASE}/posts/${post.id}`)
    if (res.data.success) {
      const p = res.data.post
      p.author_avatar = getImageUrl(p.author_avatar)
      if (Array.isArray(p.images)) p.images = p.images.map(getImageUrl)
      if (p.comments) {
        p.comments = p.comments.map(c => ({
          ...c,
          user_avatar: getImageUrl(c.user_avatar),
          images: Array.isArray(c.images) ? c.images.map(getImageUrl) : c.images
        }))
      }
      currentPost.value = p
      loadDownloadStats(p.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (err) {
    console.error('加载帖子详情失败', err)
  }
}

async function submitComment() {
  if (!commentText.value.trim()) return
  submittingComment.value = true
  try {
    const payload = { content: commentText.value, images: commentImages.value }
    SOURCE_LINKS.forEach(sl => {
      const val = commentSourceLinks[sl.key]
      if (val && val.trim()) payload['source_link_' + sl.key] = val.trim()
    })
    const res = await axios.post(
      `${API_BASE}/posts/${currentPost.value.id}/comments`,
      payload,
      { headers: getHeaders() }
    )
    if (res.data.success) {
      commentText.value = ''
      commentImages.value = []
      showCommentLinks.value = false
      Object.keys(commentSourceLinks).forEach(k => commentSourceLinks[k] = '')
      await openPost(currentPost.value)
    }
  } catch (err) {
    console.error('评论失败', err)
  } finally {
    submittingComment.value = false
  }
}

async function deleteComment(commentId) {
  try {
    const res = await axios.delete(`${API_BASE}/comments/${commentId}`, { headers: getHeaders() })
    if (res.data.success) {
      pendingDeleteCommentId.value = null
      await openPost(currentPost.value)
    }
  } catch (err) {
    console.error('删除评论失败', err)
  }
}

function isCommentOwner(comment) {
  return props.userId && comment.user_id === props.userId
}

async function uploadImages(endpoint, files) {
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) formData.append('images', files[i])
  const res = await axios.post(`${API_BASE}${endpoint}`, formData, { headers: getHeaders() })
  return res.data
}

async function handleImageUpload(event) {
  const files = event.target.files
  if (!files || files.length === 0) return
  uploading.value = true
  try {
    const res = await uploadImages('/comments/upload', files)
    if (res.success) commentImages.value = [...commentImages.value, ...res.urls]
  } catch (err) {
    console.error('上传失败', err)
    alert('图片上传失败，请重试')
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

function removeImage(index) { commentImages.value.splice(index, 1) }

function viewImage(url) {
  window.open(getImageUrl(url), '_blank')
}

function hasDownloadLinks(post) {
  return post.source_link_github || post.source_link_gitee ||
    post.source_link_aliyun || post.source_link_baidu || post.source_link_tencent || post.source_link_local
}

function hasCommentSourceLinks(comment) {
  return comment.source_link_github || comment.source_link_gitee ||
    comment.source_link_aliyun || comment.source_link_baidu || comment.source_link_tencent || comment.source_link_local
}

function handleDownloadClick(url, event) {
  if (!props.isLoggedIn) {
    event.preventDefault()
    emit('openAuth', 'login')
    return
  }
  const platform = getPlatformFromUrl(url)
  recordDownload(currentPost.value.id, platform)
  if (url) window.open(url, '_blank')
}

function editCurrentPost() {
  emit('edit', currentPost.value)
}

function getPlatformFromUrl(url) {
  if (!url) return ''
  if (url.includes('/api/forum/uploads/local/') || url.includes('/local/download/')) return 'local'
  if (url.includes('github.com')) return 'github'
  if (url.includes('gitee.com')) return 'gitee'
  if (url.includes('aliyun')) return 'aliyun'
  if (url.includes('baidu')) return 'baidu'
  if (url.includes('tencent') || url.includes('weiyun')) return 'tencent'
  return ''
}

async function recordDownload(postId, platform) {
  if (!postId || !platform) return
  try {
    await axios.post(`${API_BASE}/downloads/record`, { post_id: postId, platform }, { headers: getHeaders() })
    await loadDownloadStats(postId)
  } catch (err) {
    console.error('记录下载失败', err)
  }
}

async function loadDownloadStats(postId) {
  try {
    const res = await axios.get(`${API_BASE}/downloads/stats`, { params: { post_id: postId } })
    if (res.data.success) {
      downloadStats.value = { ...downloadStats.value, ...res.data.stats }
    }
  } catch (err) {
    console.error('加载下载统计失败', err)
  }
}

function getPlatformLabel(key) {
  const map = { github: 'GitHub', gitee: 'Gitee', aliyun: '阿里云盘', baidu: '百度网盘', tencent: '腾讯微云', local: '本站下载' }
  return map[key] || key
}

function handleOpenPost(e) {
  const { postId } = e.detail || {}
  if (postId) {
    const post = posts.value.find(p => p.id === postId)
    if (post) openPost(post)
  }
}

onMounted(() => {
  loadPosts()
  loadStats()
  window.addEventListener('limao-open-post', handleOpenPost)
})

onUnmounted(() => {
  window.removeEventListener('limao-open-post', handleOpenPost)
})
</script>

<style scoped>
.forum-page {
  min-height: 100vh;
  background: #f0f2f5;
}

.forum-list-view {
  min-height: 100vh;
}

.forum-banner {
  position: relative;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  padding: 68px 24px 32px;
  margin-bottom: 8px;
  overflow: hidden;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%),
    radial-gradient(circle at 60% 80%, rgba(255,255,255,0.06) 0%, transparent 40%);
  pointer-events: none;
}

.banner-content {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.banner-title {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.banner-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.75);
  letter-spacing: 2px;
}

.banner-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 16px 28px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(255,255,255,0.2);
}

.forum-body {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.forum-main {
  flex: 1;
  min-width: 0;
}

.forum-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
}

.main-toolbar {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.forum-search {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #c0c4cc;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  color: #1d2129;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.search-input::placeholder { color: #c0c4cc; }

.search-input:focus {
  border-color: #409eff;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.forum-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.25s;
  background: #f5f7fa;
  border: 1px solid transparent;
  user-select: none;
}

.filter-chip:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.06);
}

.filter-chip.active {
  color: #fff;
  background: linear-gradient(135deg, #409eff, #337ecc);
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.chip-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.chip-icon :deep(svg) {
  width: 13px;
  height: 13px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #c0c4cc;
  gap: 12px;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.post-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.post-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.post-card:last-child { border-bottom: none; }
.post-card:hover { background: #fafbfc; }

.post-avatar-col { flex-shrink: 0; }

.post-author-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.post-author-initial {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

.post-content-col {
  flex: 1;
  min-width: 0;
}

.post-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.post-category {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.cat-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.cat-icon :deep(svg) {
  width: 12px;
  height: 12px;
}

.post-category.cat-miniapp { background: rgba(7, 193, 96, 0.1); color: #07c160; }
.post-category.cat-android { background: rgba(61, 220, 132, 0.1); color: #2fa866; }
.post-category.cat-harmony { background: rgba(64, 158, 255, 0.1); color: #409eff; }
.post-category.cat-apple { background: rgba(29, 33, 41, 0.08); color: #4e5969; }
.post-category.cat-web { background: rgba(230, 162, 60, 0.1); color: #d48806; }
.post-category.cat-ai { background: rgba(45, 44, 44, 0.08); color: #2c2c2c; }
.post-category.cat-default { background: rgba(64, 158, 255, 0.08); color: #409eff; }

.post-project-name {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
  margin-bottom: 6px;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-card:hover .post-title { color: #409eff; }

.post-excerpt {
  font-size: 13px;
  color: #86909c;
  line-height: 1.7;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #c0c4cc;
}

.meta-author { color: #909399; font-weight: 500; }
.meta-divider { color: #dcdfe6; }
.meta-item { display: flex; align-items: center; gap: 3px; }
.meta-time { margin-left: auto; }
.like-btn { cursor: pointer; transition: all 0.2s; color: #909399; background: none; border: none; padding: 0; font-size: inherit; font-family: inherit; }
.like-btn:hover { color: #409eff; }
.like-btn.liked { color: #409eff; }
.fav-btn { cursor: pointer; transition: all 0.2s; color: #909399; background: none; border: none; padding: 0; font-size: inherit; font-family: inherit; }
.fav-btn:hover { color: #e6a23c; }
.fav-btn.favorited { color: #e6a23c; }

.empty-state {
  text-align: center;
  padding: 64px 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state p { font-size: 16px; color: #606266; margin-bottom: 6px; font-weight: 500; }
.empty-state span { font-size: 13px; color: #c0c4cc; }

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  padding: 8px 0;
}

.page-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) { border-color: #409eff; color: #409eff; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.page-num {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-num:hover { border-color: #409eff; color: #409eff; }

.page-num.active {
  background: linear-gradient(135deg, #409eff, #337ecc);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}

.page-ellipsis { width: 34px; text-align: center; color: #c0c4cc; font-size: 14px; }

.sidebar-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 700;
  color: #1d2129;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.stats-grid { display: flex; gap: 8px; }

.stats-grid-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
  background: #f8f9fb;
  border-radius: 8px;
}

.stats-grid-num { font-size: 18px; font-weight: 700; color: #409eff; }
.stats-grid-label { font-size: 11px; color: #909399; }

.category-list { display: flex; flex-direction: column; gap: 2px; }

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover { background: #f5f7fa; }
.category-item.active { background: rgba(64, 158, 255, 0.06); }
.category-item.active .category-name { color: #409eff; font-weight: 600; }
.category-item.active .category-arrow { color: #409eff; }
.category-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.category-icon :deep(svg) {
  width: 18px;
  height: 18px;
}
.category-name { flex: 1; font-size: 13px; color: #606266; }
.category-arrow { color: #c0c4cc; font-size: 16px; transition: color 0.2s; }

.hot-list { display: flex; flex-direction: column; gap: 4px; }

.hot-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.hot-item:hover { background: #f5f7fa; }

.hot-rank {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #c0c4cc;
  background: #f5f5f5;
  margin-top: 1px;
}

.hot-rank.top { background: linear-gradient(135deg, #409eff, #337ecc); color: #fff; }

.hot-title {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-item:hover .hot-title { color: #409eff; }
.hot-empty { text-align: center; padding: 20px 0; font-size: 13px; color: #c0c4cc; }

/* ===== Detail Page ===== */
.detail-page {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.detail-topbar {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  font-weight: 500;
  user-select: none;
}

.topbar-back:hover {
  background: rgba(64, 158, 255, 0.08);
  color: #409eff;
}

.topbar-back:active {
  background: rgba(64, 158, 255, 0.12);
}

.topbar-back svg {
  transition: transform 0.2s;
}

.topbar-back:hover svg {
  transform: translateX(-2px);
}

.topbar-category {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.topbar-category.cat-miniapp { background: rgba(7, 193, 96, 0.1); color: #07c160; }
.topbar-category.cat-android { background: rgba(61, 220, 132, 0.1); color: #2fa866; }
.topbar-category.cat-harmony { background: rgba(64, 158, 255, 0.1); color: #409eff; }
.topbar-category.cat-apple { background: rgba(29, 33, 41, 0.08); color: #4e5969; }
.topbar-category.cat-web { background: rgba(230, 162, 60, 0.1); color: #d48806; }
.topbar-category.cat-ai { background: rgba(45, 44, 44, 0.08); color: #2c2c2c; }
.topbar-category.cat-default { background: rgba(64, 158, 255, 0.08); color: #409eff; }

.detail-scroll {
  flex: 1;
  overflow-y: auto;
}

.detail-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.detail-article {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}

.article-header {
  padding: 28px 28px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.article-title {
  font-size: 22px;
  font-weight: 800;
  color: #1d2129;
  line-height: 1.5;
  margin-bottom: 16px;
  letter-spacing: -0.3px;
}

.article-author-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar-lg {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.author-avatar-initial-lg {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.author-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name-lg {
  font-size: 15px;
  font-weight: 700;
  color: #1d2129;
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.author-meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.admin-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 10px;
  background: rgba(64,158,255,0.08);
  border: 1px solid rgba(64,158,255,0.2);
  border-radius: 14px;
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
  margin-left: 4px;
  transition: all 0.2s;
}

.admin-edit-btn:hover {
  background: #409eff;
  color: #fff;
}

.article-resource-section {
  margin: 24px 28px 0;
  padding: 0;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  overflow: hidden;
}

.resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0f5ff 0%, #f7f8fa 100%);
  border-bottom: 1px solid #e8ecf1;
}

.resource-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
}

.resource-title {
  font-size: 15px;
  font-weight: 700;
  color: #1d2129;
}

.resource-badge {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.15);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #409eff;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-dl-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  background: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.2);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #67c23a;
  white-space: nowrap;
}

.download-login-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: rgba(245, 63, 63, 0.06);
  border: 1px solid rgba(245, 63, 63, 0.12);
  border-radius: 6px;
  font-size: 12px;
  color: #f56c6c;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.download-login-hint:hover {
  background: rgba(245, 63, 63, 0.1);
  border-color: rgba(245, 63, 63, 0.25);
}

.download-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
}

.dl-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: #fff;
  border-right: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.dl-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  transition: all 0.2s;
}

.dl-github::before { background: #24292e; }
.dl-gitee::before { background: #C71D23; }
.dl-aliyun::before { background: #6D80FB; }
.dl-baidu::before { background: #06A7FF; }
.dl-tencent::before { background: #00A3FF; }

.dl-local::before { background: #409eff; }

.dl-card:hover {
  background: #fafbfc;
  text-decoration: none;
}

.dl-github:hover { background: rgba(36,41,46,0.02); }
.dl-gitee:hover { background: rgba(199,29,35,0.02); }
.dl-aliyun:hover { background: rgba(109,128,251,0.02); }
.dl-baidu:hover { background: rgba(6,167,255,0.02); }
.dl-tencent:hover { background: rgba(0,163,255,0.02); }
.dl-local:hover { background: rgba(64,158,255,0.02); }

.dl-card:hover::before {
  top: 8px;
  bottom: 8px;
  width: 4px;
}

.dl-card-left {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.dl-github .dl-card-left { background: rgba(36,41,46,0.06); color: #24292e; }
.dl-gitee .dl-card-left { background: rgba(199,29,35,0.06); color: #C71D23; }
.dl-aliyun .dl-card-left { background: rgba(109,128,251,0.06); color: #6D80FB; }
.dl-baidu .dl-card-left { background: rgba(6,167,255,0.06); color: #06A7FF; }
.dl-tencent .dl-card-left { background: rgba(0,163,255,0.06); color: #00A3FF; }
.dl-local .dl-card-left { background: rgba(64,158,255,0.06); color: #409eff; }

.dl-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dl-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.dl-card-tip {
  font-size: 12px;
  color: #a0a4ad;
}

.dl-card-btn {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  transition: all 0.2s;
}

.dl-github .dl-card-btn { color: #24292e; background: rgba(36,41,46,0.06); }
.dl-gitee .dl-card-btn { color: #C71D23; background: rgba(199,29,35,0.06); }
.dl-aliyun .dl-card-btn { color: #6D80FB; background: rgba(109,128,251,0.06); }
.dl-baidu .dl-card-btn { color: #06A7FF; background: rgba(6,167,255,0.06); }
.dl-tencent .dl-card-btn { color: #00A3FF; background: rgba(0,163,255,0.06); }
.dl-local .dl-card-btn { color: #409eff; background: rgba(64,158,255,0.06); }

.dl-card:hover .dl-card-btn {
  color: #fff;
}

.dl-github:hover .dl-card-btn { background: #24292e; }
.dl-gitee:hover .dl-card-btn { background: #C71D23; }
.dl-aliyun:hover .dl-card-btn { background: #6D80FB; }
.dl-baidu:hover .dl-card-btn { background: #06A7FF; }
.dl-tencent:hover .dl-card-btn { background: #00A3FF; }
.dl-local:hover .dl-card-btn { background: #409eff; }

.article-content {
  padding: 24px 28px;
  font-size: 15px;
  color: #3d4a57;
  line-height: 1.9;
  word-break: break-word;
}

.article-content :deep(.content-h1) {
  font-size: 22px;
  font-weight: 800;
  color: #1d2129;
  margin: 24px 0 12px;
  line-height: 1.4;
}

.article-content :deep(.content-h2) {
  font-size: 19px;
  font-weight: 700;
  color: #1d2129;
  margin: 20px 0 10px;
  line-height: 1.4;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.article-content :deep(.content-h3) {
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
  margin: 16px 0 8px;
  line-height: 1.4;
}

.article-content :deep(.code-block) {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 12px 0;
  overflow-x: auto;
  line-height: 1.6;
}

.article-content :deep(.code-block code) {
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.article-content :deep(.inline-code) {
  background: #f0f2f5;
  color: #e83e8c;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.article-content :deep(.content-link) {
  color: #409eff;
  text-decoration: none;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
  transition: all 0.2s;
}

.article-content :deep(.content-link:hover) {
  color: #337ecc;
  border-bottom-color: #337ecc;
}

.article-content :deep(.content-divider) {
  border: none;
  height: 1px;
  background: #e8e8e8;
  margin: 20px 0;
}

.article-content :deep(strong) {
  font-weight: 700;
  color: #1d2129;
}

.article-content :deep(em) {
  font-style: italic;
  color: #4e5969;
}

.article-content :deep(p) {
  margin: 0 0 8px;
}

.article-content :deep(p:last-child) {
  margin-bottom: 0;
}

.article-images {
  padding: 0 28px 20px;
}

.images-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #86909c;
  font-weight: 500;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.article-img-wrap {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: all 0.25s;
}

.article-img-wrap:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.article-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.25s;
}

.article-img-wrap:hover .img-overlay {
  opacity: 1;
}

.article-divider {
  margin: 0 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 20px;
  color: #c0c4cc;
  font-size: 13px;
}

.article-divider::before,
.article-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #f0f0f0;
}

.article-comment-section {
  padding: 20px 28px 28px;
}

.comment-form {
  margin-bottom: 24px;
  background: #f8f9fb;
  border-radius: 10px;
  padding: 16px;
}

.comment-form-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.comment-form-avatar { flex-shrink: 0; }

.comment-form-initial {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.comment-form-label {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.comment-form textarea {
  width: 100%;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  color: #1d2129;
  font-size: 14px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s;
  min-height: 100px;
  line-height: 1.6;
}

.comment-form textarea:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.preview-image { width: 100%; height: 100%; object-fit: cover; }

.remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-image:hover { background: rgba(0, 0, 0, 0.8); }

.comment-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}

.btn-upload {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upload:hover:not(.uploading) { border-color: #409eff; color: #409eff; }
.btn-upload.uploading { opacity: 0.6; cursor: not-allowed; }
.btn-upload input { display: none; }

.btn-comment {
  padding: 8px 28px;
  background: linear-gradient(135deg, #409eff, #337ecc);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-comment:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transform: translateY(-1px);
}

.btn-comment:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-prompt {
  margin-bottom: 28px;
}

.login-prompt-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fb;
  border-radius: 10px;
  font-size: 13px;
  color: #909399;
}

.btn-go-login {
  padding: 6px 20px;
  background: linear-gradient(135deg, #409eff, #337ecc);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-go-login:hover {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.comment-list {
  display: flex;
  flex-direction: column;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
}

.comment-item:last-child { border-bottom: none; }

.comment-floor {
  position: absolute;
  top: 18px;
  right: 0;
  font-size: 11px;
  color: #dcdfe6;
  font-weight: 600;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.comment-avatar .avatar-img { width: 100%; height: 100%; object-fit: cover; }

.comment-body {
  flex: 1;
  min-width: 0;
  padding-right: 36px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 700;
  color: #1d2129;
}

.comment-author-tag {
  padding: 1px 8px;
  background: linear-gradient(135deg, #409eff, #337ecc);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.comment-ip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #b0b8c4;
}

.comment-time {
  font-size: 12px;
  color: #c0c4cc;
}

.comment-delete {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 12px;
  color: #f56c6c;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.comment-delete:hover { opacity: 1; }

.comment-delete-confirm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.comment-actions {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.comment-like-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}
.comment-like-btn:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.08);
}
.comment-like-btn.liked {
  color: #409eff;
}

.comment-report-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.comment-report-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: none;
  border: none;
  color: #c0c4cc;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  padding: 0;
}

.comment-report-icon-btn:hover {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.08);
}

.comment-report-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: #1d2129;
  color: #fff;
  font-size: 11px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.comment-report-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1d2129;
}

.comment-report-wrap:hover .comment-report-tooltip {
  opacity: 1;
}

/* Report Dialog */
.report-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.report-dialog {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  animation: dialogSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dialogSlideIn {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.report-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #f0f0f0;
}

.report-dialog-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.report-dialog-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: #f5f7fa;
  color: #86909c;
  cursor: pointer;
  transition: all 0.2s;
}

.report-dialog-close:hover {
  background: #e5e6eb;
  color: #4e5969;
}

.report-dialog-body {
  padding: 20px 22px;
}

.report-dialog-tip {
  font-size: 13px;
  color: #86909c;
  margin: 0 0 14px;
}

.report-reasons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.report-reason-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1.5px solid #e5e6eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.report-reason-item:hover {
  border-color: #409eff;
  background: #f5f8ff;
}

.report-reason-item input[type="radio"] {
  accent-color: #409eff;
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.report-reason-item input[type="radio"]:checked + .report-reason-text {
  color: #409eff;
  font-weight: 500;
}

.report-reason-text {
  font-size: 13px;
  color: #4e5969;
}

.report-reason-custom {
  margin-bottom: 12px;
}

.report-reason-label {
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 6px;
  display: block;
}

.report-custom-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.report-custom-input:focus {
  border-color: #409eff;
}

.report-error-msg {
  font-size: 12px;
  color: #f53f3f;
  margin: 8px 0 0;
}

.report-success-msg {
  font-size: 12px;
  color: #00b42a;
  margin: 8px 0 0;
}

.report-dialog-footer {
  display: flex;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid #f0f0f0;
  justify-content: flex-end;
}

.report-dialog-cancel {
  padding: 8px 20px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background: #fff;
  color: #4e5969;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.report-dialog-cancel:hover {
  background: #f5f7fa;
  border-color: #c9cdd4;
}

.report-dialog-submit {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff, #2563eb);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.report-dialog-submit:hover {
  background: linear-gradient(135deg, #3085e8, #1d4ed8);
}

.report-dialog-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-text {
  font-size: 12px;
  color: #86909c;
}

.confirm-btn {
  border: none;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.6;
}

.confirm-yes {
  background: #f53f3f;
  color: #fff;
}

.confirm-yes:hover {
  background: #cb2634;
}

.confirm-no {
  background: #409eff;
  color: #fff;
}

.confirm-no:hover {
  background: #1a6dd4;
}

.comment-deleted {
  opacity: 0.55;
}

.comment-deleted-tag {
  font-size: 11px;
  color: #f53f3f;
  background: #ffece8;
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: 6px;
}

.comment-text-deleted {
  color: #c9cdd4 !important;
  font-style: italic;
}

.comment-text {
  font-size: 14px;
  color: #4e5969;
  line-height: 1.8;
}

.comment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.comment-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: all 0.25s;
}

.comment-image:hover { transform: scale(1.05); }

.comment-source-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.comment-source-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.comment-source-link.link-github { background: rgba(36,41,46,0.06); color: #24292e; }
.comment-source-link.link-github:hover { background: #24292e; color: #fff; }
.comment-source-link.link-gitee { background: rgba(199,29,35,0.06); color: #C71D23; }
.comment-source-link.link-gitee:hover { background: #C71D23; color: #fff; }
.comment-source-link.link-aliyun { background: rgba(109,128,251,0.06); color: #6D80FB; }
.comment-source-link.link-aliyun:hover { background: #6D80FB; color: #fff; }
.comment-source-link.link-baidu { background: rgba(6,167,255,0.06); color: #06A7FF; }
.comment-source-link.link-baidu:hover { background: #06A7FF; color: #fff; }
.comment-source-link.link-tencent { background: rgba(0,163,255,0.06); color: #00A3FF; }
.comment-source-link.link-tencent:hover { background: #00A3FF; color: #fff; }
.comment-source-link.link-local { background: rgba(64,158,255,0.06); color: #409eff; }
.comment-source-link.link-local:hover { background: #409eff; color: #fff; }

.comment-link-section {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fb;
  border-radius: 8px;
  border: 1px solid #e8ecf1;
}

.comment-link-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.comment-link-row:last-child { margin-bottom: 0; }

.comment-link-label {
  font-size: 12px;
  color: #86909c;
  white-space: nowrap;
  min-width: 100px;
  font-weight: 500;
}

.comment-link-input {
  flex: 1;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  font-size: 13px;
  color: #1d2129;
  outline: none;
  transition: all 0.3s;
}

.comment-link-input:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.comment-link-input::placeholder { color: #c0c4cc; }

.comment-form-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-link-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-link-toggle:hover { border-color: #409eff; color: #409eff; }
.btn-link-toggle.active { border-color: #409eff; color: #409eff; background: rgba(64, 158, 255, 0.04); }

.no-comments {
  text-align: center;
  padding: 40px 0;
}

.no-comments-icon { font-size: 36px; margin-bottom: 8px; }
.no-comments p { font-size: 15px; color: #606266; margin-bottom: 4px; font-weight: 500; }
.no-comments span { font-size: 13px; color: #c0c4cc; }

/* Detail Sidebar */
.detail-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
}

.author-card {
  padding: 24px;
}

.author-card-top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.author-card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.author-card-initial {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.author-card-name {
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
}

.author-card-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.article-info-card {
  padding: 20px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}

.info-value.cat-text.cat-miniapp { color: #07c160; }
.info-value.cat-text.cat-android { color: #2fa866; }
.info-value.cat-text.cat-harmony { color: #409eff; }
.info-value.cat-text.cat-apple { color: #4e5969; }
.info-value.cat-text.cat-web { color: #d48806; }
.info-value.cat-text.cat-ai { color: #2c2c2c; }
.info-value.cat-text.cat-default { color: #409eff; }

/* Transitions */
.detail-slide-enter-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.detail-slide-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.detail-slide-enter-from { transform: translateX(100%); opacity: 0; }
.detail-slide-leave-to { transform: translateX(100%); opacity: 0; }

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .forum-body { flex-direction: column; }
  .forum-sidebar {
    width: 100%;
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .forum-sidebar .sidebar-card { flex: 1; min-width: 240px; }
  .banner-stats { display: none; }
  .detail-container { flex-direction: column; }
  .detail-sidebar { width: 100%; position: static; flex-direction: row; }
  .detail-sidebar .sidebar-card { flex: 1; }
}

@media (max-width: 768px) {
  .forum-banner { padding: 56px 16px 24px; }
  .banner-title { font-size: 22px; }
  .banner-desc { font-size: 12px; }
  .forum-body { padding: 16px 12px; gap: 16px; }
  .main-toolbar { padding: 16px; }
  .forum-search { margin-bottom: 12px; }
  .search-input { padding: 10px 14px 10px 36px; font-size: 13px; }
  .filter-chip { padding: 5px 12px; font-size: 12px; }
  .post-card { padding: 16px; gap: 12px; }
  .post-author-avatar, .post-author-initial { width: 36px; height: 36px; font-size: 14px; }
  .post-title { font-size: 15px; }
  .post-excerpt { font-size: 12px; }
  .post-meta { font-size: 11px; gap: 6px; }
  .forum-sidebar { flex-direction: column; }
  .forum-sidebar .sidebar-card { min-width: 0; }

  .article-header { padding: 24px 20px 20px; }
  .article-title { font-size: 20px; }
  .author-avatar-lg, .author-avatar-initial-lg { width: 40px; height: 40px; font-size: 17px; }
  .author-name-lg { font-size: 14px; }
  .article-resource-section { margin: 16px 20px 0; }
  .resource-header { padding: 14px 16px; }
  .download-grid { grid-template-columns: repeat(2, 1fr); }
  .dl-card { padding: 14px 16px; gap: 10px; }
  .dl-card-left { width: 36px; height: 36px; }
  .dl-card-btn { padding: 4px 10px; font-size: 11px; }
  .article-content { padding: 20px; font-size: 14px; }
  .article-images { padding: 0 20px 20px; }
  .images-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .article-divider { margin: 0 20px; }
  .article-comment-section { padding: 20px; }
  .comment-form { padding: 16px; }
  .comment-avatar { width: 34px; height: 34px; font-size: 13px; }
  .comment-text { font-size: 13px; }
  .comment-image { width: 100px; height: 100px; }
  .detail-sidebar { flex-direction: column; }
  .topbar-inner { padding: 0 16px; }
  .detail-container { padding: 16px; }
}

@media (max-width: 480px) {
  .forum-banner { padding: 48px 12px 20px; }
  .banner-title { font-size: 20px; }
  .forum-body { padding: 12px 10px; }
  .main-toolbar { padding: 14px; }
  .filter-chip { padding: 4px 10px; font-size: 11px; }
  .post-card { padding: 14px; gap: 10px; }
  .post-author-avatar, .post-author-initial { width: 32px; height: 32px; font-size: 13px; }
  .post-title { font-size: 14px; }
  .post-excerpt { font-size: 11px; }
  .post-category { font-size: 10px; padding: 1px 6px; }
  .page-num, .page-btn { width: 30px; height: 30px; font-size: 12px; }

  .article-header { padding: 20px 16px 16px; }
  .article-title { font-size: 18px; margin-bottom: 16px; }
  .author-avatar-lg, .author-avatar-initial-lg { width: 36px; height: 36px; font-size: 15px; }
  .author-meta { gap: 10px; font-size: 11px; flex-wrap: wrap; }
  .article-resource-section { margin: 14px 16px 0; }
  .resource-header { padding: 12px 14px; }
  .download-grid { grid-template-columns: 1fr; }
  .dl-card { padding: 12px 14px; gap: 10px; border-right: none !important; }
  .dl-card-left { width: 34px; height: 34px; }
  .dl-card-name { font-size: 13px; }
  .dl-card-btn { padding: 4px 10px; font-size: 11px; }
  .article-content { padding: 16px; font-size: 13px; line-height: 1.8; }
  .article-images { padding: 0 16px 16px; }
  .images-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
  .article-image { height: 140px; }
  .article-divider { margin: 0 16px; font-size: 12px; }
  .article-comment-section { padding: 16px; }
  .comment-form { padding: 14px; }
  .comment-form textarea { padding: 10px 12px; font-size: 13px; min-height: 80px; }
  .comment-item { gap: 10px; padding: 14px 0; }
  .comment-avatar { width: 30px; height: 30px; font-size: 12px; }
  .comment-author { font-size: 13px; }
  .comment-text { font-size: 12px; }
  .comment-image { width: 80px; height: 80px; }
  .btn-upload, .btn-comment { padding: 6px 14px; font-size: 12px; }
  .preview-item { width: 60px; height: 60px; }
  .detail-container { padding: 12px; }
  .topbar-inner { height: 48px; }
  .topbar-back { font-size: 13px; }
}
</style>
