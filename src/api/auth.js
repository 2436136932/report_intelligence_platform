/**
 * 模拟登录 API 请求
 * @param {Object} data 登录表单数据
 * @param {string} data.username
 * @param {string} data.password
 * @returns {Promise}
 */
export function loginRequest(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const { username, password } = data
      // 仅当用户名为 admin 时模拟登录成功，否则模拟拒绝登录以验证报错行为
      if (username === 'admin' && password === '123456') {
        resolve({
          code: 200,
          data: {
            token: 'mock_token_123456',
            userInfo: {
              username: 'admin',
              name: 'admin',
              avatar: ''
            }
          }
        })
      } else {
        reject(new Error('账号不存在或密码错误，请使用默认账号 admin 密码 123456 登录'))
      }
    }, 1000)
  })
}
