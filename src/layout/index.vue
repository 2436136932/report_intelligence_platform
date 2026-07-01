<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage, ElNotification } from 'element-plus'
import {
  LayoutDashboard,
  Building2,
  FileCode2,
  FolderLock,
  Search,
  Settings,
  RotateCw,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Monitor,
  Download,
  Upload
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 侧边栏折叠状态
const isCollapsed = ref(false)

// 报告管理子菜单的展开状态（默认展开）
const isReportExpanded = ref(true)

// 菜单树数据定义
const menuItems = [
  {
    path: '/dashboard',
    name: '仪表盘',
    icon: LayoutDashboard
  },
  {
    path: '/company',
    name: '公司管理',
    icon: Building2
  },
  {
    path: '/template',
    name: '模板管理',
    icon: FileCode2
  },
  {
    path: '/report',
    name: '报告管理',
    icon: FolderLock,
    hasSub: true,
    children: [
      { path: '/report/list', name: '报告列表', icon: FileText },
      { path: '/report/query', name: '报告查询', icon: Search }
    ]
  }
]

// 计算当前激活的菜单路径
const activePath = computed(() => route.path)

// 当前显示标题
const currentTitle = computed(() => {
  return route.meta?.title || '系统管理'
})

// 从 Pinia 仓库中获取真实用户名或使用 mock
const username = computed(() => {
  return userStore.userInfo?.username || 'admin'
})

// 折叠侧边栏开关
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 刷新当前页面
const refreshPage = () => {
  window.location.reload()
}

// 注销登录并重定向
const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// 触发报告管理二级菜单折叠
const toggleReportMenu = () => {
  if (isCollapsed.value) {
    isCollapsed.value = false // 如果主侧边栏是折叠状态，点击时先展开它
  }
  isReportExpanded.value = !isReportExpanded.value
}

// 搜索和命令面板状态
const isSearchOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

// 点击跳转快捷项定义
const searchItems = [
  { category: '跳转', name: '仪表盘', action: () => { router.push('/dashboard') } },
  { category: '跳转', name: '个人信息', action: () => { ElMessage.info('已进入个人信息页面（演示占位）') } },
  { category: '跳转', name: '公司管理', action: () => { router.push('/company') } },
  { category: '跳转', name: '模板管理', action: () => { router.push('/template') } },
  { category: '跳转', name: '报告列表', action: () => { router.push('/report/list') } },
  { category: '跳转', name: '报告查询', action: () => { router.push('/report/query') } },
  { category: '操作', name: '亮色主题', action: () => { ElMessage.success('已切换为清爽亮色主题') } },
  { category: '操作', name: '暗色主题', action: () => { ElMessage.success('已切换为科幻暗色主题') } },
  { category: '操作', name: '退出登录', action: () => { handleLogout() } }
]

// 过滤搜索内容
const filteredSearchItems = computed(() => {
  if (!searchQuery.value) return searchItems
  const query = searchQuery.value.trim().toLowerCase()
  return searchItems.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query)
  )
})

// 分组展示
const groupedSearchItems = computed(() => {
  const groups = {}
  filteredSearchItems.value.forEach(item => {
    if (!groups[item.category]) {
      groups[item.category] = []
    }
    groups[item.category].push(item)
  })
  return groups
})

// 运行指令动作
const executeAction = (item) => {
  item.action()
  isSearchOpen.value = false
  searchQuery.value = '' // 清空搜索输入框
}

const handleSearchEnter = () => {
  const allFiltered = filteredSearchItems.value
  if (allFiltered.length > 0) {
    executeAction(allFiltered[0])
  }
}

// 弹窗打开时聚焦输入框
watch(isSearchOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
})

// --- 系统配置抽屉状态 ---
const isConfigOpen = ref(false)
const configTab = ref('appearance')
const themeMode = ref('light')
const themeColor = ref('default')
const customColor = ref('#4E80EE')
const globalSize = ref('default')

// 视觉辅助项
const isGrayMode = ref(false)
const isColorWeakMode = ref(false)
const isWatermarkOpen = ref(false)

// 布局配置状态
const layoutMode = ref('classic') // 'classic', 'top', 'mixed', 'sidebar'
const isTagBarVisible = ref(true)
const pageTransition = ref('fade') // 'fade', 'slide', 'zoom', 'none'
const sidebarExpandedWidth = ref(256)
const sidebarCollapsedWidth = ref(80)
const menuItemHeight = ref(46)

// 页面切换动画选项
const transitionOptions = [
  { label: '淡入淡出', value: 'fade' },
  { label: '滑动', value: 'slide' },
  { label: '缩放', value: 'zoom' },
  { label: '无动画', value: 'none' }
]

// 布局模式选项
const layoutModes = [
  { key: 'classic', title: '经典布局', desc: '左侧导航，顶部标签栏' },
  { key: 'top', title: '顶部导航', desc: '水平导航栏布局' },
  { key: 'mixed', title: '混合布局', desc: '高级导航组合模式' },
  { key: 'sidebar', title: '侧栏常驻', desc: '二级菜单始终打开' }
]

// 13 种预设色板
const presetColors = [
  { key: 'default', name: '默认', hex: '#4E80EE' },
  { key: 'storm', name: '风暴蓝', hex: '#8BB5DE' },
  { key: 'forest', name: '森林绿', hex: '#A8C8A8' },
  { key: 'pink', name: '玫瑰粉', hex: '#D4A5A5' },
  { key: 'lavender', name: '薰衣草', hex: '#C8A8D8' },
  { key: 'yellow', name: '咸阳黄', hex: '#F0C674' },
  { key: 'silver', name: '月光银', hex: '#B8B8B8' },
  { key: 'orange', name: '珊瑚橙', hex: '#D8A8A8' },
  { key: 'cyan', name: '海湾青', hex: '#A8D8D8' },
  { key: 'lime', name: '橄榄绿', hex: '#C8C8A8' },
  { key: 'milktea', name: '奶茶红', hex: '#D8C8A8' },
  { key: 'purple', name: '梦幻紫', hex: '#A8A8D8' },
  { key: 'matcha', name: '抹茶绿', hex: '#C8D8A8' }
]

// 计算当前激活的色值十六进制码
const activeThemeHex = computed(() => {
  if (themeColor.value === 'custom') {
    return customColor.value
  }
  const color = presetColors.find(c => c.key === themeColor.value)
  return color ? color.hex : '#3b82f6'
})

// 水印 SVG 动态图样
const watermarkBg = computed(() => {
  const op = themeMode.value === 'dark' ? '0.05' : '0.1'// 暗色主题下水印透明度
  const username = userStore.userInfo?.username
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" opacity="${op}"><text x="30" y="110" font-size="18" font-family="system-ui, sans-serif" fill="#000000" transform="rotate(-25 30 110)">${username}</text></svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
})

// 改变全局 Primary 主题配色
const applyPrimaryColor = (colorHex) => {
  document.documentElement.style.setProperty('--el-color-primary', colorHex)
  document.documentElement.style.setProperty('--el-color-primary-light-3', `${colorHex}b3`)
  document.documentElement.style.setProperty('--el-color-primary-light-5', `${colorHex}80`)
  document.documentElement.style.setProperty('--el-color-primary-light-7', `${colorHex}4d`)
  document.documentElement.style.setProperty('--el-color-primary-light-9', `${colorHex}1a`)
}

// 选择预设主题色
const selectThemeColor = (color) => {
  themeColor.value = color.key
  applyPrimaryColor(color.hex)
  ElMessage.success('保存成功')
}

// 修改自定义色值
const handleCustomColorChange = (val) => {
  if (val) {
    themeColor.value = 'custom'
    applyPrimaryColor(val)
    ElMessage.success('保存成功')
  }
}

// 切换主题模式
const changeThemeMode = (mode) => {
  themeMode.value = mode
  if (mode === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else if (mode === 'light') {
    document.documentElement.classList.remove('dark-theme')
  } else {
    // 跟随系统配置自适应
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDark) {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  }
  ElMessage.success('保存成功')
}

// 顶部右侧主题切换小图标快捷切换
const toggleThemeQuick = () => {
  if (themeMode.value === 'dark') {
    changeThemeMode('light')
  } else {
    changeThemeMode('dark')
  }
}

// 灰色滤镜模式
const toggleGrayMode = (val) => {
  if (val) {
    document.documentElement.classList.add('gray-mode-active')
  } else {
    document.documentElement.classList.remove('gray-mode-active')
  }
}

// 色弱滤镜模式
const toggleColorWeakMode = (val) => {
  if (val) {
    document.documentElement.classList.add('color-weak-mode-active')
  } else {
    document.documentElement.classList.remove('color-weak-mode-active')
  }
}

// 重置全局配置至出厂默认
const resetConfig = () => {
  themeMode.value = 'light'
  themeColor.value = 'default'
  customColor.value = '#4E80EE'
  globalSize.value = 'default'
  isGrayMode.value = false
  isColorWeakMode.value = false
  isWatermarkOpen.value = false

  // 布局配置重置
  layoutMode.value = 'classic'
  isTagBarVisible.value = true
  pageTransition.value = 'fade'
  sidebarExpandedWidth.value = 256
  sidebarCollapsedWidth.value = 80
  menuItemHeight.value = 46

  document.documentElement.classList.remove('dark-theme')
  document.documentElement.classList.remove('gray-mode-active')
  document.documentElement.classList.remove('color-weak-mode-active')
  applyPrimaryColor('#4E80EE')

  ElMessage.success('已恢复系统默认配置')
}

// 监听主题色变化动态应用
watch(activeThemeHex, (newHex) => {
  applyPrimaryColor(newHex)
}, { immediate: true })

// 监听布局模式变化强制展开侧边栏（如果为侧栏常驻模式）
watch(layoutMode, (newMode) => {
  if (newMode === 'sidebar') {
    isCollapsed.value = false
  }
})

const isSidebarVisible = computed(() => {
  if (layoutMode.value === 'top') return false
  if (layoutMode.value === 'mixed') {
    return route.path.startsWith('/report')
  }
  return true
})

// 获取浏览器名称
const getBrowserName = () => {
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return 'Chrome'
}

// 获取屏幕分辨率
const screenResolution = computed(() => {
  return `${window.screen.width} × ${window.screen.height}`
})

// 导出配置为 JSON 文件
const exportConfig = () => {
  const configData = {
    themeMode: themeMode.value,
    themeColor: themeColor.value,
    customColor: customColor.value,
    globalSize: globalSize.value,
    isGrayMode: isGrayMode.value,
    isColorWeakMode: isColorWeakMode.value,
    isWatermarkOpen: isWatermarkOpen.value,
    layoutMode: layoutMode.value,
    isTagBarVisible: isTagBarVisible.value,
    pageTransition: pageTransition.value,
    sidebarExpandedWidth: sidebarExpandedWidth.value,
    sidebarCollapsedWidth: sidebarCollapsedWidth.value,
    menuItemHeight: menuItemHeight.value
  }
  
  const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `system-config-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('配置导出成功')
}

// 导入配置 JSON 文件
const importFileInputRef = ref(null)

const triggerImport = () => {
  importFileInputRef.value?.click()
}

const handleImportFile = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      
      // 更新状态并触发动态拦截
      if (data.themeMode !== undefined) {
        themeMode.value = data.themeMode
        changeThemeMode(data.themeMode)
      }
      if (data.themeColor !== undefined) themeColor.value = data.themeColor
      if (data.customColor !== undefined) {
        customColor.value = data.customColor
        if (themeColor.value === 'custom') {
          applyPrimaryColor(data.customColor)
        }
      }
      if (data.globalSize !== undefined) globalSize.value = data.globalSize
      if (data.isGrayMode !== undefined) {
        isGrayMode.value = data.isGrayMode
        toggleGrayMode(data.isGrayMode)
      }
      if (data.isColorWeakMode !== undefined) {
        isColorWeakMode.value = data.isColorWeakMode
        toggleColorWeakMode(data.isColorWeakMode)
      }
      if (data.isWatermarkOpen !== undefined) isWatermarkOpen.value = data.isWatermarkOpen
      if (data.layoutMode !== undefined) layoutMode.value = data.layoutMode
      if (data.isTagBarVisible !== undefined) isTagBarVisible.value = data.isTagBarVisible
      if (data.pageTransition !== undefined) pageTransition.value = data.pageTransition
      if (data.sidebarExpandedWidth !== undefined) sidebarExpandedWidth.value = data.sidebarExpandedWidth
      if (data.sidebarCollapsedWidth !== undefined) sidebarCollapsedWidth.value = data.sidebarCollapsedWidth
      if (data.menuItemHeight !== undefined) menuItemHeight.value = data.menuItemHeight
      
      ElMessage.success('配置导入成功')
    } catch (err) {
      ElMessage.error('配置文件解析失败，请检查格式')
    }
  }
  reader.readAsText(file)
  event.target.value = '' // 清空 input 状态
}
</script>

<template>
  <div :class="['layout-container', { 'size-large': globalSize === 'large', 'size-small': globalSize === 'small' }]"
       :style="{
         '--sidebar-expanded-width': `${sidebarExpandedWidth}px`,
         '--sidebar-collapsed-width': `${sidebarCollapsedWidth}px`,
         '--menu-item-height': `${menuItemHeight}px`
       }">

    <!-- 左侧导航侧边栏 -->
    <aside v-if="isSidebarVisible" :class="['sidebar', { 'is-collapsed': isCollapsed }]">
      <!-- 侧边栏顶部 LOGO 区 -->
      <div class="sidebar-logo">
        <div class="logo-circle">
          <FileText class="logo-icon" />
        </div>
        <span class="logo-text" v-show="!isCollapsed">报告管理系统</span>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-menu">
        <!-- 混合布局下的二级菜单展示 -->
        <template v-if="layoutMode === 'mixed'">
          <template v-if="activePath.startsWith('/report')">
            <router-link to="/report/list"
              :class="['menu-item', { 'is-active': activePath === '/report/list' }]">
              <FileText class="menu-icon" />
              <span class="menu-label" v-show="!isCollapsed">报告列表</span>
            </router-link>
            <router-link to="/report/query"
              :class="['menu-item', { 'is-active': activePath === '/report/query' }]">
              <Search class="menu-icon" />
              <span class="menu-label" v-show="!isCollapsed">报告查询</span>
            </router-link>
          </template>
        </template>

        <!-- 经典/常驻等其他布局模式的完整菜单展示 -->
        <template v-else>
          <template v-for="item in menuItems" :key="item.path">
            <!-- 1. 普通没有子菜单项 -->
            <router-link v-if="!item.hasSub" :to="item.path"
              :class="['menu-item', { 'is-active': activePath === item.path }]">
              <component :is="item.icon" class="menu-icon" />
              <span class="menu-label" v-show="!isCollapsed">{{ item.name }}</span>
            </router-link>

            <!-- 2. 带有折叠子菜单的管理菜单 -->
            <div v-else class="submenu-container">
              <div :class="['menu-item', 'submenu-header', { 'parent-active': activePath.startsWith('/report') }]"
                @click="toggleReportMenu">
                <component :is="item.icon" class="menu-icon" />
                <span class="menu-label" v-show="!isCollapsed">{{ item.name }}</span>
                <ChevronRight v-show="!isCollapsed" :class="['submenu-arrow', { 'is-expanded': isReportExpanded }]" />
              </div>
              <!-- 子菜单列表 -->
              <Transition name="submenu">
                <div v-show="isReportExpanded && !isCollapsed" class="submenu-list">
                  <router-link v-for="sub in item.children" :key="sub.path" :to="sub.path"
                    :class="['submenu-item', { 'is-sub-active': activePath === sub.path }]">
                    <component :is="sub.icon" class="submenu-icon" />
                    <span class="submenu-label">{{ sub.name }}</span>
                  </router-link>
                </div>
              </Transition>
            </div>
          </template>
        </template>
      </nav>

      <!-- 侧边栏底侧折叠按钮（侧栏常驻模式下隐藏折叠按钮） -->
      <div class="sidebar-footer" v-if="layoutMode !== 'sidebar'">
        <button class="collapse-btn" @click="toggleCollapse">
          <ChevronLeft v-if="!isCollapsed" class="btn-icon" />
          <ChevronRight v-else class="btn-icon" />
        </button>
      </div>
    </aside>

    <!-- 右侧主体内容容器 -->
    <section class="main-wrapper">

      <!-- 顶部 Header 工具栏 -->
      <header class="header-bar">
        <!-- 路由页面面包屑与标题 / 顶部菜单下的Logo -->
        <div class="header-left">
          <div class="top-nav-logo" v-if="layoutMode === 'top' || layoutMode === 'mixed'">
            <div class="logo-circle">
              <FileText class="logo-icon" />
            </div>
            <span class="logo-text">报告管理系统</span>
          </div>

          <template v-else>
            <div class="breadcrumbs font-sans" v-if="activePath.startsWith('/report')">
              <span class="parent-breadcrumb">报告管理</span>
              <span class="breadcrumb-separator">/</span>
              <span class="child-breadcrumb">{{ currentTitle }}</span>
            </div>
            <h2 v-else class="route-title">{{ currentTitle }}</h2>
          </template>
        </div>

        <!-- 顶部/混合布局模式下的水平主导航栏 -->
        <div v-if="layoutMode === 'top' || layoutMode === 'mixed'" class="top-horizontal-menu">
          <template v-if="layoutMode === 'top'">
            <template v-for="item in menuItems" :key="item.path">
              <!-- 无子菜单的项 -->
              <router-link v-if="!item.hasSub" :to="item.path"
                :class="['top-menu-item', { 'is-active': activePath === item.path }]">
                <component :is="item.icon" class="top-menu-icon" />
                <span>{{ item.name }}</span>
              </router-link>
              
              <!-- 带有下拉子菜单的项 -->
              <el-dropdown v-else trigger="click" class="top-menu-dropdown">
                <div :class="['top-menu-item', 'has-dropdown', { 'is-active': activePath.startsWith('/report') }]">
                  <component :is="item.icon" class="top-menu-icon" />
                  <span>{{ item.name }}</span>
                  <ChevronRight class="top-menu-arrow" />
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="sub in item.children" :key="sub.path" @click="router.push(sub.path)">
                      <div class="top-submenu-item" :class="{ 'is-active': activePath === sub.path }">
                        <component :is="sub.icon" class="top-submenu-icon" />
                        <span>{{ sub.name }}</span>
                      </div>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </template>

          <template v-else-if="layoutMode === 'mixed'">
            <div :class="['top-menu-item', { 'is-active': activePath === '/dashboard' }]" @click="router.push('/dashboard')">
              <LayoutDashboard class="top-menu-icon" />
              <span>首页</span>
            </div>
            <div :class="['top-menu-item', { 'is-active': activePath === '/company' }]" @click="router.push('/company')">
              <Building2 class="top-menu-icon" />
              <span>公司管理</span>
            </div>
            <div :class="['top-menu-item', { 'is-active': activePath === '/template' }]" @click="router.push('/template')">
              <FileCode2 class="top-menu-icon" />
              <span>模板管理</span>
            </div>
            <div :class="['top-menu-item', { 'is-active': activePath.startsWith('/report') }]" @click="router.push('/report/list')">
              <FolderLock class="top-menu-icon" />
              <span>报告管理</span>
            </div>
          </template>
        </div>

        <!-- 操作按钮及头像区 -->
        <div class="header-right">
          <button class="tool-btn" title="搜索" @click="isSearchOpen = true">
            <Search class="tool-icon" />
          </button>
          <button class="tool-btn" title="配置" @click="isConfigOpen = true">
            <Settings class="tool-icon" />
          </button>
          <button class="tool-btn" @click="refreshPage" title="刷新">
            <RotateCw class="tool-icon" />
          </button>
          <button class="tool-btn" title="主题模式" @click="toggleThemeQuick">
            <Sun v-if="themeMode === 'dark'" class="tool-icon" />
            <Moon v-else class="tool-icon" />
          </button>

          <el-dropdown trigger="click" @command="handleLogout">
            <div class="user-profile">
              <span class="user-avatar font-mono">{{ (userStore.userInfo?.username || 'A')[0].toUpperCase() }}</span>
              <span class="user-name">{{ userStore.userInfo?.username || userStore.userInfo?.name || '未登录' }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <span class="logout-item">
                    <LogOut class="logout-icon" />
                    安全退出
                  </span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 多页签 Tag 显示条 (支持显示与隐藏开关) -->
      <div class="tag-bar" v-if="isTagBarVisible">
        <router-link to="/dashboard" class="tag-item" :class="{ 'is-active': activePath === '/dashboard' }">
          首页
        </router-link>
        <div v-if="activePath === '/report/list'" class="tag-item is-active">
          报告列表 <span class="tag-close">×</span>
        </div>
        <div v-if="activePath === '/report/query'" class="tag-item is-active">
          报告查询 <span class="tag-close">×</span>
        </div>
      </div>

      <!-- 子视图内容展示窗口 (支持过渡切换动画配置) -->
      <main class="page-content">
        <el-config-provider :size="globalSize === 'default' ? 'default' : (globalSize === 'large' ? 'large' : 'small')">
          <router-view v-slot="{ Component }">
            <transition :name="pageTransition === 'none' ? '' : `transition-${pageTransition}`" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-config-provider>
      </main>

    </section>

    <!-- 快捷搜索与命令导航面板 Dialog -->
    <el-dialog v-model="isSearchOpen" title="" width="540px" :show-close="false" align-center
      class="search-dialog font-sans">
      <div class="search-dialog-content">
        <!-- 头部搜索输入框 -->
        <div class="search-input-wrapper">
          <input v-model="searchQuery" placeholder="请输入你需要快捷到达的功能" class="search-bar-input" ref="searchInputRef"
            @keyup.enter="handleSearchEnter" />
        </div>

        <!-- 下方过滤项展示列表 -->
        <div class="search-results-list">
          <div v-for="(items, category) in groupedSearchItems" :key="category" class="result-category-group">
            <h5 class="result-category-title">{{ category }}</h5>
            <div class="result-items-grid">
              <div v-for="item in items" :key="item.name" class="result-item-card" @click="executeAction(item)">
                <span class="result-item-text">{{ item.name }}</span>
              </div>
            </div>
          </div>
          <!-- 空状态 -->
          <div v-if="Object.keys(groupedSearchItems).length === 0" class="search-empty-state">
            没有找到与“{{ searchQuery }}”相关的功能或操作
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="search-dialog-footer">
          <button class="search-close-btn" @click="isSearchOpen = false">关闭</button>
        </div>
      </div>
    </el-dialog>

    <!-- 水印遮罩图层 -->
    <div v-if="isWatermarkOpen" class="watermark-overlay" :style="{ backgroundImage: watermarkBg }"></div>

    <!-- 系统配置抽屉组件 -->
    <el-drawer v-model="isConfigOpen" title="系统配置" size="500px" class="config-drawer font-sans" :with-header="false"
      append-to-body>
      <div class="config-drawer-container">
        <!-- 抽屉头部，含标题与重置配置 -->
        <header class="config-drawer-header">
          <h3 class="config-drawer-title">系统配置</h3>
          <button class="reset-config-btn" @click="resetConfig">重置配置</button>
        </header>

        <!-- 三页签导航切换 -->
        <div class="config-tabs-nav">
          <div class="tabs-nav-bar">
            <button :class="['tab-nav-item', { 'is-active': configTab === 'appearance' }]"
              @click="configTab = 'appearance'">
              外观
            </button>
            <button :class="['tab-nav-item', { 'is-active': configTab === 'layout' }]" @click="configTab = 'layout'">
              布局
            </button>
            <button :class="['tab-nav-item', { 'is-active': configTab === 'general' }]" @click="configTab = 'general'">
              通用
            </button>
          </div>
        </div>

        <!-- 选项配置核心展示面板 -->
        <div class="config-drawer-body">
          <div v-if="configTab === 'appearance'" class="appearance-config-panel">

            <!-- 1. 主题模式 -->
            <div class="config-section">
              <h4 class="config-section-title">主题模式</h4>
              <div class="theme-mode-selector">
                <button :class="['theme-mode-btn', { 'is-active': themeMode === 'light' }]"
                  @click="changeThemeMode('light')">
                  <Sun class="mode-icon" />
                  亮色
                </button>
                <button :class="['theme-mode-btn', { 'is-active': themeMode === 'dark' }]"
                  @click="changeThemeMode('dark')">
                  <Moon class="mode-icon" />
                  暗色
                </button>
                <button :class="['theme-mode-btn', { 'is-active': themeMode === 'system' }]"
                  @click="changeThemeMode('system')">
                  <Monitor class="mode-icon" />
                  跟随系统
                </button>
              </div>
            </div>

            <!-- 2. 主题颜色 -->
            <div class="config-section">
              <h4 class="config-section-title">主题颜色</h4>
              <div class="color-preset-grid">
                <div v-for="color in presetColors" :key="color.key"
                  :class="['color-preset-item', { 'is-active': themeColor === color.key }]"
                  @click="selectThemeColor(color)">
                  <span class="color-dot-indicator" :style="{ backgroundColor: color.hex }">
                    <span v-if="themeColor === color.key" class="check-mark">✓</span>
                  </span>
                  <span class="color-label-text">{{ color.name }}</span>
                </div>
              </div>

              <!-- 自定义颜色拾色器 -->
              <div class="custom-color-picker-row">
                <div class="picker-label-group">
                  <span class="picker-main-label">自定义颜色</span>
                  <span class="picker-sub-label">选择任意颜色作为主题色</span>
                </div>
                <el-color-picker v-model="customColor" @change="handleCustomColorChange" size="default" />
              </div>

              <!-- 当前颜色状态 -->
              <div class="current-color-status">
                <span class="status-label">当前主题色</span>
                <div class="status-val-group">
                  <span class="color-block-preview" :style="{ backgroundColor: activeThemeHex }"></span>
                  <span class="color-hex-text font-mono">{{ activeThemeHex.toUpperCase() }}</span>
                </div>
              </div>
            </div>

            <!-- 3. 全局尺寸 -->
            <div class="config-section">
              <h4 class="config-section-title">全局尺寸</h4>
              <div class="setting-form-row">
                <div class="setting-label-group">
                  <span class="setting-main-label">全局尺寸</span>
                  <span class="setting-sub-label">设置全局组件尺寸</span>
                </div>
                <el-select v-model="globalSize" style="width: 140px">
                  <el-option label="默认就好了" value="default" />
                  <el-option label="大点好" value="large" />
                  <el-option label="小的也不错" value="small" />
                </el-select>
              </div>
            </div>

            <!-- 4. 视觉辅助 -->
            <div class="config-section">
              <h4 class="config-section-title">视觉辅助</h4>

              <div class="switch-setting-item">
                <div class="switch-label-group">
                  <span class="switch-main-label">灰色模式</span>
                  <span class="switch-sub-label">降低页面色彩饱和度</span>
                </div>
                <el-switch v-model="isGrayMode" @change="toggleGrayMode" />
              </div>

              <div class="switch-setting-item">
                <div class="switch-label-group">
                  <span class="switch-main-label">色弱模式</span>
                  <span class="switch-sub-label">优化页面色彩对比度</span>
                </div>
                <el-switch v-model="isColorWeakMode" @change="toggleColorWeakMode" />
              </div>

              <div class="switch-setting-item">
                <div class="switch-label-group">
                  <span class="switch-main-label">显示水印</span>
                  <span class="switch-sub-label">在页面中显示防伪水印</span>
                </div>
                <el-switch v-model="isWatermarkOpen" />
              </div>
            </div>

          </div>

          <div v-else-if="configTab === 'layout'" class="layout-config-panel">
            <!-- 布局模式 -->
            <div class="config-section">
              <h4 class="config-section-title">布局模式</h4>
              <div class="layout-mode-grid">
                <div v-for="item in layoutModes" :key="item.key" 
                     :class="['layout-mode-card', { 'is-active': layoutMode === item.key }]"
                     @click="layoutMode = item.key">
                  <div class="layout-icon-wrapper">
                    <!-- 动态CSS绘制的极简布局图标 -->
                    <div class="mini-sidebar" :class="{ 'is-dark': item.key === 'classic' || item.key === 'sidebar', 'is-light': item.key === 'top', 'is-mixed': item.key === 'mixed' }"></div>
                    <div class="mini-header" :class="{ 'is-dark': item.key === 'top' }"></div>
                    <div class="mini-content" :class="{ 'left-0': item.key === 'top', 'left-24': item.key === 'mixed' }">
                      <div class="mini-line w-full"></div>
                      <div class="mini-line w-half"></div>
                    </div>
                  </div>
                  <div class="layout-mode-title">{{ item.title }}</div>
                  <div class="layout-mode-desc">{{ item.desc }}</div>
                </div>
              </div>
            </div>

            <el-divider />

            <!-- 界面配置 -->
            <div class="config-section">
              <h4 class="config-section-title">界面配置</h4>
              
              <div class="switch-setting-item">
                <div class="switch-label-group">
                  <span class="switch-main-label">显示标签页</span>
                  <span class="switch-sub-label">页面标签导航</span>
                </div>
                <el-switch v-model="isTagBarVisible" />
              </div>

              <div class="setting-form-row">
                <div class="setting-label-group">
                  <span class="setting-main-label">页面切换动画</span>
                  <span class="setting-sub-label">页面切换效果</span>
                </div>
                <el-select v-model="pageTransition" style="width: 120px">
                  <el-option v-for="opt in transitionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </div>
            </div>

            <el-divider />

            <!-- 尺寸配置 -->
            <div class="config-section">
              <h4 class="config-section-title">尺寸配置</h4>
              
              <div class="setting-form-row">
                <div class="setting-label-group">
                  <span class="setting-main-label">侧边栏展开宽度</span>
                  <span class="setting-sub-label">侧边栏完全展开时的宽度</span>
                </div>
                <div class="num-input-with-suffix">
                  <el-input-number v-model="sidebarExpandedWidth" :min="180" :max="320" :step="1" style="width: 100px" controls-position="right" />
                  <span class="px-suffix">px</span>
                </div>
              </div>

              <div class="setting-form-row">
                <div class="setting-label-group">
                  <span class="setting-main-label">侧边栏收缩宽度</span>
                  <span class="setting-sub-label">侧边栏收缩时的最小宽度</span>
                </div>
                <div class="num-input-with-suffix">
                  <el-input-number v-model="sidebarCollapsedWidth" :min="40" :max="100" :step="1" style="width: 100px" controls-position="right" />
                  <span class="px-suffix">px</span>
                </div>
              </div>

              <div class="setting-form-row">
                <div class="setting-label-group">
                  <span class="setting-main-label">菜单项高度</span>
                  <span class="setting-sub-label">侧边栏菜单项的高度</span>
                </div>
                <div class="num-input-with-suffix">
                  <el-input-number v-model="menuItemHeight" :min="32" :max="64" :step="1" style="width: 100px" controls-position="right" />
                  <span class="px-suffix">px</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 通用配置模块 -->
          <div v-else-if="configTab === 'general'" class="general-config-panel">
            <!-- 系统信息 -->
            <div class="config-section">
              <h4 class="config-section-title">系统信息</h4>
              <table class="info-table">
                <tr>
                  <td class="info-label">版本</td>
                  <td class="info-value">v2.7.4</td>
                  <td class="info-label">前端框架</td>
                  <td class="info-value">Vue 3</td>
                </tr>
                <tr>
                  <td class="info-label">UI组件库</td>
                  <td class="info-value">Element Plus</td>
                  <td class="info-label">构建工具</td>
                  <td class="info-value">Vite</td>
                </tr>
                <tr>
                  <td class="info-label">浏览器</td>
                  <td class="info-value">{{ getBrowserName() }}</td>
                  <td class="info-label">屏幕分辨率</td>
                  <td class="info-value">{{ screenResolution }}</td>
                </tr>
              </table>
            </div>

            <el-divider />

            <!-- 配置管理 -->
            <div class="config-section">
              <h4 class="config-section-title">配置管理</h4>
              <div class="management-cards-stack">
                
                <!-- 重置配置 -->
                <div class="mgmt-card">
                  <div class="mgmt-icon-box reset-icon-box">
                    <RotateCw class="mgmt-icon" />
                  </div>
                  <div class="mgmt-text-box">
                    <div class="mgmt-card-title">重置配置</div>
                    <div class="mgmt-card-desc">将所有设置恢复为默认值</div>
                  </div>
                  <el-button type="danger" plain size="small" @click="resetConfig" class="mgmt-btn">重置配置</el-button>
                </div>

                <!-- 导出配置 -->
                <div class="mgmt-card">
                  <div class="mgmt-icon-box export-icon-box">
                    <Download class="mgmt-icon" />
                  </div>
                  <div class="mgmt-text-box">
                    <div class="mgmt-card-title">导出配置</div>
                    <div class="mgmt-card-desc">导出当前配置为 JSON 文件</div>
                  </div>
                  <el-button type="primary" plain size="small" @click="exportConfig" class="mgmt-btn">导出配置</el-button>
                </div>

                <!-- 导入配置 -->
                <div class="mgmt-card">
                  <div class="mgmt-icon-box import-icon-box">
                    <Upload class="mgmt-icon" />
                  </div>
                  <div class="mgmt-text-box">
                    <div class="mgmt-card-title">导入配置</div>
                    <div class="mgmt-card-desc">从 JSON 文件导入配置</div>
                  </div>
                  <el-button type="success" plain size="small" @click="triggerImport" class="mgmt-btn">导入配置</el-button>
                  <input type="file" ref="importFileInputRef" style="display: none" accept=".json" @change="handleImportFile" />
                </div>

              </div>
            </div>
          </div>

          <!-- 通用空模板展示 -->
          <div v-else class="empty-tab-content">
            <p class="tab-tip-text">该配置项正在开发中，请使用“外观”选项卡定制系统参数。</p>
          </div>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f8fafc;
  overflow: hidden;
}

/* ----------------- Sidebar 导航栏样式 ----------------- */
.sidebar {
  width: var(--sidebar-expanded-width, 256px);
  background-color: var(--el-bg-color, #ffffff);
  border-right: 1px solid var(--el-border-color-light, #e2e8f0);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  z-index: 100;
}

.sidebar.is-collapsed {
  width: var(--sidebar-collapsed-width, 80px);
}

.sidebar-logo {
  height: 60px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e2e8f0;
  overflow: hidden;
}

.logo-circle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: url('./src/assets/images/logo.png') no-repeat center center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-icon {
  width: 18px;
  height: 18px;
  color: #ffffff;
}

.logo-text {
  font-size: 15px;
  font-weight: bold;
  color: #1e293b;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.menu-item {
  height: var(--menu-item-height, 46px);
  padding: 0 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #57606a;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.menu-item:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.menu-item.is-active {
  background-color: var(--el-color-primary);
  color: #ffffff;
}

/* 父菜单激活高亮样式（不带底色，仅高亮文字） */
.menu-item.parent-active {
  color: var(--el-color-primary);
}

.menu-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
}

.submenu-arrow {
  width: 16px;
  height: 16px;
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.submenu-arrow.is-expanded {
  transform: rotate(90deg);
}

.parent-active .submenu-arrow {
  color: var(--el-color-primary);
}

/* 子菜单列表样式 */
.submenu-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.submenu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  padding-left: 20px;
  /* 缩进 */
}

.submenu-item {
  height: calc(var(--menu-item-height, 46px) - 8px);
  padding: 0 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: #f8fafc;
  color: #1e293b;
}

.submenu-item.is-sub-active {
  background-color: var(--el-color-primary);
  color: #ffffff;
}

.submenu-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #64748b;
  transition: color 0.2s;
}

.submenu-item.is-sub-active .submenu-icon {
  color: #ffffff;
}

.submenu-item:hover .submenu-icon {
  color: #1e293b;
}

/* 子菜单展开/收起动画 */
.submenu-enter-active,
.submenu-leave-active {
  overflow: hidden;
  transition: all 0.3s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 100px;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: background-color 0.2s;
}

.collapse-btn:hover {
  background-color: #f1f5f9;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ----------------- 右侧主面板 Wrapper 样式 ----------------- */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

/* 顶部 HeaderBar */
.header-bar {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.route-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

/* 面包屑导航样式 */
.header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.breadcrumbs {
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.parent-breadcrumb {
  color: #64748b;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.child-breadcrumb {
  color: #0f172a;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tool-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tool-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.tool-icon {
  width: 18px;
  height: 18px;
}

/* 用户 Profile 下拉选项 */
.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-profile:hover {
  background-color: #f1f5f9;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #dbeafe;
  color: #1e40af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  box-shadow: inset 0 0 4px rgba(30, 64, 175, 0.1);
}

.user-name {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.logout-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
}

.logout-icon {
  width: 16px;
  height: 16px;
}

/* 多页签 TagBar */
.tag-bar {
  height: 40px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tag-item {
  height: 28px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.tag-item:hover {
  background-color: #f8fafc;
}

.tag-item.is-active {
  border-color: var(--el-color-primary-light-7);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.tag-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-size: 10px;
  transition: all 0.2s;
  margin-left: 2px;
}

.tag-close:hover {
  background-color: #cbd5e1;
  color: #0f172a;
}

.tag-item.is-active .tag-close:hover {
  background-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

/* 主内容渲染容器 */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
}

/* ----------------- 快捷指令搜索面板样式 ----------------- */
:deep(.search-dialog) {
  border-radius: 12px;
  overflow: hidden;
  padding: 0 !important;
}

:deep(.search-dialog .el-dialog__header) {
  display: none !important;
}

:deep(.search-dialog .el-dialog__body) {
  padding: 0 !important;
}

.search-dialog-content {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.search-input-wrapper {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.search-bar-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
  color: #0f172a;
  font-weight: 500;
  font-family: inherit;
}

.search-bar-input::placeholder {
  color: #94a3b8;
}

.search-results-list {
  max-height: 360px;
  overflow-y: auto;
  padding: 16px 24px;
  box-sizing: border-box;
}

.result-category-group {
  margin-bottom: 16px;
  text-align: left;
}

.result-category-group:last-child {
  margin-bottom: 0;
}

.result-category-title {
  margin: 0 0 8px 0;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-items-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-item-card {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  display: flex;
  align-items: center;
}

.result-item-card:hover {
  background-color: #f1f5f9;
}

.result-item-text {
  font-size: 13.5px;
  color: #334155;
  font-weight: 500;
  transition: color 0.15s ease;
}

.result-item-card:hover .result-item-text {
  color: var(--el-color-primary);
}

.search-empty-state {
  padding: 32px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.search-dialog-footer {
  padding: 12px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  background-color: #f8fafc;
}

.search-close-btn {
  padding: 6px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #ffffff;
  font-size: 12.5px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.search-close-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

/* ----------------- 系统配置抽屉样式 ----------------- */
:deep(.config-drawer) {
  padding: 0 !important;
}

:deep(.config-drawer .el-drawer__body) {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.config-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.config-drawer-header {
  padding: 24px 24px 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-light);
}

.config-drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.reset-config-btn {
  padding: 6px 14px;
  background-color: var(--el-color-primary);
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-config-btn:hover {
  background-color: var(--el-color-primary-light-3);
}

/* 导航选项卡 */
.config-tabs-nav {
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.tabs-nav-bar {
  display: flex;
  background-color: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
}

.dark-theme .tabs-nav-bar {
  background-color: #0c1524;
}

.tab-nav-item {
  flex: 1;
  border: none;
  background: none;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-nav-item.is-active {
  background-color: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark-theme .tab-nav-item.is-active {
  background-color: #1e293b;
  color: #38bdf8;
}

/* ----------------- 布局配置面板样式 ----------------- */
.layout-config-panel {
  display: flex;
  flex-direction: column;
}

.layout-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 12px;
}

.layout-mode-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  background-color: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.2s;
}

.layout-mode-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.layout-mode-card.is-active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.layout-icon-wrapper {
  position: relative;
  height: 64px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light, #f1f5f9);
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  margin-bottom: 8px;
  overflow: hidden;
}

.layout-mode-card.is-active .layout-icon-wrapper {
  border-color: var(--el-color-primary-light-5);
}

.mini-sidebar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 16px;
  background-color: var(--el-bg-color, #ffffff);
  border-right: 1px solid var(--el-border-color-light, #e2e8f0);
  z-index: 10;
}
.mini-sidebar.is-dark {
  background-color: var(--el-color-primary);
  border-right-color: var(--el-color-primary);
}
.mini-sidebar.is-light {
  display: none;
}
.mini-sidebar.is-mixed {
  width: 24px;
  background-color: var(--el-bg-color, #ffffff);
  border-right: 1px solid var(--el-border-color-light, #e2e8f0);
}
.mini-sidebar.is-mixed::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  background-color: var(--el-color-primary);
}

.mini-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  background-color: var(--el-bg-color, #ffffff);
  border-bottom: 1px solid var(--el-border-color-light, #e2e8f0);
  z-index: 5;
}
.mini-header.is-dark {
  background-color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}

.mini-content {
  position: absolute;
  top: 10px;
  left: 16px;
  right: 0;
  bottom: 0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mini-content.left-0 {
  left: 0;
}
.mini-content.left-24 {
  left: 24px;
}

.mini-line {
  height: 4px;
  border-radius: 2px;
  background-color: var(--el-border-color, #e2e8f0);
}
.mini-line.w-full {
  width: 100%;
}
.mini-line.w-half {
  width: 60%;
}

.layout-mode-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.layout-mode-card.is-active .layout-mode-title {
  color: var(--el-color-primary);
}

.layout-mode-desc {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.num-input-with-suffix {
  display: flex;
  align-items: center;
  gap: 8px;
}
.px-suffix {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* 混合布局空菜单提示 */
.mixed-empty-menu {
  padding: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* ----------------- 顶部水平导航栏 ----------------- */
.top-horizontal-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 24px;
}

.top-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border-radius: 6px;
  text-decoration: none;
  color: #57606a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.top-menu-item:hover {
  background-color: var(--el-fill-color-light, #f1f5f9);
  color: var(--el-text-color-primary, #1e293b);
}

.top-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.top-menu-icon {
  width: 18px;
  height: 18px;
}

.top-menu-arrow {
  width: 14px;
  height: 14px;
  margin-left: 4px;
  transform: rotate(90deg);
  color: #94a3b8;
}

.top-submenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  color: #57606a;
  font-size: 13px;
  font-weight: 500;
}
.top-submenu-item.is-active {
  color: var(--el-color-primary);
}
.top-submenu-icon {
  width: 16px;
  height: 16px;
}

.top-nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 12px;
}

/* ----------------- 页面切换过渡动画 ----------------- */
.transition-fade-enter-active,
.transition-fade-leave-active {
  transition: opacity 0.2s ease;
}
.transition-fade-enter-from,
.transition-fade-leave-to {
  opacity: 0;
}

.transition-slide-enter-active,
.transition-slide-leave-active {
  transition: all 0.25s ease;
}
.transition-slide-enter-from {
  opacity: 0;
  transform: translateX(-15px);
}
.transition-slide-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

.transition-zoom-enter-active,
.transition-zoom-leave-active {
  transition: all 0.2s ease;
}
.transition-zoom-enter-from {
  opacity: 0;
  transform: scale(0.97);
}
.transition-zoom-leave-to {
  opacity: 0;
  transform: scale(1.03);
}

/* 抽屉滚动内容 */
.config-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.appearance-config-panel {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.config-section-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 8px;
}

/* 主题模式三态选择 */
.theme-mode-selector {
  display: flex;
  gap: 12px;
}

.theme-mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  font-family: inherit;
}

.theme-mode-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.theme-mode-btn.is-active {
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  color: #ffffff !important;
}

.mode-icon {
  width: 18px;
  height: 18px;
}

/* 主题预设颜色网格 */
.color-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.color-preset-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-preset-item:hover {
  border-color: var(--el-color-primary);
}

.color-preset-item.is-active {
  border-color: var(--el-color-primary);
  background-color: var(--el-bg-color-overlay);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.color-dot-indicator {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 11px;
  font-weight: bold;
}

.color-label-text {
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

/* 自定义拾色器行 */
.custom-color-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.picker-label-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.picker-main-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.picker-sub-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* 当前颜色状态 */
.current-color-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.status-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.status-val-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-block-preview {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.color-hex-text {
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  font-weight: 600;
}

/* 表单单行设置项 */
.setting-form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.setting-label-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-main-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.setting-sub-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* 开关设置项 */
.switch-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.switch-label-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.switch-main-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.switch-sub-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* ----------------- 通用配置面板样式 ----------------- */
.general-config-panel {
  display: flex;
  flex-direction: column;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 13px;
}

.info-table td {
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  padding: 10px 12px;
  text-align: left;
}

.info-label {
  background-color: var(--el-fill-color-light, #f8fafc);
  color: var(--el-text-color-regular, #64748b);
  width: 20%;
  font-weight: 500;
}

.info-value {
  background-color: var(--el-bg-color, #ffffff);
  color: var(--el-text-color-primary, #0f172a);
  width: 30%;
}

.management-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.mgmt-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  background-color: var(--el-bg-color);
  transition: all 0.2s;
}

.mgmt-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.mgmt-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 16px;
}

.reset-icon-box {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
}
.reset-icon-box .mgmt-icon {
  color: #ef4444;
}

.export-icon-box {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
}
.export-icon-box .mgmt-icon {
  color: #3b82f6;
}

.import-icon-box {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.import-icon-box .mgmt-icon {
  color: #22c55e;
}

.mgmt-icon {
  width: 20px;
  height: 20px;
}

.mgmt-text-box {
  flex: 1;
  text-align: left;
}

.mgmt-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mgmt-card-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.mgmt-btn {
  flex-shrink: 0;
}

.empty-tab-content {
  padding: 60px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.tab-tip-text {
  font-size: 13px;
  line-height: 1.6;
  max-width: 240px;
  margin: 0 auto;
}

/* 水印叠加层 */
.watermark-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99999;
}

/* ----------------- 全局尺寸缩放响应式微调 ----------------- */
.size-large .menu-item {
  height: 50px;
  font-size: 15px;
}

.size-large .submenu-item {
  height: 44px;
  font-size: 14px;
}

.size-large .header-bar {
  height: 68px;
}

.size-large .tag-bar {
  height: 46px;
}

.size-large .tag-item {
  height: 32px;
  font-size: 13px;
}

.size-small .menu-item {
  height: 38px;
  font-size: 13px;
}

.size-small .submenu-item {
  height: 32px;
  font-size: 12px;
}

.size-small .header-bar {
  height: 52px;
}

.size-small .tag-bar {
  height: 34px;
}

.size-small .tag-item {
  height: 24px;
  font-size: 11px;
}
</style>
