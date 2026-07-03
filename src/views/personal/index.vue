<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { useTemplateStore } from '@/store/modules/template'
import { getReportList, getDashboardStats } from '@/api/template'
import { getCompanyList } from '@/api/company'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  FileCode2,
  FolderLock,
  Search,
  FileText,
  Camera,
  Check,
  Edit2,
  RotateCw
} from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const templateStore = useTemplateStore()

// 绑定全局 Pinia 用户状态
const userInfo = computed(() => userStore.userInfo || {})

/* ---------- 1. 基础模拟数据 ---------- */
const defaultUsername = 'ahlj283172239'
const defaultRoleCode = '9528'
const defaultCreateTime = '2026-06-25 11:00:46'

// 用于模拟网络延迟
const sleep = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms))

/* ---------- 2. 模拟后台 API 接口 ---------- */
const apiUpdateUsername = async (username) => {
  await sleep()
  if (!username.trim()) throw new Error('用户名不能为空')
  return { code: 200, message: '更新成功' }
}

const apiSendCaptcha = async (target, type) => {
  await sleep(800)
  console.log(`已向 ${target} 发送 ${type} 验证码: 123456`)
  return { code: 200, message: '验证码发送成功' }
}

const apiBindContact = async (data) => {
  await sleep()
  if (data.captcha !== '123456') {
    throw new Error('验证码错误，演示环境验证码请填 123456')
  }
  return { code: 200, message: '绑定成功' }
}

const apiUpdatePassword = async (data) => {
  await sleep()
  if (data.oldPassword === data.newPassword) {
    throw new Error('新密码不能与原密码相同')
  }
  return { code: 200, message: '密码修改成功' }
}

/* ---------- 3. 用户名行内修改逻辑 ---------- */
const isEditingUsername = ref(false)
const editUsernameVal = ref('')
const isUsernameSubmitting = ref(false)//用户名修改提交状态

const handleEditUsernameStart = () => {
  editUsernameVal.value = userInfo.value.username || defaultUsername
  isEditingUsername.value = true
}

const handleEditUsernameCancel = () => {
  isEditingUsername.value = false
}

const handleEditUsernameConfirm = async () => {
  const trimmedVal = editUsernameVal.value.trim()
  if (!trimmedVal) {
    return ElMessage.warning('用户名不能为空')
  }
  isUsernameSubmitting.value = true
  try {
    await apiUpdateUsername(trimmedVal)
    userStore.userInfo.username = trimmedVal
    ElMessage.success('用户名修改成功')
    isEditingUsername.value = false
  } catch (error) {
    ElMessage.error(error.message || '更新用户名失败')
  } finally {
    isUsernameSubmitting.value = false
  }
}

/* ---------- 4. 修改手机号逻辑 ---------- */
const isEditPhoneOpen = ref(false)
const phoneForm = ref({ phone: '', captcha: '' })
const phoneCountdown = ref(0)
const isPhoneSending = ref(false)
const isPhoneSubmitting = ref(false)
let phoneTimer = null

const openEditPhone = () => {
  phoneForm.value = { phone: userInfo.value.phone || '', captcha: '' }
  isEditPhoneOpen.value = true
}

const handleSendPhoneCaptcha = async () => {
  const phoneVal = phoneForm.value.phone.trim()
  if (!phoneVal) return ElMessage.warning('请输入手机号码')
  if (!/^1[3-9]\d{9}$/.test(phoneVal)) return ElMessage.warning('请输入正确的手机号码')

  isPhoneSending.value = true
  try {
    await apiSendCaptcha(phoneVal, '短信')
    ElMessage.success('验证码发送成功，请输入 123456')
    phoneCountdown.value = 60
    phoneTimer = setInterval(() => {
      if (phoneCountdown.value > 0) phoneCountdown.value--
      else {
        clearInterval(phoneTimer)
        phoneTimer = null
      }
    }, 1000)
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    isPhoneSending.value = false
  }
}

const handleSubmitPhone = async () => {
  const { phone, captcha } = phoneForm.value
  if (!phone.trim()) return ElMessage.warning('请输入手机号')
  if (!captcha.trim()) return ElMessage.warning('请输入验证码')

  isPhoneSubmitting.value = true
  try {
    await apiBindContact({ phone, captcha })
    userStore.userInfo.phone = phone
    ElMessage.success('手机号绑定成功')
    isEditPhoneOpen.value = false
    if (phoneTimer) {
      clearInterval(phoneTimer)
      phoneTimer = null
    }
    phoneCountdown.value = 0
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    isPhoneSubmitting.value = false
  }
}

/* ---------- 5. 修改邮箱逻辑 ---------- */
const isEditEmailOpen = ref(false)
const emailForm = ref({ email: '', captcha: '' })
const emailCountdown = ref(0)
const isEmailSending = ref(false)
const isEmailSubmitting = ref(false)
let emailTimer = null

const openEditEmail = () => {
  emailForm.value = { email: userInfo.value.email || '', captcha: '' }
  isEditEmailOpen.value = true
}

const handleSendEmailCaptcha = async () => {
  const emailVal = emailForm.value.email.trim()
  if (!emailVal) return ElMessage.warning('请输入邮箱地址')
  if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(emailVal)) {
    return ElMessage.warning('请输入正确的邮箱地址')
  }

  isEmailSending.value = true
  try {
    await apiSendCaptcha(emailVal, '邮箱')
    ElMessage.success('验证码发送成功，请输入 123456')
    emailCountdown.value = 60
    emailTimer = setInterval(() => {
      if (emailCountdown.value > 0) emailCountdown.value--
      else {
        clearInterval(emailTimer)
        emailTimer = null
      }
    }, 1000)
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    isEmailSending.value = false
  }
}

const handleSubmitEmail = async () => {
  const { email, captcha } = emailForm.value
  if (!email.trim()) return ElMessage.warning('请输入邮箱地址')
  if (!captcha.trim()) return ElMessage.warning('请输入验证码')

  isEmailSubmitting.value = true
  try {
    await apiBindContact({ email, captcha })
    userStore.userInfo.email = email
    ElMessage.success('邮箱绑定成功')
    isEditEmailOpen.value = false
    if (emailTimer) {
      clearInterval(emailTimer)
      emailTimer = null
    }
    emailCountdown.value = 0
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    isEmailSubmitting.value = false
  }
}

/* ---------- 6. 修改密码逻辑 ---------- */
const isEditPasswordOpen = ref(false)
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const isPasswordSubmitting = ref(false)

const openEditPassword = () => {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  isEditPasswordOpen.value = true
}

const handleSubmitPassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value
  if (!oldPassword) return ElMessage.warning('请输入原密码')
  if (!newPassword) return ElMessage.warning('请输入新密码')
  if (newPassword.length < 6) return ElMessage.warning('新密码长度不能少于 6 位')
  if (newPassword !== confirmPassword) return ElMessage.warning('两次输入的新密码不一致')

  isPasswordSubmitting.value = true
  try {
    await apiUpdatePassword({ oldPassword, newPassword })
    userStore.userInfo.passwordState = '已设置'
    ElMessage.success('密码修改成功')
    isEditPasswordOpen.value = false
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    isPasswordSubmitting.value = false
  }
}

// ==========================================================
// 系统指标统计、图表挂载与数据刷新逻辑
// ==========================================================
const stats = ref({ reportsCount: 0, companiesCount: 0, templatesCount: 0, attachmentsCount: 0 })
const trendMetrics = ref({
  todayNew: '0 份',
  pdfCoverage: '0%',
  topCompany: '暂无',
  topTemplate: '暂无'
})
const recentReports = ref([])
const isRefreshing = ref(false)
const chartRef = ref(null)
let chartInstance = null
const companyListCache = ref([])

// 从仪表盘接口拉取数据
async function fetchSystemData() {
  try {
    // 并行请求统计数据、公司列表、模板列表
    const [statsRes, companyRes] = await Promise.all([
      getDashboardStats().catch(() => null),
      getCompanyList({ pageNo: 1, pageSize: 10000 }).catch(() => null)
    ])

    const companies = Array.isArray(companyRes?.data?.list) ? companyRes.data.list : []
    companyListCache.value = companies
    const templatesList = templateStore.templates || []

    // 解析统计数据
    const mapData = statsRes?.data?.map
    if (mapData) {
      stats.value.reportsCount = mapData.rc || 0
      stats.value.companiesCount = mapData.comc || companies.length || 0
      stats.value.templatesCount = mapData.templatec || templatesList.length || 0
      stats.value.attachmentsCount = mapData.rpdfc || 0

      // 业务趋势指标
      const todayCount = mapData.rtc || 0
      trendMetrics.value.todayNew = `${todayCount} 份`
      const total = mapData.rc || 0
      const pdfCount = mapData.rpdfc || 0
      trendMetrics.value.pdfCoverage = total > 0 ? `${Math.round((pdfCount / total) * 100)}%` : '0%'

      let topCompanyName = '暂无'
      let topTemplateName = '暂无'
      if (mapData.report) {
        topCompanyName = mapData.report.companyName || '暂无'
        topTemplateName = mapData.report.templateName || '暂无'
      } else if (mapData.reports && mapData.reports.length > 0) {
        topCompanyName = mapData.reports[0].companyName || '暂无'
      }
      trendMetrics.value.topCompany = topCompanyName
      trendMetrics.value.topTemplate = topTemplateName

      // 趋势图表数据
      const trendResult = mapData.finalResult || []
      const trendDates = trendResult.map(item => item.reportDateStr)
      const trendCounts = trendResult.map(item => item.reportCount)
      initTrendChart(trendDates, trendCounts)
    }

    // 获取最近报告
    const recentRes = await getReportList({ pageNo: 1, pageSize: 5 }).catch(() => null)
    const recentList = Array.isArray(recentRes?.data?.list) ? recentRes.data.list : []
    recentReports.value = recentList.map(item => {
      const comp = companies.find(c => c.id === item.companyId)
      return {
        code: item.number || '',
        name: item.pdfRealyName || item.pdfName || '',
        company: comp ? comp.name : '未知公司',
        attachment: item.pdfRealyName || item.pdfName || '无',
        time: item.createTime || ''
      }
    })
  } catch (err) {
    console.error('拉取个人数据失败:', err)
  }
}

// 初始化趋势折线图
function initTrendChart(dates = [], counts = []) {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    series: [{
      type: 'line',
      data: counts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.15)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0)' }
        ])
      }
    }]
  })
}

const handleRefresh = () => {
  isRefreshing.value = true
  fetchSystemData().then(() => {
    setTimeout(() => {
      isRefreshing.value = false
      ElMessage.success('数据同步成功')
    }, 600)
  })
}

onMounted(() => {
  fetchSystemData()
})

watch(
  () => chartRef.value,
  (el) => {
    if (el) {
      // chart will be initialized when data loads
    }
  }
)

onUnmounted(() => {
  if (phoneTimer) clearInterval(phoneTimer)
  if (emailTimer) clearInterval(emailTimer)
  if (chartInstance) chartInstance.dispose()
})

</script>



<template>
  <div class="personal-container font-sans">
    <!-- 头部基础信息卡片 -->
    <header class="profile-header-card">
      <div class="profile-header-left">
        <!-- 静态头像 -->
        <div class="avatar-placeholder">
          <span class="avatar-text">{{ userInfo.username }}</span>
        </div>

        <div class="user-meta-info">
          <div class="system-tag-label">
            <span class="tag-dot"></span>
            报告管理系统
          </div>
          <!-- 用户名与修改行内控制 -->
          <div class="username-row">
            <template v-if="!isEditingUsername">
              <h2 class="display-username">{{ userInfo.username }}</h2>
              <button class="action-link-btn" @click="handleEditUsernameStart">
                <Edit2 class="inline-icon" />
                修改
              </button>
            </template>
            <template v-else>
              <el-input v-model="editUsernameVal" size="default" class="inline-edit-input"
                :disabled="isUsernameSubmitting" />
              <el-button type="primary" size="default" :loading="isUsernameSubmitting"
                @click="handleEditUsernameConfirm">
                确认
              </el-button>
              <el-button size="default" :disabled="isUsernameSubmitting" @click="handleEditUsernameCancel">
                取消
              </el-button>
            </template>
          </div>
        </div>
      </div>

      <!-- 右侧快捷看板指标 -->
      <div class="badges-row">
        <div class="badge-item">
          <span class="badge-title">登录账号</span>
          <span class="badge-val font-mono">{{ userInfo.username || defaultUsername }}</span>
        </div>
        <div class="badge-item">
          <span class="badge-title">当前角色</span>
          <span class="badge-val text-primary font-semibold">报告管理员</span>
        </div>
        <div class="badge-item">
          <span class="badge-title">角色编号</span>
          <span class="badge-val font-mono">{{ defaultRoleCode }}</span>
        </div>
        <div class="badge-item">
          <span class="badge-title">默认入口</span>
          <span class="badge-val font-mono">dashboard</span>
        </div>
      </div>

      <!-- 右下角状态和刷新 -->
      <div class="header-action-panel">
        <span class="status-indicator">正常</span>
        <button class="refresh-btn font-sans" :disabled="isRefreshing" @click="handleRefresh">
          <RotateCw :class="['refresh-icon', { 'animate-spin': isRefreshing }]" />
          刷新数据
        </button>
      </div>
    </header>

    <!-- 底部主体卡片栅格布局 -->
    <div class="personal-grid">
      <!-- 左栏 (账号信息 + 业务趋势) -->
      <div class="grid-left-col">
        <!-- 账号信息卡片 -->
        <section class="info-card">
          <div class="card-header-bar">
            <h3 class="card-title-text text-primary">
              <User class="card-title-icon" />
              账号信息
            </h3>
          </div>
          <div class="card-body-content">
            <div class="info-row-item">
              <span class="info-label-name">
                <Phone class="row-icon" /> 手机号
              </span>
              <div class="info-value-action">
                <span class="info-value-text font-mono" :class="{ 'is-unset': !userInfo.phone }">
                  {{ userInfo.phone || '未设置' }}
                </span>
                <button class="row-edit-link" @click="openEditPhone">修改</button>
              </div>
            </div>

            <div class="info-row-item">
              <span class="info-label-name">
                <Mail class="row-icon" /> 邮箱
              </span>
              <div class="info-value-action">
                <span class="info-value-text font-mono" :class="{ 'is-unset': !userInfo.email }">
                  {{ userInfo.email || '未设置' }}
                </span>
                <button class="row-edit-link" @click="openEditEmail">修改</button>
              </div>
            </div>

            <div class="info-row-item">
              <span class="info-label-name">
                <Lock class="row-icon" /> 密码
              </span>
              <div class="info-value-action">
                <span class="info-value-text font-mono">
                  {{ userInfo.passwordState || '已设置' }}
                </span>
                <button class="row-edit-link" @click="openEditPassword">修改</button>
              </div>
            </div>

            <div class="info-row-item no-border">
              <span class="info-label-name">
                <RotateCw class="row-icon" /> 创建时间
              </span>
              <div class="info-value-action">
                <span class="info-value-text font-mono">{{ defaultCreateTime }}</span>
              </div>
            </div>

            <div class="available-role-section">
              <span class="role-section-label">可用角色</span>
              <el-button type="primary" size="small" class="role-badge">报告管理员</el-button>
            </div>
          </div>
        </section>

        <!-- 业务趋势卡片 -->
        <section class="trend-card">
          <div class="trend-card-header flex-between">
            <h3 class="card-title-text text-primary">业务趋势</h3>
            <span class="days-select-badge">近7天</span>
          </div>
          <div class="trend-card-body">
            <div ref="chartRef" class="echarts-container"></div>
            <!-- 下方指标平铺网格 -->
            <div class="trend-metrics-grid">
              <div class="metric-grid-item">
                <span class="m-val text-primary font-mono">{{ trendMetrics.todayNew }}</span>
                <span class="m-lbl">今日新增</span>
              </div>
              <div class="metric-grid-item">
                <span class="m-val text-primary font-mono">{{ trendMetrics.pdfCoverage }}</span>
                <span class="m-lbl">PDF覆盖率</span>
              </div>
              <div class="metric-grid-item">
                <span class="m-val text-primary">{{ trendMetrics.topCompany }}</span>
                <span class="m-lbl">监控公司</span>
              </div>
              <div class="metric-grid-item">
                <span class="m-val text-primary">{{ trendMetrics.topTemplate }}</span>
                <span class="m-lbl">监控模板</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 右栏 (业务概览 + 最近报告) -->
      <div class="grid-right-col">
        <!-- 业务概览卡片 -->
        <section class="overview-card">
          <div class="overview-card-header flex-between">
            <h3 class="card-title-text text-primary">业务概览</h3>
            <span class="header-side-link">报告查询与公开验证</span>
          </div>
          <div class="overview-card-body">
            <!-- 统计数字展示块 -->
            <div class="stats-numbers-row">
              <div class="stat-number-box">
                <span class="stat-num-value text-primary font-mono">{{ stats.reportsCount }}</span>
                <span class="stat-num-label">报告总数</span>
              </div>
              <div class="stat-number-box">
                <span class="stat-num-value text-primary font-mono">{{ stats.companiesCount }}</span>
                <span class="stat-num-label">公司数量</span>
              </div>
              <div class="stat-number-box">
                <span class="stat-num-value text-primary font-mono">{{ stats.templatesCount }}</span>
                <span class="stat-num-label">报告模板</span>
              </div>
              <div class="stat-number-box">
                <span class="stat-num-value text-primary font-mono">{{ stats.attachmentsCount }}</span>
                <span class="stat-num-label">最近附件</span>
              </div>
            </div>

            <!-- 四个带副标题的快捷入口卡片 -->
            <div class="shortcut-cards-grid">
              <div class="shortcut-item-card" @click="router.push('/report/list')">
                <div class="shortcut-icon-bg is-blue">
                  <FileText class="shortcut-icon" />
                </div>
                <div class="shortcut-text-group">
                  <span class="shortcut-main-title">报告列表</span>
                  <span class="shortcut-sub-title">报告录入与审核</span>
                </div>
              </div>

              <div class="shortcut-item-card" @click="router.push('/report/query')">
                <div class="shortcut-icon-bg is-cyan">
                  <Search class="shortcut-icon" />
                </div>
                <div class="shortcut-text-group">
                  <span class="shortcut-main-title">报告查询</span>
                  <span class="shortcut-sub-title">后台精准检索</span>
                </div>
              </div>

              <div class="shortcut-item-card" @click="router.push('/company')">
                <div class="shortcut-icon-bg is-purple">
                  <Building2 class="shortcut-icon" />
                </div>
                <div class="shortcut-text-group">
                  <span class="shortcut-main-title">公司管理</span>
                  <span class="shortcut-sub-title">域名与权限路径</span>
                </div>
              </div>

              <div class="shortcut-item-card" @click="router.push('/template')">
                <div class="shortcut-icon-bg is-orange">
                  <FileCode2 class="shortcut-icon" />
                </div>
                <div class="shortcut-text-group">
                  <span class="shortcut-main-title">模板管理</span>
                  <span class="shortcut-sub-title">自定义数据字段</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 最近报告列表卡片 -->
        <section class="recent-reports-card">
          <div class="recent-card-header flex-between">
            <h3 class="card-title-text text-primary">最近报告</h3>
            <button class="header-link-btn" @click="router.push('/report/list')">
              报告列表
            </button>
          </div>
          <div class="recent-card-body">
            <!-- 表格 -->
            <el-table :data="recentReports" stripe style="width: 100%" class="custom-recent-table">
              <el-table-column prop="code" label="报告编号" width="220" show-overflow-tooltip />
              <el-table-column prop="name" label="报告名称" min-width="160" show-overflow-tooltip />
              <el-table-column prop="company" label="公司" width="100" show-overflow-tooltip />
              <el-table-column prop="attachment" label="附件" width="180" show-overflow-tooltip />
              <el-table-column prop="time" label="更新时间" width="160" />
            </el-table>
          </div>
        </section>
      </div>
    </div>

    <!-- 修改手机号 Dialog -->
    <el-dialog v-model="isEditPhoneOpen" title="修改手机号" width="440px" align-center class="personal-dialog font-sans">
      <el-form label-position="left" label-width="70px" class="dialog-form">
        <el-form-item label="手机号">
          <el-input v-model="phoneForm.phone" placeholder="请输入新的手机号码">
            <template #prefix>
              <Phone class="dialog-input-icon" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="验证码">
          <div class="captcha-input-row">
            <el-input v-model="phoneForm.captcha" placeholder="请输入验证码">
              <template #prefix>
                <Lock class="dialog-input-icon" />
              </template>
            </el-input>
            <el-button type="primary" class="get-captcha-btn" :disabled="phoneCountdown > 0 || isPhoneSending"
              :loading="isPhoneSending" @click="handleSendPhoneCaptcha">
              {{ phoneCountdown > 0 ? `${phoneCountdown}s 秒后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer-buttons">
          <el-button @click="isEditPhoneOpen = false">取消</el-button>
          <el-button type="primary" :loading="isPhoneSubmitting" @click="handleSubmitPhone">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改邮箱 Dialog -->
    <el-dialog v-model="isEditEmailOpen" title="修改邮箱" width="440px" align-center class="personal-dialog font-sans">
      <el-form label-position="left" label-width="70px" class="dialog-form">
        <el-form-item label="邮箱">
          <el-input v-model="emailForm.email" placeholder="请输入新的邮箱地址">
            <template #prefix>
              <Mail class="dialog-input-icon" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="验证码">
          <div class="captcha-input-row">
            <el-input v-model="emailForm.captcha" placeholder="请输入验证码">
              <template #prefix>
                <Lock class="dialog-input-icon" />
              </template>
            </el-input>
            <el-button type="primary" class="get-captcha-btn" :disabled="emailCountdown > 0 || isEmailSending"
              :loading="isEmailSending" @click="handleSendEmailCaptcha">
              {{ emailCountdown > 0 ? `${emailCountdown}s 秒后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer-buttons">
          <el-button @click="isEditEmailOpen = false">取消</el-button>
          <el-button type="primary" :loading="isEmailSubmitting" @click="handleSubmitEmail">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改密码 Dialog -->
    <el-dialog v-model="isEditPasswordOpen" title="修改密码" width="440px" align-center class="personal-dialog font-sans">
      <el-form label-position="left" label-width="80px" class="dialog-form">
        <el-form-item label="原密码" required>
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码">
            <template #prefix>
              <Lock class="dialog-input-icon" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码">
            <template #prefix>
              <Lock class="dialog-input-icon" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请确认新密码">
            <template #prefix>
              <Lock class="dialog-input-icon" />
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer-buttons">
          <el-button @click="isEditPasswordOpen = false">取消</el-button>
          <el-button type="primary" :loading="isPasswordSubmitting" @click="handleSubmitPassword">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.personal-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ========================================================
   1. 头部个人名片 Header Card
   ======================================================== */
.profile-header-card {
  background-color: var(--el-bg-color, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  padding: 24px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.profile-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 静态加载失败头像框 */
.avatar-placeholder {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color, #d1d5db);
  background-color: var(--el-fill-color-blank, #f9fafb);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  box-sizing: border-box;
}

.avatar-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder, #9ca3af);
  position: relative;
}

.avatar-placeholder::before {
  content: '';
  position: absolute;
  width: 72px;
  height: 72px;
  border: 1px dashed var(--el-border-color-light, #cbd5e1);
  border-radius: 50%;
  pointer-events: none;
}

.user-meta-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.system-tag-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary, #64748b);
  font-weight: 500;
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-color-primary, #3b82f6);
}

.username-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.display-username {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: var(--el-text-color-primary, #0f172a);
}

.action-link-btn {
  background: none;
  border: none;
  color: var(--el-color-primary, #3b82f6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-link-btn:hover {
  background-color: var(--el-color-primary-light-9, #eff6ff);
}

.inline-icon {
  width: 14px;
  height: 14px;
}

.inline-edit-input {
  width: 200px;
}

/* 顶部中间快捷看板 */
.badges-row {
  display: flex;
  gap: 48px;
}

.badge-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.badge-title {
  font-size: 12px;
  color: var(--el-text-color-secondary, #94a3b8);
}

.badge-val {
  font-size: 14px;
  color: var(--el-text-color-primary, #1e293b);
  font-weight: 500;
}

.text-primary {
  color: var(--el-color-primary, #3b82f6);
}

.header-action-panel {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  padding: 3px 10px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color, #d1d5db);
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular, #4b5563);
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: var(--el-fill-color-hover, #f3f4f6);
  border-color: var(--el-color-primary, #3b82f6);
  color: var(--el-color-primary, #3b82f6);
}

.refresh-icon {
  width: 14px;
  height: 14px;
}

/* ========================================================
   2. 双栏主栅格 Grid Layout
   ======================================================== */
.personal-grid {
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: 20px;
  align-items: start;
}

.grid-left-col,
.grid-right-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 统一面板卡片通用样式 */
.info-card,
.trend-card,
.overview-card,
.recent-reports-card {
  background-color: var(--el-bg-color, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  box-sizing: border-box;
  text-align: left;
}

/* 卡片标题栏 */
.card-header-bar,
.trend-card-header,
.overview-card-header,
.recent-card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light, #f1f5f9);
}

.card-title-text {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-title-text::before {
  content: '■';
  font-size: 10px;
  color: var(--el-color-primary, #3b82f6);
}

.card-title-icon {
  width: 16px;
  height: 16px;
}

/* ========================================================
   3. 左侧 - 账号信息 Card
   ======================================================== */
.info-card .card-body-content {
  padding: 12px 20px 20px 20px;
}

.info-row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter, #f3f4f6);
}

.info-row-item.no-border {
  border-bottom: none;
}

.info-label-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular, #4b5563);
}

.row-icon {
  width: 15px;
  height: 15px;
  color: var(--el-text-color-secondary, #9ca3af);
}

.info-value-action {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-value-text {
  font-size: 13px;
  color: var(--el-text-color-primary, #111827);
  font-weight: 500;
}

.info-value-text.is-unset {
  color: var(--el-text-color-placeholder, #9ca3af);
  font-weight: 400;
}

.row-edit-link {
  background: none;
  border: none;
  color: var(--el-color-primary, #3b82f6);
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
}

.row-edit-link:hover {
  background-color: var(--el-color-primary-light-9, #eff6ff);
}

.available-role-section {
  border-top: 1px solid var(--el-border-color-lighter, #f3f4f6);
  padding-top: 16px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-section-label {
  font-size: 12px;
  color: var(--el-text-color-secondary, #94a3b8);
  font-weight: 500;
}

.role-badge {
  align-self: flex-start;
}

/* ========================================================
   4. 左侧 - 业务趋势 Card
   ======================================================== */
.trend-card .trend-card-body {
  padding: 20px;
}

.days-select-badge {
  padding: 2px 8px;
  background-color: var(--el-color-primary-light-9, #eff6ff);
  border: 1px solid var(--el-color-primary-light-8, #bfdbfe);
  color: var(--el-color-primary, #3b82f6);
  font-size: 11px;
  border-radius: 4px;
  font-weight: 600;
}

.echarts-container {
  width: 100%;
  height: 220px;
}

.trend-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 16px;
  border-top: 1px dashed var(--el-border-color-light, #e2e8f0);
  padding-top: 16px;
}

.metric-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.m-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary, #1e293b);
}

.m-lbl {
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
}

/* ========================================================
   5. 右侧 - 业务概览 Card
   ======================================================== */
.overview-card .overview-card-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-side-link {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #9ca3af);
}

.stats-numbers-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-number-box {
  background-color: var(--el-fill-color-blank, #f8fafc);
  border: 1px solid var(--el-border-color-lighter, #f1f5f9);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
}

.stat-number-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  border-color: var(--el-color-primary-light-8, #bfdbfe);
}

.stat-num-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-num-label {
  font-size: 12px;
  color: var(--el-text-color-secondary, #94a3b8);
}

/* 快捷卡片模块 */
.shortcut-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.shortcut-item-card {
  background-color: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.shortcut-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: var(--el-color-primary, #3b82f6);
}

.shortcut-icon-bg {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.shortcut-icon {
  width: 20px;
  height: 20px;
}

/* 各种卡片色值背景 */
.shortcut-icon-bg.is-blue {
  background-color: #eff6ff;
  color: #3b82f6;
}

.shortcut-icon-bg.is-cyan {
  background-color: #ecfeff;
  color: #0891b2;
}

.shortcut-icon-bg.is-purple {
  background-color: #faf5ff;
  color: #9333ea;
}

.shortcut-icon-bg.is-orange {
  background-color: #fff7ed;
  color: #ea580c;
}

.shortcut-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shortcut-main-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
}

.shortcut-sub-title {
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
}

/* ========================================================
   6. 右侧 - 最近报告 Card
   ======================================================== */
.recent-reports-card .recent-card-body {
  padding: 12px 20px 20px 20px;
}

.header-link-btn {
  background: none;
  border: 1px solid var(--el-border-color, #cbd5e1);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular, #64748b);
  cursor: pointer;
  transition: all 0.2s;
}

.header-link-btn:hover {
  background-color: var(--el-fill-color-hover, #f1f5f9);
  color: var(--el-color-primary, #3b82f6);
  border-color: var(--el-color-primary, #3b82f6);
}

.custom-recent-table {
  font-size: 13px;
}

/* ========================================================
   10. Dialog 弹窗统一样式定制
   ======================================================== */
.personal-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px 10px 24px;
  text-align: left;
}

.personal-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
}

.personal-dialog :deep(.el-dialog__body) {
  padding: 10px 24px 20px 24px;
}

.dialog-form {
  text-align: left;
}

.dialog-input-icon {
  width: 15px;
  height: 15px;
  color: var(--el-text-color-placeholder, #9ca3af);
}

.captcha-input-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.get-captcha-btn {
  width: 120px;
  flex-shrink: 0;
}

.dialog-footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式媒体查询：屏幕较小时转为单栏布局 */
@media (max-width: 1024px) {
  .personal-grid {
    grid-template-columns: 1fr;
  }
}
</style>