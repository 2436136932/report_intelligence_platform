<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '@/store/modules/template'
import { getCompanyList } from '@/api/company'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search as SearchIcon,
  RotateCw as RotateCwIcon,
  Plus as PlusIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  ExternalLink as ExternalLinkIcon
} from 'lucide-vue-next'

const router = useRouter()

// 公司列表数据，初始化为空，从真实后端 API 动态获取
const companyList = ref([])

// 过滤筛选状态
const filterName = ref('')
const filterDomain = ref('')

// 分页与数据总量状态
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

// 获取后端公司数据接口
const fetchCompanyList = async () => {
  try {
    const result = await getCompanyList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      name: filterName.value.trim(),
      url: filterDomain.value.trim()
    })

    if (result && result.data && Array.isArray(result.data.list)) {
      companyList.value = result.data.list
      totalCount.value = result.data.total
    }
  } catch (error) {
    console.error('获取公司列表失败:', error)
  }
}

// 页面挂载完成自动抓取
onMounted(() => {
  fetchCompanyList()
})

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchCompanyList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchCompanyList()
}

// 选中行状态
const selectedRows = ref([])
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 搜索查询
const handleQuery = () => {
  currentPage.value = 1
  fetchCompanyList().then(() => {
    ElMessage.success('已刷新最新数据')
  })
}

// 重置查询条件
const handleReset = () => {
  filterName.value = ''
  filterDomain.value = ''
  currentPage.value = 1
  fetchCompanyList().then(() => {
    ElMessage.success('已重置筛选条件')
  })
}

// 新增/编辑 Drawer 状态
const isDrawerOpen = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const defaultForm = {
  id: null,
  name: '',
  url: '',
  path: '',
  reportPath: '',
  templateId: null,
  templateName: '',
  contact: null,
  phone: null,
  remarks: null
}

const form = reactive({ ...defaultForm })

const rules = {
  name: [{ required: true, message: '公司名称不能为空', trigger: 'blur' }],
  url: [{ required: true, message: '二维码跳转域名不能为空', trigger: 'blur' }]
}

// 打开新增
const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, defaultForm)
  isDrawerOpen.value = true
}

// 打开编辑
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  isDrawerOpen.value = true
}

// 引入全局模板管理 Store
const templateStore = useTemplateStore()
const availableTemplates = computed(() => templateStore.templates)

// 模板名称与 ID 双向转换映射
const getTemplateId = (name) => {
  const match = templateStore.templates.find(t => t.name === name)
  return match ? match.id : null
}

const getTemplateNameById = (id) => {
  const match = templateStore.templates.find(t => t.id === id)
  return match ? match.name : ''
}

// 模板选择变更时自动补齐 templateId
const handleTemplateSelectChange = (val) => {
  form.templateId = getTemplateId(val)
}

// 保存表单
const handleSave = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑更新
        const index = companyList.value.findIndex(item => item.id === form.id)
        if (index !== -1) {
          companyList.value[index] = { ...form }
          ElMessage.success('修改成功')
        }
      } else {
        // 新增添加，生成自增 ID
        const maxId = companyList.value.reduce((max, item) => item.id > max ? item.id : max, 0)
        const newCompany = {
          ...form,
          id: maxId + 1
        }
        companyList.value.unshift(newCompany)
        ElMessage.success('新增成功')
      }
      isDrawerOpen.value = false
      fetchCompanyList()
    }
  })
}

// 删除记录
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该公司吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--primary',
      cancelButtonClass: 'el-button--default',
    }
  ).then(() => {
    companyList.value = companyList.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
    fetchCompanyList()
  }).catch(() => {
    // 取消
  })
}

// 进入官网
const goToOfficialWebsite = (path) => {
  if (path) {
    if (path.startsWith('#')) {
      const target = path.replace('#', '')
      router.push(target)
    } else {
      window.open(path, '_blank')
    }
  }
}

// 导出公司为 JSON 格式（将后台的第一组数据转换成第二组导出格式）
const handleExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的公司')
    return
  }

  // 第一组数据（后端字段）转换为第二组数据格式的映射
  const companies = selectedRows.value.map(item => ({
    ID: item.id,
    name: item.name,
    domain: item.url || '',
    officialFrontPath: item.path || '',
    reportFrontPath: item.reportPath || '',
    templateId: item.templateId || null,
    contactName: item.contact || '',
    contactPhone: item.phone || '',
    remark: item.remarks || ''
  }))

  // 生成微秒高精度时区时间戳 (例如: 2026-07-01T10:12:02.883764919+08:00)
  const now = new Date()
  const offset = -now.getTimezoneOffset()
  const diff = offset >= 0 ? '+' : '-'
  const pad = (num) => String(num).padStart(2, '0')
  const formattedOffset = `${diff}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
  const isoStr = now.toISOString()
  const ms = String(now.getMilliseconds()).padStart(3, '0')
  const exportedAt = `${isoStr.split('.')[0]}.${ms}764919${formattedOffset}`

  const configData = {
    version: "1.0",
    exportedAt: exportedAt,
    companies: companies
  }

  const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `company-export-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 导入公司模板弹窗状态
const isImportDialogOpen = ref(false)

const handleImportTemplate = () => {
  isImportDialogOpen.value = true
}

// 处理导入的 JSON 文件上传触发
const handleImportUploadChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result)
      let list = []
      if (parsed.companies && Array.isArray(parsed.companies)) {
        // 如果是标准规范格式 JSON (第二组格式) 导入，转换为第一组后端字段形式存入列表
        list = parsed.companies.map(item => ({
          id: item.ID,
          name: item.name || '',
          url: item.domain || '',
          path: item.officialFrontPath || '',
          reportPath: item.reportFrontPath || '',
          templateId: item.templateId || null,
          templateName: getTemplateNameById(item.templateId),
          contact: item.contactName || null,
          phone: item.contactPhone || null,
          remarks: item.remark || null
        }))
      } else {
        // 普通后端格式 JSON (第一组格式) 导入
        const rawList = Array.isArray(parsed) ? parsed : [parsed]
        list = rawList.map(item => ({
          id: item.id || item.ID,
          name: item.name || '',
          url: item.url || item.domain || '',
          path: item.path || item.officialFrontPath || '',
          reportPath: item.reportPath || item.reportFrontPath || '',
          templateId: item.templateId || null,
          templateName: item.templateName || getTemplateNameById(item.templateId),
          contact: item.contact || item.contactName || null,
          phone: item.phone || item.contactPhone || null,
          remarks: item.remarks || item.remark || null
        }))
      }

      // 导入规则：有 ID 则更新；无 ID 则新增
      list.forEach(item => {
        if (item.id) {
          const index = companyList.value.findIndex(c => c.id === item.id)
          if (index !== -1) {
            companyList.value[index] = item
          } else {
            companyList.value.unshift(item)
          }
        } else {
          const maxId = companyList.value.reduce((max, c) => c.id > max ? c.id : max, 0)
          companyList.value.unshift({
            ...item,
            id: maxId + 1
          })
        }
      })
      ElMessage.success(`导入成功，共处理了 ${list.length} 家公司数据`)
      isImportDialogOpen.value = false // 自动关闭弹框
    } catch (err) {
      ElMessage.error('解析错误，文件导入失败')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="company-management-container font-sans">
    <!-- 头部搜索过滤栏 -->
    <div class="filter-card">
      <el-form :inline="true" class="search-form-inline">
        <el-form-item label="公司名称">
          <el-input v-model="filterName" placeholder="模糊搜索公司名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="域名">
          <el-input v-model="filterDomain" placeholder="域名或IP端口" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="query-btn" @click="handleQuery">
            <component :is="SearchIcon" class="btn-icon-svg" />
            查询
          </el-button>
          <el-button @click="handleReset" class="reset-btn">
            <component :is="RotateCwIcon" class="btn-icon-svg" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格卡片区 -->
    <div class="table-card">
      <!-- 操作按钮排 -->
      <div class="table-actions-row">
        <el-button type="primary" class="add-company-btn" @click="handleCreate">
          <component :is="PlusIcon" class="btn-icon-svg" />
          新增公司
        </el-button>
        <el-button class="export-company-btn" @click="handleExport">
          <component :is="DownloadIcon" class="btn-icon-svg" />
          导出公司
        </el-button>
        <el-button class="import-template-btn" @click="handleImportTemplate">
          <component :is="UploadIcon" class="btn-icon-svg" />
          导入模板
        </el-button>
      </div>

      <!-- 表格主体 -->
      <el-table :data="companyList" style="width: 100%" border @selection-change="handleSelectionChange"
        class="custom-company-table" header-cell-class-name="table-header-cell">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="公司名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="url" label="二维码跳转域名" min-width="240" show-overflow-tooltip />
        <el-table-column prop="path" label="官网路径" min-width="120" show-overflow-tooltip />
        <el-table-column prop="reportPath" label="报告路径" min-width="180" show-overflow-tooltip />
        <el-table-column prop="templateName" label="默认模板" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.templateName || '' }}
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="100" align="center">
          <template #default="{ row }">
            {{ row.contact || '' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="120" align="center">
          <template #default="{ row }">
            {{ row.phone || '' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons-cell">
              <!-- 进入官网 link (当 row.path 不为空时显示) -->
              <el-button v-if="row.path" type="primary" link size="small" @click="goToOfficialWebsite(row.path)"
                class="row-action-link">
                <component :is="ExternalLinkIcon" class="link-icon-svg" />
                进入官网
              </el-button>

              <el-button type="primary" link size="small" @click="handleEdit(row)" class="row-action-link">
                <component :is="EditIcon" class="link-icon-svg" />
                编辑
              </el-button>

              <el-button type="danger" link size="small" @click="handleDelete(row)"
                class="row-action-link delete-action">
                <component :is="TrashIcon" class="link-icon-svg" />
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="totalCount" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- 右侧新增/编辑抽屉 -->
    <el-drawer v-model="isDrawerOpen" size="480px" :with-header="true" class="company-drawer font-sans" append-to-body>
      <template #header>
        <div class="drawer-header">
          <span class="drawer-title">{{ isEdit ? '编辑公司' : '新增公司' }}</span>
          <div class="drawer-actions">
            <el-button size="default" class="drawer-cancel-btn" @click="isDrawerOpen = false">取消</el-button>
            <el-button type="primary" size="default" class="drawer-confirm-btn" @click="handleSave">确定</el-button>
          </div>
        </div>
      </template>

      <div class="drawer-body">
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
          <el-form-item label="公司名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入公司名称" />
          </el-form-item>
          <el-form-item label="二维码跳转域名" prop="url">
            <el-input v-model="form.url" placeholder="请输入二维码跳转域名" />
          </el-form-item>
          <el-form-item label="官网路径" prop="path">
            <el-input v-model="form.path" placeholder="例如 /company/zd 或 /company/custom/zd" />
          </el-form-item>
          <el-form-item label="报告路径" prop="reportPath">
            <el-input v-model="form.reportPath" placeholder="请输入报告路径" />
          </el-form-item>
          <el-form-item label="默认模板" prop="templateName">
            <el-select v-model="form.templateName" placeholder="请选择默认模板" clearable style="width: 100%"
              @change="handleTemplateSelectChange">
              <el-option v-for="tpl in availableTemplates" :key="tpl.id" :label="tpl.name" :value="tpl.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="联系人" prop="contact">
            <el-input v-model="form.contact" placeholder="请输入联系人姓名" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="备注" prop="remarks">
            <el-input type="textarea" v-model="form.remarks" placeholder="请输入备注信息" :rows="4" />
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>

    <!-- 导入公司模板 Dialog -->
    <el-dialog v-model="isImportDialogOpen" title="导入公司模板" width="540px" align-center
      class="import-template-dialog font-sans" append-to-body>
      <div class="import-dialog-body">
        <el-upload class="import-uploader-drag" drag action="" :auto-upload="false" :show-file-list="false"
          accept=".json" :on-change="handleImportUploadChange">
          <div class="drag-content-wrapper">
            <div class="drag-main-text">将 JSON 文件拖到此处，或点击选择文件</div>
            <div class="drag-sub-text">导入规则：有 ID 则更新；无 ID 则新增</div>
          </div>
        </el-upload>
      </div>
      <template #footer>
        <div class="dialog-footer-actions">
          <el-button @click="isImportDialogOpen = false" class="cancel-btn">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.company-management-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: var(--el-fill-color-extra-light, #f8fafc);
  min-height: calc(100vh - 110px);
  box-sizing: border-box;
}

.filter-card {
  background-color: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  border-radius: 8px;
  padding: 18px 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.search-form-inline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: -18px;
}

.btn-icon-svg {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  stroke-width: 2.5px;
}

.link-icon-svg {
  width: 13px;
  height: 13px;
  margin-right: 4px;
  stroke-width: 2px;
}

.query-btn {
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  font-weight: 500;
}

.query-btn:hover {
  background-color: var(--el-color-primary-light-3) !important;
  border-color: var(--el-color-primary-light-3) !important;
}

.reset-btn {
  font-weight: 500;
}

.table-card {
  background-color: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.table-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-company-btn {
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  font-weight: 500;
}

.add-company-btn:hover {
  background-color: var(--el-color-primary-light-3) !important;
  border-color: var(--el-color-primary-light-3) !important;
}

.export-company-btn,
.import-template-btn {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.custom-company-table {
  border-radius: 6px;
  overflow: hidden;
}

:deep(.table-header-cell) {
  background-color: var(--el-fill-color-light, #f8fafc) !important;
  color: var(--el-text-color-primary, #1e293b) !important;
  font-weight: 600 !important;
}

.action-buttons-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.row-action-link {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 0;
  height: auto;
  color: var(--el-color-primary);
}

.row-action-link.delete-action {
  color: var(--el-color-danger, #ef4444);
}

.row-action-link.delete-action:hover {
  color: var(--el-color-danger-light-3, #f87171);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
}

.drawer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-cancel-btn {
  font-weight: 500;
}

.drawer-confirm-btn {
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  font-weight: 500;
}

.drawer-confirm-btn:hover {
  background-color: var(--el-color-primary-light-3) !important;
  border-color: var(--el-color-primary-light-3) !important;
}

.drawer-body {
  padding: 0 16px;
}

/* 导入公司模板弹窗 */
.import-template-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-light, #e2e8f0);
  margin-right: 0;
}

.import-template-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
}

.import-template-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.import-uploader-drag {
  width: 100%;
}

.import-uploader-drag :deep(.el-upload-dragger) {
  padding: 40px 24px;
  background-color: var(--el-fill-color-extra-light, #f8fafc);
  border: 1px dashed var(--el-border-color-darker, #cbd5e1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.import-uploader-drag :deep(.el-upload-dragger):hover {
  border-color: var(--el-color-primary);
}

.drag-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.drag-main-text {
  font-size: 14px;
  color: var(--el-text-color-regular, #475569);
  font-weight: 500;
}

.drag-sub-text {
  font-size: 12px;
  color: var(--el-text-color-secondary, #94a3b8);
}

.import-template-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid var(--el-border-color-light, #e2e8f0);
}

.dialog-footer-actions {
  display: flex;
  justify-content: flex-end;
}

.dialog-footer-actions .cancel-btn {
  font-weight: 500;
}
</style>
