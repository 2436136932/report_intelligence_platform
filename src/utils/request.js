import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

// 创建 axios 实例
const service = axios.create({
  baseURL: 'http://192.168.1.47:8888', // 接口网关基地址
  timeout: 10000 // 超时时间：10秒
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 动态添加用户的 Token 到请求头
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 统一处理服务器返回的结果
    const res = response.data
    
    // 兼容后端不同字段命名（如 code 与 resultCode，msg 与 message / errormsg）
    const code = res.code !== undefined ? res.code : res.resultCode
    const msg = res.msg || res.message || res.errormsg || ''
    
    // 如果 code 存在且不是 200，则判定为错误接口响应
    if (code !== undefined && code !== 200 && code !== null) {
      ElMessage.error(msg || '服务器处理出错')
      return Promise.reject(new Error(msg || 'Error'))
    }
    
    // 统一在返回结果对象中挂载 code 和 msg 属性，供上层业务组件通用访问
    if (res && typeof res === 'object') {
      res.code = code
      res.msg = msg
    }
    return res
  },
  (error) => {
    console.error('Response interceptor error:', error)
    // 基础网络连接异常友好提示
    let errMsg = '连接服务器异常，请检查网络或后端接口'
    if (error.response) {
      errMsg = error.response.data?.msg || `请求错误 (HTTP ${error.response.status})`
    } else if (error.message && error.message.includes('timeout')) {
      errMsg = '请求服务器超时，请稍后重试'
    }
    ElMessage.error(errMsg)
    return Promise.reject(error)
  }
)

export default service
