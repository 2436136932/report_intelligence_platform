<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { Plus, Search, RotateCw, FileCode, Edit, Trash2, QrCode, FileText, UploadCloud, Copy as CopyIcon } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import QRCode from 'qrcode'

import { getCompanyList } from '@/api/company'
import { useTemplateStore } from '@/store/modules/template'
import { getReportList, insertReport, updateReport, deleteReport, downloadPdfBlob } from '@/api/template'
import request from '@/utils/request' // 步骤2：文件单独上传使用



// 搜索筛选表单数据
const queryParams = ref({
  code: '',
  name: '',
  company: ''
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)

// 公司列表数据与 Store
const companyList = ref([])
const templateStore = useTemplateStore()

// 获取公司选项列表
const fetchCompanyList = async () => {
  try {
    const result = await getCompanyList({ pageNo: 1, pageSize: 100 })
    if (result && result.code === 200 && result.data && Array.isArray(result.data.list)) {
      companyList.value = result.data.list
    }
  } catch (error) {
    console.error('加载公司列表失败:', error)
  }
}

// 公司下拉备选项，派生自加载的公司列表
const companyOptions = computed(() => {
  return companyList.value.map(c => c.name)
})

// 二维码弹窗控制
const qrDialogVisible = ref(false)
const selectedRow = ref(null)
const qrCanvasRef = ref(null)

// 报告列表的主数据源
const rawReportList = ref([])

// 分页与总条数
const totalCount = ref(0)
const isLoading = ref(false)

// 新增报告表单相关逻辑 (已提至顶部声明，防止 Temporal Dead Zone 引用异常)
const isDrawerOpen = ref(false)
const addFormRef = ref(null)
const uploadFile = ref(null)
const fileList = ref([]) // PDF文件列表，用于双向绑定上传组件

// PDF 预览与下载状态变量
const previewDialogVisible = ref(false)
const previewPdfUrl = ref('')
const previewPdfName = ref('')
const previewBlobUrl = ref('') // blob URL 用于内存回收
const isPreviewLoading = ref(false)  // blob 正在下载中
const previewSourceRow = ref(null)   // 当前正在预览的行数据

// 将文件路径转换为带认证的 blob URL
async function resolvePdfBlobUrl(row) {
  if (row.pdfUrl && row.pdfUrl.startsWith('blob:')) {
    return row.pdfUrl
  }
  const targetUrl = row.pdfUrl
  if (!targetUrl) return ''
  try {
    const blob = await downloadPdfBlob(targetUrl)
    if (previewBlobUrl.value) URL.revokeObjectURL(previewBlobUrl.value)
    previewBlobUrl.value = URL.createObjectURL(blob)
    return previewBlobUrl.value
  } catch {
    return ''
  }
}


// 查看报告列表中的 PDF 附件
const handlePreviewPdf = async (row) => {
  if (!row.pdfUrl) {
    ElMessage.warning('该报告未上传 PDF 附件')
    return
  }

  previewPdfName.value = row.attachment || 'PDF 附件'
  previewPdfUrl.value = ''
  previewSourceRow.value = row
  isPreviewLoading.value = true
  previewDialogVisible.value = true

  try {
    // 通过 axios 下载 blob（携带 token），再生成 blob URL 给 iframe
    // 这样 iframe 加载的是 blob: 协议，不会触发后端的登录验证
    const blobUrl = await resolvePdfBlobUrl(row)
    if (blobUrl) {
      previewPdfUrl.value = blobUrl
    }
  } finally {
    isPreviewLoading.value = false
  }
}



// 查看上传组件列表中的 PDF 附件
const handleFilePreview = (file) => {
  let url = ''
  if (file.raw) {
    // 刚选择的新本地文件，转成 Blob URL 用于预览
    url = URL.createObjectURL(file.raw)
  } else if (file.url) {
    url = file.url
  } else {
    url = `http://192.168.1.47:8888/uploads/${file.name}`
  }

  previewPdfUrl.value = url
  previewPdfName.value = file.name
  previewDialogVisible.value = true
}

// 在预览窗口中点击下载 PDF 附件
const handleDownloadPdfFromPreview = async () => {
  // 如果 blob 已准备好，直接下载
  if (previewPdfUrl.value && previewPdfUrl.value.startsWith('blob:')) {
    const link = document.createElement('a')
    link.href = previewPdfUrl.value
    link.download = previewPdfName.value || 'download.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  // blob 尚未准备（还在加载中或失败），直接用 pdfUrl 重新请求下载
  const sourceUrl = previewSourceRow.value?.pdfUrl
  if (!sourceUrl) {
    ElMessage.warning('暂无可下载的文件')
    return
  }

  try {
    ElMessage.info('正在下载，请稍候…')
    const blob = await downloadPdfBlob(sourceUrl)
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = previewPdfName.value || 'download.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch {
    ElMessage.error('下载失败，请确认服务器文件存在')
  }
}


// 关闭预览时清理 blob URL
watch(previewDialogVisible, (val) => {
  if (!val && previewBlobUrl.value) {
    URL.revokeObjectURL(previewBlobUrl.value)
    previewBlobUrl.value = ''
  }
})

const form = reactive({
  code: '',
  company: '',
  remark: '',
  dynamicFields: {}
})

// 校验规则
const formRules = {
  code: [{ required: true, message: '请输入报告编号', trigger: 'blur' }],
  company: [{ required: true, message: '请选择公司', trigger: 'change' }]
}

// 从后端接口真实获取报告列表数据
const fetchReportList = async () => {
  isLoading.value = true
  try {
    let companyId = ''
    if (queryParams.value.company) {
      const comp = companyList.value.find(c => c.name === queryParams.value.company)
      if (comp) {
        companyId = comp.id
      }
    }

    const result = await getReportList({
      number: queryParams.value.code.trim(),
      pdfName: queryParams.value.name.trim(),
      companyId: companyId,
      pageNo: currentPage.value,
      pageSize: pageSize.value
    })

    if (result && result.code === 200 && result.data) {
      const backendList = Array.isArray(result.data.list) ? result.data.list : []
      rawReportList.value = backendList.map(item => {
        // 优先按 companyId 查找公司对象
        let comp = companyList.value.find(c => c.id === item.companyId)
        // 如果 ID 没匹配到，尝试用公司名反向查找
        if (!comp && item.companyName) {
          comp = companyList.value.find(c => c.name === item.companyName)
        }
        // 优先使用接口直接返回的 templateName，其次通过公司关联的 templateId 匹配
        let tplName = item.templateName
        if (!tplName && comp?.templateId) {
          const tpl = templateStore.templates.find(t => t.id === comp.templateId)
          if (tpl) {
            tplName = tpl.name
          }
        }
        // 拼接后台返回的相对路径或文件名成为完整可预览的 URL 地址
        let pdfUrl = ''
        if (item.pdfPath) {
          if (item.pdfPath.startsWith('http')) {
            pdfUrl = item.pdfPath
          } else {
            const slash = item.pdfPath.startsWith('/') ? '' : '/'
            const parts = item.pdfPath.split('/')
            parts[parts.length - 1] = encodeURIComponent(parts[parts.length - 1])
            pdfUrl = `http://192.168.1.47:8888${slash}${parts.join('/')}`
          }
        } else if (item.pdfName) {
          // 后端存储格式可能为 ".ext#uuid"（如 ".pdf#dd744b..."）
          // 真实文件名为 "uuid.ext"（如 "dd744b....pdf"），需要转换
          const hashFormatMatch = item.pdfName.match(/^\.([a-z0-9]+)#(.+)$/i)
          const realFileName = hashFormatMatch
            ? `${hashFormatMatch[2]}.${hashFormatMatch[1]}`  // uuid.ext
            : item.pdfName
          pdfUrl = `http://192.168.1.47:8888/uploads/${encodeURIComponent(realFileName)}`
        }


        // 如果有 templateFields，直接从中提取模板字段定义（避免后续通过公司映射丢失信息）
        let extractedFields = []
        if (Array.isArray(item.templateFields) && item.templateFields.length > 0) {
          const tplId = item.templateFields[0].templateId
          // console.log('[extractFields] 报告 ID:', item.id, 'tplId:', tplId, 'store templates count:', templateStore.templates.length)
          // console.log('[extractFields] store templates:', templateStore.templates.map(t => ({ id: t.id, name: t.name, fieldsCount: t.fields?.length })))
          
          // 尝试从 store 找到该模板的定义
          const tpl = templateStore.templates.find(t => Number(t.id) === Number(tplId))
          // console.log('[extractFields] found tpl:', tpl ? tpl.name : 'NOT FOUND', 'has fields:', tpl?.fields?.length)
          if (tpl && Array.isArray(tpl.fields) && tpl.fields.length > 0) {
            extractedFields = tpl.fields
          } else {
            // 如果 store 中没有，用后端返回的原始字段定义构造临时字段
            extractedFields = item.templateFields.map(f => ({
              id: f.id,
              templateId: f.templateId,
              fieldKey: f.keyName,
              label: f.fieldName,
              fieldType: getEnglishFieldTypeForField(f.fieldType),
              required: f.isrequerd === 1 || f.isrequerd === true,
              placeholder: f.fieldPrompt || '',
              defaultValue: f.defvalue || '',
              options: f.optionds || (f.optiond ? JSON.parse(f.optiond) : [])
            }))
          }
          // console.log('[extractFields] extractedFields count:', extractedFields.length, 'fields:', extractedFields.map(f => f.fieldKey + ':' + f.label))
        }
        return {
          id: item.id,
          code: item.number || '',
          // reportName 是报告名称；若后端未保存则降级用 pdfName（老数据）
          // 无论哪个字段，都截掉 #uuid 这段 hash
          name: (() => {
            const raw = item.reportName || item.pdfName || ''
            if (!raw) return ''
            // 旧格式：.ext#uuid → 无可用名称
            if (/^\.[a-z0-9]+#/i.test(raw)) return ''
            // 新格式：原始名#uuid.ext → 截取 # 之前部分
            const hashIdx = raw.indexOf('#')
            const clean = hashIdx >= 0 ? raw.substring(0, hashIdx) : raw
            // 去掉末尾 .pdf 扩展名
            return clean.replace(/\.pdf$/i, '')
          })(),


          // 优先使用后端返回的公司名称
          company: comp ? comp.name : (item.companyName || '未知公司'),
          template: tplName || '未知模板',
          rawCompanyId: item.companyId,
          rawCompanyName: comp ? comp.name : (item.companyName || ''),
          templateId: comp?.templateId || null,
          extractedTemplateFields: extractedFields, // 预提取的模板字段定义
          // attachment 用于表格显示与预览标题，显示友好文件名
          // 后端存储格式可能为：
          //   旧：.pdf#uuid           → 显示 'PDF 附件'
          //   新：原始名#uuid.ext     → 截取 # 之前的部分 + 扩展名，如 '水泥.pdf'
          attachment: (() => {
            const n = item.pdfName || (item.pdfPath ? item.pdfPath.split('/').pop() : '')
            if (!n) return ''
            // 旧 hash 格式：以 .ext# 开头，例如 .pdf#uuid
            if (/^\.[a-z]+#/i.test(n)) return 'PDF 附件'
            // 新格式：原始名#uuid.ext → 截取 # 之前 + 末尾扩展名
            const hashIdx = n.indexOf('#')
            if (hashIdx >= 0) {
              const beforeHash = n.substring(0, hashIdx)              // 如 '水泥立柱'
              const ext = n.match(/\.([a-z0-9]+)$/i)?.[0] || '.pdf'  // 如 '.pdf'
              return beforeHash + ext                                   // 如 '水泥立柱.pdf'
            }
            return n
          })(),

          pdfUrl: pdfUrl,
          domain: comp ? comp.url : '',
          remark: item.remarks || '',
          time: item.createTime || '',
          // 还原后台保存的自定义动态字段到前端编辑表单中
          dynamicFields: item.templateFields ? item.templateFields.reduce((acc, f) => {
            acc[f.keyName] = f.fieldValue
            return acc
          }, {}) : {}
        }
      })
      // console.log('[fetchReportList] rawReportList dynamicFields:', rawReportList.value[0]?.dynamicFields)
      totalCount.value = result.data.total || rawReportList.value.length
    } else {
      ElMessage.error(result?.msg || '加载报告列表失败')
    }
  } catch (err) {
    console.error('获取报告列表异常:', err)
    ElMessage.error(err.message || '获取报告列表失败，请检查网络或联系管理员')
  } finally {
    isLoading.value = false
  }
}

// 监听分页页码和单页条数的变化
watch([currentPage, pageSize], () => {
  fetchReportList()
})

const handleQuery = () => {
  currentPage.value = 1
  fetchReportList()
}

// 重置查询条件
const handleReset = () => {
  queryParams.value = {
    code: '',
    name: '',
    company: ''
  }
  currentPage.value = 1
  fetchReportList()
}

const paginatedList = computed(() => rawReportList.value)

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
  ).then(async () => {
    try {
      // 调用后端删除接口，将报告 id 传过去
      const result = await deleteReport({ id: row.id })
      if (result && result.code === 200) {
        ElMessage.success('报告记录删除成功！')
        fetchReportList() // 刷新列表
      } else {
        ElMessage.error(result?.msg || '删除报告失败')
      }
    } catch (err) {
      console.error('删除报告异常:', err)
      ElMessage.error(err.message || '删除失败，请检查网络或后端接口')
    }
  }).catch(() => { })
}


const isEditMode = ref(false)     // 是否为编辑模式
const editingRow = ref(null)      // 正在编辑的行数据
const drawerQrCanvasRef = ref(null) // 抽屉二维码画布引用

// 编辑按钮点击事件
const handleEdit = (row) => {
  // console.log('[handleEdit] START')
  // console.log('[handleEdit] row.extractedTemplateFields:', row.extractedTemplateFields?.length)
  // console.log('[handleEdit] row.dynamicFields before:', { ...row.dynamicFields })

  isEditMode.value = true
  editingRow.value = row

  form.code = row.code
  // 优先使用原始公司名称
  form.company = row.rawCompanyName || row.company
  form.remark = row.remark

  if (row.attachment) {
    fileList.value = [{ name: row.attachment, url: row.pdfUrl }]
    uploadFile.value = { name: row.attachment }
  } else {
    fileList.value = []
    uploadFile.value = null
  }

  // 填充动态模板字段
  form.dynamicFields = { ...row.dynamicFields }

  // console.log('[handleEdit] after assign, form.dynamicFields:', { ...form.dynamicFields })
  // console.log('[handleEdit] isEditMode:', isEditMode.value)

  isDrawerOpen.value = true

  nextTick(() => {
    // console.log('[handleEdit] nextTick, selectedTemplate.value:', selectedTemplate.value ? { name: selectedTemplate.value.name, fieldsCount: selectedTemplate.value.fields?.length } : null)
    // console.log('[handleEdit] nextTick, form.dynamicFields:', { ...form.dynamicFields })
  })
}

// 获取抽屉生成的防伪二维码链接
const getQrLink = () => {
  const domain = selectedCompanyObj.value?.url || editingRow.value?.domain || 'https://query.report.cn'
  return `${domain}/report?reportId=${form.code}`
}

// 动态生成抽屉防伪二维码
const generateDrawerQrCode = () => {
  nextTick(() => {
    if (!drawerQrCanvasRef.value) return
    const qrUrl = getQrLink()
    QRCode.toCanvas(drawerQrCanvasRef.value, qrUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }, (error) => {
      if (error) console.error('Drawer QR code generation error:', error)
    })
  })
}

// 复制防伪链接
const handleCopyLink = () => {
  const qrUrl = getQrLink()
  navigator.clipboard.writeText(qrUrl).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(err => {
    ElMessage.error('复制失败: ' + err)
  })
}

// 打开防伪链接
const handleOpenLink = () => {
  const qrUrl = getQrLink()
  window.open(qrUrl, '_blank')
}

// 监听动态图片字段变更并转换为 Base64 预览
const handleImageUploadChange = (file, fieldKey) => {
  if (file && file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.dynamicFields[fieldKey] = e.target.result
    }
    reader.readAsDataURL(file.raw)
  }
}

// 监听抽屉打开与编辑状态，自动生成二维码
watch([isDrawerOpen, isEditMode], ([open, edit]) => {
  if (open && edit) {
    nextTick(() => {
      generateDrawerQrCode()
    })
  }
})

// 页面挂载时初始化数据
onMounted(async () => {
  await fetchCompanyList()
  try {
    await templateStore.fetchTemplates()
  } catch (err) {
    console.error('加载模板列表失败:', err)
  }
  // 初始化拉取报告列表
  fetchReportList()
})

// 新增与编辑表单状态及校验规则已移动至脚本顶部进行定义

// 当前所选公司的实体对象
const selectedCompanyObj = computed(() => {
  return companyList.value.find(c => c.name === form.company)
})

// 所选公司对应的模板（编辑模式优先使用预提取字段）
const selectedTemplate = computed(() => {
  // 编辑模式下，如果行有预提取的模板字段定义，且公司没有改变，直接使用它们构造模板对象
  const originalCompany = editingRow.value?.rawCompanyName || editingRow.value?.company
  if (isEditMode.value &&
    editingRow.value?.extractedTemplateFields?.length > 0 &&
    form.company === originalCompany) {
    // console.log('[selectedTemplate] EDIT mode, using extracted fields, count:', editingRow.value.extractedTemplateFields.length)
    return {
      name: editingRow.value.template,
      fields: editingRow.value.extractedTemplateFields,
      isReportFields: true // 已经是该报告已存的关联字段，更新时需要传真实 ID 告诉后端去 update
    }
  }
  const tId = selectedCompanyObj.value?.templateId
  if (!tId) {
    // console.log('[selectedTemplate] no tId')
    return null
  }
  const tpl = templateStore.templates.find(t => t.id === tId)
  // console.log('[selectedTemplate] found tpl:', tpl?.name, 'fieldsCount:', tpl?.fields?.length)
  if (tpl) {
    return {
      ...tpl,
      isReportFields: false // 这是属于模板本身的字段，新增或第一次编辑保存时，id 必须为 null 让后端去 insert
    }
  }
  return null
})

// 监听模板变化，初始化动态表单字段值
watch(selectedTemplate, (newTpl) => {
  // 如果是编辑模式，只有当改变了公司（即模板发生切换）时才重新初始化字段
  if (isEditMode.value) {
    const originalCompany = editingRow.value?.rawCompanyName || editingRow.value?.company
    if (form.company === originalCompany) return
  }
  if (newTpl && Array.isArray(newTpl.fields)) {
    const newFields = {}
    newTpl.fields.forEach(f => {
      newFields[f.fieldKey] = f.defaultValue || ''
    })
    form.dynamicFields = newFields
  } else {
    form.dynamicFields = {}
  }
})


// 处理文件变更
const handleFileChange = (file) => {
  fileList.value = [file]
  uploadFile.value = file.raw
}

// 复制报告编号到剪贴板
const handleCopyCode = () => {
  if (!form.code) return
  navigator.clipboard.writeText(form.code).then(() => {
    ElMessage.success('报告编号已复制到剪贴板')
  }).catch(err => {
    ElMessage.error('复制失败: ' + err)
  })
}

// 解析选择框选项列表
const parseOptions = (optionsVal) => {
  if (!optionsVal) return []
  if (Array.isArray(optionsVal)) return optionsVal
  return optionsVal.split('\n').map(o => o.trim()).filter(Boolean)
}

// 将后端返回的字段类型（可能是中文或英文）统一为英文
const getEnglishFieldTypeForField = (chineseType) => {
  if (!chineseType) return 'text'
  const map = { '单行文本': 'text', '多行文本': 'textarea', '数字': 'number', '日期': 'date', '日期时间': 'datetime', '附件(图片)': 'image', '下拉选择': 'select', '单选': 'radio', '多选': 'checkbox', '开关': 'switch' }
  return map[chineseType] || chineseType || 'text'
}

// 将前端英文的字段类型转回后端接受的中文类型
const getChineseFieldTypeForField = (englishType) => {
  if (!englishType) return '单行文本'
  const map = { 'text': '单行文本', 'textarea': '多行文本', 'number': '数字', 'date': '日期', 'datetime': '日期时间', 'image': '附件(图片)', 'select': '下拉选择', 'radio': '单选', 'checkbox': '多选', 'switch': '开关' }
  return map[englishType] || englishType || '单行文本'
}


// 新增报告按钮触发
const handleAdd = () => {
  isEditMode.value = false
  editingRow.value = null
  fileList.value = []
  uploadFile.value = null
  Object.assign(form, {
    code: '',
    company: '',
    remark: '',
    dynamicFields: {}
  })
  isDrawerOpen.value = true
  nextTick(() => {
    addFormRef.value?.resetFields()
  })
}

// 保存新增或编辑的报告（multipart/form-data，file 以二进制附上）
const handleSave = () => {
  addFormRef.value?.validate(async (valid) => {
    if (valid) {
      isLoading.value = true

      try {
        // 提取报告名称
        let reportName = '未命名报告'
        if (selectedTemplate.value && selectedTemplate.value.fields) {
          const nameField = selectedTemplate.value.fields.find(f =>
            f.label.includes('名称') || f.fieldKey.toLowerCase().includes('name') || f.fieldKey.toLowerCase().includes('mingcheng')
          )
          if (nameField && form.dynamicFields[nameField.fieldKey]) {
            reportName = form.dynamicFields[nameField.fieldKey]
          } else if (selectedTemplate.value.name) {
            reportName = selectedTemplate.value.name.replace('模板', '')
          }
        }

        // 构造 TemplateField 列表，包含全部后台所需属性且转换为对应的中文类型
        const templateFields = (selectedTemplate.value?.fields || []).map(f => {
          const finalOptions = Array.isArray(f.options)
            ? f.options
            : (typeof f.options === 'string' && f.options ? f.options.split('\n').map(o => o.trim()).filter(Boolean) : [])

          const targetId = f.id

          return {
            id: (!targetId || targetId > 1000000000) ? null : targetId,
            templateId: f.templateId,
            fieldName: f.label || '',
            keyName: f.fieldKey || '',
            fieldType: getChineseFieldTypeForField(f.fieldType),
            fieldValue: String(form.dynamicFields[f.fieldKey] || ''),
            isrequerd: f.required ? 1 : 2,
            fieldPrompt: f.placeholder || null,
            defvalue: f.defaultValue || null,
            optionds: finalOptions,
            optiond: JSON.stringify(finalOptions)
          }
        })


        // 构造 FormData：所有字段 + 文件一起提交
        const formData = new FormData()
        if (isEditMode.value && editingRow.value?.id) {
          formData.append('id', String(editingRow.value.id))
        }
        formData.append('number', form.code)
        if (selectedCompanyObj.value?.id != null) {
          formData.append('companyId', String(selectedCompanyObj.value.id))
        }
        formData.append('companyName', form.company || '')
        formData.append('templateName', selectedTemplate.value?.name || '')
        formData.append('pdfName', uploadFile.value?.name || '')
        formData.append('remarks', form.remark || '')
        formData.append('reportName', reportName)
        formData.append('url', selectedCompanyObj.value?.url || '')
        if (uploadFile.value instanceof File) {
          formData.append('file', uploadFile.value)
        }


        // 保留 JSON 字符串兼容字段（部分后端版本会解析此字段）
        formData.append('templateField', JSON.stringify(templateFields))

        // 同时以 indexed 索引格式逐字段 append，让 Spring MVC 能直接绑定
        // 到 @ModelAttribute Report 里的 List<TemplateField> templateFields
        templateFields.forEach((f, idx) => {
          const p = `templateFields[${idx}]`
          if (f.id != null) formData.append(`${p}.id`, String(f.id))
          if (f.templateId != null) formData.append(`${p}.templateId`, String(f.templateId))
          formData.append(`${p}.fieldName`, f.fieldName || '')
          formData.append(`${p}.keyName`, f.keyName || '')
          formData.append(`${p}.fieldType`, f.fieldType || '')
          formData.append(`${p}.fieldValue`, f.fieldValue || '')
          formData.append(`${p}.isrequerd`, String(f.isrequerd ?? 2))
          if (f.fieldPrompt) formData.append(`${p}.fieldPrompt`, f.fieldPrompt)
          if (f.defvalue) formData.append(`${p}.defvalue`, f.defvalue)
          if (f.optiond) formData.append(`${p}.optiond`, f.optiond)
            ; (f.optionds || []).forEach(opt => formData.append(`${p}.optionds`, opt))
        })


        let result
        if (isEditMode.value) {
          result = await updateReport(formData)
        } else {
          result = await insertReport(formData)
        }

        if (result && result.code === 200) {
          ElMessage.success(isEditMode.value ? '保存报告修改成功' : '新增报告成功')
          isDrawerOpen.value = false
          fetchReportList()
        } else {
          ElMessage.error(result?.msg || '保存报告失败')
        }
      } catch (err) {
        console.error('保存报告异常:', err)
        ElMessage.error(err.message || '提交失败，请检查后端接口')
      } finally {
        isLoading.value = false
      }
    }
  })
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
            <el-button v-if="scope.row.attachment" link type="primary" @click="handlePreviewPdf(scope.row)"
              class="attachment-link-btn">
              <FileCode class="file-icon" />
              {{ scope.row.attachment }}
            </el-button>
            <span v-else class="text-slate-400">-</span>
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
        layout="total, sizes, prev, pager, next, jumper" :total="totalCount" class="pagination-bar" />
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

    <!-- PDF 预览与下载查看对话框 -->
    <el-dialog v-model="previewDialogVisible" :title="`PDF 预览 - ${previewPdfName}`" width="75%" top="4vh" align-center
      destroy-on-close class="pdf-preview-dialog font-sans">
      <div class="pdf-preview-body">
        <iframe v-if="previewPdfUrl" :src="previewPdfUrl" width="100%" height="72vh"
          style="border: 1px solid #e2e8f0; border-radius: 8px;"></iframe>
        <div v-else class="pdf-no-preview">
          <p>无法渲染 PDF 预览，您可以直接点击下方按钮下载查看该文件。</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleDownloadPdfFromPreview">
            下载文件
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新增报告 Drawer (抽屉录入组件) -->
    <el-drawer v-model="isDrawerOpen" size="640px" :with-header="true" class="report-drawer font-sans" append-to-body>
      <template #header>
        <div class="drawer-header-title-bar">
          <span class="drawer-main-title">{{ isEditMode ? '编辑报告' : '新增报告' }}</span>
          <div class="drawer-header-actions">
            <el-button @click="isDrawerOpen = false" class="drawer-cancel-btn">取消</el-button>
            <el-button type="primary" class="drawer-confirm-btn" @click="handleSave">确定</el-button>
          </div>
        </div>
      </template>

      <div class="drawer-body">
        <el-form :model="form" :rules="formRules" ref="addFormRef" label-width="100px" label-position="left">
          <!-- 基础字段 -->
          <el-form-item label="报告编号" prop="code">
            <div class="code-input-wrapper">
              <el-input v-model="form.code" :disabled="isEditMode" placeholder="请输入报告编号" />
              <el-button v-if="isEditMode" @click="handleCopyCode" class="copy-code-btn">
                <component :is="CopyIcon" class="row-icon" />
                复制
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="所属公司" prop="company">
            <el-select v-model="form.company" placeholder="请选择公司" style="width: 100%">
              <el-option v-for="item in companyOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>

          <!-- 对应模板Tag显示 -->
          <el-form-item label="报告模板" v-if="selectedTemplate">
            <el-tag type="primary" class="template-tag">{{ selectedTemplate.name }}</el-tag>
          </el-form-item>

          <!-- PDF附件 -->
          <el-form-item label="PDF附件">
            <el-upload class="pdf-uploader" drag action="" :auto-upload="false" :on-change="handleFileChange"
              v-model:file-list="fileList" :on-preview="handleFilePreview" :show-file-list="true">
              <div class="uploader-drag-content">
                <component :is="UploadCloud" class="pdf-uploader-icon" />
                <div class="el-upload__text">将 PDF 拖到此处，或 <em>点击上传</em>，可保存后再补充</div>
              </div>
            </el-upload>
          </el-form-item>

          <!-- 动态模板字段列表 -->
          <div v-if="selectedTemplate && selectedTemplate.fields && selectedTemplate.fields.length">
            <div class="field-divider">
              <span class="divider-text">报告字段</span>
            </div>

            <el-form-item v-for="field in selectedTemplate.fields" :key="field.id" :label="field.label"
              :required="field.required">
              <!-- 文本输入 -->
              <el-input v-if="field.fieldType === 'text' || field.fieldType === 'textarea'"
                v-model="form.dynamicFields[field.fieldKey]"
                :type="field.fieldType === 'textarea' ? 'textarea' : 'text'"
                :placeholder="field.placeholder || `请输入${field.label}`" />

              <!-- 下拉选择 -->
              <el-select v-else-if="field.fieldType === 'select'" v-model="form.dynamicFields[field.fieldKey]"
                :placeholder="field.placeholder || '请选择'" style="width: 100%">
                <el-option v-for="opt in parseOptions(field.options)" :key="opt" :label="opt" :value="opt" />
              </el-select>

              <!-- 单选/多选/开关/数字/日期处理 -->
              <el-date-picker v-else-if="field.fieldType === 'date' || field.fieldType === 'datetime'"
                v-model="form.dynamicFields[field.fieldKey]" :type="field.fieldType"
                :placeholder="field.placeholder || '选择日期'" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />

              <el-input-number v-else-if="field.fieldType === 'number'" v-model="form.dynamicFields[field.fieldKey]"
                :placeholder="field.placeholder || '请输入数值'" style="width: 100%" />

              <el-switch v-else-if="field.fieldType === 'switch'" v-model="form.dynamicFields[field.fieldKey]" />

              <!-- 图片上传组件 -->
              <div v-else-if="field.fieldType === 'image'" class="image-field-uploader-container">
                <el-upload v-if="!form.dynamicFields[field.fieldKey]" class="image-uploader" drag action=""
                  :auto-upload="false" :show-file-list="false"
                  :on-change="(file) => handleImageUploadChange(file, field.fieldKey)" accept="image/*">
                  <div class="uploader-drag-content">
                    <component :is="UploadCloud" class="pdf-uploader-icon" />
                    <div class="el-upload__text">将图片拖到此处，或 <em>点击上传</em></div>
                  </div>
                </el-upload>
                <div v-else class="uploaded-image-preview-wrapper">
                  <img :src="form.dynamicFields[field.fieldKey]" class="uploaded-image-preview" />
                  <el-button link type="danger" size="small" @click="form.dynamicFields[field.fieldKey] = ''"
                    class="remove-image-btn">
                    移除
                  </el-button>
                </div>
              </div>

              <el-input v-else v-model="form.dynamicFields[field.fieldKey]"
                :placeholder="field.placeholder || `请输入${field.label}`" />
            </el-form-item>
          </div>

          <!-- 备注 -->
          <el-form-item label="备注">
            <el-input type="textarea" :rows="3" v-model="form.remark" placeholder="备注" />
          </el-form-item>

          <!-- 报告二维码说明/展示 -->
          <el-form-item label="报告二维码">
            <el-alert v-if="!isEditMode" title="报告保存后会根据报告编号生成二维码" type="info" show-icon :closable="false"
              class="qr-info-alert" />

            <div v-else class="drawer-qr-container">
              <canvas ref="drawerQrCanvasRef" class="drawer-qr-canvas"></canvas>
              <div class="drawer-qr-info">
                <div class="qr-tips-title">扫码查看报告</div>
                <div class="qr-tips-url font-mono">{{ getQrLink() }}</div>
                <div class="qr-actions-btn-group">
                  <el-button size="small" type="primary" @click="generateDrawerQrCode">
                    生成二维码
                  </el-button>
                  <el-button size="small" @click="handleCopyLink">
                    复制链接
                  </el-button>
                  <el-button size="small" @click="handleOpenLink">
                    打开链接
                  </el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>

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
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  font-weight: 500;
}

.search-btn:hover {
  background-color: var(--el-color-primary-light-3) !important;
  border-color: var(--el-color-primary-light-3) !important;
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
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
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
  color: var(--el-color-primary);
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
  color: var(--el-color-primary);
}

/* Drawer styles */
.drawer-header-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawer-main-title {
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
  font-weight: 500;
}

.drawer-body {
  padding: 0 16px;
}

.template-tag {
  font-weight: 600;
}

.pdf-uploader {
  width: 100%;
}

.pdf-uploader :deep(.el-upload-dragger) {
  padding: 24px 16px;
  background-color: var(--el-fill-color-extra-light, #f8fafc);
  border: 1px dashed var(--el-border-color-darker, #cbd5e1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.pdf-uploader :deep(.el-upload-dragger):hover {
  border-color: var(--el-color-primary);
}

.uploader-drag-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.pdf-uploader-icon {
  width: 32px;
  height: 32px;
  color: var(--el-color-primary);
}

.field-divider {
  display: flex;
  align-items: center;
  margin: 24px 0 16px 0;
}

.field-divider::before,
.field-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--el-border-color-lighter, #e2e8f0);
}

.divider-text {
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.qr-info-alert {
  padding: 8px 12px;
}

/* 第三步样式：二维码显示及图片上传 */
.drawer-qr-container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background-color: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
}

.drawer-qr-canvas {
  width: 120px;
  height: 120px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #ffffff;
  padding: 2px;
}

.drawer-qr-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.qr-tips-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.qr-tips-url {
  font-size: 11px;
  color: #64748b;
  word-break: break-all;
  line-height: 1.4;
}

.qr-actions-btn-group {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.image-field-uploader-container {
  width: 100%;
}

.image-uploader :deep(.el-upload-dragger) {
  padding: 16px;
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 90px;
}

.uploaded-image-preview-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.uploaded-image-preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.remove-image-btn {
  font-weight: 600;
}

/* 第四步样式：编号输入框布局 */
.code-input-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;
}

.copy-code-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* PDF 预览与表格链接样式 */
.attachment-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  padding: 0;
  color: var(--el-color-primary) !important;
}

.pdf-preview-body {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-no-preview {
  padding: 40px;
  text-align: center;
  color: #64748b;
}
</style>
