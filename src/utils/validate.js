/**
 * 验证用户名（非空，且长度在 4 到 16 位字符之间）
 * @param {string} str
 * @returns {boolean}
 */
export function isValidUsername(str) {
  if (!str) return false
  const trimmed = str.trim()
  return trimmed.length >= 4 && trimmed.length <= 16
}

/**
 * 验证密码（非空，且长度至少 6 位字符）
 * @param {string} str
 * @returns {boolean}
 */
export function isValidPassword(str) {
  if (!str) return false
  return str.length >= 6
}
