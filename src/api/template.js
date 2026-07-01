import request from '@/utils/request'

/**
 * 获取模板列表
 * @param {Object} params 查询与分页参数
 * @param {number} params.pageNo 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} [params.name] 模板名称
 * @returns {Promise}
 */
export function getTemplateList(params) {
  return request({
    url: '/template/list',
    method: 'post',
    data: params
  })
}

/**
 * 新增/导入模板
 * @param {Object} data 模板及字段数据
 * @returns {Promise}
 */
export function insertTemplate(data) {
  return request({
    url: '/template/insertTemplate',
    method: 'post',
    data
  })
}

/**
 * 更新模板
 * @param {Object} data 模板及字段数据
 * @returns {Promise}
 */
export function updateTemplate(data) {
  return request({
    url: '/template/updateTemplate',
    method: 'post',
    data
  })
}
