<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Plus, Search, RotateCw, FileCode, Edit, Trash2, QrCode, FileText } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import QRCode from 'qrcode'

// 搜索筛选表单数据
const queryParams = ref({
  code: '',
  name: '',
  company: ''
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)

// 公司下拉备选项
const companyOptions = ['广东粮', '中泉', '安徽粮', '山东粮', '辽宁粮', '上海粮科', '吉林粮']

// 二维码弹窗控制
const qrDialogVisible = ref(false)
const selectedRow = ref(null)
const qrCanvasRef = ref(null)

// 42 条高仿真完整模拟数据（支持真实的分页与检索！）
const rawReportList = ref([
  {
    code: 'SQ2601862',
    name: '水性超薄型钢结构防火涂料',
    company: '广东粮',
    template: '广东粮模板',
    attachment: '水性超薄型钢结构外墙防火涂料.pdf',
    domain: 'https://gqi.org.cn.gd6y.cn',
    remark: '',
    time: '2026-06-30 12:04:10'
  },
  {
    code: 'SQ2606966',
    name: '一体化外墙涂料',
    company: '广东粮',
    template: '广东粮模板',
    attachment: '一体化外墙涂料.pdf',
    domain: 'https://gqi.org.cn.gd6y.cn',
    remark: '',
    time: '2026-06-30 11:53:51'
  },
  {
    code: 'CTT2026TO01813',
    name: '一级东北圆粒大米',
    company: '中泉',
    template: '中泉模板',
    attachment: '一级东北圆粒大米.pdf',
    domain: 'https://www.cttlab.com.zd6y.cn',
    remark: '',
    time: '2026-06-30 11:38:57'
  },
  {
    code: 'CTT2026TO01814',
    name: '麦土注册菜籽油（非转基因）',
    company: '中泉',
    template: '中泉模板',
    attachment: '麦土注册菜籽油（非转基因）.pdf',
    domain: 'https://www.cttlab.com.zd6y.cn',
    remark: '',
    time: '2026-06-30 11:31:49'
  },
  {
    code: 'CTT2026BU01811',
    name: '甘肃丹棉免洗线衣',
    company: '中泉',
    template: '中泉模板',
    attachment: '甘肃丹棉免洗线衣.pdf',
    domain: 'https://www.cttlab.com.zd6y.cn',
    remark: '',
    time: '2026-06-30 10:09:44'
  },
  {
    code: 'CTT2026BU01812',
    name: '甘肃丹棉洁-油污净',
    company: '中泉',
    template: '中泉模板',
    attachment: '甘肃丹棉洁-油污净.pdf',
    domain: 'https://www.cttlab.com.zd6y.cn',
    remark: '',
    time: '2026-06-30 10:04:10'
  },
  {
    code: '(2026) 皖检 JZ 字第 00718 号',
    name: '安徽省源东建材-DRCP III 2000×2000 F 顶管',
    company: '安徽粮',
    template: '安徽粮模板',
    attachment: '安徽省源东建材-DRCP.pdf',
    domain: 'https://ahzjy.org.cn.ah6y.cn',
    remark: '',
    time: '2026-06-30 09:53:29'
  },
  {
    code: 'WK0629831-2026',
    name: '丙烯酸刻线漆',
    company: '山东粮',
    template: '山东院模板',
    attachment: '丙烯酸刻线漆.pdf',
    domain: 'https://sdzjy.com.cn.sd6y.cn',
    remark: '',
    time: '2026-06-30 09:41:02'
  },
  {
    code: '2020258301906110315',
    name: '外墙乳胶漆',
    company: '辽宁粮',
    template: '辽宁粮模板',
    attachment: '外墙乳胶漆.pdf',
    domain: 'https://llms.llecc.com.cn.ln6y.cn',
    remark: '',
    time: '2026-06-29 17:20:09'
  },
  {
    code: 'TT226-262251',
    name: '外墙透明防水胶',
    company: '上海粮科',
    template: '上海粮科模板',
    attachment: '外墙透明防水胶.pdf',
    domain: 'https://zy.jktac.com.jk6y.cn',
    remark: '',
    time: '2026-06-29 14:08:10'
  },
  // 额外追加模拟数据，用于填充至 42 条，供前端真实测试分页
  {
    code: 'SQ2609801',
    name: '防火密封胶',
    company: '广东粮',
    template: '广东粮模板',
    attachment: '防火密封胶.pdf',
    domain: 'https://gqi.org.cn.gd6y.cn',
    remark: '阻燃测试',
    time: '2026-06-29 10:44:00'
  },
  {
    code: 'SQ2601991',
    name: '高渗透环氧防水浆料',
    company: '广东粮',
    template: '广东粮模板',
    attachment: '环氧防水浆料.pdf',
    domain: 'https://gqi.org.cn.gd6y.cn',
    remark: '',
    time: '2026-06-28 16:32:00'
  },
  {
    code: 'CTT2026TO01902',
    name: '五常大米珍品装',
    company: '中泉',
    template: '中泉模板',
    attachment: '五常大米珍品装.pdf',
    domain: 'https://www.cttlab.com.zd6y.cn',
    remark: '',
    time: '2026-06-28 11:21:40'
  },
  {
    code: 'WK0629855-2026',
    name: '水性防腐底漆',
    company: '山东粮',
    template: '山东院模板',
    attachment: '水性防腐底漆.pdf',
    domain: 'https://sdzjy.com.cn.sd6y.cn',
    remark: '',
    time: '2026-06-27 15:30:12'
  }
])

// 生成更多 mock 数据，直至 42 条以供分页测试
const generateRemainingMockData = () => {
  const templates = ['吉林粮模板', '上海粮科模板', '中泉模板', '安徽粮模板']
  const names = ['一级压榨花生油', '特级初榨橄榄油', '精制小麦粉', '优质大豆分离蛋白', '聚氨酯防水涂料', '发泡聚苯乙烯保温板', '混凝土抗裂纤维', '彩色路面耐磨防滑漆']
  const count = 42 - rawReportList.value.length

  for (let i = 0; i < count; i++) {
    const comp = companyOptions[i % companyOptions.length]
    const codeNum = 202600100 + i
    rawReportList.value.push({
      code: `CTT2026QD${codeNum}`,
      name: names[i % names.length],
      company: comp,
      template: templates[i % templates.length],
      attachment: `${names[i % names.length]}.pdf`,
      domain: `https://${comp === '中泉' ? 'www.cttlab.com' : 'query.report'}.cn`,
      remark: '导入数据记录',
      time: `2026-06-${25 - Math.floor(i / 4)} 10:12:30`
    })
  }
}
generateRemainingMockData()

// 激活筛选和搜索
const activeSearch = ref({
  code: '',
  name: '',
  company: ''
})

const handleQuery = () => {
  activeSearch.value = { ...queryParams.value }
  currentPage.value = 1
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
}

// 过滤后的数据列表
const filteredList = computed(() => {
  return rawReportList.value.filter(item => {
    const matchCode = !activeSearch.value.code || item.code.toLowerCase().includes(activeSearch.value.code.toLowerCase())
    const matchName = !activeSearch.value.name || item.name.toLowerCase().includes(activeSearch.value.name.toLowerCase())
    const matchCompany = !activeSearch.value.company || item.company === activeSearch.value.company
    return matchCode && matchName && matchCompany
  })
})

// 分页切片数据
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

// 二维码查看
const showQrCode = (row) => {
  selectedRow.value = row
  qrDialogVisible.value = true

  nextTick(() => {
    if (!qrCanvasRef.value) return
    const qrUrl = `${row.domain}/report?reportId=${row.code}`
    QRCode.toCanvas(qrCanvasRef.value, qrUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }, (error) => {
      if (error) console.error('QR code generation error:', error)
    })
  })
}

// 删除确认
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除该报告信息（报告编号: ${row.code}）吗？`,
    '系统确认提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    rawReportList.value = rawReportList.value.filter(item => item.code !== row.code)
    ElMessage({
      type: 'success',
      message: '报告记录删除成功！'
    })
  }).catch(() => { })
}

// 编辑按钮占位
const handleEdit = (row) => {
  ElMessage.info(`触发编辑报告：${row.code}`)
}

// 新增报告按钮占位
const handleAdd = () => {
  ElMessage.success('触发新增报告信息录入')
}
</script>

<template>
  <div class="report-list-container">

    <!-- 顶部查询筛选面板 -->
    <div class="filter-panel">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="报告ID">
          <el-input v-model="queryParams.code" placeholder="请输入报告ID模糊查询" clearable />
        </el-form-item>
        <el-form-item label="报告标题">
          <el-input v-model="queryParams.name" placeholder="请输入报告标题模糊查询" clearable />
        </el-form-item>
        <el-form-item label="公司">
          <el-select v-model="queryParams.company" placeholder="请选择公司" clearable style="width: 200px">
            <el-option v-for="item in companyOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item>
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

    <!-- 表格操作动作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd" class="add-btn">
        <Plus class="btn-icon" />
        新增报告
      </el-button>
    </div>

    <!-- 报告信息数据表格 -->
    <div class="table-wrapper">
      <el-table :data="paginatedList" stripe style="width: 100%" class="data-table">
        <el-table-column prop="code" label="报告编号" min-width="140" />
        <el-table-column prop="name" label="报告名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="company" label="公司" width="100" />
        <el-table-column prop="template" label="模板" width="120" />
        <el-table-column label="PDF附件" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            <span class="attachment-link">
              <FileCode class="file-icon" />
              {{ scope.row.attachment }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="domain" label="二维码域名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" width="100">
          <template #default="scope">
            <span>{{ scope.row.remark || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <div class="row-actions font-sans">
              <el-button link type="primary" @click="showQrCode(scope.row)">
                <QrCode class="row-icon" />
                二维码
              </el-button>
              <el-button link type="primary" @click="handleEdit(scope.row)">
                <Edit class="row-icon" />
                编辑
              </el-button>
              <el-button link type="danger" @click="handleDelete(scope.row)">
                <Trash2 class="row-icon" />
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 底侧分页控制组件 -->
    <footer class="pagination-footer">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper" :total="filteredList.length" class="pagination-bar" />
    </footer>

    <!-- 二维码明细查看对话框 -->
    <el-dialog v-model="qrDialogVisible" title="报告防伪二维码" width="400px" align-center class="qr-dialog font-sans">
      <div class="qr-dialog-body" v-if="selectedRow">
        <canvas ref="qrCanvasRef" class="qr-canvas"></canvas>

        <div class="qr-details">
          <div class="detail-item">
            <span class="detail-label">报告名称：</span>
            <span class="detail-val">{{ selectedRow.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">报告编号：</span>
            <span class="detail-val font-mono">{{ selectedRow.code }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">防伪域名：</span>
            <span class="detail-val font-mono">{{ selectedRow.domain }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">完整防伪链接：</span>
            <span class="detail-val url-text font-mono">
              {{ selectedRow.domain }}/report?reportId={{ selectedRow.code }}
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="qrDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
.report-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

/* ----------------- Filter Panel ----------------- */
.filter-panel {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 16px 20px 0 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
  text-align: left;
}

.filter-form :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.search-btn {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
  font-weight: 500;
}

.search-btn:hover {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
}

.reset-btn {
  font-weight: 500;
  color: #475569 !important;
  border-color: #cbd5e1 !important;
}

.btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

/* ----------------- Action Bar ----------------- */
.action-bar {
  display: flex;
  justify-content: flex-start;
}

.add-btn {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
  font-weight: 500;
}

/* ----------------- Table Wrapper ----------------- */
.table-wrapper {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
  overflow: hidden;
}

.data-table {
  font-size: 13px;
  font-weight: 500;
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3b82f6;
  font-weight: 500;
}

.file-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.row-icon {
  width: 13px;
  height: 13px;
  margin-right: 2px;
}

/* ----------------- Pagination ----------------- */
.pagination-footer {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
}

.pagination-bar :deep(.el-pagination__total) {
  font-weight: 500;
  color: #64748b;
}

/* ----------------- Dialog Qr ----------------- */
.qr-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
  text-align: left;
}

.qr-canvas {
  width: 220px;
  height: 220px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px;
  background-color: #ffffff;
}

.qr-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f8fafc;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.detail-item {
  display: flex;
  font-size: 12px;
  line-height: 1.5;
}

.detail-label {
  color: #64748b;
  width: 84px;
  flex-shrink: 0;
  font-weight: 600;
}

.detail-val {
  color: #1e293b;
  font-weight: 500;
  word-break: break-all;
}

.url-text {
  color: #3b82f6;
}
</style>
