<script setup>
defineProps({
  index: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="feature-card">
    <!-- 亮蓝色高显序号 -->
    <div class="card-index">{{ index }}</div>
    <!-- 特性名称 -->
    <div class="card-title">{{ title }}</div>
    <!-- 特性说明 -->
    <div class="card-desc">{{ desc }}</div>
  </div>
</template>

<style scoped>
.feature-card {
  padding: 18px 20px;
  border-radius: 12px;
  background-color: rgba(15, 23, 42, 0.4); /* bg-slate-900/40 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 136, 255, 0.15); /* 蓝色微光边框 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}

/* 悬停时的外发光微动效 */
.feature-card:hover {
  border-color: rgba(0, 136, 255, 0.35);
  box-shadow: 
    0 8px 24px -10px rgba(0, 0, 0, 0.6),
    0 0 18px rgba(0, 136, 255, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.card-index {
  font-size: 18px;
  font-weight: 700;
  color: #00d2ff; /* 数字高亮为科技蓝 */
  margin-bottom: 6px;
  font-family: Consolas, Monaco, monospace;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 11px;
  color: #94a3b8; /* text-slate-400 */
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .feature-card {
    padding: 14px 16px;
  }
  .card-index {
    font-size: 16px;
  }
}
</style>
