<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import * as echarts from 'echarts'
import {
  FileText,
  Building2,
  FileCode2,
  CloudLightning,
  ChevronRight,
  Search,
  ChevronLeft
} from 'lucide-vue-next'

const userStore = useUserStore()

// 图表 DOM 引用
const trendChartRef = ref(null)
const doughnutChartRef = ref(null)
const companyChartRef = ref(null)
const barChartRef = ref(null)

// 图表实例列表
let chartInstances = []

// 日期与操作员计算
const currentDateString = ref(new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).replace(/\//g, '/'))
const operatorCode = ref(userStore.userInfo?.username || userStore.userInfo?.name || '未登录')

// 最新报告列表死数据（完美还原截图）
const recentReportsList = ref([
  {
    code: 'SQ2601862',
    name: '水性超薄型钢结构防火涂料',
    company: '广东粮',
    template: '广东粮模板',
    status: '已上传',
    time: '2026-06-30 12:04:10'
  },
  {
    code: 'SQ2606966',
    name: '一体化外墙涂料',
    company: '广东粮',
    template: '广东粮模板',
    status: '已上传',
    time: '2026-06-30 11:53:51'
  },
  {
    code: 'CTT2026TO01813',
    name: '一级东北圆粒大米',
    company: '中泉',
    template: '中泉模板',
    status: '已上传',
    time: '2026-06-30 11:38:57'
  },
  {
    code: 'CTT2026TO01814',
    name: '麦土注册菜籽油（非转基因）',
    company: '中泉',
    template: '中泉模板',
    status: '已上传',
    time: '2026-06-30 11:31:49'
  },
  {
    code: 'CTT2026OU01811',
    name: '甘肃丹棉免洗线衣',
    company: '中泉',
    template: '中泉模板',
    status: '已上传',
    time: '2026-06-30 10:09:44'
  }
])

// 初始化 14 天趋势折线图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  const myChart = echarts.init(trendChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#334155' }
    },
    legend: {
      data: ['新增报告', 'PDF附件'],
      right: '4%',
      top: '0%',
      icon: 'circle',
      textStyle: { color: '#64748b', fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['06/17', '06/18', '06/19', '06/20', '06/21', '06/22', '06/23', '06/24', '06/25', '06/26', '06/27', '06/28', '06/29', '06/30'],
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 18,
      interval: 3,
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' }
    },
    series: [
      {
        name: '新增报告',
        type: 'line',
        smooth: true,
        data: [0, 0, 0, 0, 0, 0, 0, 0.5, 0.8, 17, 1, 0.5, 15, 8],
        symbol: 'none',
        lineStyle: {
          color: '#0d9488', // 绿/蓝青色
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(13, 148, 136, 0.25)' },
            { offset: 1, color: 'rgba(13, 148, 136, 0)' }
          ])
        }
      }
    ]
  }
  myChart.setOption(option)
  chartInstances.push(myChart)
}

// 初始化附件业务环形饼图
const initDoughnutChart = () => {
  if (!doughnutChartRef.value) return
  const myChart = echarts.init(doughnutChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '附件覆盖率',
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: 42, name: '已上传', itemStyle: { color: '#10b981' } }, // 绿色
          { value: 0, name: '待补充', itemStyle: { color: '#f43f5e' } }    // 红色
        ]
      }
    ]
  }
  myChart.setOption(option)
  chartInstances.push(myChart)
}

// 初始化公司报告分布图
const initCompanyChart = () => {
  if (!companyChartRef.value) return
  const myChart = echarts.init(companyChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#64748b' }
    },
    series: [
      {
        name: '公司报告分布',
        type: 'pie',
        radius: '70%',
        center: ['40%', '50%'],
        roseType: false,
        label: { show: false },
        data: [
          { value: 9, name: '中泉', itemStyle: { color: '#3b82f6' } },
          { value: 9, name: '山东粮', itemStyle: { color: '#10b981' } },
          { value: 8, name: '粤港', itemStyle: { color: '#f59e0b' } },
          { value: 6, name: '安徽粮', itemStyle: { color: '#ef4444' } },
          { value: 4, name: '辽宁粮', itemStyle: { color: '#8b5cf6' } }
        ]
      }
    ]
  }
  myChart.setOption(option)
  chartInstances.push(myChart)
}

// 初始化模板使用柱状图
const initBarChart = () => {
  if (!barChartRef.value) return
  const myChart = echarts.init(barChartRef.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '3%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    yAxis: {
      type: 'category',
      data: ['辽中粮模板', '支前粮模板', '国粮模板', '山东粮模板', '中泉模板'],
      axisLabel: { color: '#64748b' }
    },
    series: [
      {
        name: '使用次数',
        type: 'bar',
        barWidth: '40%',
        data: [4, 6, 8, 9, 9],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#8b5cf6' }
          ]),
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  }
  myChart.setOption(option)
  chartInstances.push(myChart)
}

// 统一监听视口变化进行自适应 resize
const handleResize = () => {
  chartInstances.forEach(instance => instance?.resize())
}

onMounted(() => {
  // 初始化渲染所有图表
  initTrendChart()
  initDoughnutChart()
  initCompanyChart()
  initBarChart()

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(instance => instance?.dispose())
  chartInstances = []
})
</script>

<template>
  <div class="dashboard-container font-sans">

    <!-- 业务看板头部卡片 -->
    <header class="welcome-card">
      <div class="welcome-tag">
        <span class="tag-icon"></span>
        业务数据中心
      </div>
      <h1 class="welcome-title">报告系统仪表盘</h1>
      <p class="welcome-meta font-mono">{{ currentDateString }} - {{ operatorCode }}</p>
    </header>

    <!-- KPI 关键指标卡片行 -->
    <section class="kpi-grid">
      <!-- 报告总数 -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper is-blue">
          <FileText class="kpi-icon" />
        </div>
        <div class="kpi-info">
          <div class="kpi-label">报告总数</div>
          <div class="kpi-value font-mono">42</div>
          <div class="kpi-sub font-mono">今日新增 8 份</div>
        </div>
      </div>
      <!-- 公司数量 -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper is-green">
          <Building2 class="kpi-icon" />
        </div>
        <div class="kpi-info">
          <div class="kpi-label">公司数量</div>
          <div class="kpi-value font-mono">10</div>
          <div class="kpi-sub font-mono">近期新增 5 家公司</div>
        </div>
      </div>
      <!-- 报告模板 -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper is-orange">
          <FileCode2 class="kpi-icon" />
        </div>
        <div class="kpi-info">
          <div class="kpi-label">报告模板</div>
          <div class="kpi-value font-mono">10</div>
          <div class="kpi-sub font-mono">近期使用 5 类模板</div>
        </div>
      </div>
      <!-- PDF附件覆盖率 -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper is-red">
          <CloudLightning class="kpi-icon" />
        </div>
        <div class="kpi-info">
          <div class="kpi-label">PDF 附件覆盖率</div>
          <div class="kpi-value font-mono">100%</div>
          <div class="kpi-sub font-mono">最近 42/42 份</div>
        </div>
      </div>
    </section>

    <!-- 第一排图表：14天趋势折线图 & 附件概览圆环图 -->
    <section class="charts-row">
      <!-- 14天报告趋势 -->
      <div class="chart-panel is-double">
        <div class="panel-header">
          <h3 class="panel-title">14 天报告趋势</h3>
          <p class="panel-subtitle">按最近报告创建时间统计，PDF 由系统自动生成报告</p>
        </div>
        <div class="panel-body">
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 附件业务概览 -->
      <div class="chart-panel is-single">
        <div class="panel-header">
          <h3 class="panel-title">附件业务概览</h3>
        </div>
        <div class="panel-body has-sidebar">
          <div ref="doughnutChartRef" class="doughnut-container"></div>

          <div class="doughnut-sidebar">
            <div class="sidebar-item">
              <span class="item-bar is-blue"></span>
              <div class="item-text">
                <span class="item-val">8 份</span>
                <span class="item-lbl">今日新增</span>
              </div>
            </div>
            <div class="sidebar-item">
              <span class="item-bar is-red"></span>
              <div class="item-text">
                <span class="item-val">0 份</span>
                <span class="item-lbl">待补附件</span>
              </div>
            </div>
            <div class="sidebar-item">
              <span class="item-bar is-green"></span>
              <div class="item-text">
                <span class="item-val">中泉</span>
                <span class="item-lbl">高频公司</span>
              </div>
            </div>
            <div class="sidebar-item">
              <span class="item-bar is-orange"></span>
              <div class="item-text">
                <span class="item-val">中泉模板</span>
                <span class="item-lbl">高频模板</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 第二排图表：公司分布饼图 & 模板使用分布柱图 -->
    <section class="charts-row">
      <!-- 公司报告分布 -->
      <div class="chart-panel">
        <div class="panel-header">
          <h3 class="panel-title">公司报告分布</h3>
        </div>
        <div class="panel-body">
          <div ref="companyChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 模板使用分布 -->
      <div class="chart-panel">
        <div class="panel-header">
          <h3 class="panel-title">模板使用分布</h3>
        </div>
        <div class="panel-body">
          <div ref="barChartRef" class="chart-container"></div>
        </div>
      </div>
    </section>

    <!-- 第三排：最新报告列表 & 快捷入口 -->
    <section class="charts-row">
      <!-- 最新报告 -->
      <div class="chart-panel is-double">
        <div class="panel-header flex-header">
          <h3 class="panel-title">最新报告</h3>
          <button class="header-link-btn font-sans">
            报告列表
            <ChevronRight class="link-icon" />
          </button>
        </div>
        <div class="panel-body">
          <el-table :data="recentReportsList" stripe style="width: 100%" class="recent-table">
            <el-table-column prop="code" label="报告编号" width="140" />
            <el-table-column prop="name" label="报告名称" min-width="180" />
            <el-table-column prop="company" label="公司" width="100" />
            <el-table-column prop="template" label="模板" width="120" />
            <el-table-column label="PDF附件" width="100">
              <template #default="scope">
                <span class="status-tag">{{ scope.row.status }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="更新时间" width="160" />
          </el-table>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="chart-panel is-single">
        <div class="panel-header">
          <h3 class="panel-title">快捷入口</h3>
        </div>
        <div class="panel-body">
          <div class="quick-grid">
            <div class="quick-card">
              <div class="quick-icon-wrapper">
                <FileText class="quick-icon" />
              </div>
              <div class="quick-text">
                <span class="quick-title">报告列表</span>
                <span class="quick-desc">维护报告与 PDF</span>
              </div>
            </div>
            <div class="quick-card">
              <div class="quick-icon-wrapper">
                <Search class="quick-icon" />
              </div>
              <div class="quick-text">
                <span class="quick-title">报告查询</span>
                <span class="quick-desc">按编号或公司检索</span>
              </div>
            </div>
            <div class="quick-card">
              <div class="quick-icon-wrapper">
                <Building2 class="quick-icon" />
              </div>
              <div class="quick-text">
                <span class="quick-title">公司管理</span>
                <span class="quick-desc">企业档案与关系</span>
              </div>
            </div>
            <div class="quick-card">
              <div class="quick-icon-wrapper">
                <FileCode2 class="quick-icon" />
              </div>
              <div class="quick-text">
                <span class="quick-title">模板管理</span>
                <span class="quick-desc">报告模板配置</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* ----------------- Welcome Card ----------------- */
.welcome-card {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.welcome-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.tag-icon {
  width: 4px;
  height: 12px;
  background-color: #3b82f6;
  border-radius: 2px;
}

.welcome-title {
  margin: 0 0 6px 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.welcome-meta {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

/* ----------------- KPI Cards Grid ----------------- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.kpi-card {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  text-align: left;
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon {
  width: 24px;
  height: 24px;
}

/* KPI 色彩主题与截图一致 */
.kpi-icon-wrapper.is-blue {
  background-color: #eff6ff;
  color: #3b82f6;
}

.kpi-icon-wrapper.is-green {
  background-color: #f0fdf4;
  color: #10b981;
}

.kpi-icon-wrapper.is-orange {
  background-color: #fff7ed;
  color: #f97316;
}

.kpi-icon-wrapper.is-red {
  background-color: #fef2f2;
  color: #ef4444;
}

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 2px 0;
}

.kpi-sub {
  font-size: 11px;
  color: #94a3b8;
}

/* ----------------- Chart Panels ----------------- */
.charts-row {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.chart-panel {
  grid-column: span 6;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.chart-panel.is-double {
  grid-column: span 8;
}

.chart-panel.is-single {
  grid-column: span 4;
}

.panel-header {
  text-align: left;
  margin-bottom: 16px;
}

.flex-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
  /* 大厂科技蓝副标题 */
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-title::before {
  content: '■';
  font-size: 10px;
  color: #3b82f6;
}

.panel-subtitle {
  margin: 4px 0 0 0;
  font-size: 11px;
  color: #94a3b8;
}

.header-link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #3b82f6;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
}

.link-icon {
  width: 14px;
  height: 14px;
}

.panel-body {
  flex: 1;
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 280px;
}

/* 附件业务双栏布局 */
.panel-body.has-sidebar {
  display: flex;
  align-items: center;
}

.doughnut-container {
  width: 50%;
  height: 200px;
  overflow: hidden;
}

.doughnut-sidebar {
  width: 50%;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.sidebar-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.item-bar {
  width: 4px;
  height: 28px;
  border-radius: 2px;
  flex-shrink: 0;
}

.item-bar.is-blue {
  background-color: #3b82f6;
}

.item-bar.is-red {
  background-color: #ef4444;
}

.item-bar.is-green {
  background-color: #10b981;
}

.item-bar.is-orange {
  background-color: #f97316;
}

.item-text {
  display: flex;
  flex-direction: column;
}

.item-val {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.item-lbl {
  font-size: 11px;
  color: #94a3b8;
}

/* ----------------- Table element-plus overrides ----------------- */
.recent-table {
  font-size: 13px;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* ----------------- Quick Access Links ----------------- */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  height: 100%;
}

.quick-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.quick-card:hover {
  border-color: #cbd5e1;
  background-color: #f8fafc;
}

.quick-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-icon {
  width: 18px;
  height: 18px;
}

.quick-text {
  display: flex;
  flex-direction: column;
}

.quick-title {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.quick-desc {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* ----------------- Responsive Breakpoints ----------------- */
@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-panel.is-double,
  .chart-panel.is-single,
  .chart-panel {
    grid-column: span 12;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .panel-body.has-sidebar {
    flex-direction: column;
  }

  .doughnut-container {
    width: 100%;
  }

  .doughnut-sidebar {
    width: 100%;
    padding-left: 0;
    margin-top: 12px;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
