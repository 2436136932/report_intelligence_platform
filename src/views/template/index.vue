<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search as SearchIcon,
  RotateCw as RotateCwIcon,
  Plus as PlusIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  PlusCircle as PlusCircleIcon
} from 'lucide-vue-next'

import { storeToRefs } from 'pinia'
import { useTemplateStore } from '@/store/modules/template'
import { getTemplateList, insertTemplate, updateTemplate } from '@/api/template'

const templateStore = useTemplateStore()

// 列表数据 & 加载态
const templateList = ref([])
const totalCount = ref(0)
const isLoading = ref(false)
const isSaving = ref(false)

// 搜索筛选状态
const filterName = ref('')
const filterCode = ref('')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)

// 从后端拉取模板列表（带分页 & 过滤参数）
const fetchTemplateList = async () => {
  isLoading.value = true
  try {
    const result = await getTemplateList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      name: filterName.value.trim(),
      code: filterCode.value.trim()
    })
    if (result && result.code === 200 && result.data) {
      // 同时更新 store 缓存（供公司管理页模板下拉框使用）
      const list = Array.isArray(result.data.list) ? result.data.list : []
      templateList.value = list.map(item => ({
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        fields: Array.isArray(item.templateFields) ? item.templateFields.map(f => {
          let optionsStr = ''
          if (f.options) {
            if (Array.isArray(f.options)) {
              optionsStr = f.options.join('\n')
            } else if (typeof f.options === 'string') {
              const trimmed = f.options.trim()
              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                  const parsed = JSON.parse(trimmed)
                  optionsStr = Array.isArray(parsed) ? parsed.join('\n') : f.options
                } catch (e) {
                  optionsStr = f.options
                }
              } else {
                optionsStr = f.options
              }
            } else {
              optionsStr = String(f.options)
            }
          }
          return {
            id: f.id,
            templateId: f.templateId,
            label: f.fieldName || '',
            fieldKey: f.keyName || '',
            fieldType: f.fieldType || 'text',
            required: f.isrequerd === 1 || f.isrequerd === true,
            sort: f.ordby || 1,
            options: optionsStr,
            defaultValue: f.defvalue || '',
            placeholder: f.fieldPrompt || ''
          }
        }) : []
      }))
      totalCount.value = result.data.total || list.length
      // 同步更新 store 供下拉框使用
      templateStore.templates = templateList.value
    } else {
      ElMessage.error(result?.msg || '获取模板列表失败')
    }
  } catch (err) {
    console.error('获取模板列表失败:', err)
    ElMessage.error(err.message || '获取模板列表失败，请检查网络或联系管理员')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchTemplateList()
})

const paginatedList = computed(() => templateList.value)

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchTemplateList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchTemplateList()
}

// 表格多选行
const selectedRows = ref([])
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 搜索查询
const handleQuery = () => {
  currentPage.value = 1
  fetchTemplateList()
}

// 重置查询
const handleReset = () => {
  filterName.value = ''
  filterCode.value = ''
  currentPage.value = 1
  fetchTemplateList()
}

// 抽屉展开状态
const isDrawerOpen = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const defaultForm = {
  id: null,
  name: '',
  code: '',
  description: '',
  fields: []
}

const form = reactive({ ...defaultForm })

const rules = {
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }]
}

// 打开新增模板视图
const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    description: '',
    fields: [
      {
        id: Date.now(),
        label: '报告内容',
        fieldKey: 'baoGaoNeiRong',
        fieldType: 'textarea',
        required: false,
        sort: 1,
        options: '',
        defaultValue: '',
        placeholder: ''
      }
    ]
  })
  isDrawerOpen.value = true
}

// 打开编辑模板视图
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code || '',
    description: row.description || '',
    fields: (row.fields || []).map(f => ({ ...f }))
  })
  isDrawerOpen.value = true
}

// 添加字段行
const handleAddField = () => {
  const nextSort = form.fields.reduce((max, f) => Number(f.sort) > max ? Number(f.sort) : max, 0) + 1
  form.fields.push({
    id: Date.now() + Math.random(),
    label: '',
    fieldKey: '',
    fieldType: 'text',
    required: false,
    sort: nextSort,
    options: '',
    defaultValue: '',
    placeholder: ''
  })
}

// 删除指定索引的字段行
const handleRemoveField = (index) => {
  form.fields.splice(index, 1)
}

// 保存模板数据
const handleSave = () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      // 字段规则初步拦截校验
      for (let i = 0; i < form.fields.length; i++) {
        const field = form.fields[i]
        if (!field.label.trim()) {
          ElMessage.warning(`自定义字段第 ${i + 1} 行：“字段名称”不能为空`)
          return
        }
        if (!field.fieldKey.trim()) {
          ElMessage.warning(`自定义字段第 ${i + 1} 行：“字段键名”不能为空`)
          return
        }
      }

      isSaving.value = true
      try {
        if (isEdit.value) {
          // 编辑更新
          const payload = {
            id: form.id,
            name: form.name,
            code: form.code || null,
            msg: null,
            templateFields: form.fields.map((f, index) => {
              const isSelect = f.fieldType === 'select'
              const finalOptions = isSelect
                ? (f.options ? f.options.split('\n').map(o => o.trim()).filter(Boolean) : [])
                : (f.options || '')
              return {
                id: (!f.id || f.id > 1000000000) ? undefined : f.id,
                templateId: form.id,
                fieldName: f.label || '',
                keyName: f.fieldKey || '',
                fieldType: f.fieldType || 'text',
                isrequerd: f.required ? 1 : 2,
                fieldPrompt: f.placeholder || null,
                defvalue: f.defaultValue || null,
                fieldValue: null,
                ordby: f.sort || (index + 1),
                options: finalOptions
              }
            })
          }
          const result = await updateTemplate(payload)
          if (result && result.code === 200) {
            ElMessage.success('更新成功')
            isDrawerOpen.value = false
            fetchTemplateList()
          } else {
            ElMessage.error(result.msg || '更新失败')
          }
        } else {
          // 新增添加
          const payload = {
            name: form.name,
            code: form.code || null,
            msg: null,
            templateFields: form.fields.map((f, index) => {
              const isSelect = f.fieldType === 'select'
              const finalOptions = isSelect
                ? (f.options ? f.options.split('\n').map(o => o.trim()).filter(Boolean) : [])
                : (f.options || '')
              return {
                fieldName: f.label || '',
                keyName: f.fieldKey || '',
                fieldType: f.fieldType || 'text',
                isrequerd: f.required ? 1 : 2,
                fieldPrompt: f.placeholder || null,
                defvalue: f.defaultValue || null,
                fieldValue: null,
                ordby: f.sort || (index + 1),
                options: finalOptions
              }
            })
          }
          const result = await insertTemplate(payload)
          if (result && result.code === 200) {
            ElMessage.success('新增成功')
            isDrawerOpen.value = false
            fetchTemplateList()
          } else {
            ElMessage.error(result.msg || '新增失败')
          }
        }
      } catch (err) {
        console.error('保存模板数据失败:', err)
        ElMessage.error(err.message || '操作失败，请检查网络或联系管理员')
      } finally {
        isSaving.value = false
      }
    }
  })
}

// 删除模板记录
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该模板吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--primary',
      cancelButtonClass: 'el-button--default',
    }
  ).then(() => {
    templateList.value = templateList.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 导出所选模板为符合第二组结构的 JSON 格式
const handleExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的模板')
    return
  }

  const templates = selectedRows.value.map(tpl => ({
    ID: tpl.id,
    CreatedAt: tpl.createdAt || new Date().toISOString(),
    UpdatedAt: tpl.updatedAt || new Date().toISOString(),
    name: tpl.name,
    code: tpl.code || '',
    description: tpl.description || '',
    fields: (tpl.fields || []).map(f => ({
      ID: f.id,
      CreatedAt: f.createdAt || new Date().toISOString(),
      UpdatedAt: f.updatedAt || new Date().toISOString(),
      templateId: f.templateId || tpl.id,
      label: f.label || '',
      fieldKey: f.fieldKey || '',
      fieldType: f.fieldType || 'text',
      required: !!f.required,
      sort: Number(f.sort) || 1,
      options: f.options || '',
      defaultValue: f.defaultValue || '',
      placeholder: f.placeholder || ''
    }))
  }))

  const now = new Date()
  const offset = -now.getTimezoneOffset()
  const diff = offset >= 0 ? '+' : '-'
  const pad = (num) => String(num).padStart(2, '0')
  const formattedOffset = `${diff}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
  const isoStr = now.toISOString()
  const ms = String(now.getMilliseconds()).padStart(3, '0')
  const exportedAt = `${isoStr.split('.')[0]}.${ms}982469${formattedOffset}`

  const configData = {
    version: "1.0",
    exportedAt: exportedAt,
    templates: templates
  }

  const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `template-export-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 导入模板
const isImportDialogOpen = ref(false)
const handleImportTemplate = () => {
  isImportDialogOpen.value = true
}

// 处理拖拽或上传 JSON 触发
const handleImportUploadChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result)
      let list = []
      if (parsed.templates && Array.isArray(parsed.templates)) {
        // 匹配规范结构 JSON
        list = parsed.templates.map(tpl => ({
          id: tpl.ID,
          name: tpl.name || '',
          code: tpl.code || '',
          description: tpl.description || '',
          createdAt: tpl.CreatedAt || new Date().toISOString(),
          updatedAt: tpl.UpdatedAt || new Date().toISOString(),
          fields: (tpl.fields || []).map(f => ({
            id: f.ID,
            createdAt: f.CreatedAt || new Date().toISOString(),
            updatedAt: f.UpdatedAt || new Date().toISOString(),
            templateId: f.templateId || tpl.ID,
            label: f.label || '',
            fieldKey: f.fieldKey || '',
            fieldType: f.fieldType || 'text',
            required: !!f.required,
            sort: Number(f.sort) || 1,
            options: f.options || '',
            defaultValue: f.defaultValue || '',
            placeholder: f.placeholder || ''
          }))
        }))
      } else {
        // 普通 JSON fallback
        const rawList = Array.isArray(parsed) ? parsed : [parsed]
        list = rawList.map(tpl => ({
          id: tpl.id || tpl.ID,
          name: tpl.name || '',
          code: tpl.code || '',
          description: tpl.description || '',
          createdAt: tpl.createdAt || tpl.CreatedAt || new Date().toISOString(),
          updatedAt: tpl.updatedAt || tpl.UpdatedAt || new Date().toISOString(),
          fields: (tpl.fields || []).map(f => ({
            id: f.id || f.ID,
            createdAt: f.createdAt || f.CreatedAt || new Date().toISOString(),
            updatedAt: f.updatedAt || f.UpdatedAt || new Date().toISOString(),
            templateId: f.templateId || tpl.id || tpl.ID,
            label: f.label || '',
            fieldKey: f.fieldKey || '',
            fieldType: f.fieldType || 'text',
            required: !!f.required,
            sort: Number(f.sort) || 1,
            options: f.options || '',
            defaultValue: f.defaultValue || '',
            placeholder: f.placeholder || ''
          }))
        }))
      }

      // 导入规则：有 ID 则更新；无 ID 则新增
      list.forEach(item => {
        if (item.id) {
          const index = templateList.value.findIndex(t => t.id === item.id)
          if (index !== -1) {
            templateList.value[index] = item
          } else {
            templateList.value.unshift(item)
          }
        } else {
          const maxId = templateList.value.reduce((max, t) => t.id > max ? t.id : max, 0)
          templateList.value.unshift({
            ...item,
            id: maxId + 1
          })
        }
      })
      ElMessage.success(`导入成功，共处理了 ${list.length} 个模板数据`)
      isImportDialogOpen.value = false
    } catch (err) {
      ElMessage.error('解析错误，文件导入失败')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="template-management-container font-sans">
    
    <!-- 统一行内搜索过滤与操作栏 -->
    <div class="filter-card">
      <el-form :inline="true" class="search-form-inline">
        <el-form-item label="模板名称">
          <el-input v-model="filterName" placeholder="模糊搜索模板名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="模板编码">
          <el-input v-model="filterCode" placeholder="模板编码" clearable style="width: 160px" />
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
          <el-button type="primary" class="add-btn" @click="handleCreate">
            <component :is="PlusIcon" class="btn-icon-svg" />
            新增模板
          </el-button>
          <el-button type="primary" plain class="export-btn" @click="handleExport">
            <component :is="DownloadIcon" class="btn-icon-svg" />
            导出模板
          </el-button>
          <el-button type="primary" class="import-btn" @click="handleImportTemplate">
            <component :is="UploadIcon" class="btn-icon-svg" />
            导入模板
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格卡片 -->
    <div class="table-card">
      <el-table
        :data="paginatedList"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
        class="custom-table"
        header-cell-class-name="table-header-cell"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="模板名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="code" label="模板编码" min-width="180">
          <template #default="{ row }">
            {{ row.code || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="字段数量" width="100" align="center">
          <template #default="{ row }">
            <span class="field-count-tag">{{ row.fields ? row.fields.length : 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons-cell">
              <el-button type="primary" link size="small" @click="handleEdit(row)" class="row-action-link">
                <component :is="EditIcon" class="link-icon-svg" />
                编辑
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)" class="row-action-link delete-action">
                <component :is="TrashIcon" class="link-icon-svg" />
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 导入模板 Dialog -->
    <el-dialog
      v-model="isImportDialogOpen"
      title="导入模板"
      width="540px"
      align-center
      class="import-template-dialog font-sans"
      append-to-body
    >
      <div class="import-dialog-body">
        <el-upload
          class="import-uploader-drag"
          drag
          action=""
          :auto-upload="false"
          :show-file-list="false"
          accept=".json"
          :on-change="handleImportUploadChange"
        >
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

    <!-- 新增/编辑模板 Drawer (抽屉组件) -->
    <el-drawer
      v-model="isDrawerOpen"
      size="calc(100% - 240px)"
      :with-header="true"
      class="template-drawer font-sans"
      append-to-body
    >
      <template #header>
        <div class="drawer-header-title-bar">
          <span class="drawer-main-title">{{ isEdit ? '编辑模板' : '新增模板' }}</span>
          <div class="drawer-header-actions">
            <el-button @click="isDrawerOpen = false" class="drawer-cancel-btn">取消</el-button>
            <el-button type="primary" :loading="isSaving" class="drawer-confirm-btn" @click="handleSave">确定</el-button>
          </div>
        </div>
      </template>

      <div class="drawer-body">
        <div class="drawer-form-card">
          <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="template-meta-form">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="模板名称" prop="name" required>
                  <el-input v-model="form.name" placeholder="请输入模板名称" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="模板编码" prop="code">
                  <el-input v-model="form.code" placeholder="可选，用于业务识别" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="模板说明" prop="description">
                  <el-input v-model="form.description" placeholder="模板说明" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 自定义字段列表区域 -->
        <div class="drawer-fields-card">
          <div class="fields-title-bar">
            <span class="fields-section-title">自定义字段</span>
            <el-button type="primary" class="add-field-btn" @click="handleAddField">
              <component :is="PlusCircleIcon" class="btn-icon-svg" />
              添加字段
            </el-button>
          </div>

          <!-- 字段表格 -->
          <el-table :data="form.fields" border class="fields-edit-table" style="width: 100%">
            <el-table-column label="排序" width="90" align="center">
              <template #default="{ row }">
                <el-input-number v-model="row.sort" :min="1" controls-position="right" class="sort-number-input" />
              </template>
            </el-table-column>
            <el-table-column label="字段名称" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.label" placeholder="例如 客户姓名" />
              </template>
            </el-table-column>
            <el-table-column label="字段键名" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.fieldKey" placeholder="例如 customerName" />
              </template>
            </el-table-column>
            <el-table-column label="字段类型" width="130">
              <template #default="{ row }">
                <el-select v-model="row.fieldType" placeholder="请选择">
                  <el-option label="单行文本" value="text" />
                  <el-option label="多行文本" value="textarea" />
                  <el-option label="数字" value="number" />
                  <el-option label="日期" value="date" />
                  <el-option label="日期时间" value="datetime" />
                  <el-option label="附件(图片)" value="image" />
                  <el-option label="下拉选择" value="select" />
                  <el-option label="单选" value="radio" />
                  <el-option label="多选" value="checkbox" />
                  <el-option label="开关" value="switch" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="必须" width="80" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.required" />
              </template>
            </el-table-column>
            <el-table-column label="占位提示" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.placeholder" placeholder="前台输入提示" />
              </template>
            </el-table-column>
            <el-table-column label="默认值" min-width="100">
              <template #default="{ row }">
                <el-input v-model="row.defaultValue" placeholder="默认值" />
              </template>
            </el-table-column>
            <el-table-column label="选项" min-width="180">
              <template #default="{ row }">
                <el-input type="textarea" :rows="1" v-model="row.options" placeholder="一行一个选项，或 label:value" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="handleRemoveField($index)" class="row-action-link delete-action">
                  <component :is="TrashIcon" class="link-icon-svg" />
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<style scoped>
.template-management-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: var(--el-fill-color-extra-light, #f8fafc);
  min-height: calc(100vh - 110px);
  box-sizing: border-box;
}

.list-view-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card {
  background-color: var(--el-bg-color, transparent);
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
  gap: 12px;
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
  stroke-width: 2.5px;
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
  margin-right: 4px;
}

.add-btn {
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  font-weight: 500;
}
.add-btn:hover {
  background-color: var(--el-color-primary-light-3) !important;
  border-color: var(--el-color-primary-light-3) !important;
}

.export-btn {
  font-weight: 500;
  color: var(--el-color-primary) !important;
  background-color: var(--el-color-primary-light-9, #eff6ff) !important;
  border-color: var(--el-color-primary-light-8, #bfdbfe) !important;
}
.export-btn:hover {
  background-color: var(--el-color-primary-light-8, #dbeafe) !important;
  border-color: var(--el-color-primary-light-7, #93c5fd) !important;
}

.import-btn {
  font-weight: 500;
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
}
.import-btn:hover {
  background-color: var(--el-color-primary-light-3) !important;
  border-color: var(--el-color-primary-light-3) !important;
}

.table-card {
  background-color: var(--el-bg-color, transparent);
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.custom-table, .fields-edit-table {
  border-radius: 6px;
  overflow: hidden;
}

:deep(.table-header-cell) {
  background-color: var(--el-fill-color-light, #f8fafc) !important;
  color: var(--el-text-color-primary, #1e293b) !important;
  font-weight: 600 !important;
}

.field-count-tag {
  background-color: var(--el-color-primary-light-9, #eff6ff);
  color: var(--el-color-primary, #3b82f6);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
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

/* 抽屉样式 */
.drawer-header-title-bar, .fields-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawer-main-title, .fields-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
}

.drawer-header-actions {
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
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.drawer-form-card, .drawer-fields-card {
  background-color: var(--el-bg-color, transparent);
  border: 1px solid var(--el-border-color-light, #f1f5f9);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.template-meta-form {
  margin-top: 10px;
}

:deep(.template-meta-form .el-form-item__label) {
  font-weight: 550 !important;
  color: var(--el-text-color-regular, #475569) !important;
}

.add-field-btn {
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  font-weight: 500;
}

.sort-number-input {
  width: 70px !important;
}
:deep(.sort-number-input .el-input__wrapper) {
  padding-left: 2px !important;
  padding-right: 2px !important;
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
