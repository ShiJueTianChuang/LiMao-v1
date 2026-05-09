<template>
  <div class="navbar">
    <div class="nav-inner">
      <div class="nav-left">
        <button
          type="button"
          :class="['product-btn', { active: productSidebarOpen }]"
          @click="$emit('toggleProductSidebar')"
        >
          <span class="product-btn-glow"></span>
          <span class="product-btn-icon-wrap">
            <svg class="product-icon" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="6" height="6" rx="1.5"/>
              <rect x="11" y="3" width="6" height="6" rx="1.5"/>
              <rect x="3" y="11" width="6" height="6" rx="1.5"/>
              <rect x="11" y="11" width="6" height="6" rx="1.5"/>
            </svg>
          </span>
          <span class="product-btn-text">
            <span class="product-btn-title">产品</span>
            <span class="product-btn-subtitle">{{ productSidebarOpen ? '收起面板' : '打开面板' }}</span>
          </span>
          <span :class="['product-btn-arrow', { active: productSidebarOpen }]">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <path d="M7 4l6 6-6 6" />
            </svg>
          </span>
        </button>
        <div class="nav-brand" @click="$emit('scrollToTop')">
          <div class="brand-icon">
          <svg viewBox="0 0 1024 1024" fill="currentColor"><path d="M578.35790073 232.33166444l0.66509063 1.66409133 0.66509063 -1.06450894c40.42859395 -58.9619676 98.82464311 -76.29799615 171.09479219 -49.31314936l2.69584615 0.99900071C814.03745134 208.04175394 845.64790794 255.38965602 851.47086284 315.08404216c1.96342761 20.06462883 0.66509062 41.39302083 -2.8286823 60.69247701l-0.86434487 4.59103602 1.66318149 -0.3320904a95.66296056 95.66296056 0 0 1 38.86367482 -0.20016408l2.66218218 0.5995824c40.72793022 9.31672785 75.66565964 49.57791182 87.84382394 98.49073303 13.50925537 54.13710357 -2.29642783 109.47155222 -48.34781262 149.06764557 -61.2574856 54.83585814 -94.63120575 136.65656309 -99.75449622 246.56028773a19.49780056 19.49780056 0 0 1 -20.43129303 18.56703764 19.49780056 19.49780056 0 0 1 -18.63345568 -20.33030117c5.55728259 -119.65262494 42.95703014 -211.29046793 112.93257103 -274.01188077 34.87131134 -29.94636526 46.31705708 -70.14113118 36.26882054 -110.46964306 -8.88455542 -35.7029021 -33.60663834 -64.25266803 -58.66263133 -69.9755409 -14.90676456 -3.46010898 -29.71344707 -0.56500859 -43.6548749 6.65545549a80.88903216 80.88903216 0 0 0 -9.58331 5.82295489l-1.66409134 1.23100906 -2.16268182 1.66318149 -0.39941832 0.26658216 -0.23291821 0.2329182 -0.36575435 0.2329182 -1.56400929 0.66509063 -4.65836391 1.89700952 -1.06450896 0.20016407 -1.29742713 0.16559028 -1.59767325 0.10008204 -3.19352684 -0.16650011 -5.85661886 -1.82968161 -6.38887334 -4.99136416 -3.72669115 -6.92112781 -0.79883662 -5.72287287 0.2329182 -2.99518242 0.33300024 -1.46392728 0.16650011 -0.66509061 1.86334557 -4.29260956 0.49950036 -0.99809087 0.2656723 -0.39941831 0.40032816 -0.53225448 0.16559027 -0.16650012 0.20016408 -0.33300023c9.48231812 -14.97318263 17.73453703 -53.57118513 14.44001834 -87.1441595 -4.49186382 -45.91854862 -27.38426511 -80.22394153 -73.20273168 -97.95847857 -69.11028619 -26.68551052 -115.79309764 -4.22619149 -147.73655449 72.40389506 -7.41971832 17.73544687 -33.44013821 15.20610083 -37.26691138 -3.6266091 -18.96645594 -93.79961497 -66.41534987 -130.66710808 -147.93671857 -117.32435279 -89.5734235 16.96936435 -119.45246085 69.20945839 -93.9315413 166.70301039 4.72387217 18.00111919 -16.2387655 31.67687469 -30.97902993 20.197465 -42.45752979 -33.07438386 -87.24424154 -35.20431157 -138.41982663 -5.92303695l-1.63042737 0.93167279 -1.46392726 1.130927c-47.8146483 36.60182077 -58.3296311 73.00347746 -41.72511124 118.55536188l0.79792679 2.1963458 1.3310911 3.3936909 0.69875459 1.69684547 1.43117314 3.39369091 0.76426282 1.66500116 1.53125517 3.42644503 1.63042738 3.3936909 1.73050941 3.46101882 1.79692749 3.46010898 1.92885381 3.56019104 1.99709158 3.59385497 2.16268183 3.66027305 2.26276388 3.76035511 2.39560005 3.85952731 2.52934602 3.95960932 2.66127237 4.05969138 2.79501836 4.22528166 2.96151847 4.32536368 3.12801858 4.52552778 3.26085475 4.65836392 3.460109 4.82486404 5.49086449 7.61988238L154.97903812 567.50003894l13.9414278 18.63345569c11.14731929 14.90676456 20.33030115 33.60663834 27.61718332 56.06686721l1.7305094 5.48995467c4.49186382 14.77392841 8.18580083 31.14462021 11.11365534 49.07932133l1.09817291 6.78738181 0.99809086 6.98754588 0.46583639 3.49377295 0.86434488 7.18770996 0.83250058 7.32054611 0.73241854 7.45338228 0.3320904 3.79310921 0.66600047 7.68630049 0.56591843 7.85189074c0.20016407 2.62942809 0.3320904 5.29161027 0.49859051 7.9865466l0.43308228 8.11847291 0.36575435 8.31863699 0.33300024 8.41871902 0.20016407 8.55155517 0.06550824 4.35811782 0.13283615 8.81813733 0.03366396 8.95097349v4.52461793l-0.03366396 9.18389169 -0.06641808 4.65836393 -0.13283616 9.38314592 -0.13283615 4.75844596 -0.2329182 9.64972808 -0.33300022 9.74890029a19.49780056 19.49780056 0 0 1 -20.26388309 18.73353773 19.49780056 19.49780056 0 0 1 -18.83361976 -20.13104692l0.33300024 -9.41680987 0.13374599 -4.65836393 0.20016407 -9.18298185 0.16559027 -9.05105552 0.06641809 -8.85089146v-17.3023646l-0.13283616 -8.4178092 -0.16650011 -8.25221889 -0.2329182 -8.11938275 -0.16650013 -3.99236345 -0.33300021 -7.85280061 -0.39941833 -7.71996442a793.35304023 793.35304023 0 0 0 -0.23291819 -3.82586335l-0.49859052 -7.45338227 -0.53225446 -7.32054613 -0.66600047 -7.18770995 -0.66509062 -6.98754589a606.25240077 606.25240077 0 0 0 -0.33300024 -3.49377295l-0.79883663 -6.75371784 -0.86434486 -6.6554555 -0.43308227 -3.22719078 -0.93167279 -6.38887334c-6.65454565 -43.12262042 -17.63536482 -75.29899545 -32.80871154 -96.3280512L125.46575511 593.22112256l-6.58812757 -8.91730953 -6.15595513 -8.41871903 -3.85952731 -5.32345455 -5.45720055 -7.71996443 -3.39369091 -4.89128213 -3.26085475 -4.75844596 -3.09435462 -4.65836392 -2.96151848 -4.45819986 -2.79501835 -4.35902764 -2.6621822 -4.25894561 -2.49568205 -4.19252753 -1.23100908 -2.02984569 -2.32918197 -4.05969137 -1.130927 -1.99618173 -2.16359171 -3.99327329 -1.06450892 -1.96251777 -1.99618174 -3.89410111 -1.92976365 -3.89228141 -1.83059145 -3.89319125 -1.76326353 -3.8595273a241.90192381 241.90192381 0 0 1 -0.83159074 -1.9634276l-1.66409133 -3.89319126a248.09154292 248.09154292 0 0 1 -0.76426283 -1.96251778l-1.56491914 -3.9932733c-24.12341037 -63.38741333 -8.25221891 -119.12128031 56.33344936 -167.36810103a19.56512849 19.56512849 0 0 1 1.76326352 -1.16459096c50.24391229 -29.61427487 98.89015134 -35.30439361 144.14269951 -16.8037741l1.56491912 0.66600048v-0.33300025C255.96454339 212.83295402 300.08616452 154.0383964 396.1812975 134.67252215l3.36093679 -0.66509063c87.24424154 -14.30809201 148.03589074 19.79804667 178.8147566 98.29147879z m-37.36699344 239.24065145c47.08222976 7.85189075 82.85245977 31.942547 112.26657059 63.81958577 43.18994833 46.84931156 65.38359504 99.88824222 65.21709493 158.75012778 -0.06641807 20.43038317 -4.724782 39.79625743 -17.96836505 56.56545772 -19.43138249 24.68932879 -48.34690277 33.37462997 -82.08637727 32.04353888 -29.38135669 -1.19825495 -56.00044913 -9.4168099 -76.69741448 -29.94727512 -5.62279082 -5.55637274 -12.54391865 -10.21473667 -19.29763649 -14.80668251a53.07168478 53.07168478 0 0 0 -46.75104918 -7.51980037c-8.48513709 2.49568208 -17.3023646 4.858528 -24.88858305 8.71805531 -25.48816543 12.91058283 -52.77325833 11.9780002 -80.25669566 4.32536368 -36.73465692 -10.31481871 -63.68674961 -30.44586562 -70.54145933 -64.65117651 -2.8951004 -14.37541992 -2.8951004 -30.31302947 1.26467303 -44.08795716 24.12341037 -79.72535103 80.09019553 -134.66038137 171.2612923 -160.28138295a149.20048173 149.20048173 0 0 1 68.47794966 -2.92785452z m262.49880713 6.58721774a63.55300361 63.55300361 0 1 1 63.52024949 110.03838049 63.55300361 63.55300361 0 0 1 -63.55391343 -110.03747065z m-582.29549052 -93.2000326a84.68214138 84.68214138 0 1 1 0 169.3651926 84.68214138 84.68214138 0 0 1 0 -169.3651926z m385.27945065 -68.54436776a84.68214138 84.68214138 0 1 1 161.11388355 52.37384004 84.68214138 84.68214138 0 0 1 -161.11388355 -52.34017608z m-254.0800881 -42.32469363a84.68214138 84.68214138 0 1 1 161.07930974 52.34017607 84.68214138 84.68214138 0 0 1 -161.07930974 -52.34017607z" fill="#409eff"/>
          </svg>
          </div>
          <span class="brand-text">LIMAO</span>
        </div>
        
      </div>
      <div class="nav-links">
        <span :class="['nav-link', { active: currentPage === 'home' }]" @click="$emit('navigate', 'home')">首页</span>
        <span :class="['nav-link', { active: currentPage === 'forum' }]" @click="$emit('navigate', 'forum')">社区论坛</span>
        <span :class="['nav-link', { active: currentPage === 'ai' }]" @click="navigateToAI">AI体验</span>
        <a v-if="currentPage === 'home'" href="#projects" class="nav-link">开源项目</a>
        <a v-if="currentPage === 'home'" href="#services" class="nav-link">开发服务</a>
        <a v-if="currentPage === 'home'" href="#about" class="nav-link">关于我们</a>
      </div>

      <div class="nav-search">
        <svg class="nav-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          :value="searchQuery"
          type="text"
          placeholder="搜索开源项目..."
          class="nav-search-input"
          @input="$emit('update:searchQuery', $event.target.value)"
          @focus="navSearchFocused = true"
          @blur="handleSearchBlur"
          @keydown.enter="$emit('navSearch')"
        />
        <div v-if="navSearchFocused && searchQuery" class="nav-search-dropdown">
          <div
            v-for="p in quickSearchResults"
            :key="p.name"
            class="dropdown-project"
            @mousedown.prevent="$emit('projectClick', p)"
          >
            <div class="dp-icon" :style="{ background: CATEGORY_COLORS[p.category] || '#409eff' }" v-html="CATEGORY_ICONS[p.category] || ''">
            </div>
            <div class="dp-info">
              <span class="dp-name">{{ p.name }}</span>
              <span class="dp-desc">{{ p.desc }}</span>
            </div>
          </div>
          <div v-if="!quickSearchResults.length" class="dropdown-empty">无匹配结果</div>
          <div class="dropdown-footer" @mousedown.prevent="$emit('scrollToProjects')">
            查看全部项目
          </div>
        </div>
      </div>

      <div class="nav-actions">
        <template v-if="!isLoggedIn">
          <button class="btn-login" @click="$emit('openAuth', 'login')">登录</button>
          <button class="btn-register" @click="$emit('openAuth', 'register')">注册</button>
        </template>
        <template v-else>
          <div class="user-menu" @click="showUserDropdown = !showUserDropdown">
            <div class="user-avatar">
              <img v-if="userAvatar && !avatarError" :src="userAvatar" class="avatar-img" @error="avatarError = true"/>
              <span v-else>{{ (nickname || userEmail).charAt(0).toUpperCase() }}</span>
            </div>
            <span class="user-name">{{ nickname || userEmail.split('@')[0] }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <div v-if="showUserDropdown" class="dropdown-menu">
              <div class="dropdown-item" @click.stop="$emit('editProfile'); showUserDropdown = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                个人中心
              </div>
              <div class="dropdown-item" @click.stop="$emit('openAuth', 'reset'); showUserDropdown = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                修改密码
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item logout" @click.stop="$emit('logout'); showUserDropdown = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                退出登录
              </div>
            </div>
          </div>
          <slot name="extra-actions"></slot>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants'

const props = defineProps({
  currentPage: String,
  isLoggedIn: Boolean,
  userEmail: String,
  nickname: String,
  userAvatar: String,
  searchQuery: String,
  quickSearchResults: Array,
  productSidebarOpen: Boolean
})

const emit = defineEmits([
  'navigate', 'openAuth', 'logout', 'editProfile',
  'scrollToTop', 'scrollToProjects', 'navSearch',
  'projectClick', 'update:searchQuery', 'toggleProductSidebar'
])

const showUserDropdown = ref(false)
const navSearchFocused = ref(false)
const avatarError = ref(false)

function handleClickOutside(e) {
  if (showUserDropdown.value && !e.target.closest('.user-menu')) {
    showUserDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

function handleSearchBlur() {
  setTimeout(() => { navSearchFocused.value = false }, 150)
}

function navigateToAI() {
  if (!props.isLoggedIn) {
    emit('openAuth', 'login')
    return
  }
  emit('navigate', 'ai')
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #e5e6eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 8px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.brand-icon {
  width: 30px;
  height: 30px;
  color: #409eff;
  animation: paw-grab 2.5s ease-in-out infinite;
  transform-origin: center bottom;
}

.brand-icon svg {
  width: 100%;
  height: 100%;
}

@keyframes paw-grab {
  0%, 100% { transform: scale(1, 1); }
  15% { transform: scale(1.08, 0.92); }
  30% { transform: scale(0.92, 1.08); }
  40% { transform: scale(1.03, 0.97); }
  50% { transform: scale(1, 1); }
}

.brand-text {
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
  font-size: 17px;
  color: #1d2129;
  letter-spacing: 3px;
}

.product-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: inherit;
  color: #4e5969;
  cursor: pointer;
  padding: 7px 12px 7px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease, color 0.25s ease;
  border: 1px solid rgba(64, 158, 255, 0.12);
  margin-left: -70px;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(64, 158, 255, 0.08);
  outline: none;
}

.product-btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.14), rgba(64, 158, 255, 0));
  opacity: 0;
  transition: opacity 0.25s ease;
}

.product-btn-icon-wrap,
.product-btn-text,
.product-btn-arrow {
  position: relative;
  z-index: 1;
}

.product-btn-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.16), rgba(64, 158, 255, 0.05));
  color: #409eff;
  flex-shrink: 0;
}

.product-btn-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.product-btn-title {
  font-size: 13px;
  font-weight: 700;
  color: #1d2129;
}

.product-btn-subtitle {
  font-size: 10px;
  color: #86909c;
  margin-top: 3px;
}

.product-icon {
  transition: transform 0.25s ease, color 0.25s ease;
}

.product-btn:hover {
  color: #409eff;
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(64, 158, 255, 0.26);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(64, 158, 255, 0.14);
}

.product-btn:hover .product-btn-glow,
.product-btn.active .product-btn-glow {
  opacity: 1;
}

.product-btn:hover .product-icon {
  transform: rotate(12deg) scale(1.08);
}

.product-btn-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: transform 0.25s ease, color 0.25s ease;
}

.product-btn-arrow.active {
  transform: rotate(180deg);
  color: #409eff;
}

.product-btn.active {
  color: #409eff;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.12), rgba(64, 158, 255, 0.04));
  border-color: rgba(64, 158, 255, 0.3);
  box-shadow: 0 12px 30px rgba(64, 158, 255, 0.18);
}

.product-btn.active .product-btn-title,
.product-btn.active .product-btn-subtitle {
  color: #409eff;
}

.product-btn.active .product-icon {
  transform: scale(1.06);
}

.product-btn:active {
  transform: translateY(0) scale(0.98);
}

.nav-links {
  display: flex;
  gap: 28px;
  margin-left: 28px;
}

.nav-link {
  color: #86909c;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
  letter-spacing: 0.5px;
  cursor: pointer;
}

.nav-link:hover,
.nav-link.active {
  color: #409eff;
}

.nav-search {
  position: relative;
  flex: 1;
  max-width: 380px;
  margin: 0 32px 0 12px;
}

.nav-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #c0c4cc;
  pointer-events: none;
}

.nav-search-input {
  width: 100%;
  padding: 7px 14px 7px 36px;
  background: #f2f3f5;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  color: #1d2129;
  font-size: 13px;
  outline: none;
  transition: all 0.3s;
}

.nav-search-input::placeholder {
  color: #c9cdd4;
}

.nav-search-input:focus {
  border-color: #409eff;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

.nav-search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 300;
}

.dropdown-project {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-project:hover {
  background: #f2f3f5;
}

.dp-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.dp-icon :deep(svg) {
  width: 24px;
  height: 24px;
  display: block;
}

.dp-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.dp-name {
  font-size: 13px;
  color: #1d2129;
  font-weight: 600;
}

.dp-desc {
  font-size: 11px;
  color: #86909c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-empty {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: #c9cdd4;
}

.dropdown-footer {
  padding: 10px 12px;
  text-align: center;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  border-top: 1px solid #f2f3f5;
  margin-top: 4px;
  transition: color 0.2s;
}

.dropdown-footer:hover {
  color: #1a6dd4;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: -60px;
}

.btn-login {
  padding: 6px 18px;
  background: none;
  border: 1px solid #409eff;
  border-radius: 6px;
  color: #409eff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-login:hover {
  background: rgba(64, 158, 255, 0.06);
}

.btn-register {
  padding: 6px 18px;
  background: #409eff;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-register:hover {
  background: #1a6dd4;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  padding: 4px 10px;
  border-radius: 6px;
  transition: background 0.3s;
}

.user-menu:hover {
  background: #f2f3f5;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 13px;
  color: #1d2129;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  padding: 6px;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: #f2f3f5;
  color: #1d2129;
}

.dropdown-item.logout {
  color: #f53f3f;
}

.dropdown-item.logout:hover {
  background: rgba(245, 63, 63, 0.06);
}

.dropdown-divider {
  height: 1px;
  background: #f2f3f5;
  margin: 4px 8px;
}

@media (max-width: 1024px) {
  .nav-search { max-width: 240px; }
}

@media (max-width: 768px) {
  .nav-inner { padding: 0 12px; height: 56px; }
  .nav-links { display: none; }
  .nav-search { max-width: 160px; margin: 0 8px; }
  .nav-search-input { padding: 6px 10px 6px 32px; font-size: 12px; }
  .product-btn { margin-left: 0; padding: 6px 10px; gap: 8px; }
  .product-btn-subtitle, .product-btn-arrow { display: none; }
  .product-btn-icon-wrap { width: 28px; height: 28px; }
  .btn-login, .btn-register { padding: 5px 12px; font-size: 12px; }
  .user-avatar { width: 26px; height: 26px; font-size: 11px; }
  .user-name { display: none; }
  .dropdown-menu { right: -10px; min-width: 140px; }
  .nav-search-dropdown { max-height: 300px; overflow-y: auto; }
}

@media (max-width: 480px) {
  .nav-inner { padding: 0 10px; }
  .nav-search { max-width: 140px; margin: 0 6px; }
  .brand-text { font-size: 15px; }
  .brand-icon { width: 26px; height: 26px; }
  .btn-login, .btn-register { padding: 5px 10px; font-size: 11px; }
}
</style>
