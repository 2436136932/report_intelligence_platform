<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, ArrowRight } from 'lucide-vue-next'
import { ElNotification } from 'element-plus'
import { isValidUsername, isValidPassword } from '@/utils/validate'
import { useUserStore } from '@/store/modules/user'
import LoginCaptcha from '@/components/login/LoginCaptcha.vue'

const router = useRouter()

// 表单响应式数据
const form = ref({
  username: 'admin',
  password: '',
  captcha: ''
})

const currentCaptcha = ref('')
const successMsg = ref('')
const isSubmitting = ref(false)

const loginFormRef = ref(null)
const captchaRef = ref(null)
const userStore = useUserStore()

const onCaptchaChange = (code) => {
  currentCaptcha.value = code
}

const validateUsernameRule = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入账号'))
  } else if (!isValidUsername(value)) {
    callback(new Error('账号格式不正确（4-16位）'))
  } else {
    callback()
  }
}

const validatePasswordRule = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (!isValidPassword(value)) {
    callback(new Error('密码格式不正确（至少6位）'))
  } else {
    callback()
  }
}

const validateCaptchaRule = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入验证码'))
  } else if (value.toLowerCase() !== currentCaptcha.value.toLowerCase()) {
    callback(new Error('验证码输入错误'))
  } else {
    callback()
  }
}

const rules = {
  username: [{ validator: validateUsernameRule, trigger: 'blur' }],
  password: [{ validator: validatePasswordRule, trigger: 'blur' }],
  captcha: [{ validator: validateCaptchaRule, trigger: 'blur' }]
}

const handleLogin = () => {
  if (!loginFormRef.value) return
  
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    isSubmitting.value = true
    successMsg.value = ''
    
    try {
      await userStore.login({
        username: form.value.username,
        password: form.value.password
      })
      ElNotification({
        title: '登录成功',
        message: '欢迎回来，正在进入系统...',
        type: 'success',
        duration: 3000
      })
      successMsg.value = '登录成功，正在进入系统...'
      // 延迟 1 秒后自动跳转至后台主页，体验更平滑
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (err) {
      ElNotification({
        title: '登录失败',
        message: err.message || '账号不存在或密码错误，请使用默认账号 admin 密码 123456 登录',
        type: 'error',
        duration: 4000
      })
      form.value.captcha = ''
      captchaRef.value?.refresh()
    } finally {
      isSubmitting.value = false
    }
  })
}
</script>

<template>
  <div class="login-card-container">
    <!-- 卡片上沿科技蓝高光装饰条 -->
    <div class="card-glow-line"></div>
    
    <!-- 卡片头部标语与标题 -->
    <div class="card-header">
      <div class="card-welcome font-mono">WELCOME BACK</div>
      <h3 class="card-title font-sans">登录管理平台</h3>
      <p class="card-subtitle">请输入您的账号信息，开启高效报告管理。</p>
    </div>

    <!-- Element Plus 表单 -->
    <el-form 
      ref="loginFormRef" 
      :model="form" 
      :rules="rules"
      label-position="top"
      hide-required-asterisk
      class="login-form"
      @submit.prevent="handleLogin"
    >
      <!-- 登录成功反馈 -->
      <div v-if="successMsg" class="success-banner font-sans">
        <span class="success-dot animate-pulse"></span>
        {{ successMsg }}
      </div>

      <!-- 账号表单项 -->
      <el-form-item label="账号" prop="username">
        <el-input 
          v-model="form.username" 
          placeholder="请输入账号" 
          :disabled="isSubmitting"
        >
          <template #prefix>
            <User class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <!-- 密码表单项 -->
      <el-form-item label="密码" prop="password">
        <el-input 
          v-model="form.password" 
          type="password" 
          placeholder="请输入密码" 
          show-password
          :disabled="isSubmitting"
        >
          <template #prefix>
            <Lock class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <!-- 验证码表单项 -->
      <el-form-item label="验证码" prop="captcha">
        <div class="captcha-row">
          <el-input 
            v-model="form.captcha" 
            placeholder="请输入验证码" 
            maxlength="5"
            :disabled="isSubmitting"
            class="captcha-input-field"
          />
          <!-- Canvas 验证码子组件 -->
          <LoginCaptcha 
            ref="captchaRef" 
            @change="onCaptchaChange" 
          />
        </div>
      </el-form-item>

      <!-- 登录提交按钮 -->
      <div class="submit-container">
        <el-button 
          type="primary" 
          :loading="isSubmitting"
          class="btn-submit"
          native-type="submit"
        >
          <span class="btn-inner">
            进入系统
            <ArrowRight class="btn-arrow" />
          </span>
        </el-button>
      </div>
    </el-form>

  </div>
</template>

<style scoped>
.login-card-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 32px;
  border-radius: 20px;
  background-color: rgba(3, 7, 18, 0.45); /* 黑色背景半透明模糊 */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 136, 255, 0.15);
  box-shadow: 
    0 10px 30px -10px rgba(0, 0, 0, 0.7),
    inset 0 1px 1px rgba(255, 255, 255, 0.05),
    0 0 40px rgba(0, 136, 255, 0.08);
}

.card-glow-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1.5px;
  background: linear-gradient(to right, transparent, rgba(0, 136, 255, 0.4), transparent);
}

.card-header {
  margin-bottom: 28px;
  text-align: left;
}

.card-welcome {
  font-size: 10px;
  font-weight: 700;
  color: #64748b; /* text-slate-500 */
  letter-spacing: 0.15em;
  margin-bottom: 4px;
}

.card-title {
  margin: 0 0 6px 0;
  font-size: 22px;
  font-weight: bold;
  color: #ffffff;
}

.card-subtitle {
  margin: 0;
  font-size: 12px;
  color: #94a3b8; /* text-slate-400 */
}

.login-form {
  display: flex;
  flex-direction: column;
}

.success-banner {
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  color: #34d399;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background-color: #34d399;
}

.input-icon {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.captcha-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.captcha-input-field {
  flex: 1;
}

.submit-container {
  padding-top: 8px;
}

/* Element Plus 提交按钮样式自定义 */
.btn-submit {
  width: 100%;
  height: auto;
  padding: 14px 20px !important;
  border-radius: 8px !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: linear-gradient(to right, #0088ff, #6600ff) !important;
  box-shadow: 0 0 20px rgba(0, 136, 255, 0.15) !important;
}

.btn-submit:hover {
  background: linear-gradient(to right, #0099ff, #7700ff) !important;
  box-shadow: 0 0 25px rgba(0, 136, 255, 0.35) !important;
  transform: translateY(-1px) !important;
}

.btn-submit:active {
  transform: translateY(0px) !important;
  opacity: 0.95 !important;
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
}

.btn-arrow {
  width: 16px;
  height: 16px;
  color: #ffffff;
  transition: transform 0.2s ease;
}

.btn-submit:hover .btn-arrow {
  transform: translateX(3px);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (max-width: 1024px) {
  .login-card-container {
    padding: 24px;
  }
  .card-title {
    font-size: 20px;
  }
}
</style>
