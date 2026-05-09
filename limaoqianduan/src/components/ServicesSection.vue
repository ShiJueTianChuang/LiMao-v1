<template>
  <section id="services" class="section services-section">
    <div class="section-inner">
      <div class="section-header">
        <span class="section-tag">SERVICES</span>
        <h2 class="section-title">开发服务</h2>
        <p class="section-desc">专业团队，量身定制，从需求到上线全程服务</p>
      </div>
      <div class="service-grid">
        <div v-for="service in services" :key="service.name" class="service-card">
          <div class="service-icon-wrap" :style="{ background: service.bgColor }">
            <div class="service-brand-icon" v-html="service.icon"></div>
          </div>
          <h3 class="service-name">{{ service.name }}</h3>
          <p class="service-desc">{{ service.desc }}</p>
          <ul class="service-features">
            <li v-for="f in service.features" :key="f">{{ f }}</li>
          </ul>
        </div>
      </div>

      <div class="contact-section">
        <div class="contact-card">
          <div class="contact-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div class="contact-info">
            <h3 class="contact-title">定制开发服务</h3>
            <p class="contact-desc">专业团队，量身定制，从需求到上线全程服务</p>
            <div class="contact-details">
              <div class="contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>weizhiahao@163.com</span>
              </div>
              <div class="contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>18837029368</span>
              </div>
              <div class="contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>河南省郑州市金水区SOHO广场B座416</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="about" class="section about-section">
    <div class="section-inner">
      <div class="about-content">
        <div class="about-text">
          <span class="section-tag">ABOUT US</span>
          <h2 class="section-title">关于 LIMAO</h2>
          <p>LIMAO 致力于打造优质的开源生态，为开发者和企业提供高效的技术解决方案。我们相信开源的力量，坚持代码共享、技术共创的理念。</p>
          <div class="about-features">
            <div class="about-feature">
              <div class="feature-dot"></div>
              <span>专业开发团队，多年行业经验</span>
            </div>
            <div class="about-feature">
              <div class="feature-dot"></div>
              <span>开源项目持续维护更新</span>
            </div>
            <div class="about-feature">
              <div class="feature-dot"></div>
              <span>7 x 24小时技术支持</span>
            </div>
            <div class="about-feature">
              <div class="feature-dot"></div>
              <span>定制化开发，满足个性需求</span>
            </div>
          </div>
        </div>
        <div class="about-visual">
          <div class="tech-stack">
            <div v-for="(tech, i) in techStack" :key="tech" class="tech-item" :style="{ animationDelay: i * 0.1 + 's' }">
              {{ tech }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="brand-icon small">
          <svg viewBox="0 0 1024 1024" fill="#409eff"><ellipse cx="256" cy="300" rx="70" ry="55"/><ellipse cx="420" cy="240" rx="70" ry="55"/><ellipse cx="604" cy="240" rx="70" ry="55"/><ellipse cx="768" cy="300" rx="70" ry="55"/><path d="M370 440 Q370 360 512 360 Q654 360 654 440 L654 600 Q654 730 512 740 Q370 730 370 600 Z"/></svg>
        </div>
        <span>LIMAO SYSTEM</span>
      </div>
      <div class="footer-contact">
        <span class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          weizhiahao@163.com
        </span>
        <span class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          18837029368
        </span>
        <span class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          河南省郑州市金水区SOHO广场B座416
        </span>
      </div>
      <p class="footer-copy">&copy; 2026 LIMAO SYSTEM. All rights reserved.</p>
    </div>
  </footer>
</template>

<script setup>
const services = [
  {
    name: '小程序开发',
    desc: '微信/支付宝/抖音小程序定制开发',
    bgColor: 'rgba(7, 193, 96, 0.08)',
    icon: '<svg viewBox="0 0 1024 1024" width="24" height="24"><path d="M512 1C229.8 1 1 229.8 1 512s228.8 511 511 511 511-228.8 511-511S794.8 1 512 1z m298.3 456.3c-23.2 37.4-60 65.4-104 78.4-11.3 3.6-20.8 4.8-29.7 4.8-23.2 0-41-17.8-41-41s17.8-41 41-41c1.2 0 2.4 0 4.2-0.6h0.6c26.1-7.1 46.9-22.6 58.8-42.2 7.7-12.5 11.3-26.1 11.3-41 0-48.1-44.6-86.8-99.2-86.8-19 0-37.4 4.8-54.1 14.3-28.5 16-45.2 43.4-45.2 73.1v276.9c0 59.4-32.7 112.9-86.8 143.8-28.5 16-61.2 25-94.5 25C271.4 821 190 744.9 190 651.6c0-28.5 8.3-57 23.8-83.2C237 531 273.8 503 317.2 490c12.5-3.6 21.4-4.8 30.3-4.8 23.2 0 41 17.8 41 41s-17.8 41-41 41c-1.2 0-2.4 0-4.2 0.6-26.7 8.3-47.5 23.2-59.4 42.8-7.7 12.5-11.3 26.1-11.3 41 0 48.1 44.6 86.7 99.8 86.7 19 0 37.4-4.8 54.1-14.3 28.5-16 45.2-43.4 45.2-73.1V374.2c0-59.4 32.7-112.9 86.8-143.8 27.3-16.6 60-25.6 93.9-25.6 100.4 0 181.8 76.1 181.8 169.3-0.2 28-8.5 57.1-23.9 83.2z m0 0" fill="#2BA245"/></svg>',
    features: ['原生 & 跨平台开发', 'UI交互设计', '接口对接', '上线发布']
  },
  {
    name: '网站开发',
    desc: '企业官网/管理后台/电商平台',
    bgColor: 'rgba(64, 158, 255, 0.08)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    features: ['响应式设计', 'SEO优化', '高性能架构', '安全防护']
  },
  {
    name: 'APP开发',
    desc: 'iOS & Android原生/混合应用',
    bgColor: 'rgba(103, 194, 58, 0.08)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#45E18D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    features: ['React Native / Flutter', '推送通知', '离线缓存', '应用商店上架']
  },
  {
    name: '技术咨询',
    desc: '架构设计/代码审查/性能优化',
    bgColor: 'rgba(230, 162, 60, 0.08)',
    icon: '<svg viewBox="0 0 1024 1024" width="24" height="24"><path d="M865.8 741.5l-191.3-63.8V633c31.9-25.5 57.4-63.8 70.1-102 19.1-12.8 38.3-19.1 57.4-31.9h51c25.5 0 44.6-25.5 44.6-51V314.4c0-31.9-19.1-51-44.6-51C814.8 110.4 680.9 2 515.2 2S215.6 110.4 177.3 263.4c-25.5 0-44.6 25.5-44.6 51v133.9c0 25.5 19.1 51 44.6 51h51V352.6c0-159.4 127.5-286.9 286.9-286.9s286.9 127.5 286.9 286.9V410c-12.8 12.8-25.5 25.5-38.3 31.9v-89.3c0-140.2-108.4-248.6-248.6-248.6S266.6 212.4 266.6 352.6v95.6c0 76.5 31.9 146.6 89.3 191.3v44.7l-197.6 57.4C69 773.5 5.3 862.7 5.3 958.4v63.7h1013.6v-63.8c-0.1-102-57.5-184.9-153.1-216.8zM330.3 448.3v-95.6c0-102 82.9-184.9 184.9-184.9s184.9 82.9 184.9 184.9V442c0 12.8 0 31.9-6.4 44.6-31.9 12.8-57.4 19.1-89.3 19.1-12.8-25.5-31.9-31.9-57.4-31.9h-12.7c-38.3 0-63.8 25.5-63.8 63.8s25.5 63.8 63.8 63.8H547c25.5 0 44.6-12.8 57.4-31.9 19.1 0 38.3 0 51-6.4-31.9 38.3-82.9 63.8-140.3 63.8-101.9-0.1-184.8-76.6-184.8-178.6z m184.9 242.2c31.9 0 63.8-6.4 95.6-19.1-6.4 51-44.6 95.6-95.6 95.6s-89.3-38.3-95.6-95.6c31.8 12.7 63.7 19.1 95.6 19.1zM75.3 958.3c0-76.5 44.6-140.3 108.4-159.4L375 741.5c25.5 51 76.5 89.3 140.3 89.3 57.4 0 114.8-38.3 140.3-89.3l191.3 63.8c63.8 19.1 108.4 82.9 108.4 153h-880z" fill="#1296db"/></svg>',
    features: ['技术方案设计', '代码质量审查', '性能调优', '安全评估']
  }
]

const techStack = ['Vue.js', 'React', 'Node.js', 'TypeScript', 'Python', 'Go', 'MySQL', 'Redis', 'Docker', 'K8s', 'WeChat', 'Flutter']
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

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.service-card {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s;
}

.service-card:hover {
  border-color: #c9cdd4;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.service-icon-wrap {
  width: 44px;
  height: 44px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.service-brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-brand-icon :deep(svg) {
  width: 24px;
  height: 24px;
}
.service-name { font-size: 16px; font-weight: 600; color: #1d2129; margin-bottom: 6px; }
.service-desc { font-size: 13px; color: #86909c; line-height: 1.6; margin-bottom: 14px; }

.service-features { list-style: none; padding: 0; }
.service-features li {
  font-size: 12px;
  color: #86909c;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.service-features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #409eff;
  transform: translateY(-50%);
}

.contact-section {
  margin-top: 32px;
}

.contact-card {
  display: flex;
  align-items: flex-start;
  gap: 28px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  padding: 28px;
  transition: all 0.3s;
}

.contact-card:hover {
  border-color: #c9cdd4;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.contact-icon-wrap {
  width: 44px;
  height: 44px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #409eff;
}

.contact-info { flex: 1; }

.contact-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d2129;
  margin-bottom: 6px;
}

.contact-desc {
  font-size: 14px;
  color: #86909c;
  margin-bottom: 20px;
}

.contact-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4e5969;
}

.contact-item svg {
  color: #409eff;
  flex-shrink: 0;
}

.about-content { display: flex; gap: 60px; align-items: center; }
.about-text { flex: 1; }
.about-text p { font-size: 14px; color: #86909c; line-height: 1.8; margin-bottom: 28px; }

.about-features { display: flex; flex-direction: column; gap: 12px; }
.about-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #4e5969; }

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
}

.about-visual { flex-shrink: 0; }
.tech-stack { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

.tech-item {
  padding: 10px 16px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  text-align: center;
  font-size: 13px;
  color: #4e5969;
  animation: tech-float 3s ease-in-out infinite;
}

@keyframes tech-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.footer {
  border-top: 1px solid #e5e6eb;
  padding: 28px 24px;
  background: #fff;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  color: #86909c;
  letter-spacing: 2px;
}

.brand-icon.small { width: 22px; height: 22px; animation: paw-grab 2.5s ease-in-out infinite; transform-origin: center bottom; }
.brand-icon.small svg { width: 100%; height: 100%; }

@keyframes paw-grab {
  0%, 100% { transform: scale(1, 1); }
  15% { transform: scale(1.08, 0.92); }
  30% { transform: scale(0.92, 1.08); }
  40% { transform: scale(1.03, 0.97); }
  50% { transform: scale(1, 1); }
}
.footer-copy { font-size: 12px; color: #c9cdd4; }

.footer-contact {
  display: flex;
  gap: 24px;
  align-items: center;
}

.footer-contact-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #86909c;
}

.footer-contact-item svg {
  color: #409eff;
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .service-grid { grid-template-columns: repeat(2, 1fr); }
  .about-content { flex-direction: column; gap: 40px; }
}

@media (max-width: 768px) {
  .service-grid { grid-template-columns: 1fr; }
  .tech-stack { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .footer-inner { flex-direction: column; gap: 8px; text-align: center; padding: 20px 12px; }
  .footer-contact { flex-direction: column; gap: 8px; }
  .section { padding: 60px 16px; }
  .section-title { font-size: 24px; }
  .service-card { padding: 20px; }
  .contact-card { flex-direction: column; gap: 20px; padding: 24px; }
  .contact-details { flex-direction: column; gap: 12px; }
  .contact-title { font-size: 18px; }
}

@media (max-width: 480px) {
  .service-icon-wrap { width: 40px; height: 40px; }
  .service-brand-icon :deep(svg) { width: 20px; height: 20px; }
  .service-name { font-size: 15px; }
  .service-desc { font-size: 12px; }
  .service-features li { font-size: 11px; }
  .contact-card { padding: 20px; }
}
</style>
