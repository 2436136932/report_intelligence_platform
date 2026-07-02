<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Search, RotateCw, FileCode, FileText } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'

// 搜索表单数据
const queryParams = ref({
  code: '',
  name: '',
  company: ''
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)

// 公司下拉备选
const companyOptions = ['广东粮', '中泉', '安徽粮', '山东粮', '辽宁粮', '上海粮科']

// 当前选中的报告记录（右侧联动展示）
const selectedReport = ref(null)
const qrCanvasRef = ref(null)

const rawReportList = ref([])

// 检索数据缓存
const activeSearch = ref({
  code: '',
  name: '',
  company: ''
})

const handleQuery = () => {
  activeSearch.value = { ...queryParams.value }
  currentPage.value = 1
  
  // 检索后，重置默认选中第一行
  nextTick(() => {
    if (paginatedList.value.length > 0) {
      selectedReport.value = paginatedList.value[0]
    } else {
      selectedReport.value = null
    }
  })
}

const handleReset = () => {
  queryParams.value = {
    code: '',
    name: '',
    company: ''
  }
  activeSearch.value = {
    code: '',
    name: '',
    company: ''
  }
  currentPage.value = 1
  nextTick(() => {
    selectedReport.value = paginatedList.value[0]
  })
}

// 筛选后列表
const filteredList = computed(() => {
  return rawReportList.value.filter(item => {
    const matchCode = !activeSearch.value.code || item.code.toLowerCase().includes(activeSearch.value.code.toLowerCase())
    const matchName = !activeSearch.value.name || item.name.toLowerCase().includes(activeSearch.value.name.toLowerCase())
    const matchCompany = !activeSearch.value.company || item.company === activeSearch.value.company
    return matchCode && matchName && matchCompany
  })
})

// 分页切片
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

// 表格选中行联动
const handleCurrentRowChange = (val) => {
  if (val) {
    selectedReport.value = val
  }
}

// 二维码绘制 Canvas 逻辑
const drawQrCode = (row) => {
  if (!row || !qrCanvasRef.value) return
  const qrUrl = `${row.domain}/report?reportId=${row.code}`
  
  QRCode.toCanvas(qrCanvasRef.value, qrUrl, {
    width: 140,
    margin: 1,
    color: {
      dark: '#1e293b',
      light: '#ffffff'
    }
  }, (error) => {
    if (error) console.error('Error rendering dynamic QR code:', error)
  })
}

// 监听选中行数据改变重新绘制二维码
watch(selectedReport, (newVal) => {
  if (newVal) {
    nextTick(() => {
      drawQrCode(newVal)
    })
  }
})

// 挂载时渲染第一行
onMounted(() => {
  if (paginatedList.value.length > 0) {
    selectedReport.value = paginatedList.value[0]
  }
})
</script>

<template>
  <div class="report-query-container font-sans">
    
    <!-- 左右两栏布局 -->
    <div class="query-grid-layout">
      
      <!-- 左栏：列表及筛选 -->
      <div class="left-query-panel">
        <!-- 筛选栏 -->
        <div class="filter-panel">
          <el-form :inline="true" :model="queryParams" class="filter-form flex-form">
            <el-form-item label="报告ID">
              <el-input v-model="queryParams.code" placeholder="请输入ID查询" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item label="报告标题">
              <el-input v-model="queryParams.name" placeholder="请输入标题查询" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item label="公司">
              <el-select v-model="queryParams.company" placeholder="请选择" clearable style="width: 120px">
                <el-option v-for="item in companyOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item class="form-btn-item">
              <el-button type="primary" @click="handleQuery" class="search-btn">
                <Search class="btn-icon" />
                查询
              </el-button>
              <el-button @click="handleReset" class="reset-btn">
                <RotateCw class="btn-icon" />
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 数据表格，高亮选中行 -->
        <div class="table-wrapper">
          <el-table 
            :data="paginatedList" 
            stripe 
            highlight-current-row
            @current-change="handleCurrentRowChange"
            style="width: 100%" 
            class="data-table"
          >
            <el-table-column prop="code" label="报告ID" width="130" show-overflow-tooltip />
            <el-table-column prop="name" label="报告名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="company" label="公司" width="80" />
            <el-table-column prop="template" label="模板" width="100" show-overflow-tooltip />
            <el-table-column prop="time" label="更新时间" width="170" show-overflow-tooltip />
          </el-table>
        </div>

        <!-- 分页 -->
        <footer class="pagination-footer">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            :total="filteredList.length"
            class="pagination-bar"
          />
        </footer>
      </div>

      <!-- 右栏：明细卡片与动态生成的二维码 -->
      <div class="right-details-panel">
        <div class="details-card" v-if="selectedReport">
          
          <!-- 详情卡片顶部标题 -->
          <header class="details-header">
            <div class="title-row">
              <h3 class="details-title">{{ selectedReport.name }}</h3>
              <!-- 随选中行公司名动态变化的 tag 徽章 -->
              <span class="company-badge">{{ selectedReport.company }}防伪</span>
            </div>
            <p class="details-subtitle font-mono">#{{ selectedReport.code }} - {{ selectedReport.company }}</p>
          </header>

          <!-- 域名附件参数信息表 -->
          <div class="details-info-table">
            <div class="info-row">
              <span class="info-lbl">二维码跳转域名</span>
              <span class="info-val font-mono">{{ selectedReport.domain }}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">二维码详细网址</span>
              <span class="info-val font-mono url-text">
                {{ selectedReport.domain }}/report?reportId={{ selectedReport.code }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-lbl">PDF附件</span>
              <span class="info-val">
                <a href="javascript:;" class="pdf-link">
                  <FileCode class="pdf-icon" />
                  {{ selectedReport.attachment }}
                </a>
              </span>
            </div>
            <div class="info-row">
              <span class="info-lbl">备注</span>
              <span class="info-val">{{ selectedReport.remark || '-' }}</span>
            </div>
          </div>

          <!-- 动态二维码 Canvas 大容器 -->
          <div class="qr-canvas-wrapper">
            <canvas ref="qrCanvasRef" class="qr-canvas"></canvas>
          </div>

          <!-- 下沿报告内容属性框 -->
          <footer class="details-content-box">
            <h4 class="box-title">报告内容</h4>
            <div class="meta-grid">
              <div class="meta-row">
                <span class="meta-lbl">报告编号</span>
                <span class="meta-val font-mono">{{ selectedReport.code }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-lbl">产品名称</span>
                <span class="meta-val">{{ selectedReport.name }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-lbl">委托客户</span>
                <span class="meta-val">{{ selectedReport.client }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-lbl">受检客户</span>
                <span class="meta-val">{{ selectedReport.testedClient }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-lbl">报告发布日期</span>
                <span class="meta-val font-mono">{{ selectedReport.publishDate }}</span>
              </div>
            </div>
          </footer>

        </div>
        
        <!-- 空状态展示 -->
        <div class="empty-details" v-else>
          <FileText class="empty-icon" />
          <p>无选中报告，请在左侧列表中点击选择报告</p>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
.report-query-container {
  width: 100%;
}

.query-grid-layout {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  width: 100%;
}

/* ----------------- 左侧列表面板 ----------------- */
.left-query-panel {
  grid-column: span 7;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-panel {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 14px 16px 0 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
  text-align: left;
}

.flex-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-form :deep(.el-form-item) {
  margin-right: 12px;
  margin-bottom: 12px;
}

.filter-form :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.form-btn-item {
  margin-left: auto; /* 将按钮推至右侧对齐 */
}

.search-btn {
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  font-weight: 500;
  font-size: 12px;
}

.reset-btn {
  font-weight: 500;
  font-size: 12px;
  color: #475569 !important;
  border-color: #cbd5e1 !important;
}

.btn-icon {
  width: 13px;
  height: 13px;
  margin-right: 4px;
}

.table-wrapper {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
  overflow: hidden;
}

.data-table {
  font-size: 13px;
}

.data-table :deep(.el-table__row) {
  cursor: pointer;
}

/* 选中行高亮颜色优化 */
.data-table :deep(.current-row td.el-table__cell) {
  background-color: var(--el-color-primary-light-9) !important;
  color: var(--el-color-primary) !important;
  font-weight: 500;
}

.pagination-footer {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
}

/* ----------------- 右侧详情面板 ----------------- */
.right-details-panel {
  grid-column: span 5;
  height: 100%;
}

.details-card {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.details-header {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
  margin-bottom: 16px;
  text-align: left;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.details-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.company-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  background-color: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  border-radius: 4px;
  flex-shrink: 0;
}

.details-subtitle {
  margin: 4px 0 0 0;
  font-size: 11px;
  color: #64748b;
}

/* 详情元数据表格 */
.details-info-table {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  text-align: left;
}

.info-row:last-child {
  border-bottom: none;
}

.info-lbl {
  width: 110px;
  background-color: #f8fafc;
  padding: 10px 12px;
  color: #64748b;
  font-weight: 600;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.info-val {
  flex: 1;
  padding: 10px 12px;
  color: #1e293b;
  font-weight: 500;
  word-break: break-all;
}

.url-text {
  color: var(--el-color-primary);
}

.pdf-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.pdf-link:hover {
  text-decoration: underline;
}

.pdf-icon {
  width: 14px;
  height: 14px;
}

/* 二维码容器 */
.qr-canvas-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0 20px 0;
  border-bottom: 1px solid #f1f5f9;
}

.qr-canvas {
  width: 140px;
  height: 140px;
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: #ffffff;
}

/* 底侧报告内容卡片 */
.details-content-box {
  padding-top: 16px;
  text-align: left;
}

.box-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  position: relative;
  padding-left: 8px;
}

.box-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  background-color: var(--el-color-primary);
  border-radius: 1px;
}

.meta-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #f8fafc;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.meta-row {
  display: flex;
  font-size: 12px;
  line-height: 1.4;
}

.meta-lbl {
  color: #64748b;
  width: 90px;
  flex-shrink: 0;
  font-weight: 600;
}

.meta-val {
  color: #1e293b;
  font-weight: 500;
}

/* 空状态 */
.empty-details {
  height: 350px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 20px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

/* ----------------- 响应式适配 ----------------- */
@media (max-width: 1024px) {
  .left-query-panel,
  .right-details-panel {
    grid-column: span 12;
  }
}
</style>
