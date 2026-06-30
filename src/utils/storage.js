const TOKEN_KEY = 'report_platform_token'

/**
 * 获取本地 Token
 * @returns {string | null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 缓存本地 Token
 * @param {string} token 
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 清除本地 Token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}
