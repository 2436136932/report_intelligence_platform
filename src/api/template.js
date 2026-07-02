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

/**
 * 获取报告列表
 * @param {Object} params 查询与分页参数
 * @returns {Promise}
 */
export function getReportList(params) {
  return request({
    url: '/template/reportlist',
    method: 'post',
    data: params
  })
}

/**
 * 新增报告（multipart/form-data，含 file 文件字段）
 * @param {FormData} data
 * @returns {Promise}
 */
export function insertReport(data) {
  return request({
    url: '/template/insertReport',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 修改报告（multipart/form-data，含 file 文件字段）
 * @param {FormData} data
 * @returns {Promise}
 */
export function updateReport(data) {
  return request({
    url: '/template/updateReport',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 删除报告（application/json）
 * @param {Object} data 包含 id 的报告属性
 * @returns {Promise}
 */
export function deleteReport(data) {
  return request({
    url: '/template/delReport',
    method: 'post',
    data
  })
}

/**
 * 获取仪表盘统计数据
 * @returns {Promise}
 */
export function getDashboardStats() {
  return request({
    url: '/template/statislist',
    method: 'post',
    data: {}
  })
}




