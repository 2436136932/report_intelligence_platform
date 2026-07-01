import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTemplateStore = defineStore('template', () => {
  // 模板列表全局状态，包含字段数量分别为 1, 1, 3, 5, 1, 11, 12, 5, 5, 9 条的内置默认数据
  const templates = ref([
    {
      id: 11,
      name: '国检模板',
      code: '',
      description: '',
      createdAt: '2026-06-24T20:56:45.56+08:00',
      updatedAt: '2026-06-24T20:56:45.56+08:00',
      fields: [
        {
          id: 161,
          createdAt: '2026-06-24T20:56:45.561+08:00',
          updatedAt: '2026-06-24T20:56:45.561+08:00',
          templateId: 11,
          label: '图片',
          fieldKey: 'u56feU7247',
          fieldType: 'image',
          required: false,
          sort: 1,
          options: '',
          defaultValue: '',
          placeholder: ''
        }
      ]
    },
    {
      id: 10,
      name: '吉林院模板',
      code: 'JLY-001',
      description: '用于吉林省检测报告生成',
      createdAt: '2026-06-24T20:55:00.00+08:00',
      updatedAt: '2026-06-24T20:55:00.00+08:00',
      fields: [
        {
          id: 151,
          createdAt: '2026-06-24T20:55:00.00+08:00',
          updatedAt: '2026-06-24T20:55:00.00+08:00',
          templateId: 10,
          label: '报告内容',
          fieldKey: 'baoGaoNeiRong',
          fieldType: 'textarea',
          required: true,
          sort: 1,
          options: '',
          defaultValue: '',
          placeholder: '请输入报告内容'
        }
      ]
    },
    {
      id: 9,
      name: '辽宁院模板',
      code: 'LNY-TEM',
      description: '',
      createdAt: '2026-06-24T20:50:00.00+08:00',
      updatedAt: '2026-06-24T20:50:00.00+08:00',
      fields: [
        { id: 141, createdAt: '2026-06-24T20:50:00.00+08:00', updatedAt: '2026-06-24T20:50:00.00+08:00', templateId: 9, label: '报告名称', fieldKey: 'reportName', fieldType: 'text', required: true, sort: 1, options: '', defaultValue: '', placeholder: '请输入报告名称' },
        { id: 142, createdAt: '2026-06-24T20:50:00.00+08:00', updatedAt: '2026-06-24T20:50:00.00+08:00', templateId: 9, label: '检测日期', fieldKey: 'detectDate', fieldType: 'text', required: false, sort: 2, options: '', defaultValue: '', placeholder: '' },
        { id: 143, createdAt: '2026-06-24T20:50:00.00+08:00', updatedAt: '2026-06-24T20:50:00.00+08:00', templateId: 9, label: '上传报告', fieldKey: 'reportFile', fieldType: 'image', required: false, sort: 3, options: '', defaultValue: '', placeholder: '' }
      ]
    },
    {
      id: 8,
      name: '广东院模板',
      code: 'GDY-TEM',
      description: '',
      createdAt: '2026-06-24T20:45:00.00+08:00',
      updatedAt: '2026-06-24T20:45:00.00+08:00',
      fields: [
        { id: 131, templateId: 8, label: '委托单位', fieldKey: 'client', fieldType: 'text', required: true, sort: 1, options: '', defaultValue: '', placeholder: '请输入委托单位' },
        { id: 132, templateId: 8, label: '样品名称', fieldKey: 'sampleName', fieldType: 'text', required: true, sort: 2, options: '', defaultValue: '', placeholder: '' },
        { id: 133, templateId: 8, label: '检测项目', fieldKey: 'detectItems', fieldType: 'text', required: false, sort: 3, options: '', defaultValue: '', placeholder: '' },
        { id: 134, templateId: 8, label: '判定依据', fieldKey: 'criteria', fieldType: 'text', required: false, sort: 4, options: '', defaultValue: '', placeholder: '' },
        { id: 135, templateId: 8, label: '现场图片', fieldKey: 'siteImage', fieldType: 'image', required: false, sort: 5, options: '', defaultValue: '', placeholder: '' }
      ]
    },
    {
      id: 7,
      name: '山东院模板',
      code: 'SDY-TEM',
      description: '',
      createdAt: '2026-06-24T20:40:00.00+08:00',
      updatedAt: '2026-06-24T20:40:00.00+08:00',
      fields: [
        { id: 121, templateId: 7, label: '报告文件', fieldKey: 'reportPdf', fieldType: 'image', required: true, sort: 1, options: '', defaultValue: '', placeholder: '请选择报告文件' }
      ]
    },
    {
      id: 6,
      name: '北京院模板',
      code: 'BJY-TEM',
      description: '',
      createdAt: '2026-06-24T20:35:00.00+08:00',
      updatedAt: '2026-06-24T20:35:00.00+08:00',
      fields: Array.from({ length: 11 }, (_, i) => ({
        id: 110 + i,
        templateId: 6,
        label: i === 0 ? '报告内容' : `自定义字段_${i + 1}`,
        fieldKey: i === 0 ? 'baoGaoNeiRong' : `field_${i + 1}`,
        fieldType: i === 0 ? 'textarea' : 'text',
        required: i === 0,
        sort: i + 1,
        options: '',
        defaultValue: '',
        placeholder: ''
      }))
    },
    {
      id: 4,
      name: '上海陆科模板',
      code: 'SHLK-TEM',
      description: '',
      createdAt: '2026-06-24T20:30:00.00+08:00',
      updatedAt: '2026-06-24T20:30:00.00+08:00',
      fields: Array.from({ length: 12 }, (_, i) => ({
        id: 90 + i,
        templateId: 4,
        label: `字段_${i + 1}`,
        fieldKey: `field_${i + 1}`,
        fieldType: 'text',
        required: false,
        sort: i + 1,
        options: '',
        defaultValue: '',
        placeholder: ''
      }))
    },
    {
      id: 3,
      name: '中镧模板',
      code: 'ZL-TEM',
      description: '',
      createdAt: '2026-06-24T20:25:00.00+08:00',
      updatedAt: '2026-06-24T20:25:00.00+08:00',
      fields: Array.from({ length: 5 }, (_, i) => ({
        id: 80 + i,
        templateId: 3,
        label: `字段_${i + 1}`,
        fieldKey: `field_${i + 1}`,
        fieldType: 'text',
        required: false,
        sort: i + 1,
        options: '',
        defaultValue: '',
        placeholder: ''
      }))
    },
    {
      id: 2,
      name: '中检通模板',
      code: 'ZJT-TEM',
      description: '',
      createdAt: '2026-06-24T20:20:00.00+08:00',
      updatedAt: '2026-06-24T20:20:00.00+08:00',
      fields: Array.from({ length: 5 }, (_, i) => ({
        id: 70 + i,
        templateId: 2,
        label: `字段_${i + 1}`,
        fieldKey: `field_${i + 1}`,
        fieldType: 'text',
        required: false,
        sort: i + 1,
        options: '',
        defaultValue: '',
        placeholder: ''
      }))
    },
    {
      id: 1,
      name: '安徽院模板',
      code: 'AHY-TEM',
      description: '',
      createdAt: '2026-06-24T20:15:00.00+08:00',
      updatedAt: '2026-06-24T20:15:00.00+08:00',
      fields: Array.from({ length: 9 }, (_, i) => ({
        id: 60 + i,
        templateId: 1,
        label: `字段_${i + 1}`,
        fieldKey: `field_${i + 1}`,
        fieldType: 'text',
        required: false,
        sort: i + 1,
        options: '',
        defaultValue: '',
        placeholder: ''
      }))
    }
  ])

  return {
    templates
  }
}, {
  // 持久化模板状态到 localStorage
  persist: {
    key: 'report_platform_template_state',
    storage: localStorage,
    paths: ['templates']
  }
})
