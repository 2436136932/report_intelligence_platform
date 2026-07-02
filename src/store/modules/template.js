import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTemplateList } from '@/api/template'

// 字段类型映射字典
const fieldTypeMap = {
  'text': '单行文本',
  'textarea': '多行文本',
  'number': '数字',
  'date': '日期',
  'datetime': '日期时间',
  'image': '附件(图片)',
  'select': '下拉选择',
  'radio': '单选',
  'checkbox': '多选',
  'switch': '开关'
}

const getEnglishFieldType = (chineseType) => {
  if (!chineseType) return 'text'
  const entry = Object.entries(fieldTypeMap).find(([key, val]) => val === chineseType || key === chineseType)
  return entry ? entry[0] : 'text'
}

export const useTemplateStore = defineStore('template', () => {
  const templates = ref([])

  const fetchTemplates = async () => {
    try {
      const response = await getTemplateList({ pageNo: 1, pageSize: 100 })
      if (response && response.code === 200 && response.data && Array.isArray(response.data.list)) {
        const backendTemplates = response.data.list.map(item => ({
          id: item.id,
          name: item.name || '',
          code: item.code || '',
          description: item.description || '',
          fields: Array.isArray(item.templateFields) ? item.templateFields.map(f => {
            let optionsStr = ''
            const rawOpts = f.options || f.optionds || f.optiond || ''
            if (rawOpts) {
              if (Array.isArray(rawOpts)) {
                optionsStr = rawOpts.join('\n')
              } else if (typeof rawOpts === 'string') {
                const trimmed = rawOpts.trim()
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                  try {
                    const parsed = JSON.parse(trimmed)
                    optionsStr = Array.isArray(parsed) ? parsed.join('\n') : rawOpts
                  } catch (e) {
                    optionsStr = rawOpts
                  }
                } else {
                  optionsStr = rawOpts
                }
              } else {
                optionsStr = String(rawOpts)
              }
            }
            return {
              id: f.id,
              templateId: f.templateId,
              label: f.fieldName || '',
              fieldKey: f.keyName || '',
              fieldType: getEnglishFieldType(f.fieldType),
              required: f.isrequerd === 1 || f.isrequerd === true,
              sort: f.ordby || 1,
              options: optionsStr,
              defaultValue: f.defvalue || '',
              placeholder: f.fieldPrompt || ''
            }
          }) : []
        }))

        templates.value = backendTemplates
      }
    } catch (error) {
      console.error('获取模板列表失败:', error)
      throw error
    }
  }

  return {
    templates,
    fetchTemplates
  }
}, {
  // 持久化模板状态到 localStorage
  persist: {
    key: 'report_platform_template_state',
    storage: localStorage,
    paths: ['templates']
  }
})
