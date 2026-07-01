import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTemplateList } from '@/api/template'

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
