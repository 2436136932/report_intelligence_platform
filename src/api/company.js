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
