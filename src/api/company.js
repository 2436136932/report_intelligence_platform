/**
 * 公司管理 API 模块
 * 提供公司的增删改查接口，与后端 /company/* 路由对接
 */
import request from '@/utils/request'

/**
 * 获取公司列表分页数据
 * @param {Object} params 查询条件
 * @param {number} params.pageNo 当前页码
 * @param {number} params.pageSize 每页条数
 * @param {string} [params.name] 公司名称（模糊查询）
 * @param {string} [params.url] 域名（二维码跳转域名）
 * @returns {Promise}
 */
export function getCompanyList(params) {
  return request({
    url: '/company/list',
    method: 'post',
    data: params
  })
}

/**
 * 新增公司数据
 * @param {Object} data 公司数据实体
 * @param {string} data.name 公司名称
 * @param {string} data.path 官网路径
 * @param {string} data.reportPath 报告路径（生成的报告存放目录）
 * @param {number} data.templateId 默认模板 ID
 * @param {string} [data.contact] 联系人
 * @param {string} [data.phone] 联系电话
 * @param {string} [data.remarks] 备注信息
 * @param {string} data.url 二维码跳转域名
 * @returns {Promise}
 */
export function insertCompany(data) {
  return request({
    url: '/company/insertCompany',
    method: 'post',
    data
  })
}

/**
 * 修改公司数据
 * @param {Object} data 公司数据实体，包含 id
 * @param {number} data.id 公司 ID
 * @param {string} data.name 公司名称
 * @param {string} data.path 官网路径
 * @param {string} data.reportPath 报告路径（生成的报告存放目录）
 * @param {number} data.templateId 默认模板 ID
 * @param {string} [data.contact] 联系人
 * @param {string} [data.phone] 联系电话
 * @param {string} [data.remarks] 备注信息
 * @param {string} data.url 二维码跳转域名
 * @returns {Promise}
 */
export function updateCompany(data) {
  return request({
    url: '/company/updateCompany',
    method: 'post',
    data
  })
}

/**
 * 删除公司数据
 * @param {Object} data 删除请求参数，包含 id
 * @param {number} data.id 公司 ID
 * @returns {Promise}
 */
export function delCompany(data) {
  return request({
    url: '/company/delCompany',
    method: 'post',
    data
  })
}
