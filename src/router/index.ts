import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'login', component: LoginView },
  { path: '/login', redirect: '/' },
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/confirmation', name: 'confirmation', component: () => import('../views/RspView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
