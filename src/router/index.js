import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../store/modules/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue')
  },
  {
    path: '/',
    component: () => import('../layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/index.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'company',
        name: 'Company',
        component: () => import('../views/company/index.vue'),
        meta: { title: '公司管理' }
      },
      {
        path: 'template',
        name: 'Template',
        component: () => import('../views/template/index.vue'),
        meta: { title: '模板管理' }
      },
      {
        path: 'report/list',
        name: 'ReportList',
        component: () => import('../views/report/list.vue'),
        meta: { title: '报告列表' }
      },
      {
        path: 'report/query',
        name: 'ReportQuery',
        component: () => import('../views/report/query.vue'),
        meta: { title: '报告查询' }
      },
      {
        path: 'personal',
        name: 'Personal',
        component: () => import('../views/personal/index.vue'),
        meta: { title: '个人信息' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(), // 使用 Hash 路由，避免本地刷新报 404，部署更安全
  routes
})

// 全局路由导航守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const hasToken = userStore.token

  if (to.path === '/login') {
    // 已登录状态下访问登录页直接拦截并重定向回主面板
    if (hasToken) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    // 试图访问受保护的管理页时，若 Token 不存在则强制拦截至登录页
    if (hasToken) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
