<script setup>
import { ref } from 'vue'
import { FileText } from 'lucide-vue-next'
import LoginFeatureCard from '@/components/login/LoginFeatureCard.vue'

const features = ref([
  {
    index: '01',
    title: '统一管理',
    desc: '报告全生命周期归档'
  },
  {
    index: '02',
    title: '安全可靠',
    desc: '细粒度权限细致控制'
  },
  {
    index: '03',
    title: '高效协同',
    desc: '流程状态实时追踪'
  }
])
</script>

<template>
  <div class="left-banner">
    
    <!-- 顶部 Logo & 标题 -->
    <header class="logo-header">
      <div class="logo-container">
        <FileText class="logo-icon" />
      </div>
      <div class="title-container">
        <div class="sub-title font-mono">REPORT INTELLIGENCE PLATFORM</div>
        <h1 class="main-title">报告管理系统</h1>
      </div>
    </header>

    <!-- 中部核心标语 -->
    <section class="slogan-section">
      <div class="tag-line">
        <span class="line-decor"></span>
        企业级报告管理平台
      </div>
      <h2 class="slogan-title">
        让每一份报告
        <span class="gradient-text font-sans">更清晰、更高效</span>
      </h2>
      <p class="description-text font-sans">
        集中管理报告模板、审批流程与企业数据，构建安全、协同、可追溯的数字化报告工作台。
      </p>
    </section>

    <!-- 底部特性卡片栏 -->
    <section class="features-grid">
      <LoginFeatureCard 
        v-for="item in features" 
        :key="item.index"
        :index="item.index"
        :title="item.title"
        :desc="item.desc"
      />
    </section>

    <!-- 最底部状态灯与装饰 -->
    <footer class="footer-status font-mono">
      <span class="status-indicator">
        <span class="ping-dot"></span>
        <span class="core-dot"></span>
      </span>
      <span>SYSTEM ONLINE</span>
      <span class="divider">|</span>
      <span>SECURE ACCESS</span>
    </footer>

  </div>
</template>

<style scoped>
.left-banner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 16px 0;
  text-align: left;
}

.logo-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-container {
  padding: 10px;
  background-color: rgba(0, 136, 255, 0.1);
  border: 1px solid rgba(0, 136, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(0, 136, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #60a5fa; /* text-blue-400 */
}

.title-container {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.sub-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba(96, 165, 250, 0.9); /* text-blue-400/90 */
}

.main-title {
  margin: 2px 0 0 0;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.05em;
}

.slogan-section {
  margin: auto 0;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tag-line {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(96, 165, 250, 0.8); /* text-blue-400/80 */
  letter-spacing: 0.12em;
  font-weight: 600;
}

.line-decor {
  width: 24px;
  height: 2px;
  background-color: rgba(0, 136, 255, 0.5);
}

.slogan-title {
  margin: 0;
  font-size: 45px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  line-height: 1.15;
}

.gradient-text {
  display: block;
  margin-top: 12px;
  background: linear-gradient(to right, #00d2ff 0%, #0088ff 60%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.description-text {
  margin: 0;
  font-size: 14px;
  color: #94a3b8; /* text-slate-400 */
  max-w: 520px;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b; /* text-slate-500 */
  letter-spacing: 0.08em;
}

.status-indicator {
  position: relative;
  display: flex;
  width: 8px;
  height: 8px;
}

.ping-dot {
  position: absolute;
  display: inline-flex;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  background-color: #34d399; /* bg-emerald-400 */
  opacity: 0.75;
  animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.core-dot {
  position: relative;
  display: inline-flex;
  border-radius: 9999px;
  width: 8px;
  height: 8px;
  background-color: #10b981; /* bg-emerald-500 */
}

.divider {
  color: #1e293b; /* text-slate-800 */
}

@keyframes ping {
  75%, 100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

@media (max-width: 1024px) {
  .slogan-title {
    font-size: 36px;
  }
  .features-grid {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
