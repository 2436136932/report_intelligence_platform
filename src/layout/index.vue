<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
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
  FileText
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
</script>

<template>
  <div class="layout-container">

    <!-- 左侧导航侧边栏 -->
    <aside :class="['sidebar', { 'is-collapsed': isCollapsed }]">
      <!-- 侧边栏顶部 LOGO 区 -->
      <div class="sidebar-logo">
        <div class="logo-circle">
          <FileText class="logo-icon" />
        </div>
        <span class="logo-text" v-show="!isCollapsed">报告管理系统</span>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-menu">
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
      </nav>

      <!-- 侧边栏底侧折叠按钮 -->
      <div class="sidebar-footer">
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
        <!-- 路由页面面包屑与标题 -->
        <div class="header-left">
          <div class="breadcrumbs font-sans" v-if="activePath.startsWith('/report')">
            <span class="parent-breadcrumb">报告管理</span>
            <span class="breadcrumb-separator">/</span>
            <span class="child-breadcrumb">{{ currentTitle }}</span>
          </div>
          <h2 v-else class="route-title">{{ currentTitle }}</h2>
        </div>

        <!-- 操作按钮及头像区 -->
        <div class="header-right">
          <button class="tool-btn" title="搜索">
            <Search class="tool-icon" />
          </button>
          <button class="tool-btn" title="配置">
            <Settings class="tool-icon" />
          </button>
          <button class="tool-btn" @click="refreshPage" title="刷新">
            <RotateCw class="tool-icon" />
          </button>
          <button class="tool-btn" title="暗色模式">
            <Moon class="tool-icon" />
          </button>

          <el-dropdown trigger="click" @command="handleLogout">
            <div class="user-profile">
              <span class="user-avatar font-mono">{{ userStore.userInfo?.username[0].toUpperCase() }}</span>
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

      <!-- 多页签 Tag 显示条 -->
      <div class="tag-bar">
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

      <!-- 子视图内容展示窗口 -->
      <main class="page-content">
        <router-view />
      </main>

    </section>

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
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  z-index: 100;
}

.sidebar.is-collapsed {
  width: 64px;
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
  height: 44px;
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
  background-color: #3b82f6;
  color: #ffffff;
}

/* 父菜单激活高亮样式（不带底色，仅高亮文字） */
.menu-item.parent-active {
  color: #3b82f6;
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
  color: #3b82f6;
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
  height: 38px;
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
  background-color: #3b82f6;
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
  border-color: #dbeafe;
  background-color: #eff6ff;
  color: #3b82f6;
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
  background-color: #bfdbfe;
  color: #1d4ed8;
}

/* 主内容渲染容器 */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
}
</style>
