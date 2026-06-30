<script setup>
import LoginLeftBanner from '@/components/login/LoginLeftBanner.vue'
import LoginCard from '@/components/login/LoginCard.vue'
</script>

<template>
  <div class="login-view-wrapper tech-bg">
    <!-- 科技感网格与发光光斑 overlays（使用全局 style.css 中的类名） -->
    <div class="tech-grid"></div>
    <div class="tech-light-orb-1"></div>
    <div class="tech-light-orb-2"></div>

    <!-- 响应式主内容中心布局容器 -->
    <div class="login-container">
      
      <!-- 双栏格栅系统 -->
      <main class="login-main-grid">
        
        <!-- 左侧宣传 Banner（在 768px 宽度以下会自动隐藏） -->
        <section class="banner-section">
          <LoginLeftBanner />
        </section>

        <!-- 右侧表单卡片容器 -->
        <section class="card-section">
          <LoginCard />
        </section>

      </main>

    </div>
  </div>
</template>

<style scoped>
.login-view-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1280px; /* max-w-7xl */
  margin: 0 auto;
  padding: 32px 24px;
  box-sizing: border-box;
}

.login-main-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 48px;
  align-items: center;
  width: 100%;
}

.banner-section {
  grid-column: span 7 / span 7;
}

.card-section {
  grid-column: span 5 / span 5;
  display: flex;
  justify-content: flex-end;
}

/* 响应式断点：768px (md) 以下屏幕隐藏左栏，右栏居中平铺 */
@media (max-width: 768px) {
  .login-main-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  
  .banner-section {
    display: none; /* 在 md 屏以下隐藏左栏 Banner */
  }
  
  .card-section {
    grid-column: span 12 / span 12;
    justify-content: center;
  }
}

/* 针对平板等中等宽度的微调 */
@media (min-width: 769px) and (max-width: 1024px) {
  .login-main-grid {
    gap: 24px;
  }
  
  .banner-section {
    grid-column: span 6 / span 6;
  }
  
  .card-section {
    grid-column: span 6 / span 6;
  }
}
</style>
