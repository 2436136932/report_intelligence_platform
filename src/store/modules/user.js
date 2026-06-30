import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginRequest } from '../../api/auth'

export const useUserStore = defineStore('user', () => {
  // State: 初始状态均置空，持久化插件在加载时会自动从缓存中恢复对应的值
  const token = ref(null)
  const userInfo = ref({})

  /**
   * 用户登录 Action
   * @param {Object} loginForm 登录表单数据
   * @returns {Promise}
   */
  const login = async (loginForm) => {
    try {
      const response = await loginRequest(loginForm)
      if (response.code === 200) {
        // 更新 State 状态，持久化插件会自动同步至本地 localStorage 缓存
        token.value = response.data.token
        userInfo.value = response.data.userInfo
      }
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * 用户登出 Action
   */
  const logout = () => {
    token.value = null
    userInfo.value = {}
    // 持久化插件会自动同步清空缓存数据
  }

  return {
    token,
    userInfo,
    login,
    logout
  }
}, {
  // 启用 Pinia 插件持久化配置
  persist: {
    key: 'report_platform_user_state', // 缓存中的 Storage 键名
    storage: localStorage,              // 指定 localStorage
    paths: ['token', 'userInfo']        // 指定需要进行持久化保存的状态字段
  }
})
